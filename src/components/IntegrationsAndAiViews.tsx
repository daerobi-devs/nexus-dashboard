import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  ExternalLink,
  Check,
  RefreshCw,
  FileText,
  Mail,
  FolderPlus,
  KeyRound,
  Radio,
  Copy,
  Database,
  MessageSquare,
  Unplug,
  Plus,
  Globe,
  Search,
  Eye,
  Clock,
  User,
  Layers,
  ChevronRight,
  ArrowRight,
  Share2,
} from 'lucide-react';
import type { DashboardState } from '../types';

interface AiAndTelegramProps {
  data: DashboardState;
  isDark: boolean;
  onRefreshState: (next: DashboardState) => void;
  showToast: (msg: string) => void;
  setErrorMsg: (msg: string | null) => void;
}

export function AiAndTelegramView({
  data,
  isDark,
  onRefreshState,
  showToast,
  setErrorMsg,
}: AiAndTelegramProps) {
  const [prompt, setPrompt] = useState('');
  const [sendingAi, setSendingAi] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState(data.settings?.telegram_bot_token || '');
  const [geminiKeyInput, setGeminiKeyInput] = useState(data.settings?.gemini_api_key || '');
  const [selectedModel, setSelectedModel] = useState(
    data.settings?.gemini_model || 'gemini-3.5-flash-lite'
  );
  const [modelOptions, setModelOptions] = useState<{ id: string; label: string }[]>([
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
  ]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [connectingBot, setConnectingBot] = useState(false);
  const [sendingTeleTest, setSendingTeleTest] = useState(false);

  const loadModelsFromApi = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch('/api/ai/models');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.models) && json.models.length > 0) {
          setModelOptions(json.models);
        }
      }
    } catch {
      // Keep default list
    } finally {
      setLoadingModels(false);
    }
  };

  React.useEffect(() => {
    loadModelsFromApi();
  }, [data.settings?.gemini_api_key]);

  const handleSelectModel = async (nextModel: string) => {
    setSelectedModel(nextModel);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'gemini_model', value: nextModel }),
      });
      if (res.ok) {
        const json = await res.json();
        onRefreshState(json);
        showToast(`Model aktif diubah ke: ${nextModel}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAskAi = async (customPrompt?: string) => {
    const q = (customPrompt ?? prompt).trim();
    if (!q || sendingAi) return;
    setSendingAi(true);
    if (!customPrompt) setPrompt('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, model: selectedModel }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memproses pertanyaan AI.');
      onRefreshState(json.state);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSendingAi(false);
    }
  };

  const handleOneClickConnectBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim()) {
      setErrorMsg('Masukkan Token dari @BotFather terlebih dahulu.');
      return;
    }
    setConnectingBot(true);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botTokenInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghubungkan Bot Telegram.');
      onRefreshState(json);
      showToast(`Bot Telegram ${json.telegramStatus?.username} aktif & terhubung ke SQLite!`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setConnectingBot(false);
    }
  };

  const handleDisconnectBot = async () => {
    try {
      const res = await fetch('/api/telegram', { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        onRefreshState(json);
        setBotTokenInput('');
        showToast('Koneksi Bot Telegram diputuskan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSendTelegramReport = async () => {
    setSendingTeleTest(true);
    try {
      const res = await fetch('/api/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onRefreshState(json);
      showToast('Ringkasan database berhasil dikirim ke Telegram Anda!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSendingTeleTest(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'gemini_api_key', value: geminiKeyInput.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        onRefreshState(json);
        showToast('Konfigurasi API Key Gemini disimpan di SQLite.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const quickPrompts = [
    'Ringkasan seluruh database hari ini',
    'Laporan saldo semua dompet & sisa budget',
    'Daftar tugas kuliah UNPAM & proyek klien yang mendesak',
    'Buatkan draf pesan penagihan invoice ke klien',
    'Ringkasan file Google Drive & Gmail terbaru',
    'catat pengeluaran 45000 beli kopi dari BCA',
  ];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* LEFT 7 COLS: FULL-DATABASE AI ASSISTANT CHAT */}
      <div
        className={`xl:col-span-7 flex flex-col justify-between rounded-3xl border p-6 ${
          isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-500/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/20">
                <Bot size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold">Nexus AI — Full SQLite Database Brain</h2>
                <p className="text-xs text-slate-400">
                  Membaca & mengeksekusi perintah langsung ke seluruh tabel di data/nexus.db
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedModel}
                onChange={(e) => handleSelectModel(e.target.value)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'border-orange-500/40 bg-[#171c29] text-orange-400'
                    : 'border-orange-500/40 bg-orange-50 text-orange-600'
                }`}
              >
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={async () => {
                  const res = await fetch('/api/ai', { method: 'DELETE' });
                  if (res.ok) {
                    onRefreshState(await res.json());
                    showToast('Riwayat chat direset!');
                  }
                }}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-rose-500/10 hover:text-rose-600'
                }`}
              >
                Reset Chat
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 font-mono text-[11px] font-semibold text-emerald-500">
                <Database size={12} />
                Full DB Active
              </span>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                onClick={() => handleAskAi(qp)}
                disabled={sendingAi}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all hover:-translate-y-0.5 ${
                  isDark
                    ? 'border-white/10 bg-[#171c29] text-slate-300 hover:border-orange-500/50 hover:text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-500/50'
                }`}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Chat Conversation History */}
          <div className="mt-4 h-[410px] space-y-3 overflow-y-auto pr-1">
            {data.aiMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="mb-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-mono uppercase font-semibold">
                      {msg.source === 'telegram' ? 'Via Telegram Bot' : 'Via Dashboard'}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{msg.created_at}</span>
                  </div>
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-orange-500 text-white font-medium'
                        : isDark
                        ? 'border border-white/[0.06] bg-[#171c29] text-slate-200'
                        : 'border border-slate-200/80 bg-slate-50 text-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {sendingAi && (
              <div className="text-xs text-orange-500 font-medium animate-pulse px-2">
                Memindai seluruh tabel SQLite & menyusun jawaban...
              </div>
            )}
          </div>
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAi();
          }}
          className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-500/10"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Tanya isi database atau ketik perintah: "catat pengeluaran 50000 makan siang"...'
            className={`flex-1 rounded-2xl border px-4 py-3 text-xs focus:outline-none ${
              isDark
                ? 'border-white/10 bg-[#0d1117] text-white focus:border-orange-500'
                : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-orange-500'
            }`}
          />
          <button
            type="submit"
            disabled={sendingAi}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-xs font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5"
          >
            <Send size={14} />
            <span>Kirim</span>
          </button>
        </form>
      </div>

      {/* RIGHT 5 COLS: ONE-CLICK BOTFATHER TELEGRAM + GEMINI KEY */}
      <div className="xl:col-span-5 space-y-6">
        {/* Card 1: One-Click Telegram BotFather Connector */}
        <div
          className={`rounded-3xl border p-6 ${
            isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold">One-Click BotFather Telegram</h3>
                <p className="text-xs text-slate-400">
                  Tanya & perintah database lokal langsung dari chat Telegram HP lo
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold ${
                data.telegramStatus?.connected
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              <Radio size={12} />
              {data.telegramStatus?.connected
                ? `Aktif (${data.telegramStatus.username})`
                : 'Belum Terhubung'}
            </span>
          </div>

          {/* Step 1: One-Click Open BotFather */}
          <div
            className={`mt-5 rounded-2xl border p-4 text-xs space-y-3 ${
              isDark ? 'border-white/[0.06] bg-[#171c29]' : 'border-slate-200/70 bg-slate-50'
            }`}
          >
            <div className="font-semibold">Langkah 1 — Buat / Ambil Token di @BotFather</div>
            <p className="text-slate-400 leading-relaxed">
              Klik tombol di bawah untuk membuka <strong>@BotFather</strong> di Telegram, kirim perintah{' '}
              <code className="font-mono text-orange-400">/newbot</code>, lalu salin HTTP API Token-nya.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-400 transition-colors"
              >
                <ExternalLink size={13} />
                <span>1. Buka @BotFather (One-Click)</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('/newbot');
                  showToast('Perintah /newbot disalin ke clipboard!');
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-mono ${
                  isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Copy size={12} />
                <span>Copy /newbot</span>
              </button>
            </div>
          </div>

          {/* Step 2: Paste Token & One-Click Activate */}
          <form onSubmit={handleOneClickConnectBot} className="mt-4 space-y-3 text-xs">
            <label className="block font-semibold">
              Langkah 2 — Tempel Token & Aktifkan Long-Polling
            </label>
            <input
              type="text"
              value={botTokenInput}
              onChange={(e) => setBotTokenInput(e.target.value)}
              placeholder="Contoh: 7123456789:AAHxyz1234567890abcdef..."
              className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs ${
                isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
              }`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={connectingBot}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md"
              >
                <Check size={14} />
                <span>
                  {connectingBot
                    ? 'Menghubungkan ke Telegram...'
                    : '2. Connect & Aktifkan Bot Sekarang'}
                </span>
              </button>
              {data.telegramStatus?.connected && (
                <button
                  type="button"
                  onClick={handleDisconnectBot}
                  title="Putuskan Bot"
                  className="rounded-full border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-400 hover:bg-rose-500/20"
                >
                  <Unplug size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Connected Actions & Commands Reference */}
          <div className="mt-5 border-t border-slate-500/10 pt-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Chat ID Terdeteksi:</span>
              <span className="font-mono font-semibold">
                {data.telegramStatus?.chatId || 'Kirim /start ke bot Anda di Telegram'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSendTelegramReport}
              disabled={sendingTeleTest}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 font-semibold transition-colors ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <Send size={13} />
              <span>
                {sendingTeleTest
                  ? 'Mengirim ke Telegram...'
                  : 'Kirim Ringkasan Database ke Telegram Sekarang'}
              </span>
            </button>

            <div className="rounded-xl bg-black/20 p-3 font-mono text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Perintah Bot Telegram yang Aktif:</div>
              <div>• /start atau /help — Ringkasan eksekutif seluruh DB</div>
              <div>• /saldo — Cek saldo BCA, Jago, Kas & sisa budget</div>
              <div>• /tugas — Cek tugas kuliah UNPAM & proyek klien</div>
              <div>• /server — Cek status ping server maintenance</div>
              <div>• /catat keluar 45000 kopi — Catat transaksi otomatis</div>
              <div>• Atau chat bebas bahasa Indonesia seperti biasa!</div>
            </div>
          </div>
        </div>

        {/* Card 2: Gemini Model Selector & API Key Upgrade */}
        <div
          className={`rounded-3xl border p-6 ${
            isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-orange-500" />
              <h3 className="text-sm font-bold">Pilih Model AI (Gemini 3.5+ / 3.8 / 4 Argon)</h3>
            </div>
            <button
              type="button"
              onClick={loadModelsFromApi}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-500 hover:underline"
            >
              <RefreshCw size={11} className={loadingModels ? 'animate-spin' : ''} />
              <span>Sync Daftar Model ({modelOptions.length})</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Model yang dipilih otomatis dipakai untuk menjawab chat di Dashboard maupun Bot Telegram.
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <label className="block mb-1 text-[11px] font-semibold text-slate-400">
                Model Aktif (Tersedia {modelOptions.length} Model dari API Key Anda)
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleSelectModel(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs font-semibold ${
                  isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <KeyRound size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy... (API Key Gemini)"
                  className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-mono ${
                    isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveGeminiKey();
                  await loadModelsFromApi();
                }}
                className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Simpan Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GOOGLE WORKSPACE ECOSYSTEM APPS & BRAND ICONS
// ============================================================================
export const GmailIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48">
    <path fill="#4caf50" d="M45,16.2l-5,2.75l-0.01,21.05c0,2.21-1.79,4-4,4H12c-2.21,0-4-1.79-4-4l0.01-21.05L3,16.2 c-0.62-0.34-1-1-1-1.71c0-1.42,1.43-2.38,2.72-1.79L24,23.5l19.28-10.8c1.29-0.59,2.72,0.37,2.72,1.79 C46,15.2,45.62,15.86,45,16.2z"/>
    <path fill="#1e88e5" d="M4,15.5L24,26.5l20-11V9c0-2.21-1.79-4-4-4H8C5.79,5,4,6.79,4,9V15.5z"/>
    <path fill="#e53935" d="M43.28,12.7L24,23.5L4.72,12.7C3.43,12.11,2,13.07,2,14.49c0,0.71,0.38,1.37,1,1.71l5,2.75l16,8.8 l16-8.8l5-2.75c0.62-0.34,1-1,1-1.71C46,13.07,44.57,12.11,43.28,12.7z"/>
  </svg>
);

export const GoogleDriveIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 87.3 78">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

const GOOGLE_ECOSYSTEM_APPS = [
  {
    id: 'gmail',
    name: 'Gmail',
    subtitle: 'Kotak Masuk & Pesan',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    color: 'from-red-500/15 to-rose-500/5',
    icon: <GmailIcon className="h-6 w-6" />,
  },
  {
    id: 'drive',
    name: 'Google Drive',
    subtitle: 'Cloud Storage & Berkas',
    url: 'https://drive.google.com/drive/u/0/my-drive',
    color: 'from-amber-500/15 to-emerald-500/5',
    icon: <GoogleDriveIcon className="h-6 w-6" />,
  },
  {
    id: 'docs',
    name: 'Google Docs',
    subtitle: 'Dokumen & Naskah Kerja',
    url: 'https://docs.google.com/document/u/0/',
    color: 'from-blue-500/15 to-indigo-500/5',
    icon: (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48">
        <path fill="#2196f3" d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h19l11,11v27C41,43.2,39.2,45,37,45z"/>
        <path fill="#bbdefb" d="M30 3L41 14 30 14z"/>
        <path fill="#fff" d="M15 23H33V25H15zM15 29H33V31H15zM15 35H27V37H15z"/>
      </svg>
    ),
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    subtitle: 'Spreadsheet & Tabel RAB',
    url: 'https://docs.google.com/spreadsheets/u/0/',
    color: 'from-emerald-500/15 to-teal-500/5',
    icon: (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48">
        <path fill="#4caf50" d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h19l11,11v27C41,43.2,39.2,45,37,45z"/>
        <path fill="#c8e6c9" d="M30 3L41 14 30 14z"/>
        <path fill="#fff" d="M15 20H33V38H15zM23 23H17V26H23zM31 23H25V26H31zM23 28H17V31H23zM31 28H25V31H31z"/>
      </svg>
    ),
  },
  {
    id: 'slides',
    name: 'Google Slides',
    subtitle: 'Presentasi & Pitching',
    url: 'https://docs.google.com/presentation/u/0/',
    color: 'from-amber-500/15 to-yellow-500/5',
    icon: (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48">
        <path fill="#ff9800" d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h19l11,11v27C41,43.2,39.2,45,37,45z"/>
        <path fill="#ffe0b2" d="M30 3L41 14 30 14z"/>
        <path fill="#fff" d="M16 23H32V35H16zM18 25H30V33H18z"/>
      </svg>
    ),
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    subtitle: 'Jadwal Kuliah & Deadline',
    url: 'https://calendar.google.com/calendar/u/0/r',
    color: 'from-sky-500/15 to-blue-500/5',
    icon: (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48">
        <path fill="#1976d2" d="M38,44H10c-2.2,0-4-1.8-4-4V12c0-2.2,1.8-4,4-4h28c2.2,0,4,1.8,4,4v28C42,42.2,40.2,44,38,44z"/>
        <path fill="#fff" d="M10,14h28v26H10V14z"/>
        <path fill="#1976d2" d="M14 4H18V10H14zM30 4H34V10H30z"/>
        <text x="24" y="32" fill="#1976d2" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">31</text>
      </svg>
    ),
  },
  {
    id: 'meet',
    name: 'Google Meet',
    subtitle: 'Video Call & Diskusi Klien',
    url: 'https://meet.google.com/',
    color: 'from-emerald-500/15 to-green-500/5',
    icon: (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48">
        <rect width="26" height="24" x="4" y="12" fill="#00832d" rx="3"/>
        <path fill="#00ac47" d="M30 20L44 11 44 37 30 28z"/>
        <path fill="#2684fc" d="M30 15L30 33 4 33 4 15z" opacity=".2"/>
      </svg>
    ),
  },
  {
    id: 'keep',
    name: 'Google Keep',
    subtitle: 'Catatan Kilat & To-do',
    url: 'https://keep.google.com/',
    color: 'from-amber-400/15 to-yellow-500/5',
    icon: (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48">
        <path fill="#ffc107" d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h26c2.2,0,4,1.8,4,4v34C41,43.2,39.2,45,37,45z"/>
        <path fill="#fff" d="M24 13c-4.4 0-8 3.6-8 8 0 2.8 1.4 5.2 3.6 6.6V30c0 .6.4 1 1 1h6.8c.6 0 1-.4 1-1v-2.4c2.2-1.4 3.6-3.8 3.6-6.6 0-4.4-3.6-8-8-8z"/>
        <path fill="#ffb300" d="M20 32H28V34H20z"/>
      </svg>
    ),
  },
  {
    id: 'forms',
    name: 'Google Forms',
    subtitle: 'Kuisioner & Riset Survei',
    url: 'https://forms.google.com/',
    color: 'from-purple-500/15 to-fuchsia-500/5',
    icon: (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48">
        <path fill="#7b1fa2" d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h19l11,11v27C41,43.2,39.2,45,37,45z"/>
        <path fill="#e1bee7" d="M30 3L41 14 30 14z"/>
        <circle cx="18" cy="24" r="2" fill="#fff"/>
        <path fill="#fff" d="M23 23H32V25H23z"/>
        <circle cx="18" cy="32" r="2" fill="#fff"/>
        <path fill="#fff" d="M23 31H32V33H23z"/>
      </svg>
    ),
  },
  {
    id: 'colab',
    name: 'Google Colab',
    subtitle: 'Notebook Python & AI Model',
    url: 'https://colab.research.google.com/',
    color: 'from-orange-500/15 to-amber-500/5',
    icon: (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48">
        <path fill="#f9ab00" d="M16 16c-4.4 0-8 3.6-8 8s3.6 8 8 8c3.2 0 6-1.9 7.2-4.6l-3.3-1.9c-.8 1.6-2.3 2.7-4.1 2.7-2.6 0-4.6-2-4.6-4.6s2-4.6 4.6-4.6c1.8 0 3.3 1 4.1 2.6l3.3-1.9C22 17.9 19.2 16 16 16z"/>
        <path fill="#e37400" d="M32 16c-3.2 0-6 1.9-7.2 4.6l3.3 1.9c.8-1.6 2.3-2.6 4.1-2.6 2.6 0 4.6 2 4.6 4.6s-2 4.6-4.6 4.6c-1.8 0-3.3-1.1-4.1-2.7l-3.3 1.9c1.2 2.7 4 4.6 7.2 4.6 4.4 0 8-3.6 8-8s-3.6-8-8-8z"/>
      </svg>
    ),
  },
];

const getDriveItemIcon = (title: string, subtitle: string) => {
  const lowTitle = (title || '').toLowerCase();
  const lowSub = (subtitle || '').toLowerCase();

  if (lowTitle.endsWith('.docx') || lowTitle.endsWith('.doc') || lowSub.includes('docs')) {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
        <path fill="#2196f3" d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h19l11,11v27C41,43.2,39.2,45,37,45z"/>
        <path fill="#bbdefb" d="M30 3L41 14 30 14z"/>
        <path fill="#fff" d="M15 23H33V25H15zM15 29H33V31H15zM15 35H27V37H15z"/>
      </svg>
    );
  }
  if (lowTitle.endsWith('.xlsx') || lowTitle.endsWith('.xls') || lowTitle.endsWith('.csv') || lowSub.includes('sheets')) {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
        <path fill="#4caf50" d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h19l11,11v27C41,43.2,39.2,45,37,45z"/>
        <path fill="#c8e6c9" d="M30 3L41 14 30 14z"/>
        <path fill="#fff" d="M15 20H33V38H15zM23 23H17V26H23zM31 23H25V26H31z"/>
      </svg>
    );
  }
  if (lowTitle.endsWith('.pptx') || lowTitle.endsWith('.ppt') || lowSub.includes('slides')) {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
        <path fill="#ff9800" d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h19l11,11v27C41,43.2,39.2,45,37,45z"/>
        <path fill="#ffe0b2" d="M30 3L41 14 30 14z"/>
        <path fill="#fff" d="M16 23H32V35H16zM18 25H30V33H18z"/>
      </svg>
    );
  }
  if (lowTitle.endsWith('.ipynb') || lowSub.includes('colab')) {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
        <path fill="#f9ab00" d="M16 16c-4.4 0-8 3.6-8 8s3.6 8 8 8c3.2 0 6-1.9 7.2-4.6l-3.3-1.9c-.8 1.6-2.3 2.7-4.1 2.7-2.6 0-4.6-2-4.6-4.6s2-4.6 4.6-4.6c1.8 0 3.3 1 4.1 2.6l3.3-1.9C22 17.9 19.2 16 16 16z"/>
        <path fill="#e37400" d="M32 16c-3.2 0-6 1.9-7.2 4.6l3.3 1.9c.8-1.6 2.3-2.6 4.1-2.6 2.6 0 4.6 2 4.6 4.6s-2 4.6-4.6 4.6c-1.8 0-3.3-1.1-4.1-2.7l-3.3 1.9c1.2 2.7 4 4.6 7.2 4.6 4.4 0 8-3.6 8-8s-3.6-8-8-8z"/>
      </svg>
    );
  }
  return <GoogleDriveIcon className="h-5 w-5 shrink-0" />;
};

// ============================================================================
// GOOGLE WORKSPACE LIVE SYNC VIEW
// ============================================================================
interface GoogleWorkspaceViewProps {
  data: DashboardState;
  isDark: boolean;
  onRefreshState: (next: DashboardState) => void;
  showToast: (msg: string) => void;
  setErrorMsg: (msg: string | null) => void;
}

export function GoogleWorkspaceView({
  data,
  isDark,
  onRefreshState,
  showToast,
  setErrorMsg,
}: GoogleWorkspaceViewProps) {
  const [syncing, setSyncing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(
    data.settings?.google_account || 'daerobi'
  );
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Split-Pane & In-App View State
  const [workspaceMode, setWorkspaceMode] = useState<'hub' | 'gmail' | 'drive'>('hub');
  const [selectedGmailId, setSelectedGmailId] = useState<string | null>(null);
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [gmailSearch, setGmailSearch] = useState('');
  const [driveSearch, setDriveSearch] = useState('');
  const [driveFilter, setDriveFilter] = useState<'all' | 'docs' | 'sheets' | 'slides' | 'colab'>('all');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState<string | null>(null);
  const [aiDraftTone, setAiDraftTone] = useState<'formal' | 'santai' | 'negosiasi' | 'jadwal'>('formal');
  const [docSummaryLoading, setDocSummaryLoading] = useState(false);
  const [docSummaryResult, setDocSummaryResult] = useState<string | null>(null);

  const driveItems = data.googleItems.filter((g) => g.kind === 'drive');
  const gmailItems = data.googleItems.filter((g) => g.kind === 'gmail');

  const filteredDriveItems = driveItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(driveSearch.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(driveSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (driveFilter === 'all') return true;
    if (driveFilter === 'docs')
      return item.subtitle.includes('Docs') || item.title.endsWith('.docx') || item.title.endsWith('.doc');
    if (driveFilter === 'sheets')
      return (
        item.subtitle.includes('Sheets') ||
        item.title.endsWith('.xlsx') ||
        item.title.endsWith('.xls') ||
        item.title.endsWith('.csv')
      );
    if (driveFilter === 'slides')
      return item.subtitle.includes('Slides') || item.title.endsWith('.pptx') || item.title.endsWith('.ppt');
    if (driveFilter === 'colab')
      return item.subtitle.includes('Colab') || item.title.endsWith('.ipynb');
    return true;
  });

  const activeDriveId =
    selectedDriveId ||
    (filteredDriveItems.length > 0 ? filteredDriveItems[0].id : driveItems[0]?.id || null);
  const selectedDrive = driveItems.find((d) => d.id === activeDriveId);

  const filteredGmailItems = gmailItems.filter((mail) => {
    const q = gmailSearch.toLowerCase();
    return (
      mail.title.toLowerCase().includes(q) ||
      mail.subtitle.toLowerCase().includes(q) ||
      mail.snippet.toLowerCase().includes(q)
    );
  });

  const activeGmailId =
    selectedGmailId ||
    (filteredGmailItems.length > 0 ? filteredGmailItems[0].id : gmailItems[0]?.id || null);
  const selectedGmail = gmailItems.find((m) => m.id === activeGmailId);

  const handleSyncNow = async (acc?: string) => {
    const targetAcc = acc || selectedAccount;
    setSyncing(true);
    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: targetAcc }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal sinkronisasi Google Workspace.');
      onRefreshState(json);
      showToast(`Google Workspace (${json.settings?.google_email}) berhasil disinkronkan ke SQLite!`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateGoogleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || creatingDoc) return;
    setCreatingDoc(true);
    try {
      const res = await fetch('/api/google', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDocTitle.trim(),
          content: `Dokumen Kerja Nexus Command Center\nDibuat oleh: Daerobi\nTanggal: ${new Date().toISOString().slice(0, 10)}\n\nCatatan Operasional:\n`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onRefreshState(json.state);
      setNewDocTitle('');
      showToast('Google Doc baru berhasil dibuat di Drive Anda!');
      if (json.doc?.docUrl) {
        window.open(json.doc.docUrl, '_blank');
      }
      handleSyncNow();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleConvertToTask = async (
    title: string,
    scope: 'kuliah' | 'klien',
    subtitle: string,
    link: string
  ) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scope,
          subject_or_client: subtitle,
          priority: 'high',
          due_date: '2026-11-18',
          budget_or_weight: scope === 'kuliah' ? 'Dokumen Drive' : 'Tindak Lanjut',
          drive_link: link,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        onRefreshState(json);
        showToast(`"${title}" ditambahkan ke Kanban Tugas & Proyek!`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} disalin ke clipboard!`);
  };

  const handleAppCardClick = (appId: string, url: string) => {
    if (appId === 'gmail') {
      setWorkspaceMode('gmail');
      showToast('Membuka Gmail In-App Split-Pane Reader');
      return;
    }
    if (appId === 'drive') {
      setWorkspaceMode('drive');
      setDriveFilter('all');
      showToast('Membuka Google Drive In-App Explorer');
      return;
    }
    if (appId === 'docs') {
      setWorkspaceMode('drive');
      setDriveFilter('docs');
      showToast('Memfilter berkas Google Docs di Dashboard');
      return;
    }
    if (appId === 'sheets') {
      setWorkspaceMode('drive');
      setDriveFilter('sheets');
      showToast('Memfilter spreadsheet Google Sheets di Dashboard');
      return;
    }
    if (appId === 'slides') {
      setWorkspaceMode('drive');
      setDriveFilter('slides');
      showToast('Memfilter presentasi Google Slides di Dashboard');
      return;
    }
    if (appId === 'colab') {
      setWorkspaceMode('drive');
      setDriveFilter('colab');
      showToast('Memfilter notebook Google Colab di Dashboard');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGenerateAiDraft = async (tone: string) => {
    if (!selectedGmail) return;
    setAiDraftLoading(true);
    try {
      const toneDescription =
        tone === 'formal'
          ? 'formal, santun, dan profesional'
          : tone === 'santai'
          ? 'santai, ramah, to the point'
          : tone === 'negosiasi'
          ? 'tegas, profesional dalam negosiasi harga dan ruang lingkup kerja joki/proyek'
          : 'konfirmasi waktu, jadwal pertemuan, dan kesiapan deadline';

      const customPrompt = `Anda adalah asisten AI pribadi Daerobi (daerobi-devs, Mahasiswa Teknik Informatika UNPAM). 
Tolong buatkan draf balasan email dengan nada ${toneDescription}.
Konteks Email Masuk:
- Dari: ${selectedGmail.subtitle}
- Subjek: ${selectedGmail.title}
- Cuplikan/Isi Pesan: ${selectedGmail.snippet}

Tulis HANYA draf isi balasan emailnya langsung secara profesional dan siap kirim, tanpa penjelasan meta atau pembuka tambahan.`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal membuat draf AI.');
      setAiDraftResult(json.answer);
      onRefreshState(json.state);
      showToast('Draf balasan AI berhasil dibuat!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleSummarizeDoc = async () => {
    if (!selectedDrive) return;
    setDocSummaryLoading(true);
    try {
      const customPrompt = `Anda adalah asisten AI pribadi Daerobi (daerobi-devs).
Tolong bedah dan ringkas dokumen Google Drive berikut menjadi poin-poin ringkas, action items, dan urgensinya:
- Judul Berkas: ${selectedDrive.title}
- Jenis: ${selectedDrive.subtitle}
- Metadata/Cuplikan: ${selectedDrive.snippet}

Tulis ringkasannya dalam bentuk poin-poin berbobot (maksimal 4-5 poin) yang langsung bisa dieksekusi Daerobi.`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal membedah dokumen.');
      setDocSummaryResult(json.answer);
      onRefreshState(json.state);
      showToast('Ringkasan dokumen AI berhasil dibuat!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDocSummaryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Control Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 ${
          isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-lg font-bold">
              Google Workspace Live Connection ({data.settings?.google_email || 'daerobii0223@gmail.com'})
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Terhubung langsung menggunakan kredensial OAuth lokal Anda (.google-mcp). Semua file & email yang disinkronkan otomatis bisa dibaca oleh AI & Bot Telegram.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Auto-Sync Latar Belakang Aktif (Tiap 2.5 Menit)
            </span>
            {data.settings?.google_last_sync && (
              <span className="text-[11px] text-slate-400">
                Terakhir disinkronkan: <strong className="text-slate-300 font-medium">{data.settings.google_last_sync}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAccount}
            onChange={(e) => {
              setSelectedAccount(e.target.value);
              handleSyncNow(e.target.value);
            }}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold ${
              isDark ? 'border-white/10 bg-[#171c29] text-white' : 'border-slate-200 bg-slate-50'
            }`}
          >
            {(data.googleAccounts || ['daerobi', 'default']).map((acc) => (
              <option key={acc} value={acc}>
                Akun MCP: {acc}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleSyncNow()}
            disabled={syncing}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Drive & Gmail Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Quick Launch Google Ecosystem Apps Grid */}
      <div
        className={`rounded-3xl border p-6 ${
          isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-orange-500" />
              <h3 className="text-base font-bold text-white">Peluncur Ekosistem Google Workspace</h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Klik kartu untuk membuka konten langsung di Split-Pane Dashboard (Gmail & Drive), atau gunakan ikon panah untuk membuka di web.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              10 Layanan Terhubung
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {GOOGLE_ECOSYSTEM_APPS.map((app) => {
            const hasInApp = ['gmail', 'drive', 'docs', 'sheets', 'slides', 'colab'].includes(app.id);
            return (
              <div
                key={app.id}
                onClick={() => handleAppCardClick(app.id, app.url)}
                role="button"
                tabIndex={0}
                className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isDark
                    ? 'border-white/[0.07] bg-[#171c29]/80 hover:border-orange-500/40 hover:bg-[#1a2133]'
                    : 'border-slate-200 bg-slate-50/90 hover:border-orange-500/40 hover:bg-orange-50/30'
                }`}
              >
                {/* External link button */}
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Buka situs resmi di tab baru"
                  className="absolute right-2.5 top-2.5 rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-orange-400 transition-colors"
                >
                  <ExternalLink size={12} />
                </a>

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] p-2 shadow-inner transition-transform duration-200 group-hover:scale-110">
                  {app.icon}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    {app.name}
                  </span>
                </div>
                <span className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                  {app.subtitle}
                </span>

                {hasInApp && (
                  <span className="mt-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[9px] font-semibold text-orange-400">
                    Buka In-App
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode Switcher Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${
          isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setWorkspaceMode('hub')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              workspaceMode === 'hub'
                ? 'bg-orange-500 text-white shadow-md'
                : isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>Hub Ringkasan (2 Kolom)</span>
          </button>

          <button
            onClick={() => setWorkspaceMode('gmail')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              workspaceMode === 'gmail'
                ? 'bg-red-500 text-white shadow-md'
                : isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GmailIcon className="h-4 w-4" />
            <span>Gmail In-App Reader (Split-Pane)</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
              {gmailItems.length}
            </span>
          </button>

          <button
            onClick={() => setWorkspaceMode('drive')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              workspaceMode === 'drive'
                ? 'bg-emerald-600 text-white shadow-md'
                : isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GoogleDriveIcon className="h-4 w-4" />
            <span>Drive & Docs Explorer (Split-Pane)</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
              {driveItems.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          {workspaceMode === 'hub' && 'Pilih email atau dokumen untuk membaca isi lengkap'}
          {workspaceMode === 'gmail' && 'Baca isi surat & buat draf balasan langsung di dashboard'}
          {workspaceMode === 'drive' && 'Pratinjau berkas & bedah dokumen via AI tanpa tab baru'}
        </div>
      </div>

      {/* VIEW MODE 1: GMAIL IN-APP READER (SPLIT-PANE) */}
      {workspaceMode === 'gmail' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Daftar Pesan (5 Cols) */}
          <div
            className={`lg:col-span-5 rounded-3xl border p-5 ${
              isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <GmailIcon className="h-5 w-5 shrink-0" />
                <h3 className="text-sm font-bold">Kotak Masuk ({filteredGmailItems.length})</h3>
              </div>
              <span className="text-[11px] text-slate-400">Pilih untuk membaca</span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3.5">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={gmailSearch}
                onChange={(e) => setGmailSearch(e.target.value)}
                placeholder="Cari pengirim, subjek, pesan..."
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs ${
                  isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                }`}
              />
            </div>

            {/* Messages List */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredGmailItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Tidak ada email yang cocok dengan pencarian.
                </p>
              ) : (
                filteredGmailItems.map((mail) => {
                  const isSelected = mail.id === activeGmailId;
                  return (
                    <button
                      key={mail.id}
                      onClick={() => {
                        setSelectedGmailId(mail.id);
                        setAiDraftResult(null);
                      }}
                      className={`w-full text-left rounded-2xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-red-500/60 bg-[#1e2436] shadow-md ring-1 ring-red-500/40'
                          : isDark
                          ? 'border-white/[0.06] bg-[#171c29]/70 hover:border-white/15 hover:bg-[#1a2133]'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 font-bold text-xs">
                          {mail.subtitle.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-bold text-white">
                              {mail.subtitle}
                            </span>
                            <span className="shrink-0 text-[10px] text-slate-400">
                              {mail.updated_at?.slice(5, 16)}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-200">
                            {mail.title}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[10px] text-slate-400 leading-relaxed">
                            {mail.snippet}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: In-App Reading Pane (7 Cols) */}
          <div
            className={`lg:col-span-7 rounded-3xl border p-6 space-y-5 ${
              isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
            }`}
          >
            {selectedGmail ? (
              <>
                {/* Email Header */}
                <div className="border-b border-white/[0.08] pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">
                      Gmail Live In-App Reader
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          handleConvertToTask(
                            `Tindak Lanjut Email: ${selectedGmail.title.slice(0, 45)}`,
                            'klien',
                            selectedGmail.subtitle.slice(0, 35),
                            selectedGmail.web_link
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-orange-500 hover:text-white transition-colors"
                      >
                        <Plus size={12} />
                        <span>Jadikan Tugas</span>
                      </button>
                      <button
                        onClick={() => handleCopyText(selectedGmail.snippet, 'Cuplikan email')}
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white/10 transition-colors"
                      >
                        <Copy size={12} />
                        <span>Salin</span>
                      </button>
                      <a
                        href={selectedGmail.web_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-red-500/15 border border-red-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <span>Buka di Web</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {selectedGmail.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-500" />
                      <span className="font-medium text-slate-200">Pengirim:</span>
                      <span className="text-orange-400 font-semibold">{selectedGmail.subtitle}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-500" />
                      <span>{selectedGmail.updated_at}</span>
                    </div>
                  </div>
                </div>

                {/* Email Body Container */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14] p-5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3">
                    <span className="text-xs font-semibold text-slate-400">Isi Konten Pesan Masuk:</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {selectedGmail.id}</span>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedGmail.snippet || '(Tidak ada cuplikan teks tambahan untuk pesan ini)'}
                  </div>
                </div>

                {/* AI Gemini Draft Reply Assistant */}
                <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.07] to-red-500/[0.03] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-orange-400" />
                      <h4 className="text-xs font-bold text-white">Asisten Draf Balasan Email (Gemini AI)</h4>
                    </div>
                    <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/15 px-2 py-0.5 rounded-full">
                      Sekali Klik
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Pilih gaya respon di bawah, AI akan langsung membuat draf balasan profesional berdasarkan konteks pesan ini:
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { id: 'formal', label: 'Formal & Sopan' },
                      { id: 'santai', label: 'Santai & Friendly' },
                      { id: 'negosiasi', label: 'Tegas & Negosiasi Fee' },
                      { id: 'jadwal', label: 'Konfirmasi Jadwal' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setAiDraftTone(t.id as any);
                          handleGenerateAiDraft(t.id);
                        }}
                        disabled={aiDraftLoading}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                          aiDraftTone === t.id
                            ? 'bg-orange-500 text-white shadow'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {aiDraftLoading && (
                    <div className="flex items-center gap-2 py-4 text-xs text-orange-400">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Merumuskan draf balasan profesional dengan Gemini...</span>
                    </div>
                  )}

                  {aiDraftResult && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-white/[0.08]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-400">
                          Draf Balasan Siap Pakai:
                        </span>
                        <button
                          onClick={() => handleCopyText(aiDraftResult, 'Draf balasan email')}
                          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                        >
                          <Copy size={12} />
                          <span>Salin Draf</span>
                        </button>
                      </div>
                      <textarea
                        value={aiDraftResult}
                        onChange={(e) => setAiDraftResult(e.target.value)}
                        rows={5}
                        className="w-full rounded-xl border border-white/10 bg-[#0b0e14] p-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <Mail size={32} className="mx-auto text-slate-500 mb-2 opacity-50" />
                <p className="text-xs text-slate-400">Pilih pesan di sebelah kiri untuk membaca isi surat.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: GOOGLE DRIVE & DOCS EXPLORER (SPLIT-PANE) */}
      {workspaceMode === 'drive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Daftar Berkas & Filter (5 Cols) */}
          <div
            className={`lg:col-span-5 rounded-3xl border p-5 ${
              isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <GoogleDriveIcon className="h-5 w-5 shrink-0" />
                <h3 className="text-sm font-bold">Berkas Drive ({filteredDriveItems.length})</h3>
              </div>
              <span className="text-[11px] text-slate-400">Pilih untuk pratinjau</span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'docs', label: 'Docs' },
                { id: 'sheets', label: 'Sheets' },
                { id: 'slides', label: 'Slides' },
                { id: 'colab', label: 'Colab' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDriveFilter(f.id as any)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    driveFilter === f.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative mb-3.5">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                placeholder="Cari nama berkas, dokumen, spreadsheet..."
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs ${
                  isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
                }`}
              />
            </div>

            {/* Files List */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredDriveItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Tidak ada berkas yang cocok dengan pencarian atau filter.
                </p>
              ) : (
                filteredDriveItems.map((item) => {
                  const isSelected = item.id === activeDriveId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedDriveId(item.id);
                        setDocSummaryResult(null);
                      }}
                      className={`w-full text-left rounded-2xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-emerald-500/60 bg-[#1e2436] shadow-md ring-1 ring-emerald-500/40'
                          : isDark
                          ? 'border-white/[0.06] bg-[#171c29]/70 hover:border-white/15 hover:bg-[#1a2133]'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.06]">
                          {getDriveItemIcon(item.title, item.subtitle)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold text-white">
                            {item.title}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-400">
                              {item.subtitle}
                            </span>
                            <span className="truncate">{item.snippet}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: Document Inspection & Preview Pane (7 Cols) */}
          <div
            className={`lg:col-span-7 rounded-3xl border p-6 space-y-5 ${
              isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
            }`}
          >
            {selectedDrive ? (
              <>
                {/* Header */}
                <div className="border-b border-white/[0.08] pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Drive Document Inspector
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          handleConvertToTask(
                            selectedDrive.title,
                            selectedDrive.title.toLowerCase().includes('unpam') ||
                              selectedDrive.title.toLowerCase().includes('laporan') ||
                              selectedDrive.title.endsWith('.ipynb')
                              ? 'kuliah'
                              : 'klien',
                            selectedDrive.subtitle,
                            selectedDrive.web_link
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-orange-500 hover:text-white transition-colors"
                      >
                        <Plus size={12} />
                        <span>Jadikan Tugas</span>
                      </button>
                      <button
                        onClick={() => handleCopyText(selectedDrive.web_link, 'Tautan berkas')}
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white/10 transition-colors"
                      >
                        <Share2 size={12} />
                        <span>Salin Link</span>
                      </button>
                      <a
                        href={selectedDrive.web_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-emerald-600/15 border border-emerald-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        <span>Buka di Google</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08]">
                      {getDriveItemIcon(selectedDrive.title, selectedDrive.subtitle)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white leading-snug">
                        {selectedDrive.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {selectedDrive.subtitle}
                        </span>
                        <span>•</span>
                        <span>{selectedDrive.snippet}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Information & Storage Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-[#0b0e14] p-3">
                    <div className="text-[10px] text-slate-400">Tipe Berkas</div>
                    <div className="mt-1 text-xs font-bold text-slate-200 truncate">
                      {selectedDrive.subtitle}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-[#0b0e14] p-3">
                    <div className="text-[10px] text-slate-400">Penyimpanan</div>
                    <div className="mt-1 text-xs font-bold text-emerald-400">
                      Google Cloud Drive
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-[#0b0e14] p-3">
                    <div className="text-[10px] text-slate-400">Status Sinkronisasi</div>
                    <div className="mt-1 text-xs font-bold text-slate-200">
                      Tersimpan di SQLite
                    </div>
                  </div>
                </div>

                {/* Excerpt Container */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14] p-5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3">
                    <span className="text-xs font-semibold text-slate-400">Metadata & Catatan Berkas:</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {selectedDrive.id}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Berkas "{selectedDrive.title}" siap dibuka dan disinkronkan ke seluruh modul AI & Telegram Bot. Anda dapat mengubah berkas ini menjadi tugas kanban atau membuat ringkasan eksekutif secara instan.
                  </p>
                </div>

                {/* AI Gemini Document Analyzer */}
                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-teal-500/[0.03] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-400" />
                      <h4 className="text-xs font-bold text-white">Bedah & Rangkum Dokumen via AI Gemini</h4>
                    </div>
                    <button
                      onClick={handleSummarizeDoc}
                      disabled={docSummaryLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <Sparkles size={12} />
                      <span>{docSummaryLoading ? 'Menganalisis...' : 'Bedah Dokumen'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Ekstrak poin penting, garis besar dokumen, dan daftar tindak lanjut tanpa perlu membaca berkas manual halaman demi halaman.
                  </p>

                  {docSummaryLoading && (
                    <div className="flex items-center gap-2 py-4 text-xs text-emerald-400">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Gemini sedang menganalisis dokumen dan menyusun poin kunci...</span>
                    </div>
                  )}

                  {docSummaryResult && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-white/[0.08]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-400">
                          Hasil Ringkasan & Action Items:
                        </span>
                        <button
                          onClick={() => handleCopyText(docSummaryResult, 'Ringkasan dokumen')}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/10 transition-colors"
                        >
                          <Copy size={12} />
                          <span>Salin Ringkasan</span>
                        </button>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#0b0e14] p-3 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {docSummaryResult}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <FileText size={32} className="mx-auto text-slate-500 mb-2 opacity-50" />
                <p className="text-xs text-slate-400">Pilih berkas di sebelah kiri untuk melihat detail dokumen.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: HUB RINGKASAN (2 KOLOM TRADISIONAL) */}
      {workspaceMode === 'hub' && (
        <>
          {/* Quick Create Google Doc Bar */}
          <form
            onSubmit={handleCreateGoogleDoc}
            className={`flex flex-wrap items-center gap-3 rounded-3xl border p-5 ${
              isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <FolderPlus size={16} className="text-orange-500" />
              <span>Buat Google Doc Baru di Drive:</span>
            </div>
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Contoh: Proposal Teknis Sistem ERP / Laporan Tugas Kuliah UNPAM..."
              className={`flex-1 min-w-[240px] rounded-xl border px-3.5 py-2 text-xs ${
                isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-slate-50'
              }`}
            />
            <button
              type="submit"
              disabled={creatingDoc}
              className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              {creatingDoc ? 'Membuat di Google Docs...' : '+ Buat & Buka Google Doc'}
            </button>
          </form>

          {/* Two Columns: Google Drive Files & Gmail Messages */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Column 1: Google Drive */}
            <div
              className={`rounded-3xl border p-6 ${
                isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <GoogleDriveIcon className="h-5 w-5 shrink-0" />
                  <h3 className="text-base font-bold">Berkas Google Drive Terbaru ({driveItems.length})</h3>
                </div>
                <button
                  onClick={() => setWorkspaceMode('drive')}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                >
                  <span>Buka Split Explorer</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-3">
                {driveItems.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    Klik tombol "Sinkronkan Drive & Gmail Sekarang" untuk memuat berkas Google Drive Anda.
                  </p>
                ) : (
                  driveItems.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -2 }}
                      onClick={() => {
                        setSelectedDriveId(item.id);
                        setWorkspaceMode('drive');
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors ${
                        isDark ? 'border-white/[0.06] bg-[#171c29] hover:border-emerald-500/40' : 'border-slate-200/70 bg-slate-50/80 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.06]">
                          {getDriveItemIcon(item.title, item.subtitle)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold text-white hover:text-emerald-400 transition-colors">
                            {item.title}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                              {item.subtitle}
                            </span>
                            <span className="truncate">• {item.snippet}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            handleConvertToTask(
                              item.title,
                              item.title.toLowerCase().includes('unpam') ||
                                item.title.toLowerCase().includes('laporan') ||
                                item.title.endsWith('.ipynb')
                                ? 'kuliah'
                                : 'klien',
                              item.subtitle,
                              item.web_link
                            )
                          }
                          title="Jadikan Tugas di Kanban"
                          className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-orange-500 hover:text-white transition-colors"
                        >
                          + Tugas
                        </button>
                        {item.web_link && (
                          <a
                            href={item.web_link}
                            target="_blank"
                            rel="noreferrer"
                            title="Buka langsung di Google"
                            className="flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                          >
                            <span>Buka</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Gmail Inbox */}
            <div
              className={`rounded-3xl border p-6 ${
                isDark ? 'border-white/[0.07] bg-[#121621]' : 'border-slate-200/80 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <GmailIcon className="h-5 w-5 shrink-0" />
                  <h3 className="text-base font-bold">Kotak Masuk Gmail ({gmailItems.length})</h3>
                </div>
                <button
                  onClick={() => setWorkspaceMode('gmail')}
                  className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:underline"
                >
                  <span>Buka Split Reader</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-3">
                {gmailItems.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    Klik tombol "Sinkronkan Drive & Gmail Sekarang" untuk memuat pesan Gmail terbaru.
                  </p>
                ) : (
                  gmailItems.map((mail) => (
                    <motion.div
                      key={mail.id}
                      whileHover={{ y: -2 }}
                      onClick={() => {
                        setSelectedGmailId(mail.id);
                        setWorkspaceMode('gmail');
                      }}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-colors ${
                        isDark ? 'border-white/[0.06] bg-[#171c29] hover:border-red-500/40' : 'border-slate-200/70 bg-slate-50/80 hover:border-red-500/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.06]">
                          <GmailIcon className="h-5 w-5 shrink-0" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold text-white hover:text-red-400 transition-colors">
                            {mail.title}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] font-medium text-orange-400">
                            {mail.subtitle}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{mail.snippet}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              handleConvertToTask(
                                `Tindak Lanjut Email: ${mail.title.slice(0, 45)}`,
                                'klien',
                                mail.subtitle.slice(0, 35),
                                mail.web_link
                              )
                            }
                            className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold hover:bg-orange-500 hover:text-white"
                          >
                            <Plus size={11} className="inline mr-0.5" />
                            Tugas
                          </button>
                          <a
                            href={mail.web_link || 'https://mail.google.com'}
                            target="_blank"
                            rel="noreferrer"
                            title="Buka di Gmail"
                            className="flex items-center gap-1 rounded-lg bg-red-500/15 border border-red-500/30 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <span>Buka</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
