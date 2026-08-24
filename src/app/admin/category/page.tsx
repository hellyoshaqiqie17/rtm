'use client';

import React, { useState } from 'react';
import { useStreamContext } from '@/context/StreamContext';
import { Layers, Plus, Search, Trash2, X, AlertTriangle } from 'lucide-react';

const categoryBgs: Record<string, string> = {
  'TV On Demand': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80',
  'Dokumenter': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
  'Kesehatan': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80',
  'Ekonomi': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=80',
  'Pendidikan': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=80',
  'RTM Maubere': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80',
};

export default function AdminCategoryPage() {
  const { categories, addCategory, deleteCategory, channels } = useStreamContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory(name.trim());
    setName('');
    setIsModalOpen(false);
  };

  const filtered = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#E50914]" /> Kelola Kategori Siaran
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Tambah dan hapus kategori program siaran TV & Radio RTM MAUBERE secara permanen.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 text-xs font-bold shadow-lg shadow-red-900/40 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Cari nama kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#E50914]"
        />
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {filtered.map((catName, idx) => {
          const count = channels.filter((c) => (c.category || 'TV On Demand') === catName).length;
          const bg = categoryBgs[catName] || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80';
          const slug = catName.toLowerCase().trim().replace(/\s+/g, '-');

          return (
            <div key={idx} className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden group shadow-xl relative">
              <div className="relative h-32 w-full overflow-hidden bg-black">
                <img
                  src={bg}
                  alt={catName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
                
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="font-extrabold text-white text-base block">{catName}</span>
                  <span className="text-[11px] text-neutral-400 font-mono block">/{slug}</span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between border-t border-white/5">
                <span className="text-xs font-mono font-bold text-[#E50914]">
                  {count} {count === 1 ? 'Channel Live' : 'Channels Live'}
                </span>
                <button
                  onClick={() => setDeleteConfirmCategory(catName)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl space-y-4 font-sans">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E50914]" /> Tambah Kategori Baru
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Nama Kategori Baru</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Olahraga & Seni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
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
                  Simpan Kategori
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE CATEGORY MODAL */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans animate-in fade-in">
          <div className="bg-[#121212] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Kategori</h3>
                <p className="text-xs text-neutral-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
              <p className="text-neutral-300">
                Apakah Anda yakin ingin menghapus kategori <strong className="text-white">"{deleteConfirmCategory}"</strong> secara permanen?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmCategory(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold text-xs cursor-pointer"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  deleteCategory(deleteConfirmCategory);
                  setIsDeleting(false);
                  setDeleteConfirmCategory(null);
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
