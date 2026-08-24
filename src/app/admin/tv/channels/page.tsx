'use client';

import React, { useState } from 'react';
import { useStreamContext, Channel } from '@/context/StreamContext';
import {
  Tv,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Youtube,
  Globe,
  Sliders,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

export default function AdminTvChannelsPage() {
  const { channels, addChannel, updateChannel, deleteChannel, toggleChannelSource } = useStreamContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // Form states for New Channel
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [hlsUrl, setHlsUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeSource, setActiveSource] = useState<'hls' | 'youtube'>('hls');
  const [thumbnail, setThumbnail] = useState('');
  const [currentProgram, setCurrentProgram] = useState('');

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    addChannel({
      name,
      slug,
      hlsUrl: hlsUrl || 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      youtubeUrl: youtubeUrl || 'https://www.youtube.com/embed/live_stream?channel=UC_rtm_live_official',
      activeSource,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=60',
      currentProgram: currentProgram || 'Siaran Berita Utama RTM',
      enabled: true,
    });

    // Reset Form
    setName('');
    setSlug('');
    setHlsUrl('');
    setYoutubeUrl('');
    setCurrentProgram('');
    setIsAddModalOpen(false);
  };

  const handleUpdateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    updateChannel(editingChannel);
    setEditingChannel(null);
  };

  return (
    <div className="space-y-6 font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider block">
            MANAJEMEN KANAL TV
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Pengaturan & Sumber Siaran Channel TV
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Tambah, edit, atau ganti sumber siaran (RTM HLS vs YouTube Embed) untuk setiap kanal TV.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 text-xs font-bold shadow-lg shadow-red-900/40 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Channel Baru</span>
        </button>
      </div>

      {/* Channel Table */}
      <div className="bg-[#121212] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-sans">
            <thead className="bg-black/60 text-neutral-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Kanal TV</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Active Source</th>
                <th className="py-3 px-4">HLS Endpoint</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {channels.map((chan) => (
                <tr key={chan.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-black text-[#E50914] flex items-center justify-center font-bold border border-white/10">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block">{chan.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">ID: {chan.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-neutral-300 font-semibold">{chan.slug}</td>
                  <td className="py-4 px-4 text-neutral-300 max-w-xs truncate">{chan.currentProgram}</td>
                  <td className="py-4 px-4 font-mono">
                    <button
                      onClick={() => toggleChannelSource(chan.id, chan.activeSource === 'hls' ? 'youtube' : 'hls')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 border ${
                        chan.activeSource === 'hls'
                          ? 'bg-[#E50914]/10 text-[#E50914] border-[#E50914]/30 hover:bg-[#E50914] hover:text-white'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                      title="Klik untuk ganti sumber siaran"
                    >
                      {chan.activeSource === 'hls' ? (
                        <>
                          <Tv className="w-3 h-3 text-[#E50914]" />
                          <span>RTM HLS STREAM</span>
                        </>
                      ) : (
                        <>
                          <Youtube className="w-3 h-3 text-white" />
                          <span>YOUTUBE EMBED</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-neutral-400 max-w-xs truncate">
                    {chan.hlsUrl}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingChannel(chan)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10"
                        title="Edit Channel"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteChannel(chan.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold transition-all border border-red-500/20"
                        title="Hapus Channel"
                        disabled={channels.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingChannel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/10 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#E50914]" /> Edit Channel: {editingChannel.name}
              </h3>
              <button onClick={() => setEditingChannel(null)} className="p-1 rounded-lg text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateChannel} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Nama Channel</label>
                <input
                  type="text"
                  required
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">Slug URL</label>
                <input
                  type="text"
                  required
                  value={editingChannel.slug}
                  onChange={(e) => setEditingChannel({ ...editingChannel, slug: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">RTM HLS M3U8 URL</label>
                <input
                  type="text"
                  required
                  value={editingChannel.hlsUrl}
                  onChange={(e) => setEditingChannel({ ...editingChannel, hlsUrl: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">YouTube Embed / Live URL</label>
                <input
                  type="text"
                  required
                  value={editingChannel.youtubeUrl}
                  onChange={(e) => setEditingChannel({ ...editingChannel, youtubeUrl: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">Active Broadcast Source</label>
                <select
                  value={editingChannel.activeSource}
                  onChange={(e) => setEditingChannel({ ...editingChannel, activeSource: e.target.value as 'hls' | 'youtube' })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-bold font-mono text-white"
                >
                  <option value="hls">RTM HLS Stream (Primary)</option>
                  <option value="youtube">YouTube Embed (Alternative)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Program Saat Ini</label>
                <input
                  type="text"
                  value={editingChannel.currentProgram}
                  onChange={(e) => setEditingChannel({ ...editingChannel, currentProgram: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E50914] text-white hover:bg-red-700 font-bold shadow-md shadow-red-900/30"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/10 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E50914]" /> Tambah Channel TV Baru
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Nama Channel</label>
                <input
                  type="text"
                  required
                  placeholder="misal: RTM Sports"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">Slug URL</label>
                <input
                  type="text"
                  required
                  placeholder="misal: rtm-sports"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">RTM HLS M3U8 URL</label>
                <input
                  type="text"
                  placeholder="https://live.rtm.tl/live/rtm-sports/index.m3u8"
                  value={hlsUrl}
                  onChange={(e) => setHlsUrl(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">YouTube Embed URL</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/embed/live_stream?channel=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1 font-mono">Active Broadcast Source</label>
                <select
                  value={activeSource}
                  onChange={(e) => setActiveSource(e.target.value as 'hls' | 'youtube')}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-bold font-mono text-white"
                >
                  <option value="hls">RTM HLS Stream (Primary)</option>
                  <option value="youtube">YouTube Embed (Alternative)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Program Saat Ini</label>
                <input
                  type="text"
                  placeholder="misal: Siaran Spesial Olahraga"
                  value={currentProgram}
                  onChange={(e) => setCurrentProgram(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E50914] text-white hover:bg-red-700 font-bold shadow-md shadow-red-900/30"
                >
                  Buat Channel Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
