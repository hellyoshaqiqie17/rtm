'use client';

import React from 'react';
import { Tv, Radio, ShieldCheck, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Station Profile Card */}
      <div className="bg-[#121212] p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <img
              src="https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png"
              alt="RTM MAUBERE"
              className="h-12 w-auto object-contain drop-shadow-md"
            />
            <div>
              <span className="text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider block">
                PORTAL RESMI
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
                Rádio e Televisão MAUBERE (RTM)
              </h1>
              <p className="text-xs text-neutral-400 font-mono">Timor-Leste National Broadcast Unit</p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-[#E50914]/10 border border-[#E50914]/30 text-[#E50914] text-xs font-mono font-bold">
            ● OFFICIAL BROADCAST
          </span>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed font-sans">
          Rádio e Televisão MAUBERE (RTM) adalah stasiun penyiaran televisi dan radio nasional Timor-Leste. Menyajikan informasi terpercaya, program dokumenter kebudayaan, siaran berita nasional 24 jam, serta program edukasi & kesehatan bagi masyarakat Timor-Leste.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-3 p-4 bg-black/60 rounded-2xl border border-white/5">
            <MapPin className="w-5 h-5 text-[#E50914]" />
            <div>
              <span className="font-bold text-white block">Lokasi Studio</span>
              <span className="text-neutral-400 font-mono text-[11px]">Dili, Timor-Leste</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-black/60 rounded-2xl border border-white/5">
            <Globe className="w-5 h-5 text-[#E50914]" />
            <div>
              <span className="font-bold text-white block">Website Resmi</span>
              <span className="text-neutral-400 font-mono text-[11px]">rtm.tl</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-black/60 rounded-2xl border border-white/5">
            <ShieldCheck className="w-5 h-5 text-[#E50914]" />
            <div>
              <span className="font-bold text-white block">Sistem Streaming</span>
              <span className="text-neutral-400 font-mono text-[11px]">HLS 1080p & Radio</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
