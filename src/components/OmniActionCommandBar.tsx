import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Search,
  ArrowRight,
  Check,
  Sparkles,
  DollarSign,
  Briefcase,
  GraduationCap,
  FileText,
  Send,
  ArrowLeftRight,
  ChevronRight,
  Calendar,
  Layers,
  Database,
  Server,
  X,
  Bot,
  Mail,
  Zap,
} from 'lucide-react';
import type { DashboardState, ActiveSection } from '../types';

interface OmniActionCommandBarProps {
  isOpen: boolean;
  isDark: boolean;
  data: DashboardState | null;
  onClose: () => void;
  onNavigateSection: (section: ActiveSection) => void;
  onOpenDealCloser: (initialTopic?: string) => void;
  onRefreshState: (next: DashboardState) => void;
  showToast: (msg: string) => void;
  setErrorMsg: (msg: string | null) => void;
}

interface ParsedAction {
  type: 'income' | 'expense' | 'task' | 'invoice' | 'transfer' | 'telegram' | 'deal_closer';
  title: string;
  amount?: number;
  walletId?: string;
  walletName?: string;
  category?: string;
  scope?: 'kuliah' | 'klien';
  clientName?: string;
  targetSection?: ActiveSection;
}

function parseAmountFromText(text: string): number | null {
  // Regex for "350rb", "350k", "1.5jt", "1,5jt", "250000", "rp 350.000"
  const jtMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  const rbMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)/i);
  if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  const rawNumMatch = text.match(/(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,9})/i);
  if (rawNumMatch) {
    const cleanStr = rawNumMatch[1].replace(/\./g, '');
    const val = parseInt(cleanStr, 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return null;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const MODULE_NAV_ITEMS: { id: ActiveSection; label: string; icon: any; keywords: string[] }[] = [
  { id: 'overview', label: 'Command Overview (Ringkasan Pusat)', icon: Layers, keywords: ['home', 'dashboard', 'utama'] },
  { id: 'joki', label: 'Order Joki & Tugas Kuliah', icon: Briefcase, keywords: ['joki', 'tugas', 'order', 'mahasiswa'] },
  { id: 'crm', label: 'CRM & Pipeline Deal Bisnis', icon: Briefcase, keywords: ['crm', 'klien', 'deal', 'prospek'] },
  { id: 'academic', label: 'Akademik UNPAM & KRS SKS', icon: GraduationCap, keywords: ['unpam', 'kuliah', 'dosen', 'krs', 'sks'] },
  { id: 'finance', label: 'Kas, Dompet & RAB Keuangan', icon: DollarSign, keywords: ['kas', 'dompet', 'saldo', 'rekening', 'rab', 'invoice'] },
  { id: 'google', label: 'Google Workspace (Drive & Gmail Live)', icon: Mail, keywords: ['gmail', 'drive', 'docs', 'sheets', 'email', 'google'] },
  { id: 'ai', label: 'AI Cerdas & BotFather Telegram', icon: Bot, keywords: ['ai', 'gemini', 'telegram', 'bot', 'chat'] },
  { id: 'tasks', label: 'Kanban Tugas & Proyek', icon: FileText, keywords: ['kanban', 'todo', 'proyek'] },
  { id: 'coolify', label: 'Coolify Home Server & Tailscale', icon: Server, keywords: ['coolify', 'server', 'docker', 'deploy'] },
  { id: 'database', label: 'Postgres homedb & CloudBeaver', icon: Database, keywords: ['postgres', 'database', 'sql', 'homedb'] },
  { id: 'calendar', label: 'Kalender & Agenda Deadline', icon: Calendar, keywords: ['kalender', 'jadwal', 'deadline', 'agenda'] },
];

export function OmniActionCommandBar({
  isOpen,
  isDark,
  data,
  onClose,
  onNavigateSection,
  onOpenDealCloser,
  onRefreshState,
  showToast,
  setErrorMsg,
}: OmniActionCommandBarProps) {
  const [query, setQuery] = useState('');
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Parse Natural Language Command from query
  const parsedAction = useMemo<ParsedAction | null>(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 4) return null;

    // 1. Kas Masuk
    if (
      (q.includes('kas masuk') || q.includes('pemasukan') || q.includes('terima duit') || q.includes('terima uang') || q.includes('bayar joki') || q.includes('dapat uang')) &&
      parseAmountFromText(q)
    ) {
      const amount = parseAmountFromText(q)!;
      let title = q
        .replace(/catat\s+/i, '')
        .replace(/kas masuk\s*/i, '')
        .replace(/pemasukan\s*/i, '')
        .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?\s*(?:rb|k|jt|juta)?|\d{4,9})/i, '')
        .replace(/(?:dari|di|via|ke)\s+(?:bca|jago|gopay|mandiri|dana)/i, '')
        .trim();
      if (!title) title = 'Pemasukan Kas Masuk';

      let walletId = 'wallet-bca';
      let walletName = 'BCA';
      if (q.includes('jago')) {
        walletId = 'wallet-jago';
        walletName = 'Bank Jago';
      } else if (q.includes('gopay')) {
        walletId = 'wallet-gopay';
        walletName = 'GoPay';
      }

      return {
        type: 'income',
        title: title.charAt(0).toUpperCase() + title.slice(1),
        amount,
        walletId,
        walletName,
        category: q.includes('joki') ? 'Joki & Tugas' : 'Proyek Klien',
      };
    }

    // 2. Kas Keluar
    if (
      (q.includes('kas keluar') || q.includes('pengeluaran') || q.includes('beli') || q.includes('bayar') || q.includes('ongkos')) &&
      parseAmountFromText(q)
    ) {
      const amount = parseAmountFromText(q)!;
      let title = q
        .replace(/catat\s+/i, '')
        .replace(/kas keluar\s*/i, '')
        .replace(/pengeluaran\s*/i, '')
        .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?\s*(?:rb|k|jt|juta)?|\d{4,9})/i, '')
        .replace(/(?:pakai|via|dari)\s+(?:bca|jago|gopay|mandiri|dana)/i, '')
        .trim();
      if (!title) title = 'Pengeluaran Operasional';

      let walletId = 'wallet-bca';
      let walletName = 'BCA';
      if (q.includes('jago')) {
        walletId = 'wallet-jago';
        walletName = 'Bank Jago';
      } else if (q.includes('gopay')) {
        walletId = 'wallet-gopay';
        walletName = 'GoPay';
      }

      return {
        type: 'expense',
        title: title.charAt(0).toUpperCase() + title.slice(1),
        amount,
        walletId,
        walletName,
        category: 'Operasional & Langganan',
      };
    }

    // 3. Buat Tugas / Todo
    if (q.includes('tugas') || q.includes('tambah tugas') || q.includes('buat tugas') || q.includes('todo') || q.includes('makalah')) {
      let title = q
        .replace(/tambah tugas\s*/i, '')
        .replace(/buat tugas\s*/i, '')
        .replace(/tugas baru\s*/i, '')
        .replace(/tugas\s*/i, '')
        .replace(/deadline\s+\w+/i, '')
        .trim();
      if (!title) title = 'Tugas Baru';

      const isKuliah = q.includes('unpam') || q.includes('kuliah') || q.includes('makalah') || q.includes('dosen') || q.includes('pr');
      return {
        type: 'task',
        title: title.charAt(0).toUpperCase() + title.slice(1),
        scope: isKuliah ? 'kuliah' : 'klien',
      };
    }

    // 4. Telegram Alert / Broadcast
    if (q.includes('telegram') || q.includes('kirim ringkasan') || q.includes('botfather') || q.includes('notif hp')) {
      return {
        type: 'telegram',
        title: 'Kirim Ringkasan Operasional ke Telegram Bot',
      };
    }

    // 5. Deal Closer / Nego Harga
    if (q.includes('deal') || q.includes('closer') || q.includes('hitung harga') || q.includes('nego') || q.includes('penawaran')) {
      return {
        type: 'deal_closer',
        title: 'Buka AI Deal Closing & Pricing Negotiator',
      };
    }

    return null;
  }, [query]);

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODULE_NAV_ITEMS;
    return MODULE_NAV_ITEMS.filter((item) => {
      return (
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      );
    });
  }, [query]);

  // Execute Parsed Action
  const handleExecuteAction = async () => {
    if (!parsedAction || executing) return;
    setExecuting(true);

    try {
      if (parsedAction.type === 'income' || parsedAction.type === 'expense') {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: parsedAction.title,
            type: parsedAction.type,
            amount: parsedAction.amount,
            category: parsedAction.category,
            wallet_id: parsedAction.walletId,
            date: new Date().toISOString().slice(0, 10),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal menyimpan transaksi.');
        onRefreshState(json);
        showToast(
          `${parsedAction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${formatRupiah(
            parsedAction.amount!
          )} berhasil dicatat di ${parsedAction.walletName}!`
        );
        onClose();
        return;
      }

      if (parsedAction.type === 'task') {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: parsedAction.title,
            scope: parsedAction.scope,
            subject_or_client: parsedAction.scope === 'kuliah' ? 'UNPAM TI' : 'Klien Eksternal',
            priority: 'high',
            due_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
            budget_or_weight: 'Omni Command',
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal membuat tugas.');
        onRefreshState(json);
        showToast(`Tugas "${parsedAction.title}" berhasil ditambahkan ke Kanban!`);
        onClose();
        return;
      }

      if (parsedAction.type === 'telegram') {
        const res = await fetch('/api/telegram/deadline-alert', { method: 'POST' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal mengirim ke Telegram.');
        onRefreshState(json);
        showToast('Ringkasan operasional berhasil dikirim ke Bot Telegram Anda!');
        onClose();
        return;
      }

      if (parsedAction.type === 'deal_closer') {
        onClose();
        onOpenDealCloser(query.replace(/deal|closer|hitung|nego|harga/gi, '').trim());
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (parsedAction) {
        e.preventDefault();
        handleExecuteAction();
      } else if (filteredModules.length > 0) {
        e.preventDefault();
        onNavigateSection(filteredModules[0].id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 pt-20 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'border-white/[0.1] bg-[#121621] text-white' : 'border-slate-200 bg-white text-slate-900'
          }`}
        >
          {/* Top Omni-Input */}
          <div className="relative flex items-center border-b border-white/[0.08] px-5 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 mr-3 shrink-0">
              <Zap size={16} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik perintah santai (cth: catat kas masuk 350rb joki bca, tugas unpam, deal closer)..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="mr-2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
              ESC untuk tutup
            </kbd>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
            {/* 1. Parsed Action Card (If Natural Language Detected) */}
            {parsedAction && (
              <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/15 to-amber-500/5 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-orange-400" />
                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                      Perintah Otonom Terdeteksi (Tekan Enter Untuk Eksekusi Langsung)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Omni-Execution</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {parsedAction.type === 'income' && <DollarSign size={16} className="text-emerald-400" />}
                      {parsedAction.type === 'expense' && <DollarSign size={16} className="text-rose-400" />}
                      {parsedAction.type === 'task' && <FileText size={16} className="text-blue-400" />}
                      {parsedAction.type === 'telegram' && <Send size={16} className="text-sky-400" />}
                      {parsedAction.type === 'deal_closer' && <Sparkles size={16} className="text-amber-400" />}
                      <span>{parsedAction.title}</span>
                    </h4>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      {parsedAction.amount && (
                        <span className="rounded bg-black/40 px-2 py-0.5 font-bold text-emerald-400">
                          {formatRupiah(parsedAction.amount)}
                        </span>
                      )}
                      {parsedAction.walletName && (
                        <span className="text-slate-400">
                          • Dompet: <strong className="text-white">{parsedAction.walletName}</strong>
                        </span>
                      )}
                      {parsedAction.category && (
                        <span className="text-slate-400">
                          • Kategori: <strong className="text-white">{parsedAction.category}</strong>
                        </span>
                      )}
                      {parsedAction.scope && (
                        <span className="text-slate-400">
                          • Lingkup: <strong className="text-white">{parsedAction.scope === 'kuliah' ? 'Akademik UNPAM' : 'Proyek Klien'}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteAction}
                    disabled={executing}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition-colors"
                  >
                    <span>{executing ? 'Mengeksekusi...' : 'Eksekusi Sekarang ↵'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* 2. Quick Action Chips (If query is empty) */}
            {!query && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                  Perintah Cepat & Asisten Otonom
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDealCloser();
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#171c29]/70 p-3 text-left hover:border-orange-500/40 hover:bg-[#1e2436] transition-all group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 group-hover:scale-105 transition-transform">
                      <Sparkles size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white">AI Deal Closer & Negosiator</div>
                      <div className="text-[10px] text-slate-400 truncate">Hitung harga joki & draf WA deal</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateSection('google');
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#171c29]/70 p-3 text-left hover:border-orange-500/40 hover:bg-[#1e2436] transition-all group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 text-red-400 group-hover:scale-105 transition-transform">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white">Gmail & Drive In-App Reader</div>
                      <div className="text-[10px] text-slate-400 truncate">Split-pane berkas & email auto-sync</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                  </button>

                  <button
                    onClick={() => {
                      setQuery('catat kas masuk 350rb joki web unpam via bca');
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#171c29]/70 p-3 text-left hover:border-orange-500/40 hover:bg-[#1e2436] transition-all group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-105 transition-transform">
                      <DollarSign size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white">Contoh: Catat Kas Masuk 350rb</div>
                      <div className="text-[10px] text-slate-400 truncate">NLP parser transaksi otomatis</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                  </button>

                  <button
                    onClick={() => {
                      setQuery('kirim ringkasan ke telegram');
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#171c29]/70 p-3 text-left hover:border-orange-500/40 hover:bg-[#1e2436] transition-all group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 group-hover:scale-105 transition-transform">
                      <Send size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white">Broadcast Notif Telegram</div>
                      <div className="text-[10px] text-slate-400 truncate">Kirim rangkuman tugas ke BotFather</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Filtered Module Navigation List */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                {query ? 'Pencarian Modul & Navigasi' : 'Pindah Modul Cepat'}
              </span>
              <div className="space-y-1">
                {filteredModules.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigateSection(item.id);
                        onClose();
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp size={15} className="text-slate-400 group-hover:text-orange-400 transition-colors" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 group-hover:text-slate-300 font-mono">
                        Buka ↵
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Guide */}
          <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-2.5 bg-white/[0.02] text-[11px] text-slate-400">
            <span>
              Tip: Ketik <strong className="text-slate-300 font-semibold">"kas masuk [nominal] [judul]"</strong> atau <strong className="text-slate-300 font-semibold">"tugas [judul]"</strong>
            </span>
            <span>Nexus OS Omni-Bar v2</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
