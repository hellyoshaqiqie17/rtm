import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// In-memory active session tracking (Client Heartbeats)
// Map<channelId, Map<sessionId, lastPingTimestamp>>
const activeSessions = new Map<string, Map<string, number>>();

function cleanExpiredSessions() {
  const now = Date.now();
  const EXPIRE_MS = 25000; // Session expires if no heartbeat for 25 seconds

  activeSessions.forEach((sessions, channelId) => {
    sessions.forEach((lastPing, sessionId) => {
      if (now - lastPing > EXPIRE_MS) {
        sessions.delete(sessionId);
      }
    });
    if (sessions.size === 0) {
      activeSessions.delete(channelId);
    }
  });
}

function queryPg(sql: string) {
  try {
    const singleLineSql = sql.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const b64 = Buffer.from(singleLineSql).toString('base64');
    const cmd = `sudo -u postgres psql -d rtmdb -t -A -c "$(echo ${b64} | base64 -d)"`;
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 4000 });
    return output.trim();
  } catch {
    return null;
  }
}

// Fetch MediaMTX TV stream paths status
async function getMediaMtxPaths(): Promise<Map<string, { ready: boolean; readersCount: number }>> {
  const map = new Map<string, { ready: boolean; readersCount: number }>();
  try {
    const res = await fetch('http://127.0.0.1:9997/v3/paths/list', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          const pathName = (item.name || '').replace('live/', '').replace('/', '');
          const readers = item.readers ? item.readers.length : 0;
          map.set(pathName, {
            ready: !!item.ready,
            readersCount: readers,
          });
        }
      }
    }
  } catch {}
  return map;
}

// Fetch Icecast Radio status
async function getIcecastStats(): Promise<Map<string, { online: boolean; listeners: number }>> {
  const map = new Map<string, { online: boolean; listeners: number }>();
  try {
    const res = await fetch('http://127.0.0.1:8000/status-json.xsl', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const source = data?.icestats?.source;
      if (source) {
        const sources = Array.isArray(source) ? source : [source];
        for (const s of sources) {
          const mount = (s?.listenurl || '').split('/').pop() || '';
          map.set(mount, {
            online: true,
            listeners: s?.listeners || 0,
          });
        }
      }
    }
  } catch {}
  return map;
}

export async function GET() {
  try {
    cleanExpiredSessions();

    const [mediaMtxMap, icecastMap] = await Promise.all([
      getMediaMtxPaths(),
      getIcecastStats(),
    ]);

    // 1. Fetch TV Channels (PostgreSQL + JSON Backup Fallback)
    let tvChannels: any[] = [];
    try {
      const rawTv = queryPg(
        `SELECT json_agg(json_build_object(
          'id', id, 'name', name, 'slug', slug,
          'activeSource', active_source,
          'totalViews', COALESCE(total_views, 0)
        )) FROM channels;`
      );
      if (rawTv && rawTv !== '') tvChannels = JSON.parse(rawTv) || [];
    } catch {}

    if (!Array.isArray(tvChannels) || tvChannels.length === 0) {
      try {
        const dataPath = path.join(process.cwd(), 'data', 'cms.json');
        if (fs.existsSync(dataPath)) {
          const cmsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
          if (cmsData?.channels) tvChannels = cmsData.channels;
        }
      } catch {}
    }

    // 2. Fetch Radio Channels (PostgreSQL + JSON Backup Fallback)
    let radioChannels: any[] = [];
    try {
      const rawRadio = queryPg(
        `SELECT json_agg(json_build_object(
          'id', id, 'name', name, 'streamUrl', stream_url,
          'activeSource', active_source,
          'totalViews', COALESCE(total_views, 0)
        )) FROM radio_channels;`
      );
      if (rawRadio && rawRadio !== '') radioChannels = JSON.parse(rawRadio) || [];
    } catch {}

    if (!Array.isArray(radioChannels) || radioChannels.length === 0) {
      try {
        const dataPath = path.join(process.cwd(), 'data', 'cms.json');
        if (fs.existsSync(dataPath)) {
          const cmsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
          if (cmsData?.radioChannels) radioChannels = cmsData.radioChannels;
        }
      } catch {}
    }

    const reportItems: any[] = [];

    // Process TV Channels
    for (const ch of tvChannels) {
      const slug = ch.slug || '';
      const mediaMtxInfo = mediaMtxMap.get(slug) || mediaMtxMap.get('tv') || { ready: false, readersCount: 0 };
      const webActiveCount = activeSessions.get(ch.id)?.size || 0;

      // Real viewers = web heartbeats + MediaMTX readers
      const totalActiveViewers = Math.max(webActiveCount, mediaMtxInfo.readersCount);
      const isLive = ch.activeSource === 'playlist' || ch.activeSource === 'recording' || mediaMtxInfo.ready;

      reportItems.push({
        id: ch.id,
        title: ch.name,
        format: ch.activeSource === 'playlist' ? 'MP4 PLAYLIST 24/7' : ch.activeSource === 'recording' ? 'REKAMAN VOD' : 'HLS 1080p',
        currentViewers: totalActiveViewers,
        totalViews: ch.totalViews || 0,
        status: isLive ? 'LIVE' : 'OFFLINE',
        type: 'tv',
      });
    }

    // Process Radio Channels
    for (const r of radioChannels) {
      const mount = (r.streamUrl || '').replace('/radio/', '').replace('/radio', '') || 'live';
      const icecastInfo = icecastMap.get(mount) || { online: false, listeners: 0 };
      const webActiveCount = activeSessions.get(r.id)?.size || 0;

      const totalActiveViewers = Math.max(webActiveCount, icecastInfo.listeners);
      const isLive = r.activeSource === 'playlist' || icecastInfo.online;

      reportItems.push({
        id: r.id,
        title: `${r.name} (Radio)`,
        format: r.activeSource === 'playlist' ? 'AUTODJ MP3 24/7' : 'MP3 AUDIO LIVE',
        currentViewers: totalActiveViewers,
        totalViews: r.totalViews || 0,
        status: isLive ? 'LIVE' : 'OFFLINE',
        type: 'radio',
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      report: reportItems,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: any) {
    console.error('Error fetching analytics:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// POST /api/analytics - Record view increment & client heartbeats
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channelId, sessionId, type, streamType } = body;

    if (!channelId) {
      return NextResponse.json({ success: false, error: 'channelId is required' }, { status: 400 });
    }

    // 1. Handle Heartbeat Ping (Active Viewer Session)
    if (sessionId) {
      if (!activeSessions.has(channelId)) {
        activeSessions.set(channelId, new Map());
      }
      activeSessions.get(channelId)!.set(sessionId, Date.now());
    }

    // 2. Handle New View Event (Increment Total Views in PostgreSQL)
    if (type === 'view') {
      const table = streamType === 'radio' ? 'radio_channels' : 'channels';
      queryPg(`UPDATE ${table} SET total_views = COALESCE(total_views, 0) + 1 WHERE id = '${channelId.replace(/'/g, "''")}';`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
