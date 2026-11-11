# Nexus Desktop Command Center — System & UI/UX Design Spec

## 1. Intent & Why
Daerobi membutuhkan satu aplikasi **Desktop Command Center** personal yang berjalan **100% lokal** di folder `d:\nexus dahaboard` untuk menghilangkan fragmentasi antara:
1. **Tugas Kuliah UNPAM** (Teknik Informatika Semester 5: jadwal, deadline tugas, progres).
2. **Proyek Freelance / Agency (`daerobi-devs`)** (Kanban board proyek klien, nilai kontrak, progres sprint).
3. **Maintenance Tracker Aplikasi Klien** (status server/aplikasi, jadwal pemeliharaan, biaya langganan/retainer).
4. **Manajemen Kas & Anggaran Terpadu** (saldo rekening/dompet operasional, arus kas masuk/keluar dalam Rupiah, batas pengeluaran bulanan, backup/export lokal).

## 2. Goals, Non-Goals & Anti-Goals (`/ponytail` Enforced)

### Goals (MVP Local-First)
- **Zero External Dependency Database**: Seluruh data tersimpan otomatis di `d:\nexus dahaboard\data\nexus.db` menggunakan modul bawaan Node.js v24 (`node:sqlite` — native C++ SQLite engine tanpa kompilasi native addon tambahan).
- **Instant Startup & Desktop App Window**: Berjalan dengan 1 perintah (`npm run dev` atau klik `start-desktop.bat` yang membuka window native WebView2 / Edge App Mode tanpa address bar).
- **Vertix-Inspired Bento Grid + `/taste-skill` Polish**:
  - Layout mengikuti referensi gambar **Vertix** (3-column Bento Grid di atas + 2-column Bento di bawah), tetapi seluruh navigasi utama disatukan di **Collapsible Left Sidebar** (tanpa tab horizontal menumpuk di atas).
  - Mendukung **Dark Obsidian Theme (`#090a0f`)** dan **Clean Light Theme (`#f4f5f8`)** seperti referensi gambar.
  - **Zero Unicode Emoji**: 100% menggunakan ikon vektor resmi **Lucide React** dan indikator geometris bersih.
  - Micro-interactions menggunakan `framer-motion` (`whileHover={{ y: -4 }}`).
- **Realistic Indonesian Seeder**: Saat `nexus.db` pertama kali dibuat, otomatis terisi data realistis konteks Daerobi (mata kuliah Semester 5 UNPAM, proyek klien Indonesia, rekening BCA/Bank Jago/Kas Proyek, format Rupiah `Rp`).

### Non-Goals (Skipped via `/ponytail` YAGNI)
- **Skipped**: Supabase Cloud Sync, PostgreSQL RLS migrations, Multi-User Login/Auth. *Alasan*: Aplikasi berjalan 100% lokal di perangkat pribadi Daerobi; layar login untuk database lokal sendiri hanya menambah friksi.
- **Skipped**: WhatsApp/Telegram Gateway eksternal. *Upgrade path*: Tambahkan di Fase 2 jika butuh notifikasi keluar.
- **Skipped**: Tauri/Rust compilation. *Alasan*: Toolchain Rust/MSVC belum terpasang di mesin; Node v24 `node:sqlite` + WebView2 app window memberikan performa lokal setara dengan 0GB instalasi compiler.

### Anti-Goals
- Dilarang menggunakan emoji Unicode di bagian manapun pada UI/copywriting.
- Dilarang menggunakan titik hijau berdenyut (`animate-ping`).
- Dilarang membuat navigasi tab horizontal menumpuk di bagian atas halaman.
- Dilarang menampilkan error mentah SQLite/stack trace ke layar pengguna.

## 3. Approaches Considered

| Opsi | Pendekatan | Trade-off | Keputusan |
| :--- | :--- | :--- | :--- |
| **Opsi 1 (Dipilih)** | **Vite + React + Tailwind + Framer Motion + Local API (`node:sqlite` di `data/nexus.db`) + Desktop App Launcher** | Nol instalasi compiler Rust/C++, database `nexus.db` murni tersimpan di folder proyek, ringan (~30MB RAM), langsung jalan. | **DIPILIH oleh Daerobi** |
| **Opsi 2** | Pure Rust (`axum` + `rusqlite`) + React | Sangat ringan, namun wajib instal `rustup` + 4GB Visual Studio C++ Build Tools terlebih dahulu. | Ditolak |
| **Opsi 3** | Tauri v2 + Rust + SQLite | Menghasilkan installer `.exe` penuh, namun butuh instalasi Rust + Windows SDK dan waktu kompilasi lama. | Ditolak |

## 4. Architecture & File Structure (`/ponytail` Minimal Footprint)

Aplikasi menggunakan struktur monorepo ringan satu folder (`d:\nexus dahaboard`):
- `data/nexus.db` — File SQLite lokal yang otomatis dibuat & di-seed saat server menyala.
- `server/index.mjs` — Server HTTP lokal ultra-ringan berbasis `node:http` + `node:sqlite` (bawaan Node v24, tanpa framework backend berat) di port `3001` (atau terintegrasi sebagai middleware Vite sehingga cukup **1 port & 1 proses**).
  - *Keputusan Builder (`/ponytail`)*: Gunakan **Vite Custom Server Middleware plugin** sehingga API `/api/*` dan SQLite `data/nexus.db` berjalan langsung di dalam proses Vite! Cukup 1 proses Node.js, 1 port (`http://localhost:5173`), 0 CORS issue, 0 dependency Express/Fastify.
- `src/App.tsx` — App Shell utama (Collapsible Left Sidebar, Top Header dengan Search `Cmd+K` & Theme Toggle, Bento Views, Slide-over Drawer & Modal Form).
- `src/types.ts` — Kontrak tipe data TypeScript.
- `start-nexus-desktop.bat` — Shortcut satu klik untuk menyalakan Nexus dalam jendela desktop mandiri (App Mode).

## 5. SQLite Database Schema (`data/nexus.db`)

Empat tabel inti yang mencakup seluruh kebutuhan operasional:

1. **`wallets` (Dompet / Rekening Operasional)**
   - `id` (TEXT PK), `name` (TEXT, mis. "BCA Operasional", "Bank Jago Projek", "Kas Tunai"), `currency` (TEXT default 'IDR'), `balance` (INTEGER), `account_number` (TEXT), `color` (TEXT).
2. **`transactions` (Arus Kas Masuk & Keluar)**
   - `id` (TEXT PK), `code` (TEXT, mis. `INV-2026-01`), `title` (TEXT), `category` (TEXT: `Proyek Klien` | `Maintenance` | `Operasional Server` | `Kuliah & Akademik`), `type` (TEXT: `income` | `expense`), `amount` (INTEGER), `wallet_id` (TEXT FK), `status` (TEXT: `Completed` | `Pending`), `created_at` (TEXT ISO date).
3. **`tasks` (Kanban Proyek Klien & Tracker Tugas Kuliah UNPAM)**
   - `id` (TEXT PK), `title` (TEXT), `scope` (TEXT: `kuliah` | `klien`), `subject_or_client` (TEXT, mis. "Kecerdasan Buatan - UNPAM" atau "PT Sinar Logistik"), `status` (TEXT: `todo` | `in_progress` | `review` | `done`), `priority` (TEXT: `high` | `medium` | `low`), `due_date` (TEXT), `budget_or_weight` (TEXT), `notes` (TEXT).
4. **`maintenance_items` (Maintenance Tracker Aplikasi & Server)**
   - `id` (TEXT PK), `app_name` (TEXT), `client_name` (TEXT), `environment` (TEXT, mis. "Coolify Home Server", "VPS Production"), `status` (TEXT: `Healthy` | `Maintenance` | `Warning`), `uptime_percent` (REAL), `monthly_fee` (INTEGER), `next_check_date` (TEXT).
5. **`settings` (Konfigurasi Lokal)**
   - `key` (TEXT PK), `value` (TEXT) — menyimpan `monthly_spending_limit` (default `5500000`), `theme` (`dark` | `light`), dan `user_name` (`Daerobi`).

## 6. UI/UX Layout Specification (Vertix Bento + `/taste-skill`)

### Navigation Architecture (Left Sidebar Mandatory)
- **Left Sidebar** (lebar `240px` saat terbuka, `72px` saat mode icon-rail seperti referensi gambar):
  - **Brand Header**: Logo geometris SVG Nexus (`#f97316` / `#6366f1`) + nama **Nexus OS**.
  - **Menu Navigasi Utama**:
    1. `Overview` (Bento Command Center utama seperti gambar referensi)
    2. `Tugas & Proyek` (Kanban Board Klien & Tracker Kuliah UNPAM)
    3. `Maintenance` (Monitor Aplikasi, Server & Retainer Bulanan)
    4. `Keuangan & Kas` (Buku Besar Transaksi, Dompet & Batas Anggaran)
    5. `Laporan & Backup` (Export CSV/JSON & Ringkasan Analitik)
  - **Footer Sidebar**: Toggle Tema (Dark Obsidian / Clean Light), Indikator `SQLite Local • data/nexus.db`, dan status profil (`Daerobi • Sem 5 UNPAM`).

### Overview Screen (Bento Grid — Persis Proporsi Gambar Referensi)
- **Header Sambutan**: `"Selamat bekerja, Daerobi"` + subjudul operasional + Search Bar (`Ctrl+K`) + tombol cepat `+ Tugas Baru` & `+ Catat Kas`.
- **Baris Atas (3 Kolom Bento)**:
  1. **Kolom 1 — Total Balance & Wallets Card**:
     - Menampilkan **Total Saldo Bersih** dalam Rupiah (`Rp 24.650.000`) + persentase pertumbuhan bulan ini.
     - Tombol aksi cepat: `+ Pemasukan` (Solid button) dan `- Pengeluaran` (Outline button).
     - **Sub-cards Wallets (3 kolom kecil di bawahnya, persis bagian USD/EUR/GBP di gambar)**: Menampilkan saldo masing-masing dompet: `BCA Utama`, `Bank Jago`, dan `Kas Projek`.
  2. **Kolom 2 — 2x2 KPI Bento Cards**:
     - **Card 1 (Highlighted Accent Card — Orange/Coral Gradient seperti gambar)**: *Total Pemasukan Bulan Ini* (`Rp 12.500.000`, `+18% bulan ini`).
     - **Card 2**: *Total Pengeluaran Bulan Ini* (`Rp 3.150.000`, `-5% bulan ini`).
     - **Card 3**: *Proyek & Tugas Aktif* (`7 Aktif` — 4 Klien, 3 Tugas UNPAM).
     - **Card 4**: *Pendapatan Retainer Maintenance* (`Rp 2.800.000` dari 5 aplikasi aktif).
  3. **Kolom 3 — Profit & Loss Bar Chart**:
     - Grafik batang vertikal dua warna (*Pemasukan* vs *Pengeluaran/Biaya*) selama 6 bulan terakhir (Mei–Okt), lengkap dengan tooltip Rupiah presisi.
- **Baris Bawah (2 Kolom Bento)**:
  1. **Kolom Kiri (1/3 lebar) — Monthly Spending Limit**:
     - Progress bar visual pemakaian anggaran bulanan (mis. `Rp 3.150.000 / Rp 5.500.000`), bisa di-klik untuk ubah batas anggaran langsung ke SQLite.
  2. **Kolom Kanan (2/3 lebar) — Recent Activities & Tasks**:
     - Tabel bersih dengan kolom `ID`, `Aktivitas / Proyek`, `Kategori`, `Nominal / Prioritas`, `Status`, `Tanggal`, dilengkapi input **Search** dan **Filter** instan.
