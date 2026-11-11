# Implementation Tasks & Execution Backlog: Nexus Desktop Command Center

> Dokumen rincian tugas koding berfase yang diekstrak langsung secara dinamis dari Pohon Fitur & PRD.
> Gunakan checklist ini sebagai panduan eksekusi untuk AI Coding Agent (Claude Code, Cursor, Aider, Devin) atau Software Engineer.

## Ringkasan Eksekusi Proyek
- **Aplikasi:** Nexus Desktop Command Center
- **Total Modul:** 6 modul terstruktur
- **Total Task Koding:** 84 tugas teknis
- **Status Progres:** 0 / 84 selesai (0%)

---

## [FASE 1] Rencana Modul Pengembangan

### Modul 1: Fondasi App Shell & Autentikasi
- **Cakupan Sub-Fitur:**
  1. Sistem Login Multi-User Lokal
  2. Enkripsi Data SQLite Lokal
  3. Manajemen Sesi Desktop
  4. Sinkronisasi Profil Cloud

#### Checklist Tugas Koding (Pohon Fitur):

- [ ] **[TASK-MOD-1-01] Bangun halaman utama & layout navigasi Fondasi App Shell & Autentikasi** (Prioritas: P0)
  - **Kategori**: UI Layout & Shell Navigasi
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/fondasi-app-shell-autentikasi-view.tsx`, `src/app/fondasi-app-shell-autentikasi/page.tsx`
  - **Instruksi**: Buat kerangka antarmuka responsif, header breadcrumb, dan layout navigasi terstruktur untuk Fondasi App Shell & Autentikasi.

- [ ] **[TASK-MOD-1-02] Implementasi komponen antarmuka & alur Sistem Login Multi-User Lokal** (Prioritas: P0)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/sistem-login-multi-user-l.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Sistem Login Multi-User Lokal".

- [ ] **[TASK-MOD-1-03] Implementasi komponen antarmuka & alur Enkripsi Data SQLite Lokal** (Prioritas: P0)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/enkripsi-data-sqlite-loka.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Enkripsi Data SQLite Lokal".

- [ ] **[TASK-MOD-1-04] Implementasi komponen antarmuka & alur Manajemen Sesi Desktop** (Prioritas: P0)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/manajemen-sesi-desktop.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Manajemen Sesi Desktop".

- [ ] **[TASK-MOD-1-05] Implementasi komponen antarmuka & alur Sinkronisasi Profil Cloud** (Prioritas: P0)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/sinkronisasi-profil-cloud.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Sinkronisasi Profil Cloud".

- [ ] **[TASK-MOD-1-06] Buat formulir input interaktif dengan validasi skema Zod untuk Fondasi App Shell & Autentikasi** (Prioritas: P0)
  - **Kategori**: Formulir & Validasi Zod
  - **Target File**: `src/lib/validations/fondasi-app-shell-autentikasi.schema.ts`, `src/components/fondasi-app-shell-autentikasi/fondasi-app-shell-autentikasi-form.tsx`
  - **Instruksi**: Susun skema validasi tipe aman Zod dan implementasikan form interaktif dengan umpan balik pesan validasi.

- [ ] **[TASK-MOD-1-07] Implementasi dialog modal konfirmasi & drawer aksi detail Fondasi App Shell & Autentikasi** (Prioritas: P0)
  - **Kategori**: Modal & Dialog Interaktif
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/fondasi-app-shell-autentikasi-modal.tsx`
  - **Instruksi**: Sediakan dialog konfirmasi aksi destruktif serta drawer inspeksi detail data Fondasi App Shell & Autentikasi.

- [ ] **[TASK-MOD-1-08] Buat Server Action & API route handler mutasi data Fondasi App Shell & Autentikasi** (Prioritas: P0)
  - **Kategori**: Server Actions & Route Handlers
  - **Target File**: `src/actions/fondasi-app-shell-autentikasi-actions.ts`, `src/app/api/fondasi-app-shell-autentikasi/route.ts`
  - **Instruksi**: Bangun Server Actions atau API Route Handler dengan proteksi autentikasi, verifikasi input, dan sanitasi payload.

- [ ] **[TASK-MOD-1-09] Rancang skema tabel database, Foreign Keys & relasi entitas Fondasi App Shell & Autentikasi** (Prioritas: P0)
  - **Kategori**: Skema Relasional Database
  - **Target File**: `supabase/migrations/*_fondasi_app_shell_autentikasi.sql`, `src/types/fondasi-app-shell-autentikasi.types.ts`
  - **Instruksi**: Rancang tabel PostgreSQL dengan Primary Key UUID, Foreign Keys, audit timestamp (created_at, updated_at).

- [ ] **[TASK-MOD-1-10] Terapkan kebijakan Row-Level Security (RLS) & proteksi hak akses Fondasi App Shell & Autentikasi** (Prioritas: P0)
  - **Kategori**: Keamanan & Akses RLS
  - **Target File**: `supabase/migrations/*_fondasi_app_shell_autentikasi_rls.sql`
  - **Instruksi**: Aktifkan ALTER TABLE ENABLE ROW LEVEL SECURITY dan tambahkan policy terisolasi per user_id/role.

- [ ] **[TASK-MOD-1-11] Optimasi query database & penambahan indeks performa untuk Fondasi App Shell & Autentikasi** (Prioritas: P1)
  - **Kategori**: Optimasi Indeks & Performa
  - **Target File**: `supabase/migrations/*_fondasi_app_shell_autentikasi_indexes.sql`
  - **Instruksi**: Buat index B-Tree pada foreign key dan kolom filter/pencarian utama untuk mempercepat waktu respons query.

- [ ] **[TASK-MOD-1-12] Tambahkan visual feedback, skeleton loading state & toast alert Fondasi App Shell & Autentikasi** (Prioritas: P1)
  - **Kategori**: State Loading & Feedback UX
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/fondasi-app-shell-autentikasi-skeleton.tsx`
  - **Instruksi**: Sediakan skeleton placeholder saat data memuat dan notifikasi toast sukses/gagal untuk meningkatkan UX.

- [ ] **[TASK-MOD-1-13] Implementasi penanganan error alur jaringan & validasi edge cases Fondasi App Shell & Autentikasi** (Prioritas: P1)
  - **Kategori**: Resiliensi & Penanganan Error
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/error.tsx`
  - **Instruksi**: Bangun boundary error lokal, empty state informatif saat data nol, dan penanganan timeout jaringan.

- [ ] **[TASK-MOD-1-14] Tulis unit test & pengujian alur interaksi end-to-end Fondasi App Shell & Autentikasi** (Prioritas: P2)
  - **Kategori**: Pengujian Otomatis (Test)
  - **Target File**: `src/components/fondasi-app-shell-autentikasi/__tests__/fondasi-app-shell-autentikasi.test.tsx`
  - **Instruksi**: Tulis pengujian unit komponen dan simulasi flow kritis pengisian data hingga sukses disimpan.

## [FASE 2] Rencana Modul Pengembangan

### Modul 2: Manajemen Tugas & Proyek
- **Cakupan Sub-Fitur:**
  1. Kanban Board Proyek Klien
  2. Task Tracker Tugas Kuliah
  3. Timeline Maintenance Aplikasi
  4. Prioritas Tugas Otomatis

#### Checklist Tugas Koding (Pohon Fitur):

- [ ] **[TASK-MOD-2-01] Bangun halaman utama & layout navigasi Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: UI Layout & Shell Navigasi
  - **Target File**: `src/components/manajemen-tugas-proyek/manajemen-tugas-proyek-view.tsx`, `src/app/manajemen-tugas-proyek/page.tsx`
  - **Instruksi**: Buat kerangka antarmuka responsif, header breadcrumb, dan layout navigasi terstruktur untuk Manajemen Tugas & Proyek.

- [ ] **[TASK-MOD-2-02] Implementasi komponen antarmuka & alur Kanban Board Proyek Klien** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/manajemen-tugas-proyek/kanban-board-proyek-klien.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Kanban Board Proyek Klien".

- [ ] **[TASK-MOD-2-03] Implementasi komponen antarmuka & alur Task Tracker Tugas Kuliah** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/manajemen-tugas-proyek/task-tracker-tugas-kuliah.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Task Tracker Tugas Kuliah".

- [ ] **[TASK-MOD-2-04] Implementasi komponen antarmuka & alur Timeline Maintenance Aplikasi** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/manajemen-tugas-proyek/timeline-maintenance-apli.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Timeline Maintenance Aplikasi".

- [ ] **[TASK-MOD-2-05] Implementasi komponen antarmuka & alur Prioritas Tugas Otomatis** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/manajemen-tugas-proyek/prioritas-tugas-otomatis.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Prioritas Tugas Otomatis".

- [ ] **[TASK-MOD-2-06] Buat formulir input interaktif dengan validasi skema Zod untuk Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: Formulir & Validasi Zod
  - **Target File**: `src/lib/validations/manajemen-tugas-proyek.schema.ts`, `src/components/manajemen-tugas-proyek/manajemen-tugas-proyek-form.tsx`
  - **Instruksi**: Susun skema validasi tipe aman Zod dan implementasikan form interaktif dengan umpan balik pesan validasi.

- [ ] **[TASK-MOD-2-07] Implementasi dialog modal konfirmasi & drawer aksi detail Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: Modal & Dialog Interaktif
  - **Target File**: `src/components/manajemen-tugas-proyek/manajemen-tugas-proyek-modal.tsx`
  - **Instruksi**: Sediakan dialog konfirmasi aksi destruktif serta drawer inspeksi detail data Manajemen Tugas & Proyek.

- [ ] **[TASK-MOD-2-08] Buat Server Action & API route handler mutasi data Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: Server Actions & Route Handlers
  - **Target File**: `src/actions/manajemen-tugas-proyek-actions.ts`, `src/app/api/manajemen-tugas-proyek/route.ts`
  - **Instruksi**: Bangun Server Actions atau API Route Handler dengan proteksi autentikasi, verifikasi input, dan sanitasi payload.

- [ ] **[TASK-MOD-2-09] Rancang skema tabel database, Foreign Keys & relasi entitas Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: Skema Relasional Database
  - **Target File**: `supabase/migrations/*_manajemen_tugas_proyek.sql`, `src/types/manajemen-tugas-proyek.types.ts`
  - **Instruksi**: Rancang tabel PostgreSQL dengan Primary Key UUID, Foreign Keys, audit timestamp (created_at, updated_at).

- [ ] **[TASK-MOD-2-10] Terapkan kebijakan Row-Level Security (RLS) & proteksi hak akses Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: Keamanan & Akses RLS
  - **Target File**: `supabase/migrations/*_manajemen_tugas_proyek_rls.sql`
  - **Instruksi**: Aktifkan ALTER TABLE ENABLE ROW LEVEL SECURITY dan tambahkan policy terisolasi per user_id/role.

- [ ] **[TASK-MOD-2-11] Optimasi query database & penambahan indeks performa untuk Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: Optimasi Indeks & Performa
  - **Target File**: `supabase/migrations/*_manajemen_tugas_proyek_indexes.sql`
  - **Instruksi**: Buat index B-Tree pada foreign key dan kolom filter/pencarian utama untuk mempercepat waktu respons query.

- [ ] **[TASK-MOD-2-12] Tambahkan visual feedback, skeleton loading state & toast alert Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: State Loading & Feedback UX
  - **Target File**: `src/components/manajemen-tugas-proyek/manajemen-tugas-proyek-skeleton.tsx`
  - **Instruksi**: Sediakan skeleton placeholder saat data memuat dan notifikasi toast sukses/gagal untuk meningkatkan UX.

- [ ] **[TASK-MOD-2-13] Implementasi penanganan error alur jaringan & validasi edge cases Manajemen Tugas & Proyek** (Prioritas: P1)
  - **Kategori**: Resiliensi & Penanganan Error
  - **Target File**: `src/components/manajemen-tugas-proyek/error.tsx`
  - **Instruksi**: Bangun boundary error lokal, empty state informatif saat data nol, dan penanganan timeout jaringan.

- [ ] **[TASK-MOD-2-14] Tulis unit test & pengujian alur interaksi end-to-end Manajemen Tugas & Proyek** (Prioritas: P2)
  - **Kategori**: Pengujian Otomatis (Test)
  - **Target File**: `src/components/manajemen-tugas-proyek/__tests__/manajemen-tugas-proyek.test.tsx`
  - **Instruksi**: Tulis pengujian unit komponen dan simulasi flow kritis pengisian data hingga sukses disimpan.

### Modul 3: Manajemen Keuangan Terpadu
- **Cakupan Sub-Fitur:**
  1. Pencatatan Pengeluaran Maintenance
  2. Laporan Arus Kas Bulanan
  3. Kategorisasi Biaya Operasional
  4. Dashboard Anggaran Proyek

#### Checklist Tugas Koding (Pohon Fitur):

- [ ] **[TASK-MOD-3-01] Bangun halaman utama & layout navigasi Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: UI Layout & Shell Navigasi
  - **Target File**: `src/components/manajemen-keuangan-terpadu/manajemen-keuangan-terpadu-view.tsx`, `src/app/manajemen-keuangan-terpadu/page.tsx`
  - **Instruksi**: Buat kerangka antarmuka responsif, header breadcrumb, dan layout navigasi terstruktur untuk Manajemen Keuangan Terpadu.

- [ ] **[TASK-MOD-3-02] Implementasi komponen antarmuka & alur Pencatatan Pengeluaran Maintenance** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/manajemen-keuangan-terpadu/pencatatan-pengeluaran-ma.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Pencatatan Pengeluaran Maintenance".

- [ ] **[TASK-MOD-3-03] Implementasi komponen antarmuka & alur Laporan Arus Kas Bulanan** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/manajemen-keuangan-terpadu/laporan-arus-kas-bulanan.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Laporan Arus Kas Bulanan".

- [ ] **[TASK-MOD-3-04] Implementasi komponen antarmuka & alur Kategorisasi Biaya Operasional** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/manajemen-keuangan-terpadu/kategorisasi-biaya-operas.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Kategorisasi Biaya Operasional".

- [ ] **[TASK-MOD-3-05] Implementasi komponen antarmuka & alur Dashboard Anggaran Proyek** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/manajemen-keuangan-terpadu/dashboard-anggaran-proyek.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Dashboard Anggaran Proyek".

- [ ] **[TASK-MOD-3-06] Buat formulir input interaktif dengan validasi skema Zod untuk Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: Formulir & Validasi Zod
  - **Target File**: `src/lib/validations/manajemen-keuangan-terpadu.schema.ts`, `src/components/manajemen-keuangan-terpadu/manajemen-keuangan-terpadu-form.tsx`
  - **Instruksi**: Susun skema validasi tipe aman Zod dan implementasikan form interaktif dengan umpan balik pesan validasi.

- [ ] **[TASK-MOD-3-07] Implementasi dialog modal konfirmasi & drawer aksi detail Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: Modal & Dialog Interaktif
  - **Target File**: `src/components/manajemen-keuangan-terpadu/manajemen-keuangan-terpadu-modal.tsx`
  - **Instruksi**: Sediakan dialog konfirmasi aksi destruktif serta drawer inspeksi detail data Manajemen Keuangan Terpadu.

- [ ] **[TASK-MOD-3-08] Buat Server Action & API route handler mutasi data Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: Server Actions & Route Handlers
  - **Target File**: `src/actions/manajemen-keuangan-terpadu-actions.ts`, `src/app/api/manajemen-keuangan-terpadu/route.ts`
  - **Instruksi**: Bangun Server Actions atau API Route Handler dengan proteksi autentikasi, verifikasi input, dan sanitasi payload.

- [ ] **[TASK-MOD-3-09] Rancang skema tabel database, Foreign Keys & relasi entitas Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: Skema Relasional Database
  - **Target File**: `supabase/migrations/*_manajemen_keuangan_terpadu.sql`, `src/types/manajemen-keuangan-terpadu.types.ts`
  - **Instruksi**: Rancang tabel PostgreSQL dengan Primary Key UUID, Foreign Keys, audit timestamp (created_at, updated_at).

- [ ] **[TASK-MOD-3-10] Terapkan kebijakan Row-Level Security (RLS) & proteksi hak akses Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: Keamanan & Akses RLS
  - **Target File**: `supabase/migrations/*_manajemen_keuangan_terpadu_rls.sql`
  - **Instruksi**: Aktifkan ALTER TABLE ENABLE ROW LEVEL SECURITY dan tambahkan policy terisolasi per user_id/role.

- [ ] **[TASK-MOD-3-11] Optimasi query database & penambahan indeks performa untuk Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: Optimasi Indeks & Performa
  - **Target File**: `supabase/migrations/*_manajemen_keuangan_terpadu_indexes.sql`
  - **Instruksi**: Buat index B-Tree pada foreign key dan kolom filter/pencarian utama untuk mempercepat waktu respons query.

- [ ] **[TASK-MOD-3-12] Tambahkan visual feedback, skeleton loading state & toast alert Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: State Loading & Feedback UX
  - **Target File**: `src/components/manajemen-keuangan-terpadu/manajemen-keuangan-terpadu-skeleton.tsx`
  - **Instruksi**: Sediakan skeleton placeholder saat data memuat dan notifikasi toast sukses/gagal untuk meningkatkan UX.

- [ ] **[TASK-MOD-3-13] Implementasi penanganan error alur jaringan & validasi edge cases Manajemen Keuangan Terpadu** (Prioritas: P1)
  - **Kategori**: Resiliensi & Penanganan Error
  - **Target File**: `src/components/manajemen-keuangan-terpadu/error.tsx`
  - **Instruksi**: Bangun boundary error lokal, empty state informatif saat data nol, dan penanganan timeout jaringan.

- [ ] **[TASK-MOD-3-14] Tulis unit test & pengujian alur interaksi end-to-end Manajemen Keuangan Terpadu** (Prioritas: P2)
  - **Kategori**: Pengujian Otomatis (Test)
  - **Target File**: `src/components/manajemen-keuangan-terpadu/__tests__/manajemen-keuangan-terpadu.test.tsx`
  - **Instruksi**: Tulis pengujian unit komponen dan simulasi flow kritis pengisian data hingga sukses disimpan.

## [FASE 3] Rencana Modul Pengembangan

### Modul 4: Asisten Cerdas Gemini 3.8
- **Cakupan Sub-Fitur:**
  1. Analisis Konteks Tugas Kuliah
  2. Otomasi Balasan Pesan Klien
  3. Ringkasan Proyek Berbasis AI
  4. Smart Query Data Keuangan

#### Checklist Tugas Koding (Pohon Fitur):

- [ ] **[TASK-MOD-4-01] Bangun halaman utama & layout navigasi Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: UI Layout & Shell Navigasi
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/asisten-cerdas-gemini-3-8-view.tsx`, `src/app/asisten-cerdas-gemini-3-8/page.tsx`
  - **Instruksi**: Buat kerangka antarmuka responsif, header breadcrumb, dan layout navigasi terstruktur untuk Asisten Cerdas Gemini 3.8.

- [ ] **[TASK-MOD-4-02] Implementasi komponen antarmuka & alur Analisis Konteks Tugas Kuliah** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/analisis-konteks-tugas-ku.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Analisis Konteks Tugas Kuliah".

- [ ] **[TASK-MOD-4-03] Implementasi komponen antarmuka & alur Otomasi Balasan Pesan Klien** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/otomasi-balasan-pesan-kli.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Otomasi Balasan Pesan Klien".

- [ ] **[TASK-MOD-4-04] Implementasi komponen antarmuka & alur Ringkasan Proyek Berbasis AI** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/ringkasan-proyek-berbasis.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Ringkasan Proyek Berbasis AI".

- [ ] **[TASK-MOD-4-05] Implementasi komponen antarmuka & alur Smart Query Data Keuangan** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/smart-query-data-keuangan.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Smart Query Data Keuangan".

- [ ] **[TASK-MOD-4-06] Buat formulir input interaktif dengan validasi skema Zod untuk Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: Formulir & Validasi Zod
  - **Target File**: `src/lib/validations/asisten-cerdas-gemini-3-8.schema.ts`, `src/components/asisten-cerdas-gemini-3-8/asisten-cerdas-gemini-3-8-form.tsx`
  - **Instruksi**: Susun skema validasi tipe aman Zod dan implementasikan form interaktif dengan umpan balik pesan validasi.

- [ ] **[TASK-MOD-4-07] Implementasi dialog modal konfirmasi & drawer aksi detail Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: Modal & Dialog Interaktif
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/asisten-cerdas-gemini-3-8-modal.tsx`
  - **Instruksi**: Sediakan dialog konfirmasi aksi destruktif serta drawer inspeksi detail data Asisten Cerdas Gemini 3.8.

- [ ] **[TASK-MOD-4-08] Buat Server Action & API route handler mutasi data Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: Server Actions & Route Handlers
  - **Target File**: `src/actions/asisten-cerdas-gemini-3-8-actions.ts`, `src/app/api/asisten-cerdas-gemini-3-8/route.ts`
  - **Instruksi**: Bangun Server Actions atau API Route Handler dengan proteksi autentikasi, verifikasi input, dan sanitasi payload.

- [ ] **[TASK-MOD-4-09] Rancang skema tabel database, Foreign Keys & relasi entitas Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: Skema Relasional Database
  - **Target File**: `supabase/migrations/*_asisten_cerdas_gemini_3_8.sql`, `src/types/asisten-cerdas-gemini-3-8.types.ts`
  - **Instruksi**: Rancang tabel PostgreSQL dengan Primary Key UUID, Foreign Keys, audit timestamp (created_at, updated_at).

- [ ] **[TASK-MOD-4-10] Terapkan kebijakan Row-Level Security (RLS) & proteksi hak akses Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: Keamanan & Akses RLS
  - **Target File**: `supabase/migrations/*_asisten_cerdas_gemini_3_8_rls.sql`
  - **Instruksi**: Aktifkan ALTER TABLE ENABLE ROW LEVEL SECURITY dan tambahkan policy terisolasi per user_id/role.

- [ ] **[TASK-MOD-4-11] Optimasi query database & penambahan indeks performa untuk Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: Optimasi Indeks & Performa
  - **Target File**: `supabase/migrations/*_asisten_cerdas_gemini_3_8_indexes.sql`
  - **Instruksi**: Buat index B-Tree pada foreign key dan kolom filter/pencarian utama untuk mempercepat waktu respons query.

- [ ] **[TASK-MOD-4-12] Tambahkan visual feedback, skeleton loading state & toast alert Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: State Loading & Feedback UX
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/asisten-cerdas-gemini-3-8-skeleton.tsx`
  - **Instruksi**: Sediakan skeleton placeholder saat data memuat dan notifikasi toast sukses/gagal untuk meningkatkan UX.

- [ ] **[TASK-MOD-4-13] Implementasi penanganan error alur jaringan & validasi edge cases Asisten Cerdas Gemini 3.8** (Prioritas: P1)
  - **Kategori**: Resiliensi & Penanganan Error
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/error.tsx`
  - **Instruksi**: Bangun boundary error lokal, empty state informatif saat data nol, dan penanganan timeout jaringan.

- [ ] **[TASK-MOD-4-14] Tulis unit test & pengujian alur interaksi end-to-end Asisten Cerdas Gemini 3.8** (Prioritas: P2)
  - **Kategori**: Pengujian Otomatis (Test)
  - **Target File**: `src/components/asisten-cerdas-gemini-3-8/__tests__/asisten-cerdas-gemini-3-8.test.tsx`
  - **Instruksi**: Tulis pengujian unit komponen dan simulasi flow kritis pengisian data hingga sukses disimpan.

### Modul 5: Integrasi Eksternal & Komunikasi
- **Cakupan Sub-Fitur:**
  1. Google Workspace Sync
  2. Gateway WhatsApp API
  3. Bot Notifikasi Telegram
  4. Local Message Queue untuk API

#### Checklist Tugas Koding (Pohon Fitur):

- [ ] **[TASK-MOD-5-01] Bangun halaman utama & layout navigasi Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: UI Layout & Shell Navigasi
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/integrasi-eksternal-komunikasi-view.tsx`, `src/app/integrasi-eksternal-komunikasi/page.tsx`
  - **Instruksi**: Buat kerangka antarmuka responsif, header breadcrumb, dan layout navigasi terstruktur untuk Integrasi Eksternal & Komunikasi.

- [ ] **[TASK-MOD-5-02] Implementasi komponen antarmuka & alur Google Workspace Sync** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/google-workspace-sync.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Google Workspace Sync".

- [ ] **[TASK-MOD-5-03] Implementasi komponen antarmuka & alur Gateway WhatsApp API** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/gateway-whatsapp-api.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Gateway WhatsApp API".

- [ ] **[TASK-MOD-5-04] Implementasi komponen antarmuka & alur Bot Notifikasi Telegram** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/bot-notifikasi-telegram.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Bot Notifikasi Telegram".

- [ ] **[TASK-MOD-5-05] Implementasi komponen antarmuka & alur Local Message Queue untuk API** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/local-message-queue-untuk.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Local Message Queue untuk API".

- [ ] **[TASK-MOD-5-06] Buat formulir input interaktif dengan validasi skema Zod untuk Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: Formulir & Validasi Zod
  - **Target File**: `src/lib/validations/integrasi-eksternal-komunikasi.schema.ts`, `src/components/integrasi-eksternal-komunikasi/integrasi-eksternal-komunikasi-form.tsx`
  - **Instruksi**: Susun skema validasi tipe aman Zod dan implementasikan form interaktif dengan umpan balik pesan validasi.

- [ ] **[TASK-MOD-5-07] Implementasi dialog modal konfirmasi & drawer aksi detail Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: Modal & Dialog Interaktif
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/integrasi-eksternal-komunikasi-modal.tsx`
  - **Instruksi**: Sediakan dialog konfirmasi aksi destruktif serta drawer inspeksi detail data Integrasi Eksternal & Komunikasi.

- [ ] **[TASK-MOD-5-08] Buat Server Action & API route handler mutasi data Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: Server Actions & Route Handlers
  - **Target File**: `src/actions/integrasi-eksternal-komunikasi-actions.ts`, `src/app/api/integrasi-eksternal-komunikasi/route.ts`
  - **Instruksi**: Bangun Server Actions atau API Route Handler dengan proteksi autentikasi, verifikasi input, dan sanitasi payload.

- [ ] **[TASK-MOD-5-09] Rancang skema tabel database, Foreign Keys & relasi entitas Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: Skema Relasional Database
  - **Target File**: `supabase/migrations/*_integrasi_eksternal_komunikasi.sql`, `src/types/integrasi-eksternal-komunikasi.types.ts`
  - **Instruksi**: Rancang tabel PostgreSQL dengan Primary Key UUID, Foreign Keys, audit timestamp (created_at, updated_at).

- [ ] **[TASK-MOD-5-10] Terapkan kebijakan Row-Level Security (RLS) & proteksi hak akses Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: Keamanan & Akses RLS
  - **Target File**: `supabase/migrations/*_integrasi_eksternal_komunikasi_rls.sql`
  - **Instruksi**: Aktifkan ALTER TABLE ENABLE ROW LEVEL SECURITY dan tambahkan policy terisolasi per user_id/role.

- [ ] **[TASK-MOD-5-11] Optimasi query database & penambahan indeks performa untuk Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: Optimasi Indeks & Performa
  - **Target File**: `supabase/migrations/*_integrasi_eksternal_komunikasi_indexes.sql`
  - **Instruksi**: Buat index B-Tree pada foreign key dan kolom filter/pencarian utama untuk mempercepat waktu respons query.

- [ ] **[TASK-MOD-5-12] Tambahkan visual feedback, skeleton loading state & toast alert Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: State Loading & Feedback UX
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/integrasi-eksternal-komunikasi-skeleton.tsx`
  - **Instruksi**: Sediakan skeleton placeholder saat data memuat dan notifikasi toast sukses/gagal untuk meningkatkan UX.

- [ ] **[TASK-MOD-5-13] Implementasi penanganan error alur jaringan & validasi edge cases Integrasi Eksternal & Komunikasi** (Prioritas: P1)
  - **Kategori**: Resiliensi & Penanganan Error
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/error.tsx`
  - **Instruksi**: Bangun boundary error lokal, empty state informatif saat data nol, dan penanganan timeout jaringan.

- [ ] **[TASK-MOD-5-14] Tulis unit test & pengujian alur interaksi end-to-end Integrasi Eksternal & Komunikasi** (Prioritas: P2)
  - **Kategori**: Pengujian Otomatis (Test)
  - **Target File**: `src/components/integrasi-eksternal-komunikasi/__tests__/integrasi-eksternal-komunikasi.test.tsx`
  - **Instruksi**: Tulis pengujian unit komponen dan simulasi flow kritis pengisian data hingga sukses disimpan.

## [FASE 4] Rencana Modul Pengembangan

### Modul 6: Analitik & Laporan Operasional
- **Cakupan Sub-Fitur:**
  1. Dashboard Performa Maintenance
  2. Visualisasi Data Keuangan
  3. Export Laporan Kinerja Klien
  4. Audit Log Aktivitas Sistem

#### Checklist Tugas Koding (Pohon Fitur):

- [ ] **[TASK-MOD-6-01] Bangun halaman utama & layout navigasi Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: UI Layout & Shell Navigasi
  - **Target File**: `src/components/analitik-laporan-operasional/analitik-laporan-operasional-view.tsx`, `src/app/analitik-laporan-operasional/page.tsx`
  - **Instruksi**: Buat kerangka antarmuka responsif, header breadcrumb, dan layout navigasi terstruktur untuk Analitik & Laporan Operasional.

- [ ] **[TASK-MOD-6-02] Implementasi komponen antarmuka & alur Dashboard Performa Maintenance** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/analitik-laporan-operasional/dashboard-performa-mainte.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Dashboard Performa Maintenance".

- [ ] **[TASK-MOD-6-03] Implementasi komponen antarmuka & alur Visualisasi Data Keuangan** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/analitik-laporan-operasional/visualisasi-data-keuangan.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Visualisasi Data Keuangan".

- [ ] **[TASK-MOD-6-04] Implementasi komponen antarmuka & alur Export Laporan Kinerja Klien** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/analitik-laporan-operasional/export-laporan-kinerja-kl.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Export Laporan Kinerja Klien".

- [ ] **[TASK-MOD-6-05] Implementasi komponen antarmuka & alur Audit Log Aktivitas Sistem** (Prioritas: P1)
  - **Kategori**: Komponen Sub-Fitur
  - **Target File**: `src/components/analitik-laporan-operasional/audit-log-aktivitas-siste.tsx`
  - **Instruksi**: Implementasi komponen antarmuka mandiri dan alur interaksi pengguna untuk "Audit Log Aktivitas Sistem".

- [ ] **[TASK-MOD-6-06] Buat formulir input interaktif dengan validasi skema Zod untuk Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: Formulir & Validasi Zod
  - **Target File**: `src/lib/validations/analitik-laporan-operasional.schema.ts`, `src/components/analitik-laporan-operasional/analitik-laporan-operasional-form.tsx`
  - **Instruksi**: Susun skema validasi tipe aman Zod dan implementasikan form interaktif dengan umpan balik pesan validasi.

- [ ] **[TASK-MOD-6-07] Implementasi dialog modal konfirmasi & drawer aksi detail Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: Modal & Dialog Interaktif
  - **Target File**: `src/components/analitik-laporan-operasional/analitik-laporan-operasional-modal.tsx`
  - **Instruksi**: Sediakan dialog konfirmasi aksi destruktif serta drawer inspeksi detail data Analitik & Laporan Operasional.

- [ ] **[TASK-MOD-6-08] Buat Server Action & API route handler mutasi data Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: Server Actions & Route Handlers
  - **Target File**: `src/actions/analitik-laporan-operasional-actions.ts`, `src/app/api/analitik-laporan-operasional/route.ts`
  - **Instruksi**: Bangun Server Actions atau API Route Handler dengan proteksi autentikasi, verifikasi input, dan sanitasi payload.

- [ ] **[TASK-MOD-6-09] Rancang skema tabel database, Foreign Keys & relasi entitas Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: Skema Relasional Database
  - **Target File**: `supabase/migrations/*_analitik_laporan_operasional.sql`, `src/types/analitik-laporan-operasional.types.ts`
  - **Instruksi**: Rancang tabel PostgreSQL dengan Primary Key UUID, Foreign Keys, audit timestamp (created_at, updated_at).

- [ ] **[TASK-MOD-6-10] Terapkan kebijakan Row-Level Security (RLS) & proteksi hak akses Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: Keamanan & Akses RLS
  - **Target File**: `supabase/migrations/*_analitik_laporan_operasional_rls.sql`
  - **Instruksi**: Aktifkan ALTER TABLE ENABLE ROW LEVEL SECURITY dan tambahkan policy terisolasi per user_id/role.

- [ ] **[TASK-MOD-6-11] Optimasi query database & penambahan indeks performa untuk Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: Optimasi Indeks & Performa
  - **Target File**: `supabase/migrations/*_analitik_laporan_operasional_indexes.sql`
  - **Instruksi**: Buat index B-Tree pada foreign key dan kolom filter/pencarian utama untuk mempercepat waktu respons query.

- [ ] **[TASK-MOD-6-12] Tambahkan visual feedback, skeleton loading state & toast alert Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: State Loading & Feedback UX
  - **Target File**: `src/components/analitik-laporan-operasional/analitik-laporan-operasional-skeleton.tsx`
  - **Instruksi**: Sediakan skeleton placeholder saat data memuat dan notifikasi toast sukses/gagal untuk meningkatkan UX.

- [ ] **[TASK-MOD-6-13] Implementasi penanganan error alur jaringan & validasi edge cases Analitik & Laporan Operasional** (Prioritas: P1)
  - **Kategori**: Resiliensi & Penanganan Error
  - **Target File**: `src/components/analitik-laporan-operasional/error.tsx`
  - **Instruksi**: Bangun boundary error lokal, empty state informatif saat data nol, dan penanganan timeout jaringan.

- [ ] **[TASK-MOD-6-14] Tulis unit test & pengujian alur interaksi end-to-end Analitik & Laporan Operasional** (Prioritas: P2)
  - **Kategori**: Pengujian Otomatis (Test)
  - **Target File**: `src/components/analitik-laporan-operasional/__tests__/analitik-laporan-operasional.test.tsx`
  - **Instruksi**: Tulis pengujian unit komponen dan simulasi flow kritis pengisian data hingga sukses disimpan.

