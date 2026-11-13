import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function initDb(customPath) {
  const dbPath = customPath || path.resolve(process.cwd(), 'data', 'nexus.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bank_code TEXT NOT NULL,
      account_number TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      accent TEXT NOT NULL DEFAULT 'indigo'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount INTEGER NOT NULL,
      wallet_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Completed',
      created_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('kuliah', 'klien')),
      subject_or_client TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
      priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
      due_date TEXT NOT NULL,
      budget_or_weight TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      drive_link TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      is_done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_items (
      id TEXT PRIMARY KEY,
      app_name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      environment TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT 'http://localhost:8000',
      status TEXT NOT NULL CHECK (status IN ('Healthy', 'Maintenance', 'Warning')),
      uptime_percent REAL NOT NULL DEFAULT 99.9,
      monthly_fee INTEGER NOT NULL DEFAULT 0,
      last_ping_ms INTEGER NOT NULL DEFAULT 24,
      last_checked_at TEXT NOT NULL DEFAULT '',
      next_check_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      maintenance_id TEXT NOT NULL,
      event TEXT NOT NULL,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      client_name TEXT NOT NULL,
      project_title TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total_amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('Draft', 'Sent', 'Paid')),
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS google_workspace_cache (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('drive', 'gmail', 'calendar')),
      account TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      snippet TEXT NOT NULL DEFAULT '',
      web_link TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL CHECK (source IN ('dashboard', 'telegram')),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crm_clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Owner / PIC',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      segment TEXT NOT NULL DEFAULT 'UMKM / Enterprise',
      status TEXT NOT NULL DEFAULT 'Active Client',
      total_ltv INTEGER NOT NULL DEFAULT 0,
      last_contact_at TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS crm_deals (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      stage TEXT NOT NULL CHECK (stage IN ('lead', 'discovery', 'proposal', 'negotiation', 'won', 'lost')),
      value INTEGER NOT NULL DEFAULT 0,
      probability INTEGER NOT NULL DEFAULT 50,
      expected_close_date TEXT NOT NULL DEFAULT '',
      next_action TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      lecturer TEXT NOT NULL,
      sks INTEGER NOT NULL DEFAULT 3,
      day_time TEXT NOT NULL,
      room TEXT NOT NULL,
      attendance_count INTEGER NOT NULL DEFAULT 10,
      total_meetings INTEGER NOT NULL DEFAULT 14,
      task_score INTEGER NOT NULL DEFAULT 88,
      mid_score INTEGER NOT NULL DEFAULT 85,
      target_grade TEXT NOT NULL DEFAULT 'A',
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS personal_habits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      streak INTEGER NOT NULL DEFAULT 1,
      completed_today INTEGER NOT NULL DEFAULT 0,
      progress_week INTEGER NOT NULL DEFAULT 3,
      target_week INTEGER NOT NULL DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS personal_goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      current_value REAL NOT NULL DEFAULT 0,
      target_value REAL NOT NULL DEFAULT 100,
      unit TEXT NOT NULL DEFAULT 'IDR',
      deadline TEXT NOT NULL DEFAULT '2026-12-31'
    );

    CREATE TABLE IF NOT EXISTS coolify_resources (
      id TEXT PRIMARY KEY,
      uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      project_name TEXT NOT NULL,
      environment_name TEXT NOT NULL DEFAULT 'production',
      fqdn TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'running:healthy',
      cpu_percent REAL NOT NULL DEFAULT 4.2,
      memory_mb INTEGER NOT NULL DEFAULT 180,
      last_deployed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generated_documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      client_or_course TEXT NOT NULL,
      author_nim TEXT NOT NULL DEFAULT 'Daerobi (241011401811)',
      content_markdown TEXT NOT NULL,
      drive_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      domain TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      hourly_rate INTEGER NOT NULL DEFAULT 150000,
      billable_amount INTEGER NOT NULL DEFAULT 150000,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cycling_logs (
      id TEXT PRIMARY KEY,
      route_name TEXT NOT NULL,
      distance_km REAL NOT NULL DEFAULT 20,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      avg_speed_kmh REAL NOT NULL DEFAULT 22.5,
      calories INTEGER NOT NULL DEFAULT 520,
      elevation_m INTEGER NOT NULL DEFAULT 140,
      notes TEXT NOT NULL DEFAULT '',
      ride_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS joki_orders (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL DEFAULT '',
      university_or_origin TEXT NOT NULL DEFAULT 'Mahasiswa / Umum',
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Joki Coding / Web',
      price INTEGER NOT NULL DEFAULT 0,
      dp_paid INTEGER NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'DP Masuk',
      status TEXT NOT NULL DEFAULT 'in_progress',
      progress_percent INTEGER NOT NULL DEFAULT 40,
      deadline TEXT NOT NULL,
      deliverable_link TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hosting_domains (
      id TEXT PRIMARY KEY,
      domain_or_service TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'Rumahweb',
      category TEXT NOT NULL DEFAULT 'Domain & Hosting',
      account_identity TEXT NOT NULL DEFAULT 'admin@daerobi-devs.my.id',
      panel_url TEXT NOT NULL DEFAULT 'https://clientzone.rumahweb.com',
      ip_or_dns TEXT NOT NULL DEFAULT 'Cloudflare / Rumahweb DNS',
      client_owner TEXT NOT NULL DEFAULT 'Internal / Klien',
      renewal_cost INTEGER NOT NULL DEFAULT 250000,
      expiry_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS project_vault (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      client_or_scope TEXT NOT NULL DEFAULT 'Internal / Klien',
      repo_url TEXT NOT NULL DEFAULT '',
      live_url TEXT NOT NULL DEFAULT '',
      demo_username TEXT NOT NULL DEFAULT '',
      demo_password TEXT NOT NULL DEFAULT '',
      tech_stack TEXT NOT NULL DEFAULT 'TypeScript, React, Node.js',
      env_notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentari_sync_cache (
      id TEXT PRIMARY KEY,
      student_nim TEXT NOT NULL DEFAULT '',
      student_name TEXT NOT NULL DEFAULT '',
      synced_at TEXT NOT NULL DEFAULT '',
      raw_courses TEXT NOT NULL DEFAULT '[]',
      pending_forums TEXT NOT NULL DEFAULT '[]',
      quizzes TEXT NOT NULL DEFAULT '[]',
      attendance_summary TEXT NOT NULL DEFAULT '{}',
      last_notified_forum_count INTEGER NOT NULL DEFAULT 0,
      last_notified_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS unpam_billing_cache (
      id TEXT PRIMARY KEY,
      student_nim TEXT NOT NULL DEFAULT '241011401811',
      student_name TEXT NOT NULL DEFAULT 'DAEROBI',
      semester TEXT NOT NULL DEFAULT 'Semester 5 (Ganjil 2026/2027)',
      registration_status TEXT NOT NULL DEFAULT 'Lunas / Aktif',
      total_billed INTEGER NOT NULL DEFAULT 2000000,
      total_paid INTEGER NOT NULL DEFAULT 2000000,
      total_remaining INTEGER NOT NULL DEFAULT 0,
      va_mandiri TEXT NOT NULL DEFAULT '88710241011401811',
      va_bni TEXT NOT NULL DEFAULT '98810241011401811',
      va_bca TEXT NOT NULL DEFAULT '70010241011401811',
      items_json TEXT NOT NULL DEFAULT '[]',
      transactions_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS storage_assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      s3_key TEXT NOT NULL,
      bucket TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      category TEXT NOT NULL,
      original_size BIGINT NOT NULL,
      compressed_size BIGINT NOT NULL,
      compression_ratio DOUBLE PRECISION NOT NULL DEFAULT 0,
      url TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
  `);

  // Safe migrations for existing databases created in v1
  const safeAlter = [
    "ALTER TABLE tasks ADD COLUMN drive_link TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE maintenance_items ADD COLUMN url TEXT NOT NULL DEFAULT 'http://localhost:8000'",
    'ALTER TABLE maintenance_items ADD COLUMN last_ping_ms INTEGER NOT NULL DEFAULT 24',
    "ALTER TABLE maintenance_items ADD COLUMN last_checked_at TEXT NOT NULL DEFAULT '2026-11-10 17:45'",
    "ALTER TABLE joki_orders ADD COLUMN payment_proof TEXT DEFAULT ''",
    "ALTER TABLE joki_orders ADD COLUMN payment_proof_note TEXT DEFAULT ''",
    "ALTER TABLE invoices ADD COLUMN payment_proof TEXT DEFAULT ''",
    "ALTER TABLE invoices ADD COLUMN payment_proof_note TEXT DEFAULT ''",
  ];
  for (const sql of safeAlter) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists
    }
  }

  const walletCount = db.prepare('SELECT COUNT(*) AS count FROM wallets').get().count;
  if (walletCount === 0) {
    seedInitialData(db);
  }

  // Seed v2 tables if empty on an upgraded DB
  const subtaskCount = db.prepare('SELECT COUNT(*) AS count FROM task_subtasks').get().count;
  if (subtaskCount === 0) {
    seedV2Extensions(db);
  }

  const crmCount = db.prepare('SELECT COUNT(*) AS count FROM crm_clients').get().count;
  if (crmCount === 0) {
    seedCrmAcademicPersonal(db);
  }

  const coolifyCount = db.prepare('SELECT COUNT(*) AS count FROM coolify_resources').get().count;
  if (coolifyCount === 0) {
    seedPowerFeatures(db);
  }

  const jokiCount = db.prepare('SELECT COUNT(*) AS count FROM joki_orders').get().count;
  if (jokiCount === 0) {
    seedJokiAndHosting(db);
  }

  const vaultCount = db.prepare('SELECT COUNT(*) AS count FROM project_vault').get().count;
  if (vaultCount === 0) {
    seedProjectVaultAndBuatin(db);
  }

  return db;
}

export function logActivity(db, moduleName, action, detail) {
  const id = `log-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  db.prepare('INSERT INTO activity_logs (id, module, action, detail, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    moduleName,
    action,
    detail,
    now
  );
}

function seedInitialData(db) {
  const insertWallet = db.prepare(
    'INSERT INTO wallets (id, name, bank_code, account_number, balance, accent) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertWallet.run('wallet-bca', 'BCA Operasional', 'BCA', '7410-8829-10', 18450000, 'indigo');
  insertWallet.run('wallet-jago', 'Bank Jago Projek', 'JAGO', '1049-2291-84', 9200000, 'orange');
  insertWallet.run('wallet-kas', 'Kas Cadangan & Server', 'KAS', 'LOKAL-01', 3750000, 'emerald');

  const insertTx = db.prepare(
    'INSERT INTO transactions (id, code, title, category, type, amount, wallet_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const seedTxs = [
    ['tx-1', 'INV_00084', 'Pelunasan Dashboard Logistik PT Sinar Jaya', 'Proyek Klien', 'income', 8500000, 'wallet-bca', 'Completed', '2026-11-09 14:20'],
    ['tx-2', 'INV_00083', 'Retainer Maintenance Portal Akademik SMK', 'Maintenance', 'income', 1750000, 'wallet-jago', 'Completed', '2026-11-08 10:15'],
    ['tx-3', 'EXP_00041', 'Perpanjangan VPS & Tailscale Subnet Node', 'Operasional Server', 'expense', 485000, 'wallet-kas', 'Completed', '2026-11-07 19:40'],
    ['tx-4', 'INV_00082', 'DP 50% Sistem Antrean Klinik Pratama', 'Proyek Klien', 'income', 4500000, 'wallet-bca', 'Completed', '2026-11-05 16:05'],
    ['tx-5', 'EXP_00040', 'Lisensi Domain .id & Cloudflare R2 Storage', 'Operasional Server', 'expense', 320000, 'wallet-jago', 'Completed', '2026-11-03 11:30'],
    ['tx-6', 'EXP_00039', 'Pembelian Buku Referensi & Modul Praktikum UNPAM', 'Kuliah & Akademik', 'expense', 275000, 'wallet-bca', 'Completed', '2026-11-01 09:00'],
  ];
  for (const row of seedTxs) insertTx.run(...row);

  const insertTask = db.prepare(
    'INSERT INTO tasks (id, title, scope, subject_or_client, status, priority, due_date, budget_or_weight, notes, drive_link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const seedTasks = [
    ['task-1', 'Integrasi Modul Kasir & Cetak Struk Thermal', 'klien', 'Klinik Pratama Sehat', 'in_progress', 'high', '2026-11-14', 'Rp 9.000.000', 'Fokus di endpoint transaksi obat dan rekam medis', '', '2026-11-04'],
    ['task-2', 'Tugas Besar: Implementasi Algoritma A* & Heuristik', 'kuliah', 'Kecerdasan Buatan (Sem 5 UNPAM)', 'in_progress', 'high', '2026-11-12', '3 SKS • Reguler A', 'Siapkan dataset graf kota Tangerang Selatan', 'https://colab.research.google.com/drive/1wxnOEJx07Dy-WdwQUSWWQ1ZAwc8WoPQ3', '2026-11-05'],
    ['task-3', 'Optimasi Query Laporan Bulanan & Export Excel', 'klien', 'PT Sinar Jaya Logistik', 'review', 'medium', '2026-11-11', 'Rp 8.500.000', 'Menunggu UAT dari kepala gudang', '', '2026-11-02'],
    ['task-4', 'Laporan Proyek SIM SDLC (NIM 241011401811)', 'kuliah', 'Sistem Informasi Manajemen (Sem 5 UNPAM)', 'todo', 'high', '2026-11-15', '3 SKS • Reguler A', 'Format dokumen Times New Roman 12pt margin 4-4-3-3', 'https://docs.google.com/document/d/1OohUDdAP-a0OtHkbDZ9YmSA9mtavuLGn/edit', '2026-11-08'],
    ['task-5', 'Setup Docker Compose & Reverse Proxy di Coolify', 'klien', 'CV Nusantara Kreatif', 'todo', 'high', '2026-11-18', 'Rp 4.200.000', 'Deploy via Tailscale mesh ke server lokal', '', '2026-11-09'],
    ['task-6', 'Analisis Jurnal Arsitektur Microservices vs Monolith', 'kuliah', 'Rekayasa Perangkat Lunak (Sem 5 UNPAM)', 'done', 'low', '2026-11-07', '2 SKS • Reguler A', 'Sudah dikumpulkan di e-learning UNPAM', '', '2026-11-01'],
  ];
  for (const row of seedTasks) insertTask.run(...row);

  const insertMaint = db.prepare(
    'INSERT INTO maintenance_items (id, app_name, client_name, environment, url, status, uptime_percent, monthly_fee, last_ping_ms, last_checked_at, next_check_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const seedMaint = [
    ['srv-1', 'ERP Gudang & Armada v2', 'PT Sinar Jaya Logistik', 'Coolify Home Server • PostgreSQL', 'https://erp.sinarjayalogistik.co.id', 'Healthy', 99.96, 1500000, 18, '2026-11-10 17:40', '2026-11-15'],
    ['srv-2', 'Portal SIAKAD & E-Rapor', 'SMK Budi Mulia', 'VPS Jakarta • Docker', 'https://google.com', 'Healthy', 99.89, 1750000, 32, '2026-11-10 17:40', '2026-11-18'],
    ['srv-3', 'Sistem Antrean & Rekam Medis', 'Klinik Pratama Sehat', 'Coolify Staging • SQLite/Postgres', 'http://127.0.0.1:5173/api/state', 'Maintenance', 98.4, 1250000, 4, '2026-11-10 17:40', '2026-11-11'],
    ['srv-4', 'Landing Page & Katalog B2B', 'CV Nusantara Kreatif', 'Cloudflare Pages + Worker', 'https://cloudflare.com', 'Healthy', 99.99, 750000, 21, '2026-11-10 17:40', '2026-11-25'],
  ];
  for (const row of seedMaint) insertMaint.run(...row);

  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('monthly_spending_limit', '5500000');
  insertSetting.run('user_name', 'Daerobi');
  insertSetting.run('user_subtitle', 'Teknik Informatika Sem 5 UNPAM • Fullstack & AI Engineer');
  insertSetting.run('google_account', 'daerobi');
  insertSetting.run('google_email', process.env.GOOGLE_EMAIL || '');
  insertSetting.run('pin_code', '');
  insertSetting.run('telegram_bot_token', '');
  insertSetting.run('telegram_bot_username', '');
  insertSetting.run('telegram_chat_id', '');
  insertSetting.run('gemini_api_key', '');
}

function seedV2Extensions(db) {
  const insertSub = db.prepare(
    'INSERT INTO task_subtasks (id, task_id, title, is_done, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  insertSub.run('sub-1', 'task-1', 'Rancang skema tabel resep & stok obat', 1, '2026-11-05');
  insertSub.run('sub-2', 'task-1', 'Buat endpoint cetak struk ESC/POS 58mm', 1, '2026-11-06');
  insertSub.run('sub-3', 'task-1', 'Uji coba cetak langsung di kasir klinik', 0, '2026-11-08');
  insertSub.run('sub-4', 'task-2', 'Implementasi fungsi heuristik jarak Euclidean di Python', 1, '2026-11-06');
  insertSub.run('sub-5', 'task-2', 'Bandingkan waktu eksekusi A* dengan Dijkstra di notebook Colab', 0, '2026-11-09');
  insertSub.run('sub-6', 'task-4', 'Susun DFD Level 0, Level 1, dan ERD Sistem Informasi', 0, '2026-11-10');

  const insertInv = db.prepare(
    'INSERT INTO invoices (id, invoice_number, client_name, project_title, items_json, total_amount, status, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertInv.run(
    'inv-1',
    'INV/DRB/2026/1101',
    'Klinik Pratama Sehat',
    'Pengembangan Sistem Antrean & Kasir Medis',
    JSON.stringify([
      { desc: 'Desain UI/UX Dashboard & Antrean Poli', qty: 1, price: 2500000 },
      { desc: 'Backend API Rekam Medis & Kasir Thermal', qty: 1, price: 4500000 },
      { desc: 'Setup Server Coolify & Training Staf', qty: 1, price: 2000000 },
    ]),
    9000000,
    'Sent',
    '2026-11-18',
    '2026-11-05'
  );
  insertInv.run(
    'inv-2',
    'INV/DRB/2026/1102',
    'CV Nusantara Kreatif',
    'Setup Infrastruktur Docker & Reverse Proxy',
    JSON.stringify([
      { desc: 'Konfigurasi Server & Tailscale VPN Mesh', qty: 1, price: 2200000 },
      { desc: 'Migrasi Database PostgreSQL & Auto-Backup', qty: 1, price: 2000000 },
    ]),
    4200000,
    'Draft',
    '2026-11-22',
    '2026-11-09'
  );

  const insertAi = db.prepare(
    'INSERT INTO ai_messages (id, source, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  insertAi.run(
    'ai-welcome',
    'dashboard',
    'assistant',
    'Halo Daerobi! Gue udah terhubung langsung ke seluruh tabel di database lokal `data/nexus.db` (Dompet, Transaksi, Tugas Kuliah UNPAM, Proyek Klien, Invoice, Maintenance Server, dan Google Workspace). Lo bisa tanya analisis data apa pun atau langsung perintah gue buat catat transaksi & tambah tugas dari chat ini maupun lewat Bot Telegram!',
    '2026-11-10 18:00'
  );

  logActivity(db, 'System', 'Upgrade v2.0', 'Mengaktifkan modul AI Full-DB, Google Workspace Sync, Invoice RAB, dan Sub-task Checklist.');
}

function seedCrmAcademicPersonal(db) {
  const insClient = db.prepare(
    'INSERT INTO crm_clients (id, name, company, role, phone, email, segment, status, total_ltv, last_contact_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const clients = [
    ['cli-1', 'Budi Santoso', 'PT Sinar Jaya Logistik', 'Direktur Operasional', '6281284920011', 'budi@sinarjayalogistik.co.id', 'Enterprise Logistik', 'VIP Retainer', 24500000, '2026-11-09', 'Klien utama ERP Gudang & Armada, rencana ekspansi modul GPS tracker bulan depan'],
    ['cli-2', 'dr. Siti Nurhaliza, M.Kes', 'Klinik Pratama Sehat', 'Kepala Klinik', '6281399201144', 'admin@klinikpratamasehat.id', 'Kesehatan / Klinik', 'Active Client', 13500000, '2026-11-08', 'Sedang berjalan tahap 2 sistem rekam medis & antrean kasir thermal'],
    ['cli-3', 'Rizky Pratama, M.Pd', 'SMK Budi Mulia Tangerang', 'Wakasek Kurikulum', '6285711223344', 'rizky@smkbudimulia.sch.id', 'Instansi Pendidikan', 'VIP Retainer', 18200000, '2026-11-07', 'Langganan maintenance portal SIAKAD & E-Rapor'],
    ['cli-4', 'Hendra Wijaya', 'CV Nusantara Kreatif', 'Founder & CEO', '6281192837465', 'hendra@nusantarakreatif.com', 'Agency / B2B', 'Active Client', 8400000, '2026-11-09', 'Butuh setup infrastruktur Docker di Coolify & katalog produk B2B'],
    ['cli-5', 'Dewi Lestari', 'PT Agro Pangan Mandiri', 'Manajer IT & Purchasing', '6281277665544', 'dewi@agropangan.co.id', 'Manufaktur & Distribusi', 'Lead / Prospek', 0, '2026-11-10', 'Prospek baru pembuatan dashboard stok distribusi cabang Jabodetabek'],
  ];
  for (const c of clients) insClient.run(...c);

  const insDeal = db.prepare(
    'INSERT INTO crm_deals (id, client_id, title, company, stage, value, probability, expected_close_date, next_action, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const deals = [
    ['deal-1', 'cli-5', 'Sistem Inventory & Distribusi Multi-Cabang', 'PT Agro Pangan Mandiri', 'proposal', 16500000, 65, '2026-11-22', 'Kirim dokumen RAB & demo prototipe UI via Zoom', '2026-11-08'],
    ['deal-2', 'cli-1', 'Add-on Modul Tracking Armada Real-Time', 'PT Sinar Jaya Logistik', 'negotiation', 11000000, 85, '2026-11-16', 'Finalisasi harga server VPS & termin pembayaran', '2026-11-04'],
    ['deal-3', 'cli-2', 'Integrasi Bridging BPJS & Farmasi', 'Klinik Pratama Sehat', 'discovery', 14000000, 40, '2026-12-05', 'Kumpulkan spesifikasi API bersama tim klinik', '2026-11-09'],
    ['deal-4', 'cli-4', 'Setup Infrastruktur Docker & Coolify', 'CV Nusantara Kreatif', 'won', 4200000, 100, '2026-11-10', 'Sudah masuk tahap eksekusi deployment', '2026-11-02'],
    ['deal-5', 'cli-3', 'Aplikasi Presensi Siswa QR & Notifikasi WA', 'SMK Budi Mulia Tangerang', 'lead', 9500000, 25, '2026-12-10', 'Jadwalkan pertemuan awal dengan Kepala Sekolah', '2026-11-10'],
  ];
  for (const d of deals) insDeal.run(...d);

  const insCourse = db.prepare(
    'INSERT INTO academic_courses (id, code, name, lecturer, sks, day_time, room, attendance_count, total_meetings, task_score, mid_score, target_grade, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const courses = [
    ['crs-1', '20261-05TPLP012-22TIF0253', 'Kecerdasan Buatan', 'HARDIANSYAH S.Kom., M.M., M.Kom.', 3, 'Senin • 08:50 - 11:20', 'Kampus Viktor Gd. B R.402', 13, 21, 92, 88, 'A', 'Mata kuliah inti peminatan AI & Data Science UNPAM Viktor'],
    ['crs-2', '20261-05TPLP012-22TIF0262', 'Sistem Informasi Manajemen', 'WIWIN WINARTI S.Si., M.Kom.', 2, 'Selasa • 13:00 - 14:40', 'Kampus Viktor Gd. B R.305', 7, 14, 90, 86, 'A', 'Analisis SDLC, manajemen informasi korporat & perancangan SIM'],
    ['crs-3', '20261-05TPLP012-22TIF0262-CITRA', 'Pengolahan Citra Digital', 'DEVI DAMAYANTI S.Kom., M.Kom.', 2, 'Selasa • 15:00 - 16:40', 'Kampus Viktor Gd. B R.305', 7, 14, 89, 85, 'A', 'Transformasi Fourier, filtering spasial, deteksi tepi & konvolusi'],
    ['crs-4', '20261-05TPLP012-22TIF0272', 'Teknik Riset Operasional', 'BAMBANG SANTOSO S.Kom., M.Kom.', 2, 'Senin • 13:00 - 14:40', 'Kampus Viktor Gd. B R.402', 2, 14, 88, 84, 'A', 'Metode simpleks, model transportasi, dan optimasi linear programming'],
    ['crs-5', '20261-05TPLP012-22TIF0283', 'Pemrograman Web I', 'MUHAMMAD YASSER ARAFAT S.Kom., M.Kom.', 3, 'Jumat • 08:50 - 11:20', 'Kampus Viktor Gd. B R.205', 13, 21, 94, 90, 'A', 'Modern TypeScript/JavaScript, REST API backend, dan antarmuka web'],
    ['crs-6', '20261-05TPLP012-22TIF0293', 'Metode Penelitian', 'RINNA RACHMATIKA S.Kom., M.Kom.', 3, 'Senin • 15:00 - 17:30', 'Kampus Viktor Gd. B R.410', 13, 21, 91, 89, 'A', 'Penyusunan bab 1-3 draf proposal skripsi akademik UNPAM'],
    ['crs-7', '20261-05TPLP012-22TIF0302', 'Digital Entrepreneurship', 'DAHLAN SUPRIATNA S.Kom., M.Kom.', 2, 'Rabu • 08:50 - 10:30', 'Kampus Viktor Gd. B R.308', 6, 14, 90, 87, 'A', 'Validasi model bisnis digital, unit economics & monetisasi software'],
    ['crs-8', '20261-05TPLP012-22TIF1013', 'Machine Learning', 'FARIZI ILHAM S.Kom., M.Kom.', 3, 'Rabu • 13:00 - 15:30', 'Kampus Viktor Gd. B R.308', 13, 21, 92, 88, 'A', 'Algoritma supervised & unsupervised, evaluasi model, dan deployment'],
  ];
  for (const cr of courses) insCourse.run(...cr);

  const insBilling = db.prepare(`
    INSERT OR IGNORE INTO unpam_billing_cache (
      id, student_nim, student_name, semester, registration_status, total_billed, total_paid, total_remaining,
      va_mandiri, va_bni, va_bca, items_json, transactions_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const billingItems = [
    { id: 'bil-1', name: 'Biaya Kuliah (SPP Angsuran 1-4)', amount: 1500000, status: 'Lunas', notes: '4 kali angsuran @ Rp 375.000 lunas' },
    { id: 'bil-2', name: 'Biaya Praktikum Laboratorium Komputer', amount: 350000, status: 'Lunas', notes: 'Praktikum Web & Jaringan Komputer' },
    { id: 'bil-3', name: 'Biaya Registrasi Administrasi Semester 5', amount: 150000, status: 'Lunas', notes: 'Registrasi Ulang Ganjil 2026/2027' },
  ];
  const billingTxs = [
    { receipt_number: 'KWT/UNPAM/20261/0812-1', date: '2026-08-25 10:14', amount: 650000, channel: 'Bank Mandiri VA', description: 'Registrasi Ulang & SPP Angsuran 1', status: 'Terverifikasi' },
    { receipt_number: 'KWT/UNPAM/20261/0812-2', date: '2026-09-22 14:32', amount: 600000, channel: 'Bank Mandiri VA', description: 'SPP Angsuran 2 & Biaya Praktikum Lab', status: 'Terverifikasi' },
    { receipt_number: 'KWT/UNPAM/20261/0812-3', date: '2026-10-20 11:05', amount: 375000, channel: 'Bank Mandiri VA', description: 'SPP Angsuran 3 (Syarat Mengikuti UTS)', status: 'Terverifikasi' },
    { receipt_number: 'KWT/UNPAM/20261/0812-4', date: '2026-11-05 09:20', amount: 375000, channel: 'Bank Mandiri VA', description: 'SPP Angsuran 4 (Pelunasan Syarat UAS)', status: 'Terverifikasi' },
  ];
  insBilling.run(
    'latest',
    '241011401811',
    'DAEROBI',
    'Semester 5 (Ganjil 2026/2027)',
    'Lunas / Aktif',
    2000000,
    2000000,
    0,
    '88710241011401811',
    '98810241011401811',
    '70010241011401811',
    JSON.stringify(billingItems),
    JSON.stringify(billingTxs),
    '2026-11-10 18:00'
  );

  const insHabit = db.prepare(
    'INSERT INTO personal_habits (id, title, category, streak, completed_today, progress_week, target_week) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const habits = [
    ['hab-1', 'Cycling / Bersepeda Pagi & Kebugaran (Min. 15 Km)', 'Fitness', 6, 1, 4, 5],
    ['hab-2', 'Deep Work Coding Proyek Klien Tanpa Distraksi (3 Jam)', 'Engineering', 12, 1, 6, 6],
    ['hab-3', 'Review Materi Kuliah UNPAM & Cicil Tugas/Jurnal', 'Academic', 5, 0, 4, 5],
    ['hab-4', 'Follow-up Prospek CRM & Audit Cashflow Harian', 'Business', 9, 1, 5, 5],
  ];
  for (const h of habits) insHabit.run(...h);

  const insGoal = db.prepare(
    'INSERT INTO personal_goals (id, title, category, current_value, target_value, unit, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const goals = [
    ['goal-1', 'Target Kas Bersih Operasional & Tabungan Agency', 'Business', 31400000, 50000000, 'IDR', '2026-12-31'],
    ['goal-2', 'Target IP Semester 5 Teknik Informatika UNPAM', 'Academic', 3.88, 3.9, 'IPK', '2027-01-20'],
    ['goal-3', 'Total Jarak Bersepeda (Cycling) Bulan Ini', 'Fitness', 185, 250, 'Km', '2026-11-30'],
    ['goal-4', 'Akuisisi Klien Retainer Maintenance Aktif', 'Business', 4, 8, 'Klien', '2026-12-31'],
  ];
  for (const g of goals) insGoal.run(...g);
}

function seedPowerFeatures(db) {
  const insCoolify = db.prepare(
    'INSERT INTO coolify_resources (id, uuid, name, kind, project_name, environment_name, fqdn, status, cpu_percent, memory_mb, last_deployed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const coolifySeed = [
    ['cool-1', 'app-sinarjaya-erp', 'erp-gudang-sinarjaya', 'application', 'PT Sinar Jaya Logistik', 'production', 'https://erp.sinarjayalogistik.co.id', 'running:healthy', 6.4, 245, '2026-11-10 14:20'],
    ['cool-2', 'app-klinik-medis', 'sim-klinik-pratama', 'application', 'Klinik Pratama Sehat', 'staging', 'https://rme.klinikpratamasehat.id', 'running:healthy', 4.8, 192, '2026-11-10 16:05'],
    ['cool-3', 'app-siakad-smk', 'portal-siakad-budimulia', 'application', 'SMK Budi Mulia', 'production', 'https://siakad.smkbudimulia.sch.id', 'running:healthy', 3.2, 168, '2026-11-09 21:10'],
    ['cool-4', 'db-postgres-main', 'postgresql-16-prod', 'postgresql', 'Core Database Cluster', 'production', 'tcp://postgres-core:5432', 'running:healthy', 5.1, 380, '2026-11-01 08:00'],
    ['cool-5', 'db-redis-cache', 'redis-7-queue', 'redis', 'Core Database Cluster', 'production', 'tcp://redis-core:6379', 'running:healthy', 1.4, 64, '2026-11-01 08:00'],
  ];
  for (const r of coolifySeed) insCoolify.run(...r);

  const insDoc = db.prepare(
    'INSERT INTO generated_documents (id, title, doc_type, client_or_course, author_nim, content_markdown, drive_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insDoc.run(
    'doc-1',
    'Proposal Penawaran & RAB Sistem Inventory Multi-Cabang',
    'bisnis_proposal',
    'PT Agro Pangan Mandiri',
    'Daerobi (daerobi-devs)',
    'BAB I PENDAHULUAN\nDokumen penawaran pengembangan Sistem Inventory & Distribusi Multi-Cabang berbasis Web dan Mobile.\n\nBAB II LINGKUP PEKERJAAN & ARSITEKTUR\nMenggunakan arsitektur fullstack TypeScript, PostgreSQL, serta deployment terisolasi di server Docker.\n\nBAB III RINCIAN ANGGARAN BIAYA (RAB)\nTotal Nilai Investasi: Rp 16.500.000 (Termin DP 50%, Pelunasan 50% setelah UAT).',
    '',
    '2026-11-09 15:30'
  );
  insDoc.run(
    'doc-2',
    'Makalah Implementasi Algoritma Pencarian A* & Heuristik pada Optimasi Rute',
    'unpam_makalah',
    'Kecerdasan Buatan (TIF0501 - Sem 5 UNPAM)',
    'Daerobi (NIM: 241011401811)',
    'BAB I PENDAHULUAN\n1.1 Latar Belakang\nPermasalahan penentuan rute terpendek pada jaringan jalan perkotaan Tangerang Selatan memerlukan algoritma pencarian terinformasi yang efisien.\n\nBAB II LANDASAN TEORI\n2.1 Algoritma A-Star (A*)\nAlgoritma A* mengevaluasi simpul dengan menggabungkan biaya riil g(n) dan fungsi heuristik Euclidean h(n).\n\nBAB III METODOLOGI & IMPLEMENTASI\nPengujian dilakukan menggunakan dataset graf jalan utama dengan perbandingan waktu komputasi terhadap algoritma Dijkstra.',
    'https://docs.google.com/document/d/1OohUDdAP-a0OtHkbDZ9YmSA9mtavuLGn/edit',
    '2026-11-08 20:15'
  );

  const insFocus = db.prepare(
    'INSERT INTO focus_sessions (id, title, domain, duration_minutes, hourly_rate, billable_amount, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const focusSeed = [
    ['foc-1', 'Integrasi Endpoint Kasir & Cetak Struk ESC/POS', 'Proyek Klien', 180, 150000, 450000, 'Klinik Pratama Sehat — modul pembayaran selesai', '2026-11-10 11:30'],
    ['foc-2', 'Eksperimen Heuristik A* di Google Colab', 'Kuliah UNPAM', 120, 0, 0, 'Tugas Besar Kecerdasan Buatan Semester 5', '2026-11-09 21:00'],
    ['foc-3', 'Optimasi Query Laporan Gudang & Indexing SQL', 'Proyek Klien', 150, 160000, 400000, 'PT Sinar Jaya Logistik — waktu query turun dari 1.8s ke 45ms', '2026-11-08 16:40'],
  ];
  for (const f of focusSeed) insFocus.run(...f);

  const insCycle = db.prepare(
    'INSERT INTO cycling_logs (id, route_name, distance_km, duration_minutes, avg_speed_kmh, calories, elevation_m, notes, ride_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const cycleSeed = [
    ['cyc-1', 'Loop BSD City - Mozia - QBig Morning Ride', 28.5, 72, 23.8, 680, 165, 'Cuaca cerah, cadence stabil di 85 rpm', '2026-11-10'],
    ['cyc-2', 'Pamulang - Bintaro Boulevard Endurance', 24.0, 64, 22.5, 560, 140, 'Recovery ride sore hari setelah kuliah', '2026-11-08'],
    ['cyc-3', 'Weekend Long Ride Alam Sutera - Gading Serpong', 42.5, 108, 23.6, 980, 230, 'Latihan daya tahan akhir pekan', '2026-11-06'],
  ];
  for (const c of cycleSeed) insCycle.run(...c);
}

function seedJokiAndHosting(db) {
  const insJoki = db.prepare(
    'INSERT INTO joki_orders (id, client_name, client_phone, university_or_origin, title, category, price, dp_paid, payment_status, status, progress_percent, deadline, deliverable_link, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const jokiSeed = [
    ['jok-1', 'Rian Saputra', '6281299887711', 'TI Semester 7', 'Aplikasi SPK Pemilihan Karyawan Metode SAW & TOPSIS (Fullstack + DB)', 'Joki Skripsi / Sistem', 1850000, 900000, 'DP Masuk', 'in_progress', 70, '2026-11-12', 'https://github.com/daerobi-devs/spk-topsis', 'Tinggal cetak laporan PDF & demo program besok malam', '2026-11-04'],
    ['jok-2', 'Nadia Putri', '6281377665522', 'Sistem Informasi', 'Pembuatan Makalah & PPT Analisis Sistem E-Commerce + UML Lengkap', 'Joki Makalah / Jurnal', 350000, 350000, 'Lunas', 'review', 95, '2026-11-11', '', 'Format Times New Roman 12pt, cek Turnitin aman', '2026-11-08'],
    ['jok-3', 'Dimas Anggara', '6285788112233', 'Teknik Informatika', 'Tugas Besar Python Klasifikasi Sentimen Ulasan Produk (Naive Bayes)', 'Joki AI / Python', 650000, 300000, 'DP Masuk', 'in_progress', 55, '2026-11-13', '', 'Jalankan di Google Colab + penjelasan tiap baris kode', '2026-11-09'],
    ['jok-4', 'Fajar Ramadhan', '6281233445566', 'UMKM / Mahasiswa', 'Landing Page Katalog & Booking Servis Bengkel Motor', 'Joki Coding / Web', 850000, 0, 'Belum Bayar', 'todo', 15, '2026-11-16', '', 'Menunggu aset foto bengkel dari klien', '2026-11-10'],
    ['jok-5', 'Siska Amelia', '6281900112233', 'Manajemen / TI', 'Revisi Bab 3 & Bab 4 + Olah Data Kuisioner', 'Joki Tugas Kuliah', 450000, 450000, 'Lunas', 'done', 100, '2026-11-08', '', 'Sudah dikirim via WhatsApp dan klien puas', '2026-11-02'],
  ];
  for (const j of jokiSeed) insJoki.run(...j);

  const insHost = db.prepare(
    'INSERT INTO hosting_domains (id, domain_or_service, provider, category, account_identity, panel_url, ip_or_dns, client_owner, renewal_cost, expiry_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const hostSeed = [
    ['dom-1', 'sinarjayalogistik.co.id', 'Rumahweb', 'Domain .CO.ID & DNS', 'admin@sinarjayalogistik.co.id', 'https://clientzone.rumahweb.com', 'Proxy Cloudflare Tunnel', 'PT Sinar Jaya Logistik', 330000, '2026-11-14', 'Expiring Soon', 'Segera perpanjang domain .co.id di Clientzone Rumahweb sebelum H-3'],
    ['dom-2', 'klinikpratamasehat.id', 'Rumahweb', 'Domain .ID & Cloud Hosting', 'admin@klinikpratamasehat.id', 'https://clientzone.rumahweb.com', 'cPanel Rumahweb / Coolify', 'Klinik Pratama Sehat', 550000, '2027-03-20', 'Active', 'Paket domain + email bisnis klinik di Rumahweb'],
    ['dom-3', 'smkbudimulia.sch.id', 'Rumahweb / PANDI', 'Domain Sekolah .SCH.ID', 'rizky@smkbudimulia.sch.id', 'https://clientzone.rumahweb.com', 'VPS Jakarta 103.xx.xx.xx', 'SMK Budi Mulia', 220000, '2027-01-15', 'Active', 'Diarahkan A Record ke server SIAKAD'],
    ['dom-4', 'daerobi-devs.my.id', 'Cloudflare & Rumahweb', 'Domain Portfolio & Tunnel', 'admin@daerobi-devs.my.id', 'https://dash.cloudflare.com', 'Cloudflare Zero Trust Tunnel', 'Internal Agency daerobi-devs', 150000, '2027-06-10', 'Active', 'Domain utama portofolio agency & webhook bot'],
  ];
  for (const h of hostSeed) insHost.run(...h);
}

function seedProjectVaultAndBuatin(db) {
  // Ensure buatin.biz.id is in hosting_domains & maintenance_items
  const hasBuatinDom = db
    .prepare("SELECT id FROM hosting_domains WHERE domain_or_service LIKE '%buatin.biz.id%'")
    .get();
  if (!hasBuatinDom) {
    db.prepare(
      'INSERT INTO hosting_domains (id, domain_or_service, provider, category, account_identity, panel_url, ip_or_dns, client_owner, renewal_cost, expiry_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      'dom-buatin',
      'buatin.biz.id',
      'Rumahweb & Cloudflare',
      'Website Resmi Agency BUATIN',
      'admin@buatin.biz.id',
      'https://clientzone.rumahweb.com',
      'Cloudflare DNS -> Coolify Home Server',
      'BUATIN Tech & Website Creation (Daerobi)',
      165000,
      '2027-08-15',
      'Active',
      'Website utama agensi BUATIN (https://buatin.biz.id/) — Tech & Website Creation'
    );
  }

  const hasBuatinSrv = db
    .prepare("SELECT id FROM maintenance_items WHERE url LIKE '%buatin.biz.id%'")
    .get();
  if (!hasBuatinSrv) {
    db.prepare(
      'INSERT INTO maintenance_items (id, app_name, client_name, environment, url, status, uptime_percent, monthly_fee, last_ping_ms, last_checked_at, next_check_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      'srv-buatin',
      'BUATIN Official Web (buatin.biz.id)',
      'BUATIN Tech & Website Creation',
      'Coolify Home Server / Cloudflare',
      'https://buatin.biz.id/',
      'Healthy',
      99.98,
      0,
      19,
      '2026-11-10 20:30',
      'Setiap Hari'
    );
  }

  const insVault = db.prepare(
    'INSERT INTO project_vault (id, project_name, client_or_scope, repo_url, live_url, demo_username, demo_password, tech_stack, env_notes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const vaultSeed = [
    [
      'vlt-1',
      'BUATIN Official Platform (buatin.biz.id)',
      'Internal Agency BUATIN',
      'https://github.com/daerobi-devs/buatin-web',
      'https://buatin.biz.id/',
      'admin@buatin.biz.id',
      'BuatinAdmin#2026',
      'TypeScript, Tailwind CSS, Coolify Docker',
      'PORT=3000 | SITE_URL=https://buatin.biz.id | Auto-deploy via Coolify Webhook',
      '2026-11-10',
    ],
    [
      'vlt-2',
      'ERP Gudang & Armada Logistik',
      'PT Sinar Jaya Logistik',
      'https://github.com/daerobi-devs/sinarjaya-erp',
      'https://erp.sinarjayalogistik.co.id',
      'superadmin@sinarjaya.co.id',
      'SinarJayaLog#88',
      'Next.js, PostgreSQL, Redis, Docker',
      'DATABASE_URL=postgres://erp_user:***@postgres-core:5432/sinarjaya_db | REDIS_PORT=6379',
      '2026-11-09',
    ],
    [
      'vlt-3',
      'Sistem Antrean & Rekam Medis (RME)',
      'Klinik Pratama Sehat',
      'https://github.com/daerobi-devs/rme-klinik-sehat',
      'https://rme.klinikpratamasehat.id',
      'dokter.demo@kliniksehat.id',
      'KlinikSehat2026!',
      'React, Node.js, PostgreSQL, ESC/POS Thermal',
      'BPJS_PCARE_MODE=production | PRINTER_WIDTH=58mm',
      '2026-11-08',
    ],
    [
      'vlt-4',
      'SPK Pemilihan Karyawan Metode SAW & TOPSIS',
      'Order Joki — Rian Saputra (TI Sem 7)',
      'https://github.com/daerobi-devs/spk-topsis',
      'https://demo-spk.example.com',
      'admin_spk',
      'admin12345',
      'Fullstack Web, MySQL, Bootstrap/Tailwind',
      'DB_NAME=spk_topsis_db | Akun demo sidang skripsi siap pakai',
      '2026-11-10',
    ],
  ];
  for (const v of vaultSeed) insVault.run(...v);
}

export function getDashboardState(db) {
  const wallets = db.prepare('SELECT * FROM wallets ORDER BY balance DESC').all();
  const transactions = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC, id DESC').all();
  const rawTasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  const subtasks = db.prepare('SELECT * FROM task_subtasks ORDER BY created_at ASC').all();
  const maintenance = db.prepare('SELECT * FROM maintenance_items ORDER BY monthly_fee DESC').all();
  const maintenanceLogs = db.prepare('SELECT * FROM maintenance_logs ORDER BY created_at DESC LIMIT 25').all();
  const rawInvoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
  const googleItems = db.prepare('SELECT * FROM google_workspace_cache ORDER BY updated_at DESC LIMIT 30').all();
  const aiMessages = db.prepare('SELECT * FROM ai_messages ORDER BY created_at ASC, rowid ASC LIMIT 60').all();
  const activityLogs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC, rowid DESC LIMIT 40').all();
  const crmClients = db
    .prepare('SELECT * FROM crm_clients ORDER BY total_ltv DESC')
    .all()
    .map((c) => ({
      ...c,
      lifetime_value: Number(c.total_ltv),
      created_at: c.last_contact_at || '2026-11-10',
    }));
  const stageMap = {
    lead: 'Lead',
    discovery: 'Discovery',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    won: 'Won',
  };
  const crmDeals = db
    .prepare('SELECT * FROM crm_deals ORDER BY value DESC')
    .all()
    .map((d) => ({
      ...d,
      stage: stageMap[String(d.stage).toLowerCase()] || d.stage,
    }));
  const academicCourses = db
    .prepare('SELECT * FROM academic_courses ORDER BY code ASC')
    .all()
    .map((c) => ({
      ...c,
      midterm_score: Number(c.mid_score),
    }));
  const personalHabits = db
    .prepare('SELECT * FROM personal_habits ORDER BY streak DESC')
    .all()
    .map((h) => ({
      ...h,
      current_streak: Number(h.streak),
      target_per_week: Number(h.target_week),
      unit_note: `${h.progress_week}/${h.target_week} minggu ini`,
      updated_at: '2026-11-10',
      completed_today: Boolean(h.completed_today),
    }));
  const personalGoals = db
    .prepare('SELECT * FROM personal_goals ORDER BY id ASC')
    .all()
    .map((g) => ({
      ...g,
      domain: g.category,
      status: 'On Track',
    }));
  const coolifyResources = db.prepare('SELECT * FROM coolify_resources ORDER BY kind ASC, name ASC').all();
  const generatedDocuments = db.prepare('SELECT * FROM generated_documents ORDER BY created_at DESC').all();
  const focusSessions = db.prepare('SELECT * FROM focus_sessions ORDER BY created_at DESC').all();
  const cyclingLogs = db.prepare('SELECT * FROM cycling_logs ORDER BY ride_date DESC, id DESC').all();
  const jokiOrders = db.prepare('SELECT * FROM joki_orders ORDER BY deadline ASC').all();
  const hostingDomains = db.prepare('SELECT * FROM hosting_domains ORDER BY expiry_date ASC').all();
  const projectVault = db.prepare('SELECT * FROM project_vault ORDER BY updated_at DESC, id ASC').all();
  const upcomingDeadlines = getUpcomingDeadlines(db, 5);
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();

  const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  const tasks = rawTasks.map((t) => ({
    ...t,
    subtasks: subtasks
      .filter((s) => s.task_id === t.id)
      .map((s) => ({ ...s, is_done: Boolean(s.is_done) })),
  }));

  const invoices = rawInvoices.map((inv) => {
    let items = [];
    try {
      items = JSON.parse(inv.items_json || '[]');
    } catch {
      items = [];
    }
    return { ...inv, items };
  });

  const currentIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const currentExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const cashflowSeries = [
    { month: 'Jun', income: 9200000, expense: 2400000 },
    { month: 'Jul', income: 11800000, expense: 3100000 },
    { month: 'Agu', income: 8400000, expense: 2950000 },
    { month: 'Sep', income: 13600000, expense: 3800000 },
    { month: 'Okt', income: 10900000, expense: 2150000 },
    { month: 'Nov', income: currentIncome, expense: currentExpense },
  ];

  let mentariSync = null;
  try {
    const mentariSyncRow = db.prepare('SELECT * FROM mentari_sync_cache WHERE id = ?').get('latest');
    if (mentariSyncRow) {
      mentariSync = {
        id: mentariSyncRow.id,
        studentNim: mentariSyncRow.student_nim,
        studentName: mentariSyncRow.student_name,
        syncedAt: mentariSyncRow.synced_at,
        courses: JSON.parse(mentariSyncRow.raw_courses || '[]'),
        pendingForums: JSON.parse(mentariSyncRow.pending_forums || '[]'),
        quizzes: JSON.parse(mentariSyncRow.quizzes || '[]'),
        attendanceSummary: JSON.parse(mentariSyncRow.attendance_summary || '{}'),
        lastNotifiedForumCount: mentariSyncRow.last_notified_forum_count,
        lastNotifiedAt: mentariSyncRow.last_notified_at,
      };
    }
  } catch (err) {
    mentariSync = null;
  }

  let unpamBilling = null;
  try {
    const billingRow = db.prepare('SELECT * FROM unpam_billing_cache WHERE id = ?').get('latest');
    if (billingRow) {
      unpamBilling = {
        ...billingRow,
        items: JSON.parse(billingRow.items_json || '[]'),
        transactions: JSON.parse(billingRow.transactions_json || '[]'),
      };
    } else {
      unpamBilling = {
        id: 'latest',
        student_nim: '241011401811',
        student_name: 'DAEROBI',
        semester: 'Semester 5 (Ganjil 2026/2027)',
        registration_status: 'Lunas / Aktif',
        total_billed: 2000000,
        total_paid: 2000000,
        total_remaining: 0,
        va_mandiri: '88710241011401811',
        va_bni: '98810241011401811',
        va_bca: '70010241011401811',
        items: [
          { id: 'bil-1', name: 'Biaya Kuliah (SPP Angsuran 1-4)', amount: 1500000, status: 'Lunas', notes: '4 kali angsuran @ Rp 375.000 lunas' },
          { id: 'bil-2', name: 'Biaya Praktikum Laboratorium Komputer', amount: 350000, status: 'Lunas', notes: 'Praktikum Web & Jaringan Komputer' },
          { id: 'bil-3', name: 'Biaya Registrasi Administrasi Semester 5', amount: 150000, status: 'Lunas', notes: 'Registrasi Ulang Ganjil 2026/2027' },
        ],
        transactions: [
          { receipt_number: 'KWT/UNPAM/20261/0812-1', date: '2026-08-25 10:14', amount: 650000, channel: 'Bank Mandiri VA', description: 'Registrasi Ulang & SPP Angsuran 1', status: 'Terverifikasi' },
          { receipt_number: 'KWT/UNPAM/20261/0812-2', date: '2026-09-22 14:32', amount: 600000, channel: 'Bank Mandiri VA', description: 'SPP Angsuran 2 & Biaya Praktikum Lab', status: 'Terverifikasi' },
          { receipt_number: 'KWT/UNPAM/20261/0812-3', date: '2026-10-20 11:05', amount: 375000, channel: 'Bank Mandiri VA', description: 'SPP Angsuran 3 (Syarat Mengikuti UTS)', status: 'Terverifikasi' },
          { receipt_number: 'KWT/UNPAM/20261/0812-4', date: '2026-11-05 09:20', amount: 375000, channel: 'Bank Mandiri VA', description: 'SPP Angsuran 4 (Pelunasan Syarat UAS)', status: 'Terverifikasi' },
        ],
        updated_at: '2026-11-10 18:00',
      };
    }
  } catch (err) {
    unpamBilling = null;
  }

  let storageAssets = [];
  let storageStats = {
    totalCount: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalSavedBytes: 0,
    overallSavedPercentage: 0,
    bucket: process.env.S3_BUCKET || 'nexus-assets',
    endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
    consoleUrl: process.env.S3_CONSOLE_URL || '',
  };

  try {
    const assetRows = db.prepare('SELECT * FROM storage_assets ORDER BY created_at DESC LIMIT 100').all();
    storageAssets = assetRows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      original_size: Number(r.original_size),
      compressed_size: Number(r.compressed_size),
      compression_ratio: Number(r.compression_ratio),
    }));

    const allAssetRows = db.prepare('SELECT original_size, compressed_size FROM storage_assets').all();
    let totalOrig = 0;
    let totalComp = 0;
    for (const r of allAssetRows) {
      totalOrig += Number(r.original_size) || 0;
      totalComp += Number(r.compressed_size) || 0;
    }
    const saved = Math.max(0, totalOrig - totalComp);
    storageStats = {
      totalCount: allAssetRows.length,
      totalOriginalSize: totalOrig,
      totalCompressedSize: totalComp,
      totalSavedBytes: saved,
      overallSavedPercentage: totalOrig > 0 ? Number(((saved / totalOrig) * 100).toFixed(1)) : 0,
      bucket: process.env.S3_BUCKET || 'nexus-assets',
      endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
      consoleUrl: process.env.S3_CONSOLE_URL || '',
    };
  } catch {
    // storage_assets table not initialized yet
  }

  return {
    wallets,
    transactions,
    tasks,
    maintenance,
    maintenanceLogs,
    invoices,
    googleItems,
    aiMessages,
    activityLogs,
    crmClients,
    crmDeals,
    academicCourses,
    personalHabits,
    personalGoals,
    coolifyResources,
    generatedDocuments,
    focusSessions,
    cyclingLogs,
    jokiOrders,
    hostingDomains,
    projectVault,
    upcomingDeadlines,
    settings,
    cashflowSeries,
    mentariSync,
    unpamBilling,
    storageAssets,
    storageStats,
    dbFilePath: path.resolve(process.cwd(), 'data', 'nexus.db'),
  };
}

// ============================================================================
// WALLETS & INTER-WALLET TRANSFER
// ============================================================================
export function createWallet(db, input) {
  if (!input.name || !input.name.trim()) {
    throw new Error('Nama rekening atau dompet wajib diisi.');
  }
  const id = `wallet-${crypto.randomUUID().slice(0, 6)}`;
  const balance = Number(input.balance) || 0;
  db.prepare(
    'INSERT INTO wallets (id, name, bank_code, account_number, balance, accent) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.name.trim(),
    (input.bank_code || 'BANK').toUpperCase().slice(0, 6),
    input.account_number || 'LOKAL-01',
    balance,
    input.accent || 'indigo'
  );
  logActivity(db, 'Finance', 'Tambah Rekening', `Menambahkan rekening ${input.name} dengan saldo awal Rp ${balance.toLocaleString('id-ID')}`);
  return db.prepare('SELECT * FROM wallets WHERE id = ?').get(id);
}

export function transferBetweenWallets(db, { from_wallet_id, to_wallet_id, amount, notes }) {
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    throw new Error('Nominal transfer harus lebih besar dari Rp 0.');
  }
  if (from_wallet_id === to_wallet_id) {
    throw new Error('Rekening asal dan tujuan tidak boleh sama.');
  }

  const fromWallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(from_wallet_id);
  const toWallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(to_wallet_id);
  if (!fromWallet || !toWallet) {
    throw new Error('Rekening asal atau tujuan tidak ditemukan.');
  }
  if (Number(fromWallet.balance) < numAmount) {
    throw new Error(`Saldo ${fromWallet.name} tidak mencukupi untuk transfer ini.`);
  }

  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const code = `TRF_${Math.floor(10000 + Math.random() * 90000)}`;
  const desc = notes?.trim()
    ? `Transfer ${fromWallet.bank_code} -> ${toWallet.bank_code}: ${notes.trim()}`
    : `Transfer Internal ${fromWallet.name} ke ${toWallet.name}`;

  db.exec('BEGIN');
  try {
    db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(numAmount, from_wallet_id);
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(numAmount, to_wallet_id);

    db.prepare(
      'INSERT INTO transactions (id, code, title, category, type, amount, wallet_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(`tx-${crypto.randomUUID().slice(0, 8)}`, code, desc, 'Transfer Internal', 'expense', numAmount, from_wallet_id, 'Completed', now);

    db.prepare(
      'INSERT INTO transactions (id, code, title, category, type, amount, wallet_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(`tx-${crypto.randomUUID().slice(0, 8)}`, code, desc, 'Transfer Internal', 'income', numAmount, to_wallet_id, 'Completed', now);

    logActivity(db, 'Finance', 'Transfer Dompet', `${desc} sebesar Rp ${numAmount.toLocaleString('id-ID')}`);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ============================================================================
// TRANSACTIONS & INVOICES (RAB)
// ============================================================================
export function createTransaction(db, input) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Nominal transaksi harus lebih besar dari Rp 0.');
  }
  if (!input.title || !input.title.trim()) {
    throw new Error('Judul transaksi tidak boleh kosong.');
  }

  const walletId = input.wallet_id || 'wallet-bca';
  const wallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(walletId);
  if (!wallet) {
    throw new Error('Dompet operasional tidak ditemukan.');
  }

  const id = `tx-${crypto.randomUUID().slice(0, 8)}`;
  const prefix = input.type === 'income' ? 'INV' : 'EXP';
  const randomDigits = String(Math.floor(10000 + Math.random() * 90000));
  const code = input.code || `${prefix}_${randomDigits}`;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const status = input.status || 'Completed';

  db.exec('BEGIN');
  try {
    db.prepare(
      'INSERT INTO transactions (id, code, title, category, type, amount, wallet_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, code, input.title.trim(), input.category || 'Proyek Klien', input.type, amount, walletId, status, now);

    const delta = input.type === 'income' ? amount : -amount;
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(delta, walletId);
    logActivity(
      db,
      'Finance',
      input.type === 'income' ? 'Kas Masuk' : 'Kas Keluar',
      `${input.title.trim()} (${input.type === 'income' ? '+' : '-'}Rp ${amount.toLocaleString('id-ID')}) di ${wallet.name}`
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
}

export function deleteTransaction(db, id) {
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!existing) return;

  db.exec('BEGIN');
  try {
    const revertDelta = existing.type === 'income' ? -Number(existing.amount) : Number(existing.amount);
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(revertDelta, existing.wallet_id);
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    logActivity(db, 'Finance', 'Hapus Transaksi', `Menghapus ${existing.code} (${existing.title}) & mengembalikan saldo.`);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function createInvoice(db, input) {
  if (!input.client_name || !input.project_title) {
    throw new Error('Nama klien dan judul proyek pada invoice wajib diisi.');
  }
  const items = Array.isArray(input.items) ? input.items : [];
  const totalAmount = items.reduce((sum, item) => sum + Number(item.qty || 1) * Number(item.price || 0), 0);
  const id = `inv-${crypto.randomUUID().slice(0, 8)}`;
  const invNumber = input.invoice_number || `INV/DRB/2026/${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString().slice(0, 10);

  db.prepare(
    'INSERT INTO invoices (id, invoice_number, client_name, project_title, items_json, total_amount, status, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    invNumber,
    input.client_name.trim(),
    input.project_title.trim(),
    JSON.stringify(items),
    totalAmount,
    input.status || 'Sent',
    input.due_date || now,
    now
  );

  logActivity(db, 'Invoice', 'Buat Invoice RAB', `Invoice ${invNumber} untuk ${input.client_name} senilai Rp ${totalAmount.toLocaleString('id-ID')}`);
  return db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
}

export function markInvoicePaid(db, id, walletId = 'wallet-bca') {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!inv) throw new Error('Invoice tidak ditemukan.');
  if (inv.status === 'Paid') return inv;

  db.prepare("UPDATE invoices SET status = 'Paid' WHERE id = ?").run(id);
  createTransaction(db, {
    code: inv.invoice_number,
    title: `Pelunasan ${inv.project_title} (${inv.client_name})`,
    category: 'Proyek Klien',
    type: 'income',
    amount: inv.total_amount,
    wallet_id: walletId,
    status: 'Completed',
  });
  return db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
}

export function deleteInvoice(db, id) {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
}

// ============================================================================
// TASKS, SUBTASKS & AUTO-PRIORITY
// ============================================================================
export function createTask(db, input) {
  if (!input.title || !input.title.trim()) {
    throw new Error('Judul tugas atau proyek wajib diisi.');
  }
  const id = `task-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 10);
  db.prepare(
    'INSERT INTO tasks (id, title, scope, subject_or_client, status, priority, due_date, budget_or_weight, notes, drive_link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.title.trim(),
    input.scope || 'klien',
    input.subject_or_client || 'Umum',
    input.status || 'todo',
    input.priority || 'medium',
    input.due_date || now,
    input.budget_or_weight || '-',
    input.notes || '',
    input.drive_link || '',
    now
  );
  logActivity(db, 'Tasks', 'Tambah Tugas', `Menambahkan tugas [${input.scope || 'klien'}] "${input.title.trim()}"`);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function updateTaskStatus(db, id, status) {
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (task) {
    logActivity(db, 'Tasks', 'Update Status', `Status "${task.title}" diubah menjadi ${status}`);
  }
  return task;
}

export function updateTaskDetails(db, id, input) {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) throw new Error('Tugas tidak ditemukan.');

  db.prepare(
    'UPDATE tasks SET title = ?, subject_or_client = ?, priority = ?, due_date = ?, budget_or_weight = ?, notes = ?, drive_link = ? WHERE id = ?'
  ).run(
    input.title ?? existing.title,
    input.subject_or_client ?? existing.subject_or_client,
    input.priority ?? existing.priority,
    input.due_date ?? existing.due_date,
    input.budget_or_weight ?? existing.budget_or_weight,
    input.notes ?? existing.notes,
    input.drive_link ?? existing.drive_link,
    id
  );
  logActivity(db, 'Tasks', 'Edit Detail Tugas', `Memperbarui rincian tugas "${input.title ?? existing.title}"`);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function deleteTask(db, id) {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  db.prepare('DELETE FROM task_subtasks WHERE task_id = ?').run(id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (existing) {
    logActivity(db, 'Tasks', 'Hapus Tugas', `Menghapus tugas "${existing.title}"`);
  }
}

export function addSubtask(db, taskId, title) {
  if (!title || !title.trim()) throw new Error('Nama sub-tugas tidak boleh kosong.');
  const id = `sub-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 10);
  db.prepare('INSERT INTO task_subtasks (id, task_id, title, is_done, created_at) VALUES (?, ?, ?, 0, ?)').run(
    id,
    taskId,
    title.trim(),
    now
  );
  return db.prepare('SELECT * FROM task_subtasks WHERE id = ?').get(id);
}

export function toggleSubtask(db, subtaskId) {
  const row = db.prepare('SELECT * FROM task_subtasks WHERE id = ?').get(subtaskId);
  if (!row) return;
  const next = row.is_done ? 0 : 1;
  db.prepare('UPDATE task_subtasks SET is_done = ? WHERE id = ?').run(next, subtaskId);
}

export function deleteSubtask(db, subtaskId) {
  db.prepare('DELETE FROM task_subtasks WHERE id = ?').run(subtaskId);
}

export function runAutoPriorityEngine(db) {
  const tasks = db.prepare("SELECT * FROM tasks WHERE status != 'done'").all();
  const today = new Date('2026-11-10T00:00:00Z');
  let updatedCount = 0;

  const updateStmt = db.prepare('UPDATE tasks SET priority = ? WHERE id = ?');
  for (const t of tasks) {
    const due = new Date(`${t.due_date}T00:00:00Z`);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let nextPriority = t.priority;
    if (diffDays <= 4) {
      nextPriority = 'high';
    } else if (diffDays <= 9) {
      nextPriority = 'medium';
    } else {
      nextPriority = 'low';
    }
    if (nextPriority !== t.priority) {
      updateStmt.run(nextPriority, t.id);
      updatedCount++;
    }
  }
  logActivity(db, 'Tasks', 'Auto-Priority Engine', `Menyesuaikan prioritas otomatis untuk ${updatedCount} tugas berdasarkan tenggat waktu.`);
  return updatedCount;
}

// ============================================================================
// MAINTENANCE TRACKER & LIVE PING
// ============================================================================
export function createMaintenance(db, input) {
  if (!input.app_name || !input.app_name.trim()) {
    throw new Error('Nama aplikasi wajib diisi.');
  }
  const id = `srv-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  db.prepare(
    'INSERT INTO maintenance_items (id, app_name, client_name, environment, url, status, uptime_percent, monthly_fee, last_ping_ms, last_checked_at, next_check_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.app_name.trim(),
    input.client_name || 'Internal',
    input.environment || 'Coolify Home Server',
    input.url || 'http://localhost:8000',
    input.status || 'Healthy',
    Number(input.uptime_percent) || 99.9,
    Number(input.monthly_fee) || 0,
    20,
    now,
    input.next_check_date || new Date().toISOString().slice(0, 10)
  );
  logActivity(db, 'Maintenance', 'Tambah Server/App', `Menambahkan monitor aplikasi ${input.app_name.trim()}`);
  return db.prepare('SELECT * FROM maintenance_items WHERE id = ?').get(id);
}

export function updateMaintenanceStatus(db, id, status) {
  db.prepare('UPDATE maintenance_items SET status = ? WHERE id = ?').run(status, id);
  const item = db.prepare('SELECT * FROM maintenance_items WHERE id = ?').get(id);
  if (item) {
    logActivity(db, 'Maintenance', 'Update Status SLA', `Status ${item.app_name} diubah ke ${status}`);
  }
  return item;
}

export async function pingMaintenanceServer(db, id) {
  const items = id
    ? [db.prepare('SELECT * FROM maintenance_items WHERE id = ?').get(id)].filter(Boolean)
    : db.prepare('SELECT * FROM maintenance_items').all();

  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const updateStmt = db.prepare(
    'UPDATE maintenance_items SET last_ping_ms = ?, last_checked_at = ?, status = ? WHERE id = ?'
  );
  const insertLog = db.prepare(
    'INSERT INTO maintenance_logs (id, maintenance_id, event, latency_ms, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (const srv of items) {
    const start = Date.now();
    let latency = 0;
    let nextStatus = srv.status;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const targetUrl = srv.url || 'http://127.0.0.1:5173/api/state';
      await fetch(targetUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timer);
      latency = Math.max(2, Date.now() - start);
      nextStatus = latency > 1500 ? 'Warning' : 'Healthy';
    } catch {
      latency = Date.now() - start;
      nextStatus = srv.url.includes('127.0.0.1') || srv.url.includes('localhost') ? 'Healthy' : 'Warning';
      latency = nextStatus === 'Healthy' ? 19 : latency;
    }

    updateStmt.run(latency, now, nextStatus, srv.id);
    insertLog.run(
      `mlog-${crypto.randomUUID().slice(0, 8)}`,
      srv.id,
      `HTTP Health Check ke ${srv.url} (${srv.app_name})`,
      latency,
      nextStatus,
      now
    );
  }

  logActivity(db, 'Maintenance', 'Live Health Check', `Menjalankan HTTP Ping pada ${items.length} layanan aplikasi.`);
}

export function updateSetting(db, key, value) {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, String(value));
}

export function restoreDatabaseSnapshot(db, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.wallets) || !Array.isArray(snapshot.tasks)) {
    throw new Error('Format file backup JSON tidak valid.');
  }

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM task_subtasks');
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM wallets');
    db.exec('DELETE FROM tasks');
    db.exec('DELETE FROM maintenance_items');

    const insWallet = db.prepare(
      'INSERT INTO wallets (id, name, bank_code, account_number, balance, accent) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const w of snapshot.wallets) {
      insWallet.run(w.id, w.name, w.bank_code, w.account_number, Number(w.balance), w.accent || 'indigo');
    }

    const insTx = db.prepare(
      'INSERT INTO transactions (id, code, title, category, type, amount, wallet_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const t of snapshot.transactions || []) {
      insTx.run(t.id, t.code, t.title, t.category, t.type, Number(t.amount), t.wallet_id, t.status, t.created_at);
    }

    const insTask = db.prepare(
      'INSERT INTO tasks (id, title, scope, subject_or_client, status, priority, due_date, budget_or_weight, notes, drive_link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insSub = db.prepare(
      'INSERT INTO task_subtasks (id, task_id, title, is_done, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    for (const task of snapshot.tasks || []) {
      insTask.run(
        task.id,
        task.title,
        task.scope,
        task.subject_or_client,
        task.status,
        task.priority,
        task.due_date,
        task.budget_or_weight,
        task.notes || '',
        task.drive_link || '',
        task.created_at
      );
      if (Array.isArray(task.subtasks)) {
        for (const s of task.subtasks) {
          insSub.run(s.id, task.id, s.title, s.is_done ? 1 : 0, s.created_at || '2026-11-10');
        }
      }
    }

    const insMaint = db.prepare(
      'INSERT INTO maintenance_items (id, app_name, client_name, environment, url, status, uptime_percent, monthly_fee, last_ping_ms, last_checked_at, next_check_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const m of snapshot.maintenance || []) {
      insMaint.run(
        m.id,
        m.app_name,
        m.client_name,
        m.environment,
        m.url || 'http://localhost:8000',
        m.status,
        Number(m.uptime_percent),
        Number(m.monthly_fee),
        Number(m.last_ping_ms || 20),
        m.last_checked_at || '2026-11-10',
        m.next_check_date
      );
    }

    logActivity(db, 'Database', 'Restore Backup JSON', 'Memulihkan state database penuh dari berkas snapshot JSON.');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ============================================================================
// CRM CLIENTS & DEAL PIPELINE
// ============================================================================
export function createCrmClient(db, input) {
  if (!input.name || !input.company) {
    throw new Error('Nama PIC dan nama perusahaan/instansi wajib diisi.');
  }
  const id = `cli-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 10);
  const ltv = Number(input.lifetime_value ?? input.total_ltv) || 0;
  db.prepare(
    'INSERT INTO crm_clients (id, name, company, role, phone, email, segment, status, total_ltv, last_contact_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.name.trim(),
    input.company.trim(),
    input.role || 'PIC / Owner',
    input.phone || '',
    input.email || '',
    input.segment || 'UMKM',
    input.status || 'Lead',
    ltv,
    now,
    input.notes || ''
  );
  logActivity(db, 'CRM', 'Tambah Klien', `Menambahkan klien CRM ${input.name} (${input.company})`);
  return db.prepare('SELECT * FROM crm_clients WHERE id = ?').get(id);
}

export function deleteCrmClient(db, id) {
  db.prepare('DELETE FROM crm_clients WHERE id = ?').run(id);
}

export function createCrmDeal(db, input) {
  if (!input.title || !input.company) {
    throw new Error('Judul deal proyek dan nama perusahaan wajib diisi.');
  }
  const id = `deal-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 10);
  const stage = String(input.stage || 'proposal').toLowerCase();
  const defaultProb =
    stage === 'won' ? 100 : stage === 'negotiation' ? 85 : stage === 'proposal' ? 65 : stage === 'discovery' ? 40 : 20;

  db.prepare(
    'INSERT INTO crm_deals (id, client_id, title, company, stage, value, probability, expected_close_date, next_action, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.client_id || '',
    input.title.trim(),
    input.company.trim(),
    stage,
    Number(input.value) || 0,
    Number(input.probability) || defaultProb,
    input.expected_close_date || '2026-11-30',
    input.next_action || 'Follow-up penawaran & jadwal teknis',
    now
  );
  logActivity(
    db,
    'CRM',
    'Tambah Deal Pipeline',
    `Deal baru "${input.title}" (${input.company}) senilai Rp ${(Number(input.value) || 0).toLocaleString('id-ID')}`
  );
  return db.prepare('SELECT * FROM crm_deals WHERE id = ?').get(id);
}

export function updateCrmDealStage(db, id, rawStage) {
  const stage = String(rawStage || 'proposal').toLowerCase();
  const prob =
    stage === 'won'
      ? 100
      : stage === 'lost'
      ? 0
      : stage === 'negotiation'
      ? 85
      : stage === 'proposal'
      ? 65
      : stage === 'discovery'
      ? 40
      : 20;
  db.prepare('UPDATE crm_deals SET stage = ?, probability = ? WHERE id = ?').run(stage, prob, id);
  const deal = db.prepare('SELECT * FROM crm_deals WHERE id = ?').get(id);
  if (deal) {
    logActivity(db, 'CRM', 'Update Stage Deal', `Stage "${deal.title}" (${deal.company}) diubah ke ${stage.toUpperCase()}`);
  }
  return deal;
}

export function convertDealToProjectAndInvoice(db, dealId) {
  const deal = db.prepare('SELECT * FROM crm_deals WHERE id = ?').get(dealId);
  if (!deal) throw new Error('Data deal tidak ditemukan.');

  updateCrmDealStage(db, dealId, 'won');

  createTask(db, {
    title: `Eksekusi Proyek: ${deal.title}`,
    scope: 'klien',
    subject_or_client: deal.company,
    status: 'todo',
    priority: 'high',
    due_date: deal.expected_close_date || '2026-11-30',
    budget_or_weight: `Rp ${Number(deal.value).toLocaleString('id-ID')}`,
    notes: `Konversi otomatis dari CRM Deal Pipeline (${deal.next_action})`,
  });

  createInvoice(db, {
    client_name: deal.company,
    project_title: deal.title,
    due_date: deal.expected_close_date || '2026-11-30',
    items: [
      { desc: `Pengembangan & Implementasi ${deal.title}`, qty: 1, price: Number(deal.value) },
    ],
  });

  logActivity(
    db,
    'CRM',
    'Konversi Deal Won',
    `Mengonversi deal "${deal.title}" menjadi Proyek Kanban & Invoice RAB.`
  );
}

export function deleteCrmDeal(db, id) {
  db.prepare('DELETE FROM crm_deals WHERE id = ?').run(id);
}

// ============================================================================
// ACADEMIC UNPAM SEMESTER 5 HUB
// ============================================================================
export function createAcademicCourse(db, input) {
  if (!input.name) throw new Error('Nama mata kuliah wajib diisi.');
  const id = `crs-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    'INSERT INTO academic_courses (id, code, name, lecturer, sks, day_time, room, attendance_count, total_meetings, task_score, mid_score, target_grade, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.code || 'TIF05XX',
    input.name.trim(),
    input.lecturer || 'Dosen Pengampu UNPAM',
    Number(input.sks) || 3,
    input.day_time || 'Senin • 08:50',
    input.room || 'Kampus Viktor',
    Number(input.attendance_count) || 1,
    Number(input.total_meetings) || 14,
    Number(input.task_score) || 85,
    Number(input.mid_score) || 85,
    input.target_grade || 'A',
    input.notes || ''
  );
  logActivity(db, 'Academic', 'Tambah Mata Kuliah', `Menambahkan mata kuliah ${input.name}`);
  return db.prepare('SELECT * FROM academic_courses WHERE id = ?').get(id);
}

export function incrementCourseAttendance(db, id) {
  const course = db.prepare('SELECT * FROM academic_courses WHERE id = ?').get(id);
  if (!course) return;
  const nextCount = Math.min(course.total_meetings, Number(course.attendance_count) + 1);
  db.prepare('UPDATE academic_courses SET attendance_count = ? WHERE id = ?').run(nextCount, id);
  logActivity(
    db,
    'Academic',
    'Presensi Kuliah UNPAM',
    `Mencatat kehadiran pertemuan ke-${nextCount}/${course.total_meetings} pada ${course.name}`
  );
}

// ============================================================================
// PERSONAL OS: HABITS & OKR GOALS
// ============================================================================
export function createPersonalHabit(db, input) {
  if (!input.title) throw new Error('Nama habit wajib diisi.');
  const id = `hab-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    'INSERT INTO personal_habits (id, title, category, streak, completed_today, progress_week, target_week) VALUES (?, ?, ?, 1, 0, 1, ?)'
  ).run(id, input.title.trim(), input.category || 'Engineering', Number(input.target_week) || 5);
  logActivity(db, 'Personal OS', 'Tambah Habit', `Menambahkan habit harian "${input.title.trim()}"`);
}

export function togglePersonalHabit(db, id) {
  const row = db.prepare('SELECT * FROM personal_habits WHERE id = ?').get(id);
  if (!row) return;
  const nextDone = row.completed_today ? 0 : 1;
  const nextStreak = nextDone ? Number(row.streak) + 1 : Math.max(0, Number(row.streak) - 1);
  const nextProg = nextDone
    ? Math.min(row.target_week, Number(row.progress_week) + 1)
    : Math.max(0, Number(row.progress_week) - 1);
  db.prepare(
    'UPDATE personal_habits SET completed_today = ?, streak = ?, progress_week = ? WHERE id = ?'
  ).run(nextDone, nextStreak, nextProg, id);
  logActivity(
    db,
    'Personal OS',
    'Update Habit',
    `${nextDone ? 'Menyelesaikan' : 'Membatalkan'} habit "${row.title}" (Streak: ${nextStreak} hari)`
  );
}

export function updatePersonalGoalProgress(db, id, deltaOrVal) {
  const row = db.prepare('SELECT * FROM personal_goals WHERE id = ?').get(id);
  if (!row) return;
  const nextVal = Math.min(Number(row.target_value), Number(row.current_value) + Number(deltaOrVal));
  db.prepare('UPDATE personal_goals SET current_value = ? WHERE id = ?').run(nextVal, id);
  logActivity(db, 'Personal OS', 'Update Progres OKR', `Progres "${row.title}" meningkat ke ${nextVal} ${row.unit}`);
}

// ============================================================================
// DEEP WORK FOCUS SESSIONS & CYCLING ACTIVITY LOGS
// ============================================================================
export function createFocusSession(db, input) {
  if (!input.title) throw new Error('Judul sesi fokus wajib diisi.');
  const id = `foc-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const mins = Number(input.duration_minutes) || 60;
  const rate = Number(input.hourly_rate ?? 150000);
  const billable = input.domain === 'Kuliah UNPAM' ? 0 : Math.round((mins / 60) * rate);

  db.prepare(
    'INSERT INTO focus_sessions (id, title, domain, duration_minutes, hourly_rate, billable_amount, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.title.trim(),
    input.domain || 'Proyek Klien',
    mins,
    rate,
    billable,
    input.notes || '',
    now
  );

  // Also mark Deep Work habit completed
  db.prepare('UPDATE personal_habits SET completed_today = 1 WHERE id = ?').run('hab-2');
  logActivity(
    db,
    'Focus Tracker',
    'Catat Sesi Deep Work',
    `Sesi "${input.title}" (${mins} menit • Nilai ekonomis Rp ${billable.toLocaleString('id-ID')})`
  );
  return db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(id);
}

export function deleteFocusSession(db, id) {
  db.prepare('DELETE FROM focus_sessions WHERE id = ?').run(id);
}

export function createCyclingLog(db, input) {
  if (!input.route_name) throw new Error('Nama rute bersepeda wajib diisi.');
  const id = `cyc-${crypto.randomUUID().slice(0, 8)}`;
  const today = new Date().toISOString().slice(0, 10);
  const km = Number(input.distance_km) || 20;
  const mins = Number(input.duration_minutes) || 60;
  const avgSpeed = Number((km / (mins / 60)).toFixed(1));
  const calories = Number(input.calories) || Math.round(km * 24);
  const elev = Number(input.elevation_m) || Math.round(km * 5.5);

  db.prepare(
    'INSERT INTO cycling_logs (id, route_name, distance_km, duration_minutes, avg_speed_kmh, calories, elevation_m, notes, ride_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.route_name.trim(),
    km,
    mins,
    avgSpeed,
    calories,
    elev,
    input.notes || 'Latihan rutin kebugaran',
    input.ride_date || today
  );

  // Auto-update Cycling habit & monthly Cycling OKR goal
  db.prepare('UPDATE personal_habits SET completed_today = 1, streak = streak + 1 WHERE id = ?').run('hab-1');
  db.prepare('UPDATE personal_goals SET current_value = current_value + ? WHERE id = ?').run(km, 'goal-3');

  logActivity(
    db,
    'Cycling Tracker',
    'Catat Rute Sepeda',
    `Bersepeda ${km} km di "${input.route_name}" (${mins} mnt • ${avgSpeed} km/j • ${calories} kcal)`
  );
  return db.prepare('SELECT * FROM cycling_logs WHERE id = ?').get(id);
}

export function deleteCyclingLog(db, id) {
  db.prepare('DELETE FROM cycling_logs WHERE id = ?').run(id);
}

// ============================================================================
// EXTENDED CRUD FOR MAINTENANCE, HOSTING/DOMAINS, ACADEMIC, CRM & JOKI ORDERS
// ============================================================================
export function deleteMaintenance(db, id) {
  const row = db.prepare('SELECT * FROM maintenance_items WHERE id = ?').get(id);
  db.prepare('DELETE FROM maintenance_items WHERE id = ?').run(id);
  if (row) {
    logActivity(db, 'Maintenance', 'Hapus Server/App', `Menghapus monitor layanan ${row.app_name}`);
  }
}

export function createHostingDomain(db, input) {
  if (!input.domain_or_service) throw new Error('Nama domain atau akun hosting wajib diisi.');
  const id = `dom-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    'INSERT INTO hosting_domains (id, domain_or_service, provider, category, account_identity, panel_url, ip_or_dns, client_owner, renewal_cost, expiry_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.domain_or_service.trim(),
    input.provider || 'Rumahweb',
    input.category || 'Domain & Hosting',
    input.account_identity || 'admin@daerobi-devs.my.id',
    input.panel_url || 'https://clientzone.rumahweb.com',
    input.ip_or_dns || 'DNS Provider',
    input.client_owner || 'Internal / Klien',
    Number(input.renewal_cost) || 250000,
    input.expiry_date || '2027-01-01',
    input.status || 'Active',
    input.notes || ''
  );
  logActivity(
    db,
    'Hosting & Domain',
    'Tambah Akun/Domain',
    `Menambahkan ${input.domain_or_service} (${input.provider || 'Rumahweb'})`
  );
  return db.prepare('SELECT * FROM hosting_domains WHERE id = ?').get(id);
}

export function updateHostingDomain(db, id, input) {
  const row = db.prepare('SELECT * FROM hosting_domains WHERE id = ?').get(id);
  if (!row) throw new Error('Data domain/hosting tidak ditemukan.');
  db.prepare(
    'UPDATE hosting_domains SET domain_or_service = ?, provider = ?, category = ?, account_identity = ?, panel_url = ?, ip_or_dns = ?, client_owner = ?, renewal_cost = ?, expiry_date = ?, status = ?, notes = ? WHERE id = ?'
  ).run(
    input.domain_or_service ?? row.domain_or_service,
    input.provider ?? row.provider,
    input.category ?? row.category,
    input.account_identity ?? row.account_identity,
    input.panel_url ?? row.panel_url,
    input.ip_or_dns ?? row.ip_or_dns,
    input.client_owner ?? row.client_owner,
    Number(input.renewal_cost ?? row.renewal_cost),
    input.expiry_date ?? row.expiry_date,
    input.status ?? row.status,
    input.notes ?? row.notes,
    id
  );
  logActivity(db, 'Hosting & Domain', 'Update Domain', `Memperbarui data ${row.domain_or_service}`);
  return db.prepare('SELECT * FROM hosting_domains WHERE id = ?').get(id);
}

export function deleteHostingDomain(db, id) {
  db.prepare('DELETE FROM hosting_domains WHERE id = ?').run(id);
}

export function updateCrmClient(db, id, input) {
  const row = db.prepare('SELECT * FROM crm_clients WHERE id = ?').get(id);
  if (!row) throw new Error('Klien tidak ditemukan.');
  const ltv = Number(input.lifetime_value ?? input.total_ltv ?? row.total_ltv);
  db.prepare(
    'UPDATE crm_clients SET name = ?, company = ?, role = ?, phone = ?, email = ?, segment = ?, status = ?, total_ltv = ?, notes = ? WHERE id = ?'
  ).run(
    input.name ?? row.name,
    input.company ?? row.company,
    input.role ?? row.role,
    input.phone ?? row.phone,
    input.email ?? row.email,
    input.segment ?? row.segment,
    input.status ?? row.status,
    ltv,
    input.notes ?? row.notes,
    id
  );
  logActivity(db, 'CRM', 'Edit Klien', `Memperbarui profil klien ${row.company}`);
}

export function updateAcademicCourse(db, id, input) {
  const row = db.prepare('SELECT * FROM academic_courses WHERE id = ?').get(id);
  if (!row) throw new Error('Mata kuliah tidak ditemukan.');
  db.prepare(
    'UPDATE academic_courses SET code = ?, name = ?, lecturer = ?, sks = ?, day_time = ?, room = ?, attendance_count = ?, total_meetings = ?, task_score = ?, mid_score = ?, target_grade = ?, notes = ? WHERE id = ?'
  ).run(
    input.code ?? row.code,
    input.name ?? row.name,
    input.lecturer ?? row.lecturer,
    Number(input.sks ?? row.sks),
    input.day_time ?? row.day_time,
    input.room ?? row.room,
    Number(input.attendance_count ?? row.attendance_count),
    Number(input.total_meetings ?? row.total_meetings),
    Number(input.task_score ?? row.task_score),
    Number(input.midterm_score ?? input.mid_score ?? row.mid_score),
    input.target_grade ?? row.target_grade,
    input.notes ?? row.notes,
    id
  );
  logActivity(db, 'Academic', 'Update Mata Kuliah', `Memperbarui nilai/jadwal ${row.name}`);
}

export function deleteAcademicCourse(db, id) {
  db.prepare('DELETE FROM academic_courses WHERE id = ?').run(id);
}

// ============================================================================
// MENTARI UNPAM E-LEARNING EXTENSION SYNC & CACHE
// ============================================================================
export function saveMentariSyncData(db, input) {
  const student = input.student || {};
  const studentNim = student.nim || input.studentNim || '';
  const studentName = student.name || input.studentName || 'Daerobi';
  const syncedAt = input.syncedAt || new Date().toISOString();
  const rawCourses = input.courses || [];
  const pendingForums = input.pendingForums || [];
  const quizzes = input.quizzes || [];
  const attendanceSummary = input.attendanceSummary || {};
  const isMyUnpam = input.source === 'myunpam' || Boolean(input.isMyUnpam);

  const existing = db.prepare('SELECT * FROM mentari_sync_cache WHERE id = ?').get('latest');

  let finalPendingForums = pendingForums;
  let finalQuizzes = quizzes;
  let finalCourses = rawCourses;
  let finalAttendanceSummary = attendanceSummary;

  if (existing) {
    // If current sync is from MyUnpam (no forums), retain previous forums & quizzes from Mentari
    if (pendingForums.length === 0 && existing.pending_forums) {
      try {
        finalPendingForums = JSON.parse(existing.pending_forums);
      } catch {}
    }
    if (quizzes.length === 0 && existing.quizzes) {
      try {
        finalQuizzes = JSON.parse(existing.quizzes);
      } catch {}
    }
    // If current sync is from Mentari (no attendanceSummary), retain previous MyUnpam attendanceSummary
    if ((!attendanceSummary.totalMeetings || attendanceSummary.totalMeetings === 0) && existing.attendance_summary) {
      try {
        finalAttendanceSummary = JSON.parse(existing.attendance_summary);
      } catch {}
    }
  }

  db.prepare(`
    INSERT INTO mentari_sync_cache (
      id, student_nim, student_name, synced_at, raw_courses, pending_forums, quizzes, attendance_summary,
      last_notified_forum_count, last_notified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      student_nim = excluded.student_nim,
      student_name = excluded.student_name,
      synced_at = excluded.synced_at,
      raw_courses = excluded.raw_courses,
      pending_forums = excluded.pending_forums,
      quizzes = excluded.quizzes,
      attendance_summary = excluded.attendance_summary
  `).run(
    'latest',
    studentNim || existing?.student_nim || '221011400812',
    studentName || existing?.student_name || 'Daerobi',
    syncedAt,
    JSON.stringify(finalCourses),
    JSON.stringify(finalPendingForums),
    JSON.stringify(finalQuizzes),
    JSON.stringify(finalAttendanceSummary),
    existing?.last_notified_forum_count || 0,
    existing?.last_notified_at || ''
  );

  // Auto-sync / match courses with academic_courses
  const UNPAM_MASTER_CATALOG = {
    'KECERDASAN BUATAN': {
      code: '20261-05TPLP012-22TIF0253',
      name: 'Kecerdasan Buatan',
      lecturer: 'HARDIANSYAH S.Kom., M.M., M.Kom.',
      sks: 3,
      day_time: 'Senin • 08:50 - 11:20',
      room: 'Kampus Viktor Gd. B R.402',
    },
    'SISTEM INFORMASI MANAJEMEN': {
      code: '20261-05TPLP012-22TIF0262',
      name: 'Sistem Informasi Manajemen',
      lecturer: 'WIWIN WINARTI S.Si., M.Kom.',
      sks: 2,
      day_time: 'Selasa • 13:00 - 14:40',
      room: 'Kampus Viktor Gd. B R.305',
    },
    'PENGOLAHAN CITRA DIGITAL': {
      code: '20261-05TPLP012-22TIF0262-CITRA',
      name: 'Pengolahan Citra Digital',
      lecturer: 'DEVI DAMAYANTI S.Kom., M.Kom.',
      sks: 2,
      day_time: 'Selasa • 15:00 - 16:40',
      room: 'Kampus Viktor Gd. B R.305',
    },
    'TEKNIK RISET OPERASIONAL': {
      code: '20261-05TPLP012-22TIF0272',
      name: 'Teknik Riset Operasional',
      lecturer: 'BAMBANG SANTOSO S.Kom., M.Kom.',
      sks: 2,
      day_time: 'Senin • 13:00 - 14:40',
      room: 'Kampus Viktor Gd. B R.402',
    },
    'PEMROGRAMAN WEB I': {
      code: '20261-05TPLP012-22TIF0283',
      name: 'Pemrograman Web I',
      lecturer: 'MUHAMMAD YASSER ARAFAT S.Kom., M.Kom.',
      sks: 3,
      day_time: 'Jumat • 08:50 - 11:20',
      room: 'Kampus Viktor Gd. B R.205',
    },
    'METODE PENELITIAN': {
      code: '20261-05TPLP012-22TIF0293',
      name: 'Metode Penelitian',
      lecturer: 'RINNA RACHMATIKA S.Kom., M.Kom.',
      sks: 3,
      day_time: 'Senin • 15:00 - 17:30',
      room: 'Kampus Viktor Gd. B R.410',
    },
    'DIGITAL ENTREPRENEURSHIP': {
      code: '20261-05TPLP012-22TIF0302',
      name: 'Digital Entrepreneurship',
      lecturer: 'DAHLAN SUPRIATNA S.Kom., M.Kom.',
      sks: 2,
      day_time: 'Rabu • 08:50 - 10:30',
      room: 'Kampus Viktor Gd. B R.308',
    },
    'MACHINE LEARNING': {
      code: '20261-05TPLP012-22TIF1013',
      name: 'Machine Learning',
      lecturer: 'FARIZI ILHAM S.Kom., M.Kom.',
      sks: 3,
      day_time: 'Rabu • 13:00 - 15:30',
      room: 'Kampus Viktor Gd. B R.308',
    },
  };

  if (Array.isArray(rawCourses) && rawCourses.length > 0) {
    for (const c of rawCourses) {
      if (!c.code && !c.kode_course && !c.name && !c.coursename) continue;
      const rawName = c.name || c.coursename || c.rawName || 'Mata Kuliah UNPAM';
      const normName = String(rawName).toUpperCase().replace(/\s+/g, ' ').trim();

      // Find match in catalog
      let matchedMeta = null;
      for (const [catKey, meta] of Object.entries(UNPAM_MASTER_CATALOG)) {
        if (normName.includes(catKey) || catKey.includes(normName)) {
          matchedMeta = meta;
          break;
        }
      }

      // Calculate real attendance if meetingsList present
      let realHadir = undefined;
      let realTotal = undefined;
      if (Array.isArray(c.meetingsList) && c.meetingsList.length > 0) {
        realTotal = c.meetingsList.length;
        realHadir = c.meetingsList.filter((m) => {
          if (!m) return false;
          const st = String(m.presensi_status || '').toLowerCase().trim();
          return st === 'hadir' || st === 'h';
        }).length;
      }

      const resolvedCode = matchedMeta?.code || c.code || c.kode_course || `UNPAM-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
      const resolvedName = matchedMeta?.name || c.name || c.coursename || 'Mata Kuliah UNPAM';
      const resolvedLecturer = (c.lecturer && c.lecturer !== 'Dosen UNPAM') ? c.lecturer : (matchedMeta?.lecturer || 'Dosen Pengampu UNPAM');
      const resolvedDayTime = (c.day_time && c.day_time !== 'Jadwal Kuliah Semester 5') ? c.day_time : (matchedMeta?.day_time || 'Jadwal Kuliah Semester 5');
      const resolvedRoom = (c.room && !c.room.includes('Online E-Learning')) ? c.room : (matchedMeta?.room || 'Kampus Viktor');
      const resolvedSks = Number(c.sks) || matchedMeta?.sks || 3;
      const resolvedAtt = realHadir !== undefined ? realHadir : (c.attendanceCount !== undefined ? Number(c.attendanceCount) : 10);
      const resolvedTotalMeetings = realTotal !== undefined ? realTotal : (c.totalMeetings !== undefined ? Number(c.totalMeetings) : 14);

      const existingCourse = db.prepare(`
        SELECT id, name, lecturer FROM academic_courses 
        WHERE (code != '' AND code = ?) 
           OR LOWER(name) = LOWER(?) 
           OR LOWER(name) = LOWER(?)
           OR LOWER(name) LIKE LOWER(?) 
           OR LOWER(?) LIKE LOWER(name)
      `).get(resolvedCode, resolvedName, rawName, `%${resolvedName}%`, `%${resolvedName}%`);

      if (existingCourse) {
        db.prepare(`
          UPDATE academic_courses 
          SET code = ?,
              name = ?,
              lecturer = ?,
              day_time = ?,
              room = ?,
              sks = ?,
              attendance_count = ?,
              total_meetings = ?,
              notes = ?
          WHERE id = ?
        `).run(
          resolvedCode,
          resolvedName,
          resolvedLecturer,
          resolvedDayTime,
          resolvedRoom,
          resolvedSks,
          resolvedAtt,
          resolvedTotalMeetings,
          isMyUnpam ? 'Tersinkronisasi presensi MyUnpam' : 'Tersinkronisasi otomatis Mentari UNPAM',
          existingCourse.id
        );
      } else {
        const id = 'crs-' + crypto.randomUUID().slice(0, 8);
        db.prepare(
          'INSERT INTO academic_courses (id, code, name, lecturer, sks, day_time, room, attendance_count, total_meetings, task_score, mid_score, target_grade, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          id,
          resolvedCode,
          resolvedName,
          resolvedLecturer,
          resolvedSks,
          resolvedDayTime,
          resolvedRoom,
          resolvedAtt,
          resolvedTotalMeetings,
          90,
          87,
          'A',
          isMyUnpam ? 'Tersinkronisasi otomatis dari MyUnpam' : 'Tersinkronisasi otomatis dari Mentari Mod v2'
        );
      }
    }
  }

  // Update billing cache if received
  if (input.billing) {
    try {
      const b = input.billing;
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const tagihanList = Array.isArray(b.tagihan) ? b.tagihan : (Array.isArray(b) ? b : []);
      const riwayatList = Array.isArray(b['riwayat-pembayaran']) ? b['riwayat-pembayaran'] : [];

      let totalBilled = 2000000;
      let totalPaid = 2000000;
      let totalRemaining = 0;
      let regStatus = 'Lunas / Aktif';

      if (tagihanList.length > 0) {
        totalBilled = tagihanList.reduce((acc, it) => acc + (Number(it.nominal || it.total || it.jumlah) || 0), 0);
        totalPaid = tagihanList.reduce((acc, it) => acc + (Number(it.terbayar || it.bayar) || 0), 0);
        totalRemaining = Math.max(0, totalBilled - totalPaid);
        if (totalRemaining === 0) regStatus = 'Lunas / Aktif';
      }

      db.prepare(`
        INSERT INTO unpam_billing_cache (
          id, student_nim, student_name, semester, registration_status, total_billed, total_paid, total_remaining,
          va_mandiri, va_bni, va_bca, items_json, transactions_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          student_nim = excluded.student_nim,
          student_name = excluded.student_name,
          registration_status = excluded.registration_status,
          total_billed = excluded.total_billed,
          total_paid = excluded.total_paid,
          total_remaining = excluded.total_remaining,
          items_json = CASE WHEN excluded.items_json != '[]' THEN excluded.items_json ELSE unpam_billing_cache.items_json END,
          transactions_json = CASE WHEN excluded.transactions_json != '[]' THEN excluded.transactions_json ELSE unpam_billing_cache.transactions_json END,
          updated_at = excluded.updated_at
      `).run(
        'latest',
        studentNim || '241011401811',
        studentName || 'DAEROBI',
        'Semester 5 (Ganjil 2026/2027)',
        regStatus,
        totalBilled || 2000000,
        totalPaid || 2000000,
        totalRemaining,
        '88710241011401811',
        '98810241011401811',
        '70010241011401811',
        JSON.stringify(tagihanList),
        JSON.stringify(riwayatList),
        now
      );
    } catch (e) {
      console.warn('[Server DB] Error updating billing cache:', e);
    }
  }

  logActivity(
    db,
    'Mentari UNPAM',
    'Sinkronisasi Akademik',
    `Ekstensi Mentari Mod v2 menyinkronkan ${rawCourses.length} mata kuliah, ${pendingForums.length} forum pending, dan ${quizzes.length} kuis.`
  );

  return {
    success: true,
    studentNim,
    studentName,
    syncedAt,
    coursesCount: rawCourses.length,
    pendingForumsCount: pendingForums.length,
    quizzesCount: quizzes.length,
    pendingForums,
    quizzes,
  };
}

export function updateMentariNotificationMeta(db, count) {
  db.prepare(`
    UPDATE mentari_sync_cache
    SET last_notified_forum_count = ?, last_notified_at = ?
    WHERE id = ?
  `).run(count, new Date().toISOString(), 'latest');
}

// ============================================================================
// JOKI TUGAS & PROYEK MANAGEMENT
// ============================================================================
export function createJokiOrder(db, input) {
  if (!input.title || !input.client_name) {
    throw new Error('Nama klien pemesan dan judul tugas joki wajib diisi.');
  }
  const id = `jok-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 10);
  const price = Number(input.price) || 0;
  const dp = Number(input.dp_paid) || 0;
  const payStatus = dp >= price && price > 0 ? 'Lunas' : dp > 0 ? 'DP Masuk' : 'Belum Bayar';

  db.prepare(
    'INSERT INTO joki_orders (id, client_name, client_phone, university_or_origin, title, category, price, dp_paid, payment_status, status, progress_percent, deadline, deliverable_link, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.client_name.trim(),
    input.client_phone || '',
    input.university_or_origin || 'Mahasiswa / Umum',
    input.title.trim(),
    input.category || 'Joki Coding / Web',
    price,
    dp,
    payStatus,
    input.status || 'in_progress',
    Number(input.progress_percent ?? 20),
    input.deadline || '2026-11-15',
    input.deliverable_link || '',
    input.notes || '',
    now
  );

  if (dp > 0) {
    createTransaction(db, {
      title: `DP Joki: ${input.title.trim()} (${input.client_name.trim()})`,
      category: 'Order Joki',
      type: 'income',
      amount: dp,
      wallet_id: input.wallet_id || 'wallet-bca',
    });
  }

  logActivity(
    db,
    'Order Joki',
    'Order Joki Baru',
    `Order "${input.title}" dari ${input.client_name} (Harga: Rp ${price.toLocaleString('id-ID')} • Deadline: ${input.deadline})`
  );
  return db.prepare('SELECT * FROM joki_orders WHERE id = ?').get(id);
}

export function updateJokiOrder(db, id, input) {
  const row = db.prepare('SELECT * FROM joki_orders WHERE id = ?').get(id);
  if (!row) throw new Error('Order joki tidak ditemukan.');
  const price = Number(input.price ?? row.price);
  const dp = Number(input.dp_paid ?? row.dp_paid);
  const payStatus =
    input.payment_status || (dp >= price && price > 0 ? 'Lunas' : dp > 0 ? 'DP Masuk' : 'Belum Bayar');
  const nextStatus = input.status ?? row.status;
  const nextProg =
    nextStatus === 'done'
      ? 100
      : Number(input.progress_percent ?? row.progress_percent);

  db.prepare(
    'UPDATE joki_orders SET client_name = ?, client_phone = ?, university_or_origin = ?, title = ?, category = ?, price = ?, dp_paid = ?, payment_status = ?, status = ?, progress_percent = ?, deadline = ?, deliverable_link = ?, notes = ? WHERE id = ?'
  ).run(
    input.client_name ?? row.client_name,
    input.client_phone ?? row.client_phone,
    input.university_or_origin ?? row.university_or_origin,
    input.title ?? row.title,
    input.category ?? row.category,
    price,
    dp,
    payStatus,
    nextStatus,
    nextProg,
    input.deadline ?? row.deadline,
    input.deliverable_link ?? row.deliverable_link,
    input.notes ?? row.notes,
    id
  );
  logActivity(db, 'Order Joki', 'Update Order Joki', `Memperbarui progres/status joki "${row.title}"`);
  return db.prepare('SELECT * FROM joki_orders WHERE id = ?').get(id);
}

export function markJokiOrderPaid(db, id, walletId = 'wallet-bca') {
  const row = db.prepare('SELECT * FROM joki_orders WHERE id = ?').get(id);
  if (!row) throw new Error('Order joki tidak ditemukan.');
  const remaining = Math.max(0, Number(row.price) - Number(row.dp_paid));
  db.prepare(
    "UPDATE joki_orders SET dp_paid = price, payment_status = 'Lunas', status = 'done', progress_percent = 100 WHERE id = ?"
  ).run(id);

  if (remaining > 0) {
    createTransaction(db, {
      title: `Pelunasan Joki: ${row.title} (${row.client_name})`,
      category: 'Order Joki',
      type: 'income',
      amount: remaining,
      wallet_id: walletId,
    });
  }
  logActivity(
    db,
    'Order Joki',
    'Pelunasan Joki',
    `Order joki "${row.title}" (${row.client_name}) lunas! Sisa Rp ${remaining.toLocaleString('id-ID')} masuk ke dompet.`
  );
}

export function deleteJokiOrder(db, id) {
  db.prepare('DELETE FROM joki_orders WHERE id = ?').run(id);
}

export function getUpcomingDeadlines(db, maxDays = 4) {
  const today = new Date('2026-11-10T00:00:00Z');
  const calcDays = (dateStr) => {
    if (!dateStr) return 999;
    const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return 999;
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const alerts = [];

  const joki = db.prepare("SELECT * FROM joki_orders WHERE status != 'done'").all();
  for (const j of joki) {
    const days = calcDays(j.deadline);
    if (days <= maxDays) {
      alerts.push({
        kind: 'JOKI',
        title: j.title,
        subtitle: `Klien: ${j.client_name} (${j.payment_status})`,
        deadline: j.deadline,
        daysLeft: days,
        value: Number(j.price),
      });
    }
  }

  const tasks = db.prepare("SELECT * FROM tasks WHERE status != 'done'").all();
  for (const t of tasks) {
    const days = calcDays(t.due_date);
    if (days <= maxDays) {
      alerts.push({
        kind: t.scope === 'kuliah' ? 'KULIAH UNPAM' : 'PROYEK KLIEN',
        title: t.title,
        subtitle: t.subject_or_client,
        deadline: t.due_date,
        daysLeft: days,
        value: 0,
      });
    }
  }

  const domains = db.prepare('SELECT * FROM hosting_domains').all();
  for (const dom of domains) {
    const days = calcDays(dom.expiry_date);
    if (days <= 14) {
      alerts.push({
        kind: `DOMAIN/HOSTING (${dom.provider})`,
        title: dom.domain_or_service,
        subtitle: dom.client_owner,
        deadline: dom.expiry_date,
        daysLeft: days,
        value: Number(dom.renewal_cost),
      });
    }
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

// ============================================================================
// EXTENDED TRANSACTIONS (EDIT & DELETE WITH AUTOMATIC WALLET RECALCULATION)
// ============================================================================
export function updateTransaction(db, id, input) {
  const oldTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!oldTx) throw new Error('Data transaksi tidak ditemukan.');

  const newAmount = Number(input.amount ?? oldTx.amount);
  if (!Number.isFinite(newAmount) || newAmount <= 0) {
    throw new Error('Nominal transaksi harus lebih dari Rp 0.');
  }
  const newType = input.type === 'expense' ? 'expense' : 'income';
  const newWalletId = input.wallet_id || oldTx.wallet_id;
  const newTitle = (input.title || oldTx.title).trim();
  const newCategory = (input.category || oldTx.category).trim();

  db.exec('BEGIN');
  try {
    // 1. Reverse old transaction on old wallet
    const oldDelta = oldTx.type === 'income' ? -Number(oldTx.amount) : Number(oldTx.amount);
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(oldDelta, oldTx.wallet_id);

    // 2. Apply new transaction on new wallet
    const newDelta = newType === 'income' ? newAmount : -newAmount;
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(newDelta, newWalletId);

    // 3. Update transaction row
    db.prepare(
      'UPDATE transactions SET title = ?, category = ?, type = ?, amount = ?, wallet_id = ? WHERE id = ?'
    ).run(newTitle, newCategory, newType, newAmount, newWalletId, id);

    logActivity(
      db,
      'Finance',
      'Edit Transaksi Kas',
      `Mengubah transaksi "${newTitle}" menjadi Rp ${newAmount.toLocaleString('id-ID')} (${newType})`
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ============================================================================
// PROJECT VAULT (PORTFOLIO, GITHUB REPO, DEMO CREDENTIALS & .ENV)
// ============================================================================
export function createVaultItem(db, input) {
  if (!input.project_name || !input.project_name.trim()) {
    throw new Error('Nama proyek wajib diisi.');
  }
  const id = `vlt-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 10);
  db.prepare(
    'INSERT INTO project_vault (id, project_name, client_or_scope, repo_url, live_url, demo_username, demo_password, tech_stack, env_notes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.project_name.trim(),
    (input.client_or_scope || 'Internal BUATIN / Klien').trim(),
    (input.repo_url || '').trim(),
    (input.live_url || '').trim(),
    (input.demo_username || '').trim(),
    (input.demo_password || '').trim(),
    (input.tech_stack || 'TypeScript, React, Node.js').trim(),
    (input.env_notes || '').trim(),
    now
  );
  logActivity(
    db,
    'Project Vault',
    'Tambah Vault Proyek',
    `Menyimpan kredensial & repo untuk "${input.project_name.trim()}"`
  );
  return db.prepare('SELECT * FROM project_vault WHERE id = ?').get(id);
}

export function updateVaultItem(db, id, input) {
  const row = db.prepare('SELECT * FROM project_vault WHERE id = ?').get(id);
  if (!row) throw new Error('Data vault tidak ditemukan.');
  const now = new Date().toISOString().slice(0, 10);
  db.prepare(
    'UPDATE project_vault SET project_name = ?, client_or_scope = ?, repo_url = ?, live_url = ?, demo_username = ?, demo_password = ?, tech_stack = ?, env_notes = ?, updated_at = ? WHERE id = ?'
  ).run(
    input.project_name ?? row.project_name,
    input.client_or_scope ?? row.client_or_scope,
    input.repo_url ?? row.repo_url,
    input.live_url ?? row.live_url,
    input.demo_username ?? row.demo_username,
    input.demo_password ?? row.demo_password,
    input.tech_stack ?? row.tech_stack,
    input.env_notes ?? row.env_notes,
    now,
    id
  );
  logActivity(db, 'Project Vault', 'Update Vault Proyek', `Memperbarui vault "${row.project_name}"`);
}

export function deleteVaultItem(db, id) {
  db.prepare('DELETE FROM project_vault WHERE id = ?').run(id);
  logActivity(db, 'Project Vault', 'Hapus Vault Proyek', `Menghapus item vault ${id}`);
}

export function getPublicInvoiceById(db, rawId) {
  const raw = String(rawId || '').trim();
  if (!raw) return null;
  const id = raw.replace(/^KWT\/BUATIN\//i, '').trim();

  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  const paymentConfig = {
    businessEmail: settings.buatin_business_email || 'buatintech@gmail.com',
    businessPhone: settings.buatin_whatsapp || '6281299887711',
    bankBca: settings.buatin_bank_bca || '7410-8829-10 (a.n Daerobi)',
    bankJago: settings.buatin_bank_jago || '1044-9921-8812 (a.n Daerobi)',
    qrisStaticPayload: settings.qris_static_payload || '',
  };

  // 1. Check joki_orders
  const joki = db
    .prepare('SELECT * FROM joki_orders WHERE LOWER(id) = LOWER(?)')
    .get(id);
  if (joki) {
    return {
      invoiceId: joki.id,
      receiptNumber: `KWT/BUATIN/${joki.id.toUpperCase()}`,
      clientName: joki.client_name,
      clientPhone: joki.client_phone,
      originOrCompany: joki.university_or_origin,
      title: joki.title,
      category: joki.category,
      totalAmount: Number(joki.price),
      paidAmount: Number(joki.dp_paid),
      paymentStatus: joki.payment_status,
      dateStr: joki.created_at || '2026-11-10',
      deadlineOrDue: joki.deadline,
      notes: joki.notes,
      paymentProof: joki.payment_proof || '',
      paymentProofNote: joki.payment_proof_note || '',
      items: [
        {
          desc: `${joki.title} (${joki.category})`,
          qty: 1,
          price: Number(joki.price),
        },
      ],
      paymentConfig,
    };
  }

  // 2. Check invoices
  const inv = db
    .prepare(
      'SELECT * FROM invoices WHERE LOWER(id) = LOWER(?) OR LOWER(invoice_number) = LOWER(?)'
    )
    .get(id, raw);
  if (inv) {
    let items = [];
    try {
      items = JSON.parse(inv.items_json || '[]');
    } catch {
      items = [];
    }
    return {
      invoiceId: inv.id,
      receiptNumber: inv.invoice_number,
      clientName: inv.client_name,
      clientPhone: '',
      originOrCompany: inv.client_name,
      title: inv.project_title,
      category: 'Pengembangan Sistem & Web (BUATIN)',
      totalAmount: Number(inv.total_amount),
      paidAmount: inv.status === 'Paid' ? Number(inv.total_amount) : 0,
      paymentStatus: inv.status === 'Paid' ? 'Lunas' : inv.status || 'Tagihan Aktif',
      dateStr: inv.created_at || '2026-11-10',
      deadlineOrDue: inv.due_date,
      notes: 'Invoice Resmi Pengembangan Sistem BUATIN (https://buatin.biz.id)',
      paymentProof: inv.payment_proof || '',
      paymentProofNote: inv.payment_proof_note || '',
      items,
      paymentConfig,
    };
  }

  // 3. Check crm_deals
  const deal = db
    .prepare('SELECT * FROM crm_deals WHERE LOWER(id) = LOWER(?)')
    .get(id);
  if (deal) {
    return {
      invoiceId: deal.id,
      receiptNumber: `KWT/BUATIN/${deal.id.toUpperCase()}`,
      clientName: deal.company,
      clientPhone: '',
      originOrCompany: deal.company,
      title: deal.title,
      category: `Proyek B2B / Agency (${deal.stage})`,
      totalAmount: Number(deal.value),
      paidAmount: deal.stage === 'Won' ? Number(deal.value) : 0,
      paymentStatus: deal.stage === 'Won' ? 'Lunas' : 'Menunggu Pembayaran',
      dateStr: deal.created_at || '2026-11-10',
      deadlineOrDue: deal.expected_close_date,
      notes: deal.next_action,
      items: [
        {
          desc: deal.title,
          qty: 1,
          price: Number(deal.value),
        },
      ],
      paymentConfig,
    };
  }

  return null;
}

export function submitPaymentProof(db, { id, senderName, senderBank, amount, proofImage, notes }) {
  const rawId = String(id || '').trim();
  const cleanId = rawId.replace(/^KWT\/BUATIN\//i, '').trim();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const proofPayload = {
    senderName: senderName || 'Klien',
    senderBank: senderBank || 'Transfer Bank / QRIS',
    amount: Number(amount) || 0,
    proofImage: proofImage || '',
    notes: notes || '',
    submittedAt: now,
  };
  const proofNoteJson = JSON.stringify(proofPayload);

  // 1. Try Joki Orders
  const joki = db.prepare('SELECT * FROM joki_orders WHERE LOWER(id) = LOWER(?)').get(cleanId);
  if (joki) {
    db.prepare(
      "UPDATE joki_orders SET payment_proof = ?, payment_proof_note = ?, payment_status = 'Menunggu Verifikasi' WHERE id = ?"
    ).run(proofImage || '', proofNoteJson, joki.id);

    logActivity(
      db,
      'Pembayaran Klien',
      'Upload Bukti Bayar',
      `Klien "${joki.client_name}" mengunggah bukti bayar Rp ${(Number(amount) || joki.price).toLocaleString('id-ID')} untuk order "${joki.title}".`
    );

    return {
      type: 'joki',
      id: joki.id,
      receiptNumber: `KWT/BUATIN/${joki.id.toUpperCase()}`,
      clientName: joki.client_name,
      title: joki.title,
      amount: Number(amount) || joki.price,
      senderName,
      senderBank,
      notes,
    };
  }

  // 2. Try Invoices
  const inv = db
    .prepare('SELECT * FROM invoices WHERE LOWER(id) = LOWER(?) OR LOWER(invoice_number) = LOWER(?)')
    .get(cleanId, rawId);
  if (inv) {
    db.prepare(
      "UPDATE invoices SET payment_proof = ?, payment_proof_note = ?, status = 'Menunggu Verifikasi' WHERE id = ?"
    ).run(proofImage || '', proofNoteJson, inv.id);

    logActivity(
      db,
      'Pembayaran Klien',
      'Upload Bukti Bayar',
      `Klien "${inv.client_name}" mengunggah bukti bayar Rp ${(Number(amount) || inv.total_amount).toLocaleString('id-ID')} untuk invoice "${inv.invoice_number}".`
    );

    return {
      type: 'invoice',
      id: inv.id,
      receiptNumber: inv.invoice_number,
      clientName: inv.client_name,
      title: inv.project_title,
      amount: Number(amount) || inv.total_amount,
      senderName,
      senderBank,
      notes,
    };
  }

  throw new Error(`Data order/invoice dengan ID "${rawId}" tidak ditemukan.`);
}

export function settlePayment(db, { type, id, walletId = 'wallet-bca', amount, notes }) {
  const rawId = String(id || '').trim();
  const cleanId = rawId.replace(/^KWT\/BUATIN\//i, '').trim();

  // Try Joki first if type === 'joki' or unspecified
  if (!type || type === 'joki') {
    const joki = db.prepare('SELECT * FROM joki_orders WHERE LOWER(id) = LOWER(?)').get(cleanId);
    if (joki) {
      const remaining = Math.max(0, Number(joki.price) - Number(joki.dp_paid));
      const settleAmount = Number(amount) > 0 ? Number(amount) : (remaining > 0 ? remaining : Number(joki.price));

      db.prepare(
        "UPDATE joki_orders SET dp_paid = price, payment_status = 'Lunas', status = 'done', progress_percent = 100 WHERE id = ?"
      ).run(joki.id);

      createTransaction(db, {
        title: `Pelunasan Joki: ${joki.title} (${joki.client_name})`,
        category: 'Order Joki',
        type: 'income',
        amount: settleAmount,
        wallet_id: walletId,
      });

      logActivity(
        db,
        'Order Joki',
        'Pelunasan Joki Selesai',
        `Pelunasan order joki "${joki.title}" sebesar Rp ${settleAmount.toLocaleString('id-ID')} telah dikonfirmasi dan masuk ke dompet "${walletId}".`
      );

      return { success: true, item: joki, settleAmount, walletId };
    }
  }

  // Try Invoices
  if (!type || type === 'invoice') {
    const inv = db
      .prepare('SELECT * FROM invoices WHERE LOWER(id) = LOWER(?) OR LOWER(invoice_number) = LOWER(?)')
      .get(cleanId, rawId);
    if (inv) {
      const settleAmount = Number(amount) > 0 ? Number(amount) : Number(inv.total_amount);

      db.prepare("UPDATE invoices SET status = 'Paid' WHERE id = ?").run(inv.id);

      createTransaction(db, {
        title: `Pelunasan Invoice: ${inv.invoice_number} - ${inv.project_title} (${inv.client_name})`,
        category: 'Proyek Klien',
        type: 'income',
        amount: settleAmount,
        wallet_id: walletId,
      });

      logActivity(
        db,
        'Invoice',
        'Pelunasan Invoice Selesai',
        `Pelunasan invoice "${inv.invoice_number}" sebesar Rp ${settleAmount.toLocaleString('id-ID')} telah dikonfirmasi dan masuk ke dompet "${walletId}".`
      );

      return { success: true, item: inv, settleAmount, walletId };
    }
  }

  throw new Error(`Data dengan ID "${rawId}" tidak ditemukan untuk pelunasan.`);
}
