import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  KanbanSquare,
  Server,
  Wallet as WalletIcon,
  Database,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Check,
  CheckCircle2,
  Trash2,
  FolderKanban,
  GraduationCap,
  ShieldCheck,
  Download,
  Upload,
  Command,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  FileSpreadsheet,
  HardDrive,
  AlertCircle,
  Clock,
  Layers,
  Bot,
  Cloud,
  Sparkles,
  Activity,
  ExternalLink,
  Receipt,
  Briefcase,
  Target,
  FileText,
  Timer,
  Cpu,
  Calendar,
  Edit3,
  Printer,
} from 'lucide-react';
import type { DashboardState, TaskItem, CrmDeal, Transaction } from './types';
import { AiAndTelegramView, GoogleWorkspaceView } from './components/IntegrationsAndAiViews';
import { TaskDetailDrawer } from './components/ExtendedModalsAndDrawers';
import {
  CrmPipelineView,
  AcademicUnpamView,
  PersonalOsView,
} from './components/CrmAcademicPersonalViews';
import {
  CoolifyControlView,
  SmartDocGeneratorView,
  FocusAndCyclingView,
} from './components/PowerFeatureViews';
import {
  JokiManagementView,
  HostingAndDomainSection,
  ProjectVaultSection,
  WeeklyUnifiedCalendarView,
  BuatinReceiptModal,
  BuatinReceiptData,
  StandaloneCustomerInvoicePage,
  QrisDynamicGeneratorPanel,
  PaginationControls,
  SettlementModal,
  SettlementItemData,
} from './components/JokiAndHostingViews';
import { OmniActionCommandBar } from './components/OmniActionCommandBar';
import { DealClosingAssistantModal } from './components/DealClosingAssistantModal';
import { StorageAssetsView } from './components/StorageAssetsView';

type ActiveSection =
  | 'overview'
  | 'calendar'
  | 'joki'
  | 'crm'
  | 'academic'
  | 'personal'
  | 'coolify'
  | 'documents'
  | 'focus'
  | 'ai'
  | 'google'
  | 'assets'
  | 'tasks'
  | 'maintenance'
  | 'finance'
  | 'database';

const VALID_SECTIONS: ActiveSection[] = [
  'overview',
  'calendar',
  'joki',
  'crm',
  'academic',
  'personal',
  'coolify',
  'documents',
  'focus',
  'ai',
  'google',
  'assets',
  'tasks',
  'maintenance',
  'finance',
  'database',
];

const getInitialActiveSection = (): ActiveSection => {
  if (typeof window === 'undefined') return 'overview';
  const param = new URLSearchParams(window.location.search).get('tab') as ActiveSection;
  if (param && VALID_SECTIONS.includes(param)) return param;
  const saved = localStorage.getItem('nexus_active_section') as ActiveSection;
  if (saved && VALID_SECTIONS.includes(saved)) return saved;
  return 'overview';
};

const getInitialFinanceTab = (): 'kas' | 'invoice' | 'qris' => {
  if (typeof window === 'undefined') return 'kas';
  const param = new URLSearchParams(window.location.search).get('subtab');
  if (param === 'kas' || param === 'invoice' || param === 'qris') return param;
  const saved = localStorage.getItem('nexus_finance_tab');
  if (saved === 'kas' || saved === 'invoice' || saved === 'qris') return saved as any;
  return 'kas';
};

const getInitialMaintTab = (): 'uptime' | 'domain' | 'vault' => {
  if (typeof window === 'undefined') return 'uptime';
  const param = new URLSearchParams(window.location.search).get('subtab');
  if (param === 'uptime' || param === 'domain' || param === 'vault') return param;
  const saved = localStorage.getItem('nexus_maint_tab');
  if (saved === 'uptime' || saved === 'domain' || saved === 'vault') return saved as any;
  return 'uptime';
};

const getInitialJokiTab = (): 'orders' | 'qris' => {
  if (typeof window === 'undefined') return 'orders';
  const param = new URLSearchParams(window.location.search).get('subtab');
  if (param === 'orders' || param === 'qris') return param;
  const saved = localStorage.getItem('nexus_joki_tab');
  if (saved === 'orders' || saved === 'qris') return saved as any;
  return 'orders';
};

const formatIDR = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

// Reusable segmented sub-tab bar (pemecah halaman panjang jadi beberapa tab ringkas)
function SubTabBar<T extends string>({
  tabs,
  active,
  onChange,
  isDark,
}: {
  tabs: { id: T; label: string; icon: React.ComponentType<any>; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  isDark: boolean;
}) {
  return (
    <div
      className={`flex w-full gap-1 overflow-x-auto rounded-2xl border p-1 ${
        isDark ? 'border-white/[0.07] bg-[#0d1117]' : 'border-slate-200 bg-white'
      }`}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              isActive
                ? isDark
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon size={14} />
            <span className="whitespace-nowrap">{t.label}</span>
            {typeof t.count === 'number' && (
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                  isActive
                    ? isDark
                      ? 'bg-slate-900/10'
                      : 'bg-white/20'
                    : isDark
                    ? 'bg-white/[0.06]'
                    : 'bg-slate-100'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const publicInvoiceId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('invoice');
  }, []);

  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<ActiveSection>(getInitialActiveSection);
  const [financeTab, setFinanceTab] = useState<'kas' | 'invoice' | 'qris'>(getInitialFinanceTab);
  const [maintTab, setMaintTab] = useState<'uptime' | 'domain' | 'vault'>(getInitialMaintTab);
  const [jokiTab, setJokiTab] = useState<'orders' | 'qris'>(getInitialJokiTab);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('ALL');
  const [taskScopeFilter, setTaskScopeFilter] = useState<'all' | 'kuliah' | 'klien'>('all');

  // Modals & Drawers
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);
  const [receiptModalData, setReceiptModalData] = useState<BuatinReceiptData | null>(null);
  const [settlementTarget, setSettlementTarget] = useState<SettlementItemData | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [maintModalOpen, setMaintModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [dealCloserOpen, setDealCloserOpen] = useState(false);
  const [dealCloserInitialTopic, setDealCloserInitialTopic] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [pingingServerId, setPingingServerId] = useState<string | null>(null);

  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const [txForm, setTxForm] = useState({
    title: '',
    category: 'Proyek Klien',
    type: 'income' as 'income' | 'expense',
    amount: '',
    wallet_id: 'wallet-bca',
  });

  const [transferForm, setTransferForm] = useState({
    from_wallet_id: 'wallet-bca',
    to_wallet_id: 'wallet-jago',
    amount: '',
    notes: '',
  });

  const [walletForm, setWalletForm] = useState({
    name: '',
    bank_code: 'MANDIRI',
    account_number: '',
    balance: '',
  });

  const [invoiceForm, setInvoiceForm] = useState({
    client_name: '',
    project_title: '',
    due_date: '2026-11-25',
    item1_desc: 'Pengembangan Modul Utama & Backend',
    item1_price: '4500000',
    item2_desc: 'Setup Server, Deployment & Garansi Maintenance',
    item2_price: '1500000',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    scope: 'klien' as 'kuliah' | 'klien',
    subject_or_client: '',
    priority: 'high' as 'high' | 'medium' | 'low',
    due_date: '2026-11-20',
    budget_or_weight: '',
    notes: '',
  });

  const [maintForm, setMaintForm] = useState({
    app_name: '',
    client_name: '',
    environment: 'Coolify Home Server • Docker',
    url: 'https://example.com',
    monthly_fee: '',
    next_check_date: '2026-11-25',
  });

  const [limitInput, setLimitInput] = useState('5500000');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const fetchState = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Gagal memuat state dari SQLite lokal.');
      const json: DashboardState = await res.json();

      setData((prev) => {
        if (prev && silent) {
          const prevEmails = prev.googleItems?.filter((g) => g.kind === 'gmail') || [];
          const newEmails = json.googleItems?.filter((g) => g.kind === 'gmail') || [];
          if (newEmails.length > 0 && prevEmails.length > 0) {
            const prevFirstId = prevEmails[0]?.id;
            const newFirst = newEmails[0];
            if (newFirst && newFirst.id !== prevFirstId) {
              showToast(`Pesan Gmail Baru Masuk: "${newFirst.title.slice(0, 45)}"`);
            }
          }
        }
        return json;
      });

      if (json.settings?.monthly_spending_limit) {
        setLimitInput(json.settings.monthly_spending_limit);
      }
      setErrorMsg(null);
    } catch (err: any) {
      if (!silent) {
        setErrorMsg(err?.message || 'Tidak dapat terhubung ke layanan SQLite lokal.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchState(false);

    // Auto-refresh state in background every 25 seconds when browser tab is active
    const autoRefreshTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchState(true);
      }
    }, 25000);

    // Refresh immediately when returning to dashboard tab
    const handleWindowFocus = () => {
      fetchState(true);
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(autoRefreshTimer);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Tab Persistence & URL Synchronization
  useEffect(() => {
    if (publicInvoiceId) return;
    localStorage.setItem('nexus_active_section', activeSection);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeSection);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, [activeSection, publicInvoiceId]);

  useEffect(() => {
    if (publicInvoiceId) return;
    const handlePopState = () => {
      const param = new URLSearchParams(window.location.search).get('tab') as ActiveSection;
      if (param && VALID_SECTIONS.includes(param)) {
        setActiveSection(param);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [publicInvoiceId]);

  useEffect(() => {
    localStorage.setItem('nexus_joki_tab', jokiTab);
  }, [jokiTab]);

  useEffect(() => {
    localStorage.setItem('nexus_finance_tab', financeTab);
  }, [financeTab]);

  useEffect(() => {
    localStorage.setItem('nexus_maint_tab', maintTab);
  }, [maintTab]);

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast('Pengaturan berhasil disimpan & disinkronkan!');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan pengaturan.');
    }
  };

  const metrics = useMemo(() => {
    if (!data) {
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        monthlyRetainer: 0,
        activeTasksCount: 0,
        kuliahTasksCount: 0,
        klienTasksCount: 0,
        spendingLimit: 5500000,
        spendingRatio: 0,
      };
    }

    const totalBalance = data.wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    const totalIncome = data.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = data.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyRetainer = data.maintenance.reduce((sum, m) => sum + Number(m.monthly_fee), 0);

    const activeTasks = data.tasks.filter((t) => t.status !== 'done');
    const kuliahTasksCount = activeTasks.filter((t) => t.scope === 'kuliah').length;
    const klienTasksCount = activeTasks.filter((t) => t.scope === 'klien').length;

    const spendingLimit = Number(data.settings?.monthly_spending_limit || 5500000);
    const spendingRatio = Math.min(100, Math.round((totalExpense / Math.max(1, spendingLimit)) * 100));

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      monthlyRetainer,
      activeTasksCount: activeTasks.length,
      kuliahTasksCount,
      klienTasksCount,
      spendingLimit,
      spendingRatio,
    };
  }, [data]);

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    return data.transactions.filter((tx) => {
      const matchesCategory = txCategoryFilter === 'ALL' || tx.category === txCategoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        tx.title.toLowerCase().includes(q) ||
        tx.code.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [data, txCategoryFilter, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!data) return [];
    return data.tasks.filter((task) => {
      const matchesScope = taskScopeFilter === 'all' || task.scope === taskScopeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.subject_or_client.toLowerCase().includes(q);
      return matchesScope && matchesQuery;
    });
  }, [data, taskScopeFilter, searchQuery]);

  const selectedTask = useMemo(
    () => data?.tasks.find((t) => t.id === selectedTaskId) || null,
    [data, selectedTaskId]
  );

  // Handlers
  const openTransactionModal = (type: 'income' | 'expense') => {
    setEditingTxId(null);
    setTxForm({
      title: '',
      category: type === 'income' ? 'Proyek Klien' : 'Operasional Server',
      type,
      amount: '',
      wallet_id: data?.wallets?.[0]?.id || 'wallet-bca',
    });
    setTxModalOpen(true);
  };

  const openEditTransactionModal = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setTxForm({
      title: tx.title,
      category: tx.category,
      type: tx.type,
      amount: String(tx.amount),
      wallet_id: tx.wallet_id,
    });
    setTxModalOpen(true);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/transactions', {
        method: editingTxId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTxId,
          ...txForm,
          amount: Number(txForm.amount),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setTxModalOpen(false);
      setEditingTxId(null);
      showToast(
        editingTxId
          ? 'Transaksi diperbarui & saldo dompet disesuaikan otomatis!'
          : 'Transaksi tersimpan di SQLite & saldo dompet diperbarui.'
      );
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleTransferWallets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferForm,
          amount: Number(transferForm.amount),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setTransferModalOpen(false);
      setTransferForm({ ...transferForm, amount: '', notes: '' });
      showToast('Transfer antar dompet berhasil dicatat di SQLite!');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...walletForm,
          balance: Number(walletForm.balance),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setWalletModalOpen(false);
      setWalletForm({ name: '', bank_code: 'MANDIRI', account_number: '', balance: '' });
      showToast('Rekening operasional baru ditambahkan!');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = [
        { desc: invoiceForm.item1_desc, qty: 1, price: Number(invoiceForm.item1_price) || 0 },
        { desc: invoiceForm.item2_desc, qty: 1, price: Number(invoiceForm.item2_price) || 0 },
      ].filter((i) => i.desc && i.price > 0);

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: invoiceForm.client_name,
          project_title: invoiceForm.project_title,
          due_date: invoiceForm.due_date,
          items,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setInvoiceModalOpen(false);
      showToast('Invoice RAB proyek berhasil dibuat!');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleMarkInvoicePaid = async (id: string) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, wallet_id: 'wallet-bca' }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast('Invoice lunas! Dana otomatis masuk ke BCA Operasional.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleConfirmSettlement = async (payload: {
    id: string;
    type: 'joki' | 'invoice';
    walletId: string;
    amount: number;
    description: string;
  }) => {
    try {
      const res = await fetch('/api/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memproses settlement kas.');
      setData(json);
      showToast(`Pelunasan berhasil! Dana sebesar ${formatIDR(payload.amount)} masuk ke dompet.`);
      setSettlementTarget(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast('Transaksi dihapus & saldo dikembalikan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setTaskModalOpen(false);
      showToast('Tugas baru berhasil disimpan ke SQLite.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: TaskItem['status']) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast('Status tugas diperbarui.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAutoPriority = async () => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_priority' }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast('Prioritas tugas diurutkan otomatis berdasarkan sisa hari tenggat!');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast('Tugas dihapus dari SQLite.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...maintForm, monthly_fee: Number(maintForm.monthly_fee) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setMaintModalOpen(false);
      showToast('Target maintenance baru ditambahkan.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handlePingServer = async (id?: string) => {
    setPingingServerId(id || 'ALL');
    try {
      const res = await fetch('/api/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast('Live HTTP Health Check selesai & latensi diperbarui!');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setPingingServerId(null);
    }
  };

  const handleCycleMaintenanceStatus = async (id: string, current: string) => {
    const order = ['Healthy', 'Maintenance', 'Warning'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    try {
      const res = await fetch('/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast(`Status layanan diubah ke ${next}.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'monthly_spending_limit', value: limitInput }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        setLimitModalOpen(false);
        showToast('Batas anggaran bulanan diperbarui.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-sqlite-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON berhasil diunduh.');
  };

  const handleRestoreJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      showToast('Database SQLite berhasil dipulihkan dari berkas Backup JSON!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memulihkan file backup JSON.');
    }
  };

  const handleExportCsv = () => {
    if (!data) return;
    const headers = ['Kode,Judul,Kategori,Tipe,Nominal_IDR,Dompet,Status,Tanggal'];
    const rows = data.transactions.map(
      (t) =>
        `"${t.code}","${t.title.replace(/"/g, '""')}","${t.category}","${t.type}",${t.amount},"${t.wallet_id}","${t.status}","${t.created_at}"`
    );
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-kas-nexus-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Laporan CSV berhasil diunduh.');
  };

  // CRM, Academic & Personal OS Handlers
  const handleCreateCrmClient = async (payload: any) => {
    const res = await fetch('/api/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Klien CRM baru berhasil disimpan ke SQLite.');
    }
  };

  const handleDeleteCrmClient = async (id: string) => {
    const res = await fetch(`/api/crm?id=${encodeURIComponent(id)}&kind=client`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Data klien CRM dihapus.');
    }
  };

  const handleCreateCrmDeal = async (payload: any) => {
    const res = await fetch('/api/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, kind: 'deal' }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Deal prospek baru ditambahkan ke Pipeline!');
    }
  };

  const handleUpdateDealStage = async (id: string, stage: CrmDeal['stage']) => {
    const res = await fetch('/api/crm', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast(`Tahap deal diperbarui ke ${stage}.`);
    }
  };

  const handleConvertDeal = async (id: string) => {
    const res = await fetch('/api/crm', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'convert' }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Deal berhasil dikonversi otomatis menjadi Proyek Kanban & Invoice RAB!');
    }
  };

  const handleDeleteCrmDeal = async (id: string) => {
    const res = await fetch(`/api/crm?id=${encodeURIComponent(id)}&kind=deal`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Deal dihapus dari pipeline.');
    }
  };

  const handleCreateAcademicCourse = async (payload: any) => {
    const res = await fetch('/api/academic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Mata kuliah UNPAM berhasil ditambahkan.');
    }
  };

  const handleIncrementCourseAttendance = async (id: string) => {
    const res = await fetch('/api/academic', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Presensi kehadiran kuliah (+1 Hadir) tercatat!');
    }
  };

  const handleCreatePersonalHabit = async (payload: any) => {
    const res = await fetch('/api/personal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Habit harian baru ditambahkan.');
    }
  };

  const handleTogglePersonalHabit = async (id: string) => {
    const res = await fetch('/api/personal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, kind: 'habit' }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Status habit & streak harian diperbarui!');
    }
  };

  const handleUpdatePersonalGoalProgress = async (id: string, delta: number) => {
    const res = await fetch('/api/personal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, kind: 'goal', delta }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Progres target OKR diperbarui!');
    }
  };

  // Power Features Handlers (Coolify, Docs .DOCX, Focus & Cycling)
  const handleSyncCoolify = async () => {
    const res = await fetch('/api/coolify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync' }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Sinkronisasi container Coolify Home Server selesai!');
    }
  };

  const handleCoolifyAction = async (id: string, action: 'restart' | 'deploy' | 'stop') => {
    const res = await fetch('/api/coolify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast(`Perintah ${action.toUpperCase()} dikirim ke container Coolify!`);
    }
  };

  const handleCreateCoolifyResource = async (payload: any) => {
    const res = await fetch('/api/coolify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Service Coolify baru ditambahkan.');
    }
  };

  const handleCreateSmartDocument = async (payload: any) => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Dokumen .DOCX siap diunduh!');
    }
  };

  const handleDeleteSmartDocument = async (id: string) => {
    const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Dokumen dihapus dari arsip.');
    }
  };

  const handleCreateFocusSession = async (payload: any) => {
    const res = await fetch('/api/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Sesi Deep Work & Billable Hours tersimpan ke SQLite!');
    }
  };

  const handleDeleteFocusSession = async (id: string) => {
    const res = await fetch(`/api/focus?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Sesi fokus dihapus.');
    }
  };

  const handleCreateCyclingLog = async (payload: any) => {
    const res = await fetch('/api/cycling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Rute gowes tercatat & OKR jarak sepeda diperbarui!');
    }
  };

  const handleDeleteCyclingLog = async (id: string) => {
    const res = await fetch(`/api/cycling?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Log bersepeda dihapus.');
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    try {
      const res = await fetch(`/api/maintenance?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        showToast('Item server maintenance dihapus.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateHostingDomain = async (payload: any) => {
    const res = await fetch('/api/hosting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Akun Hosting / Domain (Rumahweb / Cloudflare) berhasil ditambahkan.');
    }
  };

  const handleUpdateHostingDomain = async (id: string, payload: any) => {
    const res = await fetch('/api/hosting', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Data akun Hosting / Domain diperbarui.');
    }
  };

  const handleDeleteHostingDomain = async (id: string) => {
    const res = await fetch(`/api/hosting?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Akun Hosting / Domain dihapus.');
    }
  };

  const handleUpdateCrmClient = async (id: string, payload: any) => {
    const res = await fetch('/api/crm', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Data klien CRM diperbarui.');
    }
  };

  const handleUpdateAcademicCourse = async (id: string, payload: any) => {
    const res = await fetch('/api/academic', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Data mata kuliah & nilai UNPAM diperbarui!');
    }
  };

  const handleDeleteAcademicCourse = async (id: string) => {
    const res = await fetch(`/api/academic?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Mata kuliah UNPAM dihapus.');
    }
  };

  const handleCreateJokiOrder = async (payload: any) => {
    const res = await fetch('/api/joki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Order Joki baru berhasil disimpan & DP masuk kas!');
    }
  };

  const handleUpdateJokiOrder = async (id: string, payload: any) => {
    const res = await fetch('/api/joki', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Order Joki diperbarui.');
    }
  };

  const handleMarkJokiPaid = async (id: string) => {
    const res = await fetch('/api/joki', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'mark_paid' }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Order Joki LUNAS! Sisa pembayaran otomatis masuk ke Dompet.');
    }
  };

  const handleDeleteJokiOrder = async (id: string) => {
    const res = await fetch(`/api/joki?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Order Joki dihapus.');
    }
  };

  const handleSendTelegramDeadlineAlert = async () => {
    try {
      const res = await fetch('/api/telegram/deadline-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengirim notifikasi Telegram.');
      if (json.state) setData(json.state);
      if (json.sent) {
        showToast(`Notifikasi ${json.count} deadline berhasil dikirim ke Bot Telegram kamu!`);
      } else {
        setErrorMsg(
          json.reason ||
            'Pastikan Bot Token & Chat ID Telegram sudah terhubung (kirim pesan /start ke bot terlebih dahulu di menu AI Cerdas & Telegram).'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleAutoDeadlineAlert = async (enabled: boolean) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'telegram_auto_deadline_alert',
        value: enabled ? 'true' : 'false',
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast(
        enabled
          ? 'Auto-Alert Deadline Telegram diaktifkan!'
          : 'Auto-Alert Deadline Telegram dinonaktifkan.'
      );
    }
  };

  const handleCreateVault = async (payload: any) => {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Kredensial & Repo Proyek baru tersimpan ke Vault SQLite!');
    }
  };

  const handleUpdateVault = async (id: string, payload: any) => {
    const res = await fetch('/api/vault', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Data Vault Proyek diperbarui.');
    }
  };

  const handleDeleteVault = async (id: string) => {
    const res = await fetch(`/api/vault?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      showToast('Item Vault Proyek dihapus.');
    }
  };

  const navItems: {
    id: ActiveSection;
    label: string;
    group: string;
    badge?: string;
    icon: React.ComponentType<any>;
  }[] = [
    // COMMAND CENTER
    { id: 'overview', label: 'Overview Command', group: 'Command Center', icon: LayoutGrid },
    { id: 'calendar', label: 'Kalender & Agenda', group: 'Command Center', badge: '7H', icon: Calendar },
    {
      id: 'ai',
      label: 'AI Cerdas & Telegram',
      group: 'Command Center',
      badge: data?.telegramStatus?.connected ? 'ON' : 'AI',
      icon: Bot,
    },
    // BISNIS BUATIN & JOKI
    {
      id: 'joki',
      label: 'Order Joki',
      group: 'Bisnis BUATIN & Joki',
      badge: String((data?.jokiOrders || []).filter((j) => j.status !== 'done').length),
      icon: Sparkles,
    },
    {
      id: 'crm',
      label: 'CRM & Deal Bisnis',
      group: 'Bisnis BUATIN & Joki',
      badge: String(data?.crmDeals?.length || 0),
      icon: Briefcase,
    },
    { id: 'finance', label: 'Kas, Dompet & RAB', group: 'Bisnis BUATIN & Joki', icon: WalletIcon },
    {
      id: 'documents',
      label: 'Generator DOCX & MoU',
      group: 'Bisnis BUATIN & Joki',
      badge: String(data?.generatedDocuments?.length || 0),
      icon: FileText,
    },
    // KULIAH & PRIBADI
    {
      id: 'academic',
      label: 'Akademik UNPAM',
      group: 'Kuliah & Pribadi',
      badge: `${(data?.academicCourses || []).reduce((s, c) => s + Number(c.sks), 0) || 19} SKS`,
      icon: GraduationCap,
    },
    {
      id: 'tasks',
      label: 'Tugas & Proyek',
      group: 'Kuliah & Pribadi',
      badge: String(metrics.activeTasksCount),
      icon: KanbanSquare,
    },
    {
      id: 'personal',
      label: 'Personal & Habit',
      group: 'Kuliah & Pribadi',
      badge: `${(data?.personalHabits || []).filter((h) => h.completed_today).length}/${
        data?.personalHabits?.length || 0
      }`,
      icon: Target,
    },
    {
      id: 'focus',
      label: 'Deep Work & Cycling',
      group: 'Kuliah & Pribadi',
      badge: `${(data?.cyclingLogs || []).reduce((s, c) => s + Number(c.distance_km), 0).toFixed(0)}km`,
      icon: Timer,
    },
    // INFRASTRUKTUR & CLOUD
    {
      id: 'coolify',
      label: 'Coolify Server',
      group: 'Infrastruktur & Cloud',
      badge: `${(data?.coolifyResources || []).filter((r) => r.status.startsWith('running')).length} UP`,
      icon: Cpu,
    },
    {
      id: 'maintenance',
      label: 'Hosting & Domain',
      group: 'Infrastruktur & Cloud',
      badge: String((data?.maintenance?.length || 0) + (data?.hostingDomains?.length || 0)),
      icon: Server,
    },
    {
      id: 'assets',
      label: 'Storage MinIO S3',
      group: 'Infrastruktur & Cloud',
      badge: `${data?.storageAssets?.length || 0} File`,
      icon: HardDrive,
    },
    {
      id: 'google',
      label: 'Google Workspace',
      group: 'Infrastruktur & Cloud',
      badge: String(data?.googleItems?.length || 0),
      icon: Cloud,
    },
    { id: 'database', label: 'Database & Log', group: 'Infrastruktur & Cloud', icon: Database },
  ];

  const navGroups = Array.from(new Set(navItems.map((n) => n.group)));

  const isDark = theme === 'dark';

  if (publicInvoiceId) {
    return <StandaloneCustomerInvoicePage invoiceId={publicInvoiceId} />;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-[#090a0f] text-slate-100' : 'bg-[#f2f3f7] text-slate-900'
      }`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-white shadow-xl shadow-orange-500/20"
          >
            <Check size={16} />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Official BUATIN.BIZ.ID Printable Receipt Modal */}
      <BuatinReceiptModal
        receipt={receiptModalData}
        onClose={() => setReceiptModalData(null)}
      />

      {/* Auto-Settlement Masuk Kas ke Dompet & Sync Postgres */}
      {settlementTarget && (
        <SettlementModal
          item={settlementTarget}
          wallets={data?.wallets || []}
          onClose={() => setSettlementTarget(null)}
          onConfirmSettlement={handleConfirmSettlement}
        />
      )}

      {/* Slide-Over Task Detail Drawer with Subtasks & Google Doc Creator */}
      <TaskDetailDrawer
        task={selectedTask}
        isDark={isDark}
        onClose={() => setSelectedTaskId(null)}
        onRefreshState={setData}
        showToast={showToast}
        setErrorMsg={setErrorMsg}
      />

      <div className="print-hide-dashboard flex min-h-screen w-full">
        {/* Desktop Collapsible Left Sidebar */}
        <aside
          className={`hidden md:flex sticky top-0 h-screen overflow-y-auto flex-col justify-between border-r transition-all duration-200 ${
            sidebarExpanded ? 'w-[270px] px-3.5' : 'w-20 px-3 items-center'
          } ${
            isDark ? 'border-white/[0.07] bg-[#0d1117]/95' : 'border-slate-200/80 bg-white/95'
          } py-5 shrink-0`}
        >
          <div className="space-y-5 w-full">
            <div className="flex items-center justify-between px-1">
              <a
                href="https://buatin.biz.id/"
                target="_blank"
                rel="noreferrer"
                title="Buka Website Resmi https://buatin.biz.id/"
                className="flex items-center gap-3 min-w-0 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md shadow-teal-500/20 border border-teal-500/30">
                  <img
                    src="/favicon.png"
                    alt="BUATIN Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                {sidebarExpanded && (
                  <div className="min-w-0 text-left">
                    <div className="truncate text-base font-extrabold tracking-tight group-hover:text-teal-400 transition">
                      BUATIN <span className="text-teal-400 font-bold">OS</span>
                    </div>
                    <div className="truncate text-[11px] font-medium text-slate-400">
                      buatin.biz.id • Command Center
                    </div>
                  </div>
                )}
              </a>
              {sidebarExpanded && (
                <button
                  onClick={() => setSidebarExpanded(false)}
                  title="Perkecil Sidebar"
                  className={`shrink-0 rounded-lg p-1.5 transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <PanelLeftClose size={17} />
                </button>
              )}
            </div>

            {/* Theme Pill Switcher */}
            <div
              className={`flex items-center ${
                sidebarExpanded
                  ? 'justify-between rounded-xl p-1'
                  : 'flex-col gap-1.5 rounded-2xl p-1.5'
              } ${
                isDark
                  ? 'bg-[#141923] border border-white/5'
                  : 'bg-slate-100 border border-slate-200/70'
              }`}
            >
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  !isDark
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                } ${sidebarExpanded ? 'flex-1' : 'w-9 h-9 px-0'}`}
              >
                <Sun size={15} />
                {sidebarExpanded && <span>Light</span>}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isDark
                    ? 'bg-[#1f2637] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                } ${sidebarExpanded ? 'flex-1' : 'w-9 h-9 px-0'}`}
              >
                <Moon size={15} />
                {sidebarExpanded && <span>Dark</span>}
              </button>
            </div>

            {/* Navigation Menu (Grouped) */}
            <div className="space-y-4">
              {navGroups.map((group) => (
              <div key={group} className="space-y-0.5">
              {sidebarExpanded ? (
                <div className="px-2.5 pb-1 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {group}
                </div>
              ) : (
                <div className={`mx-auto mb-1 h-px w-6 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
              )}
              {navItems.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    title={item.label}
                    className={`group flex w-full items-center text-left ${
                      sidebarExpanded ? 'justify-between px-3 py-2' : 'justify-center p-2.5'
                    } rounded-xl text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? isDark
                          ? 'bg-white text-slate-950 shadow-md font-semibold'
                          : 'bg-slate-900 text-white shadow-md font-semibold'
                        : isDark
                        ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                      <Icon size={16} className="shrink-0" />
                      {sidebarExpanded && (
                        <span className="truncate whitespace-nowrap text-left">{item.label}</span>
                      )}
                    </div>
                    {sidebarExpanded && item.badge && (
                      <span
                        className={`ml-2 shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none ${
                          active
                            ? isDark
                              ? 'bg-slate-900/15 text-slate-900'
                              : 'bg-white/20 text-white'
                            : isDark
                            ? 'bg-white/[0.06] text-slate-400'
                            : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 w-full">
            {!sidebarExpanded && (
              <button
                onClick={() => setSidebarExpanded(true)}
                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl border ${
                  isDark
                    ? 'border-white/10 bg-white/[0.02] text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <PanelLeftOpen size={17} />
              </button>
            )}

            <div
              className={`rounded-2xl border p-3 ${
                isDark ? 'border-white/[0.07] bg-[#121722]' : 'border-slate-200/80 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                  <HardDrive size={16} />
                </div>
                {sidebarExpanded && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="truncate text-xs font-semibold">
                        Postgres homedb + SQLite
                      </span>
                    </div>
                    <p className="truncate font-mono text-[11px] text-slate-400">
                      {data?.postgresStatus?.database || 'buatin_nexus_db'} •{' '}
                      {data?.postgresStatus?.host || 'Configured via ENV'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                onClick={(e) => e.stopPropagation()}
                className={`flex h-full w-72 flex-col justify-between p-5 ${
                  isDark ? 'bg-[#0d1117] text-slate-100' : 'bg-white text-slate-900'
                }`}
              >
                <div className="space-y-5 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 border border-teal-500/30">
                        <img src="/favicon.png" alt="BUATIN" className="h-full w-full object-contain" />
                      </div>
                      <span className="text-base font-extrabold tracking-tight">
                        BUATIN <span className="text-teal-400">OS</span>
                      </span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1.5">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {navGroups.map((group) => (
                    <div key={group} className="space-y-0.5">
                    <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {group}
                    </div>
                    {navItems.filter((n) => n.group === group).map((item) => {
                      const Icon = item.icon;
                      const active = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium ${
                            active
                              ? isDark
                                ? 'bg-white text-slate-950'
                                : 'bg-slate-900 text-white'
                              : isDark
                              ? 'text-slate-300 hover:bg-white/5'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={17} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && <span className="font-mono text-[11px]">{item.badge}</span>}
                        </button>
                      );
                    })}
                    </div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 text-[11px] text-slate-400 font-mono">Postgres homedb • buatin_nexus_db</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Header */}
          <header
            className={`sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 backdrop-blur-md md:px-8 ${
              isDark
                ? 'border-white/[0.06] bg-[#090a0f]/80'
                : 'border-slate-200/70 bg-[#f2f3f7]/85'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl border border-white/10 p-2 md:hidden"
              >
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>Nexus Workspace</span>
                <ChevronRight size={14} />
                <span className={isDark ? 'text-slate-100 font-semibold' : 'text-slate-900 font-semibold'}>
                  {navItems.find((n) => n.id === activeSection)?.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCmdPaletteOpen(true)}
                className={`flex items-center gap-3 rounded-full border px-3.5 py-2 text-xs transition-all ${
                  isDark
                    ? 'border-white/10 bg-[#131722] text-slate-300 hover:border-white/20'
                    : 'border-slate-200/90 bg-white text-slate-600 shadow-sm'
                }`}
              >
                <Search size={14} className="text-slate-400" />
                <span className="hidden sm:inline">Perintah cepat / Cari...</span>
                <kbd
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Ctrl+K
                </kbd>
              </button>

              <button
                onClick={() => setActiveSection('ai')}
                className="flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-3.5 py-2 text-xs font-semibold text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
              >
                <Bot size={14} />
                <span className="hidden sm:inline">Tanya AI / Telegram</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((p) => !p)}
                  className={`relative rounded-full border p-2 ${
                    isDark ? 'border-white/10 bg-[#131722]' : 'border-slate-200 bg-white shadow-sm'
                  }`}
                >
                  <Bell size={15} />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500" />
                </button>
                {notifOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-2xl z-50 text-xs ${
                      isDark ? 'border-white/10 bg-[#131722]' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="font-bold mb-2">Notifikasi Operasional</div>
                    <div className="space-y-2 text-[11px]">
                      <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-400">
                        {metrics.activeTasksCount} tugas kuliah UNPAM & proyek klien masih aktif.
                      </div>
                      <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                        Google Workspace ({data?.settings?.google_email || 'daerobii0223@gmail.com'}) terhubung.
                      </div>
                      <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400">
                        Pemakaian anggaran bulan ini: {metrics.spendingRatio}% dari limit.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Pill */}
              <div
                className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-2 pr-3.5 ${
                  isDark ? 'border-white/10 bg-[#131722]' : 'border-slate-200/90 bg-white shadow-sm'
                }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-xs font-bold text-white">
                  DR
                </div>
                <div className="hidden lg:block leading-tight">
                  <div className="text-xs font-bold">Daerobi</div>
                  <div className="text-[10px] text-slate-400">daerobi-devs • UNPAM</div>
                </div>
              </div>
            </div>
          </header>

          {errorMsg && (
            <div className="mx-5 mt-4 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400 md:mx-8">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="font-semibold underline">
                Tutup
              </button>
            </div>
          )}

          {/* Main Workspace Body */}
          <main className="w-full flex-1 px-4 py-5 md:px-6 md:py-6 space-y-6">
            {/* Greeting Row (Overview only) / Compact Page Title (other tabs) */}
            {activeSection !== 'overview' ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const current = navItems.find((n) => n.id === activeSection);
                  const CurIcon = current?.icon || LayoutGrid;
                  return (
                    <>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                          isDark ? 'border-white/10 bg-white/[0.03] text-teal-400' : 'border-slate-200 bg-white text-teal-600'
                        }`}
                      >
                        <CurIcon size={17} />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold tracking-tight">{current?.label}</h1>
                        <p className="text-[11px] text-slate-400">
                          {current?.group} • BUATIN OS
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Good morning, {data?.settings?.user_name || 'Daerobi'}
                </h1>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  PostgreSQL homedb (buatin_nexus_db) & SQLite aktif • Terhubung dengan AI Assistant, Telegram Bot & Google Workspace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openTransactionModal('income')}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/20"
                >
                  <Plus size={14} />
                  <span>Catat Kas</span>
                </button>
                <button
                  onClick={() => setTransferModalOpen(true)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-xs font-medium ${
                    isDark
                      ? 'border-white/10 bg-[#131722] text-slate-200'
                      : 'border-slate-200 bg-white text-slate-700 shadow-sm'
                  }`}
                >
                  <ArrowLeftRight size={14} />
                  <span>Transfer Dompet</span>
                </button>
                <button
                  onClick={() => setTaskModalOpen(true)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-xs font-medium ${
                    isDark
                      ? 'border-white/10 bg-[#131722] text-slate-200'
                      : 'border-slate-200 bg-white text-slate-700 shadow-sm'
                  }`}
                >
                  <Plus size={14} />
                  <span>Tugas Baru</span>
                </button>
              </div>
            </div>
            )}

            {!loading && data && (
              <>
                {/* SECTION: WEEKLY UNIFIED CALENDAR & AGENDA (KULIAH UNPAM + JOKI + PROYEK + DOMAIN) */}
                {activeSection === 'calendar' && (
                  <WeeklyUnifiedCalendarView
                    courses={data.academicCourses || []}
                    jokiOrders={data.jokiOrders || []}
                    tasks={data.tasks || []}
                    domains={data.hostingDomains || []}
                    onNavigateSection={(sec) => setActiveSection(sec)}
                  />
                )}

                {/* SECTION: ORDER JOKI TUGAS & PROYEK + TELEGRAM DEADLINE ALERT */}
                {activeSection === 'joki' && (
                  <div className="space-y-6">
                    <SubTabBar
                      isDark={isDark}
                      active={jokiTab}
                      onChange={setJokiTab}
                      tabs={[
                        { id: 'orders', label: 'Daftar Order Joki', icon: Sparkles, count: (data.jokiOrders || []).length },
                        { id: 'qris', label: 'Pengaturan QRIS & Pembayaran', icon: SlidersHorizontal },
                      ]}
                    />
                    {jokiTab === 'qris' && (
                      <QrisDynamicGeneratorPanel
                        initialStaticPayload={data?.settings?.qris_static_payload}
                        initialWaNumber={data?.settings?.buatin_whatsapp}
                        onSettingUpdate={handleUpdateSetting}
                      />
                    )}
                    {jokiTab === 'orders' && (
                    <JokiManagementView
                      orders={data.jokiOrders || []}
                      upcomingDeadlines={data.upcomingDeadlines || []}
                      autoAlertEnabled={data.settings?.telegram_auto_deadline_alert === 'true'}
                      onCreateOrder={handleCreateJokiOrder}
                      onUpdateOrder={handleUpdateJokiOrder}
                      onMarkPaid={handleMarkJokiPaid}
                      onDeleteOrder={handleDeleteJokiOrder}
                      onSendTelegramDeadlineAlert={handleSendTelegramDeadlineAlert}
                      onToggleAutoAlert={handleToggleAutoDeadlineAlert}
                      onOpenSettlement={(item) => setSettlementTarget(item)}
                      onOpenDealCloser={() => {
                        setDealCloserInitialTopic('');
                        setDealCloserOpen(true);
                      }}
                    />
                    )}
                  </div>
                )}

                {/* SECTION: BUSINESS CRM & DEAL PIPELINE */}
                {activeSection === 'crm' && (
                  <CrmPipelineView
                    clients={data.crmClients || []}
                    deals={data.crmDeals || []}
                    onCreateClient={handleCreateCrmClient}
                    onUpdateClient={handleUpdateCrmClient}
                    onDeleteClient={handleDeleteCrmClient}
                    onCreateDeal={handleCreateCrmDeal}
                    onUpdateDealStage={handleUpdateDealStage}
                    onConvertDeal={handleConvertDeal}
                    onDeleteDeal={handleDeleteCrmDeal}
                    onOpenDealCloser={() => {
                      setDealCloserInitialTopic('');
                      setDealCloserOpen(true);
                    }}
                  />
                )}

                {/* SECTION: ACADEMIC HUB UNPAM SEMESTER 5 */}
                {activeSection === 'academic' && (
                  <AcademicUnpamView
                    courses={data.academicCourses || []}
                    tasks={data.tasks || []}
                    mentariSync={data.mentariSync || null}
                    unpamBilling={data.unpamBilling || null}
                    onIncrementAttendance={handleIncrementCourseAttendance}
                    onCreateCourse={handleCreateAcademicCourse}
                    onUpdateCourse={handleUpdateAcademicCourse}
                    onDeleteCourse={handleDeleteAcademicCourse}
                    onOpenNewTaskModal={() => {
                      setTaskForm((prev) => ({ ...prev, scope: 'kuliah' }));
                      setTaskModalOpen(true);
                    }}
                  />
                )}

                {/* SECTION: PERSONAL OS (HABITS, CYCLING & OKRs) */}
                {activeSection === 'personal' && (
                  <PersonalOsView
                    habits={data.personalHabits || []}
                    goals={data.personalGoals || []}
                    onToggleHabit={handleTogglePersonalHabit}
                    onCreateHabit={handleCreatePersonalHabit}
                    onUpdateGoalProgress={handleUpdatePersonalGoalProgress}
                  />
                )}

                {/* SECTION: COOLIFY HOME SERVER LIVE CONTROL CENTER */}
                {activeSection === 'coolify' && (
                  <CoolifyControlView
                    resources={data.coolifyResources || []}
                    lastSync={data.settings?.coolify_last_sync || 'Baru saja'}
                    onSyncCoolify={handleSyncCoolify}
                    onTriggerAction={handleCoolifyAction}
                    onCreateResource={handleCreateCoolifyResource}
                  />
                )}

                {/* SECTION: SMART DOCUMENT GENERATOR (.DOCX UNPAM & BUSINESS MOU) */}
                {activeSection === 'documents' && (
                  <SmartDocGeneratorView
                    documents={data.generatedDocuments || []}
                    deals={data.crmDeals || []}
                    courses={data.academicCourses || []}
                    onCreateDocument={handleCreateSmartDocument}
                    onDeleteDocument={handleDeleteSmartDocument}
                  />
                )}

                {/* SECTION: DEEP WORK POMODORO TIMER & CYCLING LOG TRACKER */}
                {activeSection === 'focus' && (
                  <FocusAndCyclingView
                    focusSessions={data.focusSessions || []}
                    cyclingLogs={data.cyclingLogs || []}
                    onCreateFocus={handleCreateFocusSession}
                    onDeleteFocus={handleDeleteFocusSession}
                    onCreateCycling={handleCreateCyclingLog}
                    onDeleteCycling={handleDeleteCyclingLog}
                  />
                )}

                {/* SECTION: AI & TELEGRAM BOTFATHER */}
                {activeSection === 'ai' && (
                  <AiAndTelegramView
                    data={data}
                    isDark={isDark}
                    onRefreshState={setData}
                    showToast={showToast}
                    setErrorMsg={setErrorMsg}
                  />
                )}

                {/* SECTION: GOOGLE WORKSPACE LIVE SYNC */}
                {activeSection === 'google' && (
                  <GoogleWorkspaceView
                    data={data}
                    isDark={isDark}
                    onRefreshState={setData}
                    showToast={showToast}
                    setErrorMsg={setErrorMsg}
                  />
                )}

                {/* SECTION: MINIO S3 ASSET STORAGE & AUTO-COMPRESSION */}
                {activeSection === 'assets' && (
                  <StorageAssetsView
                    assets={data.storageAssets || []}
                    stats={data.storageStats}
                    onRefresh={fetchState}
                    showToast={showToast}
                  />
                )}

                {/* SECTION: OVERVIEW (VERTIX BENTO GRID) */}
                {activeSection === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                      {/* BENTO COL 1: Total Balance + Transfer/Request + 3 Wallets */}
                      <motion.div
                        whileHover={{ y: -3 }}
                        className={`xl:col-span-4 flex flex-col justify-between rounded-3xl border p-6 ${
                          isDark
                            ? 'border-white/[0.07] bg-[#121621]'
                            : 'border-slate-200/80 bg-white shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-400">Total Balance</span>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <span className="h-2 w-2 rounded-full bg-orange-500" />
                              IDR
                            </span>
                          </div>

                          <div className="mt-3 font-mono text-3xl font-bold tracking-tight tabular-nums">
                            {formatIDR(metrics.totalBalance)}
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-500">
                              <ArrowUpRight size={14} /> 14.2%
                            </span>
                            <span className="text-slate-400">dari bulan lalu</span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setTransferModalOpen(true)}
                              className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold transition-all ${
                                isDark ? 'bg-white text-slate-950' : 'bg-slate-900 text-white'
                              }`}
                            >
                              <ArrowLeftRight size={14} />
                              <span>Transfer</span>
                            </button>
                            <button
                              onClick={() => openTransactionModal('income')}
                              className={`flex items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-semibold ${
                                isDark
                                  ? 'border-white/10 bg-white/[0.04] text-slate-200'
                                  : 'border-slate-200 bg-slate-100 text-slate-700'
                              }`}
                            >
                              <Plus size={14} />
                              <span>Catat Kas</span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-500/10">
                          <div className="mb-3 flex items-center justify-between text-xs">
                            <span className="font-semibold">Wallets ({data.wallets.length})</span>
                            <button
                              onClick={() => setWalletModalOpen(true)}
                              className="text-orange-500 font-semibold hover:underline"
                            >
                              + Tambah Rekening
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            {data.wallets.slice(0, 3).map((w) => (
                              <div
                                key={w.id}
                                className={`rounded-2xl border p-3 ${
                                  isDark
                                    ? 'border-white/[0.06] bg-[#171c29]'
                                    : 'border-slate-200/70 bg-slate-50/80'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-[10px] font-bold text-orange-500">
                                    {w.bank_code.slice(0, 2)}
                                  </span>
                                  <span className="font-mono text-[10px] font-semibold text-slate-400">
                                    {w.bank_code}
                                  </span>
                                </div>
                                <div className="mt-2.5 truncate font-mono text-xs font-bold tabular-nums">
                                  {formatIDR(w.balance)}
                                </div>
                                <div className="mt-0.5 truncate text-[10px] text-slate-400">{w.name}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      {/* BENTO COL 2: 2x2 KPI Cards */}
                      <div className="xl:col-span-4 grid grid-cols-2 gap-4">
                        <motion.div
                          whileHover={{ y: -4 }}
                          className="rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-5 text-white shadow-lg shadow-orange-500/20 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/90">Total Earnings</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                              <WalletIcon size={14} />
                            </span>
                          </div>
                          <div className="my-4 font-mono text-xl sm:text-2xl font-bold tracking-tight tabular-nums">
                            {formatIDR(metrics.totalIncome)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="rounded-full bg-white/20 px-2 py-0.5 font-semibold">+18%</span>
                            <span className="text-white/80">Bulan ini</span>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ y: -4 }}
                          className={`rounded-3xl border p-5 flex flex-col justify-between ${
                            isDark
                              ? 'border-white/[0.07] bg-[#121621]'
                              : 'border-slate-200/80 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400">Total Spending</span>
                            <ArrowDownRight size={15} className="text-rose-500" />
                          </div>
                          <div className="my-4 font-mono text-xl sm:text-2xl font-bold tracking-tight tabular-nums">
                            {formatIDR(metrics.totalExpense)}
                          </div>
                          <div className="text-xs text-rose-400 font-semibold">
                            {metrics.spendingRatio}% dari limit
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ y: -4 }}
                          onClick={() => setActiveSection('tasks')}
                          className={`cursor-pointer rounded-3xl border p-5 flex flex-col justify-between ${
                            isDark
                              ? 'border-white/[0.07] bg-[#121621]'
                              : 'border-slate-200/80 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400">Tugas & Proyek</span>
                            <FolderKanban size={15} className="text-orange-500" />
                          </div>
                          <div className="my-4 font-mono text-2xl font-bold tabular-nums">
                            {metrics.activeTasksCount} Aktif
                          </div>
                          <div className="text-xs text-emerald-500 font-semibold">
                            {metrics.klienTasksCount} Klien • {metrics.kuliahTasksCount} UNPAM
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ y: -4 }}
                          onClick={() => setActiveSection('google')}
                          className={`cursor-pointer rounded-3xl border p-5 flex flex-col justify-between ${
                            isDark
                              ? 'border-white/[0.07] bg-[#121621]'
                              : 'border-slate-200/80 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400">Google Workspace</span>
                            <Cloud size={15} className="text-sky-400" />
                          </div>
                          <div className="my-4 font-mono text-xl font-bold tabular-nums">
                            {data.googleItems.length} Item
                          </div>
                          <div className="text-xs text-sky-400 font-semibold truncate">
                            Drive & Gmail Synced
                          </div>
                        </motion.div>
                      </div>

                      {/* BENTO COL 3: Profit & Loss Chart */}
                      <motion.div
                        whileHover={{ y: -3 }}
                        className={`xl:col-span-4 flex flex-col justify-between rounded-3xl border p-6 ${
                          isDark
                            ? 'border-white/[0.07] bg-[#121621]'
                            : 'border-slate-200/80 bg-white shadow-sm'
                        }`}
                      >
                        <div>
                          <h3 className="text-base font-bold">Total Income</h3>
                          <p className="text-xs text-slate-400">Profit & Loss 6 bulan terakhir</p>
                        </div>
                        <div className="mt-6 grid grid-cols-6 items-end gap-3 pt-4 h-48">
                          {data.cashflowSeries.map((item) => {
                            const maxVal = 16000000;
                            const incH = Math.max(18, Math.min(100, Math.round((item.income / maxVal) * 100)));
                            const expH = Math.max(12, Math.min(100, Math.round((item.expense / maxVal) * 100)));
                            return (
                              <div
                                key={item.month}
                                className="group flex flex-col items-center gap-1.5 h-full justify-end"
                              >
                                <div className="relative flex w-full flex-col items-center justify-end gap-1 h-36">
                                  <div
                                    style={{ height: `${incH}%` }}
                                    className="w-full max-w-[30px] rounded-xl bg-gradient-to-t from-orange-600 to-orange-400"
                                  />
                                  <div
                                    style={{ height: `${expH}%` }}
                                    className={`w-full max-w-[30px] rounded-xl ${
                                      isDark ? 'bg-slate-700' : 'bg-slate-900'
                                    }`}
                                  />
                                </div>
                                <span className="font-mono text-[11px] text-slate-400">{item.month}</span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    </div>

                    {/* UNIFIED 3-PILLAR STRIP: BISNIS CRM • KULIAH UNPAM • PERSONAL HABIT OS */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div
                        onClick={() => setActiveSection('crm')}
                        className={`cursor-pointer rounded-3xl border p-5 transition hover:-translate-y-0.5 ${
                          isDark
                            ? 'border-white/[0.07] bg-[#121621] hover:border-emerald-500/40'
                            : 'border-slate-200/80 bg-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                            Pilar Bisnis • CRM & Deal Pipeline
                          </span>
                          <Briefcase size={16} className="text-emerald-400" />
                        </div>
                        <p className="mt-2 font-mono text-xl font-bold">
                          {formatIDR(
                            (data.crmDeals || [])
                              .filter((d) => d.stage !== 'Won')
                              .reduce((s, d) => s + Number(d.value), 0)
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {(data.crmDeals || []).length} Deal Prospek • {(data.crmClients || []).length} Klien Terdaftar
                        </p>
                      </div>

                      <div
                        onClick={() => setActiveSection('academic')}
                        className={`cursor-pointer rounded-3xl border p-5 transition hover:-translate-y-0.5 ${
                          isDark
                            ? 'border-white/[0.07] bg-[#121621] hover:border-sky-500/40'
                            : 'border-slate-200/80 bg-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                            Pilar Kuliah • UNPAM Semester 5
                          </span>
                          <GraduationCap size={16} className="text-sky-400" />
                        </div>
                        <p className="mt-2 font-mono text-xl font-bold">
                          {(data.academicCourses || []).reduce((s, c) => s + Number(c.sks), 0)} SKS •{' '}
                          {(data.academicCourses || []).length} Matkul
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Klik untuk cek jadwal, nilai UTS/Tugas & +1 Presensi Hadir
                        </p>
                      </div>

                      <div
                        onClick={() => setActiveSection('personal')}
                        className={`cursor-pointer rounded-3xl border p-5 transition hover:-translate-y-0.5 ${
                          isDark
                            ? 'border-white/[0.07] bg-[#121621] hover:border-amber-500/40'
                            : 'border-slate-200/80 bg-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                            Pilar Pribadi • Habit, Cycling & OKR
                          </span>
                          <Target size={16} className="text-amber-400" />
                        </div>
                        <p className="mt-2 font-mono text-xl font-bold">
                          {(data.personalHabits || []).filter((h) => h.completed_today).length} /{' '}
                          {(data.personalHabits || []).length} Habit Selesai
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Streak tertinggi:{' '}
                          {(data.personalHabits || []).reduce(
                            (m, h) => Math.max(m, Number(h.current_streak)),
                            0
                          )}{' '}
                          hari beruntun
                        </p>
                      </div>
                    </div>

                    {/* BOTTOM ROW: Spending Limit + Recent Activities */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                      <div className="xl:col-span-4 flex flex-col gap-6">
                        <div
                          className={`rounded-3xl border p-6 ${
                            isDark
                              ? 'border-white/[0.07] bg-[#121621]'
                              : 'border-slate-200/80 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold">Monthly Spending Limit</h3>
                            <button
                              onClick={() => setLimitModalOpen(true)}
                              className="text-xs font-semibold text-orange-500 hover:underline"
                            >
                              Atur Batas
                            </button>
                          </div>
                          <div
                            className={`mt-5 h-3 w-full overflow-hidden rounded-full ${
                              isDark ? 'bg-white/10' : 'bg-slate-100'
                            }`}
                          >
                            <div
                              style={{ width: `${metrics.spendingRatio}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between font-mono text-xs tabular-nums">
                            <span className="font-bold">{formatIDR(metrics.totalExpense)}</span>
                            <span className="text-slate-400">{formatIDR(metrics.spendingLimit)}</span>
                          </div>
                        </div>

                        <div
                          className={`flex-1 rounded-3xl border p-6 ${
                            isDark
                              ? 'border-white/[0.07] bg-[#121621]'
                              : 'border-slate-200/80 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold">Tugas Prioritas (Klik untuk Sub-Task)</h3>
                            <button
                              onClick={() => setActiveSection('tasks')}
                              className="text-xs font-semibold text-orange-500 hover:underline"
                            >
                              Buka Kanban
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {data.tasks
                              .filter((t) => t.status !== 'done')
                              .slice(0, 3)
                              .map((task) => (
                                <div
                                  key={task.id}
                                  onClick={() => setSelectedTaskId(task.id)}
                                  className={`cursor-pointer flex items-center justify-between gap-3 rounded-2xl border p-3 ${
                                    isDark
                                      ? 'border-white/[0.05] bg-[#171c29] hover:border-orange-500/40'
                                      : 'border-slate-200/60 bg-slate-50/70'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold">{task.title}</div>
                                    <div className="text-[11px] text-slate-400">
                                      {task.subject_or_client} • {(task.subtasks || []).length} sub-tugas
                                    </div>
                                  </div>
                                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`xl:col-span-8 rounded-3xl border p-6 ${
                          isDark
                            ? 'border-white/[0.07] bg-[#121621]'
                            : 'border-slate-200/80 bg-white shadow-sm'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-base font-bold">Recent Activities</h3>
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                                isDark ? 'border-white/10 bg-[#171c29]' : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <Search size={13} className="text-slate-400" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari transaksi..."
                                className="w-36 bg-transparent text-xs focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full min-w-[640px] text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-500/10 text-[11px] font-semibold uppercase text-slate-400">
                                <th className="pb-3 pr-3">Order ID</th>
                                <th className="pb-3 px-3">Activity</th>
                                <th className="pb-3 px-3">Price</th>
                                <th className="pb-3 px-3">Status</th>
                                <th className="pb-3 pl-3 text-right">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-500/10">
                              {filteredTransactions.slice(0, 7).map((tx) => (
                                <tr key={tx.id} className="group">
                                  <td className="py-3 pr-3 font-mono font-semibold text-slate-400">
                                    {tx.code}
                                  </td>
                                  <td className="py-3 px-3 font-semibold">{tx.title}</td>
                                  <td
                                    className={`py-3 px-3 font-mono font-bold tabular-nums ${
                                      tx.type === 'income' ? 'text-emerald-500' : ''
                                    }`}
                                  >
                                    {tx.type === 'income' ? '+' : '-'}
                                    {formatIDR(tx.amount)}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                      {tx.status}
                                    </span>
                                  </td>
                                  <td className="py-3 pl-3 text-right font-mono text-[11px] text-slate-400">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span>{tx.created_at}</span>
                                      <button
                                        onClick={() => openEditTransactionModal(tx)}
                                        title="Edit Transaksi"
                                        className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransaction(tx.id)}
                                        title="Hapus Transaksi"
                                        className="rounded p-1 text-rose-400 hover:bg-rose-500/15"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION: TUGAS KULIAH & KANBAN PROYEK (With Auto-Priority & Subtasks Drawer) */}
                {activeSection === 'tasks' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {(['all', 'klien', 'kuliah'] as const).map((scope) => (
                          <button
                            key={scope}
                            onClick={() => setTaskScopeFilter(scope)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold ${
                              taskScopeFilter === scope
                                ? 'bg-orange-500 text-white'
                                : isDark
                                ? 'bg-[#121621] text-slate-300 border border-white/10'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                            {scope === 'all'
                              ? 'Semua Tugas'
                              : scope === 'klien'
                              ? 'Proyek Klien (daerobi-devs)'
                              : 'Tugas Kuliah (UNPAM)'}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAutoPriority}
                          className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-500"
                        >
                          <Sparkles size={14} />
                          <span>Urutkan Prioritas Otomatis</span>
                        </button>
                        <button
                          onClick={() => setTaskModalOpen(true)}
                          className="flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white"
                        >
                          <Plus size={14} />
                          <span>Tambah Tugas</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                      {(
                        [
                          { id: 'todo', title: 'To Do / Antrean' },
                          { id: 'in_progress', title: 'In Progress' },
                          { id: 'review', title: 'Review / UAT' },
                          { id: 'done', title: 'Selesai (Done)' },
                        ] as const
                      ).map((col) => {
                        const colTasks = filteredTasks.filter((t) => t.status === col.id);
                        return (
                          <div
                            key={col.id}
                            className={`flex flex-col rounded-3xl border p-4 ${
                              isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white'
                            }`}
                          >
                            <div className="mb-4 flex items-center justify-between px-1">
                              <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
                              <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-orange-500">
                                {colTasks.length}
                              </span>
                            </div>

                            <div className="space-y-3 flex-1">
                              {colTasks.map((task) => {
                                const doneSubs = (task.subtasks || []).filter((s) => s.is_done).length;
                                const totalSubs = (task.subtasks || []).length;
                                return (
                                  <motion.div
                                    key={task.id}
                                    layout
                                    whileHover={{ y: -2 }}
                                    onClick={() => setSelectedTaskId(task.id)}
                                    className={`cursor-pointer rounded-2xl border p-4 ${
                                      isDark
                                        ? 'border-white/[0.06] bg-[#171c29] hover:border-orange-500/40'
                                        : 'border-slate-200/80 bg-white shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                          task.scope === 'kuliah'
                                            ? 'bg-indigo-500/15 text-indigo-400'
                                            : 'bg-orange-500/15 text-orange-500'
                                        }`}
                                      >
                                        {task.scope === 'kuliah' ? (
                                          <GraduationCap size={11} />
                                        ) : (
                                          <FolderKanban size={11} />
                                        )}
                                        {task.scope}
                                      </span>
                                      <span
                                        className={`font-mono text-[10px] font-semibold uppercase ${
                                          task.priority === 'high'
                                            ? 'text-rose-400'
                                            : task.priority === 'medium'
                                            ? 'text-amber-400'
                                            : 'text-emerald-400'
                                        }`}
                                      >
                                        {task.priority}
                                      </span>
                                    </div>

                                    <h4 className="mt-2.5 text-sm font-bold leading-snug">{task.title}</h4>
                                    <p className="mt-1 text-xs text-slate-400">{task.subject_or_client}</p>

                                    {totalSubs > 0 && (
                                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                                        <span>Checklist Sub-task</span>
                                        <span>
                                          {doneSubs}/{totalSubs}
                                        </span>
                                      </div>
                                    )}

                                    <div
                                      className="mt-3 flex items-center justify-between gap-1.5 pt-2 border-t border-slate-500/10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <select
                                        value={task.status}
                                        onChange={(e) =>
                                          handleUpdateTaskStatus(task.id, e.target.value as TaskItem['status'])
                                        }
                                        className={`flex-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${
                                          isDark
                                            ? 'border-white/10 bg-[#121621] text-slate-200'
                                            : 'border-slate-200 bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="done">Done</option>
                                      </select>
                                      <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION: MAINTENANCE TRACKER + LIVE HTTP PING + HOSTING/DOMAIN MANAGER */}
                {activeSection === 'maintenance' && (
                  <div className="space-y-6">
                    <SubTabBar
                      isDark={isDark}
                      active={maintTab}
                      onChange={setMaintTab}
                      tabs={[
                        { id: 'uptime', label: 'Monitoring Uptime Server', icon: Activity, count: data.maintenance.length },
                        { id: 'domain', label: 'Domain & Akun Hosting', icon: Cloud, count: (data.hostingDomains || []).length },
                        { id: 'vault', label: 'Project Vault & Kredensial', icon: ShieldCheck, count: (data.projectVault || []).length },
                      ]}
                    />
                    {maintTab === 'uptime' && (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold">
                            Maintenance Server, Live HTTP Ping & Akun Hosting/Domain
                          </h2>
                          <p className="text-xs text-slate-400">
                            Uji latensi respons server klien, kelola akun Rumahweb / Cloudflare, dan pantau masa aktif domain
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePingServer()}
                            disabled={pingingServerId !== null}
                            className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400"
                          >
                            <Activity size={14} className={pingingServerId ? 'animate-spin' : ''} />
                            <span>
                              {pingingServerId ? 'Menguji Ping...' : 'Test Ping Semua Server'}
                            </span>
                          </button>
                          <button
                            onClick={() => setMaintModalOpen(true)}
                            className="flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white"
                          >
                            <Plus size={14} />
                            <span>Tambah Server Monitor</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {data.maintenance.map((srv) => (
                          <div
                            key={srv.id}
                            className={`rounded-3xl border p-6 ${
                              isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="text-base font-bold">{srv.app_name}</h3>
                                <p className="text-xs text-slate-400 truncate">
                                  {srv.client_name} • <span className="font-mono">{srv.url}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleCycleMaintenanceStatus(srv.id, srv.status)}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    srv.status === 'Healthy'
                                      ? 'bg-emerald-500/15 text-emerald-500'
                                      : srv.status === 'Maintenance'
                                      ? 'bg-amber-500/15 text-amber-400'
                                      : 'bg-rose-500/15 text-rose-400'
                                  }`}
                                >
                                  {srv.status}
                                </button>
                                <button
                                  onClick={() => handleDeleteMaintenance(srv.id)}
                                  title="Hapus Server dari Maintenance"
                                  className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-4 gap-2 border-t border-slate-500/10 pt-4 text-xs">
                              <div>
                                <div className="text-slate-400">Ping Latency</div>
                                <div className="mt-1 font-mono font-bold text-emerald-400">
                                  {srv.last_ping_ms || 18} ms
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-400">Uptime SLA</div>
                                <div className="mt-1 font-mono font-bold">{srv.uptime_percent}%</div>
                              </div>
                              <div>
                                <div className="text-slate-400">Retainer / bln</div>
                                <div className="mt-1 font-mono font-bold">{formatIDR(srv.monthly_fee)}</div>
                              </div>
                              <div className="text-right flex items-center justify-end gap-1.5">
                                <a
                                  href={srv.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 rounded-lg border border-white/10 p-1.5 text-slate-300 hover:text-white"
                                  title="Buka URL"
                                >
                                  <ExternalLink size={13} />
                                </a>
                                <button
                                  onClick={() => handlePingServer(srv.id)}
                                  className="mt-2 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-semibold hover:bg-orange-500 hover:text-white"
                                >
                                  Ping URL
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* FLEXIBLE HOSTING, DOMAIN & PROVIDER ACCOUNT MANAGER (RUMAHWEB, CLOUDFLARE, CPANEL, VPS) */}
                    {maintTab === 'domain' && (
                      <HostingAndDomainSection
                        domains={data.hostingDomains || []}
                        onCreateDomain={handleCreateHostingDomain}
                        onUpdateDomain={handleUpdateHostingDomain}
                        onDeleteDomain={handleDeleteHostingDomain}
                      />
                    )}

                    {/* PROJECT VAULT: PORTFOLIO, GITHUB REPO, DEMO CREDENTIALS & .ENV */}
                    {maintTab === 'vault' && (
                      <ProjectVaultSection
                        items={data.projectVault || []}
                        onCreateVault={handleCreateVault}
                        onUpdateVault={handleUpdateVault}
                        onDeleteVault={handleDeleteVault}
                      />
                    )}
                  </div>
                )}

                {/* SECTION: FINANCE, WALLETS & INVOICE RAB GENERATOR */}
                {activeSection === 'finance' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-bold">Rekening Operasional, Buku Kas & Invoice RAB Klien</h2>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openTransactionModal('income')}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400"
                        >
                          + Catat Transaksi Kas
                        </button>
                        <button
                          onClick={() => setWalletModalOpen(true)}
                          className="rounded-full border border-white/10 px-3.5 py-2 text-xs font-semibold"
                        >
                          + Rekening Baru
                        </button>
                        <button
                          onClick={() => setTransferModalOpen(true)}
                          className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-2 text-xs font-semibold text-orange-500"
                        >
                          Transfer Antar Dompet
                        </button>
                        <button
                          onClick={() => setInvoiceModalOpen(true)}
                          className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white"
                        >
                          + Buat Invoice RAB Klien
                        </button>
                      </div>
                    </div>

                    <SubTabBar
                      isDark={isDark}
                      active={financeTab}
                      onChange={setFinanceTab}
                      tabs={[
                        { id: 'kas', label: 'Buku Kas & Rekening', icon: WalletIcon, count: data.transactions.length },
                        { id: 'invoice', label: 'Invoice & RAB Klien', icon: Receipt, count: data.invoices.length },
                        { id: 'qris', label: 'Pengaturan QRIS & Pembayaran', icon: SlidersHorizontal },
                      ]}
                    />

                    {/* Wallets Grid */}
                    {financeTab === 'kas' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {data.wallets.map((w) => (
                        <div
                          key={w.id}
                          className={`rounded-3xl border p-5 ${
                            isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-lg bg-orange-500/15 px-2.5 py-1 font-mono text-xs font-bold text-orange-500">
                              {w.bank_code}
                            </span>
                            <span className="font-mono text-xs text-slate-400">{w.account_number}</span>
                          </div>
                          <div className="mt-4 font-mono text-2xl font-bold tabular-nums">
                            {formatIDR(w.balance)}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">{w.name}</div>
                        </div>
                      ))}
                    </div>
                    )}

                    {/* QRIS STATIS -> DINAMIS CONVERTER (GOPAY / ALL QRIS) */}
                    {financeTab === 'qris' && (
                      <QrisDynamicGeneratorPanel
                        initialStaticPayload={data?.settings?.qris_static_payload}
                        initialWaNumber={data?.settings?.buatin_whatsapp}
                        onSettingUpdate={handleUpdateSetting}
                      />
                    )}

                    {/* Invoices & RAB Section */}
                    {financeTab === 'invoice' && (
                    <div
                      className={`rounded-3xl border p-6 ${
                        isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Receipt size={18} className="text-orange-500" />
                          <h3 className="text-base font-bold">
                            Daftar Invoice & RAB Proyek Klien (Berlogo Resmi BUATIN)
                          </h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {data.invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className={`rounded-2xl border p-4 text-xs ${
                              isDark ? 'border-white/[0.06] bg-[#171c29]' : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-orange-500">
                                {inv.invoice_number}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  inv.status === 'Paid'
                                    ? 'bg-emerald-500/15 text-emerald-500'
                                    : 'bg-amber-500/15 text-amber-400'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>
                            <div className="mt-2 text-sm font-bold">{inv.project_title}</div>
                            <div className="text-slate-400">{inv.client_name}</div>
                            <div className="mt-3 space-y-1 border-t border-slate-500/10 pt-2">
                              {(inv.items || []).map((it, idx) => (
                                <div key={idx} className="flex justify-between text-[11px] text-slate-400">
                                  <span>• {it.desc}</span>
                                  <span className="font-mono">{formatIDR(it.price)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-500/10 pt-3">
                              <span className="font-mono text-sm font-bold">
                                Total: {formatIDR(inv.total_amount)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    setReceiptModalData({
                                      invoiceId: inv.id,
                                      receiptNumber: inv.invoice_number,
                                      clientName: inv.client_name,
                                      originOrCompany: inv.client_name,
                                      title: inv.project_title,
                                      category: 'Pengembangan Sistem & Web (BUATIN)',
                                      totalAmount: inv.total_amount,
                                      paidAmount: inv.status === 'Paid' ? inv.total_amount : 0,
                                      paymentStatus: inv.status === 'Paid' ? 'Lunas' : 'Tagihan Aktif',
                                      dateStr: inv.created_at || '2026-11-10',
                                      deadlineOrDue: inv.due_date,
                                      items: inv.items,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition"
                                >
                                  <Printer size={12} /> Cetak Kwitansi BUATIN
                                </button>
                                {inv.status !== 'Paid' && (
                                  <button
                                    onClick={() =>
                                      setSettlementTarget({
                                        id: inv.id,
                                        title: `${inv.invoice_number} - ${inv.project_title}`,
                                        clientName: inv.client_name,
                                        totalAmount: inv.total_amount,
                                        paidAmount: 0,
                                        type: 'invoice',
                                      })
                                    }
                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400 transition"
                                  >
                                    <CheckCircle2 size={12} /> Pilih Dompet & Lunaskan
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Full Buku Kas & Riwayat Transaksi (With Edit, Delete, Filter & Pagination) */}
                    {financeTab === 'kas' && (
                    <div
                      className={`rounded-3xl border p-6 space-y-4 ${
                        isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold">
                            Buku Kas Lengkap & Koreksi Transaksi (Edit / Hapus)
                          </h3>
                          <p className="text-xs text-slate-400">
                            Setiap perubahan nominal atau penghapusan transaksi otomatis mengoreksi saldo dompet terkait.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={txCategoryFilter}
                            onChange={(e) => {
                              setTxCategoryFilter(e.target.value);
                              setTxPage(1);
                            }}
                            className={`rounded-xl border px-3 py-1.5 text-xs ${
                              isDark
                                ? 'border-white/10 bg-[#171c29] text-slate-200'
                                : 'border-slate-200 bg-slate-50 text-slate-800'
                            }`}
                          >
                            <option value="ALL">Semua Kategori</option>
                            <option value="Proyek Klien">Proyek Klien</option>
                            <option value="Order Joki">Order Joki</option>
                            <option value="Operasional Server">Operasional Server</option>
                            <option value="Kuliah UNPAM">Kuliah UNPAM</option>
                            <option value="Kebutuhan Pribadi">Kebutuhan Pribadi</option>
                            <option value="Transfer Internal">Transfer Internal</option>
                          </select>
                          <div
                            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
                              isDark ? 'border-white/10 bg-[#171c29]' : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <Search size={13} className="text-slate-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setTxPage(1);
                              }}
                              placeholder="Cari judul / kode transaksi..."
                              className="w-44 bg-transparent text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-500/10 text-[11px] font-semibold uppercase text-slate-400">
                              <th className="pb-3 pr-3">Kode</th>
                              <th className="pb-3 px-3">Judul Transaksi</th>
                              <th className="pb-3 px-3">Kategori & Dompet</th>
                              <th className="pb-3 px-3">Nominal (IDR)</th>
                              <th className="pb-3 px-3">Waktu</th>
                              <th className="pb-3 pl-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-500/10">
                            {filteredTransactions
                              .slice((txPage - 1) * txPageSize, txPage * txPageSize)
                              .map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/[0.02]">
                                  <td className="py-3 pr-3 font-mono text-slate-400">{tx.code}</td>
                                  <td className="py-3 px-3 font-semibold">{tx.title}</td>
                                  <td className="py-3 px-3">
                                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px]">
                                      {tx.category}
                                    </span>{' '}
                                    <span className="font-mono text-[10px] text-slate-400">
                                      ({tx.wallet_id})
                                    </span>
                                  </td>
                                  <td
                                    className={`py-3 px-3 font-mono font-bold tabular-nums ${
                                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {tx.type === 'income' ? '+' : '-'}
                                    {formatIDR(tx.amount)}
                                  </td>
                                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                                    {tx.created_at}
                                  </td>
                                  <td className="py-3 pl-3 text-right">
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        onClick={() => openEditTransactionModal(tx)}
                                        className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                                        title="Edit Transaksi"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransaction(tx.id)}
                                        className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-500/15"
                                        title="Hapus Transaksi"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      <PaginationControls
                        totalItems={filteredTransactions.length}
                        page={txPage}
                        pageSize={txPageSize}
                        onPageChange={setTxPage}
                        onPageSizeChange={setTxPageSize}
                      />
                    </div>
                    )}
                  </div>
                )}

                {/* SECTION: POSTGRES HOMEDB, SQLITE INSPECTOR, RESTORE & AUDIT LOGS */}
                {activeSection === 'database' && (
                  <div className="space-y-6">
                    {/* PostgreSQL homedb Live Database Card */}
                    <div
                      className={`rounded-3xl border p-6 ${
                        isDark ? 'border-emerald-500/30 bg-[#121621]' : 'border-emerald-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Database size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold">
                                PostgreSQL homedb Server
                              </h3>
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                                  data.postgresStatus?.connected
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {data.postgresStatus?.connected ? 'CONNECTED & SYNCED' : 'STANDBY'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              Host: {data.postgresStatus?.host || 'Configured via ENV'} • Database:{' '}
                              <strong className="text-emerald-400">
                                {data.postgresStatus?.database || 'buatin_nexus_db'}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            try {
                              showToast('Menyinkronkan seluruh tabel ke PostgreSQL homedb...');
                              const res = await fetch('/api/postgres/sync', { method: 'POST' });
                              const json = await res.json();
                              await fetchState();
                              if (json.ok) {
                                showToast(
                                  `PostgreSQL homedb (${json.status?.database}) berhasil disinkronkan (${json.status?.totalRowsSynced} baris)!`
                                );
                              }
                            } catch {
                              setErrorMsg('Gagal sinkronisasi ke PostgreSQL homedb.');
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          <Database size={15} />
                          <span>Sync Sekarang ke PostgreSQL homedb</span>
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                          <span className="text-slate-400 block text-[11px]">Nama Database</span>
                          <strong className="font-mono text-emerald-400">
                            {data.postgresStatus?.database || 'buatin_nexus_db'}
                          </strong>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                          <span className="text-slate-400 block text-[11px]">Tabel Tersinkron</span>
                          <strong className="font-mono text-white">
                            {data.postgresStatus?.tablesSynced || 23} Tabel Aktif
                          </strong>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                          <span className="text-slate-400 block text-[11px]">Total Data Baris</span>
                          <strong className="font-mono text-white">
                            {data.postgresStatus?.totalRowsSynced || 231} Rows
                          </strong>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                          <span className="text-slate-400 block text-[11px]">CloudBeaver Web UI</span>
                          {data.postgresStatus?.cloudbeaverUrl ? (
                            <a
                              href={data.postgresStatus.cloudbeaverUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-sky-400 hover:underline inline-flex items-center gap-1"
                            >
                              Open CloudBeaver <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="font-mono text-slate-500 text-xs">
                              Set CLOUDBEAVER_URL in .env
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div
                      className={`lg:col-span-5 rounded-3xl border p-6 ${
                        isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
                          <ShieldCheck size={22} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold">Backup & Restore SQLite Lokal</h3>
                          <p className="text-xs text-slate-400 font-mono">{data.dbFilePath}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={handleExportJson}
                          className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white"
                        >
                          <Download size={14} />
                          <span>Export Backup JSON</span>
                        </button>
                        <input
                          ref={restoreInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleRestoreJsonFile}
                          className="hidden"
                        />
                        <button
                          onClick={() => restoreInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold"
                        >
                          <Upload size={14} />
                          <span>Restore dari JSON</span>
                        </button>
                        <button
                          onClick={handleExportCsv}
                          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold"
                        >
                          <FileSpreadsheet size={14} />
                          <span>Export CSV Kas</span>
                        </button>
                      </div>
                    </div>

                    <div
                      className={`lg:col-span-7 rounded-3xl border p-6 ${
                        isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white'
                      }`}
                    >
                      <h3 className="text-base font-bold mb-4">Audit Log Aktivitas Sistem</h3>
                      <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1 text-xs">
                        {data.activityLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`flex items-start justify-between gap-3 rounded-2xl border p-3 ${
                              isDark ? 'border-white/[0.05] bg-[#171c29]' : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div>
                              <span className="rounded bg-orange-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-orange-500">
                                {log.module}
                              </span>
                              <span className="ml-2 font-bold">{log.action}</span>
                              <p className="mt-1 text-slate-400">{log.detail}</p>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">
                              {log.created_at}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* MODAL: CATAT TRANSAKSI */}
      <AnimatePresence>
        {txModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setTxModalOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateTransaction}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'border-white/10 bg-[#131722] text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Catat Transaksi Kas</h3>
                <button type="button" onClick={() => setTxModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'income' })}
                    className={`rounded-xl py-2 font-semibold ${
                      txForm.type === 'income' ? 'bg-emerald-500 text-white' : 'border border-slate-500/20'
                    }`}
                  >
                    + Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'expense' })}
                    className={`rounded-xl py-2 font-semibold ${
                      txForm.type === 'expense' ? 'bg-orange-500 text-white' : 'border border-slate-500/20'
                    }`}
                  >
                    - Pengeluaran
                  </button>
                </div>
                <input
                  required
                  type="text"
                  placeholder="Keterangan Transaksi"
                  value={txForm.title}
                  onChange={(e) => setTxForm({ ...txForm, title: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Nominal IDR"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-mono ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  <select
                    value={txForm.wallet_id}
                    onChange={(e) => setTxForm({ ...txForm, wallet_id: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {data?.wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white"
                >
                  Simpan Transaksi
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: TRANSFER ANTAR DOMPET */}
      <AnimatePresence>
        {transferModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setTransferModalOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleTransferWallets}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'border-white/10 bg-[#131722] text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Transfer Saldo Antar Rekening</h3>
                <button type="button" onClick={() => setTransferModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-400">Dari Rekening</label>
                    <select
                      value={transferForm.from_wallet_id}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, from_wallet_id: e.target.value })
                      }
                      className={`w-full rounded-xl border px-3 py-2.5 ${
                        isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {data?.wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Ke Rekening</label>
                    <select
                      value={transferForm.to_wallet_id}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, to_wallet_id: e.target.value })
                      }
                      className={`w-full rounded-xl border px-3 py-2.5 ${
                        isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {data?.wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Nominal Transfer (IDR)"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-mono ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Catatan transfer (opsional)"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white"
                >
                  Proses Transfer
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: TAMBAH REKENING BARU */}
      <AnimatePresence>
        {walletModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setWalletModalOpen(false)}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateWallet}
              className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'border-white/10 bg-[#131722] text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <h3 className="text-base font-bold">Tambah Rekening / Dompet</h3>
              <div className="mt-4 space-y-3 text-xs">
                <input
                  required
                  type="text"
                  placeholder="Nama Dompet (mis. Mandiri Tabungan)"
                  value={walletForm.name}
                  onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    type="text"
                    placeholder="Kode (MANDIRI)"
                    value={walletForm.bank_code}
                    onChange={(e) => setWalletForm({ ...walletForm, bank_code: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-mono ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  <input
                    required
                    type="number"
                    placeholder="Saldo Awal IDR"
                    value={walletForm.balance}
                    onChange={(e) => setWalletForm({ ...walletForm, balance: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-mono ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white"
                >
                  Simpan Rekening
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: BUAT INVOICE RAB PROYEK */}
      <AnimatePresence>
        {invoiceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setInvoiceModalOpen(false)}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateInvoice}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'border-white/10 bg-[#131722] text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <h3 className="text-base font-bold">Generator Invoice & RAB Proyek</h3>
              <div className="mt-4 space-y-3 text-xs">
                <input
                  required
                  type="text"
                  placeholder="Nama Klien / Perusahaan"
                  value={invoiceForm.client_name}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, client_name: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <input
                  required
                  type="text"
                  placeholder="Judul Proyek"
                  value={invoiceForm.project_title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, project_title: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={invoiceForm.item1_desc}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, item1_desc: e.target.value })}
                    className={`col-span-2 rounded-xl border px-3 py-2 ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  <input
                    type="number"
                    value={invoiceForm.item1_price}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, item1_price: e.target.value })}
                    className={`rounded-xl border px-3 py-2 font-mono ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={invoiceForm.item2_desc}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, item2_desc: e.target.value })}
                    className={`col-span-2 rounded-xl border px-3 py-2 ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  <input
                    type="number"
                    value={invoiceForm.item2_price}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, item2_price: e.target.value })}
                    className={`rounded-xl border px-3 py-2 font-mono ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white"
                >
                  Simpan Invoice RAB
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: TAMBAH TUGAS */}
      <AnimatePresence>
        {taskModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setTaskModalOpen(false)}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateTask}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'border-white/10 bg-[#131722] text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <h3 className="text-base font-bold">Tambah Tugas Kuliah / Proyek Klien</h3>
              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskForm({ ...taskForm, scope: 'klien' })}
                    className={`rounded-xl py-2 font-semibold ${
                      taskForm.scope === 'klien' ? 'bg-orange-500 text-white' : 'border border-slate-500/20'
                    }`}
                  >
                    Proyek Klien
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskForm({ ...taskForm, scope: 'kuliah' })}
                    className={`rounded-xl py-2 font-semibold ${
                      taskForm.scope === 'kuliah' ? 'bg-indigo-500 text-white' : 'border border-slate-500/20'
                    }`}
                  >
                    Kuliah UNPAM
                  </button>
                </div>
                <input
                  required
                  type="text"
                  placeholder="Judul Tugas / Proyek"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <input
                  required
                  type="text"
                  placeholder="Nama Klien / Mata Kuliah UNPAM"
                  value={taskForm.subject_or_client}
                  onChange={(e) => setTaskForm({ ...taskForm, subject_or_client: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-mono ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Nilai / SKS"
                    value={taskForm.budget_or_weight}
                    onChange={(e) => setTaskForm({ ...taskForm, budget_or_weight: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 ${
                      isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white"
                >
                  Simpan Tugas
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: TAMBAH MAINTENANCE */}
      <AnimatePresence>
        {maintModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setMaintModalOpen(false)}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateMaintenance}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'border-white/10 bg-[#131722] text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <h3 className="text-base font-bold">Tambah Target Maintenance Server</h3>
              <div className="mt-4 space-y-3 text-xs">
                <input
                  required
                  type="text"
                  placeholder="Nama Aplikasi"
                  value={maintForm.app_name}
                  onChange={(e) => setMaintForm({ ...maintForm, app_name: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <input
                  required
                  type="text"
                  placeholder="Nama Klien"
                  value={maintForm.client_name}
                  onChange={(e) => setMaintForm({ ...maintForm, client_name: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <input
                  required
                  type="text"
                  placeholder="URL Endpoint Ping (mis. https://portal.example.com)"
                  value={maintForm.url}
                  onChange={(e) => setMaintForm({ ...maintForm, url: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-mono ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <input
                  required
                  type="number"
                  placeholder="Retainer Bulanan IDR"
                  value={maintForm.monthly_fee}
                  onChange={(e) => setMaintForm({ ...maintForm, monthly_fee: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-mono ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white"
                >
                  Simpan Server
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: LIMIT ANGGARAN */}
      <AnimatePresence>
        {limitModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setLimitModalOpen(false)}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleUpdateLimit}
              className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'border-white/10 bg-[#131722] text-white' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <h3 className="text-base font-bold">Atur Monthly Spending Limit</h3>
              <input
                type="number"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className={`mt-4 w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm ${
                  isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                }`}
              />
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white"
                >
                  Simpan
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OMNI-ACTION RAYCAST COMMAND BAR (CTRL+K) */}
      <OmniActionCommandBar
        isOpen={cmdPaletteOpen}
        isDark={isDark}
        data={data}
        onClose={() => setCmdPaletteOpen(false)}
        onNavigateSection={setActiveSection}
        onOpenDealCloser={(topic) => {
          setDealCloserInitialTopic(topic || '');
          setDealCloserOpen(true);
        }}
        onRefreshState={setData}
        showToast={showToast}
        setErrorMsg={setErrorMsg}
      />

      {/* AI DEAL CLOSING & PROPOSAL NEGOTIATOR MODAL */}
      <DealClosingAssistantModal
        isOpen={dealCloserOpen}
        isDark={isDark}
        onClose={() => setDealCloserOpen(false)}
        onRefreshState={setData}
        showToast={showToast}
        setErrorMsg={setErrorMsg}
        initialTopic={dealCloserInitialTopic}
      />
    </div>
  );
}
