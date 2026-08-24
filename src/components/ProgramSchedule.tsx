'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStreamContext } from '@/context/StreamContext';
import { Calendar, Clock, Tv, Radio, User, Plus } from 'lucide-react';

interface ProgramScheduleProps {
  defaultType?: 'all' | 'tv' | 'radio';
}

export default function ProgramSchedule({ defaultType = 'all' }: ProgramScheduleProps) {
  const { schedules, isAdminAuthenticated } = useStreamContext();
  const [selectedDay, setSelectedDay] = useState<'Hari Ini' | 'Besok'>('Hari Ini');
  const [selectedType, setSelectedType] = useState<'all' | 'tv' | 'radio'>(defaultType);

  // Helper to determine if a program is currently airing
  const isProgramActive = (timeStart: string, timeEnd: string, day: string) => {
    if (day !== 'Hari Ini') return false;
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    const [startH, startM] = timeStart.split(':').map(Number);
    const [endH, endM] = timeEnd.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60; // Handle overnight slots

    return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
  };

  const filteredSchedules = schedules.filter((item) => {
    const dayMatch = item.day === selectedDay;
    const typeMatch = selectedType === 'all' || item.type === selectedType;
    return dayMatch && typeMatch;
  });

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* Schedule Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>JADWAL SIARAN REGULER 24/7</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1 font-sans">
            Jadwal Acara TV & Radio
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Agenda siaran langsung TV Live & Radio Online RTM MAUBERE.
          </p>
        </div>

        {/* Day & Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Day Tabs */}
          <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setSelectedDay('Hari Ini')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDay === 'Hari Ini'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setSelectedDay('Besok')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDay === 'Besok'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Besok
            </button>
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedType('tv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'tv'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV</span>
            </button>
            <button
              onClick={() => setSelectedType('radio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'radio'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Radio</span>
            </button>
          </div>

        </div>
      </div>

      {/* Schedule Cards Grid or Empty State */}
      {filteredSchedules.length === 0 ? (
        <div className="text-center py-12 px-6 bg-[#121212] rounded-3xl border border-white/5 space-y-4 font-sans max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neutral-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Belum Ada Jadwal Siaran Dibuat</h3>
            <p className="text-xs text-neutral-400">
              Jadwal acara untuk {selectedDay} ({selectedType.toUpperCase()}) belum ditambahkan.
            </p>
          </div>

          {isAdminAuthenticated && (
            <div className="pt-2">
              <Link
                href="/admin/schedule"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-extrabold shadow-lg shadow-red-900/40 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Jadwal Acara di Admin Panel</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
          {filteredSchedules.map((item) => {
            const active = isProgramActive(item.timeStart, item.timeEnd, item.day);

            return (
              <div
                key={item.id}
                className={`relative p-5 rounded-2xl border transition-all duration-300 shadow-xl flex flex-col justify-between space-y-3 ${
                  active
                    ? 'bg-gradient-to-r from-red-950/40 via-[#121212] to-[#121212] border-[#E50914] ring-1 ring-[#E50914]/40'
                    : 'bg-[#121212] border-white/5 hover:border-white/20'
                }`}
              >
                
                {/* Top Badge & Time Header */}
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Time Range Badge */}
                  <div className="flex items-center gap-2 font-mono text-xs font-bold">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 text-white border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>{item.timeStart} - {item.timeEnd}</span>
                    </span>

                    {/* Media Type Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-sans border ${
                      item.type === 'tv'
                        ? 'bg-blue-950 text-cyan-300 border-cyan-500/30'
                        : 'bg-amber-950 text-amber-300 border-amber-500/30'
                    }`}>
                      {item.type === 'tv' ? 'TV LIVE' : 'RADIO ONLINE'}
                    </span>
                  </div>

                  {/* Active Live Indicator Badge */}
                  {active ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#E50914] text-white text-[10px] font-extrabold shadow-lg shadow-red-900/50 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span> SEDANG TAYANG
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/5">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Program Title & Host */}
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white tracking-tight line-clamp-1 group-hover:text-[#E50914] transition-colors">
                    {item.title}
                  </h3>
                  
                  {item.host && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
                      <User className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>Penyiar / Host: <strong className="text-white">{item.host}</strong></span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 pt-1 font-sans">
                      {item.description}
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
