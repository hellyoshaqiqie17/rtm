'use client';

import React from 'react';
import RadioPlayer from '@/components/RadioPlayer';
import { useStreamContext } from '@/context/StreamContext';
import { Radio } from 'lucide-react';

export default function RadioRtmPage() {
  const { radioUrl, setRadioUrl } = useStreamContext();

  return (
    <div className="space-y-8 py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse"></span>
          <span>SIARAN RADIO NAKLOKE 24 JAM</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1 font-sans">
          Radio Timor-Leste (RTL Online)
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Dengarkan siaran langsung Radio e Televisão MAUBERE secara langsung dari mana saja.
        </p>
      </div>

      {/* Main Radio Player Console */}
      <RadioPlayer streamUrl={radioUrl} onUrlChange={setRadioUrl} />

      {/* Station Info Box */}
      <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 space-y-3 font-sans">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#E50914]" /> Tentang Rádio e Televisão MAUBERE
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Siaran radio nasional Timor-Leste menyajikan informasi terkini, program musik kebudayaan Timor (*Lian Timor*), berita nasional 24 jam, serta program edukasi & kesehatan untuk seluruh rakyat Timor-Leste.
        </p>
      </div>

    </div>
  );
}
