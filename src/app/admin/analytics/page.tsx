'use client';

import React, { useEffect, useState } from 'react';
import { useStreamContext } from '@/context/StreamContext';

interface ReportItem {
  id: string;
  title: string;
  format: string;
  currentViewers: number;
  totalViews: number;
  status: string;
  type: string;
}

export default function AdminAnalyticsPage() {
  const { channels, radioChannels } = useStreamContext();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [analyticsData, setAnalyticsData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.report && Array.isArray(data.report)) {
            setAnalyticsData(data.report);
          }
        }
      } catch (err) {
        console.error('Error fetching analytics report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fallback to local channel list if analytics fetch is loading
  const reportData = analyticsData.length > 0 ? analyticsData : [
    ...channels.map((ch) => ({
      id: ch.id,
      title: ch.name,
      format: ch.activeSource === 'playlist' ? 'MP4 PLAYLIST 24/7' : ch.activeSource === 'recording' ? 'REKAMAN VOD' : 'HLS 1080p',
      currentViewers: 0,
      totalViews: 0,
      status: 'OFFLINE',
      type: 'tv',
    })),
    ...radioChannels.map((r) => ({
      id: r.id,
      title: `${r.name} (Radio)`,
      format: r.activeSource === 'playlist' ? 'AUTODJ MP3 24/7' : 'MP3 AUDIO LIVE',
      currentViewers: 0,
      totalViews: 0,
      status: 'OFFLINE',
      type: 'radio',
    })),
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Laporan Analitik Penonton
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Statistik penonton real-time dan pemutaran aktif saluran TV & Radio RTM MAUBERE (100% Real Count).
          </p>
        </div>

        {/* Time Range Filter Buttons */}
        <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              timeRange === '1h' ? 'bg-[#E50914] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            1 Jam
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              timeRange === '24h' ? 'bg-[#E50914] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            24 Jam
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              timeRange === '7d' ? 'bg-[#E50914] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            7 Hari
          </button>
        </div>
      </div>

      {/* Analytics Table */}
      <div className="rounded-2xl border border-white/5 bg-[#121212] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-sans">
            <thead className="bg-black/60 text-neutral-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-4 px-6">Nama Siaran</th>
                <th className="py-4 px-6">Format Stream</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 font-mono">Penonton (Sekarang)</th>
                <th className="py-4 px-6 text-right font-mono">Total Views (All Time)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reportData.map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-bold text-white">
                    {row.title}
                  </td>
                  <td className="py-4 px-6 font-mono text-neutral-400">
                    <span className="px-2.5 py-0.5 rounded bg-white/10 text-white text-[10px]">
                      {row.format}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      row.status === 'LIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${row.status === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`}></span>
                      <span>{row.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-[#E50914] text-sm">
                    {row.currentViewers} Penonton
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-white text-sm">
                    {row.totalViews.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
