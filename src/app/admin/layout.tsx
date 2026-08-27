'use client';

import React, { useEffect, useState } from 'react';
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
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdminAuthenticated, logoutAdmin, logoUrl } = useStreamContext();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const isLoginPage = pathname === '/login' || pathname === '/admin/login';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rtm_admin_sidebar_collapsed');
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    } catch (e) {}
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('rtm_admin_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (!isLoginPage && !isAdminAuthenticated) {
      router.push('/login');
    }
  }, [isAdminAuthenticated, isLoginPage, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

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
      
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:z-20 bg-[#0d0d0d] border-r border-white/10 flex flex-col justify-between font-sans transition-all duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0 w-64 p-5' : '-translate-x-full md:translate-x-0'
        } ${
          isSidebarCollapsed ? 'md:w-20 md:p-3' : 'md:w-64 md:p-5'
        }`}
      >
        <div className="space-y-6">
          
          {/* Admin Header Branding */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            {!isSidebarCollapsed ? (
              <>
                <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="RTM MAUBERE"
                    className="h-8 w-auto max-w-[130px] max-h-8 object-contain"
                  />
                </Link>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                    ADMIN
                  </span>
                  <button
                    onClick={toggleSidebar}
                    className="hidden md:flex p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    title="Sembunyikan Sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4 text-neutral-400 hover:text-white" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center gap-2">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-xl bg-white/5 hover:bg-[#E50914] text-neutral-300 hover:text-white transition-all cursor-pointer shadow"
                  title="Tampilkan Sidebar Penuh"
                >
                  <PanelLeftOpen className="w-5 h-5 text-[#E50914] group-hover:text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Nav Items */}
          <nav className="space-y-1.5 text-xs font-semibold">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5'
                  } ${
                    active
                      ? 'bg-[#E50914] text-white font-extrabold shadow-lg shadow-red-900/40'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-neutral-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 space-y-1.5 text-xs">
          <Link
            href="/"
            title={isSidebarCollapsed ? 'Lihat Website Utama' : undefined}
            className={`flex items-center gap-3 rounded-xl font-semibold text-neutral-400 hover:bg-white/5 hover:text-white transition-all ${
              isSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2'
            }`}
          >
            <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Lihat Website Utama</span>}
          </Link>

          <button
            onClick={() => {
              logoutAdmin();
              router.push('/login');
            }}
            title={isSidebarCollapsed ? 'Keluar' : undefined}
            className={`flex items-center gap-3 w-full rounded-xl font-semibold text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Keluar</span>}
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-grow flex flex-col min-h-screen max-w-full overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        
        {/* Sticky Admin Top Header Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl px-4 md:px-6 py-3.5 font-sans">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="p-2 rounded-xl bg-white/5 text-neutral-300 hover:text-white md:hidden cursor-pointer"
              title="Buka Menu"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop Hide/Show Sidebar Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer"
              title={isSidebarCollapsed ? 'Tampilkan Sidebar Penuh' : 'Sembunyikan / Perkecil Sidebar'}
            >
              {isSidebarCollapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-[#E50914]" />
                  <span>Tampilkan Sidebar</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-neutral-400" />
                  <span>Sembunyikan Sidebar</span>
                </>
              )}
            </button>

            <h1 className="text-sm md:text-base font-bold text-white tracking-tight truncate">
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
