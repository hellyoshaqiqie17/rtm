'use client';

import React from 'react';
import ScheduleView from '@/components/ScheduleView';
import { Calendar } from 'lucide-react';

export default function SchedulePage() {
  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          <span>PANDUAN ACARA NAKLOKE</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1 font-sans">
          Jadwal Siaran RTM MAUBERE
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Panduan lengkap program berita, musik, dokumenter, dan talkshow 24 jam.
        </p>
      </div>

      <ScheduleView />

    </div>
  );
}
