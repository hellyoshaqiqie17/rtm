'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStreamContext, RadioChannel } from '@/context/StreamContext';
import RadioPlaylistManagerModal from '@/components/RadioPlaylistManagerModal';
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  X,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Play,
  Pause,
  Mic,
  Server,
  Key,
  Globe,
  Music,
  RotateCcw,
  Activity,
  Disc,
  CheckCircle2,
  AlertTriangle,
  Film
} from 'lucide-react';

export default function AdminSiaranCenterPage() {
  const {
    radioChannels,
    activeRadioChannelId,
    setActiveRadioChannelId,
    addRadioChannel,
    updateRadioChannel,
    deleteRadioChannel,
    resetRadioChannels,
    toggleRadioChannelSource,
    categories
  } = useStreamContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRadio, setEditingRadio] = useState<RadioChannel | null>(null);
  const [deleteConfirmRadio, setDeleteConfirmRadio] = useState<RadioChannel | null>(null);
  const [isDeletingRadio, setIsDeletingRadio] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [sourceToast, setSourceToast] = useState<{ message: string } | null>(null);

  // Real-time backend radio status
  const [radioStatus, setRadioStatus] = useState<{
    online: boolean;
    listeners: number;
    nowPlaying: { artist: string; title: string };
    liveDjConnected: boolean;
    autoDjRunning: boolean;
  }>({
    online: true,
    listeners: 0,
    nowPlaying: { artist: 'AutoDJ', title: 'RTM Radio Stream 24/7' },
    liveDjConnected: false,
    autoDjRunning: true,
  });

  // Audio preview player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Form states for New Radio Station
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [streamUrl, setStreamUrl] = useState('/radio/live');
  const [isAutoUrl, setIsAutoUrl] = useState(true);
  const [thumbnail, setThumbnail] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || 'Tanpa Kategori');

  const activeStation = radioChannels.find((r) => r.id === activeRadioChannelId) || radioChannels[0];

  // Get current active mount slug
  const activeMountSlug = activeStation?.streamUrl
    ? activeStation.streamUrl.replace('/radio', '') || '/live'
    : '/live';

  // Fetch real-time radio status from API
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/streaming/status');
        if (res.ok) {
          const data = await res.json();
          if (data?.services?.radio) {
            setRadioStatus({
              online: data.services.radio.status === 'ONLINE',
              listeners: data.services.radio.listeners || 0,
              nowPlaying: data.services.radio.nowPlaying || { artist: 'AutoDJ', title: 'RTM Radio Stream' },
              liveDjConnected: !!data.services.radio.liveDjConnected,
              autoDjRunning: data.services.radio.autoDjRunning ?? true,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching radio status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories]);

  // Auto-generate dynamic UNIQUE slug URL when radio station name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (isAutoUrl) {
      const baseSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (!baseSlug) {
        setStreamUrl('/radio/live');
        return;
      }

      let candidate = `/radio/${baseSlug}`;
      let counter = 2;
      const existingUrls = radioChannels.map((r) => r.streamUrl);
      while (existingUrls.includes(candidate)) {
        candidate = `/radio/${baseSlug}-${counter}`;
        counter++;
      }

      setStreamUrl(candidate);
    }
  };

  // Format display stream URL (make relative paths show as full HTTPS URL for clarity)
  const getFullStreamUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://rtm.tl${url.startsWith('/') ? '' : '/'}${url}`;
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
    if (!file || !editingRadio) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditingRadio({ ...editingRadio, thumbnail: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePreviewPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio.load();
      audio.play().then(() => setIsPlayingPreview(true)).catch(console.error);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addRadioChannel({
      name,
      description: description || `Siaran Radio (${name})`,
      streamUrl: streamUrl || '/radio/live',
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      category: category || (categories[0] || 'Tanpa Kategori'),
      enabled: true,
    });

    // Reset form
    setName('');
    setDescription('');
    setStreamUrl('/radio/live');
    setIsAutoUrl(true);
    setThumbnail('');
    setCategory(categories[0] || 'Tanpa Kategori');
    setIsAddModalOpen(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRadio) return;
    updateRadioChannel(editingRadio);
    setEditingRadio(null);
  };

  const handleSourceChange = (stationId: string, stationName: string, source: 'icecast' | 'playlist') => {
    toggleRadioChannelSource(stationId, source);
    const label = source === 'playlist' ? 'MP3 Playlist 24/7 (AutoDJ)' : 'Live External Stream (Mixxx/BUTT)';
    setSourceToast({ message: `Sumber siaran stasiun "${stationName}" berhasil diubah ke: ${label}` });
    setTimeout(() => setSourceToast(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Hidden Audio Player for Admin Testing */}
      <audio
        ref={audioRef}
        src={activeStation?.streamUrl || '/radio/live'}
        preload="none"
        onEnded={() => setIsPlayingPreview(false)}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-[#E50914]" /> Kelola Stasiun Radio Online & Live DJ Ingest
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Bisa menggunakan slug mount channel apapun (misal: /testing, /live, /berita) langsung dari Mixxx/BUTT.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">

          <button
            onClick={() => {
              setName('');
              setDescription('');
              setStreamUrl('/radio/live');
              setIsAutoUrl(true);
              setThumbnail('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 text-xs font-extrabold shadow-lg shadow-red-900/40 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Stasiun Radio Baru</span>
          </button>
        </div>
      </div>

      {/* REAL-TIME RADIO SERVER STATUS CARDS (Netflix Dark Theme) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
        
        {/* AutoDJ Status */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#A3A3A3] text-xs font-mono">
            <span className="flex items-center gap-1.5 font-bold uppercase text-white">
              <Disc className="w-4 h-4 animate-spin text-[#E50914]" style={{ animationDuration: '6s' }} /> AutoDJ 24/7 Engine
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/10 uppercase font-mono">
              ● RUNNING
            </span>
          </div>
          <div className="text-white font-bold text-sm">FFmpeg Background Worker</div>
          <p className="text-[11px] text-[#A3A3A3]">
            Mount: <span className="font-mono text-white font-bold">/autodj</span> • Playlist MP3 24 Jam Looping Otomatis
          </p>
        </div>

        {/* Live DJ Ingest Status */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#A3A3A3] text-xs font-mono">
            <span className="flex items-center gap-1.5 font-bold uppercase text-white">
              <Mic className={`w-4 h-4 ${radioStatus.liveDjConnected ? 'animate-pulse text-[#E50914]' : 'text-neutral-500'}`} /> Live DJ Broadcast
            </span>
            {radioStatus.liveDjConnected ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E50914] text-white uppercase font-mono animate-pulse">
                🔴 LIVE ON AIR
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-[#A3A3A3] border border-white/10 uppercase font-mono">
                ○ STANDBY (Mixxx/BUTT)
              </span>
            )}
          </div>
          <div className="text-white font-bold text-sm">
            {radioStatus.liveDjConnected ? 'Penyiar Terhubung (Mixxx/BUTT)' : 'Menunggu Siaran Live'}
          </div>
          <p className="text-[11px] text-[#A3A3A3]">
            Mount Active: <span className="font-mono text-[#E50914] font-bold">{activeMountSlug}</span> • Fallback: <span className="text-white font-bold">/autodj</span>
          </p>
        </div>

        {/* Now Playing & Listeners */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#A3A3A3] text-xs font-mono">
            <span className="flex items-center gap-1.5 font-bold uppercase text-white">
              <Activity className="w-4 h-4 text-[#E50914]" /> Real-Time Analytics
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/10 font-mono">
              {radioStatus.listeners} Pendengar
            </span>
          </div>
          <div className="text-white font-bold text-sm truncate">
            {radioStatus.nowPlaying.artist} - {radioStatus.nowPlaying.title}
          </div>
          <p className="text-[11px] text-[#A3A3A3]">
            Format: <span className="font-mono text-white font-bold">MP3 128 kbps</span> • Status Server: <span className="text-white font-bold">ONLINE</span>
          </p>
        </div>

      </div>

      {/* MASTER BROADCAST SOURCE CONTROLLER CARD (RADIO) */}
      {activeStation && (
        <div className="bg-[#181818] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 font-sans relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
                <Disc className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Radio Master Broadcast Source Controller</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-600/20 text-orange-400 border border-orange-500/40 uppercase font-mono">
                    LIVE CONTROL
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Atur sumber siaran radio yang aktif tampil di web publik untuk stasiun: <strong className="text-white font-bold">{activeStation.name}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPlaylistModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <Music className="w-4 h-4" />
              <span>Kelola Playlist MP3 24/7</span>
            </button>
          </div>

          {/* Toast Notification Banner for Radio Source Change */}
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

          {/* 2 Mode Selector Buttons for Radio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Mode 1: Live Stream External (Mixxx / BUTT / Icecast) */}
            <button
              type="button"
              onClick={() => handleSourceChange(activeStation.id, activeStation.name, 'icecast')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                activeStation.activeSource !== 'playlist'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-900/40 font-bold'
                  : 'bg-black/60 text-neutral-300 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Mic className="w-4 h-4" /> Live External Stream (Mixxx / BUTT)
                </span>
                {activeStation.activeSource !== 'playlist' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                )}
              </div>
              <p className="text-[10px] opacity-80 leading-snug">
                Siaran langsung secara realtime dari software Mixxx, BUTT, atau Audio Hijack ke server Icecast.
              </p>
            </button>

            {/* Mode 2: MP3 Playlist 24/7 (AutoDJ) */}
            <button
              type="button"
              onClick={() => handleSourceChange(activeStation.id, activeStation.name, 'playlist')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                activeStation.activeSource === 'playlist'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-900/40 font-bold'
                  : 'bg-black/60 text-neutral-300 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Music className="w-4 h-4" /> MP3 Playlist 24/7 (AutoDJ)
                </span>
                {activeStation.activeSource === 'playlist' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                )}
              </div>
              <p className="text-[10px] opacity-80 leading-snug">
                Siaran otomatis 24 jam non-stop memutar daftar trek lagu MP3 yang telah diunggah.
              </p>
            </button>

          </div>

        </div>
      )}

      {/* LIVE DJ INGEST CONNECTION & AUDIO TESTER CARD (Netflix Dark Theme) */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6 font-sans relative overflow-hidden">
        
        {/* Header & Status Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center text-[#E50914] shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Panduan Koneksi Live DJ (Mixxx / BUTT / Audio Hijack)</span>
              </h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                Kredensial di bawah ini otomatis menyesuaikan dengan stasiun terpilih: <strong className="text-white font-bold">{activeStation?.name}</strong>
              </p>
            </div>
          </div>

          {/* Audio Tester Toggle */}
          <div className="flex items-center gap-3 bg-[#121212] p-2 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={togglePreviewPlay}
              className="w-10 h-10 rounded-lg bg-[#E50914] hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
              title={isPlayingPreview ? 'Hentikan Tes Audio' : 'Putar Tes Audio Siaran'}
            >
              {isPlayingPreview ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <div className="text-left pr-2">
              <span className="text-xs font-bold text-white block">
                {isPlayingPreview ? 'Mendengar Siaran Live' : 'Tes Audio Radio'}
              </span>
              <span className="text-[10px] text-[#A3A3A3] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse"></span> {activeStation?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
          
          {/* Server Host & Port */}
          <div className="bg-[#121212] p-4 rounded-xl border border-white/10 space-y-1.5 relative">
            <div className="flex items-center justify-between text-[#A3A3A3] font-mono text-[10px] uppercase tracking-wider">
              <span>1. Host IP Server</span>
              <button
                onClick={() => copyToClipboard('103.160.62.250', 'hostip')}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                title="Salin IP"
              >
                {copiedKey === 'hostip' ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono font-bold text-white text-sm">103.160.62.250</div>
            <div className="text-[10px] text-[#737373] font-mono">Port: <span className="text-white font-medium">8000</span></div>
          </div>

          {/* Mount Point Ingest (Dynamic per selected station) */}
          <div className="bg-[#121212] p-4 rounded-xl border border-white/10 space-y-1.5 relative">
            <div className="flex items-center justify-between text-[#A3A3A3] font-mono text-[10px] uppercase tracking-wider">
              <span>2. Mount Point Ingest</span>
              <button
                onClick={() => copyToClipboard(activeMountSlug, 'mount')}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                title="Salin Mount"
              >
                {copiedKey === 'mount' ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono font-bold text-[#E50914] text-base">{activeMountSlug}</div>
            <div className="text-[10px] text-[#737373] font-mono">Stasiun: <span className="text-white">{activeStation?.name}</span></div>
          </div>

          {/* Source Username & Password */}
          <div className="bg-[#121212] p-4 rounded-xl border border-white/10 space-y-1.5 relative">
            <div className="flex items-center justify-between text-[#A3A3A3] font-mono text-[10px] uppercase tracking-wider">
              <span>3. User & Pass Source</span>
              <button
                onClick={() => copyToClipboard('source / RtmRadioLive2026!', 'pass')}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                title="Salin Password"
              >
                {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono font-bold text-white text-sm">source / RtmRadioLive2026!</div>
            <div className="text-[10px] text-[#737373] font-mono">Login: <span className="text-white font-medium">source</span></div>
          </div>

          {/* Public HTTPS Stream URL */}
          <div className="bg-[#121212] p-4 rounded-xl border border-white/10 space-y-1.5 relative">
            <div className="flex items-center justify-between text-[#A3A3A3] font-mono text-[10px] uppercase tracking-wider">
              <span>4. URL Stream Web</span>
              <button
                onClick={() => copyToClipboard(getFullStreamUrl(activeStation?.streamUrl || '/radio/live'), 'pub')}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                title="Salin URL Stream Web"
              >
                {copiedKey === 'pub' ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono font-bold text-white text-xs truncate" title={getFullStreamUrl(activeStation?.streamUrl || '/radio/live')}>
              {getFullStreamUrl(activeStation?.streamUrl || '/radio/live')}
            </div>
            <div className="text-[10px] text-[#737373] font-mono">Tampil di <span className="text-white">https://rtm.tl/radio</span></div>
          </div>

        </div>

        {/* Mixxx Setup Instructions */}
        <div className="p-4 bg-[#121212] border border-white/10 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-white text-xs">
            <span className="w-2 h-2 rounded-full bg-[#E50914]"></span>
            <span>Langkah Konfigurasi Siaran Live di Software Mixxx:</span>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-1 text-[11px]">
            
            <div className="bg-black/60 p-3 rounded-lg border border-white/10 space-y-1">
              <span className="font-bold text-white block">✅ KONFIGURASI KONEKSI INGGEST (MIXXX / BUTT / AUDIO HIJACK):</span>
              <ul className="list-disc list-inside text-[#A3A3A3] font-mono space-y-0.5">
                <li>Host: <code className="bg-black px-1.5 py-0.5 rounded text-white font-bold">103.160.62.250</code></li>
                <li>Port: <code className="bg-black px-1.5 py-0.5 rounded text-white font-bold">8000</code></li>
                <li>Mount: <code className="bg-black px-1.5 py-0.5 rounded text-[#E50914] font-bold">{activeMountSlug}</code></li>
                <li>Login: <code className="bg-black px-1.5 py-0.5 rounded text-white font-bold">source</code></li>
                <li>Pass: <code className="bg-black px-1.5 py-0.5 rounded text-white font-bold">RtmRadioLive2026!</code></li>
              </ul>
            </div>

          </div>
        </div>

      </div>

      {/* Radio Channels Table */}
      <div className="rounded-2xl border border-white/5 bg-[#121212] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-sans min-w-[850px]">
            <thead className="bg-black/60 text-neutral-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3.5 px-4 w-72">Preview & Stasiun Radio</th>
                <th className="py-3.5 px-4 w-44">Kategori</th>
                <th className="py-3.5 px-4">URL Stream Audio (Unik Per Channel)</th>
                <th className="py-3.5 px-4 w-36">Status Siaran</th>
                <th className="py-3.5 px-4 text-right w-40">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {radioChannels.map((st) => {
                const isActive = st.id === activeRadioChannelId;
                const fullUrl = getFullStreamUrl(st.streamUrl);

                return (
                  <tr
                    key={st.id}
                    onClick={() => setActiveRadioChannelId(st.id)}
                    className={`transition-colors cursor-pointer ${
                      isActive ? 'bg-white/10 border-l-4 border-l-[#E50914]' : 'hover:bg-white/5'
                    }`}
                  >
                    
                    {/* Radio Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.thumbnail}
                          alt={st.name}
                          className="w-11 h-11 object-cover rounded-xl border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs truncate">{st.name}</span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#E50914] text-white uppercase font-mono whitespace-nowrap">
                                ACTIVE GUIDE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#A3A3A3] font-sans block mt-0.5 truncate max-w-[200px]" title={st.description}>
                            {st.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-[11px]">
                        <Layers className="w-3 h-3 text-[#E50914]" />
                        <span>{st.category || 'Tanpa Kategori'}</span>
                      </span>
                    </td>

                    {/* Stream URL */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="bg-black/80 px-2 py-0.5 rounded border border-white/10 text-white font-medium truncate max-w-[280px] text-xs" title={fullUrl}>{fullUrl}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(fullUrl, `url-${st.id}`);
                          }}
                          className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Salin URL Stream"
                        >
                          {copiedKey === `url-${st.id}` ? <Check className="w-3.5 h-3.5 text-[#E50914]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <span className="block text-[10px] text-[#A3A3A3] font-bold">
                        ● BROADCAST READY
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Make Active Radio Button */}
                        <button
                          onClick={() => setActiveRadioChannelId(st.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                            isActive
                              ? 'bg-[#E50914] text-white border-[#E50914]'
                              : 'bg-white/5 text-neutral-400 hover:text-white border-white/10'
                          }`}
                          title={isActive ? 'Stasiun Radio Terpilih' : 'Pilih Stasiun Radio Ini'}
                        >
                          {isActive ? 'Aktif' : 'Pilih Radio'}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingRadio(st)}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 cursor-pointer"
                          title="Edit Stasiun Radio"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-white" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteConfirmRadio(st)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                          title="Hapus Stasiun Radio"
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

      {/* EDIT RADIO MODAL */}
      {editingRadio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-white/10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" /> Edit Stasiun Radio: {editingRadio.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ubah nama stasiun radio, deskripsi, URL stream audio dinamis, atau thumbnail gambar.
                </p>
              </div>
              <button onClick={() => setEditingRadio(null)} className="p-1.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white border border-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-sans">
              
              {/* Radio Name */}
              <div>
                <label className="block font-bold text-neutral-200 mb-1">Nama Stasiun Radio</label>
                <input
                  type="text"
                  required
                  value={editingRadio.name}
                  onChange={(e) => setEditingRadio({ ...editingRadio, name: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block font-bold text-neutral-200 mb-1 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#E50914]" />
                  <span>Kategori Program Radio</span>
                </label>
                <select
                  value={editingRadio.category || (categories[0] || 'Tanpa Kategori')}
                  onChange={(e) => setEditingRadio({ ...editingRadio, category: e.target.value })}
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

              {/* Stream URL */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1 font-mono">URL Stream Audio Dinamis Channel Ini</label>
                <input
                  type="text"
                  required
                  value={editingRadio.streamUrl}
                  onChange={(e) => setEditingRadio({ ...editingRadio, streamUrl: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-cyan-400 font-mono font-bold focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Deskripsi / Subtitle Stasiun Radio</label>
                <textarea
                  rows={2}
                  value={editingRadio.description}
                  onChange={(e) => setEditingRadio({ ...editingRadio, description: e.target.value })}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Thumbnail Upload & URL Input */}
              <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/10">
                <label className="block font-bold text-neutral-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#E50914]" />
                  <span>Thumbnail Cover Radio</span>
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
                    value={editingRadio.thumbnail}
                    onChange={(e) => setEditingRadio({ ...editingRadio, thumbnail: e.target.value })}
                    className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                {/* Live Preview */}
                {editingRadio.thumbnail && (
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <img
                      src={editingRadio.thumbnail}
                      alt="Preview Cover"
                      className="w-12 h-12 object-cover rounded-lg border border-white/20 shadow-md"
                    />
                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Preview Gambar Cover Siap
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingRadio(null)}
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

      {/* ADD RADIO MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-white/10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#E50914]" /> Tambah Stasiun Radio Online Baru
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Setiap stasiun radio akan otomatis memiliki URL stream audio unik per channel.
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white border border-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-sans">
              
              {/* Radio Name */}
              <div>
                <label className="block font-bold text-neutral-200 mb-1">Nama Stasiun Radio</label>
                <input
                  type="text"
                  required
                  placeholder="misal: RTM Radio Musik & Kebudayaan"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block font-bold text-neutral-200 mb-1 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#E50914]" />
                  <span>Kategori Program Radio</span>
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

              {/* Stream URL (Dynamic Per Channel) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-neutral-200 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>URL Stream Audio (Dinamis Unik Per Channel)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAutoUrl(!isAutoUrl)}
                    className="text-[10px] text-[#E50914] hover:underline font-mono"
                  >
                    {isAutoUrl ? '✏️ Custom URL' : '⚡ Auto Slug URL'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="/radio/rtm-radio-musik"
                  value={streamUrl}
                  readOnly={isAutoUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className={`w-full p-3 rounded-xl font-mono text-cyan-400 font-bold border ${
                    isAutoUrl ? 'bg-black/80 border-cyan-500/30' : 'bg-black/60 border-white/10 focus:border-[#E50914]'
                  } focus:outline-none`}
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  URL ini dibuat otomatis berdasarkan nama stasiun radio agar setiap channel memiliki link stream unik tersendiri.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Deskripsi / Subtitle Stasiun Radio</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi program radio (misal: Lagu-lagu daerah & kebudayaan 24 jam non-stop)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Thumbnail Upload & URL Input */}
              <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/10">
                <label className="block font-bold text-neutral-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#E50914]" />
                  <span>Thumbnail Cover Radio</span>
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
                      alt="Preview Cover"
                      className="w-12 h-12 object-cover rounded-lg border border-white/20 shadow-md"
                    />
                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Preview Gambar Cover Siap
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-[#121212] text-neutral-300 hover:text-white font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#E50914] text-white hover:bg-red-700 font-extrabold shadow-lg shadow-red-900/30 cursor-pointer"
                >
                  Simpan & Buat Stasiun Radio
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE RADIO MODAL */}
      {deleteConfirmRadio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans animate-in fade-in">
          <div className="bg-[#121212] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Radio</h3>
                <p className="text-xs text-neutral-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
              <p className="text-neutral-300">
                Apakah Anda yakin ingin menghapus stasiun radio <strong className="text-white">"{deleteConfirmRadio.name}"</strong> secara permanen?
              </p>
              <ul className="list-disc list-inside text-neutral-400 space-y-1 text-[11px]">
                <li>Stasiun Radio akan terhapus total dari Database PostgreSQL VPS.</li>
                <li>Stasiun radio tidak akan pernah muncul kembali saat di-refresh.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRadio(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold text-xs cursor-pointer"
                disabled={isDeletingRadio}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeletingRadio(true);
                  await deleteRadioChannel(deleteConfirmRadio.id);
                  setIsDeletingRadio(false);
                  setDeleteConfirmRadio(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-900/40 cursor-pointer"
                disabled={isDeletingRadio}
              >
                {isDeletingRadio ? (
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

      {/* RADIO MP3 PLAYLIST MANAGER MODAL */}
      {isPlaylistModalOpen && activeStation && (
        <RadioPlaylistManagerModal
          station={activeStation}
          onClose={() => setIsPlaylistModalOpen(false)}
        />
      )}

    </div>
  );
}
