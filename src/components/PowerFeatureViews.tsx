import React, { useState, useEffect } from 'react';
import {
  Server,
  RefreshCw,
  Play,
  RotateCcw,
  Square,
  Cpu,
  HardDrive,
  ExternalLink,
  Plus,
  FileText,
  Download,
  Trash2,
  Sparkles,
  GraduationCap,
  Briefcase,
  Timer,
  Pause,
  CheckCircle2,
  Bike,
  Flame,
  Gauge,
  Mountain,
  Clock,
  Eye,
  X,
  Search,
} from 'lucide-react';
import {
  CoolifyResource,
  GeneratedDocument,
  FocusSession,
  CyclingLog,
  CrmDeal,
  AcademicCourse,
} from '../types';
import { PaginationControls } from './JokiAndHostingViews';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// ============================================================================
// 1. COOLIFY HOME SERVER LIVE CONTROL CENTER
// ============================================================================
interface CoolifyControlViewProps {
  resources: CoolifyResource[];
  lastSync: string;
  onSyncCoolify: () => Promise<void>;
  onTriggerAction: (id: string, action: 'restart' | 'deploy' | 'stop') => Promise<void>;
  onCreateResource: (payload: any) => Promise<void>;
}

export const CoolifyControlView: React.FC<CoolifyControlViewProps> = ({
  resources,
  lastSync,
  onSyncCoolify,
  onTriggerAction,
  onCreateResource,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('application');
  const [projectName, setProjectName] = useState('Proyek Klien daerobi-devs');
  const [fqdn, setFqdn] = useState('https://app.example.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'STOPPED'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const runningCount = resources.filter((r) => r.status.startsWith('running')).length;
  const filteredResources = resources.filter((r) => {
    if (statusFilter === 'RUNNING' && !r.status.startsWith('running')) return false;
    if (statusFilter === 'STOPPED' && r.status.startsWith('running')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.project_name.toLowerCase().includes(q) ||
        r.kind.toLowerCase().includes(q)
      );
    }
    return true;
  });
  const pagedResources = filteredResources.slice((page - 1) * pageSize, page * pageSize);
  const avgCpu =
    resources.length > 0
      ? (resources.reduce((s, r) => s + Number(r.cpu_percent), 0) / resources.length).toFixed(1)
      : '0.0';
  const totalRam = resources.reduce((s, r) => s + Number(r.memory_mb), 0);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncCoolify();
    } finally {
      setSyncing(false);
    }
  };

  const handleAction = async (id: string, action: 'restart' | 'deploy' | 'stop') => {
    setBusyId(`${id}-${action}`);
    try {
      await onTriggerAction(id, action);
    } finally {
      setBusyId(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateResource({
      action: 'create',
      name: name.trim(),
      kind,
      project_name: projectName.trim(),
      fqdn: fqdn.trim(),
    });
    setName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Status Container Coolify</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            {runningCount} / {resources.length} Running
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Orchestrator: <span className="font-mono text-slate-200">Coolify v4 API</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Rata-Rata Beban CPU</span>
            <Cpu className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{avgCpu}%</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Beban kerja container aplikasi & database
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Alokasi Memori RAM</span>
            <HardDrive className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{totalRam} MB</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Sinkronisasi terakhir: {lastSync || 'Baru saja'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Kontrol Server Otonom</span>
            <RefreshCw className={`h-4 w-4 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Coolify'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/40 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Service
            </button>
          </div>
        </div>
      </div>

      {/* Container Grid */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: `Semua (${resources.length})` },
              { id: 'RUNNING', label: `Running (${runningCount})` },
              { id: 'STOPPED', label: `Stopped (${resources.length - runningCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setPage(1);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari container / proyek..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white"
              />
            </div>
            <a
              href="https://coolify.io"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-500/40 transition"
            >
              Coolify Docs <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-4">
          {pagedResources.map((res) => {
            const isRunning = res.status.startsWith('running');
            return (
              <div
                key={res.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-300">
                      {res.kind} • {res.environment_name}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                        isRunning
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <h4 className="mt-2.5 font-mono text-sm font-bold text-white">{res.name}</h4>
                  <p className="text-xs text-emerald-400 font-medium">{res.project_name}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400 truncate">{res.fqdn}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-900/80 p-2.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">CPU Load</span>
                      <strong className="font-mono text-white">{res.cpu_percent}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Memory</span>
                      <strong className="font-mono text-white">{res.memory_mb} MB</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2.5">
                    <span>Deploy terakhir: {res.last_deployed_at}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleAction(res.id, 'restart')}
                      disabled={busyId === `${res.id}-restart`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                    >
                      <RotateCcw className="h-3 w-3" /> Restart
                    </button>
                    <button
                      onClick={() => handleAction(res.id, 'deploy')}
                      disabled={busyId === `${res.id}-deploy`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-500/30 bg-sky-500/10 py-1.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500 hover:text-slate-950 transition"
                    >
                      <Play className="h-3 w-3" /> Redeploy
                    </button>
                    <button
                      onClick={() => handleAction(res.id, 'stop')}
                      disabled={busyId === `${res.id}-stop`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 py-1.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition"
                    >
                      <Square className="h-3 w-3" /> Stop
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <PaginationControls
          totalItems={filteredResources.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sizeOptions={[6, 9, 15, 25]}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111520] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Tambah Service Coolify Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Container / Service *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: api-inventory-agropangan"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tipe Resource</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="application">Application (Docker)</option>
                    <option value="postgresql">PostgreSQL Database</option>
                    <option value="redis">Redis Cache</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nama Proyek / Klien</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Endpoint URL / Port Tailscale</label>
                <input
                  value={fqdn}
                  onChange={(e) => setFqdn(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950"
                >
                  Simpan Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. SMART DOCUMENT GENERATOR (.DOCX UNPAM 4-4-3-3 & BUSINESS PROPOSAL/MOU)
// ============================================================================
interface SmartDocGeneratorViewProps {
  documents: GeneratedDocument[];
  deals: CrmDeal[];
  courses: AcademicCourse[];
  onCreateDocument: (payload: any) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
}

export const SmartDocGeneratorView: React.FC<SmartDocGeneratorViewProps> = ({
  documents,
  deals,
  courses,
  onCreateDocument,
  onDeleteDocument,
}) => {
  const [docType, setDocType] = useState<'unpam_makalah' | 'bisnis_proposal' | 'bisnis_mou'>('unpam_makalah');
  const [title, setTitle] = useState('');
  const [clientOrCourse, setClientOrCourse] = useState(
    courses[0] ? `${courses[0].name} (${courses[0].code})` : 'Kecerdasan Buatan (TIF0501)'
  );
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [syncToGDocs, setSyncToGDocs] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);

  const handleSelectType = (nextType: 'unpam_makalah' | 'bisnis_proposal' | 'bisnis_mou') => {
    setDocType(nextType);
    if (nextType === 'unpam_makalah' && courses[0]) {
      setClientOrCourse(`${courses[0].name} (${courses[0].code})`);
    } else if (deals[0]) {
      setClientOrCourse(deals[0].company);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await onCreateDocument({
        title: title.trim(),
        doc_type: docType,
        client_or_course: clientOrCourse,
        content_markdown: contentMarkdown.trim(),
        sync_to_google_docs: syncToGDocs,
      });
      setTitle('');
      setContentMarkdown('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Builder Form */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Generator Dokumen Word (.DOCX) Baku
            </h3>
            <p className="text-xs text-slate-400">
              Otomatis menerapkan Margin A4 4-4-3-3cm, Times New Roman 12pt, Daftar Isi Native Word, Cover Bersih, dan Penomoran Bawah Tengah.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectType('unpam_makalah')}
              className={`rounded-xl border p-2.5 text-left text-xs transition ${
                docType === 'unpam_makalah'
                  ? 'border-sky-500 bg-sky-500/15 text-sky-300 font-bold'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400'
              }`}
            >
              <GraduationCap className="h-4 w-4 mb-1 text-sky-400" />
              Makalah / Proposal UNPAM
            </button>
            <button
              type="button"
              onClick={() => handleSelectType('bisnis_proposal')}
              className={`rounded-xl border p-2.5 text-left text-xs transition ${
                docType === 'bisnis_proposal'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400'
              }`}
            >
              <Briefcase className="h-4 w-4 mb-1 text-emerald-400" />
              Proposal & RAB Klien
            </button>
            <button
              type="button"
              onClick={() => handleSelectType('bisnis_mou')}
              className={`rounded-xl border p-2.5 text-left text-xs transition ${
                docType === 'bisnis_mou'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400'
              }`}
            >
              <FileText className="h-4 w-4 mb-1 text-amber-400" />
              Kontrak MoU Proyek
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Judul Dokumen / Makalah / Kontrak *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  docType === 'unpam_makalah'
                    ? 'Contoh: Analisis Keamanan Jaringan VPN WireGuard & Tailscale'
                    : 'Contoh: Pengembangan Sistem ERP & Dashboard Gudang'
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                {docType === 'unpam_makalah' ? 'Pilih Mata Kuliah UNPAM' : 'Pilih Klien / Perusahaan'}
              </label>
              <input
                value={clientOrCourse}
                onChange={(e) => setClientOrCourse(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Isi Bab / Pasal (Opsional — Kosongkan agar disusun otomatis)
              </label>
              <textarea
                rows={4}
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                placeholder="Kosongkan untuk menggunakan struktur BAB I - IV otomatis, atau tulis poin khusus di sini..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 pt-1">
              <input
                type="checkbox"
                checked={syncToGDocs}
                onChange={(e) => setSyncToGDocs(e.target.checked)}
                className="rounded border-slate-700"
              />
              <span>Sekaligus ekspor ke Google Docs (`daerobii0223@gmail.com`)</span>
            </label>

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              <Sparkles className="h-4 w-4" />
              {creating ? 'Menyusun Dokumen .DOCX...' : 'Generate Dokumen .DOCX Sekarang'}
            </button>
          </form>
        </div>

        {/* Right Document Archive & Download List */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Arsip Dokumen Siap Unduh ({documents.length})
              </h3>
              <p className="text-xs text-slate-400">
                Klik tombol Unduh .DOCX untuk mengunduh berkas Microsoft Word asli dengan pemformatan baku.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        doc.doc_type === 'unpam_makalah'
                          ? 'bg-sky-500/15 text-sky-400'
                          : doc.doc_type === 'bisnis_mou'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      {doc.doc_type === 'unpam_makalah'
                        ? 'Standar Akademik UNPAM (4-4-3-3cm)'
                        : doc.doc_type === 'bisnis_mou'
                        ? 'Kontrak Kerja MoU Klien'
                        : 'Proposal & RAB Proyek'}
                    </span>
                    <h4 className="mt-1.5 text-sm font-bold text-white">{doc.title}</h4>
                    <p className="text-xs text-slate-400">
                      {doc.client_or_course} • {doc.author_nim}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/documents/download?id=${encodeURIComponent(doc.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                    >
                      <Download className="h-3.5 w-3.5" /> Unduh .DOCX
                    </a>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-500 transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> Isi
                    </button>
                    {doc.drive_url && (
                      <a
                        href={doc.drive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300"
                      >
                        GDocs <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#111520] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400">{previewDoc.client_or_course}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-serif text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
              {previewDoc.content_markdown}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <a
                href={`/api/documents/download?id=${encodeURIComponent(previewDoc.id)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950"
              >
                <Download className="h-3.5 w-3.5" /> Unduh File .DOCX Word
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. DEEP WORK POMODORO TIMER, BILLABLE HOURS & CYCLING LOG TRACKER
// ============================================================================
interface FocusAndCyclingViewProps {
  focusSessions: FocusSession[];
  cyclingLogs: CyclingLog[];
  onCreateFocus: (payload: any) => Promise<void>;
  onDeleteFocus: (id: string) => Promise<void>;
  onCreateCycling: (payload: any) => Promise<void>;
  onDeleteCycling: (id: string) => Promise<void>;
}

export const FocusAndCyclingView: React.FC<FocusAndCyclingViewProps> = ({
  focusSessions,
  cyclingLogs,
  onCreateFocus,
  onDeleteFocus,
  onCreateCycling,
  onDeleteCycling,
}) => {
  // Live Timer State
  const [secondsLeft, setSecondsLeft] = useState(60 * 60);
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [running, setRunning] = useState(false);
  const [focusTitle, setFocusTitle] = useState('');
  const [focusDomain, setFocusDomain] = useState('Proyek Klien');
  const [hourlyRate, setHourlyRate] = useState('150000');
  const [focusNotes, setFocusNotes] = useState('');

  // Cycling Form State
  const [routeName, setRouteName] = useState('');
  const [distanceKm, setDistanceKm] = useState('25');
  const [rideMinutes, setRideMinutes] = useState('65');
  const [rideNotes, setRideNotes] = useState('');

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const setPresetMinutes = (mins: number) => {
    setRunning(false);
    setTargetMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const totalFocusHours = (
    focusSessions.reduce((s, f) => s + Number(f.duration_minutes), 0) / 60
  ).toFixed(1);
  const totalBillable = focusSessions.reduce((s, f) => s + Number(f.billable_amount), 0);
  const totalCyclingKm = cyclingLogs
    .reduce((s, c) => s + Number(c.distance_km), 0)
    .toFixed(1);
  const totalCalories = cyclingLogs.reduce((s, c) => s + Number(c.calories), 0);

  const handleSaveFocus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusTitle.trim()) return;
    await onCreateFocus({
      title: focusTitle.trim(),
      domain: focusDomain,
      duration_minutes: targetMinutes,
      hourly_rate: Number(hourlyRate) || 150000,
      notes: focusNotes.trim(),
    });
    setFocusTitle('');
    setFocusNotes('');
    setRunning(false);
  };

  const handleSaveCycling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) return;
    await onCreateCycling({
      route_name: routeName.trim(),
      distance_km: Number(distanceKm) || 20,
      duration_minutes: Number(rideMinutes) || 60,
      notes: rideNotes.trim(),
    });
    setRouteName('');
    setRideNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Jam Deep Work</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{totalFocusHours} Jam</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Dari {focusSessions.length} sesi fokus tercatat
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Nilai Ekonomis Waktu (Billable)</span>
            <Briefcase className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            {formatRupiah(totalBillable)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Akumulasi jam ngoding proyek klien
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Jarak Bersepeda (Cycling)</span>
            <Bike className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-400">{totalCyclingKm} km</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Otomatis meng-update progres OKR bulanan
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Kalori Terbakar</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">
            {totalCalories.toLocaleString('id-ID')} kcal
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Dari {cyclingLogs.length} sesi gowes tercatat
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Deep Work Timer & Billable Logger */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Deep Work Timer & Billable Hours
              </h3>
              <p className="text-xs text-slate-400">
                Ukur durasi fokus ngoding klien atau belajar kuliah UNPAM tanpa distraksi.
              </p>
            </div>
            <Timer className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-center">
            <div className="font-mono text-4xl font-bold tracking-wider text-emerald-400">
              {mm}:{ss}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {[25, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPresetMinutes(m)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    targetMinutes === m
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m} Menit
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setRunning(!running)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950"
              >
                {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {running ? 'Jeda Timer' : 'Mulai Fokus'}
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(targetMinutes)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveFocus} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Apa yang sedang dikerjakan? *</label>
              <input
                required
                value={focusTitle}
                onChange={(e) => setFocusTitle(e.target.value)}
                placeholder="Contoh: Refactor API Inventory PT Sinar Jaya"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Kategori Fokus</label>
                <select
                  value={focusDomain}
                  onChange={(e) => setFocusDomain(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="Proyek Klien">Proyek Klien (Billable)</option>
                  <option value="Kuliah UNPAM">Kuliah UNPAM</option>
                  <option value="Riset AI">Riset AI & Otomasi</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tarif per Jam (Rp)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <CheckCircle2 className="h-4 w-4" /> Simpan Sesi ({targetMinutes} Menit) ke SQLite
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {focusSessions.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400">
                    {f.domain} • {f.duration_minutes} Menit
                  </span>
                  <p className="font-bold text-white mt-0.5">{f.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {f.billable_amount > 0 && (
                    <span className="font-mono font-bold text-emerald-400">
                      {formatRupiah(f.billable_amount)}
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteFocus(f.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cycling & Endurance Tracker */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Cycling & Endurance Ride Log
              </h3>
              <p className="text-xs text-slate-400">
                Catat rute gowes, kecepatan rata-rata, dan kalori. Otomatis menambah jarak di OKR Pribadi.
              </p>
            </div>
            <Bike className="h-5 w-5 text-amber-400" />
          </div>

          <form onSubmit={handleSaveCycling} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Nama Rute Bersepeda *</label>
              <input
                required
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Contoh: BSD Loop - QBig - Alam Sutera"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Jarak Tempuh (km) *</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Durasi Bersepeda (Menit) *</label>
                <input
                  required
                  type="number"
                  value={rideMinutes}
                  onChange={(e) => setRideMinutes(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Catatan Cuaca / Cadence / Sepeda</label>
              <input
                value={rideNotes}
                onChange={(e) => setRideNotes(e.target.value)}
                placeholder="Contoh: Cadence 85 rpm, kondisi fisik prima"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 font-bold text-slate-950 hover:bg-amber-400 transition"
            >
              <Plus className="h-4 w-4" /> Catat Sesi Gowes & Update OKR
            </button>
          </form>

          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            {cyclingLogs.map((ride) => (
              <div
                key={ride.id}
                className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-amber-400 font-semibold">
                      {ride.ride_date}
                    </span>
                    <h4 className="font-bold text-white mt-0.5">{ride.route_name}</h4>
                  </div>
                  <button
                    onClick={() => onDeleteCycling(ride.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-400">
                    <Bike className="h-3.5 w-3.5" /> {ride.distance_km} km
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Gauge className="h-3.5 w-3.5 text-sky-400" /> {ride.avg_speed_kmh} km/j
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Flame className="h-3.5 w-3.5 text-rose-400" /> {ride.calories} kcal
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Mountain className="h-3.5 w-3.5 text-emerald-400" /> +{ride.elevation_m} m
                  </span>
                </div>
                {ride.notes && <p className="mt-1.5 text-[11px] text-slate-400">{ride.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
