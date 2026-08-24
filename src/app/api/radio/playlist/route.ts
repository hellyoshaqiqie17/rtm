import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RADIO_PLAYLIST_BASE_DIR = '/var/media/radio-playlists';
const LOCAL_RADIO_PLAYLIST_DIR = path.join(process.cwd(), 'public', 'radio-playlists');
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'radio_playlists.json');

const isLinux = process.platform === 'linux';

function queryPg(sql: string) {
  if (!isLinux) return null; // PostgreSQL CLI script execution is only for Linux VPS
  try {
    const cmd = `sudo -u postgres psql -d rtmdb -t -A -c ${JSON.stringify(sql)}`;
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 3000 });
    return output.trim();
  } catch {
    return null;
  }
}

function ensureTable() {
  queryPg(`
    CREATE TABLE IF NOT EXISTS radio_playlists (
      id SERIAL PRIMARY KEY,
      station_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      playback_url TEXT NOT NULL,
      duration_seconds INT DEFAULT 0,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function readBackupFile(): any[] {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch {}
  return [];
}

function writeBackupFile(items: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing radio playlist backup:', err);
  }
}

// Scan physical directory for uploaded audio MP3/WAV/AAC files
function scanPhysicalDirectory(stationSlug: string, stationId: string): any[] {
  const dirsToScan = [
    path.join(RADIO_PLAYLIST_BASE_DIR, stationSlug),
    path.join(RADIO_PLAYLIST_BASE_DIR, stationId),
    path.join(LOCAL_RADIO_PLAYLIST_DIR, stationSlug),
    path.join(LOCAL_RADIO_PLAYLIST_DIR, stationId),
  ];

  const diskItems: any[] = [];
  const seenFiles = new Set<string>();

  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((file, index) => {
          const lower = file.toLowerCase();
          if ((lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.aac') || lower.endsWith('.m4a')) && !seenFiles.has(file)) {
            seenFiles.add(file);
            const filePath = path.join(dir, file);
            const playbackUrl = `/radio-playlists/${stationSlug}/${file}`;
            
            diskItems.push({
              id: `disk-${index + 1}-${file}`,
              stationId: stationId,
              stationSlug: stationSlug,
              filename: file,
              filePath: filePath,
              playbackUrl: playbackUrl,
              durationSeconds: 0,
              sortOrder: index + 1,
              createdAt: new Date().toISOString(),
            });
          }
        });
      } catch (err) {
        console.error('Error scanning radio playlist dir:', dir, err);
      }
    }
  }

  return diskItems;
}

// GET /api/radio/playlist?stationId=xyz&stationSlug=abc
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId') || '';
    const stationSlug = searchParams.get('stationSlug') || searchParams.get('slug') || stationId || '';

    if (!stationId && !stationSlug) {
      return NextResponse.json({ success: false, error: 'stationId or stationSlug is required' }, { status: 400 });
    }

    ensureTable();

    // 1. Try PostgreSQL Database
    let dbItems: any[] = [];
    try {
      const raw = queryPg(
        `SELECT json_agg(json_build_object(
          'id', id, 'stationId', station_id, 'filename', filename,
          'filePath', file_path, 'playbackUrl', playback_url,
          'durationSeconds', COALESCE(duration_seconds, 0),
          'sortOrder', COALESCE(sort_order, 0),
          'createdAt', created_at
        )) FROM (
          SELECT * FROM radio_playlists 
          WHERE station_id = '${stationId.replace(/'/g, "''")}' 
             OR station_id = '${stationSlug.replace(/'/g, "''")}'
          ORDER BY sort_order ASC, id ASC
        ) sub;`
      );
      if (raw && raw !== '') {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dbItems = parsed;
        }
      }
    } catch {}

    // 2. Try JSON File Backup
    const backupItems = readBackupFile().filter(
      (it) => it.stationId === stationId || it.stationSlug === stationSlug || it.stationId === stationSlug
    );

    // 3. Scan Physical Disk Directory
    const diskItems = scanPhysicalDirectory(stationSlug, stationId);

    // Merge all sources without duplicates
    const combinedMap = new Map<string, any>();
    
    diskItems.forEach(it => combinedMap.set(it.filename, it));
    backupItems.forEach(it => combinedMap.set(it.filename, { ...combinedMap.get(it.filename), ...it }));
    dbItems.forEach(it => combinedMap.set(it.filename, { ...combinedMap.get(it.filename), ...it }));

    const finalItems = Array.from(combinedMap.values());

    return NextResponse.json({ success: true, items: finalItems }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    console.error('Error fetching radio playlist:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// POST /api/radio/playlist - Upload Radio MP3 Audio File
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const stationId = formData.get('stationId') as string;
    const rawSlug = (formData.get('stationSlug') as string) || stationId || 'default';
    const file = formData.get('file') as File;

    if (!stationId || !file) {
      return NextResponse.json({ success: false, error: 'Stasiun ID dan file lagu audio wajib diisi.' }, { status: 400 });
    }

    ensureTable();

    const sanitizeSlug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'live';
    
    const primaryDir = isLinux
      ? path.join(RADIO_PLAYLIST_BASE_DIR, sanitizeSlug)
      : path.join(LOCAL_RADIO_PLAYLIST_DIR, sanitizeSlug);
    const fallbackDir = path.join(LOCAL_RADIO_PLAYLIST_DIR, sanitizeSlug);

    try { fs.mkdirSync(primaryDir, { recursive: true }); } catch {}
    try { fs.mkdirSync(fallbackDir, { recursive: true }); } catch {}

    const timestamp = Date.now();
    const cleanFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const primaryFilePath = path.join(primaryDir, cleanFileName);
    const fallbackFilePath = path.join(fallbackDir, cleanFileName);
    const playbackUrl = `/radio-playlists/${sanitizeSlug}/${cleanFileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let filePath = primaryFilePath;
    let writeSuccess = false;

    try {
      fs.writeFileSync(primaryFilePath, buffer);
      writeSuccess = true;
    } catch (e) {
      console.warn('Could not write to primary playlist dir, using fallback:', e);
      filePath = fallbackFilePath;
    }

    try {
      if (!writeSuccess || primaryFilePath !== fallbackFilePath) {
        fs.writeFileSync(fallbackFilePath, buffer);
        writeSuccess = true;
      }
    } catch (e) {
      if (!writeSuccess) {
        throw new Error(`Gagal menyimpan file audio ke server: ${String(e)}`);
      }
    }

    // Calculate audio duration with ffprobe if available
    let durationSeconds = 0;
    try {
      const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
      const durStr = execSync(probeCmd, { encoding: 'utf-8', timeout: 3000 }).trim();
      durationSeconds = Math.round(parseFloat(durStr)) || 0;
    } catch {
      durationSeconds = 0;
    }

    const newItem = {
      id: `rpl-${timestamp}`,
      stationId,
      stationSlug: sanitizeSlug,
      filename: cleanFileName,
      filePath,
      playbackUrl,
      durationSeconds,
      sortOrder: timestamp,
      createdAt: new Date().toISOString(),
    };

    // 1. Save to JSON File Backup
    const backup = readBackupFile();
    backup.push(newItem);
    writeBackupFile(backup);

    // 2. Save to PostgreSQL Database if available
    try {
      const insertSql = `
        INSERT INTO radio_playlists (station_id, filename, file_path, playback_url, duration_seconds, sort_order)
        VALUES (
          ${JSON.stringify(stationId)},
          ${JSON.stringify(cleanFileName)},
          ${JSON.stringify(filePath)},
          ${JSON.stringify(playbackUrl)},
          ${durationSeconds},
          ${timestamp % 100000}
        ) RETURNING id;
      `;
      queryPg(insertSql);
    } catch (e) {
      console.warn('PostgreSQL insert warning for radio playlist:', e);
    }

    return NextResponse.json({
      success: true,
      item: newItem,
    });
  } catch (err: any) {
    console.error('Error uploading radio playlist file:', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

// DELETE /api/radio/playlist?id=123&filename=abc.mp3&stationSlug=testing
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const filename = searchParams.get('filename') || '';
    const stationSlug = searchParams.get('stationSlug') || searchParams.get('slug') || '';

    if (!id && !filename) {
      return NextResponse.json({ success: false, error: 'id or filename is required' }, { status: 400 });
    }

    // 1. Remove from JSON backup
    const backup = readBackupFile();
    const targetItem = backup.find(it => 
      String(it.id) === String(id) || 
      (filename && it.filename === filename) ||
      (filename && it.filename.includes(filename))
    );
    
    const filteredBackup = backup.filter(it => 
      String(it.id) !== String(id) && 
      (!filename || it.filename !== filename) &&
      (!filename || !it.filename.includes(filename))
    );
    writeBackupFile(filteredBackup);

    // 2. Locate and delete physical audio file from disk
    const pathsToTry: string[] = [];

    if (targetItem && targetItem.filePath) {
      pathsToTry.push(targetItem.filePath);
    }
    if (stationSlug && filename) {
      pathsToTry.push(path.join(RADIO_PLAYLIST_BASE_DIR, stationSlug, filename));
      pathsToTry.push(path.join(LOCAL_RADIO_PLAYLIST_DIR, stationSlug, filename));
    }
    if (filename) {
      pathsToTry.push(path.join(RADIO_PLAYLIST_BASE_DIR, filename));
      if (fs.existsSync(RADIO_PLAYLIST_BASE_DIR)) {
        try {
          const subdirs = fs.readdirSync(RADIO_PLAYLIST_BASE_DIR);
          for (const sub of subdirs) {
            pathsToTry.push(path.join(RADIO_PLAYLIST_BASE_DIR, sub, filename));
          }
        } catch {}
      }
    }

    for (const p of pathsToTry) {
      if (p && fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
          console.log(`Deleted physical radio audio file: ${p}`);
        } catch (e) {
          console.warn('Could not delete physical audio file:', p, e);
        }
      }
    }

    // 3. Remove from PostgreSQL table radio_playlists
    try {
      if (!isNaN(Number(id)) && Number(id) > 0) {
        queryPg(`DELETE FROM radio_playlists WHERE id = ${parseInt(id)};`);
      }
      if (filename) {
        queryPg(`DELETE FROM radio_playlists WHERE filename LIKE '%${filename.replace(/'/g, "''")}%';`);
      }
    } catch {}

    return NextResponse.json({ success: true, message: 'Radio playlist item deleted successfully' });
  } catch (err) {
    console.error('Error deleting radio playlist item:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// PUT /api/radio/playlist - Reorder radio playlist items
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'items array is required' }, { status: 400 });
    }

    const backup = readBackupFile();
    items.forEach(it => {
      const found = backup.find(b => String(b.id) === String(it.id));
      if (found) found.sortOrder = it.sortOrder;
    });
    writeBackupFile(backup);

    return NextResponse.json({ success: true, message: 'Radio playlist order updated successfully' });
  } catch (err) {
    console.error('Error reordering radio playlist:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
