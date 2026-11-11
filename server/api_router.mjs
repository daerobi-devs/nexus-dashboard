import {
  getDashboardState,
  createWallet,
  transferBetweenWallets,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createInvoice,
  markInvoicePaid,
  deleteInvoice,
  createTask,
  updateTaskStatus,
  updateTaskDetails,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  runAutoPriorityEngine,
  createMaintenance,
  updateMaintenanceStatus,
  deleteMaintenance,
  pingMaintenanceServer,
  createHostingDomain,
  updateHostingDomain,
  deleteHostingDomain,
  createCrmClient,
  updateCrmClient,
  deleteCrmClient,
  createCrmDeal,
  updateCrmDealStage,
  convertDealToProjectAndInvoice,
  deleteCrmDeal,
  createAcademicCourse,
  updateAcademicCourse,
  deleteAcademicCourse,
  incrementCourseAttendance,
  saveMentariSyncData,
  createPersonalHabit,
  togglePersonalHabit,
  updatePersonalGoalProgress,
  createFocusSession,
  deleteFocusSession,
  createCyclingLog,
  deleteCyclingLog,
  createJokiOrder,
  updateJokiOrder,
  markJokiOrderPaid,
  deleteJokiOrder,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
  getPublicInvoiceById,
  submitPaymentProof,
  settlePayment,
  getUpcomingDeadlines,
  updateSetting,
  restoreDatabaseSnapshot,
} from './db.mjs';
import {
  ensurePostgresDatabaseAndSync,
  syncAllTablesToPostgres,
  pullFromPostgresToSqlite,
  getPostgresStatus,
} from './pg_sync.mjs';
import {
  syncCoolifyResources,
  triggerCoolifyResourceAction,
  createCoolifyResource,
  createSmartDocument,
  buildDocxBufferForDocument,
  deleteGeneratedDocument,
} from './power_features.mjs';
import {
  uploadAssetToStorage,
  getStorageAssetsState,
  deleteAssetFromStorage,
  getAssetObject,
} from './storage_s3.mjs';
import {
  getAvailableGoogleAccounts,
  syncGoogleWorkspace,
  createGoogleDocForTask,
  askNexusAi,
  clearAiChatHistory,
  fetchAvailableGeminiModels,
  connectTelegramBot,
  disconnectTelegramBot,
  getTelegramStatus,
  sendTelegramNotification,
  sendDeadlineAlertToTelegram,
  sendMentariPendingForumTelegramNotification,
} from './integrations.mjs';

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Format data JSON tidak valid.'));
      }
    });
    req.on('error', reject);
  });
}

export function buildPayload(db) {
  return {
    ...getDashboardState(db),
    upcomingDeadlines: getUpcomingDeadlines(db, 4),
    googleAccounts: getAvailableGoogleAccounts(),
    telegramStatus: getTelegramStatus(db),
    postgresStatus: getPostgresStatus(),
  };
}

export async function handleApiRequest(req, res, db) {
  if (!req.url || !req.url.startsWith('/api/')) {
    return false;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const url = new URL(req.url, 'http://localhost');

  // Background sync to PostgreSQL homedb after any non-GET mutation
  if (req.method !== 'GET') {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        syncAllTablesToPostgres(db).catch(() => {});
      }
    });
  }

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          service: 'nexus-command-center',
          postgres: getPostgresStatus().connected,
        })
      );
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/state') {
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/public-invoice') {
      const id = url.searchParams.get('id') || '';
      const pubInv = getPublicInvoiceById(db, id);
      if (!pubInv) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Invoice atau Kwitansi tidak ditemukan.' }));
        return true;
      }
      res.statusCode = 200;
      res.end(JSON.stringify(pubInv));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/public-invoice/confirm') {
      const body = await readJsonBody(req);
      const updated = submitPaymentProof(db, body.id, body.payer_name, body.proof_data, body.payer_account);
      const tgMsg =
        `[BUATIN x NEXUS - NOTIFIKASI BAYAR]\n` +
        `Pelanggan telah mengonfirmasi pembayaran invoice!\n` +
        `No Kwitansi : ${updated.receipt_number || updated.id}\n` +
        `Klien       : ${updated.client_name}\n` +
        `Proyek      : ${updated.project_title}\n` +
        `Nominal     : Rp ${Number(updated.amount).toLocaleString('id-ID')}\n` +
        `Pengirim    : ${body.payer_name} (${body.payer_account || '-'})\n` +
        `Status      : Menunggu verifikasi settlement di dashboard.`;
      await sendTelegramNotification(db, tgMsg);
      ensurePostgresDatabaseAndSync(db).catch(() => {});
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, invoice: updated, state: buildPayload(db) }));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/settle') {
      const body = await readJsonBody(req);
      try {
        const updated = settlePayment(db, body.type, body.id, body.wallet_id, body.amount);
        ensurePostgresDatabaseAndSync(db).catch(() => {});
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, updated, state: buildPayload(db) }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: err?.message || 'Gagal menyelesaikan pelunasan.' }));
      }
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/postgres/sync') {
      const body = await readJsonBody(req);
      let status;
      if (body.action === 'pull') {
        status = await pullFromPostgresToSqlite(db);
      } else {
        status = await ensurePostgresDatabaseAndSync(db);
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ status, state: buildPayload(db) }));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/wallets') {
      const body = await readJsonBody(req);
      createWallet(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/wallets') {
      const body = await readJsonBody(req);
      transferBetweenWallets(db, body.from_wallet_id, body.to_wallet_id, body.amount, body.notes);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/transactions') {
      const body = await readJsonBody(req);
      createTransaction(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/transactions') {
      const body = await readJsonBody(req);
      updateTransaction(db, body.id, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/transactions') {
      const id = url.searchParams.get('id');
      if (id) deleteTransaction(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/invoices') {
      const body = await readJsonBody(req);
      createInvoice(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/invoices') {
      const body = await readJsonBody(req);
      markInvoicePaid(db, body.id, body.wallet_id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/invoices') {
      const id = url.searchParams.get('id');
      if (id) deleteInvoice(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/tasks') {
      const body = await readJsonBody(req);
      createTask(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/tasks') {
      const body = await readJsonBody(req);
      updateTaskStatus(db, body.id, body.status);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/tasks') {
      const body = await readJsonBody(req);
      if (body.runAutoPriority) {
        runAutoPriorityEngine(db);
      } else {
        updateTaskDetails(db, body.id, body);
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/tasks') {
      const id = url.searchParams.get('id');
      if (id) deleteTask(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/subtasks') {
      const body = await readJsonBody(req);
      addSubtask(db, body.task_id, body.title);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/subtasks') {
      const body = await readJsonBody(req);
      toggleSubtask(db, body.id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/subtasks') {
      const id = url.searchParams.get('id');
      if (id) deleteSubtask(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/maintenance') {
      const body = await readJsonBody(req);
      createMaintenance(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/maintenance') {
      const body = await readJsonBody(req);
      updateMaintenanceStatus(db, body.id, body.status);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/maintenance') {
      const body = await readJsonBody(req);
      await pingMaintenanceServer(db, body.id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/maintenance') {
      const id = url.searchParams.get('id');
      if (id) deleteMaintenance(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/hosting') {
      const body = await readJsonBody(req);
      createHostingDomain(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/hosting') {
      const body = await readJsonBody(req);
      updateHostingDomain(db, body.id, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/hosting') {
      const id = url.searchParams.get('id');
      if (id) deleteHostingDomain(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/vault') {
      const body = await readJsonBody(req);
      createVaultItem(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/vault') {
      const body = await readJsonBody(req);
      updateVaultItem(db, body.id, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/vault') {
      const id = url.searchParams.get('id');
      if (id) deleteVaultItem(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && (url.pathname === '/api/joki' || url.pathname === '/api/joki/orders')) {
      const body = await readJsonBody(req);
      createJokiOrder(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/joki') {
      const body = await readJsonBody(req);
      updateJokiOrder(db, body.id, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/joki') {
      const body = await readJsonBody(req);
      if (body.markPaid || body.action === 'mark_paid' || !body.status) {
        markJokiOrderPaid(db, body.id, body.wallet_id);
      } else {
        updateJokiOrder(db, body.id, { status: body.status });
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/joki') {
      const id = url.searchParams.get('id');
      if (id) deleteJokiOrder(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/crm') {
      const body = await readJsonBody(req);
      if (body.entity === 'client') {
        createCrmClient(db, body);
      } else {
        createCrmDeal(db, body);
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/crm') {
      const body = await readJsonBody(req);
      if (body.entity === 'client') {
        updateCrmClient(db, body.id, body);
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/crm') {
      const body = await readJsonBody(req);
      if (body.action === 'convert_to_project') {
        convertDealToProjectAndInvoice(db, body.deal_id, body.wallet_id);
      } else {
        updateCrmDealStage(db, body.id, body.stage);
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/crm') {
      const id = url.searchParams.get('id');
      const entity = url.searchParams.get('entity') || 'deal';
      if (id) {
        if (entity === 'client') {
          deleteCrmClient(db, id);
        } else {
          deleteCrmDeal(db, id);
        }
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/academic') {
      const body = await readJsonBody(req);
      createAcademicCourse(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/academic') {
      const body = await readJsonBody(req);
      updateAcademicCourse(db, body.id, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/academic') {
      const body = await readJsonBody(req);
      incrementCourseAttendance(db, body.id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/academic') {
      const id = url.searchParams.get('id');
      if (id) deleteAcademicCourse(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/academic/mentari-sync') {
      try {
        const body = await readJsonBody(req);
        const result = saveMentariSyncData(db, body);
        ensurePostgresDatabaseAndSync(db).catch(() => {});
        let telegramSent = false;
        if (body.notifyTelegram !== false && result.pendingForumsCount > 0) {
          try {
            telegramSent = await sendMentariPendingForumTelegramNotification(db, {
              student: { name: result.studentName, nim: result.studentNim },
              pendingForums: result.pendingForums,
              force: Boolean(body.forceTelegram),
            });
          } catch (tgErr) {
            console.warn('[Telegram Mentari Notice Warn]', tgErr?.message);
          }
        }
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            message: 'Data Mentari UNPAM berhasil disinkronkan ke Nexus OS.',
            result,
            telegramSent,
            state: buildPayload(db),
          })
        );
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: err?.message || 'Gagal menyinkronkan data Mentari.' }));
      }
      return true;
    }

    if (
      req.method === 'POST' &&
      (url.pathname === '/api/academic/mentari-sync/test-telegram' ||
        url.pathname === '/api/academic/mentari-sync/test-telegram-alert')
    ) {
      const st = getDashboardState(db);
      const mentari = st.mentariSync;
      if (!mentari || !mentari.pendingForums || mentari.pendingForums.length === 0) {
        await sendTelegramNotification(
          db,
          `[NEXUS OS - TEST NOTIFIKASI]\n` +
          `Tes notifikasi radar Mentari UNPAM berhasil terkirim ke Telegram Anda!\n` +
          `Waktu: ${new Date().toLocaleString('id-ID')}`
        );
      } else {
        await sendMentariPendingForumTelegramNotification(db, {
          student: { name: mentari.studentName, nim: mentari.studentNim },
          pendingForums: mentari.pendingForums,
          force: true,
        });
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, message: 'Tes notifikasi Telegram terkirim!' }));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/academic/mentari-sync/generate-forum-reply') {
      const body = await readJsonBody(req);
      const prompt =
        `Kamu adalah mahasiswa Teknik Informatika UNPAM semester 5 bernama Daerobi yang aktif, kritis, dan cerdas.\n` +
        `Buatkan draf jawaban forum diskusi perkuliahan berikut untuk langsung di-copy ke Mentari UNPAM:\n` +
        `- Mata Kuliah: ${body.courseName || 'Teknik Informatika'}\n` +
        `- Sesi: ${body.sectionName || 'Pertemuan'}\n` +
        `- Topik Diskusi Dosen: ${body.topicTitle || 'Diskusi'}\n` +
        `- Pertanyaan / Arahan Dosen:\n"""\n${body.promptText || body.topicTitle || ''}\n"""\n\n` +
        `PANDUAN JAWABAN:\n` +
        `- Tulis dalam bahasa Indonesia formal akademik namun natural (human-written, anti template AI klise).\n` +
        `- Ambil posisi argumen langsung dan lugas, kaitkan dengan use case riil teknik informatika/software engineering modern.\n` +
        `- Panjang sekitar 2-3 paragraf padat berbobot, langsung to the point tanpa basa-basi salam berlebihan.`;
      const answer = await askNexusAi(db, prompt, 'dashboard');
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, draft: answer }));
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/assets') {
      const category = url.searchParams.get('category') || undefined;
      const search = url.searchParams.get('search') || undefined;
      const result = getStorageAssetsState(db, { category, search });
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/assets/raw') {
      const id = url.searchParams.get('id');
      if (!id) {
        res.statusCode = 400;
        res.end('Missing asset id');
        return true;
      }
      const asset = db.prepare('SELECT * FROM storage_assets WHERE id = ?').get(id);
      if (!asset) {
        res.statusCode = 404;
        res.end('Asset not found');
        return true;
      }

      try {
        const range = req.headers.range;
        const s3Res = await getAssetObject(asset.bucket, asset.s3_key, range);

        res.setHeader('Content-Type', asset.mime_type || 'application/octet-stream');
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(asset.name)}"`
        );
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        if (s3Res.ContentLength) {
          res.setHeader('Content-Length', String(s3Res.ContentLength));
        }
        if (s3Res.ContentRange) {
          res.statusCode = 206;
          res.setHeader('Content-Range', s3Res.ContentRange);
        } else {
          res.statusCode = 200;
        }

        if (s3Res.Body) {
          s3Res.Body.pipe(res);
        } else {
          res.end();
        }
      } catch (streamErr) {
        res.statusCode = 500;
        res.end('Failed to stream asset: ' + streamErr?.message);
      }
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/assets/upload') {
      try {
        const body = await readJsonBody(req);
        if (!body.name || !body.dataBase64) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Nama file dan konten dataBase64 wajib disertakan.' }));
          return true;
        }
        const buffer = Buffer.from(body.dataBase64, 'base64');
        const asset = await uploadAssetToStorage(db, {
          name: body.name,
          mimeType: body.mimeType || 'application/octet-stream',
          buffer,
          tags: body.tags || [],
        });
        ensurePostgresDatabaseAndSync(db).catch(() => {});
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, asset, state: buildPayload(db) }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err?.message || 'Gagal mengunggah file ke MinIO S3.' }));
      }
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/assets') {
      try {
        const body = await readJsonBody(req);
        if (!body.id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'ID asset wajib disertakan.' }));
          return true;
        }
        await deleteAssetFromStorage(db, body.id);
        ensurePostgresDatabaseAndSync(db).catch(() => {});
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, state: buildPayload(db) }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err?.message || 'Gagal menghapus file dari MinIO.' }));
      }
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/telegram/deadline-alert') {
      await sendDeadlineAlertToTelegram(db, true);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, message: 'Alert deadline telah dikirim ke Telegram.' }));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/personal') {
      const body = await readJsonBody(req);
      createPersonalHabit(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/personal') {
      const body = await readJsonBody(req);
      if (body.type === 'goal') {
        updatePersonalGoalProgress(db, body.id, body.delta);
      } else {
        togglePersonalHabit(db, body.id);
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/coolify') {
      const body = await readJsonBody(req);
      if (body.action === 'sync') {
        await syncCoolifyResources(db);
      } else if (body.action === 'create') {
        await createCoolifyResource(db, body.payload);
      } else {
        await triggerCoolifyResourceAction(db, body);
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/documents/download') {
      const id = url.searchParams.get('id');
      const doc = db.prepare('SELECT * FROM generated_documents WHERE id = ?').get(id);
      if (!doc) {
        res.statusCode = 404;
        res.end('Document not found');
        return true;
      }
      const buffer = buildDocxBufferForDocument(doc);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.title)}.docx"`);
      res.statusCode = 200;
      res.end(buffer);
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/documents') {
      const body = await readJsonBody(req);
      await createSmartDocument(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/documents') {
      const id = url.searchParams.get('id');
      if (id) deleteGeneratedDocument(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/focus') {
      const body = await readJsonBody(req);
      createFocusSession(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/focus') {
      const id = url.searchParams.get('id');
      if (id) deleteFocusSession(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/cycling') {
      const body = await readJsonBody(req);
      createCyclingLog(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/cycling') {
      const id = url.searchParams.get('id');
      if (id) deleteCyclingLog(db, id);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/ai/models') {
      const models = await fetchAvailableGeminiModels(db);
      res.statusCode = 200;
      res.end(JSON.stringify({ models }));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/ai') {
      const body = await readJsonBody(req);
      const answer = await askNexusAi(db, body.prompt, 'dashboard', body.model);
      res.statusCode = 200;
      res.end(JSON.stringify({ answer, state: buildPayload(db) }));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/ai') {
      clearAiChatHistory(db);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/telegram') {
      const body = await readJsonBody(req);
      await connectTelegramBot(db, body.token);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/telegram') {
      const body = await readJsonBody(req);
      await sendTelegramNotification(db, body.message);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/telegram') {
      disconnectTelegramBot(db);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/google') {
      const body = await readJsonBody(req);
      await syncGoogleWorkspace(db, body.account);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'PUT' && url.pathname === '/api/google') {
      const body = await readJsonBody(req);
      const doc = await createGoogleDocForTask(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify({ doc, state: buildPayload(db) }));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/settings') {
      const body = await readJsonBody(req);
      if (body.key && body.value !== undefined) {
        updateSetting(db, body.key, body.value);
        ensurePostgresDatabaseAndSync(db).catch(() => {});
      }
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/restore') {
      const body = await readJsonBody(req);
      restoreDatabaseSnapshot(db, body);
      res.statusCode = 200;
      res.end(JSON.stringify(buildPayload(db)));
      return true;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint API lokal tidak ditemukan.' }));
    return true;
  } catch (err) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        error: err?.message || 'Terjadi kendala saat memproses penyimpanan database.',
      })
    );
    return true;
  }
}
