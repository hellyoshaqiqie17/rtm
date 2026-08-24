'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStreamContext } from '@/context/StreamContext';
import { Search, User, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { isAdminAuthenticated, logoUrl } = useStreamContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Beranda', path: '/' },
    { name: 'TV Live', path: '/tv' },
    { name: 'Radio Online', path: '/radio' },
    { name: 'Kategori', path: '/category' },
  ];

  const isNavActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 z-50 w-full transition-all duration-300 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 py-3.5 shadow-2xl font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Left: RTM MAUBERE Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src={logoUrl}
            alt="RTM MAUBERE"
            className="h-9 w-auto max-w-[160px] max-h-9 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-lg"
          />
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
          {navItems.map((item) => {
            const active = isNavActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`transition-all duration-200 relative py-1 ${
                  active
                    ? 'text-white font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E50914] after:rounded-full'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right: Search & Admin Avatar */}
        <div className="flex items-center gap-3">
          
          {/* Search Button */}
          <button
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Cari"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Admin Avatar Button */}
          {isAdminAuthenticated ? (
            <Link
              href="/admin"
              className="h-9 w-9 rounded-xl bg-black border border-[#E50914] text-[#E50914] flex items-center justify-center font-extrabold text-xs shadow-lg font-mono hover:scale-105 transition-all"
              title="Panel Kendali RTM"
            >
              SU
            </Link>
          ) : (
            <Link
              href="/login"
              className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-[#E50914] flex items-center justify-center transition-all shadow-md"
              title="Masuk Admin"
            >
              <User className="w-4.5 h-4.5" />
            </Link>
          )}

          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-2 font-sans mt-3">
          {navItems.map((item) => {
            const active = isNavActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active ? 'bg-[#E50914] text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
