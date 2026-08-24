'use client';

import React, { useState } from 'react';
import { useStreamContext, ShortItem } from '@/context/StreamContext';
import { Video, Plus, Trash2, Edit2, X, Play, Youtube, AlertTriangle } from 'lucide-react';

export default function AdminShortsPage() {
  const { shorts, addShort, deleteShort } = useStreamContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmShort, setDeleteConfirmShort] = useState<ShortItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !youtubeId) return;

    addShort({
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      youtubeId,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80',
    });

    setTitle('');
    setSlug('');
    setYoutubeId('');
    setThumbnail('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Kelola Shorts (Vision Short)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manajemen video klip vertikal pendek yang ditampilkan pada carousel Vision Short.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 text-xs font-bold shadow-lg shadow-red-900/40 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Short Baru</span>
        </button>
      </div>

      {/* Shorts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 font-sans">
        {shorts.map((item) => (
          <div key={item.id} className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden group shadow-xl relative">
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
              
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#E50914] text-white font-mono text-[10px] font-bold uppercase">
                SHORT
              </div>

              <div className="absolute bottom-3 left-3 right-3 space-y-1">
                <span className="font-bold text-white text-xs block line-clamp-2">{item.title}</span>
                <span className="text-[10px] text-neutral-400 font-mono block">ID: {item.youtubeId}</span>
              </div>
            </div>

            <div className="p-3 bg-[#121212] flex items-center justify-between border-t border-white/5">
              <span className="text-[10px] text-neutral-500 font-mono">/{item.slug}</span>
              <button
                onClick={() => setDeleteConfirmShort(item)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                title="Hapus Short"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD SHORT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl space-y-4 font-sans">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Video className="w-4 h-4 text-[#E50914]" /> Tambah Vision Short Baru
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Judul Video Short</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Juventude Resistensia"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1 font-mono">Slug URL</label>
                <input
                  type="text"
                  placeholder="misal: juventude-resistensia"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1 font-mono">Link YouTube Shorts / ID Video</label>
                <input
                  type="text"
                  required
                  placeholder="misal: 2g811Eo7K8U"
                  value={youtubeId}
                  onChange={(e) => setYoutubeId(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Custom Thumbnail URL (Opsional)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E50914] text-white hover:bg-red-700 font-bold shadow-lg shadow-red-900/30 cursor-pointer"
                >
                  Simpan Short
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE SHORT MODAL */}
      {deleteConfirmShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans animate-in fade-in">
          <div className="bg-[#121212] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Short</h3>
                <p className="text-xs text-neutral-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
              <p className="text-neutral-300">
                Apakah Anda yakin ingin menghapus short <strong className="text-white">"{deleteConfirmShort.title}"</strong> secara permanen?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmShort(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold text-xs cursor-pointer"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  deleteShort(deleteConfirmShort.id);
                  setIsDeleting(false);
                  setDeleteConfirmShort(null);
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
