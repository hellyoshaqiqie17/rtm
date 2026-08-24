import { NextResponse } from 'next/server';

const VPS_IP = process.env.VPS_IP || '103.160.62.250';

async function probe(url: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    return res.ok || res.status === 200;
  } catch {
    return false;
  }
}

export async function GET() {
  const [hlsOk, icecastOk] = await Promise.all([
    probe(`http://${VPS_IP}:8888/live/tv/index.m3u8`),
    probe(`http://${VPS_IP}:8000/status-json.xsl`),
  ]);

  let listeners = 0;
  let radioMountActive = false;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`http://${VPS_IP}:8000/status-json.xsl`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      const source = data?.icestats?.source;
      if (source) {
        const active = Array.isArray(source) ? source[0] : source;
        listeners = active?.listeners || 0;
        radioMountActive = true;
      }
    }
  } catch { /* ignore */ }

  return NextResponse.json({
    status: hlsOk && icecastOk ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    services: {
      mediamtx: {
        status: hlsOk ? 'ONLINE' : 'OFFLINE',
        port: 8888,
        type: 'RTMP Ingest & HLS Server',
      },
      ffmpeg: {
        status: hlsOk ? 'RUNNING' : 'STOPPED',
        service: 'ffmpeg-tv-loop.service',
        mode: '24/7 Loop',
      },
      icecast: {
        status: icecastOk ? 'ONLINE' : 'OFFLINE',
        port: 8000,
        type: 'Icecast Radio Engine',
        mountActive: radioMountActive,
        listeners,
      },
      nginx: {
        status: 'ONLINE',
        port: 80,
        type: 'Reverse Proxy',
      },
    },
    cdn: {
      enabled: false,
      edgeUrl: 'https://cdn-edge.rtm.tl/live',
      mode: 'VPS Direct Origin',
    },
  });
}
