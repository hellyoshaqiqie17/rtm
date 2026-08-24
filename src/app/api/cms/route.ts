import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cms.json');

const DEFAULT_CHANNELS: any[] = [];
const DEFAULT_RADIO_CHANNELS: any[] = [];

const DEFAULT_CATEGORIES = [
  'RTM Maubere',
  'TV On Demand'
];

const DEFAULT_DATA = {
  channels: [],
  radioChannels: [],
  categories: DEFAULT_CATEGORIES,
  schedules: [],
  siteLogo: 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png'
};

// Execute query on PostgreSQL rtmdb database via psql
function queryPg(sql: string) {
  try {
    const singleLineSql = sql.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const b64 = Buffer.from(singleLineSql).toString('base64');
    const cmd = `sudo -u postgres psql -d rtmdb -t -A -c "$(echo ${b64} | base64 -d)"`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    return output.trim();
  } catch (err) {
    console.error('PostgreSQL query error:', err);
    return null;
  }
}

// Fetch all CMS data directly from PostgreSQL database rtmdb
function getFromPostgres() {
  try {
    const channelsRaw = queryPg(
      `SELECT json_agg(json_build_object(
        'id', id, 'name', name, 'slug', slug, 'category', category,
        'hlsUrl', hls_url, 'youtubeUrl', youtube_url, 'activeSource', active_source,
        'thumbnail', thumbnail, 'currentProgram', current_program, 'enabled', enabled,
        'autoRecord', COALESCE(auto_record, TRUE),
        'recordedPlaybackUrl', COALESCE(recorded_playback_url, ''),
        'selectedRecordingUrl', COALESCE(selected_recording_url, '')
      )) FROM channels;`
    );

    const radioRaw = queryPg(
      `SELECT json_agg(json_build_object(
        'id', id, 'name', name, 'description', description,
        'streamUrl', stream_url, 'thumbnail', thumbnail,
        'category', category, 'enabled', enabled
      )) FROM radio_channels;`
    );

    const categoriesRaw = queryPg(
      `SELECT json_agg(name) FROM categories;`
    );

    const schedulesRaw = queryPg(
      `SELECT json_agg(json_build_object(
        'id', id, 'type', type, 'channelId', channel_id, 'title', title,
        'host', host, 'timeStart', time_start, 'timeEnd', time_end,
        'category', category, 'day', day, 'description', description
      )) FROM schedules;`
    );

    const logoRaw = queryPg(`SELECT value FROM site_settings WHERE key = 'site_logo';`);

    const channels = channelsRaw && channelsRaw !== '' ? JSON.parse(channelsRaw) : null;
    const radioChannels = radioRaw && radioRaw !== '' ? JSON.parse(radioRaw) : null;
    const categories = categoriesRaw && categoriesRaw !== '' ? JSON.parse(categoriesRaw) : null;
    const schedules = schedulesRaw && schedulesRaw !== '' ? JSON.parse(schedulesRaw) : null;

    return {
      channels: Array.isArray(channels) ? channels : [],
      radioChannels: Array.isArray(radioChannels) ? radioChannels : [],
      categories: Array.isArray(categories) ? categories : [],
      schedules: Array.isArray(schedules) ? schedules : [],
      siteLogo: logoRaw || 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png',
    };
  } catch (err) {
    console.error('Error fetching from PostgreSQL:', err);
  }
  return null;
}

function sqlVal(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// Save CMS data to PostgreSQL rtmdb database
function saveToPostgres(data: any) {
  try {
    // 1. Sync Categories
    if (Array.isArray(data.categories)) {
      queryPg(`DELETE FROM categories;`);
      for (const cat of data.categories) {
        queryPg(`INSERT INTO categories (name) VALUES (${sqlVal(cat)});`);
      }
    }

    // 2. Sync Channels & Purge Deleted Channel Video Recordings
    if (Array.isArray(data.channels)) {
      try {
        const oldChannelsRaw = queryPg(`SELECT json_agg(json_build_object('id', id, 'slug', slug)) FROM channels;`);
        const oldChannels = oldChannelsRaw && oldChannelsRaw !== '' ? JSON.parse(oldChannelsRaw) : [];
        const newIds = new Set(data.channels.map((c: any) => c.id));
        const newSlugs = new Set(data.channels.map((c: any) => c.slug));

        for (const old of oldChannels) {
          if (!newIds.has(old.id) && !newSlugs.has(old.slug)) {
            console.log(`[CMS] Channel ${old.slug} deleted. Cleaning up physical recordings & DB rows...`);
            
            const filesRaw = queryPg(`SELECT json_agg(file_path) FROM recordings WHERE stream_key = ${sqlVal(old.slug)} OR channel_id = ${sqlVal(old.id)};`);
            if (filesRaw && filesRaw !== '') {
              const filePaths = JSON.parse(filesRaw);
              for (const fp of filePaths) {
                if (fp && fs.existsSync(fp)) {
                  try { fs.unlinkSync(fp); } catch(e) {}
                  console.log(`[CMS] Unlinked physical recording file: ${fp}`);
                }
              }
            }

            queryPg(`DELETE FROM recordings WHERE stream_key = ${sqlVal(old.slug)} OR channel_id = ${sqlVal(old.id)};`);
          }
        }
      } catch (e) {
        console.error('Error cleaning up deleted channel recordings:', e);
      }

      queryPg(`ALTER TABLE channels ADD COLUMN IF NOT EXISTS selected_recording_url TEXT DEFAULT '';`);
      queryPg(`DELETE FROM channels;`);
      for (const c of data.channels) {
        const sql = `INSERT INTO channels (id, name, slug, category, hls_url, youtube_url, active_source, thumbnail, current_program, enabled, auto_record, recorded_playback_url, selected_recording_url) VALUES (
          ${sqlVal(c.id)},
          ${sqlVal(c.name)},
          ${sqlVal(c.slug)},
          ${sqlVal(c.category || '')},
          ${sqlVal(c.hlsUrl)},
          ${sqlVal(c.youtubeUrl || '')},
          ${sqlVal(c.activeSource || 'hls')},
          ${sqlVal(c.thumbnail)},
          ${sqlVal(c.currentProgram || '')},
          ${c.enabled !== false ? 'TRUE' : 'FALSE'},
          ${c.autoRecord !== false ? 'TRUE' : 'FALSE'},
          ${sqlVal(c.recordedPlaybackUrl || '')},
          ${sqlVal(c.selectedRecordingUrl || '')}
        );`;
        queryPg(sql);
      }
    }

    // 3. Sync Radio Channels
    if (Array.isArray(data.radioChannels)) {
      queryPg(`DELETE FROM radio_channels;`);
      for (const r of data.radioChannels) {
        const sql = `INSERT INTO radio_channels (id, name, description, stream_url, thumbnail, category, enabled) VALUES (
          ${sqlVal(r.id)},
          ${sqlVal(r.name)},
          ${sqlVal(r.description || '')},
          ${sqlVal(r.streamUrl)},
          ${sqlVal(r.thumbnail)},
          ${sqlVal(r.category || '')},
          ${r.enabled !== false ? 'TRUE' : 'FALSE'}
        );`;
        queryPg(sql);
      }
    }

    // 4. Sync Schedules
    if (Array.isArray(data.schedules)) {
      queryPg(`DELETE FROM schedules;`);
      for (const s of data.schedules) {
        const sql = `INSERT INTO schedules (id, type, channel_id, title, host, time_start, time_end, category, day, description) VALUES (
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
        );`;
        queryPg(sql);
      }
    }

    // 5. Sync Site Logo
    if (data.siteLogo) {
      queryPg(`INSERT INTO site_settings (key, value) VALUES ('site_logo', ${sqlVal(data.siteLogo)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`);
    }

    return true;
  } catch (err) {
    console.error('Error saving to PostgreSQL:', err);
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

export async function GET() {
  const pgData = getFromPostgres();
  const fileData = readFileBackup();
  const dbData = pgData || fileData || { channels: [], radioChannels: [], categories: [], schedules: [], siteLogo: 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png' };

  return NextResponse.json(dbData, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = readFileBackup() || getFromPostgres() || { channels: [], radioChannels: [], categories: [], schedules: [], siteLogo: 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png' };
    const updated = {
      ...current,
      ...body,
    };

    writeFileBackup(updated);
    saveToPostgres(updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
