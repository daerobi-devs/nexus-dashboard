import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Send,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  Clock,
  ShieldCheck,
  FileCode,
  Building2,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import type { DashboardState } from '../types';

interface DealClosingAssistantModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onRefreshState: (next: DashboardState) => void;
  showToast: (msg: string) => void;
  setErrorMsg: (msg: string | null) => void;
  initialClientName?: string;
  initialTopic?: string;
  initialBudget?: number;
}

interface PitchOption {
  tone: string;
  target: string;
  message: string;
}

interface DealAnalysisResult {
  summary: string;
  difficulty: 'Mudah' | 'Sedang' | 'Kompleks';
  estimatedDays: number;
  recommendedPrice: number;
  recommendedDp: number;
  priceBreakdown: { item: string; cost: number }[];
  pitchOptions: PitchOption[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DealClosingAssistantModal({
  isOpen,
  isDark,
  onClose,
  onRefreshState,
  showToast,
  setErrorMsg,
  initialClientName = '',
  initialTopic = '',
  initialBudget,
}: DealClosingAssistantModalProps) {
  const [clientName, setClientName] = useState(initialClientName);
  const [clientPhone, setClientPhone] = useState('');
  const [segment, setSegment] = useState<'unpam_student' | 'umkm' | 'agency_corporate'>('unpam_student');
  const [deadline, setDeadline] = useState('2-3 Hari');
  const [category, setCategory] = useState('Web Fullstack (React/Node/Laravel)');
  const [brief, setBrief] = useState(initialTopic);
  const [initialClientBudget, setInitialClientBudget] = useState(initialBudget ? String(initialBudget) : '');

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DealAnalysisResult | null>(null);
  const [selectedPitchIndex, setSelectedPitchIndex] = useState(0);
  const [savingToOrder, setSavingToOrder] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAnalyzeAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.trim() || loading) return;

    setLoading(true);
    setAnalysisResult(null);

    const segmentLabel =
      segment === 'unpam_student'
        ? 'Mahasiswa UNPAM / Teman Kuliah (Tugas Pemrograman / Lab / Skripsi TI)'
        : segment === 'umkm'
        ? 'Pemilik Usaha / UMKM Lokal (Landing Page / Web Profil / Sistem Kasir POS)'
        : 'Perusahaan / Lembaga Korporat (Sistem ERP / Web Multi-Cabang / API Integration)';

    const promptPayload = `Anda adalah Spesialis Negosiasi, Pricing & Deal Closing untuk Daerobi (daerobi-devs, Mahasiswa Teknik Informatika UNPAM Semester 5 sekaligus Fullstack & AI Engineer).

TUGAS ANDA:
Analisis brief pengerjaan berikut, hitung estimasi biaya realistis pasar Indonesia yang menguntungkan namun masuk akal, dan susun 3 opsi draf pesan penawaran WhatsApp siap kirim yang persuasif dan meyakinkan.

KONTEKS INPUT:
- Nama Klien: ${clientName.trim() || 'Rekan'}
- Segmen: ${segmentLabel}
- Kategori / Stack: ${category}
- Target Deadline: ${deadline}
- Tawaran Budget Awal Klien: ${initialClientBudget ? `Rp ${initialClientBudget}` : 'Belum disebutkan / Minta estimasi'}
- Raw Chat / Brief Lengkap dari Klien:
"""
${brief.trim()}
"""

STANDAR ATURAN NEGOSIASI DAEROBI (SANGAT KETAT):
1. DILARANG menggunakan gaya kaku bot CS korporat ("Halo Kak, terima kasih telah menghubungi kami...").
2. Gunakan gaya ramah, solutif, profesional, dan meyakinkan ("Halo mas/kak ${clientName || '[Nama]'}" atau "Halo bro/rekan...").
3. Tunjukkan pemahaman teknis atas brief (sebutkan alur data, arsitektur, atau fitur kunci agar klien yakin Daerobi benar-benar kompeten).
4. Berikan jaminan deliverables:
   - Source code rapi & clean architecture.
   - Video panduan instalasi & cara running di localhost.
   - Garansi revisi gratis sampai tugas di-ACC dosen atau fungsi web 100% jalan.
5. Ketentuan Pembayaran:
   - Wajib DP 50% untuk mengamankan jadwal pengerjaan.
   - Pelunasan saat demo selesai & siap serah terima.
   - Pembayaran via QRIS Dinamis atau Transfer BCA.

KEMBALIKAN HANYA FORMAT JSON MURNI TANPA MARKDOWN TAMBAHAN:
{
  "summary": "Ringkasan teknis proyek dalam 1-2 kalimat lugas",
  "difficulty": "Mudah" | "Sedang" | "Kompleks",
  "estimatedDays": 2,
  "recommendedPrice": 450000,
  "recommendedDp": 225000,
  "priceBreakdown": [
    { "item": "Pengembangan Fitur & UI", "cost": 250000 },
    { "item": "Setup Database & API", "cost": 150000 },
    { "item": "Garansi Revisi & Panduan Setup", "cost": 50000 }
  ],
  "pitchOptions": [
    {
      "tone": "Percaya Diri & Teknis Padat (Rekomendasi Utama)",
      "target": "Umum / Mahasiswa & Klien yang butuh kepastian mutu",
      "message": "Isi pesan WhatsApp lengkap siap kirim..."
    },
    {
      "tone": "Santai & Rekan Kuliah",
      "target": "Teman sekelas UNPAM / rekan mahasiswa",
      "message": "Isi pesan WhatsApp santai tapi solutif..."
    },
    {
      "tone": "Bisnis & Bergaransi Formal",
      "target": "UMKM / Instansi Pemilik Usaha",
      "message": "Isi pesan WhatsApp profesional..."
    }
  ]
}`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptPayload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memproses draf penawaran deal.');

      onRefreshState(json.state);

      const rawAnswer = json.answer || '';
      const cleanJsonStr = rawAnswer
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed: DealAnalysisResult = JSON.parse(cleanJsonStr);
      setAnalysisResult(parsed);
      setSelectedPitchIndex(0);
      showToast('Analisis penawaran & draf WhatsApp berhasil dibuat!');
    } catch (err: any) {
      // Fallback parser if JSON parse failed
      try {
        const fallbackResult: DealAnalysisResult = {
          summary: `Pengerjaan ${category} untuk ${clientName || 'Klien'} dengan estimasi deadline ${deadline}.`,
          difficulty: 'Sedang',
          estimatedDays: deadline.includes('Besok') ? 1 : 3,
          recommendedPrice: segment === 'unpam_student' ? 350000 : segment === 'umkm' ? 2500000 : 5000000,
          recommendedDp: segment === 'unpam_student' ? 175000 : segment === 'umkm' ? 1250000 : 2500000,
          priceBreakdown: [
            { item: 'Implementasi Fitur Utama', cost: 200000 },
            { item: 'Integrasi Database & Testing', cost: 100000 },
            { item: 'Garansi Revisi & Video Demo', cost: 50000 },
          ],
          pitchOptions: [
            {
              tone: 'Percaya Diri & Teknis Padat (Rekomendasi)',
              target: 'Klien Umum',
              message: `Halo mas/kak ${clientName || 'rekan'}, terkait kebutuhan ${brief.slice(0, 60)} sudah saya pelajari briefnya.\n\nUntuk pengerjaan ini estimasi butuh ${deadline} dengan hasil source code rapi, video panduan cara jalanin di localhost, plus garansi revisi sampai di-ACC.\n\nEstimasi biayanya Rp 350.000 dengan DP 50% (Rp 175.000) untuk amankan slot pengerjaan. Jika oke, bisa langsung saya masukkan antrean hari ini ya!`,
            },
          ],
        };
        setAnalysisResult(fallbackResult);
        showToast('Analisis selesai dengan format ringkas.');
      } catch {
        setErrorMsg('Gagal memformat hasil analisis AI. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPitch = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Draf pesan WhatsApp disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = (text: string) => {
    if (!text) return;
    let cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('08')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveToJokiOrder = async () => {
    if (!analysisResult) return;
    setSavingToOrder(true);
    try {
      const studentName = clientName.trim() || 'Klien Baru';
      const taskTitle = analysisResult.summary || brief.slice(0, 50);
      const res = await fetch('/api/joki/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_phone: clientPhone || '-',
          university: segment === 'unpam_student' ? 'Universitas Pamulang (UNPAM)' : 'Klien Eksternal',
          course_name: category,
          task_title: taskTitle,
          price: analysisResult.recommendedPrice,
          dp_amount: analysisResult.recommendedDp,
          due_date: new Date(Date.now() + 86400000 * analysisResult.estimatedDays)
            .toISOString()
            .slice(0, 10),
          notes: `Deal via AI Closer. Breakdown: ${analysisResult.summary}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan ke antrean order.');
      onRefreshState(json);
      showToast(`Order "${taskTitle}" berhasil dibuat di database!`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSavingToOrder(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className={`relative w-full max-w-4xl my-8 rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'border-white/[0.08] bg-[#121621] text-white' : 'border-slate-200 bg-white text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>AI Deal Closer & Pricing Negotiator</span>
                  <span className="rounded-full bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                    daerobi-devs
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Hitung estimasi harga realistis & susun template chat WhatsApp meyakinkan dalam 3 detik.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
            {/* Input Form */}
            <form onSubmit={handleAnalyzeAndGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Calon Klien / Mahasiswa
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Contoh: Rizky Pratama / Bu Sarah"
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs ${
                      isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nomor WhatsApp Klien (Opsional)
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs ${
                      isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Deadline Pengerjaan
                  </label>
                  <select
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs font-medium ${
                      isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <option value="Besok (Rush Order / Prioritas Tinggi)">Besok (Rush Order / Prioritas Tinggi)</option>
                    <option value="2-3 Hari">2-3 Hari Kerja</option>
                    <option value="5-7 Hari">5-7 Hari (Standar)</option>
                    <option value="2 Minggu Lebih">2 Minggu Lebih (Santai)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Segmen Klien
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSegment('unpam_student')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                        segment === 'unpam_student'
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400 font-bold'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <GraduationCap size={14} className="mb-1" />
                      <span className="text-[10px]">UNPAM / Kuliah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSegment('umkm')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                        segment === 'umkm'
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400 font-bold'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 size={14} className="mb-1" />
                      <span className="text-[10px]">UMKM Lokal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSegment('agency_corporate')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                        segment === 'agency_corporate'
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400 font-bold'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Briefcase size={14} className="mb-1" />
                      <span className="text-[10px]">Korporat</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategori & Ruang Lingkup
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs font-medium ${
                      isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <option value="Web Fullstack (React/Node/Laravel)">Web Fullstack (React/Node/Laravel)</option>
                    <option value="Mobile App (Flutter / Android)">Mobile App (Flutter / Android)</option>
                    <option value="Python / Machine Learning / Data Analysis">Python / Machine Learning / Data</option>
                    <option value="Database PostgreSQL / MySQL / Query">Database PostgreSQL / MySQL</option>
                    <option value="Laporan Tugas Akhir / Makalah Akademik UNPAM">Laporan Tugas Akhir / Makalah</option>
                    <option value="Landing Page & Company Profile">Landing Page & Company Profile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Budget Awal Klien (Opsional)
                  </label>
                  <input
                    type="number"
                    value={initialClientBudget}
                    onChange={(e) => setInitialClientBudget(e.target.value)}
                    placeholder="Contoh: 300000"
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs ${
                      isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Paste Chat WhatsApp / Brief Soal Tugas Klien
                </label>
                <textarea
                  rows={4}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Paste langsung chat WA dari klien atau instruksi soal dari dosen disini. Contoh: 'Bang tolong bikinin web toko online pakai React + Node.js ada keranjang belanja sama laporan penjualan, buat tugas UAS minggu depan. Kira-kira kena berapa ya bang?'"
                  className={`w-full rounded-2xl border p-3.5 text-xs leading-relaxed ${
                    isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                  }`}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  AI akan menghitung komponen biaya pengerjaan, risiko deadline, dan membuat 3 gaya respon WhatsApp.
                </span>
                <button
                  type="submit"
                  disabled={loading || !brief.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-opacity"
                >
                  <Sparkles size={14} className={loading ? 'animate-spin' : ''} />
                  <span>{loading ? 'Menganalisis & Menghitung...' : 'Hitung Harga & Generate Draf Chat WA'}</span>
                </button>
              </div>
            </form>

            {/* Analysis & Results Display */}
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 pt-4 border-t border-white/[0.08]"
              >
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-white/[0.06] bg-[#0b0e14] p-4">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Rekomendasi Biaya
                    </span>
                    <div className="mt-1 text-lg font-bold text-orange-400">
                      {formatRupiah(analysisResult.recommendedPrice)}
                    </div>
                    <span className="text-[10px] text-slate-500">Harga final yang disarankan</span>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-[#0b0e14] p-4">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      DP Wajib (50%)
                    </span>
                    <div className="mt-1 text-lg font-bold text-emerald-400">
                      {formatRupiah(analysisResult.recommendedDp)}
                    </div>
                    <span className="text-[10px] text-slate-500">Untuk mengamankan slot</span>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-[#0b0e14] p-4">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Tingkat Kesulitan
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">
                        {analysisResult.difficulty}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Estimasi {analysisResult.estimatedDays} hari kerja</span>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-[#0b0e14] p-4">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Garansi & Bonus
                    </span>
                    <div className="mt-1 text-sm font-bold text-white flex items-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>Revisi & Video</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Termasuk panduan localhost</span>
                  </div>
                </div>

                {/* Technical Breakdown Pill */}
                <div className="rounded-2xl border border-white/[0.06] bg-[#0b0e14] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Breakdown Komponen Biaya:</span>
                    <span className="text-[11px] text-slate-400">{analysisResult.summary}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.priceBreakdown.map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-1.5"
                      >
                        <span>{item.item}:</span>
                        <strong className="text-orange-400 font-semibold">{formatRupiah(item.cost)}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pitch Options (3 Tone Options) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">
                      Pilihan Draf Respon WhatsApp (Klik untuk memilih):
                    </label>
                    <span className="text-[11px] text-slate-400">
                      3 gaya komunikasi: Teknis, Santai Kuliah, dan Formal Bisnis
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {analysisResult.pitchOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPitchIndex(idx)}
                        className={`text-left rounded-2xl border p-3.5 transition-all ${
                          selectedPitchIndex === idx
                            ? 'border-orange-500/60 bg-orange-500/10 shadow-md ring-1 ring-orange-500/30'
                            : 'border-white/10 bg-[#0b0e14] hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{opt.tone}</span>
                          {selectedPitchIndex === idx && (
                            <span className="h-2 w-2 rounded-full bg-orange-400" />
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">
                          {opt.target}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Active Selected Message Box */}
                  {analysisResult.pitchOptions[selectedPitchIndex] && (
                    <div className="rounded-2xl border border-white/10 bg-[#0b0e14] p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                        <span className="text-xs font-semibold text-slate-300">
                          Teks Pesan WhatsApp Siap Kirim ({analysisResult.pitchOptions[selectedPitchIndex].tone}):
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPitch(analysisResult.pitchOptions[selectedPitchIndex].message)
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                          >
                            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenWhatsApp(analysisResult.pitchOptions[selectedPitchIndex].message)
                            }
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                          >
                            <Send size={12} />
                            <span>Buka di WhatsApp Web</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={7}
                        value={analysisResult.pitchOptions[selectedPitchIndex].message}
                        onChange={(e) => {
                          const updated = [...analysisResult.pitchOptions];
                          updated[selectedPitchIndex].message = e.target.value;
                          setAnalysisResult({ ...analysisResult, pitchOptions: updated });
                        }}
                        className={`w-full rounded-xl border p-3.5 text-xs leading-relaxed font-sans ${
                          isDark ? 'border-white/10 bg-[#121621] text-white' : 'border-slate-200 bg-slate-50'
                        }`}
                      />
                    </div>
                  )}

                  {/* Actions: Save directly to Joki Order / CRM Deal */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
                    <span className="text-xs text-slate-400">
                      Deal disetujui klien? Simpan otomatis ke antrean kerja Anda:
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveToJokiOrder}
                      disabled={savingToOrder}
                      className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition-colors"
                    >
                      <Check size={14} />
                      <span>
                        {savingToOrder
                          ? 'Menyimpan ke Database...'
                          : `+ Masukkan ke Antrean Order Joki (${formatRupiah(analysisResult.recommendedPrice)})`}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
