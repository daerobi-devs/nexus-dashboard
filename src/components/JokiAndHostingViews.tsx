import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit3,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Send,
  Globe,
  Server,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Wallet,
  Sparkles,
  Printer,
  Copy,
  Check,
  Eye,
  EyeOff,
  Key,
  Calendar,
  FileText,
  GraduationCap,
  FolderKanban,
  QrCode,
  Upload,
  Download,
} from 'lucide-react';
import {
  JokiOrder,
  HostingDomain,
  UpcomingDeadline,
  ProjectVaultItem,
  AcademicCourse,
  TaskItem,
} from '../types';
import {
  generateDynamicQrisPayload,
  renderQrisToDataUrl,
  decodeQrisFromImageFile,
  parseQrisInfo,
} from '../utils/qrisDynamic';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const DEFAULT_SAMPLE_QRIS =
  '00020101021126610014COM.GO-JEK.WWW01189360091438810507240210G8810507240303UMI51440014ID.CO.QRIS.WWW0215ID10265291283440303UMI5204899953033605802ID5925Buatin, Digital & Kreatif6006SERANG61054217362140703A01110362163048035';

// ============================================================================
// OFFICIAL BUATIN.BIZ.ID DIGITAL RECEIPT / KWITANSI MODAL + DYNAMIC QRIS GOPAY
// (Clean 1-Page A4 Print + Shareable Customer Link + buatintech@gmail.com)
// ============================================================================
export interface BuatinReceiptData {
  invoiceId?: string;
  receiptNumber: string;
  clientName: string;
  clientPhone?: string;
  originOrCompany?: string;
  title: string;
  category: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  dateStr: string;
  deadlineOrDue?: string;
  notes?: string;
  items?: { desc: string; qty: number; price: number }[];
}

export const BuatinReceiptModal: React.FC<{
  receipt: BuatinReceiptData | null;
  onClose: () => void;
}> = ({ receipt, onClose }) => {
  const remaining = receipt ? Math.max(0, receipt.totalAmount - receipt.paidAmount) : 0;
  const defaultCharge = remaining > 0 ? remaining : receipt?.totalAmount || 0;

  const [staticQris, setStaticQris] = useState<string>(() => {
    return localStorage.getItem('buatin_qris_static_payload') || DEFAULT_SAMPLE_QRIS;
  });
  const [customChargeAmount, setCustomChargeAmount] = useState<number>(defaultCharge);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Add body class while modal is open so window.print() hides the background dashboard
  useEffect(() => {
    if (receipt) {
      document.body.classList.add('printing-invoice');
      const savedQris = localStorage.getItem('buatin_qris_static_payload');
      if (savedQris && savedQris.startsWith('000201')) {
        setStaticQris(savedQris);
      }
      const rem = Math.max(0, receipt.totalAmount - receipt.paidAmount);
      setCustomChargeAmount(rem > 0 ? rem : receipt.totalAmount);
    }
    return () => {
      document.body.classList.remove('printing-invoice');
    };
  }, [receipt]);

  useEffect(() => {
    let active = true;
    async function buildQr() {
      try {
        const dynPayload = generateDynamicQrisPayload(staticQris, customChargeAmount);
        const url = await renderQrisToDataUrl(dynPayload);
        if (active) setDynamicQrDataUrl(url);
      } catch {
        try {
          const dynPayload = generateDynamicQrisPayload(DEFAULT_SAMPLE_QRIS, customChargeAmount);
          const url = await renderQrisToDataUrl(dynPayload);
          if (active) setDynamicQrDataUrl(url);
        } catch {
          // ignore
        }
      }
    }
    buildQr();
    return () => {
      active = false;
    };
  }, [staticQris, customChargeAmount]);

  if (!receipt) return null;

  const isPaid =
    remaining === 0 || receipt.paymentStatus === 'Lunas' || receipt.paymentStatus === 'Paid';
  const cleanPhone = (receipt.clientPhone || '').replace(/[^0-9]/g, '');
  const qrisInfo = parseQrisInfo(staticQris);

  const resolvedInvoiceId =
    receipt.invoiceId ||
    receipt.receiptNumber.replace(/^KWT\/BUATIN\//i, '').trim();

  const publicInvoiceUrl = `${window.location.origin}/?invoice=${encodeURIComponent(
    resolvedInvoiceId
  )}&amount=${customChargeAmount}`;

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicInvoiceUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const waReceiptText = encodeURIComponent(
    `Halo *${receipt.clientName}*, berikut tautan *Invoice & Kwitansi Digital Resmi BUATIN* untuk proyek *"${receipt.title}"*:\n\n` +
      `*Klik Link Invoice & Scan QRIS Dinamis:*\n${publicInvoiceUrl}\n\n` +
      `----------------------------------------\n` +
      `• No. Nota: ${receipt.receiptNumber}\n` +
      `• Total Biaya: *${formatRupiah(receipt.totalAmount)}*\n` +
      `• Sudah Dibayar (DP): *${formatRupiah(receipt.paidAmount)}*\n` +
      `• *Tagihan Saat Ini: ${formatRupiah(customChargeAmount)}*\n` +
      `• Status: *${isPaid ? 'LUNAS (PAID)' : receipt.paymentStatus.toUpperCase()}*\n` +
      `----------------------------------------\n` +
      `Di dalam link tersebut sudah tersedia *QRIS Dinamis GoPay / All-Payment* (otomatis terisi nominal *${formatRupiah(customChargeAmount)}* saat di-scan) atau transfer manual:\n` +
      `• BCA: 7410-8829-10 (a.n Daerobi)\n` +
      `• Bank Jago: 1044-9921-8812 (a.n Daerobi)\n\n` +
      `Email Bisnis: buatintech@gmail.com\n` +
      `Web Resmi: https://buatin.biz.id`
  );

  return (
    <div
      id="buatin-printable-invoice-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div className="my-auto w-full max-w-3xl rounded-2xl border border-slate-700 bg-white text-slate-900 shadow-2xl overflow-hidden">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 px-5 py-3 text-white space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <img src="/favicon.png" alt="BUATIN" className="h-5 w-5 rounded bg-white p-0.5" />
              <span>Invoice & Kwitansi Resmi BUATIN (1 Halaman A4 Bersih)</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/15 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
                title="Salin link langsung untuk dikirim ke klien (klien hanya melihat halaman invoice ini)"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Link Invoice Tersalin!' : 'Copy Link Customer'}</span>
              </button>
              <a
                href={publicInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
                title="Lihat tampilan halaman khusus customer"
              >
                <ExternalLink className="h-3.5 w-3.5 text-teal-400" />
                <span>Preview Link Klien</span>
              </a>
              <a
                href={
                  cleanPhone
                    ? `https://wa.me/${cleanPhone}?text=${waReceiptText}`
                    : `https://wa.me/?text=${waReceiptText}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Phone className="h-3.5 w-3.5" /> Kirim Link & Tagihan WA
              </a>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400 transition"
              >
                <Printer className="h-3.5 w-3.5" /> Cetak PDF (1 Hal)
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Nominal Tagihan QRIS Selector (Hidden on print) */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-medium">Nominal Tagihan QRIS (Rp):</span>
              <input
                type="number"
                value={customChargeAmount}
                onChange={(e) => setCustomChargeAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-28 rounded-lg border border-teal-500/40 bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-teal-300 focus:outline-none"
              />
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setCustomChargeAmount(remaining)}
                  className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-teal-500 hover:text-slate-950 font-semibold transition"
                >
                  Sisa ({formatRupiah(remaining)})
                </button>
              )}
              <button
                type="button"
                onClick={() => setCustomChargeAmount(receipt.totalAmount)}
                className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-teal-500 hover:text-slate-950 font-semibold transition"
              >
                Total ({formatRupiah(receipt.totalAmount)})
              </button>
              <button
                type="button"
                onClick={() => setCustomChargeAmount(Math.round(receipt.totalAmount * 0.5))}
                className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-teal-500 hover:text-slate-950 font-semibold transition"
              >
                DP 50% ({formatRupiah(Math.round(receipt.totalAmount * 0.5))})
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Ubah QRIS Statis di menu <strong className="text-teal-300">Pengaturan Pembayaran</strong>
            </span>
          </div>
        </div>

        {/* SINGLE-PAGE A4 PRINTABLE INVOICE SHEET */}
        <div
          id="buatin-printable-invoice"
          className="p-6 md:p-7 space-y-4 bg-white text-slate-900"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-teal-600 pb-3.5">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo-brand.png"
                alt="BUATIN Logo"
                className="h-14 w-auto object-contain"
              />
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  BUATIN — TECH & WEBSITE CREATION
                </h2>
                <p className="text-xs font-semibold text-teal-700">
                  https://buatin.biz.id • Web Development, AI Engineering & Academic Solution
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Email Resmi: <strong>buatintech@gmail.com</strong> • Tangerang Selatan, Banten
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`inline-block rounded-lg border-2 px-2.5 py-0.5 font-mono text-[11px] font-extrabold uppercase tracking-wider ${
                  isPaid
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-amber-600 bg-amber-50 text-amber-700'
                }`}
              >
                {isPaid ? 'LUNAS / PAID' : receipt.paymentStatus}
              </span>
              <div className="mt-1.5 font-mono text-xs font-bold text-slate-800">
                No: {receipt.receiptNumber}
              </div>
              <div className="text-[11px] text-slate-500">Tanggal: {receipt.dateStr}</div>
            </div>
          </div>

          {/* Client & Service Metadata */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Ditagihkan Kepada / Klien:</span>
              <strong className="text-sm text-slate-900">{receipt.clientName}</strong>
              {receipt.originOrCompany && (
                <span className="block text-slate-600 text-[11px]">{receipt.originOrCompany}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Kategori Layanan & Tenggat:</span>
              <strong className="text-slate-900">{receipt.category}</strong>
              {receipt.deadlineOrDue && (
                <span className="block font-mono text-[11px] text-teal-700">
                  Target / Jatuh Tempo: {receipt.deadlineOrDue}
                </span>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[11px]">
                  <th className="py-2">Deskripsi Pekerjaan / Layanan</th>
                  <th className="py-2 text-center w-14">Qty</th>
                  <th className="py-2 text-right w-36">Jumlah (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receipt.items && receipt.items.length > 0 ? (
                  receipt.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-slate-800">{it.desc}</td>
                      <td className="py-2.5 text-center font-mono">{it.qty || 1}</td>
                      <td className="py-2.5 text-right font-mono font-semibold">
                        {formatRupiah(it.price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5">
                      <div className="font-bold text-slate-900">{receipt.title}</div>
                      {receipt.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{receipt.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 text-center font-mono">1</td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      {formatRupiah(receipt.totalAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* DYNAMIC QRIS GOPAY + TOTALS + SIGNATURE (Compact 1-Page Fit) */}
          <div className="grid grid-cols-12 gap-4 pt-3 border-t-2 border-slate-200 items-center">
            {/* Left: Dynamic QRIS Box */}
            <div className="col-span-7 flex items-center gap-3.5 rounded-xl border-2 border-teal-600/80 bg-teal-50/40 p-3">
              <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                {dynamicQrDataUrl ? (
                  <img
                    src={dynamicQrDataUrl}
                    alt="QRIS Dinamis GoPay BUATIN"
                    className="h-28 w-28 object-contain"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center text-[10px] text-slate-400">
                    Memuat QRIS...
                  </div>
                )}
              </div>
              <div className="space-y-1 text-xs">
                <div className="inline-flex items-center gap-1 rounded bg-teal-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  <QrCode className="h-3 w-3" /> QRIS DINAMIS GOPAY / ALL-PAYMENT
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  Nominal Scan Otomatis:{' '}
                  <span className="font-mono text-teal-700 underline">
                    {formatRupiah(customChargeAmount)}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-700">
                  Merchant: {qrisInfo.merchantName}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Scan via GoPay, BCA Mobile, Livin Mandiri, BRI Brimo, DANA, OVO, atau ShopeePay.
                </p>
                <div className="text-[10px] text-slate-700 font-medium">
                  Transfer Bank: BCA <strong>7410-8829-10</strong> • Jago{' '}
                  <strong>1044-9921-8812</strong> (a.n Daerobi)
                </div>
              </div>
            </div>

            {/* Right: Totals & Signature */}
            <div className="col-span-5 flex flex-col justify-between space-y-2.5 text-xs">
              <div className="space-y-1 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Total Nilai Pekerjaan:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(receipt.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>DP / Sudah Dibayar:</span>
                  <span className="font-mono font-bold">{formatRupiah(receipt.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-extrabold text-slate-900">
                  <span>Tagihan Saat Ini:</span>
                  <span className="font-mono text-teal-700">
                    {formatRupiah(customChargeAmount)}
                  </span>
                </div>
              </div>

              <div className="text-right pr-1">
                <p className="text-[10px] text-slate-400">
                  Dokumen Sah BUATIN ({receipt.dateStr})
                </p>
                <p className="mt-1.5 font-bold text-slate-900 underline">Daerobi</p>
                <p className="text-[10px] text-teal-700 font-semibold">
                  BUATIN • buatintech@gmail.com • buatin.biz.id
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PUBLIC STANDALONE CUSTOMER INVOICE PAGE (Opened via /?invoice=jok-1)
// Customers ONLY see their official Invoice & Dynamic QRIS — no Admin Sidebar!
// ============================================================================
export const StandaloneCustomerInvoicePage: React.FC<{
  invoiceId: string;
}> = ({ invoiceId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [chargeAmount, setChargeAmount] = useState<number>(0);

  // Customer proof upload form states
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('BCA');
  const [confirmAmount, setConfirmAmount] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    document.body.classList.add('printing-invoice');
    return () => {
      document.body.classList.remove('printing-invoice');
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadInvoice() {
      setLoading(true);
      try {
        const res = await fetch(`/api/public-invoice?id=${encodeURIComponent(invoiceId)}`);
        if (!res.ok) {
          throw new Error('Invoice tidak ditemukan.');
        }
        const data = await res.json();
        if (!active) return;
        setInvoice(data);

        const urlAmount = Number(new URLSearchParams(window.location.search).get('amount') || 0);
        const rem = Math.max(0, Number(data.totalAmount || 0) - Number(data.paidAmount || 0));
        const finalCharge = urlAmount > 0 ? urlAmount : rem > 0 ? rem : Number(data.totalAmount || 0);
        setChargeAmount(finalCharge);
        setSenderName(data.clientName || '');
        setConfirmAmount(String(finalCharge));

        const staticQris =
          data.paymentConfig?.qrisStaticPayload ||
          localStorage.getItem('buatin_qris_static_payload') ||
          DEFAULT_SAMPLE_QRIS;

        const dynPayload = generateDynamicQrisPayload(staticQris, finalCharge);
        const qrUrl = await renderQrisToDataUrl(dynPayload);
        if (active) setQrDataUrl(qrUrl);
      } catch (err: any) {
        if (active) setError(err?.message || 'Gagal memuat halaman invoice.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInvoice();
    return () => {
      active = false;
    };
  }, [invoiceId]);

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofImage((ev.target?.result as string) || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImage) {
      setSubmitError('Silakan pilih foto struk / resi bukti transfer terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/public-invoice/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoiceId,
          senderName: senderName.trim(),
          senderBank: senderBank.trim(),
          amount: Number(confirmAmount) || chargeAmount,
          proofImage,
          notes: proofNotes.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengirim bukti pembayaran.');
      setSubmitSuccess(
        'Bukti pembayaran berhasil dikirim! Notifikasi otomatis telah diteruskan ke Admin BUATIN. Status saat ini Menunggu Verifikasi.'
      );
      setInvoice((prev: any) => ({
        ...prev,
        paymentStatus: 'Menunggu Verifikasi',
        paymentProof: proofImage,
      }));
    } catch (err: any) {
      setSubmitError(err?.message || 'Terjadi kesalahan saat mengirim bukti.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="text-center space-y-2">
          <img src="/logo-brand.png" alt="BUATIN" className="h-12 w-auto mx-auto object-contain" />
          <p className="text-sm font-semibold text-teal-400">Memuat Invoice Resmi BUATIN...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center space-y-4">
          <img src="/logo-brand.png" alt="BUATIN" className="h-12 w-auto mx-auto object-contain" />
          <h2 className="text-lg font-bold">Invoice Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400">
            Nomor atau tautan invoice ({invoiceId}) tidak ditemukan di database BUATIN. Silakan hubungi tim kami melalui WhatsApp atau email buatintech@gmail.com.
          </p>
          <a
            href="https://buatin.biz.id"
            className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950"
          >
            Kunjungi buatin.biz.id
          </a>
        </div>
      </div>
    );
  }

  const remaining = Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount));
  const isPaid =
    remaining === 0 || invoice.paymentStatus === 'Lunas' || invoice.paymentStatus === 'Paid';
  const staticQris =
    invoice.paymentConfig?.qrisStaticPayload ||
    localStorage.getItem('buatin_qris_static_payload') ||
    DEFAULT_SAMPLE_QRIS;
  const qrisInfo = parseQrisInfo(staticQris);
  const businessEmail = invoice.paymentConfig?.businessEmail || 'buatintech@gmail.com';
  const businessPhone = (invoice.paymentConfig?.businessPhone || '6281299887711').replace(
    /[^0-9]/g,
    ''
  );

  const confirmWaMessage = encodeURIComponent(
    `Halo Admin *BUATIN (buatin.biz.id)*, saya *${invoice.clientName}* ingin mengonfirmasi pembayaran untuk Invoice *${invoice.receiptNumber}* (${invoice.title}) sebesar *${formatRupiah(chargeAmount)}*. Berikut bukti pembayarannya:`
  );

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Top Customer Action Bar (Hidden when printing PDF) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-white shadow-lg">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="BUATIN" className="h-6 w-6 rounded bg-white p-0.5" />
            <div>
              <div className="text-xs font-bold">Portal Invoice & Pembayaran Resmi BUATIN</div>
              <div className="text-[11px] text-slate-400">
                https://buatin.biz.id • {businessEmail}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://wa.me/${businessPhone}?text=${confirmWaMessage}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <Phone className="h-3.5 w-3.5" /> Konfirmasi Bayar ke WA Admin
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition"
            >
              <Printer className="h-3.5 w-3.5" /> Download / Cetak PDF (1 Hal)
            </button>
          </div>
        </div>

        {/* 1-Page Printable Invoice Sheet */}
        <div
          id="buatin-printable-invoice"
          className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 text-slate-900 shadow-xl space-y-4"
        >
          <div className="flex items-start justify-between gap-4 border-b-2 border-teal-600 pb-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo-brand.png"
                alt="BUATIN Logo"
                className="h-14 w-auto object-contain"
              />
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                  BUATIN — TECH & WEBSITE CREATION
                </h1>
                <p className="text-xs font-semibold text-teal-700">
                  https://buatin.biz.id • Web Development, AI Engineering & Academic Solution
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Email Bisnis: <strong>{businessEmail}</strong> • Tangerang Selatan, Banten
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`inline-block rounded-lg border-2 px-3 py-0.5 font-mono text-xs font-extrabold uppercase tracking-wider ${
                  isPaid
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-amber-600 bg-amber-50 text-amber-700'
                }`}
              >
                {isPaid ? 'LUNAS / PAID' : invoice.paymentStatus}
              </span>
              <div className="mt-1.5 font-mono text-xs font-bold text-slate-800">
                No: {invoice.receiptNumber}
              </div>
              <div className="text-[11px] text-slate-500">Tanggal: {invoice.dateStr}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Ditagihkan Kepada / Klien:</span>
              <strong className="text-sm text-slate-900">{invoice.clientName}</strong>
              {invoice.originOrCompany && (
                <span className="block text-slate-600 text-[11px]">{invoice.originOrCompany}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Kategori Layanan & Tenggat:</span>
              <strong className="text-slate-900">{invoice.category}</strong>
              {invoice.deadlineOrDue && (
                <span className="block font-mono text-[11px] text-teal-700">
                  Target / Jatuh Tempo: {invoice.deadlineOrDue}
                </span>
              )}
            </div>
          </div>

          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[11px]">
                  <th className="py-2">Deskripsi Pekerjaan / Layanan</th>
                  <th className="py-2 text-center w-14">Qty</th>
                  <th className="py-2 text-right w-36">Jumlah (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-slate-800">{it.desc}</td>
                      <td className="py-2.5 text-center font-mono">{it.qty || 1}</td>
                      <td className="py-2.5 text-right font-mono font-semibold">
                        {formatRupiah(it.price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5">
                      <div className="font-bold text-slate-900">{invoice.title}</div>
                      {invoice.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{invoice.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 text-center font-mono">1</td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      {formatRupiah(invoice.totalAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t-2 border-slate-200 items-center">
            <div className="md:col-span-7 flex items-center gap-3.5 rounded-xl border-2 border-teal-600/80 bg-teal-50/40 p-3">
              <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QRIS Dinamis GoPay BUATIN"
                    className="h-28 w-28 object-contain"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center text-[10px] text-slate-400">
                    Memuat QRIS...
                  </div>
                )}
              </div>
              <div className="space-y-1 text-xs">
                <div className="inline-flex items-center gap-1 rounded bg-teal-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  <QrCode className="h-3 w-3" /> SCAN QRIS DINAMIS GOPAY / ALL-PAYMENT
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  Nominal Otomatis:{' '}
                  <span className="font-mono text-teal-700 underline">
                    {formatRupiah(chargeAmount)}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-700">
                  Merchant: {qrisInfo.merchantName}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Scan menggunakan aplikasi GoPay, BCA Mobile, Livin Mandiri, BRI Brimo, DANA, OVO, atau ShopeePay. Nominal otomatis muncul tanpa ketik manual.
                </p>
                <div className="text-[10px] text-slate-700 font-medium">
                  Transfer Bank: BCA <strong>7410-8829-10</strong> • Jago{' '}
                  <strong>1044-9921-8812</strong> (a.n Daerobi)
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col justify-between space-y-2.5 text-xs">
              <div className="space-y-1 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Total Nilai Pekerjaan:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(invoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>DP / Sudah Dibayar:</span>
                  <span className="font-mono font-bold">{formatRupiah(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-extrabold text-slate-900">
                  <span>Tagihan Saat Ini:</span>
                  <span className="font-mono text-teal-700">{formatRupiah(chargeAmount)}</span>
                </div>
              </div>

              <div className="text-right pr-1">
                <p className="text-[10px] text-slate-400">
                  Diterbitkan oleh BUATIN ({invoice.dateStr})
                </p>
                <p className="mt-1.5 font-bold text-slate-900 underline">Daerobi</p>
                <p className="text-[10px] text-teal-700 font-semibold">
                  BUATIN • {businessEmail} • buatin.biz.id
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER PAYMENT CONFIRMATION & PROOF UPLOAD CARD (Hidden on print) */}
        <div className="no-print rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xl space-y-4 text-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 border border-teal-500/30">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Konfirmasi Pembayaran & Upload Bukti Transfer</h2>
              <p className="text-[11px] text-slate-500">
                Setelah melakukan transfer bank atau scan QRIS Dinamis di atas, silakan kirimkan bukti pembayaran di bawah ini.
              </p>
            </div>
          </div>

          {isPaid ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" /> Tagihan Ini Sudah Lunas Terbayar
              </div>
              <p className="text-xs text-slate-600">
                Terima kasih atas kerja sama dan kepercayaannya kepada <strong>BUATIN (buatin.biz.id)</strong>.
              </p>
            </div>
          ) : invoice.paymentStatus === 'Menunggu Verifikasi' || submitSuccess ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Bukti Pembayaran Diterima & Sedang Diverifikasi</span>
              </div>
              <p className="text-xs text-slate-700">
                {submitSuccess ||
                  'Bukti transfer Anda sudah terekam di sistem kami dan notifikasi telah dikirimkan ke Admin BUATIN. Status akan otomatis diperbarui menjadi Lunas setelah verifikasi.'}
              </p>
              <div className="pt-1">
                <a
                  href={`https://wa.me/${businessPhone}?text=${confirmWaMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" /> Konfirmasi Cepat ke WhatsApp Admin &rarr;
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitProof} className="space-y-3.5 text-xs">
              {submitError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-3 text-xs text-rose-700">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nama Pemilik Rekening / Pengirim *</label>
                  <input
                    required
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Contoh: Rian Saputra"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Bank / E-Wallet yang Digunakan *</label>
                  <select
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
                  >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Bank Jago">Bank Jago</option>
                    <option value="GoPay / QRIS">GoPay / QRIS Dinamis</option>
                    <option value="Mandiri">Bank Mandiri / Livin</option>
                    <option value="BRI">BRI / BRImo</option>
                    <option value="BNI">BNI Mobile</option>
                    <option value="DANA">DANA</option>
                    <option value="OVO">OVO</option>
                    <option value="ShopeePay">ShopeePay</option>
                    <option value="Lainnya">Bank Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nominal yang Ditransfer (Rp) *</label>
                  <input
                    required
                    type="number"
                    value={confirmAmount}
                    onChange={(e) => setConfirmAmount(e.target.value)}
                    className="w-full rounded-xl border border-teal-500/40 bg-teal-50/30 px-3 py-2 font-mono text-sm font-bold text-teal-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder="Contoh: Sudah ditransfer via BCA jam 22.00"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Upload Foto / Screenshot Struk Bukti Transfer *</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-500/50 bg-teal-50/50 px-4 py-2.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition">
                    <Upload className="h-4 w-4" />
                    <span>{proofImage ? 'Ganti Foto Bukti Transfer' : 'Pilih File Foto Bukti Transfer'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />
                  </label>
                  {proofImage && (
                    <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Foto Siap Dikirim
                    </span>
                  )}
                </div>
                {proofImage && (
                  <div className="mt-2.5 rounded-xl border border-slate-200 p-2 bg-slate-50 max-w-xs">
                    <img
                      src={proofImage}
                      alt="Preview Bukti Transfer"
                      className="max-h-48 w-auto object-contain rounded"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="submit"
                  disabled={submitting || !proofImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition shadow-lg shadow-teal-600/20 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Mengirim Bukti...' : 'Kirim Bukti Pembayaran ke Admin'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PENGATURAN PEMBAYARAN & SETUP NOMOR WA ADMIN & QRIS STATIS GOPAY (BUATIN)
// ============================================================================
export const QrisDynamicGeneratorPanel: React.FC<{
  initialStaticPayload?: string;
  initialWaNumber?: string;
  onSettingUpdate?: (key: string, value: string) => Promise<void>;
}> = ({ initialStaticPayload, initialWaNumber, onSettingUpdate }) => {
  const [staticPayload, setStaticPayload] = useState<string>(() => {
    return (
      localStorage.getItem('buatin_qris_static_payload') ||
      initialStaticPayload ||
      DEFAULT_SAMPLE_QRIS
    );
  });
  const [adminWa, setAdminWa] = useState<string>(() => {
    return (
      initialWaNumber ||
      localStorage.getItem('buatin_admin_wa') ||
      '6281299887711'
    );
  });
  const [amountInput, setAmountInput] = useState<string>('250000');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [waSaveStatus, setWaSaveStatus] = useState<string>('');
  const [savingWa, setSavingWa] = useState<boolean>(false);
  const [showAdvancedString, setShowAdvancedString] = useState<boolean>(false);

  useEffect(() => {
    if (initialWaNumber) {
      setAdminWa(initialWaNumber);
      localStorage.setItem('buatin_admin_wa', initialWaNumber);
    }
  }, [initialWaNumber]);

  const numericAmount = Math.max(0, Number(amountInput) || 0);
  const merchantInfo = parseQrisInfo(staticPayload);
  const hasUploadedCustom =
    staticPayload !== DEFAULT_SAMPLE_QRIS && staticPayload.startsWith('000201');

  useEffect(() => {
    let active = true;
    async function generate() {
      try {
        const dyn = generateDynamicQrisPayload(staticPayload, numericAmount);
        const url = await renderQrisToDataUrl(dyn);
        if (active) {
          setQrDataUrl(url);
        }
      } catch {
        // ignore
      }
    }
    generate();
    return () => {
      active = false;
    };
  }, [staticPayload, numericAmount]);

  const handleSaveWaNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminWa.replace(/[^0-9]/g, '');
    if (!clean) {
      setWaSaveStatus('Nomor WhatsApp tidak boleh kosong.');
      return;
    }
    const formatted = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
    setAdminWa(formatted);
    localStorage.setItem('buatin_admin_wa', formatted);
    setSavingWa(true);
    setWaSaveStatus('');
    try {
      if (onSettingUpdate) {
        await onSettingUpdate('buatin_whatsapp', formatted);
      } else {
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'buatin_whatsapp', value: formatted }),
        });
      }
      setWaSaveStatus(`Nomor WhatsApp Admin (${formatted}) berhasil disimpan permanen! Semua tombol konfirmasi WA otomatis mengarah ke nomor ini.`);
      setTimeout(() => setWaSaveStatus(''), 5000);
    } catch {
      setWaSaveStatus('Gagal menyimpan nomor WhatsApp ke database.');
    } finally {
      setSavingWa(false);
    }
  };

  const handleUploadQrisFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg('Memindai gambar QRIS GoPay Statis kamu...');
    try {
      const { rawPayload } = await decodeQrisFromImageFile(file);
      if (rawPayload && rawPayload.startsWith('000201')) {
        setStaticPayload(rawPayload);
        localStorage.setItem('buatin_qris_static_payload', rawPayload);
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'qris_static_payload', value: rawPayload }),
        }).catch(() => {});
        const info = parseQrisInfo(rawPayload);
        setStatusMsg(
          `Berhasil! QRIS Statis "${info.merchantName}" (${info.merchantCity}) tersimpan permanen di Database. Semua Kwitansi & Link Invoice Customer sekarang otomatis menggunakan QRIS kamu.`
        );
      } else {
        setStatusMsg(
          'Barcode QRIS tidak terbaca otomatis dari gambar ini. Klik "Input Kode Manual" di bawah untuk paste kode QRIS jika diperlukan.'
        );
        setShowAdvancedString(true);
      }
    } catch {
      setStatusMsg('Gagal membaca file gambar QRIS.');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. SETUP WHATSAPP ADMIN BUATIN */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#111520] p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Setup Nomor WhatsApp Admin BUATIN</h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  Aktif: +{adminWa.replace(/[^0-9]/g, '')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nomor ini digunakan sebagai tujuan saat customer klik tombol "Konfirmasi Pembayaran ke WA Admin" di link invoice publik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${adminWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo Admin BUATIN, tes pesan konfirmasi WhatsApp.')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
              title="Buka WhatsApp Web / Aplikasi untuk tes nomor"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Tes Buka Chat WA</span>
            </a>
          </div>
        </div>

        <form onSubmit={handleSaveWaNumber} className="flex flex-wrap items-center gap-2.5 pt-1">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-emerald-400">+</span>
            <input
              type="text"
              required
              value={adminWa}
              onChange={(e) => setAdminWa(e.target.value)}
              placeholder="Contoh: 6281299887711 atau 081299887711"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 font-mono text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={savingWa}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{savingWa ? 'Menyimpan...' : 'Simpan Nomor WA Admin'}</span>
          </button>
        </form>

        {waSaveStatus && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300 font-medium">
            {waSaveStatus}
          </div>
        )}
      </div>

      {/* 2. SETUP QRIS STATIS & GENERATOR DINAMIS */}
      <div className="rounded-2xl border border-teal-500/30 bg-[#111520] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Pengaturan Pembayaran BUATIN & Setup QRIS Statis (1 Pintu)
                </h3>
                <span className="rounded-full bg-teal-500/20 border border-teal-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-teal-300">
                  {hasUploadedCustom ? `Aktif: ${merchantInfo.merchantName}` : 'QRIS Default BUATIN'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cukup upload gambar QRIS GoPay Statis kamu di tombol kanan ini 1 kali saja. Seluruh Invoice & Link Tagihan Klien otomatis berubah jadi QRIS Dinamis sesuai nominal!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-lg shadow-teal-500/20">
              <Upload className="h-4 w-4" />
              <span>Upload QRIS Statis Kamu (1x Setup)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadQrisFile}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowAdvancedString((p) => !p)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:text-white"
            >
              {showAdvancedString ? 'Tutup Detail' : 'Tes Nominal / Detail'}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-xs text-teal-300">
            {statusMsg}
          </div>
        )}

        {showAdvancedString && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-center pt-2 border-t border-slate-800">
            <div className="lg:col-span-8 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block text-[11px]">Email Bisnis Resmi</span>
                  <strong className="font-mono text-teal-300">buatintech@gmail.com</strong>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block text-[11px]">Rekening BCA</span>
                  <strong className="font-mono text-white">7410-8829-10 (Daerobi)</strong>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block text-[11px]">Bank Jago</span>
                  <strong className="font-mono text-white">1044-9921-8812 (Daerobi)</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Tes Simulasi Nominal QRIS Dinamis (Rp)
                  </label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full rounded-xl border border-teal-500/40 bg-slate-950 px-3 py-2 font-mono text-sm font-bold text-teal-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Kode String QRIS Statis (Otomatis dari Gambar)
                  </label>
                  <input
                    value={staticPayload}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setStaticPayload(v);
                      if (v.startsWith('000201')) {
                        localStorage.setItem('buatin_qris_static_payload', v);
                        fetch('/api/settings', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ key: 'qris_static_payload', value: v }),
                        }).catch(() => {});
                      }
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[11px] text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex items-center gap-3 rounded-2xl border border-slate-800 bg-white p-3 text-slate-900">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QRIS Preview" className="h-24 w-24 object-contain" />
              )}
              <div className="text-xs">
                <div className="font-extrabold text-slate-900">{merchantInfo.merchantName}</div>
                <div className="text-[11px] text-slate-500">Preview Scan Otomatis:</div>
                <div className="font-mono text-sm font-extrabold text-teal-700">
                  {formatRupiah(numericAmount)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// REUSABLE PAGINATION BAR (6 / 10 / 15 / 25 / Semua)
// ============================================================================
interface PaginationControlsProps {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
  sizeOptions?: number[];
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sizeOptions = [6, 10, 15, 25],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-2.5 text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Tampilkan:</span>
        <div className="flex items-center gap-1">
          {sizeOptions.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => {
                onPageSizeChange(sz);
                onPageChange(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                pageSize === sz
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {sz}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onPageSizeChange(9999);
              onPageChange(1);
            }}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              pageSize >= 999
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-slate-400">
          Menampilkan <strong className="text-white">{startIdx}–{endIdx}</strong> dari{' '}
          <strong className="text-white">{totalItems}</strong> item
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="px-2 font-mono text-[11px] font-bold text-emerald-400">
            Hal {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-slate-700 disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 1. JOKI TUGAS & PROYEK COMMAND CENTER + AUTO TELEGRAM DEADLINE ALERT
// ============================================================================
interface JokiManagementViewProps {
  orders: JokiOrder[];
  upcomingDeadlines: UpcomingDeadline[];
  autoAlertEnabled: boolean;
  onCreateOrder: (payload: any) => Promise<void>;
  onUpdateOrder: (id: string, payload: any) => Promise<void>;
  onMarkPaid: (id: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  onSendTelegramDeadlineAlert: () => Promise<void>;
  onToggleAutoAlert: (enabled: boolean) => Promise<void>;
  onOpenSettlement?: (item: SettlementItemData) => void;
  onOpenDealCloser?: () => void;
}

export const JokiManagementView: React.FC<JokiManagementViewProps> = ({
  orders = [],
  upcomingDeadlines = [],
  autoAlertEnabled = true,
  onCreateOrder,
  onUpdateOrder,
  onMarkPaid,
  onDeleteOrder,
  onSendTelegramDeadlineAlert,
  onToggleAutoAlert,
  onOpenSettlement,
  onOpenDealCloser,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<JokiOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'UNPAID' | 'DONE'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [receiptData, setReceiptData] = useState<BuatinReceiptData | null>(null);

  // Form States
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('62812');
  const [origin, setOrigin] = useState('Mahasiswa TI / Umum');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Joki Coding / Web');
  const [price, setPrice] = useState('650000');
  const [dpPaid, setDpPaid] = useState('300000');
  const [deadline, setDeadline] = useState('2026-11-15');
  const [progress, setProgress] = useState('30');
  const [status, setStatus] = useState('in_progress');
  const [deliverableLink, setDeliverableLink] = useState('');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingOrder(null);
    setClientName('');
    setClientPhone('62812');
    setOrigin('Mahasiswa TI / Umum');
    setTitle('');
    setCategory('Joki Coding / Web');
    setPrice('500000');
    setDpPaid('250000');
    setDeadline('2026-11-15');
    setProgress('20');
    setStatus('in_progress');
    setDeliverableLink('');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (o: JokiOrder) => {
    setEditingOrder(o);
    setClientName(o.client_name);
    setClientPhone(o.client_phone);
    setOrigin(o.university_or_origin);
    setTitle(o.title);
    setCategory(o.category);
    setPrice(String(o.price));
    setDpPaid(String(o.dp_paid));
    setDeadline(o.deadline);
    setProgress(String(o.progress_percent));
    setStatus(o.status);
    setDeliverableLink(o.deliverable_link || '');
    setNotes(o.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !title.trim()) return;
    const payload = {
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      university_or_origin: origin.trim(),
      title: title.trim(),
      category,
      price: Number(price) || 0,
      dp_paid: Number(dpPaid) || 0,
      deadline,
      progress_percent: Number(progress) || 0,
      status,
      deliverable_link: deliverableLink.trim(),
      notes: notes.trim(),
    };
    if (editingOrder) {
      await onUpdateOrder(editingOrder.id, payload);
    } else {
      await onCreateOrder(payload);
    }
    setShowModal(false);
  };

  const handleSendAlert = async () => {
    setSendingAlert(true);
    try {
      await onSendTelegramDeadlineAlert();
    } finally {
      setSendingAlert(false);
    }
  };

  const totalRevenue = orders.reduce((s, o) => s + Number(o.price), 0);
  const totalCollected = orders.reduce((s, o) => s + Number(o.dp_paid), 0);
  const totalReceivable = Math.max(0, totalRevenue - totalCollected);
  const activeCount = orders.filter((o) => o.status !== 'done').length;

  const filtered = orders.filter((o) => {
    if (filterStatus === 'ACTIVE' && o.status === 'done') return false;
    if (filterStatus === 'UNPAID' && o.payment_status === 'Lunas') return false;
    if (filterStatus === 'DONE' && o.status !== 'done') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.client_name.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pagedOrders = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getDaysRemaining = (dateStr: string) => {
    const today = new Date('2026-11-10T00:00:00Z');
    const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Nilai Order Joki</span>
            <Briefcase className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">
            {formatRupiah(totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-400">
            Sudah cair (DP/Lunas): {formatRupiah(totalCollected)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sisa Tagihan Belum Lunas</span>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-400">
            {formatRupiah(totalReceivable)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Klik "Lunaskan" saat klien melunasi sisa tagihan
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Antrean Joki Aktif</span>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">
            {activeCount} Order Aktif
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Total keseluruhan: {orders.length} order joki
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Notifikasi Deadline Telegram</span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAlertEnabled}
                onChange={(e) => onToggleAutoAlert(e.target.checked)}
                className="rounded border-slate-700"
              />
              <span>Auto-Notif H-3 ke Telegram</span>
            </label>
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
                onClick={openCreateModal}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Order Joki
              </button>
              <button
                onClick={handleSendAlert}
                disabled={sendingAlert}
                title="Kirim peringatan semua deadline terdekat ke Telegram sekarang"
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500 hover:text-slate-950 transition"
              >
                <Send className="h-3.5 w-3.5" /> {sendingAlert ? '...' : 'Push Notif'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Peringatan Deadline Mendesak (Joki, Kuliah UNPAM, Proyek & Domain) */}
      {upcomingDeadlines.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Radar Deadline Mendesak ({upcomingDeadlines.length} Item Mendekati Tenggat Waktu)
              </h4>
            </div>
            <button
              onClick={handleSendAlert}
              disabled={sendingAlert}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-300 transition"
            >
              <Send className="h-3 w-3" /> Kirim Alert Ini ke Bot Telegram
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {upcomingDeadlines.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-slate-950/80 px-3 py-2 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-amber-400">[{item.kind}]</span>
                  <p className="truncate font-semibold text-white">{item.title}</p>
                  <p className="truncate text-[10px] text-slate-400">{item.subtitle}</p>
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 font-mono text-[10px] font-bold ${
                    item.daysLeft <= 1
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {item.daysLeft === 0
                    ? 'HARI INI'
                    : item.daysLeft < 0
                    ? `LEWAT ${Math.abs(item.daysLeft)}H`
                    : `H-${item.daysLeft}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Semua Order' },
              { id: 'ACTIVE', label: 'Sedang Dikerjakan' },
              { id: 'UNPAID', label: 'Belum Lunas' },
              { id: 'DONE', label: 'Selesai' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterStatus(tab.id as any);
                  setPage(1);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  filterStatus === tab.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari klien, judul tugas, kategori..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        {/* Order Joki Cards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagedOrders.map((order) => {
            const remaining = Math.max(0, Number(order.price) - Number(order.dp_paid));
            const daysLeft = getDaysRemaining(order.deadline);
            const cleanPhone = (order.client_phone || '').replace(/[^0-9]/g, '');
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Halo ${order.client_name}, ini update progres pengerjaan "${order.title}" (${order.progress_percent}%).`
            )}`;

            return (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      {order.category}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                        order.status === 'done'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : daysLeft <= 2
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {order.status === 'done'
                        ? 'SELESAI'
                        : daysLeft === 0
                        ? 'DEADLINE HARI INI!'
                        : daysLeft < 0
                        ? `TERLEWAT ${Math.abs(daysLeft)} HARI`
                        : `H-${daysLeft} (${order.deadline})`}
                    </span>
                  </div>

                  <h4 className="mt-2.5 text-sm font-bold text-white leading-snug">{order.title}</h4>
                  <p className="mt-1 text-xs font-semibold text-sky-400">
                    Pemesan: {order.client_name}{' '}
                    <span className="font-normal text-slate-400">({order.university_or_origin})</span>
                  </p>

                  {order.notes && (
                    <p className="mt-2 rounded-lg bg-slate-900/90 p-2 text-[11px] text-slate-300">
                      {order.notes}
                    </p>
                  )}

                  {/* Alert if customer submitted payment proof */}
                  {(order.payment_status === 'Menunggu Verifikasi' || order.payment_proof) && (
                    <div className="mt-2.5 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                      <div className="flex items-center gap-2 font-bold">
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span>Bukti Pembayaran Masuk</span>
                      </div>
                      {order.payment_proof && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenSettlement) {
                              onOpenSettlement({
                                id: order.id,
                                title: order.title,
                                clientName: order.client_name,
                                totalAmount: order.price,
                                paidAmount: order.dp_paid,
                                paymentProof: order.payment_proof,
                                paymentProofNote: order.payment_proof_note,
                                paymentStatus: order.payment_status,
                                type: 'joki',
                              });
                            }
                          }}
                          className="rounded-lg bg-amber-400/20 px-2 py-0.5 font-bold text-[10px] text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition"
                        >
                          Cek Bukti
                        </button>
                      )}
                    </div>
                  )}

                  {/* Pricing Box */}
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-800/80 bg-[#111520] p-2.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Harga Joki</span>
                      <strong className="font-mono text-white">{formatRupiah(order.price)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">DP Masuk</span>
                      <strong className="font-mono text-emerald-400">
                        {formatRupiah(order.dp_paid)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Sisa</span>
                      <strong className="font-mono text-amber-400">{formatRupiah(remaining)}</strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Progres Pengerjaan</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {order.progress_percent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all"
                        style={{ width: `${order.progress_percent}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() =>
                            onUpdateOrder(order.id, {
                              progress_percent: pct,
                              status: pct === 100 ? 'done' : 'in_progress',
                            })
                          }
                          className={`flex-1 rounded-md py-1 font-mono text-[10px] font-semibold transition ${
                            order.progress_percent === pct
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cleanPhone && (
                      <>
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Halo Kak ${order.client_name}, update dari tim *BUATIN (https://buatin.biz.id)* untuk pengerjaan *"${order.title}"* saat ini progresnya sudah mencapai *${order.progress_percent}%*. Kami kabari lagi segera setelah tahap berikutnya selesai ya!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Kirim Update Progres ke WA Klien"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                        >
                          <Phone className="h-3 w-3" /> WA Progres
                        </a>
                        {remaining > 0 && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `Halo Kak ${order.client_name}, berikut informasi tagihan & tautan Invoice Resmi untuk pengerjaan *"${order.title}"* di *BUATIN (https://buatin.biz.id)*:\n\n` +
                                `*Link Invoice & Scan QRIS Dinamis:*\n${window.location.origin}/?invoice=${order.id}\n\n` +
                                `• Harga Deal: ${formatRupiah(order.price)}\n` +
                                `• DP Masuk: ${formatRupiah(order.dp_paid)}\n` +
                                `• *Sisa Pelunasan: ${formatRupiah(remaining)}*\n\n` +
                                `Bisa langsung scan QRIS Dinamis GoPay di link tersebut atau transfer BCA 7410-8829-10 a.n Daerobi. Terima kasih!`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Kirim Link Invoice & Tagihan Pelunasan ke WA Klien"
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition"
                          >
                            <Wallet className="h-3 w-3" /> Tagih WA + Link
                          </a>
                        )}
                      </>
                    )}
                    <button
                      onClick={() =>
                        setReceiptData({
                          invoiceId: order.id,
                          receiptNumber: `KWT/BUATIN/${order.id.toUpperCase()}`,
                          clientName: order.client_name,
                          clientPhone: order.client_phone,
                          originOrCompany: order.university_or_origin,
                          title: order.title,
                          category: order.category,
                          totalAmount: order.price,
                          paidAmount: order.dp_paid,
                          paymentStatus: order.payment_status,
                          dateStr: order.created_at || '2026-11-10',
                          deadlineOrDue: order.deadline,
                          notes: order.notes,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] font-semibold text-sky-300 hover:bg-sky-500 hover:text-slate-950 transition"
                      title="Cetak Nota / Kwitansi Resmi BUATIN"
                    >
                      <Printer className="h-3 w-3" /> Kwitansi
                    </button>
                    {order.payment_status !== 'Lunas' && (
                      <button
                        onClick={() => {
                          if (onOpenSettlement) {
                            onOpenSettlement({
                              id: order.id,
                              title: order.title,
                              clientName: order.client_name,
                              totalAmount: order.price,
                              paidAmount: order.dp_paid,
                              paymentProof: order.payment_proof,
                              paymentProofNote: order.payment_proof_note,
                              paymentStatus: order.payment_status,
                              type: 'joki',
                            });
                          } else {
                            onMarkPaid(order.id);
                          }
                        }}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition shadow-sm ${
                          order.payment_status === 'Menunggu Verifikasi' || order.payment_proof
                            ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-500/20'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>
                          {order.payment_status === 'Menunggu Verifikasi' || order.payment_proof
                            ? 'Verifikasi & Lunaskan'
                            : 'Lunaskan'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(order)}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:text-white"
                      title="Edit Order Joki"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-rose-400"
                      title="Hapus Order Joki"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <PaginationControls
          totalItems={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Official BUATIN Receipt Modal */}
      <BuatinReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />

      {/* Add / Edit Joki Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111520] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingOrder ? 'Edit Order Joki' : 'Tambah Order Joki Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Klien / Pemesan *</label>
                  <input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Contoh: Rian Saputra"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nomor WA Klien (Awali 62)</label>
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="6281299887711"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Jenis Joki</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="Joki Coding / Web">Joki Coding / Web</option>
                    <option value="Joki Skripsi / Sistem">Joki Skripsi / Sistem</option>
                    <option value="Joki AI / Python">Joki AI / Python</option>
                    <option value="Joki Makalah / Jurnal">Joki Makalah / Jurnal</option>
                    <option value="Joki Tugas Kuliah">Joki Tugas Kuliah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Kampus / Jurusan / Asal</label>
                  <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="TI Semester 7 / Umum"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Judul Tugas / Aplikasi yang Dikerjakan *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Sistem Pakar Diagnosa + Laporan Bab 1-5"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Harga Deal (Rp) *</label>
                  <input
                    required
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">DP Masuk (Rp)</label>
                  <input
                    type="number"
                    value={dpPaid}
                    onChange={(e) => setDpPaid(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Deadline *</label>
                  <input
                    required
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Catatan Spesifikasi / Revisi</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail request klien, stack yang dipakai, dll..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Simpan Order Joki
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
// 2. HOSTING, DOMAIN & PROVIDER ACCOUNTS MANAGER (Rumahweb, Cloudflare, VPS)
// ============================================================================
interface HostingAndDomainSectionProps {
  domains: HostingDomain[];
  onCreateDomain: (payload: any) => Promise<void>;
  onUpdateDomain: (id: string, payload: any) => Promise<void>;
  onDeleteDomain: (id: string) => Promise<void>;
}

const PROVIDER_PRESETS = [
  {
    name: 'Rumahweb',
    panelUrl: 'https://clientzone.rumahweb.com',
    category: 'Domain & Cloud Hosting',
  },
  {
    name: 'Cloudflare',
    panelUrl: 'https://dash.cloudflare.com',
    category: 'DNS, SSL & Zero Trust Tunnel',
  },
  {
    name: 'Niagahoster / Hostinger',
    panelUrl: 'https://hpanel.hostinger.com',
    category: 'Shared / Cloud Hosting',
  },
  {
    name: 'DomaiNesia',
    panelUrl: 'https://my.domainesia.com',
    category: 'Domain & VPS',
  },
  {
    name: 'Coolify Home Server',
    panelUrl: 'http://localhost:8000',
    category: 'Self-Hosted PaaS',
  },
];

export const HostingAndDomainSection: React.FC<HostingAndDomainSectionProps> = ({
  domains = [],
  onCreateDomain,
  onUpdateDomain,
  onDeleteDomain,
}) => {
  const safeDomains = Array.isArray(domains) ? domains : [];
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HostingDomain | null>(null);
  const [domainName, setDomainName] = useState('');
  const [provider, setProvider] = useState('Rumahweb');
  const [category, setCategory] = useState('Domain & Cloud Hosting');
  const [accountIdentity, setAccountIdentity] = useState('buatintech@gmail.com');
  const [panelUrl, setPanelUrl] = useState('https://clientzone.rumahweb.com');
  const [ipOrDns, setIpOrDns] = useState('Cloudflare / Rumahweb DNS');
  const [clientOwner, setClientOwner] = useState('Internal / Klien');
  const [renewalCost, setRenewalCost] = useState('250000');
  const [expiryDate, setExpiryDate] = useState('2027-01-15');
  const [notes, setNotes] = useState('');

  const applyPreset = (p: typeof PROVIDER_PRESETS[0]) => {
    setProvider(p.name);
    setPanelUrl(p.panelUrl);
    setCategory(p.category);
  };

  const openAdd = () => {
    setEditing(null);
    setDomainName('');
    setProvider('Rumahweb');
    setPanelUrl('https://clientzone.rumahweb.com');
    setCategory('Domain & Cloud Hosting');
    setAccountIdentity('buatintech@gmail.com');
    setIpOrDns('NS1.RUMAHWEB.COM / Cloudflare');
    setClientOwner('Proyek Klien');
    setRenewalCost('275000');
    setExpiryDate('2027-03-20');
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (d: HostingDomain) => {
    setEditing(d);
    setDomainName(d.domain_or_service);
    setProvider(d.provider);
    setCategory(d.category);
    setAccountIdentity(d.account_identity);
    setPanelUrl(d.panel_url);
    setIpOrDns(d.ip_or_dns);
    setClientOwner(d.client_owner);
    setRenewalCost(String(d.renewal_cost));
    setExpiryDate(d.expiry_date);
    setNotes(d.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;
    const payload = {
      domain_or_service: domainName.trim(),
      provider: provider.trim(),
      category: category.trim(),
      account_identity: accountIdentity.trim(),
      panel_url: panelUrl.trim(),
      ip_or_dns: ipOrDns.trim(),
      client_owner: clientOwner.trim(),
      renewal_cost: Number(renewalCost) || 0,
      expiry_date: expiryDate,
      status: 'Active',
      notes: notes.trim(),
    };
    if (editing) {
      await onUpdateDomain(editing.id, payload);
    } else {
      await onCreateDomain(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">
            Manajemen Domain, Hosting & Akun Provider (Rumahweb, Cloudflare, VPS)
          </h3>
          <p className="text-xs text-slate-400">
            Kelola semua domain klien/pribadi, akun login provider, jadwal perpanjangan tahunan, dan pintasan 1-klik buka Clientzone/cPanel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://clientzone.rumahweb.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500 hover:text-slate-950 transition"
          >
            <Globe className="h-3.5 w-3.5" /> 1-Klik Login Rumahweb <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition"
          >
            <Shield className="h-3.5 w-3.5" /> Cloudflare DNS <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Domain / Akun Hosting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {safeDomains.map((dom) => (
          <div
            key={dom.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  {dom.provider} • {dom.category}
                </span>
                <span className="font-mono text-[11px] font-semibold text-amber-400">
                  Exp: {dom.expiry_date}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <h4 className="font-mono text-sm font-bold text-white">{dom.domain_or_service}</h4>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {formatRupiah(dom.renewal_cost)}/thn
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-900/90 p-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Akun / Email Provider</span>
                  <strong className="text-slate-200 truncate block">{dom.account_identity}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Milik Klien / DNS</span>
                  <strong className="text-slate-200 truncate block">
                    {dom.client_owner} ({dom.ip_or_dns})
                  </strong>
                </div>
              </div>

              {dom.notes && (
                <p className="mt-2 text-[11px] text-slate-400">{dom.notes}</p>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <a
                  href={dom.panel_url || 'https://clientzone.rumahweb.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                >
                  Buka Panel {dom.provider} <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={`https://${dom.domain_or_service.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
                >
                  Cek Web <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(dom)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white"
                  title="Edit Domain/Hosting"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteDomain(dom.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400"
                  title="Hapus Domain/Hosting"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111520] p-6 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editing ? 'Edit Domain / Akun Hosting' : 'Tambah Domain / Akun Hosting Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3">
              <span className="block text-[11px] text-slate-400 mb-1.5">
                Klik Preset Cepat Provider:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PROVIDER_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      provider === p.name
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Domain / Layanan *</label>
                  <input
                    required
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    placeholder="Contoh: agropangan.co.id"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Provider (Rumahweb / dll) *</label>
                  <input
                    required
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="Rumahweb / Cloudflare / VPS"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Akun Email Login Provider</label>
                  <input
                    value={accountIdentity}
                    onChange={(e) => setAccountIdentity(e.target.value)}
                    placeholder="admin@domain.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">URL Login Panel / cPanel</label>
                  <input
                    value={panelUrl}
                    onChange={(e) => setPanelUrl(e.target.value)}
                    placeholder="https://clientzone.rumahweb.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Milik Klien / Proyek</label>
                  <input
                    value={clientOwner}
                    onChange={(e) => setClientOwner(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Biaya Perpanjangan</label>
                  <input
                    type="number"
                    value={renewalCost}
                    onChange={(e) => setRenewalCost(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tanggal Expired</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IP Server / Nameserver / Catatan</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan cPanel, A Record, atau akun FTP..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Simpan ke SQLite
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
// 3. PROJECT VAULT: PORTFOLIO, GITHUB REPO, DEMO CREDENTIALS & .ENV MANAGER
// ============================================================================
interface ProjectVaultSectionProps {
  items: ProjectVaultItem[];
  onCreateVault: (payload: any) => Promise<void>;
  onUpdateVault: (id: string, payload: any) => Promise<void>;
  onDeleteVault: (id: string) => Promise<void>;
}

export const ProjectVaultSection: React.FC<ProjectVaultSectionProps> = ({
  items = [],
  onCreateVault,
  onUpdateVault,
  onDeleteVault,
}) => {
  const safeItems = Array.isArray(items) ? items : [];
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProjectVaultItem | null>(null);
  const [visiblePassId, setVisiblePassId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('');
  const [clientOrScope, setClientOrScope] = useState('Internal Agency BUATIN');
  const [repoUrl, setRepoUrl] = useState('https://github.com/daerobi-devs/');
  const [liveUrl, setLiveUrl] = useState('https://buatin.biz.id/');
  const [demoUser, setDemoUser] = useState('admin@buatin.biz.id');
  const [demoPass, setDemoPass] = useState('');
  const [techStack, setTechStack] = useState('TypeScript, React, Tailwind CSS, PostgreSQL');
  const [envNotes, setEnvNotes] = useState('');

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const openAdd = () => {
    setEditing(null);
    setProjectName('');
    setClientOrScope('Klien BUATIN / Order Joki');
    setRepoUrl('https://github.com/daerobi-devs/');
    setLiveUrl('https://');
    setDemoUser('admin');
    setDemoPass('Admin#2026');
    setTechStack('TypeScript, Next.js, Tailwind, PostgreSQL');
    setEnvNotes('DATABASE_URL=postgres://... | PORT=3000');
    setShowModal(true);
  };

  const openEdit = (v: ProjectVaultItem) => {
    setEditing(v);
    setProjectName(v.project_name);
    setClientOrScope(v.client_or_scope);
    setRepoUrl(v.repo_url);
    setLiveUrl(v.live_url);
    setDemoUser(v.demo_username);
    setDemoPass(v.demo_password);
    setTechStack(v.tech_stack);
    setEnvNotes(v.env_notes);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    const payload = {
      project_name: projectName.trim(),
      client_or_scope: clientOrScope.trim(),
      repo_url: repoUrl.trim(),
      live_url: liveUrl.trim(),
      demo_username: demoUser.trim(),
      demo_password: demoPass.trim(),
      tech_stack: techStack.trim(),
      env_notes: envNotes.trim(),
    };
    if (editing) {
      await onUpdateVault(editing.id, payload);
    } else {
      await onCreateVault(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Vault Portofolio, Repo GitHub, Akun Demo & Kredensial Proyek (BUATIN)
            </h3>
            <p className="text-xs text-slate-400">
              Gudang terpusat untuk menyimpan link GitHub, URL produksi, akun login demo sidang/klien, dan variabel .env dengan fitur 1-klik copy.
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Vault Proyek
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {safeItems.map((v) => {
          const isPassShown = visiblePassId === v.id;
          return (
            <div
              key={v.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 hover:border-teal-500/40 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-md bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                      {v.client_or_scope}
                    </span>
                    <h4 className="mt-1.5 text-sm font-bold text-white">{v.project_name}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(v)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-white"
                      title="Edit Vault"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteVault(v.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400"
                      title="Hapus Vault"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-sky-400 font-mono">{v.tech_stack}</div>

                {/* Demo Credentials Box */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">User Demo / Admin</span>
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                      <code className="truncate font-mono font-semibold text-slate-200">
                        {v.demo_username || '-'}
                      </code>
                      {v.demo_username && (
                        <button
                          onClick={() => copyText(v.demo_username, `u-${v.id}`)}
                          className="text-slate-400 hover:text-teal-400"
                          title="Copy Username"
                        >
                          {copiedKey === `u-${v.id}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Password Demo</span>
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                      <code className="truncate font-mono font-semibold text-amber-300">
                        {isPassShown ? v.demo_password : '••••••••••'}
                      </code>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setVisiblePassId(isPassShown ? null : v.id)}
                          className="text-slate-400 hover:text-white"
                          title="Lihat/Sembunyikan Password"
                        >
                          {isPassShown ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                        {v.demo_password && (
                          <button
                            onClick={() => copyText(v.demo_password, `p-${v.id}`)}
                            className="text-slate-400 hover:text-teal-400"
                            title="Copy Password"
                          >
                            {copiedKey === `p-${v.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {v.env_notes && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg bg-[#0d1117] border border-slate-800 px-2.5 py-1.5 text-[11px] font-mono text-slate-300">
                    <span className="truncate">{v.env_notes}</span>
                    <button
                      onClick={() => copyText(v.env_notes, `env-${v.id}`)}
                      className="shrink-0 text-slate-400 hover:text-teal-400"
                      title="Copy Catatan .env"
                    >
                      {copiedKey === `env-${v.id}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {v.live_url && (
                    <a
                      href={v.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 text-[11px] font-semibold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition"
                    >
                      Buka Live Web <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {v.repo_url && (
                    <a
                      href={v.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
                    >
                      GitHub Repo <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <span className="font-mono text-[10px] text-slate-500">Update: {v.updated_at}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111520] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editing ? 'Edit Vault Proyek' : 'Tambah Vault Portofolio & Kredensial'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Proyek / Sistem *</label>
                  <input
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Contoh: Web Agensi buatin.biz.id"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Milik Klien / Kategori</label>
                  <input
                    value={clientOrScope}
                    onChange={(e) => setClientOrScope(e.target.value)}
                    placeholder="Internal BUATIN / Joki Skripsi"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">URL Live Production</label>
                  <input
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://buatin.biz.id"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">URL GitHub Repository</label>
                  <input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/daerobi-devs/..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Username / Email Login Demo</label>
                  <input
                    value={demoUser}
                    onChange={(e) => setDemoUser(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Password Login Demo</label>
                  <input
                    value={demoPass}
                    onChange={(e) => setDemoPass(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tech Stack</label>
                <input
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Catatan .env / Port / Kredensial DB</label>
                <textarea
                  rows={2}
                  value={envNotes}
                  onChange={(e) => setEnvNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-500 px-4 py-2 font-bold text-slate-950 hover:bg-teal-400"
                >
                  Simpan Vault
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
// 4. WEEKLY UNIFIED AGENDA & CALENDAR (KULIAH UNPAM + JOKI + PROYEK + DOMAIN)
// ============================================================================
interface WeeklyUnifiedCalendarViewProps {
  courses: AcademicCourse[];
  jokiOrders: JokiOrder[];
  tasks: TaskItem[];
  domains: HostingDomain[];
  onNavigateSection: (sec: any) => void;
}

const DAYS_ID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const WeeklyUnifiedCalendarView: React.FC<WeeklyUnifiedCalendarViewProps> = ({
  courses = [],
  jokiOrders = [],
  tasks = [],
  domains = [],
  onNavigateSection,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-500/25 bg-gradient-to-r from-teal-500/10 via-slate-900 to-sky-500/10 p-5">
        <div className="flex items-center gap-3.5">
          <img
            src="/favicon.png"
            alt="BUATIN"
            className="h-11 w-11 rounded-2xl bg-white p-1.5 shadow-md"
          />
          <div>
            <h2 className="text-lg font-bold text-white">
              Kalender & Agenda Mingguan Terpadu (Kuliah UNPAM • Order Joki • Proyek BUATIN)
            </h2>
            <p className="text-xs text-slate-300">
              Pantau jadwal kuliah mingguan beserta seluruh tenggat waktu Order Joki, Proyek Klien, dan Perpanjangan Domain dalam satu layar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateSection('joki')}
            className="rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
          >
            Buka Order Joki
          </button>
          <button
            onClick={() => onNavigateSection('academic')}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
          >
            Buka Akademik UNPAM
          </button>
        </div>
      </div>

      {/* 6-Day Weekly Schedule Grid (Senin - Sabtu) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DAYS_ID.map((dayName) => {
          const dayCourses = courses.filter((c) =>
            String(c.day_time || '')
              .toLowerCase()
              .includes(dayName.toLowerCase())
          );

          return (
            <div
              key={dayName}
              className="rounded-2xl border border-slate-800/80 bg-[#111520] p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-400" />
                    <h3 className="text-sm font-bold text-white">{dayName}</h3>
                  </div>
                  <span className="rounded-full bg-teal-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-teal-300">
                    {dayCourses.length} Matkul
                  </span>
                </div>

                {dayCourses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800/80 p-3 text-center text-xs text-slate-400">
                    Bebas Kuliah — Fokus Eksekusi Order Joki & Proyek Klien BUATIN
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dayCourses.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] text-sky-400">
                          <span>{c.day_time}</span>
                          <span>{c.room}</span>
                        </div>
                        <div className="mt-1 font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {c.lecturer} • {c.sks} SKS (Hadir {c.attendance_count}/{c.total_meetings})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chronological Deadlines Timeline (Joki + Tasks + Domains) */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#111520] p-5">
        <h3 className="text-base font-bold text-white mb-1">
          Linimasa Tenggat Waktu (Order Joki, Tugas Kuliah UNPAM, Proyek Klien & Domain)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Diurutkan dari tanggal terdekat agar tidak ada orderan joki atau tugas kuliah yang terlewat.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {jokiOrders
            .filter((j) => j.status !== 'done')
            .map((j) => (
              <div
                key={j.id}
                onClick={() => onNavigateSection('joki')}
                className="cursor-pointer rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 hover:border-emerald-500/50 transition"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300">
                    ORDER JOKI ({j.progress_percent}%)
                  </span>
                  <span className="font-mono font-bold text-amber-300">Due: {j.deadline}</span>
                </div>
                <div className="mt-1.5 text-xs font-bold text-white">{j.title}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Klien: {j.client_name} • {j.payment_status} ({formatRupiah(j.price)})
                </div>
              </div>
            ))}

          {tasks
            .filter((t) => t.status !== 'done')
            .map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigateSection('tasks')}
                className="cursor-pointer rounded-xl border border-sky-500/25 bg-sky-500/5 p-3.5 hover:border-sky-500/50 transition"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="rounded bg-sky-500/20 px-2 py-0.5 font-bold text-sky-300 uppercase">
                    {t.scope === 'kuliah' ? 'TUGAS UNPAM' : 'PROYEK KLIEN'}
                  </span>
                  <span className="font-mono font-bold text-slate-300">Due: {t.due_date}</span>
                </div>
                <div className="mt-1.5 text-xs font-bold text-white">{t.title}</div>
                <div className="mt-1 text-[11px] text-slate-400">{t.subject_or_client}</div>
              </div>
            ))}

          {domains.slice(0, 3).map((d) => (
            <div
              key={d.id}
              onClick={() => onNavigateSection('maintenance')}
              className="cursor-pointer rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 hover:border-amber-500/50 transition"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
                  DOMAIN ({d.provider})
                </span>
                <span className="font-mono font-bold text-amber-300">Exp: {d.expiry_date}</span>
              </div>
              <div className="mt-1.5 font-mono text-xs font-bold text-white">
                {d.domain_or_service}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {d.client_owner} • Perpanjangan {formatRupiah(d.renewal_cost)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SETTLEMENT MODAL (Auto-Settlement Masuk Kas ke Dompet & Sync Postgres)
// ============================================================================
export interface SettlementItemData {
  id: string;
  title: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  paymentProof?: string;
  paymentProofNote?: string;
  paymentStatus?: string;
  type: 'joki' | 'invoice';
}

export interface SettlementModalProps {
  item: SettlementItemData | null;
  wallets: Array<{ id: string; name: string; type: string; balance: number }>;
  onClose: () => void;
  onConfirmSettlement: (payload: {
    id: string;
    type: 'joki' | 'invoice';
    walletId: string;
    amount: number;
    description: string;
  }) => Promise<void>;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  item,
  wallets = [],
  onClose,
  onConfirmSettlement,
}) => {
  if (!item) return null;

  const remaining = Math.max(0, Number(item.totalAmount) - Number(item.paidAmount));
  const defaultAmount = remaining > 0 ? remaining : Number(item.totalAmount);

  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    () => wallets[0]?.id || 'w-bca'
  );
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [description, setDescription] = useState<string>(
    `Pelunasan ${item.type === 'joki' ? 'Joki' : 'Invoice'}: ${item.title} - ${item.clientName}`
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletId) {
      setError('Silakan pilih dompet tujuan kas masuk.');
      return;
    }
    if (amount <= 0) {
      setError('Nominal kas masuk harus lebih dari 0.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onConfirmSettlement({
        id: item.id,
        type: item.type,
        walletId: selectedWalletId,
        amount,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses settlement kas.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="my-auto w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111520] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Settlement & Masuk Kas Otomatis</h3>
              <p className="text-[11px] text-slate-400">
                Pilih dompet penerima dana pelunasan klien
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Item Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-400">
                {item.type === 'joki' ? 'Order Joki' : 'Invoice Project'}
              </span>
              <span className="font-mono text-teal-400 font-bold">#{item.id}</span>
            </div>
            <div className="text-sm font-bold text-white">{item.title}</div>
            <div className="text-xs text-slate-300">
              Klien: <strong className="text-sky-400">{item.clientName}</strong>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-800 pt-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Total Nilai</span>
                <strong className="font-mono text-white">{formatRupiah(item.totalAmount)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">DP Masuk</span>
                <strong className="font-mono text-emerald-400">
                  {formatRupiah(item.paidAmount)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Sisa Tagihan</span>
                <strong className="font-mono text-amber-400">{formatRupiah(remaining)}</strong>
              </div>
            </div>
          </div>

          {/* Payment Proof Preview if Customer uploaded one */}
          {item.paymentProof && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                  Bukti Pembayaran Diunggah Klien
                </span>
                {item.paymentProofNote && (
                  <span className="text-[10px] text-slate-300 italic">
                    "{item.paymentProofNote}"
                  </span>
                )}
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 flex items-center justify-center">
                <img
                  src={item.paymentProof}
                  alt="Bukti Transfer Klien"
                  className="max-h-40 w-auto object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Wallet Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Pilih Dompet Penerima Dana Kas Masuk *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {wallets.map((w) => {
                const isSelected = selectedWalletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate">{w.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-400 shrink-0" />}
                    </div>
                    <div className="mt-1 font-mono text-xs font-bold text-slate-200">
                      {formatRupiah(w.balance)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settle Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">Nominal Masuk Kas (Rp) *</label>
              <div className="flex items-center gap-1">
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(remaining)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-teal-300 hover:bg-slate-700"
                  >
                    Sisa ({formatRupiah(remaining)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAmount(Number(item.totalAmount))}
                  className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                >
                  Full ({formatRupiah(item.totalAmount)})
                </button>
              </div>
            </div>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-xl border border-teal-500/40 bg-slate-950 px-3 py-2 font-mono text-sm font-bold text-teal-300 focus:outline-none focus:border-teal-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Keterangan Transaksi Buku Kas
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Info Notice */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400 space-y-1">
            <p>
              • Saldo <strong className="text-teal-400">{selectedWallet?.name || 'Dompet'}</strong>{' '}
              akan otomatis bertambah <strong>{formatRupiah(amount)}</strong>.
            </p>
            <p>
              • Tagihan akan ditandai <strong className="text-emerald-400">Lunas</strong> dan mutasi masuk tercatat di Buku Kas.
            </p>
            <p>• Data otomatis tersinkronisasi ke PostgreSQL homedb.</p>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || amount <= 0}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{submitting ? 'Memproses Settlement...' : 'Konfirmasi & Masuk Kas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
