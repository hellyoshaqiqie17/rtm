'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStreamContext } from '@/context/StreamContext';
import {
  LayoutDashboard,
  Tv,
  Radio,
  Layers,
  Calendar,
  BarChart3,
  Sliders,
  LogOut,
  User,
  Globe
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdminAuthenticated, logoutAdmin, logoUrl } = useStreamContext();

  const isLoginPage = pathname === '/login' || pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage && !isAdminAuthenticated) {
      router.push('/login');
    }
  }, [isAdminAuthenticated, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 bg-[#050505]">
        <div className="w-8 h-8 border-4 border-[#E50914]/20 border-t-[#E50914] rounded-full animate-spin"></div>
      </div>
    );
  }

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Kelola TV', path: '/admin/tv', icon: Tv },
    { name: 'Kelola Radio', path: '/admin/radio', icon: Radio },
    { name: 'Kategori', path: '/admin/category', icon: Layers },
    { name: 'Jadwal Acara', path: '/admin/schedule', icon: Calendar },
    { name: 'Laporan', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Pengaturan', path: '/admin/settings', icon: Sliders },
  ];

  const isLinkActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin' || pathname === '/admin/dashboard';
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 hidden md:flex fixed h-screen z-20 bg-[#0d0d0d] border-r border-white/10 p-5 flex-col justify-between font-sans">
        <div className="space-y-6">
          
          {/* Admin Header Branding */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <Link href="/admin" className="flex items-center gap-2">
              <img
                src={logoUrl}
                alt="RTM MAUBERE"
                className="h-8 w-auto max-w-[130px] max-h-8 object-contain"
              />
            </Link>
            <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-bold uppercase tracking-wider font-mono">
              ADMIN
            </span>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="space-y-1 text-xs font-semibold">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-[#E50914] text-white font-extrabold shadow-lg shadow-red-900/40'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 space-y-1 text-xs">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-neutral-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <Globe className="w-4 h-4 text-neutral-400" />
            <span>Lihat Website Utama</span>
          </Link>

          <button
            onClick={() => {
              logoutAdmin();
              router.push('/login');
            }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl font-semibold text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-grow md:ml-64 flex flex-col min-h-screen max-w-full overflow-hidden">
        
        {/* Sticky Admin Top Header Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl px-6 py-3.5 font-sans">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Panel Kendali RTM MAUBERE
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-white block leading-tight font-sans">Studio Pusat</span>
              <span className="text-[10px] font-extrabold text-[#E50914] tracking-wider uppercase block font-mono">SUPERADMIN</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-neutral-900 border border-white/20 text-neutral-300 flex items-center justify-center font-bold shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-x-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
