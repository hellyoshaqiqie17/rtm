'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { StreamProvider } from '@/context/StreamContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAdminRoute = pathname === '/login' || pathname.startsWith('/admin');
  const isHomePage = pathname === '/';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between font-sans selection:bg-[#E50914] selection:text-white">
      
      <div>
        {!isAdminRoute && <Navbar />}

        <main className={`w-full ${!isAdminRoute && !isHomePage ? 'pt-20 sm:pt-24' : ''}`}>
          {children}
        </main>
      </div>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <title>RTM MAUBERE - TV Live 24/7 & Radio Online</title>
        <meta name="description" content="Platform Streaming TV Live 24/7, Radio Online, & Portal Informasi RTM MAUBERE." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#050505] text-white font-sans antialiased min-h-screen">
        <StreamProvider>
          <LayoutContent>{children}</LayoutContent>
        </StreamProvider>
      </body>
    </html>
  );
}
