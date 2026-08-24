import { NextResponse } from 'next/server';

const VPS_IP = process.env.VPS_IP || '103.160.62.250';
const VPS_PROXY_PORT = process.env.VPS_PROXY_PORT || '8080';

async function checkEndpoint(url: string, timeoutMs = 5000): Promise<{ online: boolean; statusCode?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    return { online: res.ok || res.status === 200, statusCode: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { online: false, error: message };
  }
}

async function getIcecastStatus(): Promise<{
  online: boolean;
  listeners: number;
  nowPlaying: { artist: string; title: string };
  bitrate: number;
  liveDjConnected: boolean;
  autoDjRunning: boolean;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`http://${VPS_IP}:8000/status-json.xsl`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(id);

    if (!res.ok) {
      return {
        online: false,
        listeners: 0,
        nowPlaying: { artist: 'AutoDJ', title: 'RTM Radio Stream' },
        bitrate: 128,
        liveDjConnected: false,
        autoDjRunning: false,
        error: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const source = data?.icestats?.source;

    let liveDjConnected = false;
    let autoDjRunning = false;
    let activeSource = null;
    let totalListeners = 0;

    if (source) {
      const sources = Array.isArray(source) ? source : [source];
      activeSource = sources[0];

      for (const s of sources) {
        totalListeners += s?.listeners || 0;
        const listenurl = s?.listenurl || '';
        const serverName = s?.server_name || '';
        if (serverName === 'Mixxx' || (listenurl && !listenurl.endsWith('/autodj'))) {
          liveDjConnected = true;
        }
        if (listenurl.endsWith('/autodj')) {
          autoDjRunning = true;
        }
      }
    }

    return {
      online: true,
      listeners: totalListeners,
      nowPlaying: {
        artist: activeSource?.artist || (liveDjConnected ? 'Live DJ Broadcaster' : 'AutoDJ'),
        title: activeSource?.title || 'RTM Radio Stream 24/7',
      },
      bitrate: activeSource?.bitrate || 128,
      liveDjConnected,
      autoDjRunning: autoDjRunning || true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      online: false,
      listeners: 0,
      nowPlaying: { artist: 'AutoDJ', title: 'RTM Radio Stream' },
      bitrate: 128,
      liveDjConnected: false,
      autoDjRunning: false,
      error: message,
    };
  }
}

export async function GET() {
  const [hlsStatus, radioStatus, icecastMeta] = await Promise.all([
    checkEndpoint(`http://${VPS_IP}:${VPS_PROXY_PORT}/tv/index.m3u8`),
    checkEndpoint(`http://${VPS_IP}:8000/live`),
    getIcecastStatus(),
  ]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    vps: {
      ip: VPS_IP,
      proxyPort: VPS_PROXY_PORT,
    },
    services: {
      tv: {
        status: hlsStatus.online ? 'ONLINE' : 'OFFLINE',
        hlsUrl: `http://${VPS_IP}:${VPS_PROXY_PORT}/tv/index.m3u8`,
        directUrl: `http://${VPS_IP}:8888/live/tv/index.m3u8`,
        rtmpIngest: `rtmp://${VPS_IP}:1935/live`,
        streamKeys: ['tv', 'rtm-tv1', 'rtm-news', 'rtm-event'],
        ...hlsStatus,
      },
      radio: {
        status: icecastMeta.online ? 'ONLINE' : 'OFFLINE',
        streamUrl: `http://${VPS_IP}:8000/live`,
        proxyUrl: `http://${VPS_IP}:${VPS_PROXY_PORT}/radio/live`,
        listeners: icecastMeta.listeners || 0,
        nowPlaying: icecastMeta.nowPlaying || null,
        bitrate: icecastMeta.bitrate || 128,
        liveDjConnected: icecastMeta.liveDjConnected,
        autoDjRunning: icecastMeta.autoDjRunning,
        ...radioStatus,
      },
    },
    endpoints: {
      hlsDirect: `http://${VPS_IP}:8888/live/tv/index.m3u8`,
      hlsProxy: `http://${VPS_IP}:${VPS_PROXY_PORT}/tv/index.m3u8`,
      radioDirect: `http://${VPS_IP}:8000/live`,
      radioProxy: `http://${VPS_IP}:${VPS_PROXY_PORT}/radio/live`,
      radioStatusJson: `http://${VPS_IP}:8000/status-json.xsl`,
      obsRtmp: `rtmp://${VPS_IP}:1935/live`,
    },
  });
}
