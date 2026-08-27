import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cms.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const DEFAULT_CATEGORIES = [
  'RTM Maubere',
  'TV On Demand',
  'Dokumenter',
  'Kesehatan',
  'Ekonomi',
  'Pendidikan',
];

const DEFAULT_DATA = {
  channels: [],
  radioChannels: [],
  categories: DEFAULT_CATEGORIES,
  categoryObjects: DEFAULT_CATEGORIES.map(c => ({ id: `cat-${c.toLowerCase().replace(/\s+/g, '-')}`, name: c, image: '' })),
  schedules: [],
  shorts: [],
  siteLogo: 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png',
  siteSettings: {
    siteName: 'RTM MAUBERE',
    seoDescription: 'Portal Streaming TV Live 24/7 & Radio Online RTM MAUBERE Timor-Leste.',
    defaultThumbnail: '',
    youtubeApiKey: '',
    youtubeChannelUrl: 'https://www.youtube.com/@rtm_maubere_official',
    footerText: '© 2026 RTM MAUBERE Production. All rights reserved.',
    termsContent: '',
    privacyContent: '',
    helpContent: '',
  },
};

// Helper: Convert raw Base64 dataURL to saved physical image file if provided
function saveBase64Image(dataUrl: string, prefix = 'img'): string {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      return dataUrl;
    }

    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'img';
    const fileName = `${cleanPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    // Also mirror to standard VPS dir if on linux
    const vpsDir = '/var/www/rtm.tl/public/uploads';
    if (process.platform === 'linux' && fs.existsSync(vpsDir) && UPLOAD_DIR !== vpsDir) {
      try {
        fs.writeFileSync(path.join(vpsDir, fileName), buffer);
      } catch {}
    }

    console.log(`[CMS] Converted base64 image to physical file: /uploads/${fileName}`);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('[CMS] Failed to save base64 image:', err);
    return dataUrl;
  }
}

// Execute query on PostgreSQL rtmdb database via psql stdin (safe for all sizes, no CLI arg limits)
function queryPg(sql: string): string | null {
  if (process.platform !== 'linux') {
    return null;
  }

  try {
    const res = spawnSync('sudo', ['-u', 'postgres', 'psql', '-d', 'rtmdb', '-t', '-A'], {
      input: sql,
      encoding: 'utf-8',
      timeout: 10000,
      maxBuffer: 50 * 1024 * 1024,
    });

    if (res.error) {
      console.error('[CMS queryPg spawn error]', res.error);
      return null;
    }

    if (res.status !== 0 && res.stderr) {
      console.error('[CMS queryPg stderr]', res.stderr.trim());
    }

    return (res.stdout || '').trim();
  } catch (err) {
    console.error('[CMS queryPg error]', err);
    return null;
  }
}

function sqlVal(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// Fetch all CMS data directly from PostgreSQL database rtmdb
function getFromPostgres() {
  try {
    ensureTableSchemas();

    const sql = `
      SELECT json_build_object(
        'channels', (
          SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json) FROM (
            SELECT id, name, slug, category,
              hls_url AS "hlsUrl", youtube_url AS "youtubeUrl", COALESCE(active_source, 'hls') AS "activeSource",
              thumbnail, current_program AS "currentProgram", enabled,
              COALESCE(auto_record, TRUE) AS "autoRecord",
              COALESCE(recorded_playback_url, '') AS "recordedPlaybackUrl",
              COALESCE(selected_recording_url, '') AS "selectedRecordingUrl"
            FROM channels ORDER BY created_at ASC
          ) sub
        ),
        'radioChannels', (
          SELECT COALESCE(json_agg(json_build_object(
            'id', id, 'name', name, 'description', description,
            'streamUrl', stream_url, 'thumbnail', thumbnail,
            'category', category, 'enabled', enabled,
            'activeSource', COALESCE(active_source, 'icecast')
          )), '[]'::json) FROM radio_channels
        ),
        'categories', (
          SELECT COALESCE(json_agg(name), '[]'::json) FROM categories
        ),
        'categoryObjects', (
          SELECT COALESCE(json_agg(json_build_object(
            'id', COALESCE(id, name),
            'name', name,
            'image', COALESCE(image, '')
          )), '[]'::json) FROM categories
        ),
        'schedules', (
          SELECT COALESCE(json_agg(json_build_object(
            'id', id, 'type', type, 'channelId', channel_id, 'title', title,
            'host', host, 'timeStart', time_start, 'timeEnd', time_end,
            'category', category, 'day', day, 'description', description
          )), '[]'::json) FROM schedules
        ),
        'shorts', (
          SELECT COALESCE(json_agg(json_build_object(
            'id', id, 'title', title, 'slug', slug,
            'youtubeId', youtube_id, 'thumbnail', thumbnail
          )), '[]'::json) FROM shorts
        ),
        'siteLogo', (
          SELECT COALESCE((SELECT value FROM site_settings WHERE key = 'site_logo' LIMIT 1), 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png')
        ),
        'siteSettings', (
          SELECT COALESCE(json_object_agg(key, value), '{}'::json) FROM site_settings WHERE key != 'site_logo'
        )
      );
    `;

    const raw = queryPg(sql);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        channels: Array.isArray(parsed.channels) ? parsed.channels : [],
        radioChannels: Array.isArray(parsed.radioChannels) ? parsed.radioChannels : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_CATEGORIES,
        categoryObjects: Array.isArray(parsed.categoryObjects) && parsed.categoryObjects.length > 0
          ? parsed.categoryObjects
          : (Array.isArray(parsed.categories) ? parsed.categories.map((c: string) => ({ id: `cat-${c.toLowerCase().replace(/\s+/g, '-')}`, name: c, image: '' })) : []),
        schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
        shorts: Array.isArray(parsed.shorts) ? parsed.shorts : [],
        siteLogo: parsed.siteLogo || 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png',
        siteSettings: parsed.siteSettings && typeof parsed.siteSettings === 'object' ? parsed.siteSettings : {},
      };
    }
  } catch (err) {
    console.error('Error fetching from PostgreSQL:', err);
  }
  return null;
}

let hasRunSchemaInit = false;

// Ensure PostgreSQL table schemas and columns exist (runs once safely outside data sync transaction)
function ensureTableSchemas() {
  if (hasRunSchemaInit || process.platform !== 'linux') return;
  try {
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS channels (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT '',
        hls_url TEXT NOT NULL,
        youtube_url TEXT DEFAULT '',
        active_source TEXT DEFAULT 'hls',
        thumbnail TEXT DEFAULT '',
        current_program TEXT DEFAULT '',
        enabled BOOLEAN DEFAULT TRUE,
        auto_record BOOLEAN DEFAULT TRUE,
        recorded_playback_url TEXT DEFAULT '',
        selected_recording_url TEXT DEFAULT '',
        total_views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE channels ADD COLUMN IF NOT EXISTS active_source TEXT DEFAULT 'hls';
      ALTER TABLE channels ADD COLUMN IF NOT EXISTS auto_record BOOLEAN DEFAULT TRUE;
      ALTER TABLE channels ADD COLUMN IF NOT EXISTS recorded_playback_url TEXT DEFAULT '';
      ALTER TABLE channels ADD COLUMN IF NOT EXISTS selected_recording_url TEXT DEFAULT '';
      ALTER TABLE channels ADD COLUMN IF NOT EXISTS total_views INT DEFAULT 0;
      ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_active_source_check;

      CREATE TABLE IF NOT EXISTS radio_channels (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        stream_url TEXT NOT NULL,
        thumbnail TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT '',
        enabled BOOLEAN DEFAULT TRUE,
        active_source TEXT DEFAULT 'icecast',
        total_views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE radio_channels ADD COLUMN IF NOT EXISTS total_views INT DEFAULT 0;
      ALTER TABLE radio_channels ADD COLUMN IF NOT EXISTS active_source TEXT DEFAULT 'icecast';

      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image TEXT DEFAULT ''
      );

      ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';

      CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        channel_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        host VARCHAR(255) DEFAULT '',
        time_start VARCHAR(20) NOT NULL,
        time_end VARCHAR(20) NOT NULL,
        category VARCHAR(100) DEFAULT '',
        day VARCHAR(50) DEFAULT 'Hari Ini',
        description TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS shorts (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        youtube_id VARCHAR(100) NOT NULL,
        thumbnail TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    queryPg(schemaSql);
    hasRunSchemaInit = true;
  } catch (e) {
    console.error('[CMS] Schema init error:', e);
  }
}

// Save CMS data to PostgreSQL rtmdb database within a single fast atomic transaction
function saveToPostgres(data: any): boolean {
  if (process.platform !== 'linux') {
    return true;
  }

  try {
    ensureTableSchemas();

    const queries: string[] = ['BEGIN;'];

    // 1. Sync Categories
    if (Array.isArray(data.categoryObjects) && data.categoryObjects.length > 0) {
      queries.push(`DELETE FROM categories;`);
      for (const cat of data.categoryObjects) {
        const catId = cat.id || `cat-${(cat.name || 'item').toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
        const catName = cat.name || '';
        const catImg = saveBase64Image(cat.image || '', 'category');
        queries.push(`INSERT INTO categories (id, name, image) VALUES (${sqlVal(catId)}, ${sqlVal(catName)}, ${sqlVal(catImg)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image;`);
      }
    } else if (Array.isArray(data.categories)) {
      queries.push(`DELETE FROM categories;`);
      for (const cat of data.categories) {
        const catName = typeof cat === 'string' ? cat : cat.name;
        const catImg = typeof cat === 'object' ? saveBase64Image(cat.image || '', 'category') : '';
        const catId = typeof cat === 'object' && cat.id ? cat.id : `cat-${catName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
        queries.push(`INSERT INTO categories (id, name, image) VALUES (${sqlVal(catId)}, ${sqlVal(catName)}, ${sqlVal(catImg)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image;`);
      }
    }

    // 2. Sync TV Channels
    if (Array.isArray(data.channels)) {
      queries.push(`DELETE FROM channels;`);
      for (const c of data.channels) {
        const thumb = saveBase64Image(c.thumbnail || '', 'channel');
        queries.push(`INSERT INTO channels (
          id, name, slug, category, hls_url, youtube_url, active_source,
          thumbnail, current_program, enabled, auto_record, recorded_playback_url, selected_recording_url
        ) VALUES (
          ${sqlVal(c.id)},
          ${sqlVal(c.name)},
          ${sqlVal(c.slug)},
          ${sqlVal(c.category || '')},
          ${sqlVal(c.hlsUrl)},
          ${sqlVal(c.youtubeUrl || '')},
          ${sqlVal(c.activeSource || 'hls')},
          ${sqlVal(thumb)},
          ${sqlVal(c.currentProgram || '')},
          ${c.enabled !== false ? 'TRUE' : 'FALSE'},
          ${c.autoRecord !== false ? 'TRUE' : 'FALSE'},
          ${sqlVal(c.recordedPlaybackUrl || '')},
          ${sqlVal(c.selectedRecordingUrl || '')}
        );`);
      }
    }

    // 3. Sync Radio Channels
    if (Array.isArray(data.radioChannels)) {
      queries.push(`DELETE FROM radio_channels;`);
      for (const r of data.radioChannels) {
        const thumb = saveBase64Image(r.thumbnail || '', 'radio');
        queries.push(`INSERT INTO radio_channels (
          id, name, description, stream_url, thumbnail, category, enabled, active_source
        ) VALUES (
          ${sqlVal(r.id)},
          ${sqlVal(r.name)},
          ${sqlVal(r.description || '')},
          ${sqlVal(r.streamUrl)},
          ${sqlVal(thumb)},
          ${sqlVal(r.category || '')},
          ${r.enabled !== false ? 'TRUE' : 'FALSE'},
          ${sqlVal(r.activeSource || 'icecast')}
        );`);
      }
    }

    // 4. Sync Schedules
    if (Array.isArray(data.schedules)) {
      queries.push(`DELETE FROM schedules;`);
      for (const s of data.schedules) {
        queries.push(`INSERT INTO schedules (
          id, type, channel_id, title, host, time_start, time_end, category, day, description
        ) VALUES (
          ${sqlVal(s.id)},
          ${sqlVal(s.type)},
          ${sqlVal(s.channelId)},
          ${sqlVal(s.title)},
          ${sqlVal(s.host || '')},
          ${sqlVal(s.timeStart)},
          ${sqlVal(s.timeEnd)},
          ${sqlVal(s.category || '')},
          ${sqlVal(s.day || 'Hari Ini')},
          ${sqlVal(s.description || '')}
        );`);
      }
    }

    // 5. Sync Shorts
    if (Array.isArray(data.shorts)) {
      queries.push(`DELETE FROM shorts;`);
      for (const sh of data.shorts) {
        const thumb = saveBase64Image(sh.thumbnail || '', 'short');
        queries.push(`INSERT INTO shorts (
          id, title, slug, youtube_id, thumbnail
        ) VALUES (
          ${sqlVal(sh.id)},
          ${sqlVal(sh.title)},
          ${sqlVal(sh.slug)},
          ${sqlVal(sh.youtubeId)},
          ${sqlVal(thumb)}
        );`);
      }
    }

    // 6. Sync Site Logo
    if (data.siteLogo) {
      const logoUrl = saveBase64Image(data.siteLogo, 'logo');
      queries.push(`INSERT INTO site_settings (key, value) VALUES ('site_logo', ${sqlVal(logoUrl)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;`);
    }

    // 7. Sync Site Settings
    if (data.siteSettings && typeof data.siteSettings === 'object') {
      for (const [key, val] of Object.entries(data.siteSettings)) {
        if (val !== undefined && val !== null) {
          const finalVal = key === 'defaultThumbnail' ? saveBase64Image(String(val), 'thumb') : String(val);
          queries.push(`INSERT INTO site_settings (key, value) VALUES (${sqlVal(key)}, ${sqlVal(finalVal)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;`);
        }
      }
    }

    queries.push('COMMIT;');

    const fullSql = queries.join('\n');
    const out = queryPg(fullSql);
    return out !== null;
  } catch (err) {
    console.error('Error in saveToPostgres atomic transaction:', err);
    return false;
  }
}

function readFileBackup() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      return null;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

function writeFileBackup(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing file backup:', err);
  }
}

// Recursively normalize any base64 images in objects/arrays
function normalizePayloadImages(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;

  if (Array.isArray(payload)) {
    return payload.map(item => normalizePayloadImages(item));
  }

  const result: any = { ...payload };

  if (result.categoryObjects && Array.isArray(result.categoryObjects)) {
    result.categoryObjects = result.categoryObjects.map((cat: any) => ({
      ...cat,
      image: saveBase64Image(cat.image || '', 'category'),
    }));
  }

  if (result.channels && Array.isArray(result.channels)) {
    result.channels = result.channels.map((chan: any) => ({
      ...chan,
      thumbnail: saveBase64Image(chan.thumbnail || '', 'channel'),
    }));
  }

  if (result.radioChannels && Array.isArray(result.radioChannels)) {
    result.radioChannels = result.radioChannels.map((rad: any) => ({
      ...rad,
      thumbnail: saveBase64Image(rad.thumbnail || '', 'radio'),
    }));
  }

  if (result.shorts && Array.isArray(result.shorts)) {
    result.shorts = result.shorts.map((sh: any) => ({
      ...sh,
      thumbnail: saveBase64Image(sh.thumbnail || '', 'short'),
    }));
  }

  if (result.siteLogo) {
    result.siteLogo = saveBase64Image(result.siteLogo, 'logo');
  }

  if (result.siteSettings && typeof result.siteSettings === 'object') {
    if (result.siteSettings.defaultThumbnail) {
      result.siteSettings.defaultThumbnail = saveBase64Image(result.siteSettings.defaultThumbnail, 'thumb');
    }
  }

  return result;
}

export async function GET() {
  const pgData = getFromPostgres();
  const fileData = readFileBackup();
  const dbData = pgData || fileData || DEFAULT_DATA;

  return NextResponse.json(dbData, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const body = normalizePayloadImages(rawBody);

    const current = readFileBackup() || getFromPostgres() || DEFAULT_DATA;
    const updated = {
      ...current,
      ...body,
      siteSettings: {
        ...(current.siteSettings || {}),
        ...(body.siteSettings || {}),
      },
    };

    writeFileBackup(updated);
    saveToPostgres(updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
