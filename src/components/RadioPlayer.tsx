'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStreamContext } from '@/context/StreamContext';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio as RadioIcon,
  Layers,
  SkipForward,
  SkipBack,
  Music,
  Disc
} from 'lucide-react';

interface RadioPlayerProps {
  streamUrl?: string;
  onUrlChange?: (newUrl: string) => void;
}

// Helper function: Calculate wall-clock pseudolive synchronization for 24/7 playlists
function getPlaylistRealtimeSync(items: Array<{ playbackUrl: string; durationSeconds?: number }>) {
  if (!items || items.length === 0) {
    return { trackIndex: 0, seekTime: 0 };
  }

  const defaultDuration = 180; // 3 minutes fallback if duration is unknown
  const durations = items.map(item => (item.durationSeconds && item.durationSeconds > 0 ? item.durationSeconds : defaultDuration));
  const totalDuration = durations.reduce((acc, dur) => acc + dur, 0);

  if (totalDuration <= 0) {
    return { trackIndex: 0, seekTime: 0 };
  }

  // Absolute wall-clock time in seconds
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const currentLoopPosition = nowInSeconds % totalDuration;

  let accumulated = 0;
  for (let i = 0; i < items.length; i++) {
    const trackDuration = durations[i];
    if (currentLoopPosition < accumulated + trackDuration) {
      const seekTime = currentLoopPosition - accumulated;
      return { trackIndex: i, seekTime };
    }
    accumulated += trackDuration;
  }

  return { trackIndex: 0, seekTime: 0 };
}

export default function RadioPlayer({ streamUrl: propStreamUrl }: RadioPlayerProps) {
  const { radioChannels, activeRadioChannel, setActiveRadioChannelId } = useStreamContext();

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentStation = activeRadioChannel || radioChannels[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [currentTrackIdx, setCurrentTrackIdx] = useState<number>(0);
  const [isPlaylistMode, setIsPlaylistMode] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const cleanSlug = currentStation?.streamUrl
    ? currentStation.streamUrl.replace(/^\/radio\/?/, '').replace(/^\/+/, '').trim() || 'live'
    : 'live';

  const streamEndpoint = propStreamUrl && propStreamUrl.startsWith('http')
    ? propStreamUrl
    : `https://radio.rtm.tl/${cleanSlug}`;

  // Real Analytics: Record View & Send Viewer Heartbeat Ping
  useEffect(() => {
    if (!currentStation || !currentStation.id) return;
    const channelId = currentStation.id;
    const sessionId = `radio-${Math.random().toString(36).substring(2, 10)}`;

    // Record view increment once on mount
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, sessionId, streamType: 'radio', type: 'view' }),
    }).catch(() => {});

    // Send heartbeat ping every 15s to keep active viewer count accurate
    const pingInterval = setInterval(() => {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, sessionId, streamType: 'radio', type: 'ping' }),
      }).catch(() => {});
    }, 15000);

    return () => clearInterval(pingInterval);
  }, [currentStation?.id]);

  // Load Server-Side Live Stream (Mixxx/BUTT Ingest or FFmpeg AutoDJ Playlist 24/7)
  useEffect(() => {
    if (!currentStation || !currentStation.id) return;
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaylistMode(currentStation.activeSource === 'playlist');

    if (audio.src !== streamEndpoint) {
      audio.src = streamEndpoint;
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [currentStation?.id, currentStation?.activeSource, streamEndpoint]);

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleNextTrack = () => {
    if (!playlistTracks.length) return;
    const nextIdx = (currentTrackIdx + 1) % playlistTracks.length;
    setCurrentTrackIdx(nextIdx);
    const audio = audioRef.current;
    if (audio && playlistTracks[nextIdx]) {
      audio.src = playlistTracks[nextIdx].playbackUrl;
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  };

  const handlePrevTrack = () => {
    if (!playlistTracks.length) return;
    const prevIdx = (currentTrackIdx - 1 + playlistTracks.length) % playlistTracks.length;
    setCurrentTrackIdx(prevIdx);
    const audio = audioRef.current;
    if (audio && playlistTracks[prevIdx]) {
      audio.src = playlistTracks[prevIdx].playbackUrl;
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  };

  // Visualizer Animation setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const renderVisualizer = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 36;
      const barWidth = (canvas.width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          const time = Date.now() * 0.005;
          barHeight = Math.abs(Math.sin(time + i * 0.25) * (canvas.height * 0.75)) + 6;
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#E50914');
        gradient.addColorStop(0.5, '#f97316');
        gradient.addColorStop(1, '#eab308');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationId = requestAnimationFrame(renderVisualizer);
    };

    renderVisualizer();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setLoading(true);
      setError(null);
      
      const baseUrl = streamEndpoint.split('?')[0];
      const freshUrl = `${baseUrl}?t=${Date.now()}`;
      audio.src = freshUrl;
      audio.load();
      
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setLoading(false);
        })
        .catch(err => {
          console.error('Audio play error:', err);
          setLoading(false);
          setError('Siaran radio belum dapat dimuat. Silakan periksa koneksi internet atau muat ulang halaman.');
        });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const audio = audioRef.current;
    setVolume(val);
    if (audio) {
      audio.volume = val;
      audio.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTrack = playlistTracks[currentTrackIdx];

  if (!currentStation || !currentStation.id) {
    return (
      <div className="relative w-full rounded-2xl bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border border-neutral-800 p-8 flex flex-col items-center justify-center text-center shadow-xl font-sans">
        <div className="h-14 w-14 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mb-3 shadow-lg text-neutral-400">
          <RadioIcon className="h-7 w-7 text-neutral-400 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Belum Ada Stasiun Radio</h3>
        <p className="text-xs text-neutral-400 max-w-sm">
          Belum ada stasiun Radio di database. Silakan buat stasiun baru melalui menu <span className="text-red-500 font-semibold">Kelola Radio</span> di Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 font-sans">
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        preload="none"
        onWaiting={() => setLoading(true)}
        onPlaying={() => {
          setLoading(false);
          setIsPlaying(true);
          setError(null);
        }}
        onStalled={() => {
          if (isPlaying && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }}
        onEnded={handleAudioEnded}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onError={() => {
          setLoading(false);
          if (isPlaying) {
            setError('Menghubungkan ulang ke siaran radio...');
            setTimeout(() => {
              if (audioRef.current) {
                const freshUrl = `${streamEndpoint.split('?')[0]}?t=${Date.now()}`;
                audioRef.current.src = freshUrl;
                audioRef.current.play().catch(() => {});
              }
            }, 2000);
          }
        }}
      />

      {/* Multi Radio Station Switcher Pills */}
      <div className="flex items-center justify-between bg-[#121212] p-3 rounded-2xl border border-white/5 shadow-md flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#E50914]" />
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Stasiun Radio RTM:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {radioChannels.filter((st) => st && st.id).map((st) => {
            const isSelected = currentStation && st.id === currentStation.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  setActiveRadioChannelId(st.id);
                  if (isPlaying && audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#E50914] text-white border-[#E50914] shadow-md'
                    : 'bg-black/60 text-neutral-400 hover:text-white border-white/10'
                }`}
              >
                <RadioIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                <span>{st.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Premium Radio Player Card */}
      <div className="bg-[#121212] p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden space-y-6 font-sans">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Vinyl / Cover Art Section */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full p-2 bg-gradient-to-tr from-[#E50914] via-neutral-800 to-red-900 shadow-xl shadow-red-900/20 flex items-center justify-center">
              
              {/* Vinyl Groove Rings */}
              <div className={`w-full h-full rounded-full bg-black p-3 relative overflow-hidden flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : 'animate-spin-slow-paused'}`}>
                <div className="w-full h-full rounded-full border-4 border-neutral-900 flex items-center justify-center relative">
                  
                  {/* Center Artwork */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/40 shadow-inner relative">
                    <img
                      src={currentStation.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60'}
                      alt={currentStation.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Vinyl Spindle Center Hole */}
                  <div className="absolute w-4 h-4 rounded-full bg-black border border-neutral-800"></div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute -bottom-2 px-3.5 py-1 rounded-full bg-[#121212] border border-white/10 text-[11px] font-bold text-white shadow-md flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse"></span>
                <span>RADIO LIVE 24/7</span>
              </div>
            </div>
          </div>

          {/* Details & Controls Section */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            
            {/* Station Title & Program Description */}
            <div>
              <span className="text-[11px] uppercase font-sans tracking-wider text-[#E50914] font-bold block mb-1">
                SIARAN RADIO UTAMA ({currentStation.name})
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight line-clamp-1 font-sans">
                {currentStation.name}
              </h3>
              <p className="text-sm text-neutral-300 font-medium mt-1 font-sans">
                {currentStation.name} sedang mengudara live 24 jam non-stop.
              </p>
            </div>

            {/* Audio Canvas Equalizer Visualizer */}
            <div className="bg-black/60 p-3 rounded-2xl border border-white/10 space-y-2">
              <canvas
                ref={canvasRef}
                width={360}
                height={40}
                className="w-full h-10 rounded-lg"
              />
            </div>

            {/* Main Player Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
              
              {/* Play / Pause Toggle Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  disabled={loading}
                  className="w-14 h-14 rounded-2xl bg-[#E50914] hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-900/40 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <div className="text-left">
                  <span className="text-xs font-bold text-white block font-sans">
                    {isPlaying ? 'Siaran Radio Sedang Diputar (Live)' : 'Tekan Play Untuk Mendengarkan'}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    Siaran audio jernih 24 jam non-stop
                  </span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 bg-black/60 px-3.5 py-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
                <button onClick={toggleMute} className="text-neutral-400 hover:text-white cursor-pointer">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-neutral-300" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 accent-[#E50914] h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/30 text-xs text-red-300 flex items-center justify-between gap-2 font-sans">
                <span>{error}</span>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
