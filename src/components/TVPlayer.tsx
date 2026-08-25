'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStreamContext, Channel } from '@/context/StreamContext';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Tv,
  AlertCircle,
  Layers,
  Film,
  Video,
  Power,
  Copy,
  Check
} from 'lucide-react';

interface TVPlayerProps {
  channel?: Channel;
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

export default function TVPlayer({ channel: customChannel, streamUrl: propStreamUrl }: TVPlayerProps) {
  const {
    channels,
    activeChannel,
    setActiveChannelId,
    cdnEnabled,
    cdnBaseUrl
  } = useStreamContext();

  const currentChannel = customChannel || activeChannel;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Live vs Replay vs Playlist Mode States
  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState<boolean>(true);
  const [isPlaylistMode, setIsPlaylistMode] = useState<boolean>(false);
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);
  const [currentPlaylistIdx, setCurrentPlaylistIdx] = useState<number>(0);
  const [replayUrl, setReplayUrl] = useState<string | null>(null);

  // DVR & Playback Seek Bar States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekMin, setSeekMin] = useState(0);
  const [seekMax, setSeekMax] = useState(0);
  const [isLiveHead, setIsLiveHead] = useState(true);
  const activeSource = currentChannel?.activeSource || 'hls';
  const baseHlsUrl = propStreamUrl || currentChannel?.hlsUrl || '';
  const effectiveHlsUrl = cdnEnabled && currentChannel?.slug
    ? `${cdnBaseUrl}/${currentChannel.slug}/index.m3u8`
    : baseHlsUrl;

  // Real Analytics: Record View & Send Viewer Heartbeat Ping
  useEffect(() => {
    if (!currentChannel || !currentChannel.id) return;
    const channelId = currentChannel.id;
    const sessionId = `tv-${Math.random().toString(36).substring(2, 10)}`;

    // Record view increment once on mount
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, sessionId, streamType: 'tv', type: 'view' }),
    }).catch(() => {});

    // Send heartbeat ping every 15s to keep active viewer count accurate
    const pingInterval = setInterval(() => {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, sessionId, streamType: 'tv', type: 'ping' }),
      }).catch(() => {});
    }, 15000);

    return () => clearInterval(pingInterval);
  }, [currentChannel?.id]);

  // Check past recordings for channel if live stream fails
  const fetchRecordedVideo = async () => {
    try {
      if (!currentChannel) return null;
      if (currentChannel.recordedPlaybackUrl) {
        setReplayUrl(currentChannel.recordedPlaybackUrl);
        return currentChannel.recordedPlaybackUrl;
      }
      const res = await fetch(`/api/recordings?slug=${currentChannel.slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.recordings && data.recordings.length > 0) {
          const latest = data.recordings[0].playbackUrl;
          setReplayUrl(latest);
          return latest;
        }
      }
    } catch (err) {
      console.error('Error fetching recorded video:', err);
    }
    return null;
  };

  const isCurrentlyLiveRef = useRef<boolean>(false);

  // Helper to start HLS Live playback
  const startHlsLive = (video: HTMLVideoElement, url: string) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        setError(null);
        setIsLiveBroadcasting(true);
        setIsPlaylistMode(activeSource === 'playlist');
        isCurrentlyLiveRef.current = true;
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, async (event, data) => {
        if (data.fatal) {
          console.warn('Live HLS stream went offline or fatal error occurred. Switching to Replay fallback...');
          isCurrentlyLiveRef.current = false;
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
          switchToReplayFallback(video);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        setError(null);
        setIsLiveBroadcasting(true);
        setIsPlaylistMode(activeSource === 'playlist');
        isCurrentlyLiveRef.current = true;
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        isCurrentlyLiveRef.current = false;
        switchToReplayFallback(video);
      });
    }
  };

  // Helper to switch to Replay Fallback MP4
  const switchToReplayFallback = async (video: HTMLVideoElement) => {
    isCurrentlyLiveRef.current = false;
    setIsLiveBroadcasting(false);
    setIsPlaylistMode(false);
    const recUrl = await fetchRecordedVideo();
    if (recUrl) {
      setLoading(false);
      setError(null);
      video.src = recUrl;
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      setLoading(false);
      setError('Siaran TV belum tersedia saat ini. Silakan muat ulang atau pilih saluran lain.');
    }
  };

  // Initialize & Manage Video Sources (Live HLS with Auto-Reconnect, Playlist 24/7, or Recording VOD)
  useEffect(() => {
    if (!currentChannel || !currentChannel.id) return;

    if (activeSource === 'youtube') {
      setLoading(false);
      setError(null);
      isCurrentlyLiveRef.current = false;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // -------------------------------------------------------------
    // MODE 1: LIVE INGEST OBS & SERVER-SIDE FFMPEG MP4 PLAYLIST 24/7 (HLS)
    // -------------------------------------------------------------
    if (activeSource === 'hls' || activeSource === 'playlist') {
      setIsPlaylistMode(activeSource === 'playlist');
      setIsLiveBroadcasting(true);
      if (effectiveHlsUrl) {
        startHlsLive(video, effectiveHlsUrl);
      } else {
        switchToReplayFallback(video);
      }
      return;
    }

    // -------------------------------------------------------------
    // MODE 2: HASIL REKAMAN VOD (STRICT ISOLATION)
    // -------------------------------------------------------------
    if (activeSource === 'recording') {
      setIsPlaylistMode(false);
      setIsLiveBroadcasting(false);
      isCurrentlyLiveRef.current = false;
      const loadRecording = async () => {
        let recUrl = currentChannel?.selectedRecordingUrl || currentChannel?.recordedPlaybackUrl;
        if (!recUrl) {
          recUrl = await fetchRecordedVideo();
        }
        if (recUrl) {
          setLoading(false);
          setError(null);
          video.src = recUrl;
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
          setLoading(false);
          setError('Belum ada file rekaman siaran untuk saluran ini.');
        }
      };
      loadRecording();
      return;
    }

    // -------------------------------------------------------------
    // MODE 3: LIVE INGEST OBS / vMix (WITH REPLAY FALLBACK & AUTO-RECONNECT)
    // -------------------------------------------------------------
    setIsPlaylistMode(false);

    let isSubscribed = true;
    let liveCheckInterval: NodeJS.Timeout | null = null;

    const probeAndManageLiveStream = async () => {
      if (!effectiveHlsUrl || !isSubscribed) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(effectiveHlsUrl, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeoutId);

        const liveIsOnline = res.ok && res.status === 200;

        if (liveIsOnline) {
          if (!isCurrentlyLiveRef.current) {
            // Live stream just came online! Connect to Live HLS stream.
            console.log('🔴 Live OBS stream detected online! Connecting live player...');
            isCurrentlyLiveRef.current = true;
            startHlsLive(video, effectiveHlsUrl);
          }
        } else {
          if (isCurrentlyLiveRef.current || loading) {
            // Live stream went offline or initial probe failed -> Fallback to Replay
            console.log('📹 Live OBS is offline. Falling back to Replay (Hasil Rekaman)...');
            isCurrentlyLiveRef.current = false;
            if (hlsRef.current) {
              hlsRef.current.destroy();
              hlsRef.current = null;
            }
            switchToReplayFallback(video);
          }
        }
      } catch (err) {
        if (isCurrentlyLiveRef.current || loading) {
          console.log('📹 Live OBS probe error. Falling back to Replay (Hasil Rekaman)...');
          isCurrentlyLiveRef.current = false;
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
          switchToReplayFallback(video);
        }
      }
    };

    // Initial Probe
    probeAndManageLiveStream();

    // Background polling every 3 seconds to auto-reconnect live stream as soon as OBS starts publishing
    liveCheckInterval = setInterval(probeAndManageLiveStream, 3500);

    return () => {
      isSubscribed = false;
      if (liveCheckInterval) clearInterval(liveCheckInterval);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveHlsUrl, activeSource, currentChannel?.id, currentChannel?.selectedRecordingUrl]);

  // Video Ended Handler (Playlist auto-advance & Replay loop)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (activeSource === 'playlist' && playlistItems.length > 0) {
        const sync = getPlaylistRealtimeSync(playlistItems);
        setCurrentPlaylistIdx(sync.trackIndex);
        video.src = playlistItems[sync.trackIndex].playbackUrl;

        const handleMetadata = () => {
          if (sync.seekTime > 0 && video.duration && sync.seekTime < video.duration) {
            video.currentTime = sync.seekTime;
          }
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          video.removeEventListener('loadedmetadata', handleMetadata);
        };
        video.addEventListener('loadedmetadata', handleMetadata);
        if (video.readyState >= 1) {
          handleMetadata();
        }
      } else if (activeSource === 'recording' || (!isLiveBroadcasting && activeSource === 'hls')) {
        // Replay video ended -> loop from beginning
        video.currentTime = 0;
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [activeSource, playlistItems, currentPlaylistIdx, isLiveBroadcasting]);

  // Periodic Wall-Clock Pseudolive Synchronization for 24/7 MP4 Playlist
  useEffect(() => {
    if (activeSource !== 'playlist' || !playlistItems.length) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      const sync = getPlaylistRealtimeSync(playlistItems);
      if (sync.trackIndex !== currentPlaylistIdx) {
        setCurrentPlaylistIdx(sync.trackIndex);
        video.src = playlistItems[sync.trackIndex].playbackUrl;
        const handleMetadata = () => {
          if (sync.seekTime > 0 && video.duration && sync.seekTime < video.duration) {
            video.currentTime = sync.seekTime;
          }
          video.play().catch(console.error);
          video.removeEventListener('loadedmetadata', handleMetadata);
        };
        video.addEventListener('loadedmetadata', handleMetadata);
      } else if (isPlaying && Math.abs(video.currentTime - sync.seekTime) > 5) {
        if (video.duration && sync.seekTime < video.duration) {
          video.currentTime = sync.seekTime;
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeSource, playlistItems, currentPlaylistIdx, isPlaying]);

  // Video Timeupdate & Seekbar Listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      setCurrentTime(cur);

      if (!isLiveBroadcasting) {
        // Replay Mode (MP4 File)
        setSeekMin(0);
        setSeekMax(video.duration || 100);
        setDuration(video.duration || 0);
        setIsLiveHead(false);
      } else {
        // Live Mode (HLS Stream)
        let min = 0;
        let max = cur;

        if (video.seekable && video.seekable.length > 0) {
          min = video.seekable.start(0);
          max = video.seekable.end(video.seekable.length - 1);
        } else if (video.buffered && video.buffered.length > 0) {
          min = video.buffered.start(0);
          max = video.buffered.end(video.buffered.length - 1);
        }

        setSeekMin(min);
        setSeekMax(max);
        setIsLiveHead(max - cur <= 4);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isLiveBroadcasting]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    setVolume(val);
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.currentTime = val;
      setCurrentTime(val);
      if (isLiveBroadcasting) {
        setIsLiveHead(seekMax - val <= 4);
      }
    }
  };

  const jumpToLive = () => {
    const video = videoRef.current;
    if (video && seekMax > 0 && isLiveBroadcasting) {
      video.currentTime = seekMax - 0.5;
      setCurrentTime(seekMax - 0.5);
      setIsLiveHead(true);
      if (video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.error(err));
    }
  };

  const handleReconnect = () => {
    setLoading(true);
    setError(null);
    if (hlsRef.current) {
      hlsRef.current.loadSource(effectiveHlsUrl);
      hlsRef.current.startLoad();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('embed/')) return url;
    if (url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
    }
    return 'https://www.youtube.com/embed/live_stream?channel=UC_rtm_live_official';
  };

  if (!currentChannel || !currentChannel.id) {
    return (
      <div className="relative aspect-video w-full rounded-2xl bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border border-neutral-800 flex flex-col items-center justify-center text-center p-8 shadow-2xl">
        <div className="h-16 w-16 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mb-4 shadow-lg text-neutral-400">
          <Tv className="h-8 w-8 text-neutral-400 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Belum Ada Siaran TV</h3>
        <p className="text-xs text-neutral-400 max-w-md">
          Belum ada saluran TV di database. Silakan buat saluran TV baru melalui menu <span className="text-red-500 font-semibold">Kelola TV</span> di Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 font-sans">

      {/* Saluran TV Switcher Pills */}
      <div className="flex items-center justify-between bg-[#121212] p-3 rounded-2xl border border-white/5 shadow-md">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#E50914]" />
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Saluran TV RTM:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {channels.filter((c) => c && c.id).map((chan) => {
            const isSelected = currentChannel && chan.id === currentChannel.id;
            return (
              <button
                key={chan.id}
                onClick={() => setActiveChannelId(chan.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#E50914] text-white border-[#E50914] shadow-md'
                    : 'bg-black/60 text-neutral-400 hover:text-white border-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-neutral-600'}`}></span>
                <span>{chan.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Netflix-Style Video Container */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-white/10 shadow-2xl group font-sans"
      >
        {/* Top Overlay Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-bold shadow-lg border border-white/10">
              <Tv className="w-4 h-4 text-[#E50914]" />
              {currentChannel.name}
            </span>

            {/* DYNAMIC LIVE VS REPLAY VS OFF BADGE */}
            {activeSource === 'off' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 text-red-400 border border-red-800 text-xs font-extrabold shadow-lg">
                <Power className="w-3.5 h-3.5 text-red-500" /> SIARAN OFF
              </span>
            ) : isLiveBroadcasting || isPlaylistMode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#E50914] text-white text-xs font-extrabold shadow-lg animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span> LIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 text-xs font-extrabold shadow-lg">
                <Film className="w-3.5 h-3.5 text-cyan-400" /> REPLAY (REKAMAN SIARAN)
              </span>
            )}
          </div>
        </div>

        {/* PLAYER DISPLAY */}
        {activeSource === 'off' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-950 via-black to-neutral-900 p-6 text-center z-20 font-sans">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-500 mb-4 shadow-2xl animate-pulse">
              <Power className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 text-[10px] font-extrabold uppercase tracking-wider mb-2 font-mono">
              ● SIARAN TV NONAKTIF (OFF)
            </span>
            <h4 className="text-lg font-extrabold text-white mb-2 tracking-tight">{currentChannel?.name || 'Saluran TV'} Sedang OFF</h4>
            <p className="text-xs text-neutral-400 max-w-md">
              Siaran langsung pada saluran ini telah dinonaktifkan oleh administrator. Silakan pilih saluran lain atau kembali lagi nanti.
            </p>
          </div>
        ) : activeSource === 'youtube' ? (
          <iframe
            src={getEmbedUrl(currentChannel.youtubeUrl)}
            title={currentChannel.name}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
              onClick={togglePlay}
            />

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                <div className="w-12 h-12 border-4 border-[#E50914]/20 border-t-[#E50914] rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-bold text-white font-sans">Menyiapkan Pemutar Video...</p>
              </div>
            )}

            {/* User Friendly Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center z-20">
                <AlertCircle className="w-12 h-12 text-[#E50914] mb-3 animate-pulse" />
                <h4 className="text-base font-bold text-white mb-1 font-sans">Siaran Belum Tersedia</h4>
                <p className="text-xs text-neutral-400 max-w-md mb-5 font-sans">{error}</p>
                <button
                  onClick={handleReconnect}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Coba Lagi
                </button>
              </div>
            )}

            {/* Big Play Button Overlay when Paused */}
            {!isPlaying && !loading && !error && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer group-hover:bg-black/30 transition-all z-10"
              >
                <div className="w-16 h-16 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform border border-red-400/40">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* NETFLIX-STYLE CONTROLS OVERLAY */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent opacity-90 group-hover:opacity-100 transition-opacity z-20 space-y-2">
              
              {/* PLAYBACK SEEK TIMELINE (Only for VOD Recording Replay mode) */}
              {!isLiveBroadcasting && !isPlaylistMode && (
                <div className="w-full flex items-center gap-3 group/seekbar">
                  <input
                    type="range"
                    min={seekMin}
                    max={seekMax > 0 ? seekMax : 100}
                    step="0.5"
                    value={currentTime}
                    onChange={handleSeekChange}
                    className="w-full h-1.5 group-hover/seekbar:h-2.5 accent-[#E50914] rounded-lg cursor-pointer transition-all bg-white/20"
                  />
                  <span className="text-[11px] font-mono text-neutral-300 shrink-0">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              )}

              {/* CONTROLS ROW */}
              <div className="flex items-center justify-between gap-4">
                
                {/* Left Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button onClick={toggleMute} className="p-1.5 text-neutral-300 hover:text-white cursor-pointer">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 accent-[#E50914] h-1.5 bg-white/20 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* DYNAMIC BADGE & JUMP TO LIVE HEAD */}
                  {isLiveBroadcasting ? (
                    <button
                      onClick={jumpToLive}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-extrabold border transition-all cursor-pointer ${
                        isLiveHead
                          ? 'bg-[#E50914] text-white border-[#E50914] shadow-md shadow-red-900/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isLiveHead ? 'bg-white animate-pulse' : 'bg-amber-400'}`}></span>
                      <span>{isLiveHead ? 'SIARAN LANGSUNG' : 'KEMBALI KE SIARAN LIVE'}</span>
                    </button>
                  ) : isPlaylistMode ? (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-extrabold border transition-all cursor-default bg-[#E50914] text-white border-[#E50914] shadow-md shadow-red-900/40"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      <span>SIARAN LANGSUNG</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
                      <Film className="w-3.5 h-3.5 text-cyan-400" /> REPLAY PLAYBACK
                    </span>
                  )}
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {/* Active Program Info Card (Netflix Style Detail Card) */}
      <div className="relative bg-[#181818] p-6 rounded-xl border border-white/5 shadow-2xl flex flex-col gap-3 font-sans overflow-hidden">
        {/* Left accent bar (Netflix Red) */}
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#E50914]" />
        
        {/* Top meta tags */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-bold text-neutral-400">
          {isLiveBroadcasting || isPlaylistMode ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-extrabold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              LIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-neutral-700 text-neutral-200 text-[10px] uppercase font-bold tracking-wide">
              REPLAY
            </span>
          )}
          <span>{new Date().getFullYear()}</span>
          <span>Full HD</span>
          <span className="text-neutral-600 font-normal">•</span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-white/15 bg-white/5 text-[11px] font-mono">
            <span className="text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Stream VLC / IPTV:</span>
            <code className="text-[#E50914] font-bold select-all">
              {`https://live.rtm.tl/live/${currentChannel?.slug || 'rtmstream'}/index.m3u8`}
            </code>
          </div>
        </div>

        {/* Program Title */}
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-white tracking-wide leading-tight capitalize">
            {currentChannel.name || 'Siaran TV RTM'}
          </h3>
        </div>

        {/* Stream Description / Synopsis */}
        <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl mt-1">
          {currentChannel.currentProgram || 'Menampilkan siaran televisi resmi RTM Maubere secara langsung dan interaktif. Nikmati tayangan berita terkini, program edukasi, budaya, dan hiburan 24 jam non-stop dengan kualitas siaran prima.'}
        </p>
      </div>

    </div>
  );
}
