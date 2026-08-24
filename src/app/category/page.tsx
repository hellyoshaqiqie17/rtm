'use client';

import React from 'react';
import Link from 'next/link';
import { useStreamContext } from '@/context/StreamContext';
import { Layers } from 'lucide-react';

export default function CategoryPage() {
  const { channels, categories } = useStreamContext();

  const categoryBgs: Record<string, string> = {
    'TV On Demand': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80',
    'Dokumenter': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    'Kesehatan': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80',
    'Ekonomi': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=80',
    'Pendidikan': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=80',
    'RTM Maubere': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80',
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>KATEGORI PROGRAM</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1 font-sans">
          Jelajahi Kategori Siaran RTM MAUBERE
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Pilih kategori program siaran TV On Demand, Berita, Dokumenter, Kesehatan, & Edukasi.
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-16 bg-[#121212] rounded-3xl border border-white/5 space-y-3">
          <Layers className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Belum Ada Kategori Siaran</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Silakan tambah kategori baru melalui Admin Panel RTM.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {categories.map((catName, idx) => {
            const count = channels.filter((c) => (c.category || 'Tanpa Kategori') === catName).length;
            const bg = categoryBgs[catName] || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80';

            return (
              <Link
                key={idx}
                href="/tv"
                className="group relative h-48 rounded-2xl border border-white/5 overflow-hidden shadow-xl bg-[#121212] flex items-end p-6 transition-all hover:border-[#E50914]/50 hover:shadow-[0_0_25px_rgba(229,9,20,0.2)] cursor-pointer"
              >
                <img
                  src={bg}
                  alt={catName}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                
                <div className="relative z-10 space-y-1">
                  <span className="font-extrabold text-white text-lg tracking-tight uppercase group-hover:text-[#E50914] transition-colors block">
                    {catName}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono block">
                    {count} {count === 1 ? 'Channel Live' : 'Channels Live'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}
