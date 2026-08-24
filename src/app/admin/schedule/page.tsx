'use client';

import React, { useState } from 'react';
import { useStreamContext, ScheduleItem } from '@/context/StreamContext';
import { Calendar, Plus, Edit2, Trash2, X, Clock, Tv, Radio, User, Layers, AlertTriangle } from 'lucide-react';

export default function AdminSchedulePage() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, categories } = useStreamContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [deleteConfirmSchedule, setDeleteConfirmSchedule] = useState<ScheduleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for New Schedule
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [type, setType] = useState<'tv' | 'radio'>('tv');
  const [timeStart, setTimeStart] = useState('08:00');
  const [timeEnd, setTimeEnd] = useState('10:00');
  const [category, setCategory] = useState(categories[0] || 'TV On Demand');
  const [day, setDay] = useState<'Hari Ini' | 'Besok'>('Hari Ini');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addSchedule({
      type,
      channelId: type === 'tv' ? 'rtm-tv1' : 'radio-main',
      title: title.trim(),
      host: host.trim() || 'Studio RTM',
      timeStart,
      timeEnd,
      category: category || (categories[0] || 'RTM Maubere'),
      day,
      description: description.trim(),
    });

    // Reset
    setTitle('');
    setHost('');
    setTimeStart('08:00');
    setTimeEnd('10:00');
    setDescription('');
    setIsAddModalOpen(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    updateSchedule(editingSchedule);
    setEditingSchedule(null);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#E50914]" /> Kelola Jadwal Acara (EPG)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Atur agenda jam tayang siaran TV Live & Radio Online untuk Hari Ini & Besok.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 text-xs font-extrabold shadow-lg shadow-red-900/40 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal Acara Baru</span>
        </button>
      </div>

      {/* Schedule Table */}
      <div className="rounded-2xl border border-white/5 bg-[#121212] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-sans min-w-[850px]">
            <thead className="bg-black/60 text-neutral-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3.5 px-4 w-32">Jam & Hari</th>
                <th className="py-3.5 px-4 w-28">Media Tipe</th>
                <th className="py-3.5 px-4">Nama Program & Host</th>
                <th className="py-3.5 px-4 w-40">Kategori</th>
                <th className="py-3.5 px-4 text-right w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {schedules.map((sch) => (
                <tr key={sch.id} className="hover:bg-white/5 transition-colors">
                  
                  {/* Time & Day */}
                  <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span className="text-white text-xs block">{sch.timeStart} - {sch.timeEnd}</span>
                      <span className="text-[10px] text-[#E50914] block">{sch.day}</span>
                    </div>
                  </td>

                  {/* Media Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border font-sans ${
                      sch.type === 'tv'
                        ? 'bg-blue-950 text-cyan-300 border-cyan-500/30'
                        : 'bg-amber-950 text-amber-300 border-amber-500/30'
                    }`}>
                      {sch.type === 'tv' ? <Tv className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                      <span>{sch.type === 'tv' ? 'TV' : 'Radio'}</span>
                    </span>
                  </td>

                  {/* Title & Host */}
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="font-bold text-white text-xs block">{sch.title}</span>
                      <span className="text-[11px] text-neutral-400 font-sans block mt-0.5">
                        Penyiar / Host: <strong className="text-white">{sch.host || 'Studio RTM'}</strong>
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[11px]">
                      <Layers className="w-3 h-3 text-[#E50914]" />
                      <span>{sch.category}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      <button
                        onClick={() => setEditingSchedule(sch)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 cursor-pointer"
                        title="Edit Jadwal"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmSchedule(sch)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-white/10 shadow-2xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" /> Edit Jadwal Acara
              </h3>
              <button onClick={() => setEditingSchedule(null)} className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-sans">
              
              <div>
                <label className="block font-bold text-neutral-200 mb-1">Judul Program Acara</label>
                <input
                  type="text"
                  required
                  value={editingSchedule.title}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, title: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-200 mb-1">Tipe Media</label>
                  <select
                    value={editingSchedule.type}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, type: e.target.value as 'tv' | 'radio' })}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="tv">TV Live</option>
                    <option value="radio">Radio Online</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-200 mb-1">Hari Tayang</label>
                  <select
                    value={editingSchedule.day}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, day: e.target.value as 'Hari Ini' | 'Besok' })}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="Hari Ini">Hari Ini</option>
                    <option value="Besok">Besok</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-200 mb-1 font-mono">Jam Mulai</label>
                  <input
                    type="text"
                    required
                    placeholder="08:00"
                    value={editingSchedule.timeStart}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, timeStart: e.target.value })}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-200 mb-1 font-mono">Jam Selesai</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00"
                    value={editingSchedule.timeEnd}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, timeEnd: e.target.value })}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-200 mb-1">Penyiar / Host</label>
                <input
                  type="text"
                  placeholder="misal: DJ Alarico & Maria"
                  value={editingSchedule.host}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, host: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-200 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editingSchedule.description}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, description: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 font-bold shadow-lg shadow-red-900/30"
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-white/10 shadow-2xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E50914]" /> Tambah Jadwal Acara Baru
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-sans">
              
              <div>
                <label className="block font-bold text-neutral-200 mb-1">Judul Program Acara</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Warta Pagi RTM"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-200 mb-1">Tipe Media</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'tv' | 'radio')}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="tv">TV Live</option>
                    <option value="radio">Radio Online</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-200 mb-1">Hari Tayang</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as 'Hari Ini' | 'Besok')}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="Hari Ini">Hari Ini</option>
                    <option value="Besok">Besok</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-200 mb-1 font-mono">Jam Mulai</label>
                  <input
                    type="text"
                    required
                    placeholder="08:00"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-200 mb-1 font-mono">Jam Selesai</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-200 mb-1">Penyiar / Host</label>
                <input
                  type="text"
                  placeholder="misal: DJ Alarico & Maria"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-200 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat seputar acara..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 font-bold shadow-lg shadow-red-900/30"
                >
                  Simpan & Buat Jadwal
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE SCHEDULE MODAL */}
      {deleteConfirmSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans animate-in fade-in">
          <div className="bg-[#121212] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Jadwal</h3>
                <p className="text-xs text-neutral-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
              <p className="text-neutral-300">
                Apakah Anda yakin ingin menghapus jadwal acara <strong className="text-white">"{deleteConfirmSchedule.title}"</strong> secara permanen?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmSchedule(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold text-xs cursor-pointer"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  deleteSchedule(deleteConfirmSchedule.id);
                  setIsDeleting(false);
                  setDeleteConfirmSchedule(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-900/40 cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
