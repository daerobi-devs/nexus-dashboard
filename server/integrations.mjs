import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {
  getDashboardState,
  createTransaction,
  createTask,
  transferBetweenWallets,
  createCrmClient,
  createCrmDeal,
  updateCrmDealStage,
  incrementCourseAttendance,
  togglePersonalHabit,
  createFocusSession,
  createCyclingLog,
  createJokiOrder,
  markJokiOrderPaid,
  createHostingDomain,
  getUpcomingDeadlines,
  updateSetting,
  updateMentariNotificationMeta,
  logActivity,
} from './db.mjs';
import {
  triggerCoolifyResourceAction,
  createSmartDocument,
} from './power_features.mjs';

const GOOGLE_MCP_DIR = process.env.GOOGLE_MCP_DIR || path.join(os.homedir(), '.google-mcp');

// ============================================================================
// 1. GOOGLE WORKSPACE LIVE CONNECTOR (Uses Existing .google-mcp Credentials)
// ============================================================================
async function getGoogleAccessToken(accountName = 'daerobi') {
  const credFile = path.join(GOOGLE_MCP_DIR, 'credentials.json');
  const tokenFile = path.join(GOOGLE_MCP_DIR, 'tokens', `${accountName}.json`);

  if (!fs.existsSync(credFile) || !fs.existsSync(tokenFile)) {
    throw new Error(`Kredensial Google MCP untuk akun "${accountName}" tidak ditemukan di ${GOOGLE_MCP_DIR}`);
  }

  const credRaw = JSON.parse(fs.readFileSync(credFile, 'utf8'));
  const key = credRaw.installed || credRaw.web;
  const tokRaw = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: tokRaw.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || 'Gagal memperbarui token OAuth Google Workspace.');
  }
  return data.access_token;
}

export function getAvailableGoogleAccounts() {
  try {
    const accFile = path.join(GOOGLE_MCP_DIR, 'accounts.json');
    if (!fs.existsSync(accFile)) return ['daerobi', 'default'];
    const parsed = JSON.parse(fs.readFileSync(accFile, 'utf8'));
    return Object.keys(parsed.accounts || { daerobi: {}, default: {} });
  } catch {
    return ['daerobi', 'default'];
  }
}

export async function syncGoogleWorkspace(db, requestedAccount) {
  const account =
    requestedAccount ||
    db.prepare("SELECT value FROM settings WHERE key = 'google_account'").get()?.value ||
    'daerobi';

  const token = await getGoogleAccessToken(account);
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Fetch User Profile
  const aboutRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', { headers });
  const aboutJson = await aboutRes.json();
  const userEmail = aboutJson?.user?.emailAddress || `${account}@gmail.com`;
  const userDisplay = aboutJson?.user?.displayName || account;

  updateSetting(db, 'google_account', account);
  updateSetting(db, 'google_email', `${userDisplay} (${userEmail})`);
  updateSetting(db, 'google_last_sync', new Date().toISOString().slice(0, 16).replace('T', ' '));

  // 2. Fetch Recent Google Drive Files
  const driveRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=12&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,webViewLink)',
    { headers }
  );
  const driveJson = await driveRes.json();
  const driveFiles = Array.isArray(driveJson.files) ? driveJson.files : [];

  // 3. Fetch Recent Gmail Messages (Metadata: Subject, From, Date, Snippet)
  const gmailListRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8', {
    headers,
  });
  const gmailListJson = await gmailListRes.json();
  const msgRefs = Array.isArray(gmailListJson.messages) ? gmailListJson.messages : [];

  const gmailDetails = await Promise.all(
    msgRefs.map(async (m) => {
      try {
        const dRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers }
        );
        return await dRes.json();
      } catch {
        return null;
      }
    })
  );

  // Check previous cached Gmail IDs before refreshing
  const prevGmailIds = new Set(
    db
      .prepare("SELECT id FROM google_workspace_cache WHERE account = ? AND kind = 'gmail'")
      .all(account)
      .map((r) => r.id)
  );

  // Save all synced items into SQLite google_workspace_cache
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM google_workspace_cache WHERE account = ?').run(account);
    const ins = db.prepare(
      'INSERT INTO google_workspace_cache (id, kind, account, title, subtitle, snippet, web_link, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    for (const f of driveFiles) {
      const cleanType = f.mimeType?.includes('document')
        ? 'Google Docs'
        : f.mimeType?.includes('spreadsheet')
        ? 'Google Sheets'
        : f.mimeType?.includes('presentation')
        ? 'Google Slides'
        : f.mimeType?.includes('folder')
        ? 'Folder Drive'
        : f.name?.endsWith('.ipynb')
        ? 'Google Colab Notebook'
        : f.name?.endsWith('.docx')
        ? 'Dokumen Word (.docx)'
        : 'Berkas Drive';

      ins.run(
        `gdrive-${f.id}`,
        'drive',
        account,
        f.name || 'Tanpa Judul',
        cleanType,
        `Diperbarui ${(f.modifiedTime || '').slice(0, 16).replace('T', ' ')}`,
        f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        (f.modifiedTime || new Date().toISOString()).slice(0, 16).replace('T', ' ')
      );
    }

    const newlyArrived = [];
    for (const msg of gmailDetails.filter(Boolean)) {
      const hdrs = msg.payload?.headers || [];
      const subject = hdrs.find((h) => h.name === 'Subject')?.value || '(Tanpa Subjek)';
      const from = hdrs.find((h) => h.name === 'From')?.value || 'Pengirim';
      const dateStr = hdrs.find((h) => h.name === 'Date')?.value || '';
      const msgId = `gmail-${msg.id}`;

      if (prevGmailIds.size > 0 && !prevGmailIds.has(msgId)) {
        newlyArrived.push({ from, subject });
      }

      ins.run(
        msgId,
        'gmail',
        account,
        subject,
        from,
        msg.snippet || '',
        `https://mail.google.com/mail/?authuser=${encodeURIComponent(userEmail)}#all/${msg.id}`,
        dateStr.slice(0, 22) || new Date().toISOString().slice(0, 16).replace('T', ' ')
      );
    }

    if (newlyArrived.length > 0) {
      logActivity(
        db,
        'Gmail Masuk',
        `${newlyArrived.length} Pesan Baru Diterima`,
        `Dari ${newlyArrived[0].from}: "${newlyArrived[0].subject.slice(0, 50)}"${
          newlyArrived.length > 1 ? ` (+${newlyArrived.length - 1} lainnya)` : ''
        }`
      );
    }

    logActivity(
      db,
      'Google Workspace',
      'Live Sync Berhasil',
      `Sinkronisasi akun ${userEmail}: ${driveFiles.length} berkas Drive & ${gmailDetails.filter(Boolean).length} email Gmail.`
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return {
    account,
    email: userEmail,
    driveCount: driveFiles.length,
    gmailCount: gmailDetails.filter(Boolean).length,
  };
}

export function startGoogleWorkspaceAutoSync(db, intervalMs = 150000) {
  if (globalThis.__nexusGoogleSyncTimer) {
    clearInterval(globalThis.__nexusGoogleSyncTimer);
    globalThis.__nexusGoogleSyncTimer = null;
  }

  globalThis.__nexusGoogleSyncActive = true;
  globalThis.__nexusGoogleSyncBusy = false;

  const runSyncTick = async () => {
    if (globalThis.__nexusGoogleSyncBusy) return;
    globalThis.__nexusGoogleSyncBusy = true;
    try {
      const account =
        db.prepare("SELECT value FROM settings WHERE key = 'google_account'").get()?.value || 'daerobi';
      await syncGoogleWorkspace(db, account);
    } catch {
      // Quietly ignore transient network timeouts
    } finally {
      globalThis.__nexusGoogleSyncBusy = false;
    }
  };

  // Run initial tick after 15 seconds
  setTimeout(runSyncTick, 15000);

  // Set background interval (default 2.5 minutes)
  globalThis.__nexusGoogleSyncTimer = setInterval(runSyncTick, intervalMs);
}

export function stopGoogleWorkspaceAutoSync() {
  if (globalThis.__nexusGoogleSyncTimer) {
    clearInterval(globalThis.__nexusGoogleSyncTimer);
    globalThis.__nexusGoogleSyncTimer = null;
  }
  globalThis.__nexusGoogleSyncActive = false;
}

export async function createGoogleDocForTask(db, { title, content, taskId }) {
  const account =
    db.prepare("SELECT value FROM settings WHERE key = 'google_account'").get()?.value || 'daerobi';
  const token = await getGoogleAccessToken(account);

  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: title || 'Dokumen Nexus Command Center' }),
  });
  const docData = await createRes.json();
  if (!createRes.ok || !docData.documentId) {
    throw new Error(docData.error?.message || 'Gagal membuat Google Doc baru.');
  }

  const docId = docData.documentId;
  if (content && content.trim()) {
    await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      }),
    });
  }

  const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
  if (taskId) {
    db.prepare('UPDATE tasks SET drive_link = ? WHERE id = ?').run(docUrl, taskId);
  }

  logActivity(db, 'Google Workspace', 'Buat Google Doc', `Membuat Google Doc "${title}" (${docUrl})`);
  return { docId, docUrl };
}

// ============================================================================
// 2. FULL-DATABASE AI ENGINE (Reads & Mutates Entire SQLite Database)
// ============================================================================
function tryExecuteNaturalLanguageCommand(db, rawPrompt) {
  const text = rawPrompt.trim();
  const lower = text.toLowerCase();

  // Pattern 1: Catat Pengeluaran / Pemasukan (e.g. "catat pengeluaran 45000 beli kopi" or "/catat keluar 45000 kopi")
  const txMatch = text.match(
    /(?:\/catat|catat)\s+(masuk|pemasukan|keluar|pengeluaran)\s+(?:rp\.?\s*)?([\d.,]+)\s+(.+)/i
  );
  if (txMatch) {
    const rawType = txMatch[1].toLowerCase();
    const type = rawType.startsWith('masuk') || rawType.startsWith('pemasukan') ? 'income' : 'expense';
    const amount = Number(txMatch[2].replace(/[.,]/g, ''));
    const title = txMatch[3].trim();

    let walletId = 'wallet-bca';
    if (lower.includes('jago')) walletId = 'wallet-jago';
    else if (lower.includes('kas')) walletId = 'wallet-kas';

    const tx = createTransaction(db, {
      title,
      category: type === 'income' ? 'Proyek Klien' : 'Operasional Server',
      type,
      amount,
      wallet_id: walletId,
    });

    const updatedWallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(walletId);
    return `SIAP! Transaksi berhasil dicatat langsung ke SQLite (data/nexus.db):
- Kode: ${tx.code}
- Keterangan: ${tx.title}
- Tipe: ${type === 'income' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
- Nominal: Rp ${amount.toLocaleString('id-ID')}
- Rekening: ${updatedWallet.name} (Saldo terbaru: Rp ${Number(updatedWallet.balance).toLocaleString('id-ID')})`;
  }

  // Pattern 2: Transfer Antar Dompet (e.g. "transfer 500000 dari bca ke jago")
  const trfMatch = text.match(/transfer\s+(?:rp\.?\s*)?([\d.,]+)\s+dari\s+(\w+)\s+ke\s+(\w+)/i);
  if (trfMatch) {
    const amount = Number(trfMatch[1].replace(/[.,]/g, ''));
    const fromKey = trfMatch[2].toLowerCase();
    const toKey = trfMatch[3].toLowerCase();
    const mapWallet = (k) =>
      k.includes('jago') ? 'wallet-jago' : k.includes('kas') ? 'wallet-kas' : 'wallet-bca';

    transferBetweenWallets(db, {
      from_wallet_id: mapWallet(fromKey),
      to_wallet_id: mapWallet(toKey),
      amount,
      notes: 'Via Perintah AI',
    });
    return `BERHASIL! Transfer Rp ${amount.toLocaleString('id-ID')} dari ${fromKey.toUpperCase()} ke ${toKey.toUpperCase()} telah dieksekusi di SQLite.`;
  }

  // Pattern 3: Tambah Tugas Kuliah / Klien (e.g. "tambah tugas kuliah Makalah AI" or "/tugas kuliah ...")
  const taskMatch = text.match(/(?:\/tugas|tambah tugas)\s+(kuliah|klien)\s+(.+)/i);
  if (taskMatch) {
    const scope = taskMatch[1].toLowerCase() === 'kuliah' ? 'kuliah' : 'klien';
    const title = taskMatch[2].trim();
    const created = createTask(db, {
      title,
      scope,
      subject_or_client: scope === 'kuliah' ? 'Semester 5 UNPAM' : 'Proyek daerobi-devs',
      priority: 'high',
      due_date: '2026-11-20',
      budget_or_weight: scope === 'kuliah' ? '3 SKS' : 'Proyek Aktif',
    });
    return `SIAP! Tugas baru berhasil dimasukkan ke Kanban SQLite:
- Judul: ${created.title}
- Kategori: ${scope.toUpperCase()}
- Status: To Do (Prioritas: HIGH)`;
  }

  return null;
}

export const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (1.2s • Paling Ngebut & Stabil)' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3.0 Flash Preview (2.1s • Smart & Cepat)' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (2.4s • Responsif)' },
  { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite Preview' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
  { id: 'gemini-4-argon', label: 'Gemini 4 Argon' },
  { id: 'gemini-omni-1.2-flash', label: 'Gemini Omni 1.2 Flash' },
];

export async function fetchAvailableGeminiModels(db) {
  const key =
    db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get()?.value?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    '';

  if (!key) return DEFAULT_GEMINI_MODELS;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
    );
    if (!res.ok) return DEFAULT_GEMINI_MODELS;
    const data = await res.json();
    const apiModels = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => {
        const id = (m.name || '').replace(/^models\//, '');
        return {
          id,
          label: `${m.displayName || id} (${id})`,
        };
      });

    const seen = new Set();
    const merged = [];
    for (const item of [...DEFAULT_GEMINI_MODELS, ...apiModels]) {
      if (!item.id || seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
    return merged;
  } catch {
    return DEFAULT_GEMINI_MODELS;
  }
}

async function executeStructuredAiActions(db, rawAiText) {
  const actionRegex = /<NEXUS_ACTION>([\s\S]*?)<\/NEXUS_ACTION>/g;
  let match;
  const executedNotes = [];

  while ((match = actionRegex.exec(rawAiText)) !== null) {
    try {
      const payload = JSON.parse(match[1].trim());
      if (payload.action === 'create_transaction') {
        const tx = createTransaction(db, {
          title: payload.title || 'Transaksi via AI',
          category: payload.category || (payload.type === 'income' ? 'Proyek Klien' : 'Operasional Server'),
          type: payload.type === 'income' ? 'income' : 'expense',
          amount: Number(payload.amount),
          wallet_id: payload.wallet_id || 'wallet-bca',
        });
        executedNotes.push(`[Tersimpan ke SQLite: ${tx.code} - ${tx.title} Rp ${Number(tx.amount).toLocaleString('id-ID')}]`);
      } else if (payload.action === 'create_task') {
        const task = createTask(db, {
          title: payload.title,
          scope: payload.scope === 'kuliah' ? 'kuliah' : 'klien',
          subject_or_client: payload.subject_or_client || (payload.scope === 'kuliah' ? 'Semester 5 UNPAM' : 'Proyek Klien'),
          priority: payload.priority || 'high',
          due_date: payload.due_date || '2026-11-20',
          budget_or_weight: payload.budget_or_weight || '-',
        });
        executedNotes.push(`[Tugas Ditambahkan ke SQLite: ${task.title}]`);
      } else if (payload.action === 'transfer_wallet') {
        transferBetweenWallets(db, {
          from_wallet_id: payload.from_wallet_id || 'wallet-bca',
          to_wallet_id: payload.to_wallet_id || 'wallet-jago',
          amount: Number(payload.amount),
          notes: payload.notes || 'Via AI Chat',
        });
        executedNotes.push(`[Transfer Antar Dompet Rp ${Number(payload.amount).toLocaleString('id-ID')} Berhasil]`);
      } else if (payload.action === 'create_crm_client') {
        const c = createCrmClient(db, payload);
        executedNotes.push(`[Klien CRM Baru Ditambahkan: ${c.name} - ${c.company}]`);
      } else if (payload.action === 'create_crm_deal') {
        const d = createCrmDeal(db, payload);
        executedNotes.push(`[Deal Prospek Baru Ditambahkan ke Pipeline: ${d.title} (Rp ${Number(d.value).toLocaleString('id-ID')})]`);
      } else if (payload.action === 'update_deal_stage') {
        updateCrmDealStage(db, payload.id, payload.stage);
        executedNotes.push(`[Tahap Deal Pipeline Diperbarui ke: ${payload.stage}]`);
      } else if (payload.action === 'mark_course_attendance') {
        incrementCourseAttendance(db, payload.id);
        executedNotes.push(`[Presensi Kuliah UNPAM Dicatat (+1 Hadir)]`);
      } else if (payload.action === 'toggle_habit') {
        togglePersonalHabit(db, payload.id);
        executedNotes.push(`[Habit Harian Personal OS Diperbarui]`);
      } else if (payload.action === 'coolify_action') {
        const r = await triggerCoolifyResourceAction(db, {
          id: payload.id || payload.name,
          action: payload.command || 'restart',
        });
        executedNotes.push(`[Coolify Home Server: Container ${r.name} berhasil di-${payload.command || 'restart'}]`);
      } else if (payload.action === 'generate_document') {
        const doc = await createSmartDocument(db, payload);
        executedNotes.push(`[Dokumen .DOCX Berhasil Dibuat: "${doc.title}" — Siap diunduh di menu Dokumen & MoU]`);
      } else if (payload.action === 'log_focus_session') {
        const foc = createFocusSession(db, payload);
        executedNotes.push(`[Sesi Deep Work Dicatat: ${foc.title} (${foc.duration_minutes} menit)]`);
      } else if (payload.action === 'log_cycling_ride') {
        const cyc = createCyclingLog(db, payload);
        executedNotes.push(`[Log Sepeda Dicatat: ${cyc.route_name} (${cyc.distance_km} km • ${cyc.avg_speed_kmh} km/j)]`);
      } else if (payload.action === 'create_joki_order') {
        const jok = createJokiOrder(db, payload);
        executedNotes.push(`[Order Joki Baru Dicatat: "${jok.title}" (${jok.client_name}) — Rp ${Number(jok.price).toLocaleString('id-ID')}]`);
      } else if (payload.action === 'mark_joki_paid') {
        markJokiOrderPaid(db, payload.id);
        executedNotes.push(`[Order Joki Dilunaskan & Saldo Dompet Diperbarui]`);
      } else if (payload.action === 'create_hosting_domain') {
        const dom = createHostingDomain(db, payload);
        executedNotes.push(`[Domain/Hosting Baru Dicatat: ${dom.domain_or_service} (${dom.provider})]`);
      }
    } catch (err) {
      executedNotes.push(`[Gagal mengeksekusi aksi DB: ${err.message}]`);
    }
  }

  const cleanedText = rawAiText.replace(/<NEXUS_ACTION>[\s\S]*?<\/NEXUS_ACTION>/g, '').trim();
  return executedNotes.length > 0
    ? `${cleanedText}\n\n${executedNotes.join('\n')}`.trim()
    : cleanedText;
}

async function callGeminiWithFastFallback(geminiKey, preferredModel, sysInstruction, contents) {
  const candidates = [
    preferredModel,
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
  ].filter((v, idx, arr) => v && arr.indexOf(v) === idx);

  let lastError = 'Timeout atau model sedang sibuk';

  for (const modelId of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7500);

      const gRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          modelId
        )}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sysInstruction }] },
            contents,
            generationConfig: { temperature: 0.55 },
          }),
        }
      );
      clearTimeout(timer);

      const gJson = await gRes.json();
      if (gRes.ok) {
        const text = gJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return { text: text.trim(), usedModel: modelId };
        }
      } else {
        lastError = gJson?.error?.message || `HTTP ${gRes.status}`;
      }
    } catch (err) {
      lastError = err.name === 'AbortError' ? `Model ${modelId} tidak merespons dalam 7.5 detik` : err.message;
    }
  }

  throw new Error(`Semua endpoint Gemini gagal dihubungi (${lastError}).`);
}

export async function askNexusAi(db, promptText, source = 'dashboard', overrideModel) {
  if (!promptText || !promptText.trim()) {
    throw new Error('Pesan pertanyaan tidak boleh kosong.');
  }

  const fullStateBefore = getDashboardState(db);
  const geminiKey =
    fullStateBefore.settings?.gemini_api_key?.trim() || process.env.GEMINI_API_KEY?.trim() || '';

  if (!geminiKey) {
    throw new Error('API Key Gemini belum diisi. Masukkan API Key Gemini di panel kanan terlebih dahulu.');
  }

  const selectedModel = (
    overrideModel ||
    fullStateBefore.settings?.gemini_model ||
    'gemini-3.5-flash-lite'
  ).replace(/^models\//, '');

  if (overrideModel && overrideModel !== fullStateBefore.settings?.gemini_model) {
    updateSetting(db, 'gemini_model', selectedModel);
  }

  // Build multi-turn conversation history from the last 10 messages in SQLite
  const recentHistory = (fullStateBefore.aiMessages || [])
    .filter((m) => m.id !== 'ai-welcome')
    .slice(-10)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const insMsg = db.prepare(
    'INSERT INTO ai_messages (id, source, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  insMsg.run(`msg-${crypto.randomUUID().slice(0, 8)}`, source, 'user', promptText.trim(), now);

  const dbSnapshot = {
    wallets: fullStateBefore.wallets,
    transactions: fullStateBefore.transactions.slice(0, 20),
    tasks: fullStateBefore.tasks,
    maintenance: fullStateBefore.maintenance,
    invoices: fullStateBefore.invoices,
    crmClients: fullStateBefore.crmClients,
    crmDeals: fullStateBefore.crmDeals,
    academicCourses: fullStateBefore.academicCourses,
    personalHabits: fullStateBefore.personalHabits,
    personalGoals: fullStateBefore.personalGoals,
    coolifyResources: fullStateBefore.coolifyResources,
    generatedDocuments: (fullStateBefore.generatedDocuments || []).map((d) => ({
      id: d.id,
      title: d.title,
      doc_type: d.doc_type,
      client_or_course: d.client_or_course,
      created_at: d.created_at,
    })),
    focusSessions: fullStateBefore.focusSessions,
    cyclingLogs: fullStateBefore.cyclingLogs,
    jokiOrders: fullStateBefore.jokiOrders,
    hostingDomains: fullStateBefore.hostingDomains,
    upcomingDeadlines: getUpcomingDeadlines(db, 4),
    googleDriveAndGmail: fullStateBefore.googleItems.slice(0, 15),
    monthlySpendingLimit: fullStateBefore.settings.monthly_spending_limit,
    googleAccount: fullStateBefore.settings.google_email,
    mentariSync: fullStateBefore.mentariSync,
    unpamBilling: fullStateBefore.unpamBilling,
  };

  const sysInstruction = `Kamu adalah rekan satu tim (sparring partner) sekaligus asisten pribadi Daerobi (Mahasiswa Teknik Informatika Semester 5 UNPAM & Fullstack/AI Engineer daerobi-devs) di dalam aplikasi Nexus Command Center.

ATURAN INTERAKSI & GAYA BICARA (WAJIB DIIKUTI):
1. JANGAN PERNAH memuntahkan seluruh isi database kalau tidak ditanya!
   - Kalau Daerobi cuma menyapa ("halo", "p", "bro", "tes", dll) atau ngobrol santai, balas SINGKAT (1-2 kalimat), santai, akrab layaknya teman developer ("Halo bro! Lagi mau ngecek tugas kuliah, orderan joki, atau proyek klien nih?").
2. Jawab HANYA apa yang ditanyakan secara proporsional, enak dibaca, mengalir seperti obrolan manusia asli, tanpa basa-basi robotik dan TANPA EMOJI UNICODE sama sekali.
3. Kamu punya akses penuh ke seluruh modul database SQLite lokal milik Daerobi (JSON di bawah): Keuangan/Dompet, Tugas Kanban, Order Joki (jokiOrders), Hosting & Domain Rumahweb/Cloudflare (hostingDomains), CRM Klien & Deal Pipeline, Jadwal/Nilai/Presensi Kuliah UNPAM Semester 5 (academicCourses, mentariSync radar forum/kuis/kehadiran, unpamBilling status tagihan SPP & kwitansi), Habit & Target OKR Pribadi, Coolify Home Server Container, Dokumen .DOCX (Makalah UNPAM & MoU/Proposal Klien), Sesi Deep Work Coding, Log Rute Bersepeda (Cycling), dan Google Workspace (Drive & Gmail).
4. EKSEKUSI DATABASE OTOMATIS: Jika Daerobi menyuruh mencatat/mengubah data dengan bahasa sehari-hari, balas dengan ramah DAN sertakan tag JSON di baris paling akhir jawabanmu persis dalam format ini:
   - Catat transaksi: <NEXUS_ACTION>{"action":"create_transaction","type":"expense","amount":45000,"title":"Beli kopi","wallet_id":"wallet-bca","category":"Operasional Server"}</NEXUS_ACTION>
   - Tambah tugas: <NEXUS_ACTION>{"action":"create_task","scope":"kuliah","title":"Judul Tugas","subject_or_client":"Nama Matkul/Klien","priority":"high","due_date":"2026-11-20"}</NEXUS_ACTION>
   - Transfer dompet: <NEXUS_ACTION>{"action":"transfer_wallet","from_wallet_id":"wallet-bca","to_wallet_id":"wallet-jago","amount":500000,"notes":"Transfer"}</NEXUS_ACTION>
   - Tambah order joki baru: <NEXUS_ACTION>{"action":"create_joki_order","client_name":"Nama Klien","title":"Judul Tugas Joki","category":"Joki Coding / Web","price":650000,"dp_paid":300000,"deadline":"2026-11-15"}</NEXUS_ACTION>
   - Lunaskan order joki: <NEXUS_ACTION>{"action":"mark_joki_paid","id":"jok-1"}</NEXUS_ACTION>
   - Tambah domain/hosting (Rumahweb dll): <NEXUS_ACTION>{"action":"create_hosting_domain","domain_or_service":"namadomain.id","provider":"Rumahweb","expiry_date":"2027-01-20","renewal_cost":250000}</NEXUS_ACTION>
   - Tambah klien CRM: <NEXUS_ACTION>{"action":"create_crm_client","name":"Nama PIC","company":"Nama Perusahaan","phone":"62812...","segment":"Enterprise","status":"Active"}</NEXUS_ACTION>
   - Tambah deal prospek CRM: <NEXUS_ACTION>{"action":"create_crm_deal","title":"Nama Proyek","company":"Nama Klien","value":12000000,"stage":"Proposal","next_action":"Kirim RAB"}</NEXUS_ACTION>
   - Update stage deal CRM: <NEXUS_ACTION>{"action":"update_deal_stage","id":"deal-1","stage":"Won"}</NEXUS_ACTION>
   - Absen hadir kuliah UNPAM: <NEXUS_ACTION>{"action":"mark_course_attendance","id":"crs-1"}</NEXUS_ACTION>
   - Checklist habit pribadi: <NEXUS_ACTION>{"action":"toggle_habit","id":"hab-1"}</NEXUS_ACTION>
   - Restart/Deploy container Coolify: <NEXUS_ACTION>{"action":"coolify_action","id":"erp-gudang-sinarjaya","command":"restart"}</NEXUS_ACTION>
   - Buat dokumen .DOCX otomatis: <NEXUS_ACTION>{"action":"generate_document","title":"Judul Dokumen","doc_type":"unpam_makalah","client_or_course":"Nama Matkul/Klien"}</NEXUS_ACTION>
   - Catat sesi deep work ngoding: <NEXUS_ACTION>{"action":"log_focus_session","title":"Garap Backend","domain":"Proyek Klien","duration_minutes":120,"hourly_rate":150000}</NEXUS_ACTION>
   - Catat log bersepeda (cycling): <NEXUS_ACTION>{"action":"log_cycling_ride","route_name":"Rute BSD Loop","distance_km":25,"duration_minutes":65}</NEXUS_ACTION>

DATA SQLITE REAL-TIME SAAT INI (Jadikan referensi di balik layar, sebutkan hanya saat relevan):
${JSON.stringify(dbSnapshot)}`;

  const contents = [
    ...recentHistory,
    { role: 'user', parts: [{ text: promptText.trim() }] },
  ];

  const { text: rawAiAnswer } = await callGeminiWithFastFallback(
    geminiKey,
    selectedModel,
    sysInstruction,
    contents
  );

  const finalAnswer = await executeStructuredAiActions(db, rawAiAnswer);

  const replyNow = new Date().toISOString().slice(0, 16).replace('T', ' ');
  insMsg.run(`msg-${crypto.randomUUID().slice(0, 8)}`, source, 'assistant', finalAnswer, replyNow);

  return finalAnswer;
}

export function clearAiChatHistory(db) {
  db.exec('DELETE FROM ai_messages');
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  db.prepare(
    'INSERT INTO ai_messages (id, source, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(
    'ai-welcome',
    'dashboard',
    'assistant',
    'Halo bro! Riwayat chat udah bersih. Mau bahas kerjaan proyek, tugas UNPAM, atau cek kas nih?',
    now
  );
}

function buildLocalDatabaseAwareResponse(state, rawQuery) {
  const q = rawQuery.toLowerCase();
  const totalBalance = state.wallets.reduce((s, w) => s + Number(w.balance), 0);
  const totalIncome = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const limit = Number(state.settings?.monthly_spending_limit || 5500000);
  const activeTasks = state.tasks.filter((t) => t.status !== 'done');
  const kuliahTasks = activeTasks.filter((t) => t.scope === 'kuliah');
  const klienTasks = activeTasks.filter((t) => t.scope === 'klien');
  const totalRetainer = state.maintenance.reduce((s, m) => s + Number(m.monthly_fee), 0);

  if (q.includes('balas') || q.includes('pesan') || q.includes('klien') || q.includes('tagih') || q.includes('wa')) {
    const unpaidInv = state.invoices.find((i) => i.status !== 'Paid') || state.invoices[0];
    return `Berikut draf pesan profesional untuk klien berdasarkan data proyek & invoice di database lokal:

---
Halo Bapak/Ibu Tim ${unpaidInv?.client_name || 'Klien'},

Semoga hari Anda berjalan lancar. Saya Daerobi ingin mengabarkan progres terbaru terkait pengerjaan "${
      unpaidInv?.project_title || 'Pengembangan Sistem'
    }". Saat ini modul utama telah berjalan sesuai jadwal.

Sekaligus kami lampirkan pengingat terkait penyelesaian administrasi Invoice ${
      unpaidInv?.invoice_number || 'INV/DRB/2026'
    } sebesar Rp ${Number(unpaidInv?.total_amount || 4500000).toLocaleString(
      'id-ID'
    )} (Jatuh tempo: ${unpaidInv?.due_date || 'Minggu ini'}) melalui rekening BCA Operasional (7410-8829-10).

Terima kasih atas kerja samanya.
Salam,
Daerobi (daerobi-devs)`;
  }

  if (q.includes('google') || q.includes('drive') || q.includes('email') || q.includes('gmail')) {
    const drives = state.googleItems.filter((g) => g.kind === 'drive').slice(0, 5);
    const gmails = state.googleItems.filter((g) => g.kind === 'gmail').slice(0, 4);
    if (drives.length === 0 && gmails.length === 0) {
      return `Saat ini cache Google Workspace di SQLite masih kosong. Klik tombol "Sinkronkan Google Workspace Sekarang" di menu Google Workspace untuk menarik file Drive & email Gmail dari akun ${
        state.settings.google_email || 'daerobii0223@gmail.com'
      }.`;
    }
    return `Ringkasan Data Google Workspace (${state.settings.google_email || 'daerobi'}):

Berkas Google Drive Terbaru:
${drives.map((d, i) => `${i + 1}. ${d.title} [${d.subtitle}]`).join('\n')}

Email Gmail Terbaru:
${gmails.map((m, i) => `${i + 1}. "${m.title}" — dari ${m.subtitle}`).join('\n')}`;
  }

  if (q.includes('saldo') || q.includes('uang') || q.includes('kas') || q.includes('keuangan') || q.includes('dompet')) {
    return `Laporan Keuangan Real-Time dari SQLite (data/nexus.db):

1. Total Saldo Seluruh Dompet: Rp ${totalBalance.toLocaleString('id-ID')}
${state.wallets
  .map((w) => `   - ${w.name} (${w.bank_code}): Rp ${Number(w.balance).toLocaleString('id-ID')}`)
  .join('\n')}

2. Arus Kas Bulan Ini:
   - Total Pemasukan: +Rp ${totalIncome.toLocaleString('id-ID')}
   - Total Pengeluaran: -Rp ${totalExpense.toLocaleString('id-ID')}
   - Sisa Kuota Anggaran Bulanan: Rp ${Math.max(0, limit - totalExpense).toLocaleString('id-ID')} (dari limit Rp ${limit.toLocaleString('id-ID')})

Tips: Ketik "catat pengeluaran 50000 makan siang" untuk langsung mencatat transaksi ke database.`;
  }

  if (q.includes('tugas') || q.includes('kuliah') || q.includes('unpam') || q.includes('proyek') || q.includes('deadline')) {
    return `Status Tugas Kuliah UNPAM & Proyek Klien di Database (${activeTasks.length} Aktif):

Tugas Kuliah Semester 5 UNPAM (${kuliahTasks.length}):
${
  kuliahTasks
    .map((t) => `- [${t.priority.toUpperCase()}] ${t.title} (${t.subject_or_client}) — Tenggat: ${t.due_date}`)
    .join('\n') || '- Semua tugas kuliah selesai!'
}

Proyek Klien daerobi-devs (${klienTasks.length}):
${
  klienTasks
    .map((t) => `- [${t.status.toUpperCase()}] ${t.title} (${t.subject_or_client}) — Nilai: ${t.budget_or_weight} — Tenggat: ${t.due_date}`)
    .join('\n') || '- Tidak ada proyek tertunda.'
}

Tips: Ketik "tambah tugas kuliah [Judul Tugas]" untuk menambah antrean baru.`;
  }

  if (q.includes('server') || q.includes('maintenance') || q.includes('coolify')) {
    return `Status Maintenance Aplikasi & Server (${state.maintenance.length} Layanan — Total Retainer Rp ${totalRetainer.toLocaleString('id-ID')}/bln):

${state.maintenance
  .map(
    (m) =>
      `- ${m.app_name} (${m.client_name}): Status [${m.status}] | Ping: ${m.last_ping_ms}ms | Retainer: Rp ${Number(
        m.monthly_fee
      ).toLocaleString('id-ID')}/bln`
  )
  .join('\n')}`;
  }

  // Default Full Database Executive Briefing
  return `Ringkasan Eksekutif Seluruh Database Nexus (data/nexus.db):

1. KEUANGAN & DOMPET:
   - Total Saldo Bersih: Rp ${totalBalance.toLocaleString('id-ID')} (${state.wallets
    .map((w) => `${w.bank_code}: Rp ${Number(w.balance).toLocaleString('id-ID')}`)
    .join(' | ')})
   - Pemasukan Bulan Ini: Rp ${totalIncome.toLocaleString('id-ID')} | Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}

2. TUGAS KULIAH UNPAM & PROYEK KLIEN (${activeTasks.length} Aktif):
   - Kuliah UNPAM: ${kuliahTasks.map((t) => t.title).join(', ') || 'Aman'}
   - Proyek Klien: ${klienTasks.map((t) => `${t.title} (${t.subject_or_client})`).join(', ') || 'Aman'}

3. MAINTENANCE SERVER & RETAINER:
   - ${state.maintenance.length} aplikasi dimonitor (Pendapatan rutin: Rp ${totalRetainer.toLocaleString('id-ID')}/bulan)

4. PERINTAH CEPAT AI (Bisa lewat Dashboard & Telegram):
   - "catat pengeluaran 45000 beli kopi"
   - "catat pemasukan 3000000 DP proyek web"
   - "transfer 500000 dari bca ke jago"
   - "tambah tugas kuliah Laporan Praktikum Jaringan"
   - "buatkan pesan penagihan klien"`;
}

// ============================================================================
// 3. ONE-CLICK TELEGRAM BOTFATHER LONG-POLLING ENGINE (DEDUPLICATED & LOCKED)
// ============================================================================
if (!globalThis.__nexusProcessedUpdateIds) {
  globalThis.__nexusProcessedUpdateIds = new Set();
}

export async function connectTelegramBot(db, rawToken) {
  const token = (rawToken || '').trim();
  if (!token || !token.includes(':')) {
    throw new Error('Format Token BotFather tidak valid. Pastikan formatnya seperti 123456789:ABCdefGHIjkl...');
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json();
  if (!res.ok || !data.ok || !data.result) {
    throw new Error(data.description || 'Token ditolak oleh server Telegram. Periksa kembali token dari @BotFather.');
  }

  const botUsername = data.result.username;
  const botName = data.result.first_name;

  updateSetting(db, 'telegram_bot_token', token);
  updateSetting(db, 'telegram_bot_username', `@${botUsername}`);
  updateSetting(db, 'telegram_bot_name', botName);

  logActivity(
    db,
    'Telegram Bot',
    'One-Click Bot Connected',
    `Berhasil menghubungkan bot Telegram @${botUsername} (${botName}) ke SQLite lokal.`
  );

  startTelegramPolling(db, token);

  return {
    username: `@${botUsername}`,
    name: botName,
    polling: true,
  };
}

export function disconnectTelegramBot(db) {
  if (globalThis.__nexusTelegramTimer) {
    clearInterval(globalThis.__nexusTelegramTimer);
    globalThis.__nexusTelegramTimer = null;
  }
  globalThis.__nexusPollingActive = false;
  updateSetting(db, 'telegram_bot_token', '');
  updateSetting(db, 'telegram_bot_username', '');
  logActivity(db, 'Telegram Bot', 'Disconnect Bot', 'Memutuskan koneksi polling Bot Telegram.');
}

export function getTelegramStatus(db) {
  const token = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get()?.value || '';
  const username = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_username'").get()?.value || '';
  const chatId = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get()?.value || '';
  return {
    connected: Boolean(token && username),
    polling: Boolean(globalThis.__nexusPollingActive),
    username,
    chatId,
  };
}

export async function sendTelegramNotification(db, customText) {
  const token = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get()?.value || '';
  const chatId = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get()?.value || '';

  if (!token) {
    throw new Error('Bot Telegram belum dihubungkan. Masukkan token @BotFather terlebih dahulu.');
  }
  if (!chatId) {
    throw new Error(
      'Chat ID belum terekam. Buka bot Anda di aplikasi Telegram lalu kirim pesan apa saja sekali agar Nexus mengenali akun Anda.'
    );
  }

  const message =
    customText ||
    (await askNexusAi(
      db,
      'Tolong kirimkan ringkasan singkat dan padat tentang posisi kas, tugas kuliah UNPAM, dan proyek klien gue hari ini.',
      'telegram'
    ));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.description || 'Gagal mengirim pesan ke Telegram.');
  }
  logActivity(db, 'Telegram Bot', 'Kirim Laporan', `Mengirim pesan AI ke Telegram (Chat ID: ${chatId})`);
  return true;
}

export async function sendDeadlineAlertToTelegram(db, forceManual = false) {
  const token = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get()?.value || '';
  const chatId = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get()?.value || '';

  if (!token || !chatId) {
    if (forceManual) {
      throw new Error(
        'Bot Telegram atau Chat ID belum aktif. Pastikan bot sudah terhubung dan Anda sudah pernah chat ke bot.'
      );
    }
    return false;
  }

  const upcoming = getUpcomingDeadlines(db, 4);
  if (upcoming.length === 0) {
    if (forceManual) {
      await sendTelegramNotification(
        db,
        'PENGECEKAN DEADLINE NEXUS OS:\nSemua aman bro! Tidak ada deadline Joki, Tugas UNPAM, Proyek Klien, atau Domain yang jatuh tempo dalam 4 hari ke depan.'
      );
    }
    return false;
  }

  const lines = upcoming.map((item, idx) => {
    const tag =
      item.daysLeft < 0
        ? `TERLEWAT ${Math.abs(item.daysLeft)} HARI`
        : item.daysLeft === 0
        ? 'HARI INI!'
        : `H-${item.daysLeft}`;
    return `${idx + 1}. [${tag}] [${item.kind}] ${item.title}\n   - Info: ${item.subtitle} | Tenggat: ${item.deadline}`;
  });

  const alertText = `PENGINGAT DEADLINE OTOMATIS NEXUS OS (H-3 / MENDESAK):\n\nBro Daerobi, ada ${
    upcoming.length
  } agenda/pekerjaan yang sudah mendekati batas waktu:\n\n${lines.join(
    '\n\n'
  )}\n\nBalas chat ini kalau mau gue bantu update status atau cicil dokumennya!`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: alertText,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    if (forceManual) throw new Error(json.description || 'Gagal mengirim peringatan deadline ke Telegram.');
    return false;
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  updateSetting(db, 'telegram_last_deadline_alert_date', todayKey);
  logActivity(
    db,
    'Deadline Watcher',
    'Telegram Auto-Alert',
    `Mengirim pengingat ${upcoming.length} deadline mendesak (Joki, Kuliah, Proyek & Domain) ke Telegram.`
  );
  return true;
}

export function startTelegramPolling(db, explicitToken) {
  const token =
    explicitToken ||
    db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get()?.value ||
    process.env.TELEGRAM_BOT_TOKEN ||
    '';

  // Always kill any previous interval on globalThis so hot-reloads never spawn duplicate pollers
  if (globalThis.__nexusTelegramTimer) {
    clearInterval(globalThis.__nexusTelegramTimer);
    globalThis.__nexusTelegramTimer = null;
  }

  if (!token) {
    globalThis.__nexusPollingActive = false;
    return;
  }

  globalThis.__nexusPollingActive = true;
  globalThis.__nexusPollingBusy = true;

  // Flush any stale queued updates on startup so only new messages get answered once
  fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-1`)
    .then((r) => r.json())
    .then((j) => {
      if (j?.ok && Array.isArray(j.result) && j.result.length > 0) {
        const latestId = Number(j.result[j.result.length - 1].update_id);
        updateSetting(db, 'telegram_last_update_id', String(latestId));
        globalThis.__nexusProcessedUpdateIds.add(latestId);
      }
    })
    .catch(() => {})
    .finally(() => {
      globalThis.__nexusPollingBusy = false;
    });

  globalThis.__nexusTelegramTimer = setInterval(async () => {
    if (globalThis.__nexusPollingBusy) return;
    globalThis.__nexusPollingBusy = true;

    try {
      const savedOffset = Number(
        db.prepare("SELECT value FROM settings WHERE key = 'telegram_last_update_id'").get()?.value || 0
      );

      // Auto-check daily deadline reminder once per day if enabled (default: enabled)
      const autoAlertSetting =
        db.prepare("SELECT value FROM settings WHERE key = 'telegram_auto_deadline_alert'").get()?.value ??
        'true';
      const lastAlertDate =
        db.prepare("SELECT value FROM settings WHERE key = 'telegram_last_deadline_alert_date'").get()
          ?.value || '';
      const todayKey = new Date().toISOString().slice(0, 10);
      if (autoAlertSetting === 'true' && lastAlertDate !== todayKey) {
        await sendDeadlineAlertToTelegram(db, false).catch(() => {});
      }

      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${savedOffset + 1}&timeout=0`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) return;

      for (const update of data.result) {
        const updateId = Number(update.update_id);

        // Immediately persist the new offset in SQLite & memory BEFORE calling AI so it can NEVER repeat
        updateSetting(db, 'telegram_last_update_id', String(updateId));

        if (globalThis.__nexusProcessedUpdateIds.has(updateId)) {
          continue;
        }
        globalThis.__nexusProcessedUpdateIds.add(updateId);

        const msg = update.message;
        if (!msg || !msg.text) continue;

        const chatId = String(msg.chat.id);
        updateSetting(db, 'telegram_chat_id', chatId);

        const userQuery = msg.text.trim();
        const aiAnswer = await askNexusAi(db, userQuery, 'telegram');

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: aiAnswer,
          }),
        });
      }
    } catch {
      // Ignore transient network hiccups
    } finally {
      globalThis.__nexusPollingBusy = false;
    }
  }, 2500);
}

// ============================================================================
// MENTARI UNPAM PENDING FORUM TELEGRAM NOTIFICATION DISPATCHER
// ============================================================================
export async function sendMentariPendingForumTelegramNotification(db, { student, pendingForums, force = false }) {
  const token = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get()?.value || '';
  const chatId = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get()?.value || '';

  if (!token || !chatId) {
    if (force) {
      throw new Error('Bot Telegram belum terhubung di pengaturan Nexus OS.');
    }
    return false;
  }

  if (!pendingForums || pendingForums.length === 0) {
    if (force) {
      await sendTelegramNotification(
        db,
        `[NEXUS OS - MENTARI UNPAM]\n` +
        `Semua forum diskusi perkuliahan sudah beres! Tidak ada topik pending saat ini.\n` +
        `Mahasiswa : ${student?.name || 'Daerobi'} (${student?.nim || 'UNPAM TI Semester 5'})\n` +
        `Waktu Cek : ${new Date().toLocaleString('id-ID')}`
      );
      return true;
    }
    return false;
  }

  // Check cooldown if not force: don't spam if synced in last 45 minutes with same count
  try {
    const syncRow = db.prepare('SELECT last_notified_forum_count, last_notified_at FROM mentari_sync_cache WHERE id = ?').get('latest');
    if (!force && syncRow?.last_notified_at) {
      const lastNotified = new Date(syncRow.last_notified_at).getTime();
      const diffMins = (Date.now() - lastNotified) / (1000 * 60);
      if (diffMins < 45 && syncRow.last_notified_forum_count === pendingForums.length) {
        return false;
      }
    }
  } catch {
    // Continue if cache query fails
  }

  const listItems = pendingForums.slice(0, 6).map((f, i) => {
    return (
      `${i + 1}. [${f.courseCode || 'MATKUL'}] ${f.courseName || 'Mata Kuliah'}\n` +
      `   Sesi: ${f.sectionName || 'Pertemuan'}\n` +
      `   Topik: ${f.topicTitle || 'Diskusi Forum'}\n` +
      `   Link: ${f.url || 'https://mentari.unpam.ac.id'}`
    );
  }).join('\n\n');

  const extraCount = pendingForums.length > 6 ? `\n...dan ${pendingForums.length - 6} topik forum lainnya.` : '';

  const message =
    `[NEXUS OS - RADAR MENTARI UNPAM]\n` +
    `Perhatian: Ada Forum Diskusi Dosen yang Belum Dibalas!\n` +
    `----------------------------------------\n` +
    `Mahasiswa : ${student?.name || 'Daerobi'} (${student?.nim || 'UNPAM'})\n` +
    `Pending   : ${pendingForums.length} Topik Forum Aktif\n` +
    `Waktu Cek : ${new Date().toLocaleString('id-ID')}\n` +
    `----------------------------------------\n\n` +
    listItems +
    extraCount +
    `\n\n----------------------------------------\n` +
    `Tips: Buka Nexus Dashboard untuk auto-draft jawaban forum via Gemini AI.`;

  await sendTelegramNotification(db, message);
  try {
    updateMentariNotificationMeta(db, pendingForums.length);
  } catch {}
  return true;
}
