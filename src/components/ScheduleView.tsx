'use client';

import React, { useState } from 'react';
import { Calendar, Tv, Radio, Clock, User } from 'lucide-react';

export default function ScheduleView() {
  const [activeTab, setActiveTab] = useState<'tv' | 'radio'>('tv');

  const tvSchedule = [
    { time: '00:00 - 06:00', title: 'Night Shift Chill Loop (MP4 Auto-Loop)', type: 'Auto 24/7', host: 'FFmpeg Systemd', status: 'Selesai' },
    { time: '06:00 - 09:00', title: 'RTM Morning News & Tech Headlines', type: 'Live OBS', host: 'Redaksi RTM', status: 'Akan Datang' },
    { time: '09:00 - 12:00', title: 'Indie Music Video Showcase & Documentaries', type: 'Playlist MP4', host: 'Auto Video Player', status: 'Akan Datang' },
    { time: '12:00 - 15:00', title: 'Live Podcast & Talkshow Streaming', type: 'Live OBS Studio', host: 'Host Live Podcast', status: 'Akan Datang' },
    { time: '15:00 - 18:00', title: 'Tech Review & Streaming Infrastructure Tutorial', type: 'Playlist MP4', host: 'RTM Engineering', status: 'Akan Datang' },
    { time: '18:00 - 21:00', title: 'Prime Time Evening Special Broadcast', type: 'Live Studio HD', host: 'Tim Redaksi TV', status: 'Akan Datang' },
    { time: '21:00 - 00:00', title: 'Late Night Cinema & Creative Video Loop', type: 'MP4 Auto-Loop', host: 'FFmpeg Service', status: 'Akan Datang' },
  ];

  const radioSchedule = [
    { time: '00:00 - 06:00', title: 'Lofi & Ambient Sleep Beats (AutoDJ MP3)', type: 'AutoDJ 24/7', host: 'AzuraCast Engine', status: 'Berjalan' },
    { time: '06:00 - 10:00', title: 'RTM Morning Fresh Hits & Weather Update', type: 'AutoDJ + Jingle', host: 'Smart AutoDJ', status: 'Akan Datang' },
    { time: '10:00 - 14:00', title: 'Interactive Live DJ Request Session', type: 'Live DJ Takeover', host: 'DJ Mixxx Broadcast', status: 'Akan Datang' },
    { time: '14:00 - 18:00', title: 'Indie & Pop Chart Top 40', type: 'AutoDJ Playlist', host: 'AzuraCast Station', status: 'Akan Datang' },
    { time: '18:00 - 21:00', title: 'Sunset Chill & Acoustic Session', type: 'Live Radio DJ', host: 'Penyiar Radio Live', status: 'Akan Datang' },
    { time: '21:00 - 00:00', title: 'Synthwave & Electronic Night', type: 'AutoDJ MP3 High Bitrate', host: 'Icecast Server', status: 'Akan Datang' },
  ];

  const schedule = activeTab === 'tv' ? tvSchedule : radioSchedule;

  return (
    <div className="w-full space-y-8 py-4 font-sans selection:bg-[#E50914] selection:text-white">
      
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#E50914] uppercase tracking-wider block font-mono">
          JADWAL SIARAN 24/7 (PROGRAMME GUIDE)
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
          Jadwal Acara TV Live & Radio Online
        </h2>
        <p className="text-neutral-400 text-xs sm:text-sm font-sans">
          Sistem mendukung perpaduan siaran otomatis 24/7 (AutoDJ/MP4 Looper) dan siaran langsung (Live OBS Studio).
        </p>
      </div>

      {/* Switcher Tab */}
      <div className="flex justify-center">
        <div className="bg-[#121212] p-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tv')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tv'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" /> Jadwal TV HLS 24/7
          </button>
          <button
            onClick={() => setActiveTab('radio')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'radio'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" /> Jadwal Radio Online
          </button>
        </div>
      </div>

      {/* Schedule Table / Timeline */}
      <div className="bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {schedule.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-[#E50914] font-mono text-xs font-bold flex-shrink-0 shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.time}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">{item.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5 font-sans">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-500" /> {item.host}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md border font-mono ${
                  item.type.includes('Live')
                    ? 'bg-red-950/80 text-red-400 border-red-500/30'
                    : 'bg-white/10 text-white border-white/20'
                }`}>
                  {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
