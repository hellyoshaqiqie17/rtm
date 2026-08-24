'use client';

import React from 'react';
import { useStreamContext } from '@/context/StreamContext';
import { HelpCircle } from 'lucide-react';

export default function HelpPage() {
  const { siteSettings } = useStreamContext();

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pusat Bantuan
            </h1>
          </div>
          <p className="text-sm text-neutral-400">
            Panduan penggunaan dan informasi bantuan layanan RTM MAUBERE.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          {siteSettings.helpContent ? (
            <div
              className="text-neutral-300 leading-relaxed space-y-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_a]:text-[#E50914] [&_a]:underline [&_strong]:text-white"
              dangerouslySetInnerHTML={{ __html: siteSettings.helpContent }}
            />
          ) : (
            <div className="text-center py-20">
              <HelpCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-500 text-sm">Konten Pusat Bantuan belum diisi.</p>
              <p className="text-neutral-600 text-xs mt-1">Admin dapat menambahkan konten melalui Panel Kendali → Pengaturan → Konten Halaman.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
