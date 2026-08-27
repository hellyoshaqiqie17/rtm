'use client';

import React, { useState } from 'react';
import TVPlayer from '@/components/TVPlayer';
import ProgramSchedule from '@/components/ProgramSchedule';
import { useStreamContext } from '@/context/StreamContext';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TVPage() {
  const { channels, setActiveChannelId, activeChannelId, categories } = useStreamContext();
  const [selectedCategory, setSelectedCategory] = useState('Semua Siaran');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2 baris x 3 kolom = 6 channel per halaman

  const categoryFilterOptions = ['Semua Siaran', ...categories];

  const filteredChannels = selectedCategory === 'Semua Siaran'
    ? channels
    : channels.filter((c) => (c.category || 'Tanpa Kategori').toLowerCase() === selectedCategory.toLowerCase());

  const totalPages = Math.ceil(filteredChannels.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedChannels = filteredChannels.slice(startIndex, startIndex + itemsPerPage);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    const targetElement = document.getElementById('tv-catalog-heading') || document.getElementById('rtm-tv-player');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Category Filter Buttons Bar */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          {categoryFilterOptions.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
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
      <div id="tv-catalog-heading" className="space-y-4 pt-4 font-sans scroll-mt-20">
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedChannels.map((chan) => {
                const isActive = activeChannelId === chan.id;
                return (
                  <div
                    key={chan.id}
                    onClick={() => {
                      setActiveChannelId(chan.id);
                      const playerElement = document.getElementById('rtm-tv-player');
                      if (playerElement) {
                        playerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
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
                      {chan.activeSource !== 'youtube' && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
                        </div>
                      )}
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

            {/* PageNavi (Pagination Controls) */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-white/5">
                <span className="text-xs font-mono text-neutral-400">
                  Menampilkan <strong className="text-white">{startIndex + 1}</strong> - <strong className="text-white">{Math.min(startIndex + itemsPerPage, filteredChannels.length)}</strong> dari <strong className="text-white">{filteredChannels.length}</strong> channel
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={safeCurrentPage === 1}
                    onClick={() => handlePageChange(Math.max(safeCurrentPage - 1, 1))}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-[#121212] border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-xl font-mono font-bold text-xs transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg shadow-red-900/40'
                            : 'bg-[#121212] text-neutral-400 hover:text-white border-white/10 hover:bg-neutral-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => handlePageChange(Math.min(safeCurrentPage + 1, totalPages))}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-[#121212] border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
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
