import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Plus,
  Trash2,
  ArrowRight,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  BookOpen,
  Calendar,
  MapPin,
  UserCheck,
  Award,
  Flame,
  Target,
  Activity,
  TrendingUp,
  Check,
  X,
  FolderKanban,
  FileSpreadsheet,
  Edit3,
  Search,
  Send,
  ExternalLink,
  Bot,
  CheckCheck,
  Clock,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Copy,
  RefreshCw,
  CreditCard,
  Receipt,
  Wallet,
  Filter,
} from 'lucide-react';
import {
  CrmClient,
  CrmDeal,
  AcademicCourse,
  PersonalHabit,
  PersonalGoal,
  TaskItem,
  MentariSyncState,
  MentariForumPending,
  MentariQuizItem,
  UnpamBillingState,
} from '../types';
import { PaginationControls } from './JokiAndHostingViews';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================================
// 1. BUSINESS CRM & DEAL PIPELINE VIEW (Agency daerobi-devs)
// ============================================================================
interface CrmPipelineViewProps {
  clients: CrmClient[];
  deals: CrmDeal[];
  onCreateClient: (payload: any) => Promise<void>;
  onUpdateClient?: (id: string, payload: any) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onCreateDeal: (payload: any) => Promise<void>;
  onUpdateDealStage: (id: string, stage: CrmDeal['stage']) => Promise<void>;
  onConvertDeal: (id: string) => Promise<void>;
  onDeleteDeal: (id: string) => Promise<void>;
  onOpenDealCloser?: () => void;
}

const DEAL_STAGES: { id: CrmDeal['stage']; label: string; prob: number; badge: string }[] = [
  { id: 'Lead', label: 'Prospek Masuk (Lead)', prob: 20, badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  { id: 'Discovery', label: 'Analisis Kebutuhan', prob: 40, badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  { id: 'Proposal', label: 'Proposal & RAB', prob: 65, badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { id: 'Negotiation', label: 'Negosiasi Kontrak', prob: 85, badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { id: 'Won', label: 'Deal Closing (Won)', prob: 100, badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
];

export const CrmPipelineView: React.FC<CrmPipelineViewProps> = ({
  clients,
  deals,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  onCreateDeal,
  onUpdateDealStage,
  onConvertDeal,
  onDeleteDeal,
  onOpenDealCloser,
}) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<CrmClient | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [clientSearch, setClientSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(6);

  // Client Form
  const [cName, setCName] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cRole, setCRole] = useState('Owner / Direktur');
  const [cPhone, setCPhone] = useState('62812');
  const [cEmail, setCEmail] = useState('');
  const [cSegment, setCSegment] = useState('UMKM');
  const [cStatus, setCStatus] = useState('Lead');
  const [cLtv, setCLtv] = useState('');
  const [cNotes, setCNotes] = useState('');

  // Deal Form
  const [dTitle, setDTitle] = useState('');
  const [dCompany, setDCompany] = useState(clients[0]?.company || '');
  const [dValue, setDValue] = useState('');
  const [dStage, setDStage] = useState<CrmDeal['stage']>('Proposal');
  const [dCloseDate, setDCloseDate] = useState('2026-11-30');
  const [dNextAction, setDNextAction] = useState('');

  const totalPipelineValue = deals
    .filter((d) => d.stage !== 'Won')
    .reduce((acc, d) => acc + Number(d.value), 0);
  const weightedPipelineValue = deals
    .filter((d) => d.stage !== 'Won')
    .reduce((acc, d) => acc + (Number(d.value) * Number(d.probability)) / 100, 0);
  const wonDealsValue = deals
    .filter((d) => d.stage === 'Won')
    .reduce((acc, d) => acc + Number(d.value), 0);
  const totalLtv = clients.reduce((acc, c) => acc + Number(c.lifetime_value), 0);

  const filteredClients = clients.filter((c) => {
    if (segmentFilter !== 'ALL' && !c.segment.toLowerCase().includes(segmentFilter.toLowerCase())) {
      return false;
    }
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pagedClients = filteredClients.slice(
    (clientPage - 1) * clientPageSize,
    clientPage * clientPageSize
  );

  const openEditClient = (c: CrmClient) => {
    setEditingClient(c);
    setCName(c.name);
    setCCompany(c.company);
    setCRole(c.role);
    setCPhone(c.phone);
    setCEmail(c.email);
    setCSegment(c.segment);
    setCStatus(c.status);
    setCLtv(String(c.lifetime_value));
    setCNotes(c.notes || '');
    setShowClientModal(true);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cCompany.trim()) return;
    const payload = {
      name: cName.trim(),
      company: cCompany.trim(),
      role: cRole.trim(),
      phone: cPhone.trim(),
      email: cEmail.trim(),
      segment: cSegment,
      status: cStatus,
      lifetime_value: Number(cLtv) || 0,
      notes: cNotes.trim(),
    };
    if (editingClient && onUpdateClient) {
      await onUpdateClient(editingClient.id, payload);
    } else {
      await onCreateClient(payload);
    }
    setEditingClient(null);
    setCName('');
    setCCompany('');
    setCLtv('');
    setCNotes('');
    setShowClientModal(false);
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dTitle.trim() || !dValue) return;
    await onCreateDeal({
      kind: 'deal',
      title: dTitle.trim(),
      company: dCompany.trim() || 'Klien Baru',
      value: Number(dValue),
      stage: dStage,
      expected_close_date: dCloseDate,
      next_action: dNextAction.trim() || 'Follow up via WhatsApp',
    });
    setDTitle('');
    setDValue('');
    setDNextAction('');
    setShowDealModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Executive CRM KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Nilai Pipeline Aktif</span>
            <Briefcase className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">
            {formatRupiah(totalPipelineValue)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Estimasi tertimbang: <span className="text-emerald-400 font-semibold">{formatRupiah(weightedPipelineValue)}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Deal Closing (Won)</span>
            <CheckCircle2 className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-sky-400">
            {formatRupiah(wonDealsValue)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Siap dikonversi otomatis ke Proyek & Invoice
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Lifetime Value (LTV)</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">
            {formatRupiah(totalLtv)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Akumulasi nilai kontrak dari {clients.length} klien
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Aksi Cepat CRM Bisnis</span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 space-y-2">
            <button
              onClick={() => onOpenDealCloser?.()}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow hover:opacity-95 transition"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Deal Closer & Draf WA
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDealModal(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Deal Baru
              </button>
              <button
                onClick={() => setShowClientModal(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-500/40 transition"
              >
                <Building2 className="h-3.5 w-3.5" /> Klien Baru
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Deal Pipeline Board */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Sales & Project Deal Pipeline (5 Tahap)</h3>
            <p className="text-xs text-slate-400">
              Geser tahap negosiasi prospek atau konversi deal yang sudah closing menjadi Proyek Kanban + Invoice RAB otomatis.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
            Terintegrasi AI Chat & Telegram
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          {DEAL_STAGES.map((stageObj, sIdx) => {
            const stageDeals = deals.filter((d) => d.stage === stageObj.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);

            return (
              <div
                key={stageObj.id}
                className="flex flex-col rounded-xl border border-slate-800/90 bg-slate-950/60 p-3"
              >
                <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div>
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${stageObj.badge}`}>
                      {stageObj.label}
                    </span>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-300">
                      {formatRupiah(stageTotal)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {stageDeals.map((deal) => {
                    const nextStage = DEAL_STAGES[sIdx + 1]?.id;
                    return (
                      <div
                        key={deal.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#131824] p-3.5 hover:border-slate-700 transition min-h-[220px]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-white leading-snug line-clamp-2">{deal.title}</p>
                            <button
                              onClick={() => onDeleteDeal(deal.id)}
                              className="text-slate-500 hover:text-rose-400 shrink-0 p-0.5"
                              title="Hapus Deal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-emerald-400 truncate">{deal.company}</p>
                          <p className="mt-1.5 font-mono text-xs font-bold text-white">
                            {formatRupiah(deal.value)}
                          </p>

                          <div className="mt-2 rounded-lg bg-slate-900/90 px-2 py-1.5 text-[11px] text-slate-300">
                            <span className="text-slate-500">Tindak lanjut: </span>
                            <span className="line-clamp-2">{deal.next_action}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/70">
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="text-[10px] text-slate-400">
                              Probabilitas: <strong className="text-slate-200">{deal.probability}%</strong>
                            </span>

                            {nextStage && (
                              <button
                                onClick={() => onUpdateDealStage(deal.id, nextStage)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
                              >
                                Ke {nextStage} <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => onConvertDeal(deal.id)}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                          >
                            <FolderKanban className="h-3.5 w-3.5" /> Konversi ke Proyek & Invoice
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {stageDeals.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-800/70 p-4 text-center text-[11px] text-slate-500">
                      Belum ada deal di tahap ini
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client Directory & Relationship Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Direktori Klien & Relasi Bisnis (CRM)</h3>
            <p className="text-xs text-slate-400">
              Daftar PIC perusahaan, nilai kontrak LTV, dan pintasan hubungi langsung via WhatsApp Web.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {['ALL', 'Enterprise', 'Institusi', 'UMKM'].map((seg) => (
              <button
                key={seg}
                onClick={() => setSegmentFilter(seg)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  segmentFilter === seg
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {seg === 'ALL' ? 'Semua Segmen' : seg}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Nama PIC & Jabatan</th>
                <th className="py-3 px-3">Perusahaan / Instansi</th>
                <th className="py-3 px-3">Segmen & Status</th>
                <th className="py-3 px-3">Lifetime Value (LTV)</th>
                <th className="py-3 px-3">Catatan Kebutuhan</th>
                <th className="py-3 px-3 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {pagedClients.map((client) => {
                const cleanPhone = (client.phone || '').replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Halo Bapak/Ibu ${client.name} (${client.company}), perkenalkan saya Daerobi dari *BUATIN — Tech & Website Creation (https://buatin.biz.id)* ingin menindaklanjuti progres kebutuhan sistem & kerja sama kita.`
                )}`;
                const waOfferUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Halo Bapak/Ibu ${client.name} (${client.company}), berikut kami lampirkan estimasi RAB & rincian pengembangan sistem dari tim *BUATIN (https://buatin.biz.id)* senilai ${formatRupiah(client.lifetime_value)}. Apakah ada waktu untuk diskusi singkat minggu ini?`
                )}`;
                return (
                  <tr key={client.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-white">{client.name}</p>
                      <p className="text-[11px] text-slate-400">{client.role}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-slate-200">{client.company}</p>
                      <p className="text-[11px] text-slate-400">{client.email}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {client.segment}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            client.status.includes('Retainer')
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : client.status.includes('Active')
                              ? 'bg-sky-500/15 text-sky-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {client.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                      {formatRupiah(client.lifetime_value)}
                    </td>
                    <td className="py-3.5 px-3 max-w-xs text-slate-300">
                      <p className="line-clamp-2 text-[11px]">{client.notes || '-'}</p>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                        >
                          <Phone className="h-3 w-3" /> Follow-Up
                        </a>
                        <a
                          href={waOfferUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-sky-500/15 border border-sky-500/30 px-2 py-1.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500 hover:text-slate-950 transition"
                        >
                          Penawaran WA
                        </a>
                        <button
                          onClick={() => openEditClient(client)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                          title="Edit Klien"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <PaginationControls
            totalItems={filteredClients.length}
            page={clientPage}
            pageSize={clientPageSize}
            onPageChange={setClientPage}
            onPageSizeChange={setClientPageSize}
          />
        </div>
      </div>

      {/* Modal Tambah Klien */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111520] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Tambah Klien CRM Baru</h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama PIC *</label>
                  <input
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="Contoh: Hendra Wijaya"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Perusahaan / Instansi *</label>
                  <input
                    required
                    value={cCompany}
                    onChange={(e) => setCCompany(e.target.value)}
                    placeholder="Contoh: PT Maju Bersama"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nomor WhatsApp (Awali 62)</label>
                  <input
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    placeholder="6281288990011"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Klien</label>
                  <input
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="pic@perusahaan.co.id"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Segmen</label>
                  <select
                    value={cSegment}
                    onChange={(e) => setCSegment(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Institusi">Institusi</option>
                    <option value="UMKM">UMKM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status Relasi</label>
                  <select
                    value={cStatus}
                    onChange={(e) => setCStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="Lead">Lead (Prospek)</option>
                    <option value="Active">Active Project</option>
                    <option value="Retainer">Retainer Bulanan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estimasi LTV (Rp)</label>
                  <input
                    type="number"
                    value={cLtv}
                    onChange={(e) => setCLtv(e.target.value)}
                    placeholder="15000000"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Catatan Kebutuhan Proyek</label>
                <textarea
                  rows={2}
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  placeholder="Kebutuhan sistem ERP, aplikasi mobile, atau AI chatbot..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Simpan Klien ke SQLite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Deal Pipeline */}
      {showDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111520] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Tambah Prospek Deal Baru</h3>
              <button onClick={() => setShowDealModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddDeal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Judul Proyek / Deal *</label>
                <input
                  required
                  value={dTitle}
                  onChange={(e) => setDTitle(e.target.value)}
                  placeholder="Contoh: Pengembangan Dashboard AI Analytics"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Perusahaan Klien *</label>
                  <input
                    required
                    value={dCompany}
                    onChange={(e) => setDCompany(e.target.value)}
                    placeholder="PT Sinar Jaya Logistik"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nilai Kontrak (Rp) *</label>
                  <input
                    required
                    type="number"
                    value={dValue}
                    onChange={(e) => setDValue(e.target.value)}
                    placeholder="18500000"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tahap Pipeline Awal</label>
                  <select
                    value={dStage}
                    onChange={(e) => setDStage(e.target.value as CrmDeal['stage'])}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="Lead">Lead (20%)</option>
                    <option value="Discovery">Discovery (40%)</option>
                    <option value="Proposal">Proposal & RAB (65%)</option>
                    <option value="Negotiation">Negotiation (85%)</option>
                    <option value="Won">Won / Closing (100%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Target Closing</label>
                  <input
                    type="date"
                    value={dCloseDate}
                    onChange={(e) => setDCloseDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Langkah Tindak Lanjut (Next Action)</label>
                <input
                  value={dNextAction}
                  onChange={(e) => setDNextAction(e.target.value)}
                  placeholder="Presentasi demo MVP hari Kamis"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDealModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Masukkan ke Pipeline
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
// 2. ACADEMIC HUB UNPAM SEMESTER 5 VIEW
// ============================================================================
interface AcademicUnpamViewProps {
  courses: AcademicCourse[];
  tasks: TaskItem[];
  mentariSync?: MentariSyncState | null;
  unpamBilling?: UnpamBillingState | null;
  onIncrementAttendance: (id: string) => Promise<void>;
  onCreateCourse: (payload: any) => Promise<void>;
  onUpdateCourse?: (id: string, payload: any) => Promise<void>;
  onDeleteCourse?: (id: string) => Promise<void>;
  onOpenNewTaskModal: () => void;
}

export const AcademicUnpamView: React.FC<AcademicUnpamViewProps> = ({
  courses,
  tasks,
  mentariSync,
  unpamBilling,
  onIncrementAttendance,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onOpenNewTaskModal,
}) => {
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<'jadwal' | 'keuangan' | 'mentari' | 'tugas'>('jadwal');
  const [dayFilter, setDayFilter] = useState<'ALL' | 'Senin' | 'Selasa' | 'Rabu' | 'Jumat'>('ALL');
  const [courseSearch, setCourseSearch] = useState('');

  // Course Add/Edit Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AcademicCourse | null>(null);
  const [code, setCode] = useState('TIF0507');
  const [name, setName] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [sks, setSks] = useState('3');
  const [dayTime, setDayTime] = useState('Jumat, 13:00 - 15:30');
  const [room, setRoom] = useState('Viktor R.505');
  const [attendanceCount, setAttendanceCount] = useState('11');
  const [taskScore, setTaskScore] = useState('88');
  const [midScore, setMidScore] = useState('85');
  const [targetGrade, setTargetGrade] = useState('A');

  // Mentari Live Radar States
  const [selectedForumForReply, setSelectedForumForReply] = useState<MentariForumPending | null>(null);
  const [aiReplyDraft, setAiReplyDraft] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState<string | null>(null);

  // MyUnpam Financial States
  const [billingTab, setBillingTab] = useState<'items' | 'transactions'>('items');
  const [copiedVa, setCopiedVa] = useState<string | null>(null);

  const handleCopyVa = (vaNumber: string, label: string) => {
    try {
      navigator.clipboard.writeText(vaNumber);
      setCopiedVa(label);
      setTimeout(() => setCopiedVa(null), 2500);
    } catch {}
  };

  const pendingForums = mentariSync?.pendingForums || [];
  const quizzes = mentariSync?.quizzes || [];

  const handleGenerateAiReply = async (forum: MentariForumPending) => {
    setSelectedForumForReply(forum);
    setIsGeneratingReply(true);
    setAiReplyDraft('');
    setCopySuccess(false);
    try {
      const res = await fetch('/api/academic/mentari-sync/generate-forum-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forum),
      });
      const data = await res.json();
      if (data.ok && data.draft) {
        setAiReplyDraft(data.draft);
      } else {
        setAiReplyDraft('Gagal membuat draft balasan forum. Silakan coba lagi.');
      }
    } catch (err: any) {
      setAiReplyDraft('Terjadi kendala saat memanggil Gemini AI: ' + (err?.message || 'Error'));
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!aiReplyDraft) return;
    try {
      await navigator.clipboard.writeText(aiReplyDraft);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {}
  };

  const handleTestTelegramBlast = async () => {
    setIsTestingTelegram(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch('/api/academic/mentari-sync/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        setTelegramFeedback(data.message || 'Notifikasi Telegram berhasil dikirim ke bot Daerobi.');
      } else {
        setTelegramFeedback(data.error || 'Gagal mengirim notifikasi Telegram.');
      }
    } catch (err: any) {
      setTelegramFeedback('Gagal menghubungi server Telegram.');
    } finally {
      setIsTestingTelegram(false);
      setTimeout(() => setTelegramFeedback(null), 4500);
    }
  };

  const openEditCourse = (c: AcademicCourse) => {
    setEditingCourse(c);
    setCode(c.code);
    setName(c.name);
    setLecturer(c.lecturer);
    setSks(String(c.sks));
    setDayTime(c.day_time);
    setRoom(c.room);
    setAttendanceCount(String(c.attendance_count));
    setTaskScore(String(c.task_score));
    setMidScore(String(c.midterm_score));
    setTargetGrade(c.target_grade || 'A');
    setShowAddModal(true);
  };

  const openAddCourse = () => {
    setEditingCourse(null);
    setCode('TIF0507');
    setName('');
    setLecturer('');
    setSks('3');
    setDayTime('Jumat, 13:00 - 15:30');
    setRoom('Viktor R.505');
    setAttendanceCount('1');
    setTaskScore('85');
    setMidScore('85');
    setTargetGrade('A');
    setShowAddModal(true);
  };

  const totalSks = courses.reduce((s, c) => s + Number(c.sks), 0);
  const avgAttendance =
    courses.length > 0
      ? Math.round(
          (courses.reduce((s, c) => s + Number(c.attendance_count) / Number(c.total_meetings || 14), 0) /
            courses.length) *
            100
        )
      : 0;
  const kuliahTasks = tasks.filter((t) => t.scope === 'kuliah');

  // Compute Today's Name in Indonesian
  const todayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());

  // Filtered courses based on Day and Search keyword
  const filteredCourses = courses.filter((c) => {
    if (dayFilter !== 'ALL' && !(c.day_time || '').toLowerCase().includes(dayFilter.toLowerCase())) {
      return false;
    }
    if (courseSearch.trim()) {
      const q = courseSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.lecturer || '').toLowerCase().includes(q) ||
        (c.room || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      code,
      name: name.trim(),
      lecturer: lecturer.trim() || 'Dosen Pengampu UNPAM',
      sks: Number(sks) || 3,
      day_time: dayTime,
      room,
      attendance_count: Number(attendanceCount) || 1,
      task_score: Number(taskScore) || 85,
      mid_score: Number(midScore) || 85,
      target_grade: targetGrade || 'A',
    };
    if (editingCourse && onUpdateCourse) {
      await onUpdateCourse(editingCourse.id, payload);
    } else {
      await onCreateCourse(payload);
    }
    setEditingCourse(null);
    setName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. STUDENT IDENTITY & TOP ACTION BAR (Bento Overview Style) */}
      <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#171c29] text-white font-mono font-bold text-sm">
              UNPAM
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Akademik & E-Learning UNPAM
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {unpamBilling?.registration_status || 'Lunas / Aktif'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-mono text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  MOD v2
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 font-mono">
                <span className="text-white font-semibold">
                  {mentariSync?.studentName || 'DAEROBI'}
                </span>
                <span>•</span>
                <span>NIM {unpamBilling?.student_nim || '241011401811'}</span>
                <span>•</span>
                <span>Kelas 05TPLP012</span>
                <span>•</span>
                <span>Teknik Informatika</span>
                <span>•</span>
                <span className="text-slate-300">Kampus Viktor</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
            <a
              href="https://mentari.unpam.ac.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> Mentari
            </a>
            <a
              href="https://my.unpam.ac.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> MyUNPAM
            </a>
            <button
              type="button"
              onClick={openAddCourse}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Matkul Baru
            </button>
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Tugas Kuliah
            </button>
          </div>
        </div>
      </div>

      {/* 2. BENTO 4 KPI CARDS (Matches Overview Command Layout) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total SKS */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Beban Studi Semester 5</span>
            <GraduationCap className="h-4 w-4 text-slate-400" />
          </div>
          <div className="my-3 font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
            {totalSks} SKS
          </div>
          <p className="text-xs text-slate-400">
            {courses.length} Mata Kuliah • Reguler C Viktor
          </p>
        </div>

        {/* Card 2: Rata-Rata Presensi Kehadiran */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Rata-Rata Presensi</span>
            <UserCheck className="h-4 w-4 text-slate-400" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
              {avgAttendance}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">Target UAS: 75%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.min(100, avgAttendance)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Status Keuangan & SPP */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Status SPP & Keuangan</span>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>
          <div className="my-3 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
            Rp {(unpamBilling?.total_paid || 2000000).toLocaleString('id-ID')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>100% Lunas (Sisa Rp 0)</span>
          </div>
        </div>

        {/* Card 4: Radar Mentari Live */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Radar Mentari E-Learning</span>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div className="my-3 font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
            {pendingForums.length}
            <span className="ml-2 text-xs font-normal text-slate-400 font-sans">Forum Pending</span>
          </div>
          <p className="text-xs text-slate-400">
            {quizzes.length} Kuis Terdata • Telegram Siap
          </p>
        </div>
      </div>

      {/* 3. SEGMENTED NAVIGATION TABS (Overview Style Pill Controls) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#121621] p-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('jadwal')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'jadwal'
                ? 'bg-white text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Jadwal & Presensi</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                activeTab === 'jadwal' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/10 text-slate-300'
              }`}
            >
              {courses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keuangan')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'keuangan'
                ? 'bg-white text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Keuangan & SPP</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mentari')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'mentari'
                ? 'bg-white text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Radar Mentari</span>
            {pendingForums.length > 0 && (
              <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-mono text-rose-300">
                {pendingForums.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tugas')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'tugas'
                ? 'bg-white text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Tugas & Makalah</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                activeTab === 'tugas' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/10 text-slate-300'
              }`}
            >
              {kuliahTasks.length}
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 text-xs text-slate-400 font-mono">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Hari ini: {todayName}</span>
        </div>
      </div>

      {/* 4. TAB CONTENT 1: JADWAL & PRESENSI */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          {/* Day Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#121621] p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'Senin', 'Selasa', 'Rabu', 'Jumat'] as const).map((day) => {
                const count =
                  day === 'ALL'
                    ? courses.length
                    : courses.filter((c) => (c.day_time || '').toLowerCase().includes(day.toLowerCase())).length;
                const isSelected = dayFilter === day;
                const isToday = todayName.toLowerCase() === day.toLowerCase();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setDayFilter(day)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? 'bg-white text-slate-950 font-bold shadow-sm'
                        : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07]'
                    }`}
                  >
                    <span>{day === 'ALL' ? 'Semua Hari' : day}</span>
                    <span className="font-mono text-[10px] opacity-75">
                      {count}
                    </span>
                    {isToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Hari Ini" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Cari matkul, dosen, ruang..."
                  className="w-full rounded-full border border-white/10 bg-[#171c29] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/30 focus:outline-none"
                />
                {courseSearch && (
                  <button
                    onClick={() => setCourseSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Course Cards Grid (Bento Style) */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const totalMeetings = Number(course.total_meetings || 14);
                const attendance = Number(course.attendance_count || 0);
                const pct = Math.min(100, Math.round((attendance / totalMeetings) * 100));
                const isUasSafe = pct >= 75;

                return (
                  <div
                    key={course.id}
                    className="group flex flex-col justify-between rounded-3xl border border-white/[0.07] bg-[#121621] p-5 hover:border-white/20 hover:-translate-y-0.5 transition duration-200"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full border border-white/10 bg-[#171c29] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-300">
                            {course.sks} SKS
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {course.code.split('-')[2] || course.code}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-slate-300 font-medium">
                          <span className={`h-2 w-2 rounded-full ${isUasSafe ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span>{isUasSafe ? `Aman (${pct}%)` : `Perlu Hadir (${pct}%)`}</span>
                        </span>
                      </div>

                      {/* Course Title & Lecturer */}
                      <h4 className="mt-3.5 text-base font-bold text-white tracking-tight group-hover:text-slate-200 transition">
                        {course.name}
                      </h4>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <GraduationCap className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="line-clamp-1">{course.lecturer}</span>
                      </p>

                      {/* Schedule & Room Chips */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.05] bg-[#171c29] px-2.5 py-1 text-slate-300 font-mono">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {course.day_time}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.05] bg-[#171c29] px-2.5 py-1 text-slate-300 font-mono">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {course.room}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400 font-medium">
                            Kehadiran: <strong className="text-white font-mono">{attendance}/{totalMeetings}</strong> Pertemuan
                          </span>
                          <span className="font-mono font-bold text-white">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-white transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Footer: Scores & Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                          <span>Tugas: <strong className="text-slate-200">{course.task_score}</strong></span>
                          <span>•</span>
                          <span>UTS: <strong className="text-slate-200">{course.midterm_score}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onIncrementAttendance(course.id)}
                            disabled={attendance >= totalMeetings}
                            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.08] hover:bg-white hover:text-slate-950 text-white px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40"
                            title="Catat 1 Kehadiran Kuliah"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>+1 Hadir</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditCourse(course)}
                            className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-slate-400 hover:text-white transition"
                            title="Edit Nilai & Jadwal"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {onDeleteCourse && (
                            <button
                              type="button"
                              onClick={() => onDeleteCourse(course.id)}
                              className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-slate-400 hover:text-rose-400 transition"
                              title="Hapus Matkul"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-12 text-center">
              <BookOpen className="h-8 w-8 text-slate-600 mx-auto" />
              <h4 className="mt-3 text-sm font-bold text-white">Tidak ada mata kuliah yang cocok</h4>
              <p className="mt-1 text-xs text-slate-400">
                Coba ganti filter hari atau bersihkan kata kunci pencarian.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDayFilter('ALL');
                  setCourseSearch('');
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT 2: STATUS KEUANGAN & SPP */}
      {activeTab === 'keuangan' && (
        <div className="space-y-5">
          {/* 4 Bento Financial Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Total Beban Biaya Sem 5</span>
                <Receipt className="h-4 w-4 text-slate-400" />
              </div>
              <div className="my-3 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
                Rp {(unpamBilling?.total_billed || 2000000).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-400">
                SPP Tetap, SKS, Lab & Registrasi
              </p>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Pembayaran Terverifikasi</span>
                <CheckCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="my-3 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
                Rp {(unpamBilling?.total_paid || 2000000).toLocaleString('id-ID')}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>100% Lunas (4 Angsuran)</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Sisa Tunggakan Biaya</span>
                <ShieldCheck className="h-4 w-4 text-slate-400" />
              </div>
              <div className="my-3 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
                Rp {(unpamBilling?.total_remaining || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-400">
                Bebas Tunggakan Finansial
              </p>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Syarat Ujian UAS / UTS</span>
                <Award className="h-4 w-4 text-slate-400" />
              </div>
              <div className="my-3 font-mono text-2xl font-bold tracking-tight text-white">
                Memenuhi Syarat
              </div>
              <p className="text-xs text-slate-400">
                Kartu Ujian Semester Siap Cetak
              </p>
            </div>
          </div>

          {/* Virtual Account Box (Bento Style) */}
          <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Nomor Rekening Virtual Account (VA) UNPAM Mahasiswa
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Atas Nama: <strong className="text-white">{unpamBilling?.student_name || 'DAEROBI'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#171c29] p-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Bank Mandiri VA</span>
                  <p className="font-mono text-sm font-bold text-white mt-0.5">{unpamBilling?.va_mandiri || '88710241011401811'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyVa(unpamBilling?.va_mandiri || '88710241011401811', 'Mandiri')}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white hover:text-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                >
                  {copiedVa === 'Mandiri' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedVa === 'Mandiri' ? 'Tersalin' : 'Salin'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#171c29] p-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Bank BNI VA</span>
                  <p className="font-mono text-sm font-bold text-white mt-0.5">{unpamBilling?.va_bni || '98810241011401811'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyVa(unpamBilling?.va_bni || '98810241011401811', 'BNI')}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white hover:text-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                >
                  {copiedVa === 'BNI' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedVa === 'BNI' ? 'Tersalin' : 'Salin'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#171c29] p-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Bank BCA VA</span>
                  <p className="font-mono text-sm font-bold text-white mt-0.5">{unpamBilling?.va_bca || '70010241011401811'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyVa(unpamBilling?.va_bca || '70010241011401811', 'BCA')}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white hover:text-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                >
                  {copiedVa === 'BCA' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedVa === 'BCA' ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>
          </div>

          {/* Breakdown Tabs: Komponen Biaya vs Riwayat Kwitansi */}
          <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setBillingTab('items')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition ${
                  billingTab === 'items'
                    ? 'bg-white text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="h-3.5 w-3.5" /> Rincian Komponen Biaya ({unpamBilling?.items?.length || 3})
              </button>
              <button
                type="button"
                onClick={() => setBillingTab('transactions')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition ${
                  billingTab === 'transactions'
                    ? 'bg-white text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" /> Riwayat Transaksi & Kwitansi ({unpamBilling?.transactions?.length || 4})
              </button>
            </div>

            {billingTab === 'items' ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(unpamBilling?.items || []).map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#171c29] p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-400 uppercase">Komponen #{idx + 1}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {it.status}
                        </span>
                      </div>
                      <h5 className="mt-2 text-xs font-bold text-white line-clamp-2">{it.name}</h5>
                      {it.notes && (
                        <p className="mt-1 text-[11px] text-slate-400">{it.notes}</p>
                      )}
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-white/[0.06] font-mono text-sm font-bold text-white">
                      Rp {Number(it.amount).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {(unpamBilling?.transactions || []).map((tx, idx) => (
                  <div
                    key={tx.receipt_number || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#171c29] p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{tx.receipt_number}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {tx.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white font-medium">{tx.description}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{tx.channel} • {tx.date}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="font-mono text-sm font-bold text-white">
                        Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </span>
                      <p className="text-[10px] text-slate-500">SIM UNPAM Verified</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: RADAR MENTARI LIVE */}
      {activeTab === 'mentari' && (
        <div className="space-y-5">
          {/* Extension Bridge Banner */}
          <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Radar Mentari E-Learning UNPAM (Live Extension Bridge)
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                    MOD v2 CONNECTED
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Tersambung langsung dengan ekstensi Chrome <code className="text-slate-300">mentari-modv2</code>. Data forum diskusi dan kuis disinkronkan secara realtime ke Nexus OS.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-mono">
                  {mentariSync?.syncedAt ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>
                        Mahasiswa: <strong>{mentariSync.studentName || 'Daerobi'}</strong> ({mentariSync.studentNim || 'UNPAM TI'})
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        Sync: {new Date(mentariSync.syncedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Menunggu sinkronisasi dari ekstensi Mentari Mod v2</span>
                    </div>
                  )}

                  {mentariSync && (
                    <span className="text-slate-400">
                      {pendingForums.length} Forum Pending • {quizzes.length} Kuis Terdata
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestTelegramBlast}
                  disabled={isTestingTelegram}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200 disabled:opacity-50 transition"
                  title="Kirim notifikasi radar forum saat ini ke Telegram bot Daerobi"
                >
                  {isTestingTelegram ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Tes Notifikasi Telegram
                    </>
                  )}
                </button>
              </div>
            </div>

            {telegramFeedback && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-200 flex items-center gap-2 font-mono">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{telegramFeedback}</span>
              </div>
            )}
          </div>

          {/* Radar Forum Diskusi Dosen (Belum Dibalas) */}
          <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Radar Forum Diskusi Dosen (Belum Dibalas)
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-mono text-slate-300">
                    {pendingForums.length} Pending
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Topik forum perkuliahan aktif yang belum Anda jawab. Dosen UNPAM menggunakan respon forum sebagai komponen absensi & keaktifan mahasiswa.
                </p>
              </div>
            </div>

            {pendingForums.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {pendingForums.map((f, idx) => (
                  <div
                    key={f.id || idx}
                    className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#171c29] p-5 hover:border-white/15 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="text-white font-bold">
                          {f.courseCode || 'UNPAM'}
                        </span>
                        <span className="text-slate-400">
                          {f.sectionName || 'Pertemuan'}
                        </span>
                      </div>

                      <h4 className="mt-2.5 text-sm font-bold text-white line-clamp-2">
                        {f.topicTitle}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-400 font-medium">
                        {f.courseName}
                      </p>

                      {f.content && (
                        <div className="mt-3 rounded-xl bg-black/30 p-3 text-[11px] text-slate-300 line-clamp-3 border border-white/[0.04]">
                          {f.content.replace(/<[^>]+>/g, '').trim()}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <a
                        href={f.url || 'https://mentari.unpam.ac.id'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white font-medium"
                      >
                        <ExternalLink className="h-3 w-3" /> Buka di Mentari
                      </a>

                      <button
                        type="button"
                        onClick={() => handleGenerateAiReply(f)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] hover:bg-white hover:text-slate-950 text-white px-3 py-1.5 text-xs font-semibold transition"
                      >
                        <Bot className="h-3.5 w-3.5" /> Draft Jawaban AI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-[#171c29] p-8 text-center">
                <ShieldCheck className="h-8 w-8 text-slate-500 mx-auto" />
                <h4 className="mt-3 text-sm font-bold text-white">Semua Forum Mentari Beres!</h4>
                <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                  Tidak ada topik diskusi perkuliahan yang pending saat ini. Seluruh forum dosen pada mata kuliah aktif Anda sudah dibalas dengan tuntas.
                </p>
              </div>
            )}
          </div>

          {/* Radar Kuis & Evaluasi Mentari */}
          {quizzes.length > 0 && (
            <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Radar Kuis & Evaluasi Perkuliahan (Mentari Live)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pre-test, post-test, dan evaluasi dosen yang terdeteksi pada semester aktif ini.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-mono text-slate-300">
                  {quizzes.length} Kuis
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {quizzes.slice(0, 8).map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#171c29] p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400 uppercase">{q.courseCode}</span>
                        <span className="text-slate-300 font-semibold">
                          {q.completed ? 'Selesai' : 'Belum Dikerjakan'}
                        </span>
                      </div>
                      <h5 className="mt-2 text-xs font-bold text-white line-clamp-1">{q.title}</h5>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{q.courseName}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">
                        Nilai: <strong className="text-white">{q.grade ?? '-'}</strong>
                      </span>
                      {q.url && (
                        <a
                          href={q.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-[11px]"
                        >
                          Buka <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB CONTENT 4: TUGAS KULIAH & MAKALAH */}
      {activeTab === 'tugas' && (
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Antrean Tugas Kuliah & Makalah UNPAM</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tersinkronisasi otomatis dengan papan Kanban Tugas & Proyek Nexus OS.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Tugas
            </button>
          </div>

          {kuliahTasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {kuliahTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#171c29] p-4 hover:border-white/15 transition"
                >
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 font-mono">
                      {t.subject_or_client}
                    </span>
                    <p className="text-sm font-bold text-white mt-0.5">{t.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Tenggat: {t.due_date}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300 uppercase font-mono">
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-[#171c29] p-8 text-center">
              <FolderKanban className="h-8 w-8 text-slate-600 mx-auto" />
              <h4 className="mt-3 text-sm font-bold text-white">Tidak ada tugas kuliah yang pending</h4>
              <p className="mt-1 text-xs text-slate-400">
                Semua makalah dan tugas praktikum perkuliahan UNPAM saat ini sudah selesai dikerjakan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 8. MODAL: TAMBAH / EDIT MATA KULIAH */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#121621] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingCourse ? 'Edit Mata Kuliah UNPAM' : 'Tambah Mata Kuliah UNPAM'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Kode Matkul</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171c29] px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jumlah SKS</label>
                  <input
                    type="number"
                    value={sks}
                    onChange={(e) => setSks(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171c29] px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nama Mata Kuliah *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pemrograman Web I"
                  className="w-full rounded-xl border border-white/10 bg-[#171c29] px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Dosen Pengampu</label>
                <input
                  value={lecturer}
                  onChange={(e) => setLecturer(e.target.value)}
                  placeholder="Nama Dosen, S.Kom., M.Kom."
                  className="w-full rounded-xl border border-white/10 bg-[#171c29] px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Hari & Jam</label>
                  <input
                    value={dayTime}
                    onChange={(e) => setDayTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171c29] px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Ruang Kelas</label>
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171c29] px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Hadir</label>
                  <input
                    type="number"
                    value={attendanceCount}
                    onChange={(e) => setAttendanceCount(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171c29] px-2.5 py-2 text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nilai Tugas</label>
                  <input
                    type="number"
                    value={taskScore}
                    onChange={(e) => setTaskScore(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171c29] px-2.5 py-2 text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nilai UTS</label>
                  <input
                    type="number"
                    value={midScore}
                    onChange={(e) => setMidScore(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171c29] px-2.5 py-2 text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Target</label>
                  <input
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171c29] px-2.5 py-2 text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-white px-5 py-2 font-semibold text-slate-950 hover:bg-slate-200"
                >
                  {editingCourse ? 'Simpan Perubahan' : 'Simpan Matkul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: AI FORUM REPLY DRAFTING ASSISTANT */}
      {selectedForumForReply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/[0.08] bg-[#121621] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#171c29] text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Draft Balasan Forum Mentari (Gemini AI)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedForumForReply.courseName} • {selectedForumForReply.sectionName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedForumForReply(null)}
                className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Prompt / Topic Info */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#171c29] p-4 text-xs">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                Topik Diskusi Dosen
              </span>
              <p className="text-white font-semibold mt-1">
                {selectedForumForReply.topicTitle}
              </p>
              {selectedForumForReply.content && (
                <p className="mt-1 text-slate-400 text-[11px] line-clamp-2">
                  {selectedForumForReply.content.replace(/<[^>]+>/g, '').trim()}
                </p>
              )}
            </div>

            {/* AI Generated Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-slate-300" />
                  Rekomendasi Jawaban Akademik (Siap Kirim ke Mentari)
                </span>
                <button
                  type="button"
                  onClick={() => handleGenerateAiReply(selectedForumForReply)}
                  disabled={isGeneratingReply}
                  className="text-[11px] text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isGeneratingReply ? 'animate-spin' : ''}`} />
                  Generate Ulang
                </button>
              </div>

              {isGeneratingReply ? (
                <div className="rounded-2xl border border-white/[0.06] bg-[#171c29] p-8 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-white mx-auto" />
                  <p className="font-medium text-slate-200">Menyusun argumen akademik...</p>
                  <p className="text-[11px] text-slate-500">
                    Menganalisis konsep materi dan merumuskan jawaban kritis tanpa kata template.
                  </p>
                </div>
              ) : (
                <textarea
                  rows={8}
                  value={aiReplyDraft}
                  onChange={(e) => setAiReplyDraft(e.target.value)}
                  placeholder="Draft jawaban akan muncul di sini..."
                  className="w-full rounded-2xl border border-white/10 bg-[#171c29] p-3 text-xs leading-relaxed text-slate-200 focus:border-white/30 focus:outline-none"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <a
                href={selectedForumForReply.url || 'https://mentari.unpam.ac.id'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-semibold"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Buka Forum di Mentari
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedForumForReply(null)}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={handleCopyDraft}
                  disabled={!aiReplyDraft || isGeneratingReply}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200 disabled:opacity-50 transition"
                >
                  {copySuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Tersalin ke Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Salin Jawaban
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. PERSONAL OS VIEW (Habits, Cycling & Quarterly OKR Goals)
// ============================================================================
interface PersonalOsViewProps {
  habits: PersonalHabit[];
  goals: PersonalGoal[];
  onToggleHabit: (id: string) => Promise<void>;
  onCreateHabit: (payload: any) => Promise<void>;
  onUpdateGoalProgress: (id: string, delta: number) => Promise<void>;
}

export const PersonalOsView: React.FC<PersonalOsViewProps> = ({
  habits,
  goals,
  onToggleHabit,
  onCreateHabit,
  onUpdateGoalProgress,
}) => {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Olahraga & Cycling');
  const [newHabitNote, setNewHabitNote] = useState('Target rutin harian');

  const completedTodayCount = habits.filter((h) => h.completed_today).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, Number(h.current_streak)), 0);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    await onCreateHabit({
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      target_per_week: 5,
      unit_note: newHabitNote.trim(),
    });
    setNewHabitTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Personal OS KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ritme Habit Hari Ini</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">
            {completedTodayCount} / {habits.length} Selesai
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Keseimbangan ngoding, kuliah UNPAM, dan bersepeda
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Streak Konsistensi Tertinggi</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-400">{longestStreak} Hari</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Pertahankan ritme harian tanpa putus
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Kuartal & OKR Pribadi</span>
            <Target className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{goals.length} Fokus Utama</p>
          <p className="mt-1 text-[11px] text-emerald-400">
            Bisnis Agency, Kebugaran Cycling & Akademik
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Daily Habit Tracker */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Habit Tracker & Rutinitas Harian</h3>
            <p className="text-xs text-slate-400">
              Centang aktivitas harianmu untuk menambah streak konsistensi.
            </p>
          </div>

          <div className="space-y-2.5">
            {habits.map((habit) => (
              <div
                key={habit.id}
                onClick={() => onToggleHabit(habit.id)}
                className={`cursor-pointer flex items-center justify-between rounded-xl border p-3.5 transition ${
                  habit.completed_today
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                      habit.completed_today
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                        : 'border-slate-700 bg-slate-900 text-transparent'
                    }`}
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        habit.completed_today ? 'text-emerald-300' : 'text-white'
                      }`}
                    >
                      {habit.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {habit.category} • {habit.unit_note}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-2.5 py-1 text-xs font-bold text-amber-400">
                  <Flame className="h-3.5 w-3.5" />
                  <span>{habit.current_streak} hari</span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddHabit} className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <p className="text-xs font-semibold text-slate-300">Tambah Habit Baru</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="Contoh: Latihan Cadence Sepeda"
                className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="Olahraga & Cycling">Olahraga & Cycling</option>
                <option value="Engineering & AI">Engineering & AI</option>
                <option value="Akademik UNPAM">Akademik UNPAM</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                value={newHabitNote}
                onChange={(e) => setNewHabitNote(e.target.value)}
                placeholder="Catatan target (misal: 20 km / 60 menit)"
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah
              </button>
            </div>
          </form>
        </div>

        {/* Right: OKR & Life Goals */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Target OKR Pribadi, Bisnis & Kebugaran</h3>
            <p className="text-xs text-slate-400">
              Pantau progres pencapaian target besar semester ini secara terukur.
            </p>
          </div>

          <div className="space-y-3.5">
            {goals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((Number(goal.current_value) / Number(goal.target_value || 1)) * 100)
              );
              const isRupiah = goal.unit === 'IDR';
              const stepDelta = isRupiah ? 1000000 : goal.unit === 'km' ? 15 : 1;

              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        {goal.domain}
                      </span>
                      <h4 className="mt-1.5 text-xs font-bold text-white">{goal.title}</h4>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400">{pct}%</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">
                      Capaian:{' '}
                      <strong className="text-white">
                        {isRupiah
                          ? formatRupiah(goal.current_value)
                          : `${goal.current_value} ${goal.unit}`}
                      </strong>{' '}
                      dari{' '}
                      {isRupiah
                        ? formatRupiah(goal.target_value)
                        : `${goal.target_value} ${goal.unit}`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateGoalProgress(goal.id, stepDelta)}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                      >
                        + Tambah Progres
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
