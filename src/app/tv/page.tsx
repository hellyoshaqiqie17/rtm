'use client';

import React, { useState } from 'react';
import TVPlayer from '@/components/TVPlayer';
import ProgramSchedule from '@/components/ProgramSchedule';
import { useStreamContext } from '@/context/StreamContext';
import { Layers } from 'lucide-react';

export default function TVPage() {
  const { channels, setActiveChannelId, activeChannelId, categories } = useStreamContext();
  const [selectedCategory, setSelectedCategory] = useState('Semua Siaran');

  const categoryFilterOptions = ['Semua Siaran', ...categories];

  const filteredChannels = selectedCategory === 'Semua Siaran'
    ? channels
    : channels.filter((c) => (c.category || 'Tanpa Kategori') === selectedCategory);

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Category Filter Buttons Bar */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          {categoryFilterOptions.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg shadow-red-900/30'
                    : 'bg-[#121212] text-neutral-400 hover:text-white border-white/5 hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Main TV Player */}
      <TVPlayer />

      {/* Streams Catalog Grid */}
      <div className="space-y-4 pt-4 font-sans">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse"></span>
            <span>Daftar Siaran TV Live ({selectedCategory})</span>
          </h2>
          <span className="text-xs font-mono text-neutral-400 font-bold">
            {filteredChannels.length} Channel Ditemukan
          </span>
        </div>

        {filteredChannels.length === 0 ? (
          <div className="text-center py-16 bg-[#121212] rounded-3xl border border-white/5 space-y-3">
            <Layers className="w-10 h-10 text-neutral-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Belum Ada Channel dalam Kategori Ini</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Silakan pilih kategori lain atau tambah channel baru melalui Admin Panel RTM.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChannels.map((chan) => {
              const isActive = activeChannelId === chan.id;
              return (
                <div
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={`group bg-[#121212] rounded-2xl border overflow-hidden shadow-xl transition-all cursor-pointer ${
                    isActive ? 'border-[#E50914] ring-2 ring-[#E50914]/30' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <img
                      src={chan.thumbnail}
                      alt={chan.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#E50914] text-white font-mono text-[10px] font-bold uppercase">
                      {chan.category || 'Tanpa Kategori'}
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-[#E50914] transition-colors">
                      {chan.name}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-1">
                      {chan.currentProgram}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Program Schedule Section */}
      <div className="pt-6 border-t border-white/10">
        <ProgramSchedule defaultType="tv" />
      </div>

    </div>
  );
}
