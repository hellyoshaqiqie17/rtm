'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStreamContext } from '@/context/StreamContext';
import { Zap, CheckCircle2, Cpu, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  status: string;
  port?: number;
  type?: string;
  service?: string;
  mode?: string;
  mountActive?: boolean;
  listeners?: number;
}

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    mediamtx: ServiceStatus;
    ffmpeg: ServiceStatus;
    icecast: ServiceStatus;
    nginx: ServiceStatus;
  };
  cdn: {
    enabled: boolean;
    edgeUrl: string;
    mode: string;
  };
}

export default function AdminSystemPage() {
  const { cdnEnabled, setCdnEnabled } = useStreamContext();
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setTestingHealth(true);
    setHealthError(null);
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealthData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setHealthError(`Gagal menghubungi API health check: ${message}`);
    } finally {
      setTestingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const getStatusBadge = (status: string) => {
    const isOnline = ['ONLINE', 'RUNNING', 'HEALTHY'].includes(status);
    return (
      <span className={`font-bold flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <span className="text-xs font-mono font-bold text-[#E50914] uppercase tracking-wider block">
          INFRASRTUKTUR SYSTEM & CDN
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          System Health Check & Edge CDN Mode
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Pengujian kesehatan server HLS & toggle jaringan distribusi CDN Edge RTM MAUBERE.
        </p>
      </div>

      {/* CDN Toggle Card */}
      <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#E50914]" />
            <div>
              <h2 className="text-base font-bold text-white">Mode Distribusi CDN Edge Cluster</h2>
              <p className="text-xs text-neutral-400">Aktifkan CDN untuk mendistribusikan segmen HLS M3U8 via Cloudflare / Fastly CDN</p>
            </div>
          </div>

          <button
            onClick={() => setCdnEnabled(!cdnEnabled)}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all border shadow-md font-mono ${
              cdnEnabled
                ? 'bg-[#E50914] text-white border-[#E50914] shadow-red-900/40'
                : 'bg-black/60 text-neutral-400 hover:text-white border-white/10'
            }`}
          >
            {cdnEnabled ? 'CDN EDGE ACTIVE' : 'DIRECT VPS ORIGIN'}
          </button>
        </div>

        <div className="text-xs text-neutral-300 space-y-1">
          <p>Status Jaringan: <strong className="text-white">{cdnEnabled ? 'Terdistribusi via Edge CDN Nodes' : 'Langsung ke VPS Origin Server'}</strong></p>
          <p className="font-mono text-neutral-500 text-[11px]">URL Stream: {cdnEnabled ? 'https://cdn.rtm.tl/live/{channel}/index.m3u8' : 'http://103.160.62.250:8080/tv/index.m3u8'}</p>
        </div>
      </div>

      {/* System Health Probe Card */}
      <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Health Check & Diagnostic Probes</h2>
          </div>

          <button
            onClick={fetchHealth}
            disabled={testingHealth}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin' : ''}`} />
            {testingHealth ? 'Running Probes...' : 'Run System Diagnostic'}
          </button>
        </div>

        {/* Overall Status Banner */}
        {healthData && (
          <div className={`p-4 rounded-xl border text-xs font-bold font-mono flex items-center gap-2 ${
            healthData.status === 'HEALTHY'
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/80 border-amber-500/30 text-amber-300'
          }`}>
            {healthData.status === 'HEALTHY'
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              : <AlertTriangle className="w-4 h-4 text-amber-400" />
            }
            <span>
              {healthData.status === 'HEALTHY'
                ? 'ALL SYSTEMS OPERATIONAL'
                : 'SOME SERVICES ARE DEGRADED'
              }
            </span>
            <span className="text-neutral-500 ml-auto">
              Last check: {new Date(healthData.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {healthError && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/30 text-red-300 text-xs font-bold font-mono flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{healthError}</span>
          </div>
        )}

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-1">
            <span className="font-mono text-[10px] text-neutral-500 block uppercase">MediaMTX HLS Service</span>
            {healthData
              ? getStatusBadge(healthData.services.mediamtx.status)
              : <span className="text-neutral-500">Checking...</span>
            }
            <span className="text-[10px] text-neutral-500 font-mono block">
              Port {healthData?.services.mediamtx.port || '8888'} • RTMP + HLS
            </span>
          </div>

          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-1">
            <span className="font-mono text-[10px] text-neutral-500 block uppercase">FFmpeg Transcoder</span>
            {healthData
              ? getStatusBadge(healthData.services.ffmpeg.status)
              : <span className="text-neutral-500">Checking...</span>
            }
            <span className="text-[10px] text-neutral-500 font-mono block">
              {healthData?.services.ffmpeg.mode || '24/7 Loop'}
            </span>
          </div>

          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-1">
            <span className="font-mono text-[10px] text-neutral-500 block uppercase">Icecast Radio Engine</span>
            {healthData
              ? getStatusBadge(healthData.services.icecast.status)
              : <span className="text-neutral-500">Checking...</span>
            }
            <span className="text-[10px] text-neutral-500 font-mono block">
              Port {healthData?.services.icecast.port || '8000'} • {healthData?.services.icecast.listeners || 0} listeners
            </span>
          </div>

          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-1">
            <span className="font-mono text-[10px] text-neutral-500 block uppercase">Nginx Reverse Proxy</span>
            {healthData
              ? getStatusBadge(healthData.services.nginx.status)
              : <span className="text-neutral-500">Checking...</span>
            }
            <span className="text-[10px] text-neutral-500 font-mono block">
              Port {healthData?.services.nginx.port || '80'} • SSL Proxy
            </span>
          </div>
        </div>

        {/* Connection Info */}
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2 text-xs font-mono text-neutral-400">
          <div className="text-[10px] uppercase text-neutral-500 font-bold">Streaming Endpoints</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-neutral-500">TV HLS:</span>{' '}
              <span className="text-cyan-400">http://103.160.62.250:8080/tv/index.m3u8</span>
            </div>
            <div>
              <span className="text-neutral-500">Radio:</span>{' '}
              <span className="text-cyan-400">http://103.160.62.250:8000/live</span>
            </div>
            <div>
              <span className="text-neutral-500">OBS RTMP:</span>{' '}
              <span className="text-amber-400">rtmp://103.160.62.250:1935/live</span>
            </div>
            <div>
              <span className="text-neutral-500">Stream Key:</span>{' '}
              <span className="text-emerald-400">tv, rtm-tv1, rtm-news, rtm-event</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
