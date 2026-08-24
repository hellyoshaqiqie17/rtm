'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Upload,
  Trash2,
  X,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Disc
} from 'lucide-react';
import { RadioChannel } from '@/context/StreamContext';

export interface RadioPlaylistItem {
  id: number | string;
  stationId: string;
  filename: string;
  filePath: string;
  playbackUrl: string;
  durationSeconds: number;
  sortOrder: number;
  createdAt?: string;
}

interface RadioPlaylistManagerModalProps {
  station: RadioChannel;
  onClose: () => void;
}

export default function RadioPlaylistManagerModal({ station, onClose }: RadioPlaylistManagerModalProps) {
  const [playlist, setPlaylist] = useState<RadioPlaylistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stationSlug = station.streamUrl
    ? station.streamUrl.replace('/radio/', '').replace('/radio', '') || 'live'
    : 'live';

  // Fetch station playlist on load
  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/radio/playlist?stationId=${station.id}&stationSlug=${stationSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlaylist(data.items || []);
        }
      }
    } catch (err) {
      console.error('Error fetching radio playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [station.id]);

  // Clean up audio player on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle local MP3/Audio file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.mp3') && !lowerName.endsWith('.wav') && !lowerName.endsWith('.aac') && !lowerName.endsWith('.m4a')) {
      setError('Mohon unggah file audio format .mp3, .wav, .aac, atau .m4a.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('stationId', station.id);
      formData.append('stationSlug', stationSlug);
      formData.append('file', file);

      setUploadProgress(50);
      const res = await fetch('/api/radio/playlist', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        if (res.status === 413) {
          setError('Ukuran file MP3 terlalu besar (melebihi batas max upload).');
          return;
        }
        setError(`Respon server error (${res.status} ${res.statusText}).`);
        return;
      }

      if (res.ok && data.success) {
        setUploadProgress(100);
        setSuccessMessage(`Berhasil menambahkan lagu "${file.name}" ke playlist radio!`);
        fetchPlaylist();
      } else {
        setError(data.error || 'Gagal mengunggah file lagu.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.message || 'Terjadi kesalahan saat mengunggah lagu.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Handle audio track deletion
  const handleDeleteItem = async (id: number | string, filename: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus lagu "${filename}" dari playlist?`)) return;

    try {
      const res = await fetch(`/api/radio/playlist?id=${id}&filename=${encodeURIComponent(filename)}&stationSlug=${stationSlug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Lagu "${filename}" berhasil dihapus.`);
        fetchPlaylist();
      } else {
        setError(data.error || 'Gagal menghapus lagu.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Terjadi kesalahan saat menghapus lagu.');
    }
  };

  // Audio preview toggle
  const toggleAudioPreview = (playbackUrl: string) => {
    if (playingAudioUrl === playbackUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(playbackUrl);
      audioRef.current = audio;
      audio.play().then(() => {
        setPlayingAudioUrl(playbackUrl);
      }).catch(err => {
        console.error('Error playing audio preview:', err);
        setError('Gagal memutar pratinjau audio.');
      });
      audio.onended = () => setPlayingAudioUrl(null);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in font-sans">
      <div className="relative w-full max-w-4xl bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-inner">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Kelola Playlist MP3 Radio (24/7 AutoDJ)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-600/20 text-orange-400 border border-orange-500/30 uppercase font-mono">
                  {station.name}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Unggah dan atur rotasi lagu MP3 untuk siaran otomatis 24 jam non-stop di web publik.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Notifications */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Area */}
          <div className="p-5 rounded-2xl bg-black/60 border border-dashed border-white/20 hover:border-orange-500/50 transition-all text-center space-y-3 relative group">
            <input
              type="file"
              accept=".mp3,.wav,.aac,.m4a"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />
            <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin text-orange-500" /> : <Upload className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {uploading ? 'Mengunggah File Lagu MP3...' : 'Klik atau Tarik File MP3 Radio ke Sini'}
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Format audio didukung: <strong className="text-orange-400 font-mono">.MP3, .WAV, .AAC, .M4A</strong>
              </p>
            </div>

            {uploading && (
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden max-w-md mx-auto mt-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Playlist Tracks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-orange-500" />
                Daftar Lagu MP3 Playlist Radio ({playlist.length})
              </span>
              <span className="font-mono text-neutral-400">
                AutoDJ Rotasi 24 Jam
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                <p className="text-xs text-neutral-400 font-mono">Memuat daftar playlist MP3 radio...</p>
              </div>
            ) : playlist.length === 0 ? (
              <div className="py-12 border border-white/5 rounded-2xl bg-black/40 text-center space-y-2">
                <Disc className="w-10 h-10 text-neutral-600 mx-auto" />
                <h4 className="text-sm font-bold text-neutral-300">Belum Ada Lagu MP3 di Playlist</h4>
                <p className="text-xs text-neutral-500 max-w-md mx-auto font-sans">
                  Unggah beberapa file musik/lagu audio di atas untuk mengaktifkan pemutaran siaran radio otomatis 24 jam non-stop.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.map((item, index) => {
                  const isCurrentlyPlaying = playingAudioUrl === item.playbackUrl;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrentlyPlaying
                          ? 'bg-orange-950/40 border-orange-500/50 text-white shadow-lg'
                          : 'bg-black/40 border-white/5 hover:border-white/20 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs font-mono font-bold text-neutral-400 shrink-0">
                          {index + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleAudioPreview(item.playbackUrl)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            isCurrentlyPlaying
                              ? 'bg-orange-600 text-white shadow-md'
                              : 'bg-white/10 text-neutral-300 hover:bg-orange-600 hover:text-white'
                          }`}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate font-sans">
                            {item.filename}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-500" />
                              {formatDuration(item.durationSeconds)}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[200px] text-neutral-500">{item.playbackUrl}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.filename)}
                          className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                          title="Hapus Lagu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2 text-neutral-400">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Playlist MP3 tersimpan di <code className="text-orange-400 font-mono text-[11px]">/var/media/radio-playlists</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
