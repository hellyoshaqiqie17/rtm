'use client';

import React, { useState } from 'react';
import { useStreamContext } from '@/context/StreamContext';
import { Settings, ShieldCheck, Server, Video, Save, RotateCcw, Copy, Check } from 'lucide-react';

export default function AdminTvSettingsPage() {
  const { tvUrl, setTvUrl } = useStreamContext();

  const [rtmpServer, setRtmpServer] = useState('rtmp://live.rtm.tl/live');
  const [streamKey, setStreamKey] = useState('rtm_stream_key_secret_2026');
  const [mediamtxPort, setMediamtxPort] = useState('8554');
  const [hlsSegmentDuration, setHlsSegmentDuration] = useState('2s');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyStreamKey = () => {
    navigator.clipboard.writeText(`${rtmpServer}/${streamKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <span className="text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider block">
          INFRASRTUKTUR TV INGEST
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Pengaturan Stream Server & Ingest OBS
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Konfigurasi endpoint RTMP ingest untuk penyiar OBS Studio, MediaMTX server, dan parameter HLS.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-sans">
          ✓ Konfigurasi stream server berhasil diperbarui dan disimpan!
        </div>
      )}

      {/* OBS Credentials Box */}
      <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4 font-sans">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Video className="w-5 h-5 text-[#E50914]" />
          <h2 className="text-base font-bold text-white">
            Credential OBS Studio Live Broadcast
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">
              Server URL (RTMP Ingest)
            </label>
            <input
              type="text"
              value={rtmpServer}
              onChange={(e) => setRtmpServer(e.target.value)}
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">
              Stream Key (Private Key)
            </label>
            <div className="relative">
              <input
                type="password"
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-xl p-3.5 text-xs text-neutral-300 font-mono">
          <div className="truncate max-w-md">
            Full Ingest Path: <strong className="text-[#E50914]">{rtmpServer}/{streamKey}</strong>
          </div>
          <button
            onClick={handleCopyStreamKey}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E50914] text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            <span>{copied ? 'Copied!' : 'Copy Path'}</span>
          </button>
        </div>
      </div>

      {/* MediaMTX & HLS Config Form */}
      <form onSubmit={handleSaveSettings} className="bg-[#121212] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4 font-sans">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Server className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">
            Konfigurasi Engine MediaMTX & FFmpeg 24/7
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">
              Port RTMP MediaMTX
            </label>
            <input
              type="text"
              value={mediamtxPort}
              onChange={(e) => setMediamtxPort(e.target.value)}
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">
              HLS Segment Duration
            </label>
            <input
              type="text"
              value={hlsSegmentDuration}
              onChange={(e) => setHlsSegmentDuration(e.target.value)}
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">
              Default Production HLS M3U8 URL
            </label>
            <input
              type="text"
              value={tvUrl}
              onChange={(e) => setTvUrl(e.target.value)}
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white font-bold"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] text-white hover:bg-red-700 text-xs font-bold shadow-md transition-all active:scale-95 border border-red-900 font-sans"
          >
            <Save className="w-4 h-4 text-white" />
            <span>Simpan Konfigurasi Server</span>
          </button>
        </div>
      </form>

    </div>
  );
}
