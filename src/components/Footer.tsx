'use client';

import React from 'react';
import Link from 'next/link';
import { useStreamContext } from '@/context/StreamContext';

export default function Footer() {
  const { siteSettings } = useStreamContext();

  return (
    <footer className="relative z-20 border-t border-white/10 bg-[#050505] py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left Copyright */}
        <div className="text-xs uppercase tracking-wider text-[#A3A3A3]/50 font-mono">
          {siteSettings.footerText || '© 2026 RTM MAUBERE Production. All rights reserved.'}
        </div>

        {/* Right Footer Links */}
        <div className="flex items-center gap-6 text-[10px] font-bold tracking-wider text-[#A3A3A3]/40 uppercase">
          <Link href="/terms" className="hover:text-white transition-colors">
            SYARAT & KETENTUAN
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            KEBIJAKAN PRIVASI
          </Link>
          <Link href="/help" className="hover:text-white transition-colors">
            BANTUAN
          </Link>
        </div>

      </div>
    </footer>
  );
}
