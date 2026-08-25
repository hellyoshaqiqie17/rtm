'use client';

import React, { useState, useEffect } from 'react';
import { useStreamContext, Channel } from '@/context/StreamContext';
import { Tv, Plus, Pin, Trash2, Edit2, X, Copy, Check, Info, Sparkles, Upload, Image as ImageIcon, Layers, Video, AlertTriangle, Film, CheckCircle2, Play, HardDrive } from 'lucide-react';
import PlaylistManagerModal from '@/components/PlaylistManagerModal';

export default function AdminKelolaTvPage() {
  const { channels, addChannel, updateChannel, deleteChannel, toggleChannelSource, categories } = useStreamContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [playlistModalChannel, setPlaylistModalChannel] = useState<Channel | null>(null);
  const [deleteConfirmChannel, setDeleteConfirmChannel] = useState<Channel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pinnedId, setPinnedId] = useState<string | null>('coba');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedGuideChannelId, setSelectedGuideChannelId] = useState<string>('');

  const activeGuideChannel = channels.find((c) => c.id === selectedGuideChannelId) || channels[0];
  const activeStreamKey = activeGuideChannel?.slug || 'coba';
  const activeWebHlsUrl = activeGuideChannel?.hlsUrl
    ? (activeGuideChannel.hlsUrl.startsWith('http') ? activeGuideChannel.hlsUrl : `https://rtm.tl${activeGuideChannel.hlsUrl}`)
    : `https://rtm.tl/live/${activeStreamKey}/index.m3u8`;

  // Form states for New Channel
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [streamType, setStreamType] = useState<'hls' | 'youtube'>('hls');
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || 'Tanpa Kategori');
  const [autoRecord, setAutoRecord] = useState<boolean>(true);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories]);

  // Auto generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(autoSlug);
  };

  // Handle local image file upload for Add Modal
  const handleAddFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setThumbnail(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle local image file upload for Edit Modal
  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingChannel) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditingChannel({ ...editingChannel, thumbnail: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const calculatedHlsUrl = slug ? `/live/${slug}/index.m3u8` : '/tv/index.m3u8';
  const obsStreamKey = slug || 'tv';
  const obsServerUrl = 'rtmp://103.160.62.250:1935/live';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return;

    const finalHlsUrl = streamType === 'hls'
      ? (customStreamUrl || calculatedHlsUrl)
      : (customStreamUrl || calculatedHlsUrl);

    const finalYoutubeUrl = streamType === 'youtube'
      ? customStreamUrl
      : 'https://www.youtube.com/embed/live_stream?channel=UC_rtm_live_official';

    addChannel({
      name: title,
      slug,
      category: category || (categories[0] || 'Tanpa Kategori'),
      hlsUrl: finalHlsUrl,
      youtubeUrl: finalYoutubeUrl,
      activeSource: streamType,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=60',
      currentProgram: description || `Siaran TV RTM (${title})`,
      enabled: true,
      autoRecord: autoRecord,
    });

    // Reset form
    setTitle('');
    setSlug('');
    setCustomStreamUrl('');
    setThumbnail('');
    setDescription('');
    setCategory(categories[0] || 'Tanpa Kategori');
    setIsAddModalOpen(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    updateChannel(editingChannel);
    setEditingChannel(null);
  };

  const [channelRecordings, setChannelRecordings] = useState<Record<string, any[]>>({});
  const [sourceToast, setSourceToast] = useState<{ message: string; channelName: string; modeName: string } | null>(null);

  useEffect(() => {
    channels.forEach(async (chan) => {
      try {
        const res = await fetch(`/api/recordings?slug=${chan.slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.recordings) {
            setChannelRecordings((prev) => ({ ...prev, [chan.slug]: data.recordings }));
          }
        }
      } catch (e) {}
    });
  }, [channels]);

  const handleSourceChange = (channelId: string, channelName: string, source: 'hls' | 'playlist' | 'recording' | 'youtube', selectedRecordingUrl?: string) => {
    toggleChannelSource(channelId, source, selectedRecordingUrl);
    
    const modeLabels: Record<string, string> = {
      hls: '🔴 Live Ingest OBS',
      playlist: '🎬 MP4 Playlist 24/7',
      recording: '📹 Hasil Rekaman (VOD)',
      youtube: '📺 YouTube Embed',
    };

    setSourceToast({
      message: `Sumber siaran aktif untuk channel "${channelName}" berhasil diubah ke: ${modeLabels[source]}!`,
      channelName,
      modeName: modeLabels[source],
    });

    setTimeout(() => setSourceToast(null), 5000);
  };

  const handleDeleteRecording = async (rec: any, channelSlug: string, channelId: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus file rekaman "${rec.filename}"? File ini akan dihapus permanen dari server.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/recordings?filename=${encodeURIComponent(rec.filename)}&id=${encodeURIComponent(rec.id || '')}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setChannelRecordings((prev) => ({
          ...prev,
          [channelSlug]: (prev[channelSlug] || []).filter((r) => r.filename !== rec.filename),
        }));

        const currentActive = activeGuideChannel.selectedRecordingUrl || activeGuideChannel.recordedPlaybackUrl;
        if (currentActive === rec.playbackUrl) {
          const remaining = (channelRecordings[channelSlug] || []).filter((r) => r.filename !== rec.filename);
          const nextPlaybackUrl = remaining.length > 0 ? remaining[0].playbackUrl : '';
          toggleChannelSource(channelId, 'recording', nextPlaybackUrl);
        }

        setSourceToast({
          message: `File rekaman "${rec.filename}" berhasil dihapus permanen dari server!`,
          channelName: channelSlug,
          modeName: 'Hapus Rekaman',
        });

        setTimeout(() => setSourceToast(null), 5000);
      }
    } catch (err) {
      console.error('Error deleting recording:', err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Tv className="w-6 h-6 text-[#E50914]" /> Kelola TV & Saluran Streaming
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Tambah & edit saluran TV baru per kategori, upload thumbnail gambar, dan kelola kredensial OBS Studio secara otomatis.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 text-xs font-extrabold shadow-lg shadow-red-900/40 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Channel Baru</span>
        </button>
      </div>

      {/* MASTER BROADCAST SOURCE CONTROLLER DASHBOARD */}
      {activeGuideChannel && (
        <div className="bg-[#121212] p-6 rounded-2xl border border-red-500/30 shadow-2xl space-y-5 font-sans relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E50914] text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-red-900/50">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Master Broadcast Source Controller</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 uppercase font-mono">
                    LIVE CONTROL
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Atur secara langsung sumber siaran yang aktif tampil di web publik untuk channel: <strong className="text-white font-bold">{activeGuideChannel.name}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Toast Notification Banner for Source Change */}
          {sourceToast && (
            <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-xs text-emerald-200 font-sans flex items-center justify-between gap-3 animate-in fade-in shadow-xl">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{sourceToast.message}</span>
              </div>
              <button onClick={() => setSourceToast(null)} className="text-emerald-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 4 Mode Selector Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            
            {/* Mode 1: Live Ingest OBS */}
            <button
              type="button"
              onClick={() => handleSourceChange(activeGuideChannel.id, activeGuideChannel.name, 'hls')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                activeGuideChannel.activeSource === 'hls'
                  ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg shadow-red-900/40 font-bold'
                  : 'bg-black/60 text-neutral-300 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Video className="w-4 h-4" /> Live Ingest OBS
                </span>
                {activeGuideChannel.activeSource === 'hls' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                )}
              </div>
              <p className="text-[10px] opacity-80 leading-snug">
                Siaran langsung realtime dari vMix / OBS Studio (MediaMTX RTMP).
              </p>
            </button>

            {/* Mode 2: MP4 Playlist 24/7 */}
            <button
              type="button"
              onClick={() => handleSourceChange(activeGuideChannel.id, activeGuideChannel.name, 'playlist')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                activeGuideChannel.activeSource === 'playlist'
                  ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg shadow-red-900/40 font-bold'
                  : 'bg-black/60 text-neutral-300 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Film className="w-4 h-4" /> MP4 Playlist 24/7
                </span>
                {activeGuideChannel.activeSource === 'playlist' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                )}
              </div>
              <p className="text-[10px] opacity-80 leading-snug">
                Siaran otomatis 24 jam non-stop memutar rotasi daftar video MP4.
              </p>
            </button>

            {/* Mode 3: Hasil Rekaman (Recordings VOD) */}
            <button
              type="button"
              onClick={() => handleSourceChange(activeGuideChannel.id, activeGuideChannel.name, 'recording')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                activeGuideChannel.activeSource === 'recording'
                  ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg shadow-red-900/40 font-bold'
                  : 'bg-black/60 text-neutral-300 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" /> Hasil Rekaman (VOD)
                </span>
                {activeGuideChannel.activeSource === 'recording' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                )}
              </div>
              <p className="text-[10px] opacity-80 leading-snug">
                Putar ulang salah satu file rekaman siaran live sebelumnya.
              </p>
            </button>

            {/* Mode 4: YouTube Live / Embed */}
            <button
              type="button"
              onClick={() => handleSourceChange(activeGuideChannel.id, activeGuideChannel.name, 'youtube')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                activeGuideChannel.activeSource === 'youtube'
                  ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg shadow-red-900/40 font-bold'
                  : 'bg-black/60 text-neutral-300 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Tv className="w-4 h-4" /> YouTube Embed
                </span>
                {activeGuideChannel.activeSource === 'youtube' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                )}
              </div>
              <p className="text-[10px] opacity-80 leading-snug">
                Putar siaran embed dari kanal YouTube resmi RTM MAUBERE.
              </p>
            </button>

          </div>

          {/* Recording Selector & Manager Card List when mode is 'recording' */}
          {activeGuideChannel.activeSource === 'recording' && (
            <div className="p-5 bg-gradient-to-b from-emerald-950/50 to-black/90 border border-emerald-500/30 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-extrabold text-emerald-300 text-sm font-sans">
                      Kelola & Pilih File Rekaman Sesi Live (VOD)
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Pilih file rekaman yang ingin ditayangkan secara publik di web, atau hapus rekaman yang tidak diperlukan dari server.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] self-start sm:self-auto font-bold">
                  {channelRecordings[activeGuideChannel.slug]?.length || 0} File Tersimpan
                </span>
              </div>
              
              {channelRecordings[activeGuideChannel.slug] && channelRecordings[activeGuideChannel.slug].length > 0 ? (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {channelRecordings[activeGuideChannel.slug].map((rec) => {
                    const currentActiveUrl = activeGuideChannel.selectedRecordingUrl || activeGuideChannel.recordedPlaybackUrl;
                    const isSelected = currentActiveUrl === rec.playbackUrl;
                    const formattedDate = rec.recordedAt ? new Date(rec.recordedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : rec.filename;
                    const sizeMb = rec.fileSize ? `${Math.round(rec.fileSize / (1024 * 1024))} MB` : 'Size N/A';

                    return (
                      <div
                        key={rec.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-400/80 shadow-lg shadow-emerald-950/50'
                            : 'bg-black/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs font-sans flex items-center gap-1.5">
                              📹 Sesi Rekaman {formattedDate}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Diputar di Web Publik
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-mono">
                            <span>File: {rec.filename}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{sizeMb}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isSelected ? (
                            <button
                              onClick={() => handleSourceChange(activeGuideChannel.id, activeGuideChannel.name, 'recording', rec.playbackUrl)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Pilih Tampilkan</span>
                            </button>
                          ) : (
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Aktif Ditayangkan</span>
                            </div>
                          )}

                          <button
                            onClick={() => handleDeleteRecording(rec, activeGuideChannel.slug, activeGuideChannel.id)}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white transition-all cursor-pointer"
                            title="Hapus file rekaman ini dari server"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 text-center space-y-1">
                  <p className="text-neutral-300 text-xs font-semibold">
                    Belum ada file rekaman otomatis yang tersimpan untuk saluran ini.
                  </p>
                  <p className="text-neutral-400 text-[11px]">
                    Siaran live yang dilakukan dari OBS/vMix dalam mode <strong>🔴 Live Ingest OBS</strong> akan otomatis direkam dan muncul di sini.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* VMIX & OBS LIVE STREAMING GUIDE CARD (Netflix Dark Theme) */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6 font-sans relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center text-[#E50914] shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Panduan Live Broadcast Video (vMix / OBS Studio)</span>
              </h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                Kredensial RTMP di bawah ini otomatis menyesuaikan dengan channel terpilih: <strong className="text-white font-bold">{activeGuideChannel?.name || 'coba'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          
          {/* RTMP Server URL */}
          <div className="bg-[#121212] p-4 rounded-xl border border-white/10 space-y-1.5 relative">
            <div className="flex items-center justify-between text-[#A3A3A3] font-mono text-[10px] uppercase tracking-wider">
              <span>1. URL Server RTMP (vMix / OBS)</span>
              <button
                onClick={() => copyToClipboard('rtmp://103.160.62.250:1935/live', 'rtmp-url')}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                title="Salin URL RTMP"
              >
                {copiedKey === 'rtmp-url' ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono font-bold text-white text-sm">rtmp://103.160.62.250:1935/live</div>
            <div className="text-[10px] text-[#737373] font-mono">Port: <span className="text-white font-medium">1935 (RTMP)</span></div>
          </div>

          {/* Stream Key */}
          <div className="bg-[#121212] p-4 rounded-xl border border-white/10 space-y-1.5 relative">
            <div className="flex items-center justify-between text-[#A3A3A3] font-mono text-[10px] uppercase tracking-wider">
              <span>2. Stream Key (Nama Key Channel)</span>
              <button
                onClick={() => copyToClipboard(activeStreamKey, 'key-active')}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                title="Salin Stream Key"
              >
                {copiedKey === 'key-active' ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono font-bold text-[#E50914] text-base">{activeStreamKey}</div>
            <div className="text-[10px] text-[#737373] font-mono">Channel: <span className="text-white">{activeGuideChannel?.name}</span></div>
          </div>

          {/* Public HLS Stream URL */}
          <div className="bg-[#121212] p-4 rounded-xl border border-white/10 space-y-1.5 relative">
            <div className="flex items-center justify-between text-[#A3A3A3] font-mono text-[10px] uppercase tracking-wider">
              <span>3. URL Stream Web (HLS HTTPS)</span>
              <button
                onClick={() => copyToClipboard(activeWebHlsUrl, 'hls-pub')}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                title="Salin URL HLS Web"
              >
                {copiedKey === 'hls-pub' ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono font-bold text-white text-xs truncate" title={activeWebHlsUrl}>{activeWebHlsUrl}</div>
            <div className="text-[10px] text-[#737373] font-mono">Tampil otomatis di <span className="text-white">https://rtm.tl/tv</span></div>
          </div>

        </div>

        {/* Step by Step Guide for vMix */}
        <div className="p-4 bg-[#121212] border border-white/10 rounded-xl space-y-2 text-xs">
          <div className="font-bold text-white flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#E50914]"></span>
            <span>Langkah Konfigurasi di Software vMix:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-[#A3A3A3] font-sans text-[11px] leading-relaxed">
            <li>Klik ikon ⚙ (Gear) di sebelah tombol <strong className="text-white font-bold">Stream</strong> di bagian bawah vMix.</li>
            <li>Di jendela <strong className="text-white">Streaming Settings</strong>, pilih Destination: <code className="bg-black/60 px-2 py-0.5 rounded text-white font-mono border border-white/10">Custom RTMP Server</code>.</li>
            <li>Isi <strong className="text-white">URL / Server</strong>: <code className="bg-black/60 px-2 py-0.5 rounded text-white font-mono border border-white/10">rtmp://103.160.62.250:1935/live</code></li>
            <li>Isi <strong className="text-white">Stream Key / Stream Name</strong>: <code className="bg-black/60 px-2 py-0.5 rounded text-[#E50914] font-mono font-bold border border-[#E50914]/30">{activeStreamKey}</code></li>
            <li>Klik <strong className="text-white">Save and Close</strong>, tambahkan Input Video di vMix, lalu klik tombol <strong className="text-[#E50914]">Stream</strong> di vMix untuk mulai siaran live!</li>
          </ol>
        </div>

      </div>

      {/* Channels Table */}
      <div className="rounded-2xl border border-white/5 bg-[#121212] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-sans min-w-[900px]">
            <thead className="bg-black/60 text-neutral-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3.5 px-4 w-72">Preview & Info Channel</th>
                <th className="py-3.5 px-4 w-48">Kategori</th>
                <th className="py-3.5 px-4">OBS Stream Key & URL Web</th>
                <th className="py-3.5 px-4 w-40">Tipe & Status</th>
                <th className="py-3.5 px-4 text-right w-44">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {channels.map((chan) => {
                const isHeroPinned = pinnedId === chan.id;
                const isGuideSelected = activeGuideChannel?.id === chan.id;
                const chanObsKey = chan.slug;
                const chanHlsUrl = chan.hlsUrl;

                return (
                  <tr
                    key={chan.id}
                    onClick={() => setSelectedGuideChannelId(chan.id)}
                    className={`transition-colors cursor-pointer ${
                      isGuideSelected ? 'bg-white/10 border-l-4 border-l-[#E50914]' : 'hover:bg-white/5'
                    }`}
                  >
                    
                    {/* Channel Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={chan.thumbnail}
                          alt={chan.name}
                          className="w-14 h-9 object-cover rounded-lg border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs truncate">{chan.name}</span>
                            {isGuideSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/20 text-white uppercase font-mono border border-white/20">
                                ACTIVE GUIDE
                              </span>
                            )}
                            {isHeroPinned && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#E50914] text-white uppercase font-mono whitespace-nowrap">
                                HERO
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#A3A3A3] font-sans block mt-0.5 truncate max-w-[200px]" title={chan.currentProgram}>
                            {chan.currentProgram}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-[11px]">
                        <Layers className="w-3 h-3 text-[#E50914]" />
                        <span>{chan.category || 'Tanpa Kategori'}</span>
                      </span>
                    </td>

                    {/* OBS Stream Key & Web URL */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#737373] font-bold uppercase">OBS Key:</span>
                          <span className="bg-black/80 px-2 py-0.5 rounded border border-[#E50914]/40 text-[#E50914] font-bold text-xs">
                            {chanObsKey}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(chanObsKey, `key-${chan.id}`);
                            }}
                            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            title="Salin Stream Key OBS"
                          >
                            {copiedKey === `key-${chan.id}` ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-[#A3A3A3]">
                          <span className="text-[#737373] font-bold uppercase">Web HLS:</span>
                          <span className="text-white truncate max-w-[220px]">{chanHlsUrl}</span>
                        </div>
                      </div>
                    </td>

                    {/* Type & Status */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={chan.activeSource || 'hls'}
                          onChange={(e) => toggleChannelSource(chan.id, e.target.value as any)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border focus:outline-none cursor-pointer ${
                            chan.activeSource === 'hls'
                              ? 'bg-[#E50914] text-white border-[#E50914]'
                              : chan.activeSource === 'playlist'
                              ? 'bg-amber-600 text-white border-amber-500'
                              : chan.activeSource === 'recording'
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-blue-600 text-white border-blue-500'
                          }`}
                        >
                          <option value="hls">🔴 Live Ingest OBS</option>
                          <option value="playlist">🎬 Playlist 24/7 MP4</option>
                          <option value="recording">📹 Hasil Rekaman VOD</option>
                          <option value="youtube">📺 YouTube Embed</option>
                        </select>

                        {chan.activeSource === 'recording' && (
                          <select
                            value={chan.selectedRecordingUrl || chan.recordedPlaybackUrl || ''}
                            onChange={(e) => toggleChannelSource(chan.id, 'recording', e.target.value)}
                            className="block max-w-[170px] text-[9px] bg-black/90 border border-emerald-500/40 text-emerald-300 rounded px-1.5 py-1 font-mono focus:outline-none truncate"
                          >
                            <option value="">-- Pilih File Rekaman --</option>
                            {(channelRecordings[chan.slug] || []).map((rec) => (
                              <option key={rec.id} value={rec.playbackUrl}>
                                {rec.recordedAt || rec.filename}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Playlist MP4 Button */}
                        <button
                          onClick={() => setPlaylistModalChannel(chan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E50914]/20 hover:bg-[#E50914] text-white font-bold text-[10px] border border-[#E50914]/40 transition-all cursor-pointer shrink-0"
                          title="Upload & Kelola Playlist MP4 24 Jam"
                        >
                          <Film className="w-3.5 h-3.5 text-[#E50914] group-hover:text-white" />
                          <span>Playlist MP4</span>
                        </button>

                        {/* Edit Channel Button */}
                        <button
                          onClick={() => setEditingChannel(chan)}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 cursor-pointer"
                          title="Edit Title, Kategori, & Stream"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-white" />
                        </button>

                        {/* Pin Button */}
                        <button
                          onClick={() => setPinnedId(isHeroPinned ? null : chan.id)}
                          className={`p-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                            isHeroPinned
                              ? 'bg-[#E50914] text-white border-[#E50914]'
                              : 'bg-white/5 text-neutral-400 hover:text-white border-white/10'
                          }`}
                          title={isHeroPinned ? 'Tersemat di Hero Banner' : 'Sematkan ke Hero Banner'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        {/* Switch HLS / YouTube */}
                        <button
                          onClick={() => toggleChannelSource(chan.id, chan.activeSource === 'hls' ? 'youtube' : 'hls')}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] border border-white/10 transition-all cursor-pointer"
                        >
                          {chan.activeSource === 'hls' ? 'YouTube' : 'HLS'}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteConfirmChannel(chan)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                          title="Hapus Channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT CHANNEL MODAL */}
      {editingChannel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-white/10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" /> Edit Channel: {editingChannel.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ubah judul, kategori, slug key, thumbnail gambar, atau url stream channel.
                </p>
              </div>
              <button onClick={() => setEditingChannel(null)} className="p-1.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white border border-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-sans">
              
              {/* Channel Name */}
              <div>
                <label className="block font-bold text-neutral-200 mb-1">Judul Siaran / Nama Channel</label>
                <input
                  type="text"
                  required
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block font-bold text-neutral-200 mb-1 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#E50914]" />
                  <span>Kategori Program Siaran</span>
                </label>
                <select
                  value={editingChannel.category || (categories[0] || 'Tanpa Kategori')}
                  onChange={(e) => setEditingChannel({ ...editingChannel, category: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold focus:border-[#E50914] focus:outline-none"
                >
                  {categories.length > 0 ? (
                    categories.map((cat, idx) => (
                      <option key={idx} value={cat} className="bg-[#121212] text-white">
                        {cat}
                      </option>
                    ))
                  ) : (
                    <option value="Tanpa Kategori" className="bg-[#121212] text-white">
                      Tanpa Kategori
                    </option>
                  )}
                </select>
              </div>

              {/* Slug Identifier */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1 font-mono">Slug Identifier (Unique Key OBS)</label>
                <input
                  type="text"
                  required
                  value={editingChannel.slug}
                  onChange={(e) => setEditingChannel({ ...editingChannel, slug: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Stream Type */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Tipe Source Stream</label>
                <select
                  value={editingChannel.activeSource}
                  onChange={(e) => setEditingChannel({ ...editingChannel, activeSource: e.target.value as 'hls' | 'youtube' })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold font-mono focus:border-[#E50914] focus:outline-none"
                >
                  <option value="hls">🔴 Live VPS MediaMTX Stream (Auto OBS Ingest)</option>
                  <option value="youtube">▶️ YouTube Embed Stream</option>
                </select>
              </div>

              {/* HLS M3U8 URL */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1 font-mono">RTM HLS M3U8 URL</label>
                <input
                  type="text"
                  required
                  value={editingChannel.hlsUrl}
                  onChange={(e) => setEditingChannel({ ...editingChannel, hlsUrl: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* YouTube Embed URL */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1 font-mono">YouTube Embed URL</label>
                <input
                  type="text"
                  required
                  value={editingChannel.youtubeUrl}
                  onChange={(e) => setEditingChannel({ ...editingChannel, youtubeUrl: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Deskripsi / Program Saat Ini</label>
                <textarea
                  rows={2}
                  value={editingChannel.currentProgram}
                  onChange={(e) => setEditingChannel({ ...editingChannel, currentProgram: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Thumbnail Upload & URL Input */}
              <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/10">
                <label className="block font-bold text-neutral-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#E50914]" />
                  <span>Thumbnail Gambar Channel</span>
                </label>

                {/* Option 1: File Upload */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Upload File Gambar Baru dari Komputer:</label>
                  <div className="relative flex items-center justify-center p-4 border-2 border-dashed border-white/20 hover:border-[#E50914] rounded-xl bg-white/5 transition-all cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 text-neutral-300 group-hover:text-white font-bold text-xs">
                      <Upload className="w-4 h-4 text-[#E50914]" />
                      <span>Klik untuk Pilih File Gambar Baru (PNG / JPG / WEBP)</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-neutral-500 font-mono font-bold uppercase">— ATAU MASUKKAN URL GAMBAR —</div>

                {/* Option 2: Image URL */}
                <div>
                  <input
                    type="text"
                    value={editingChannel.thumbnail}
                    onChange={(e) => setEditingChannel({ ...editingChannel, thumbnail: e.target.value })}
                    className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                {/* Live Preview */}
                {editingChannel.thumbnail && (
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <img
                      src={editingChannel.thumbnail}
                      alt="Preview Thumbnail"
                      className="w-20 h-12 object-cover rounded-lg border border-white/20 shadow-md"
                    />
                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Preview Thumbnail Gambar Siap
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-Record Toggle Switch */}
              <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#E50914]" />
                    <span>Rekam Siaran Otomatis (Auto-Record)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Jika aktif, siaran live dari vMix/OBS akan otomatis direkam di server VPS dan dapat diputar ulang (Replay) dari awal hingga akhir ketika siaran live selesai.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={editingChannel.autoRecord !== false}
                    onChange={(e) => setEditingChannel({ ...editingChannel, autoRecord: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E50914]"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#E50914] text-white hover:bg-red-700 font-extrabold shadow-lg shadow-red-900/30 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADD CHANNEL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-white/10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E50914]" /> Tambah Saluran TV Streaming Baru
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Isi nama channel, pilih kategori program, dan upload thumbnail gambar.
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white border border-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-sans">
              
              {/* Channel Name */}
              <div>
                <label className="block font-bold text-neutral-200 mb-1">Judul Siaran / Nama Channel</label>
                <input
                  type="text"
                  required
                  placeholder="misal: RTM Sports & Culture"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block font-bold text-neutral-200 mb-1 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#E50914]" />
                  <span>Kategori Program Siaran</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold focus:border-[#E50914] focus:outline-none"
                >
                  {categories.length > 0 ? (
                    categories.map((cat, idx) => (
                      <option key={idx} value={cat} className="bg-[#121212] text-white">
                        {cat}
                      </option>
                    ))
                  ) : (
                    <option value="Tanpa Kategori" className="bg-[#121212] text-white">
                      Tanpa Kategori
                    </option>
                  )}
                </select>
              </div>

              {/* Slug Identifier */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1 font-mono">Slug Identifier (Unique Key OBS)</label>
                <input
                  type="text"
                  required
                  placeholder="misal: rtm-sports"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Stream Type */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Tipe Source Stream</label>
                <select
                  value={streamType}
                  onChange={(e) => setStreamType(e.target.value as 'hls' | 'youtube')}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold font-mono focus:border-[#E50914] focus:outline-none"
                >
                  <option value="hls">🔴 Live VPS MediaMTX Stream (Auto OBS Ingest)</option>
                  <option value="youtube">▶️ YouTube Embed Stream</option>
                </select>
              </div>

              {/* AUTO GENERATED OBS CREDENTIALS BOX (when HLS selected) */}
              {streamType === 'hls' && (
                <div className="p-4 bg-amber-950/30 rounded-2xl border border-amber-500/30 space-y-3 font-mono">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-amber-500/20 pb-2">
                    <Info className="w-4 h-4" />
                    <span>Kredensial OBS Studio (Auto-Generated)</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between p-2 bg-black/60 rounded-xl border border-white/10">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Server Destination OBS:</span>
                        <span className="text-white font-bold">{obsServerUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(obsServerUrl, 'obs-server')}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedKey === 'obs-server' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'obs-server' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-black/60 rounded-xl border border-white/10">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Stream Key OBS:</span>
                        <span className="text-amber-400 font-bold text-xs">{obsStreamKey}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(obsStreamKey, 'obs-key')}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedKey === 'obs-key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'obs-key' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-black/60 rounded-xl border border-white/10">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Web Player HLS URL:</span>
                        <span className="text-cyan-400 font-bold">{calculatedHlsUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(calculatedHlsUrl, 'web-hls')}
                        className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedKey === 'web-hls' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'web-hls' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {streamType === 'youtube' && (
                <div>
                  <label className="block font-bold text-neutral-300 mb-1 font-mono">YouTube Embed URL</label>
                  <input
                    type="text"
                    required
                    placeholder="https://www.youtube.com/embed/..."
                    value={customStreamUrl}
                    onChange={(e) => setCustomStreamUrl(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Deskripsi Program Siaran</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat program siaran (misal: Siaran Olahraga & Budaya Timor-Leste)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Thumbnail Upload & URL Input */}
              <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/10">
                <label className="block font-bold text-neutral-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#E50914]" />
                  <span>Thumbnail Gambar Channel</span>
                </label>

                {/* Option 1: File Upload */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Upload File Gambar dari Komputer:</label>
                  <div className="relative flex items-center justify-center p-4 border-2 border-dashed border-white/20 hover:border-[#E50914] rounded-xl bg-white/5 transition-all cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAddFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 text-neutral-300 group-hover:text-white font-bold text-xs">
                      <Upload className="w-4 h-4 text-[#E50914]" />
                      <span>Klik untuk Pilih File Gambar (PNG / JPG / WEBP)</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-neutral-500 font-mono font-bold uppercase">— ATAU MASUKKAN URL GAMBAR —</div>

                {/* Option 2: Image URL */}
                <div>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                {/* Live Preview */}
                {thumbnail && (
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <img
                      src={thumbnail}
                      alt="Preview Thumbnail"
                      className="w-20 h-12 object-cover rounded-lg border border-white/20 shadow-md"
                    />
                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Preview Thumbnail Gambar Siap
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-Record Toggle Switch */}
              <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#E50914]" />
                    <span>Rekam Siaran Otomatis (Auto-Record)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Jika aktif, siaran live dari vMix/OBS akan otomatis direkam di server VPS dan dapat diputar ulang (Replay) dari awal hingga akhir ketika siaran live selesai.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={autoRecord}
                    onChange={(e) => setAutoRecord(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E50914]"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#E50914] text-white hover:bg-red-700 font-extrabold shadow-lg shadow-red-900/30 cursor-pointer"
                >
                  Simpan & Buat Channel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE CHANNEL MODAL */}
      {deleteConfirmChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans animate-in fade-in">
          <div className="bg-[#121212] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Channel</h3>
                <p className="text-xs text-neutral-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
              <p className="text-neutral-300">
                Apakah Anda yakin ingin menghapus channel <strong className="text-white">"{deleteConfirmChannel.name}"</strong> secara permanen?
              </p>
              <ul className="list-disc list-inside text-neutral-400 space-y-1 text-[11px]">
                <li>Channel akan terhapus total dari Database PostgreSQL VPS.</li>
                <li>Seluruh file video rekaman (Auto-Record) di VPS akan dibersihkan.</li>
                <li>Channel tidak akan pernah muncul kembali saat di-refresh.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmChannel(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold text-xs cursor-pointer"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  await deleteChannel(deleteConfirmChannel.id);
                  setIsDeleting(false);
                  setDeleteConfirmChannel(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-900/40 cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYLIST MANAGER MODAL */}
      {playlistModalChannel && (
        <PlaylistManagerModal
          channel={playlistModalChannel}
          onClose={() => setPlaylistModalChannel(null)}
        />
      )}

    </div>
  );
}
