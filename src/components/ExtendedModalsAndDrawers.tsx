import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Printer,
  ArrowLeftRight,
  Lock,
} from 'lucide-react';
import type { DashboardState, TaskItem, InvoiceItem } from '../types';

export function TaskDetailDrawer({
  task,
  isDark,
  onClose,
  onRefreshState,
  showToast,
  setErrorMsg,
}: {
  task: TaskItem | null;
  isDark: boolean;
  onClose: () => void;
  onRefreshState: (next: DashboardState) => void;
  showToast: (msg: string) => void;
  setErrorMsg: (msg: string | null) => void;
}) {
  const [subtaskInput, setSubtaskInput] = useState('');
  const [creatingDoc, setCreatingDoc] = useState(false);

  if (!task) return null;

  const doneCount = (task.subtasks || []).filter((s) => s.is_done).length;
  const totalSub = (task.subtasks || []).length;
  const pct = totalSub === 0 ? 0 : Math.round((doneCount / totalSub) * 100);

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;
    try {
      const res = await fetch('/api/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id, title: subtaskInput.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        onRefreshState(json);
        setSubtaskInput('');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleSubtask = async (id: string) => {
    try {
      const res = await fetch('/api/subtasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (res.ok) onRefreshState(json);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    try {
      const res = await fetch(`/api/subtasks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) onRefreshState(json);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateDocForTask = async () => {
    setCreatingDoc(true);
    try {
      const res = await fetch('/api/google', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          title: `[${task.scope.toUpperCase()}] ${task.title}`,
          content: `Judul Tugas: ${task.title}\nKlien / Mata Kuliah: ${task.subject_or_client}\nTenggat: ${task.due_date}\nCatatan: ${task.notes}\n`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onRefreshState(json.state);
      showToast('Google Doc berhasil dibuat & ditautkan ke tugas ini!');
      if (json.doc?.docUrl) window.open(json.doc.docUrl, '_blank');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreatingDoc(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          onClick={(e) => e.stopPropagation()}
          className={`flex h-full w-full max-w-md flex-col justify-between overflow-y-auto border-l p-6 shadow-2xl ${
            isDark ? 'border-white/10 bg-[#0d1117] text-white' : 'border-slate-200 bg-white text-slate-900'
          }`}
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-500/10 pb-4">
              <div>
                <span className="rounded bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-500">
                  {task.scope} • {task.priority}
                </span>
                <h3 className="mt-2 text-lg font-bold">{task.title}</h3>
                <p className="text-xs text-slate-400">{task.subject_or_client}</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5">
                <X size={18} />
              </button>
            </div>

            {/* Google Docs Integration Link */}
            <div
              className={`rounded-2xl border p-4 text-xs ${
                isDark ? 'border-white/10 bg-[#131722]' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Dokumen Kerja (Google Docs / Drive)</span>
                {task.drive_link ? (
                  <a
                    href={task.drive_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-orange-500 hover:underline"
                  >
                    <span>Buka Dokumen</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <button
                    onClick={handleCreateDocForTask}
                    disabled={creatingDoc}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold text-white"
                  >
                    <FileText size={12} />
                    <span>{creatingDoc ? 'Membuat...' : '+ Buat Google Doc'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Subtasks Checklist */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>Checklist Sub-Tugas ({doneCount}/{totalSub})</span>
                <span className="font-mono text-orange-500">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-500/15 mb-4">
                <div
                  style={{ width: `${pct}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                {(task.subtasks || []).map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs ${
                      isDark ? 'border-white/[0.06] bg-[#131722]' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleSubtask(sub.id)}
                      className="flex items-center gap-2.5 text-left flex-1"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          sub.is_done
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-400'
                        }`}
                      >
                        {sub.is_done && <Check size={11} />}
                      </span>
                      <span className={sub.is_done ? 'line-through text-slate-400' : ''}>
                        {sub.title}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="text-rose-400 hover:bg-rose-500/10 p-1 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Tambah langkah kerja baru..."
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs ${
                    isDark ? 'border-white/10 bg-[#131722]' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white"
                >
                  <Plus size={14} />
                </button>
              </form>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-500/10 text-[11px] text-slate-400 font-mono">
            ID: {task.id} • Tenggat: {task.due_date} • Nilai/SKS: {task.budget_or_weight}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
