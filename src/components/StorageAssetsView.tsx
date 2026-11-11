import React, { useState, useRef } from 'react';
import {
  HardDrive,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  FileArchive,
  File as FileGeneric,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  Search,
  Layers,
  Sparkles,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Play,
  Download,
  X,
} from 'lucide-react';
import { StorageAsset, StorageAssetStats } from '../types';

interface StorageAssetsViewProps {
  assets: StorageAsset[];
  stats?: StorageAssetStats;
  onRefresh?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const StorageAssetsView: React.FC<StorageAssetsViewProps> = ({
  assets,
  stats,
  onRefresh,
  showToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'ALL' | 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<StorageAsset | null>(null);
  const [assetTagInput, setAssetTagInput] = useState('UNPAM, Klien');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCount = stats?.totalCount ?? assets.length;
  const totalCompressedSize =
    stats?.totalCompressedSize ?? assets.reduce((s, a) => s + a.compressed_size, 0);
  const totalOriginalSize =
    stats?.totalOriginalSize ?? assets.reduce((s, a) => s + a.original_size, 0);
  const totalSavedBytes =
    stats?.totalSavedBytes ?? Math.max(0, totalOriginalSize - totalCompressedSize);
  const overallSavedPercentage =
    stats?.overallSavedPercentage ??
    (totalOriginalSize > 0
      ? Number(((totalSavedBytes / totalOriginalSize) * 100).toFixed(1))
      : 0);
  const s3Bucket = stats?.bucket || 'nexus-assets';
  const s3Endpoint = stats?.endpoint || 'Configured via ENV';
  const s3ConsoleUrl = stats?.consoleUrl || '';

  const handleCopyUrl = (url: string, id: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      if (showToast) showToast('URL MinIO S3 berhasil disalin ke clipboard.', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      if (showToast) showToast('Gagal menyalin link.', 'error');
    }
  };

  const handleProcessFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgressText(`Memproses & menganalisis ${file.name}...`);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const commaIdx = res.indexOf(',');
          resolve(commaIdx !== -1 ? res.slice(commaIdx + 1) : res);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const dataBase64 = await base64Promise;

      const tagsArray = assetTagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      setUploadProgressText(`Mengunggah ke MinIO S3 (${s3Bucket})...`);

      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataBase64,
          tags: tagsArray,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Gagal mengunggah ke MinIO S3.');
      }

      if (showToast) {
        const savedPct = json.asset?.compression_ratio || 0;
        const msg =
          savedPct > 0
            ? `${json.asset.name} berhasil disimpan di S3! Hemat ${savedPct}% ruang.`
            : `${json.asset.name} berhasil disimpan di MinIO S3.`;
        showToast(msg, 'success');
      }

      if (onRefresh) onRefresh();
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Gagal memproses file.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgressText(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus asset "${name}" dari MinIO S3?`)) return;

    try {
      const res = await fetch('/api/assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Gagal menghapus file.');

      if (showToast) showToast(`Asset "${name}" berhasil dihapus dari MinIO.`, 'info');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Gagal menghapus asset.', 'error');
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchCategory =
      selectedCategory === 'ALL' || asset.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      !q ||
      asset.name.toLowerCase().includes(q) ||
      (asset.tags || []).some((t) => t.toLowerCase().includes(q));
    return matchCategory && matchQuery;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-emerald-400" />;
      case 'video':
        return <VideoIcon className="h-4 w-4 text-rose-400" />;
      case 'document':
        return <FileText className="h-4 w-4 text-sky-400" />;
      case 'audio':
        return <AudioIcon className="h-4 w-4 text-purple-400" />;
      case 'archive':
        return <FileArchive className="h-4 w-4 text-amber-400" />;
      default:
        return <FileGeneric className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & S3 HUB BANNER */}
      <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#171c29] text-white">
              <HardDrive className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  MinIO S3 Asset Storage & Auto-Compress
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  CT 105 Online
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-mono text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-sky-400" />
                  Bucket: {s3Bucket}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 font-mono">
                <span className="text-slate-300">Endpoint: {s3Endpoint}</span>
                <span>•</span>
                <span>Inline Streaming (Anti-Download Paksa)</span>
                <span>•</span>
                <span>In-App Previewer Aktif</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
            {s3ConsoleUrl && (
              <a
                href={s3ConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> MinIO Console
              </a>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200 transition disabled:opacity-50"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              {isUploading ? 'Mengunggah...' : 'Unggah File'}
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition"
                title="Refresh Storage"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BENTO 4 STORAGE KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Assets */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Total Asset Tersimpan</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="my-3 font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
            {totalCount} File
          </div>
          <p className="text-xs text-slate-400">
            Tersimpan di bucket &apos;{s3Bucket}&apos; MinIO CT 105
          </p>
        </div>

        {/* Card 2: Space Terpakai */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Storage Terpakai</span>
            <HardDrive className="h-4 w-4 text-slate-400" />
          </div>
          <div className="my-3 font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
            {formatBytes(totalCompressedSize)}
          </div>
          <p className="text-xs text-slate-400">
            Kapasitas disk S3 aktual di server Proxmox
          </p>
        </div>

        {/* Card 3: Ukuran Asli */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Ukuran Sebelum Kompresi</span>
            <ArrowDownRight className="h-4 w-4 text-slate-400" />
          </div>
          <div className="my-3 font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
            {formatBytes(totalOriginalSize)}
          </div>
          <p className="text-xs text-slate-400">
            Total bobot mentah file input pengguna
          </p>
        </div>

        {/* Card 4: Ruang Terhemat */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Efisiensi Ruang Dihemat</span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold tracking-tight text-emerald-400 tabular-nums">
              {overallSavedPercentage}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {formatBytes(totalSavedBytes)} irit
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${Math.min(100, overallSavedPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. DRAG & DROP UPLOAD ZONE */}
      <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Unggah File Asset (Foto, Video, PDF, Dokumen, Arsip)
            </h3>
            <p className="text-xs text-slate-400">
              Mendukung video MP4/MOV, dokumen PDF, gambar WebP/PNG/JPG, audio, dan arsip dengan mode tayang inline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Tag Default:</span>
            <input
              type="text"
              value={assetTagInput}
              onChange={(e) => setAssetTagInput(e.target.value)}
              placeholder="UNPAM, Klien, Makalah..."
              className="rounded-full border border-white/10 bg-[#171c29] px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.json,.csv"
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? 'border-white bg-white/[0.06]'
              : 'border-white/15 bg-[#171c29]/60 hover:border-white/30 hover:bg-[#171c29]'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <UploadCloud className="h-6 w-6 text-slate-200" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Tarik & jatuhkan file di sini, atau klik untuk memilih
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Mendukung Video (MP4, MOV, WebM), PDF, Gambar, Audio & Dokumen hingga 50 MB
            </p>
          </div>
          {isUploading && uploadProgressText && (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-mono text-white animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{uploadProgressText}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. FILTER PILLS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `Semua (${assets.length})` },
            { id: 'image', label: 'Gambar' },
            { id: 'video', label: 'Video' },
            { id: 'document', label: 'Dokumen & PDF' },
            { id: 'audio', label: 'Audio' },
            { id: 'archive', label: 'Arsip (ZIP/RAR)' },
            { id: 'other', label: 'Lainnya' },
          ].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`rounded-full px-4 py-1.5 text-xs transition ${
                  active
                    ? 'bg-white text-slate-950 font-bold shadow-sm'
                    : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] font-medium'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari asset atau tag..."
            className="w-full rounded-full border border-white/10 bg-[#121621] pl-8 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* 5. ASSET GRID / CARDS */}
      {filteredAssets.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.07] bg-[#121621] p-12 text-center">
          <HardDrive className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h4 className="text-sm font-bold text-white">Belum Ada File Asset</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Gunakan area upload di atas untuk menambahkan video, foto, PDF skripsi, atau materi kuliah ke MinIO S3.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const isImage = asset.category === 'image';
            const isVideo = asset.category === 'video';
            const isPdf =
              asset.mime_type === 'application/pdf' ||
              asset.name.toLowerCase().endsWith('.pdf');
            const savedPct = asset.compression_ratio || 0;
            const isCopied = copiedId === asset.id;
            const rawViewUrl = `/api/assets/raw?id=${asset.id}`;

            return (
              <div
                key={asset.id}
                className="rounded-3xl border border-white/[0.07] bg-[#121621] p-5 flex flex-col justify-between hover:border-white/20 transition duration-200 group"
              >
                <div>
                  {/* Card Header & Preview */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#171c29]">
                        {getCategoryIcon(asset.category)}
                      </div>
                      <div className="overflow-hidden">
                        <h4
                          className="text-xs font-bold text-white truncate"
                          title={asset.name}
                        >
                          {asset.name}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-400">
                          {asset.created_at}
                        </p>
                      </div>
                    </div>

                    {savedPct > 0 ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                        Hemat {savedPct}%
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-slate-400">
                        {asset.category.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* 1. Image Thumbnail Preview */}
                  {isImage && (
                    <div
                      onClick={() => setPreviewAsset(asset)}
                      className="cursor-pointer mt-3.5 h-36 w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#171c29] relative group/thumb"
                    >
                      <img
                        src={rawViewUrl}
                        alt={asset.name}
                        className="h-full w-full object-cover transition duration-300 group-hover/thumb:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-semibold text-white">
                        <Eye className="h-4 w-4" /> Lihat Foto Full
                      </div>
                    </div>
                  )}

                  {/* 2. Video Thumbnail & Player Trigger */}
                  {isVideo && (
                    <div
                      onClick={() => setPreviewAsset(asset)}
                      className="cursor-pointer mt-3.5 h-36 w-full overflow-hidden rounded-2xl border border-rose-500/20 bg-[#171c29] relative group/video flex flex-col items-center justify-center"
                    >
                      <video
                        src={rawViewUrl}
                        className="h-full w-full object-cover opacity-60"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 transition group-hover/video:bg-black/60">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-950 shadow-xl transition group-hover/video:scale-110">
                          <Play className="h-5 w-5 fill-slate-950 ml-0.5" />
                        </div>
                        <span className="text-[11px] font-semibold text-white">
                          Putar Video Inline
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3. PDF Interactive Box */}
                  {isPdf && (
                    <div
                      onClick={() => setPreviewAsset(asset)}
                      className="cursor-pointer mt-3.5 h-32 w-full rounded-2xl border border-sky-500/20 bg-[#171c29] p-4 flex flex-col justify-between hover:border-sky-500/40 transition group/pdf"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-full">
                          DOKUMEN PDF
                        </span>
                        <Eye className="h-4 w-4 text-sky-400 group-hover/pdf:scale-110 transition" />
                      </div>
                      <p className="text-xs font-medium text-slate-200 line-clamp-2">
                        {asset.name}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-sky-300 font-semibold">
                        <span>Baca Langsung di Dashboard</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </div>
                  )}

                  {/* 4. Other Documents & Archives */}
                  {!isImage && !isVideo && !isPdf && (
                    <div
                      onClick={() => setPreviewAsset(asset)}
                      className="cursor-pointer mt-3.5 h-28 w-full rounded-2xl border border-white/[0.06] bg-[#171c29] p-3.5 flex flex-col justify-between hover:bg-[#1a2030] transition"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-mono text-[10px] uppercase">
                          {asset.mime_type.split('/')[1] || 'FILE'}
                        </span>
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <p className="text-xs font-medium text-slate-200 line-clamp-2">
                        {asset.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Klik untuk melihat detail & opsi file
                      </p>
                    </div>
                  )}

                  {/* Metadata Stats */}
                  <div className="mt-3.5 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Ukuran Asli</span>
                      <span className="text-slate-300 font-semibold">
                        {formatBytes(asset.original_size)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Di MinIO S3</span>
                      <span className="text-emerald-400 font-semibold">
                        {formatBytes(asset.compressed_size)}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {asset.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-mono text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] hover:bg-white/15 px-3 py-1 text-[11px] font-semibold text-white transition"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Lihat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(asset.url, asset.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition"
                      title="Salin URL S3"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-400" />
                          <span>URL S3</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={rawViewUrl}
                      download={asset.name}
                      className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
                      title="Unduh File"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(asset.id, asset.name)}
                      className="p-1.5 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Hapus file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. UNIVERSAL IN-DASHBOARD MODAL LIGHTBOX PREVIEWER (Foto, Video & PDF) */}
      {previewAsset && (
        <div
          onClick={() => setPreviewAsset(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full max-h-[92vh] flex flex-col rounded-3xl border border-white/15 bg-[#121621] p-5 sm:p-6 shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="overflow-hidden pr-3">
                <h3 className="text-sm font-bold text-white truncate max-w-xl">
                  {previewAsset.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  {formatBytes(previewAsset.compressed_size)} • {previewAsset.mime_type} •{' '}
                  {previewAsset.category.toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Media View Area */}
            <div className="my-4 flex-1 min-h-[300px] max-h-[68vh] overflow-auto rounded-2xl border border-white/10 bg-black flex items-center justify-center relative">
              {/* VIDEO VIEWER */}
              {previewAsset.category === 'video' && (
                <video
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[68vh] w-full rounded-2xl bg-black"
                >
                  <source src={`/api/assets/raw?id=${previewAsset.id}`} type={previewAsset.mime_type} />
                  <source src={previewAsset.url} type={previewAsset.mime_type} />
                  Browser Anda tidak mendukung tag pemutar video HTML5.
                </video>
              )}

              {/* PDF INLINE VIEWER */}
              {(previewAsset.mime_type === 'application/pdf' ||
                previewAsset.name.toLowerCase().endsWith('.pdf')) && (
                <iframe
                  src={`/api/assets/raw?id=${previewAsset.id}#toolbar=1`}
                  className="h-[68vh] w-full rounded-2xl border-0 bg-white"
                  title={previewAsset.name}
                />
              )}

              {/* IMAGE VIEWER */}
              {previewAsset.category === 'image' && (
                <img
                  src={`/api/assets/raw?id=${previewAsset.id}`}
                  alt={previewAsset.name}
                  className="max-h-[68vh] max-w-full w-auto object-contain rounded-xl"
                />
              )}

              {/* AUDIO VIEWER */}
              {previewAsset.category === 'audio' && (
                <div className="p-8 text-center space-y-4">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
                    <AudioIcon className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">{previewAsset.name}</h4>
                  <audio controls autoPlay className="w-full max-w-md mx-auto">
                    <source src={`/api/assets/raw?id=${previewAsset.id}`} type={previewAsset.mime_type} />
                  </audio>
                </div>
              )}

              {/* GENERIC FILE / ARCHIVE VIEWER */}
              {previewAsset.category !== 'video' &&
                previewAsset.category !== 'image' &&
                previewAsset.category !== 'audio' &&
                previewAsset.mime_type !== 'application/pdf' &&
                !previewAsset.name.toLowerCase().endsWith('.pdf') && (
                  <div className="p-8 text-center space-y-4">
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
                      {getCategoryIcon(previewAsset.category)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{previewAsset.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Format file ini tidak dapat ditayangkan langsung di browser. Silakan unduh untuk membukanya.
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer & Actions */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-md">
                S3 Key: {previewAsset.s3_key}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewAsset.url, previewAsset.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Salin URL S3</span>
                </button>
                <a
                  href={`/api/assets/raw?id=${previewAsset.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  <span>Buka Tab Baru</span>
                </a>
                <a
                  href={`/api/assets/raw?id=${previewAsset.id}`}
                  download={previewAsset.name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
