import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import {
  initDb,
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
} from './server/db.mjs';
import {
  ensurePostgresDatabaseAndSync,
  syncAllTablesToPostgres,
  pullFromPostgresToSqlite,
  getPostgresStatus,
} from './server/pg_sync.mjs';
import {
  syncCoolifyResources,
  triggerCoolifyResourceAction,
  createCoolifyResource,
  createSmartDocument,
  buildDocxBufferForDocument,
  deleteGeneratedDocument,
} from './server/power_features.mjs';
import {
  uploadAssetToStorage,
  getStorageAssetsState,
  deleteAssetFromStorage,
  getAssetObject,
} from './server/storage_s3.mjs';
import {
  getAvailableGoogleAccounts,
  syncGoogleWorkspace,
  createGoogleDocForTask,
  startGoogleWorkspaceAutoSync,
  askNexusAi,
  clearAiChatHistory,
  fetchAvailableGeminiModels,
  DEFAULT_GEMINI_MODELS,
  connectTelegramBot,
  disconnectTelegramBot,
  getTelegramStatus,
  sendTelegramNotification,
  sendDeadlineAlertToTelegram,
  sendMentariPendingForumTelegramNotification,
  startTelegramPolling,
} from './server/integrations.mjs';

function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => {
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

function buildPayload(db: any) {
  return {
    ...getDashboardState(db),
    upcomingDeadlines: getUpcomingDeadlines(db, 4),
    googleAccounts: getAvailableGoogleAccounts(),
    telegramStatus: getTelegramStatus(db),
    postgresStatus: getPostgresStatus(),
  };
}

function nexusLocalSqlitePlugin() {
  let db: any;

  return {
    name: 'nexus-local-sqlite-api',
    configureServer(server: any) {
      const dbPath = path.resolve(process.cwd(), 'data', 'nexus.db');
      const isFreshLocalDb = !fs.existsSync(dbPath);
      db = initDb();
      startTelegramPolling(db);
      ensurePostgresDatabaseAndSync(db, { preferPullIfFresh: isFreshLocalDb }).catch(() => {});

      // Background auto-sync engine for Google Workspace (checks Gmail & Drive every 2.5 minutes)
      startGoogleWorkspaceAutoSync(db, 150000);

      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        const url = new URL(req.url, 'http://localhost');

        // Trigger background sync to PostgreSQL homedb (buatin_nexus_db) after any write
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
            return;
          }

          if (req.method === 'GET' && url.pathname === '/api/state') {
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Public Standalone Customer Invoice Endpoint (?invoice=...)
          if (req.method === 'GET' && url.pathname === '/api/public-invoice') {
            const id = url.searchParams.get('id') || '';
            const pubInv = getPublicInvoiceById(db, id);
            if (!pubInv) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Invoice atau Kwitansi tidak ditemukan.' }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify(pubInv));
            return;
          }

          // Customer Confirms Payment & Uploads Proof
          if (req.method === 'POST' && url.pathname === '/api/public-invoice/confirm') {
            try {
              const body = await readJsonBody(req);
              const result = submitPaymentProof(db, body);
              try {
                const tgMsg =
                  `[NOTIFIKASI] BUKTI PEMBAYARAN MASUK!\n` +
                  `------------------------\n` +
                  `No. Nota: ${result.receiptNumber}\n` +
                  `Klien: ${result.clientName}\n` +
                  `Proyek: ${result.title}\n` +
                  `Nominal: Rp ${Number(result.amount).toLocaleString('id-ID')}\n` +
                  `Pengirim: ${result.senderName || '-'} (${result.senderBank || '-'})\n` +
                  (result.notes ? `Catatan: ${result.notes}\n` : '') +
                  `------------------------\n` +
                  `Status: Menunggu Verifikasi di Dashboard BUATIN OS.\n` +
                  `Buka dashboard untuk verifikasi & masukkan saldo ke dompet.`;
                await sendTelegramNotification(db, tgMsg);
              } catch (err: any) {
                console.warn('[Telegram Notice Error]', err?.message);
              }
              ensurePostgresDatabaseAndSync(db).catch(() => {});
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  ok: true,
                  message:
                    'Bukti pembayaran berhasil dikirim & notifikasi telah diteruskan ke admin BUATIN.',
                  result,
                })
              );
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err?.message || 'Gagal mengirim bukti pembayaran.' }));
            }
            return;
          }

          // Multi-Wallet Settlement (Auto-Masuk Kas saat Lunaskan)
          if (req.method === 'POST' && url.pathname === '/api/settle') {
            try {
              const body = await readJsonBody(req);
              settlePayment(db, body);
              ensurePostgresDatabaseAndSync(db).catch(() => {});
              res.statusCode = 200;
              res.end(JSON.stringify(buildPayload(db)));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err?.message || 'Gagal menyelesaikan pelunasan.' }));
            }
            return;
          }

          // Manual PostgreSQL homedb Sync / Pull Endpoint
          if (req.method === 'POST' && url.pathname === '/api/postgres/sync') {
            const body = await readJsonBody(req);
            if (body.direction === 'pull') {
              await pullFromPostgresToSqlite(db);
            } else {
              await ensurePostgresDatabaseAndSync(db);
            }
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Wallets & Transfer
          if (req.method === 'POST' && url.pathname === '/api/wallets') {
            const body = await readJsonBody(req);
            createWallet(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/wallets') {
            const body = await readJsonBody(req);
            transferBetweenWallets(db, body);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Transactions
          if (req.method === 'POST' && url.pathname === '/api/transactions') {
            const body = await readJsonBody(req);
            createTransaction(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/transactions') {
            const body = await readJsonBody(req);
            updateTransaction(db, body.id, body);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/transactions') {
            const id = url.searchParams.get('id');
            if (id) deleteTransaction(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Invoices & RAB
          if (req.method === 'POST' && url.pathname === '/api/invoices') {
            const body = await readJsonBody(req);
            createInvoice(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PATCH' && url.pathname === '/api/invoices') {
            const body = await readJsonBody(req);
            markInvoicePaid(db, body.id, body.wallet_id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/invoices') {
            const id = url.searchParams.get('id');
            if (id) deleteInvoice(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Tasks & Auto-Priority
          if (req.method === 'POST' && url.pathname === '/api/tasks') {
            const body = await readJsonBody(req);
            createTask(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PATCH' && url.pathname === '/api/tasks') {
            const body = await readJsonBody(req);
            updateTaskStatus(db, body.id, body.status);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/tasks') {
            const body = await readJsonBody(req);
            if (body.action === 'auto_priority') {
              runAutoPriorityEngine(db);
            } else {
              updateTaskDetails(db, body.id, body);
            }
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/tasks') {
            const id = url.searchParams.get('id');
            if (id) deleteTask(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Subtasks Checklist
          if (req.method === 'POST' && url.pathname === '/api/subtasks') {
            const body = await readJsonBody(req);
            addSubtask(db, body.task_id, body.title);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PATCH' && url.pathname === '/api/subtasks') {
            const body = await readJsonBody(req);
            toggleSubtask(db, body.id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/subtasks') {
            const id = url.searchParams.get('id');
            if (id) deleteSubtask(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Maintenance & Live HTTP Ping
          if (req.method === 'POST' && url.pathname === '/api/maintenance') {
            const body = await readJsonBody(req);
            createMaintenance(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PATCH' && url.pathname === '/api/maintenance') {
            const body = await readJsonBody(req);
            updateMaintenanceStatus(db, body.id, body.status);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/maintenance') {
            const body = await readJsonBody(req);
            await pingMaintenanceServer(db, body.id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/maintenance') {
            const id = url.searchParams.get('id');
            if (id) deleteMaintenance(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Hosting & Domain Manager (Rumahweb, Cloudflare, VPS, etc.)
          if (req.method === 'POST' && url.pathname === '/api/hosting') {
            const body = await readJsonBody(req);
            createHostingDomain(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/hosting') {
            const body = await readJsonBody(req);
            updateHostingDomain(db, body.id, body);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/hosting') {
            const id = url.searchParams.get('id');
            if (id) deleteHostingDomain(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Project Vault (GitHub Repo, Live URL, Demo Credentials & .env)
          if (req.method === 'POST' && url.pathname === '/api/vault') {
            const body = await readJsonBody(req);
            createVaultItem(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/vault') {
            const body = await readJsonBody(req);
            updateVaultItem(db, body.id, body);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/vault') {
            const id = url.searchParams.get('id');
            if (id) deleteVaultItem(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Joki Tugas & Proyek Management
          if (req.method === 'POST' && url.pathname === '/api/joki') {
            const body = await readJsonBody(req);
            createJokiOrder(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/joki') {
            const body = await readJsonBody(req);
            updateJokiOrder(db, body.id, body);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PATCH' && url.pathname === '/api/joki') {
            const body = await readJsonBody(req);
            markJokiOrderPaid(db, body.id, body.wallet_id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/joki') {
            const id = url.searchParams.get('id');
            if (id) deleteJokiOrder(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // CRM Clients & Deal Pipeline
          if (req.method === 'POST' && url.pathname === '/api/crm') {
            const body = await readJsonBody(req);
            if (body.kind === 'deal') {
              createCrmDeal(db, body);
            } else {
              createCrmClient(db, body);
            }
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/crm') {
            const body = await readJsonBody(req);
            updateCrmClient(db, body.id, body);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PATCH' && url.pathname === '/api/crm') {
            const body = await readJsonBody(req);
            if (body.action === 'convert') {
              convertDealToProjectAndInvoice(db, body.id);
            } else {
              updateCrmDealStage(db, body.id, body.stage);
            }
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/crm') {
            const id = url.searchParams.get('id');
            const kind = url.searchParams.get('kind');
            if (id) {
              if (kind === 'deal') deleteCrmDeal(db, id);
              else deleteCrmClient(db, id);
            }
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Academic Hub UNPAM
          if (req.method === 'POST' && url.pathname === '/api/academic') {
            const body = await readJsonBody(req);
            createAcademicCourse(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/academic') {
            const body = await readJsonBody(req);
            updateAcademicCourse(db, body.id, body);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PATCH' && url.pathname === '/api/academic') {
            const body = await readJsonBody(req);
            incrementCourseAttendance(db, body.id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/academic') {
            const id = url.searchParams.get('id');
            if (id) deleteAcademicCourse(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Mentari Mod v2 Realtime Ingestion & Telegram Dispatcher
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
                } catch (tgErr: any) {
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
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err?.message || 'Gagal menyinkronkan data Mentari.' }));
            }
            return;
          }

          // Manual Test Blast Telegram for Mentari Pending Forums
          if (req.method === 'POST' && url.pathname === '/api/academic/mentari-sync/test-telegram') {
            try {
              const st = getDashboardState(db);
              const mentari = st.mentariSync;
              if (!mentari || !mentari.pendingForums || mentari.pendingForums.length === 0) {
                await sendTelegramNotification(
                  db,
                  `[NEXUS OS - MENTARI RADAR]\n` +
                  `Status Sinkronisasi Mentari UNPAM: AKTIF\n` +
                  `Mahasiswa: Daerobi (Semester 5 TI UNPAM)\n` +
                  `Hasil Pengecekan: Semua forum diskusi dosen saat ini sudah beres (0 pending forum).\n` +
                  `Waktu Cek: ${new Date().toLocaleString('id-ID')}`
                );
              } else {
                await sendMentariPendingForumTelegramNotification(db, {
                  student: { name: mentari.studentName, nim: mentari.studentNim },
                  pendingForums: mentari.pendingForums,
                  force: true,
                });
              }
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, message: 'Notifikasi Telegram Mentari berhasil dikirim.' }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err?.message || 'Gagal mengirim notifikasi Telegram.' }));
            }
            return;
          }

          // Generate Academic AI Reply for Mentari Forum Topic
          if (req.method === 'POST' && url.pathname === '/api/academic/mentari-sync/generate-forum-reply') {
            try {
              const body = await readJsonBody(req);
              const prompt =
                `Kamu adalah Daerobi, mahasiswa Teknik Informatika Semester 5 UNPAM.\n` +
                `Tugasmu adalah menyusun balasan forum diskusi akademik yang tajam, solutif, kritis, dan berbobot untuk topik dosen berikut:\n\n` +
                `Mata Kuliah: ${body.courseName || 'Teknik Informatika'}\n` +
                `Sesi/Pertemuan: ${body.sectionName || 'Diskusi Perkuliahan'}\n` +
                `Topik Diskusi Dosen: "${body.topicTitle || ''}"\n` +
                (body.content ? `Pertanyaan/Konten Tambahan Dosen: "${body.content}"\n\n` : '\n') +
                `Aturan Balasan:\n` +
                `- DILARANG menggunakan kata-kata template AI ("Dalam era globalisasi ini", "Menyelami", "Penting sekali kita ketahui", dll).\n` +
                `- DILARANG menggunakan emoji Unicode sama sekali.\n` +
                `- Ambil posisi argumen langsung dan lugas, kaitkan dengan use case riil teknik informatika, arsitektur sistem, algoritma, atau best practice rekayasa perangkat lunak.\n` +
                `- Tulis dalam 2-3 paragraf padat, sopan dan akademis, langsung siap dicopy-paste ke forum Mentari.`;
              const answer = await askNexusAi(db, prompt, 'dashboard');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, draft: answer }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err?.message || 'Gagal membuat draft balasan forum.' }));
            }
            return;
          }

          // Telegram Auto-Deadline Alert Trigger
          if (req.method === 'POST' && url.pathname === '/api/telegram/deadline-alert') {
            await sendDeadlineAlertToTelegram(db, true);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Personal OS (Habits & OKR Goals)
          if (req.method === 'POST' && url.pathname === '/api/personal') {
            const body = await readJsonBody(req);
            createPersonalHabit(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PATCH' && url.pathname === '/api/personal') {
            const body = await readJsonBody(req);
            if (body.kind === 'goal') {
              updatePersonalGoalProgress(db, body.id, body.delta);
            } else {
              togglePersonalHabit(db, body.id);
            }
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // 1. Coolify Home Server Live Control Center
          if (req.method === 'POST' && url.pathname === '/api/coolify') {
            const body = await readJsonBody(req);
            if (body.action === 'sync') {
              await syncCoolifyResources(db);
            } else if (body.action === 'create') {
              createCoolifyResource(db, body);
            } else {
              await triggerCoolifyResourceAction(db, body);
            }
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // 2. Smart Document Generator (.DOCX UNPAM & Business MoU/Proposal)
          if (req.method === 'GET' && url.pathname === '/api/documents/download') {
            const id = url.searchParams.get('id');
            const docRow = db.prepare('SELECT * FROM generated_documents WHERE id = ?').get(id);
            if (!docRow) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Dokumen tidak ditemukan.' }));
              return;
            }
            const docxBuf = buildDocxBufferForDocument(docRow);
            const safeName = docRow.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
            res.setHeader(
              'Content-Type',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}.docx"`);
            res.statusCode = 200;
            res.end(docxBuf);
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/documents') {
            const body = await readJsonBody(req);
            await createSmartDocument(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/documents') {
            const id = url.searchParams.get('id');
            if (id) deleteGeneratedDocument(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // 3. Deep Work Focus Sessions & Cycling Activity Tracker
          if (req.method === 'POST' && url.pathname === '/api/focus') {
            const body = await readJsonBody(req);
            createFocusSession(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/focus') {
            const id = url.searchParams.get('id');
            if (id) deleteFocusSession(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/cycling') {
            const body = await readJsonBody(req);
            createCyclingLog(db, body);
            res.statusCode = 201;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/cycling') {
            const id = url.searchParams.get('id');
            if (id) deleteCyclingLog(db, id);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Full-Database AI Assistant & Live Model List
          if (req.method === 'GET' && url.pathname === '/api/ai/models') {
            const models = await fetchAvailableGeminiModels(db);
            res.statusCode = 200;
            res.end(JSON.stringify({ models }));
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/ai') {
            const body = await readJsonBody(req);
            const answer = await askNexusAi(db, body.prompt, 'dashboard', body.model);
            res.statusCode = 200;
            res.end(JSON.stringify({ answer, state: buildPayload(db) }));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/ai') {
            clearAiChatHistory(db);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Telegram BotFather One-Click Integration
          if (req.method === 'POST' && url.pathname === '/api/telegram') {
            const body = await readJsonBody(req);
            await connectTelegramBot(db, body.token);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/telegram') {
            const body = await readJsonBody(req);
            await sendTelegramNotification(db, body.message);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/telegram') {
            disconnectTelegramBot(db);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          // Google Workspace Live Sync & Docs Creator
          if (req.method === 'POST' && url.pathname === '/api/google') {
            const body = await readJsonBody(req);
            await syncGoogleWorkspace(db, body.account);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/google') {
            const body = await readJsonBody(req);
            const doc = await createGoogleDocForTask(db, body);
            res.statusCode = 200;
            res.end(JSON.stringify({ doc, state: buildPayload(db) }));
            return;
          }

          // MinIO S3 Asset Storage & Auto-Compression Engine
          if (req.method === 'GET' && url.pathname === '/api/assets') {
            const category = url.searchParams.get('category') || undefined;
            const search = url.searchParams.get('search') || undefined;
            const result = getStorageAssetsState(db, { category, search });
            res.statusCode = 200;
            res.end(JSON.stringify(result));
            return;
          }

          if (req.method === 'GET' && url.pathname === '/api/assets/raw') {
            const id = url.searchParams.get('id');
            if (!id) {
              res.statusCode = 400;
              res.end('Missing asset id');
              return;
            }
            const asset = db.prepare('SELECT * FROM storage_assets WHERE id = ?').get(id) as any;
            if (!asset) {
              res.statusCode = 404;
              res.end('Asset not found');
              return;
            }

            try {
              const range = req.headers.range as string | undefined;
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
                // @ts-ignore
                s3Res.Body.pipe(res);
              } else {
                res.end();
              }
            } catch (streamErr: any) {
              res.statusCode = 500;
              res.end('Failed to stream asset: ' + streamErr?.message);
            }
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/assets/upload') {
            try {
              const body = await readJsonBody(req);
              if (!body.name || !body.dataBase64) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Nama file dan konten dataBase64 wajib disertakan.' }));
                return;
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
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Gagal mengunggah file ke MinIO S3.' }));
            }
            return;
          }

          if (req.method === 'DELETE' && url.pathname === '/api/assets') {
            try {
              const body = await readJsonBody(req);
              if (!body.id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'ID asset wajib disertakan.' }));
                return;
              }
              await deleteAssetFromStorage(db, body.id);
              ensurePostgresDatabaseAndSync(db).catch(() => {});
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, state: buildPayload(db) }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Gagal menghapus file dari MinIO.' }));
            }
            return;
          }

          // Settings & Restore
          if (req.method === 'PATCH' && url.pathname === '/api/settings') {
            const body = await readJsonBody(req);
            if (body.key && body.value !== undefined) {
              updateSetting(db, body.key, body.value);
              ensurePostgresDatabaseAndSync(db).catch(() => {});
            }
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/restore') {
            const body = await readJsonBody(req);
            restoreDatabaseSnapshot(db, body);
            res.statusCode = 200;
            res.end(JSON.stringify(buildPayload(db)));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Endpoint API lokal tidak ditemukan.' }));
        } catch (err: any) {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              error: err?.message || 'Terjadi kendala saat memproses penyimpanan database lokal.',
            })
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), nexusLocalSqlitePlugin()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
