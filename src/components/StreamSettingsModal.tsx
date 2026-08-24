'use client';

import React, { useState } from 'react';
import { Settings, X, Save, RotateCcw, Tv, Radio, Check, Globe } from 'lucide-react';

interface StreamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tvUrl: string;
  radioUrl: string;
  onSave: (newTvUrl: string, newRadioUrl: string) => void;
}

export default function StreamSettingsModal({
  isOpen,
  onClose,
  tvUrl,
  radioUrl,
  onSave
}: StreamSettingsModalProps) {
  const [tempTv, setTempTv] = useState(tvUrl);
  const [tempRadio, setTempRadio] = useState(radioUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tempTv, tempRadio);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDemo = () => {
    const demoTv = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
    const demoRadio = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
    setTempTv(demoTv);
    setTempRadio(demoRadio);
    onSave(demoTv, demoRadio);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleSetProductionUrls = () => {
    const prodTv = 'https://live.rtm.tl/tv/index.m3u8';
    const prodRadio = 'https://radio.rtm.tl/radio.mp3';
    setTempTv(prodTv);
    setTempRadio(prodRadio);
    onSave(prodTv, prodRadio);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-xl bg-[#121212] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-black border border-white/10 text-[#E50914] flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Pengaturan Endpoint Server Streaming</h3>
            <p className="text-xs text-neutral-400">Sesuaikan URL M3U8 TV HLS & Stream Audio Radio</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
          
          {/* TV HLS URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-200 flex items-center gap-2">
              <Tv className="w-4 h-4 text-[#E50914]" /> URL Stream TV HLS (.m3u8)
            </label>
            <input
              type="url"
              value={tempTv}
              onChange={(e) => setTempTv(e.target.value)}
              placeholder="https://live.rtm.tl/tv/index.m3u8"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-white focus:outline-none focus:border-[#E50914] transition-all"
            />
            <p className="text-[10px] text-neutral-500 font-mono">Contoh: https://live.rtm.tl/tv/index.m3u8 atau URL demo test</p>
          </div>

          {/* Radio Stream URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-200 flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#E50914]" /> URL Stream Radio Online (.mp3 / .aac / Icecast)
            </label>
            <input
              type="url"
              value={tempRadio}
              onChange={(e) => setTempRadio(e.target.value)}
              placeholder="https://radio.rtm.tl/radio.mp3"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-white focus:outline-none focus:border-[#E50914] transition-all"
            />
            <p className="text-[10px] text-neutral-500 font-mono">Contoh: https://radio.rtm.tl/radio.mp3 atau Zeno/Icecast stream URL</p>
          </div>

          {/* Quick preset buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSetProductionUrls}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all"
            >
              <Globe className="w-3.5 h-3.5" /> Set URL Production VPS (live.rtm.tl)
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-semibold transition-all border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset ke Public Demo Streams
            </button>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 text-neutral-300 hover:bg-white/20 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-900/30 transition-all active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Tersimpan!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Pengaturan Stream
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
