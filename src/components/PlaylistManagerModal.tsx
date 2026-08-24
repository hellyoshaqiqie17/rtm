'use client';

import React, { useState, useEffect } from 'react';
import {
  Film,
  Upload,
  Trash2,
  X,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Channel } from '@/context/StreamContext';

export interface PlaylistItem {
  id: number | string;
  channelId: string;
  filename: string;
  filePath: string;
  playbackUrl: string;
  durationSeconds: number;
  sortOrder: number;
  createdAt?: string;
}

interface PlaylistManagerModalProps {
  channel: Channel;
  onClose: () => void;
}

export default function PlaylistManagerModal({ channel, onClose }: PlaylistManagerModalProps) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch channel playlist on load
  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/playlist?channelId=${channel.id}&channelSlug=${channel.slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlaylist(data.items || []);
        }
      }
    } catch (err) {
      console.error('Error fetching playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [channel.id]);

  // Handle local MP4 video file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp4')) {
      setError('Mohon unggah file video format .mp4 saja.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('channelId', channel.id);
      formData.append('channelSlug', channel.slug);
      formData.append('file', file);

      setUploadProgress(50);
      const res = await fetch('/api/playlist', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);
      const data = await res.json();

      if (data.success) {
        setUploadProgress(100);
        setSuccessMessage(`Berhasil menambahkan video "${file.name}" ke playlist!`);
        fetchPlaylist();
      } else {
        setError(data.error || 'Gagal mengunggah video.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Terjadi kesalahan saat mengunggah file.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  // Handle video deletion
  const handleDeleteItem = async (id: number | string, filename: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus video "${filename}" dari playlist?`)) return;

    try {
      const res = await fetch(`/api/playlist?id=${encodeURIComponent(id)}&filename=${encodeURIComponent(filename)}&channelSlug=${encodeURIComponent(channel.slug)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPlaylist((prev) => prev.filter((item) => item.id !== id && item.filename !== filename));
        setSuccessMessage(`Video "${filename}" berhasil dihapus dari playlist.`);
        fetchPlaylist();
      } else {
        setError('Gagal menghapus video.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Gagal menghapus video.');
    }
  };

  // Reorder items (Move Up / Down)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= playlist.length) return;

    const newPlaylist = [...playlist];
    const temp = newPlaylist[index];
    newPlaylist[index] = newPlaylist[targetIndex];
    newPlaylist[targetIndex] = temp;

    // Update sortOrder values
    const updatedItems = newPlaylist.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setPlaylist(updatedItems);

    try {
      await fetch('/api/playlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems.map((it) => ({ id: it.id, sortOrder: it.sortOrder })),
        }),
      });
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || secs === 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalPlaylistSeconds = playlist.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans animate-in fade-in">
      <div className="bg-[#181818] rounded-2xl p-6 sm:p-8 max-w-3xl w-full border border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center text-[#E50914]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <span>Kelola Playlist MP4 (Siaran 24/7): {channel.name}</span>
              </h3>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                Upload video MP4 untuk siaran otomatis 24 jam saat channel dalam keadaan standby (off-air).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white border border-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Playlist Duration Summary */}
        <div className="flex items-center justify-between bg-[#121212] p-4 rounded-xl border border-white/10 text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <Clock className="w-4 h-4 text-[#E50914]" />
            <span>Total Durasi Playlist: {formatDuration(totalPlaylistSeconds)}</span>
          </div>
          <span className="text-[11px] text-[#A3A3A3] font-mono font-medium">
            {playlist.length} File Video MP4
          </span>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-white/20 hover:border-[#E50914]/60 bg-[#121212] rounded-2xl p-6 text-center space-y-3 transition-colors relative">
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#E50914]">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              {uploading ? `Mengunggah Video... (${uploadProgress}%)` : 'Klik atau drag & drop file MP4 di sini'}
            </h4>
            <p className="text-xs text-[#A3A3A3] mt-1">
              Format yang didukung: MP4 (H.264 / AAC) hingga 500 MB per file.
            </p>
          </div>
          {uploading && (
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden max-w-xs mx-auto">
              <div
                className="bg-[#E50914] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Video Preview Player */}
        {previewVideoUrl && (
          <div className="space-y-2 bg-[#121212] p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Preview Video Playlist</span>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="text-[#A3A3A3] hover:text-white cursor-pointer text-[10px]"
              >
                Tutup Preview
              </button>
            </div>
            <video
              src={previewVideoUrl}
              controls
              autoPlay
              className="w-full max-h-56 rounded-lg bg-black object-contain"
            />
          </div>
        )}

        {/* Playlist Table */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
            Daftar Video Playlist 24/7 ({playlist.length})
          </h4>

          {loading ? (
            <div className="text-center py-10 bg-[#121212] rounded-xl border border-white/10 text-xs text-[#A3A3A3] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
              <span>Memuat playlist...</span>
            </div>
          ) : playlist.length === 0 ? (
            <div className="text-center py-12 bg-[#121212] rounded-xl border border-white/10 text-xs text-[#A3A3A3] space-y-1">
              <p className="font-bold text-white">Belum Ada Video dalam Playlist</p>
              <p className="text-[11px]">Unggah video MP4 pertama Anda di atas untuk memulai siaran otomatis 24 jam.</p>
            </div>
          ) : (
            <div className="bg-[#121212] rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5 text-xs">
              {playlist.map((item, idx) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  
                  {/* Sequence Number */}
                  <span className="w-6 text-center font-mono font-bold text-[#E50914] text-xs">
                    #{idx + 1}
                  </span>

                  {/* Video Details */}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate text-xs">{item.filename}</div>
                    <div className="flex items-center gap-3 text-[11px] text-[#A3A3A3] mt-0.5 font-mono">
                      <span>Durasi: {formatDuration(item.durationSeconds)}</span>
                      <span>•</span>
                      <span className="truncate">{item.playbackUrl}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewVideoUrl(item.playbackUrl)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 cursor-pointer"
                      title="Putar Preview Video"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveOrder(idx, 'up')}
                      disabled={idx === 0}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white transition-all border border-white/10 cursor-pointer"
                      title="Naikkan Urutan"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveOrder(idx, 'down')}
                      disabled={idx === playlist.length - 1}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white transition-all border border-white/10 cursor-pointer"
                      title="Turunkan Urutan"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteItem(item.id, item.filename)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                      title="Hapus Video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
