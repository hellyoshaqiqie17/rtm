'use client';

import React from 'react';
import Link from 'next/link';
import { useStreamContext } from '@/context/StreamContext';
import { Tv, Radio, Layers, Activity, ArrowUpRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const { channels, radioChannels, categories } = useStreamContext();

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Overview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse"></span>
          <span>SYSTEM OVERVIEW</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Metrics & Status
        </h1>
      </div>

      {/* Summary Cards Grid (100% Real Dynamic Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total TV Channels */}
        <Link
          href="/admin/tv"
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#121212]/40 p-6 transition-all duration-300 hover:border-white/10 hover:bg-[#121212]"
        >
          <div className="flex items-center justify-between mb-6">
            <Tv className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-mono font-medium text-neutral-300 border border-white/5">
              <Activity className="w-3 h-3 text-[#E50914]" />
              <span>{channels.length} Active</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-5xl font-extrabold tracking-tight text-white font-sans">
              {channels.length}
            </div>
            <div className="text-xs text-neutral-400 font-medium">
              Total TV Channels
            </div>
          </div>

          <ArrowUpRight className="absolute bottom-6 right-6 w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
        </Link>

        {/* Card 2: Total Radio Stations */}
        <Link
          href="/admin/radio"
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#121212]/40 p-6 transition-all duration-300 hover:border-white/10 hover:bg-[#121212]"
        >
          <div className="flex items-center justify-between mb-6">
            <Radio className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-mono font-medium text-neutral-300 border border-white/5">
              <Activity className="w-3 h-3 text-[#E50914]" />
              <span>{radioChannels.length} Active</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-5xl font-extrabold tracking-tight text-white font-sans">
              {radioChannels.length}
            </div>
            <div className="text-xs text-neutral-400 font-medium">
              Total Radio Stations
            </div>
          </div>

          <ArrowUpRight className="absolute bottom-6 right-6 w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
        </Link>

        {/* Card 3: Active Categories */}
        <Link
          href="/admin/category"
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#121212]/40 p-6 transition-all duration-300 hover:border-white/10 hover:bg-[#121212]"
        >
          <div className="flex items-center justify-between mb-6">
            <Layers className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-mono font-medium text-neutral-300 border border-white/5">
              <span>Indexed</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-5xl font-extrabold tracking-tight text-white font-sans">
              {categories.length}
            </div>
            <div className="text-xs text-neutral-400 font-medium">
              Active Categories
            </div>
          </div>

          <ArrowUpRight className="absolute bottom-6 right-6 w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
        </Link>

      </div>

      {/* QUICK ACTIONS */}
      <div className="space-y-3 pt-6 border-t border-white/5">
        <div className="text-xs font-bold text-white uppercase font-mono tracking-wider">
          QUICK ACTIONS
        </div>
        <p className="text-xs text-neutral-500">
          Direct management links
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
          <Link
            href="/admin/tv"
            className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
          >
            <span className="text-[#E50914] font-bold">+</span> Add New TV Stream
          </Link>
          <span className="text-neutral-700">/</span>
          <Link
            href="/admin/radio"
            className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
          >
            <span className="text-[#E50914] font-bold">+</span> Add Radio Station
          </Link>
          <span className="text-neutral-700">/</span>
          <Link
            href="/admin/category"
            className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
          >
            <span className="text-[#E50914] font-bold">+</span> Create Category
          </Link>
          <span className="text-neutral-700">/</span>
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-[#E50914]" /> Settings
          </Link>
        </div>
      </div>

    </div>
  );
}
