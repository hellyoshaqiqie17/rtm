'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import TVPlayer from '@/components/TVPlayer';
import RadioPlayer from '@/components/RadioPlayer';
import ProgramSchedule from '@/components/ProgramSchedule';
import { useStreamContext } from '@/context/StreamContext';
import { ChevronRight, Play, Film, Radio } from 'lucide-react';

const categoryBgs: Record<string, string> = {
  'TV On Demand': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80',
  'Dokumenter': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
  'Kesehatan': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80',
  'Ekonomi': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=80',
  'Pendidikan': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=80',
  'RTM Maubere': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80',
};

export default function HomePage() {
  const { channels, activeChannel, setActiveChannelId, radioUrl, setRadioUrl, categories, isCmsLoaded } = useStreamContext();

  const heroChannel = activeChannel || channels[0];

  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!heroChannel || !heroChannel.id) {
      setHeroVideoUrl(null);
      return;
    }
    let isSubscribed = true;

    const checkHeroStatus = async () => {
      try {
        if (heroChannel.activeSource === 'playlist') {
          const res = await fetch(`/api/playlist?channelId=${heroChannel.id}&channelSlug=${heroChannel.slug}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.items && data.items.length > 0 && isSubscribed) {
              setHeroVideoUrl(data.items[0].playbackUrl);
              return;
            }
          }
        } else if (heroChannel.activeSource === 'recording') {
          let recUrl = heroChannel.selectedRecordingUrl || heroChannel.recordedPlaybackUrl || null;
          if (!recUrl) {
            const res = await fetch(`/api/recordings?slug=${heroChannel.slug}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.recordings && data.recordings.length > 0) {
                recUrl = data.recordings[0].playbackUrl;
              }
            }
          }
          if (isSubscribed) {
            setHeroVideoUrl(recUrl);
            return;
          }
        }
        if (isSubscribed) {
          setHeroVideoUrl(null);
        }
      } catch (e) {
        if (isSubscribed) {
          setHeroVideoUrl(null);
        }
      }
    };

    checkHeroStatus();
    return () => { isSubscribed = false; };
  }, [heroChannel?.id, heroChannel?.slug, heroChannel?.activeSource, heroChannel?.selectedRecordingUrl]);

  const handleWatchNow = () => {
    if (heroChannel && heroChannel.id) {
      setActiveChannelId(heroChannel.id);
    }
    const el = document.getElementById('tv-live-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* 1. HERO FULLSCREEN BANNER (Dinamis dari Kelola TV & Background Video) */}
      <section className="relative h-[85vh] min-h-[550px] w-full overflow-hidden lg:h-[90vh] bg-black">
        
        {/* Background Video / Image Banner */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {!isCmsLoaded ? (
            <div className="w-full h-full bg-neutral-950 animate-pulse" />
          ) : heroVideoUrl ? (
            <video
              src={heroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-60 scale-105"
            />
          ) : heroChannel?.thumbnail ? (
            <img
              src={heroChannel.thumbnail}
              alt={heroChannel.name}
              className="w-full h-full object-cover opacity-50 scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
          )}
        </div>

        {/* Diagonal SVG Overlay */}
        <div className="absolute inset-y-0 right-0 z-10 w-full lg:w-2/3 pointer-events-none opacity-40">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#E50914" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="hero-line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#E50914" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d="M0,0 L100,0 L100,100 Z" fill="url(#hero-gradient)" />
            <line x1="0" y1="0" x2="100" y2="100" stroke="url(#hero-line-gradient)" strokeWidth="0.3" />
          </svg>
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent"></div>
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-transparent"></div>

        {/* Hero Text & Actions */}
        <div className="container relative z-30 mx-auto flex h-full flex-col justify-end px-6 pt-32 pb-16 md:px-12 md:pb-24 lg:pb-28 max-w-7xl">
          <div className="space-y-4 max-w-3xl">
            
            {/* Category & Live / Playlist / Replay Badges */}
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-[#E50914] px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-lg md:text-[11px]">
                {heroChannel?.category || 'RTM MAUBERE'}
              </span>

              {heroChannel?.activeSource === 'playlist' ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/90 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold uppercase shadow-md">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span> LIVE
                </span>
              ) : heroChannel?.activeSource === 'recording' ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-[10px] font-bold uppercase shadow-md">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span> REPLAY (REKAMAN SIARAN)
                </span>
              ) : heroChannel?.activeSource === 'youtube' ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950/90 border border-blue-500/50 text-blue-300 font-mono text-[10px] font-bold uppercase shadow-md">
                  <span className="h-2 w-2 rounded-full bg-blue-400"></span> YOUTUBE EMBED
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold uppercase shadow-md">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span> SIARAN LANGSUNG (LIVE)
                </span>
              )}
            </div>

            {/* Main Video Title */}
            <h1 className="text-[26px] md:text-[32px] lg:text-[40px] font-extrabold tracking-tight text-white drop-shadow-2xl leading-tight font-sans">
              {!isCmsLoaded ? '' : heroChannel?.name || 'Belum Ada Siaran TV'}
            </h1>

            {/* Current Program Description */}
            <p className="text-sm md:text-base text-neutral-300 font-medium line-clamp-2 drop-shadow-md">
              {heroChannel?.currentProgram || (heroChannel ? '' : 'Belum ada stasiun TV di database.')}
            </p>

            {/* Meta & Watch Action Button */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleWatchNow}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-extrabold shadow-xl shadow-red-900/40 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tonton Siaran Sekarang</span>
              </button>
            </div>

          </div>
        </div>

      </section>

      {/* BODY CONTENT CONTAINER */}
      <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">

        {/* 2. TV LIVE SECTION */}
        <section id="tv-live-section" className="space-y-6 scroll-mt-24">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">
                TV LIVE
              </h2>
              <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse"></span>
            </div>

            <Link href="/tv" className="text-xs font-bold font-mono text-[#A3A3A3] hover:text-white transition-colors flex items-center gap-1">
              <span>LIHAT SEMUA</span>
              <ChevronRight className="w-4 h-4 text-[#E50914]" />
            </Link>
          </div>

          <TVPlayer />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {channels.filter((c) => c && c.id).map((chan) => (
              <div
                key={chan.id}
                onClick={() => setActiveChannelId(chan.id)}
                className="group bg-[#121212] rounded-2xl border border-white/5 overflow-hidden shadow-xl hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <img
                    src={chan.thumbnail}
                    alt={chan.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#E50914] text-white font-mono text-[10px] font-bold uppercase">
                    {chan.category || 'TV On Demand'}
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-[#E50914] transition-colors">
                    {chan.name}
                  </h3>
                  <span className="text-xs text-neutral-400 block font-mono line-clamp-1">
                    {chan.currentProgram}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. RADIO ONLINE SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">
                RADIO ONLINE
              </h2>
              <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse"></span>
            </div>

            <Link href="/radio" className="text-xs font-bold font-mono text-[#A3A3A3] hover:text-white transition-colors flex items-center gap-1">
              <span>LIHAT SEMUA</span>
              <ChevronRight className="w-4 h-4 text-[#E50914]" />
            </Link>
          </div>

          <RadioPlayer streamUrl={radioUrl} onUrlChange={setRadioUrl} />
        </section>

        {/* 4. PROGRAM SCHEDULE SECTION */}
        <section className="pt-2">
          <ProgramSchedule defaultType="all" />
        </section>

        {/* 5. KATEGORI GRID (100% Dynamic dari StreamContext categories) */}
        {categories.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">
                  KATEGORI
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse"></span>
              </div>

              <Link href="/category" className="text-xs font-bold font-mono text-[#A3A3A3] hover:text-white transition-colors flex items-center gap-1">
                <span>LIHAT SEMUA</span>
                <ChevronRight className="w-4 h-4 text-[#E50914]" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              {categories.filter(Boolean).map((catName, idx) => {
                const bg = categoryBgs[catName] || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80';

                return (
                  <Link
                    key={idx}
                    href="/tv"
                    className="group relative h-36 rounded-2xl border border-white/5 overflow-hidden shadow-xl bg-[#121212] flex items-end p-5 transition-all hover:border-[#E50914]/50 hover:shadow-[0_0_25px_rgba(229,9,20,0.2)] cursor-pointer"
                  >
                    <img
                      src={bg}
                      alt={catName}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <span className="relative z-10 font-extrabold text-white text-base tracking-tight uppercase group-hover:text-[#E50914] transition-colors">
                      {catName}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>

    </div>
  );
}
