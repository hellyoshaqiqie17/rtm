import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PLAYLIST_BASE_DIR = '/var/media/playlists';
const LOCAL_PLAYLIST_DIR = path.join(process.cwd(), 'public', 'playlists');
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'playlists.json');

function queryPg(sql: string) {
  try {
    const cmd = `sudo -u postgres psql -d rtmdb -t -A -c ${JSON.stringify(sql)}`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    return output.trim();
  } catch (err) {
    return null;
  }
}

function ensureTable() {
  queryPg(`
    CREATE TABLE IF NOT EXISTS channel_playlists (
      id SERIAL PRIMARY KEY,
      channel_id TEXT NOT NULL,
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
    console.error('Error writing playlist backup:', err);
  }
}

// Scan physical directory for uploaded MP4 files
function scanPhysicalDirectory(channelSlug: string, channelId: string): any[] {
  const isLinux = process.platform === 'linux';
  const dirsToScan = [
    path.join(PLAYLIST_BASE_DIR, channelSlug),
    path.join(PLAYLIST_BASE_DIR, channelId),
    path.join(LOCAL_PLAYLIST_DIR, channelSlug),
    path.join(LOCAL_PLAYLIST_DIR, channelId),
  ];

  const diskItems: any[] = [];
  const seenFiles = new Set<string>();

  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((file, index) => {
          if (file.toLowerCase().endsWith('.mp4') && !seenFiles.has(file)) {
            seenFiles.add(file);
            const filePath = path.join(dir, file);
            const playbackUrl = `/playlists/${channelSlug}/${file}`;
            
            diskItems.push({
              id: `disk-${index + 1}-${file}`,
              channelId: channelId,
              channelSlug: channelSlug,
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
        console.error('Error scanning dir:', dir, err);
      }
    }
  }

  return diskItems;
}

// GET /api/playlist?channelId=xyz&channelSlug=abc
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') || '';
    const channelSlug = searchParams.get('channelSlug') || channelId || '';

    if (!channelId && !channelSlug) {
      return NextResponse.json({ success: false, error: 'channelId or channelSlug is required' }, { status: 400 });
    }

    ensureTable();

    // 1. Try PostgreSQL Database
    let dbItems: any[] = [];
    try {
      const raw = queryPg(
        `SELECT json_agg(json_build_object(
          'id', id, 'channelId', channel_id, 'filename', filename,
          'filePath', file_path, 'playbackUrl', playback_url,
          'durationSeconds', COALESCE(duration_seconds, 0),
          'sortOrder', COALESCE(sort_order, 0),
          'createdAt', created_at
        )) FROM (
          SELECT * FROM channel_playlists 
          WHERE channel_id = '${channelId.replace(/'/g, "''")}' 
             OR channel_id = '${channelSlug.replace(/'/g, "''")}'
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
      (it) => it.channelId === channelId || it.channelSlug === channelSlug || it.channelId === channelSlug
    );

    // 3. Scan Physical Disk Directory
    const diskItems = scanPhysicalDirectory(channelSlug, channelId);

    // Merge all sources without duplicates
    const combinedMap = new Map<string, any>();
    
    // Disk items first as base
    diskItems.forEach(it => combinedMap.set(it.filename, it));
    // Backup items override disk items
    backupItems.forEach(it => combinedMap.set(it.filename, { ...combinedMap.get(it.filename), ...it }));
    // DB items have highest priority
    dbItems.forEach(it => combinedMap.set(it.filename, { ...combinedMap.get(it.filename), ...it }));

    const finalItems = Array.from(combinedMap.values());

    return NextResponse.json({ success: true, items: finalItems }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    console.error('Error fetching playlist:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// POST /api/playlist - Upload MP4 Video File
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const channelId = formData.get('channelId') as string;
    const channelSlug = (formData.get('channelSlug') as string) || channelId || 'default';
    const file = formData.get('file') as File;

    if (!channelId || !file) {
      return NextResponse.json({ success: false, error: 'channelId and file are required' }, { status: 400 });
    }

    ensureTable();

    const sanitizeSlug = channelSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const isLinux = process.platform === 'linux';
    const targetDir = isLinux ? path.join(PLAYLIST_BASE_DIR, sanitizeSlug) : path.join(LOCAL_PLAYLIST_DIR, sanitizeSlug);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const timestamp = Date.now();
    const cleanFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(targetDir, cleanFileName);
    const playbackUrl = `/playlists/${sanitizeSlug}/${cleanFileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // Calculate video duration with ffprobe if available
    let durationSeconds = 0;
    try {
      const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
      const durStr = execSync(probeCmd, { encoding: 'utf-8' }).trim();
      durationSeconds = Math.round(parseFloat(durStr)) || 0;
    } catch {
      durationSeconds = 0;
    }

    const newItem = {
      id: `pl-${timestamp}`,
      channelId,
      channelSlug,
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

    // 2. Save to PostgreSQL Database
    try {
      const insertSql = `
        INSERT INTO channel_playlists (channel_id, filename, file_path, playback_url, duration_seconds, sort_order)
        VALUES (
          ${JSON.stringify(channelId)},
          ${JSON.stringify(cleanFileName)},
          ${JSON.stringify(filePath)},
          ${JSON.stringify(playbackUrl)},
          ${durationSeconds},
          ${timestamp % 100000}
        ) RETURNING id;
      `;
      queryPg(insertSql);
    } catch (e) {
      console.warn('PostgreSQL insert warning:', e);
    }

    // 3. Rebuild FFmpeg autoloop playlist on Linux VPS
    if (isLinux) {
      try {
        execSync(`python3 /usr/local/bin/rtm-rebuild-playlists.py '${sanitizeSlug}'`, { encoding: 'utf-8' });
      } catch (err) {
        console.warn('Autoloop rebuild trigger warning:', err);
      }
    }

    return NextResponse.json({
      success: true,
      item: newItem,
    });
  } catch (err) {
    console.error('Error uploading playlist file:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// DELETE /api/playlist?id=123&filename=abc.mp4&channelSlug=testing
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const filename = searchParams.get('filename') || '';
    const channelSlug = searchParams.get('channelSlug') || '';

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

    // 2. Locate and delete physical MP4 file from disk
    const pathsToTry: string[] = [];

    if (targetItem && targetItem.filePath) {
      pathsToTry.push(targetItem.filePath);
    }
    if (channelSlug && filename) {
      pathsToTry.push(path.join(PLAYLIST_BASE_DIR, channelSlug, filename));
      pathsToTry.push(path.join(LOCAL_PLAYLIST_DIR, channelSlug, filename));
    }
    if (filename) {
      pathsToTry.push(path.join(PLAYLIST_BASE_DIR, filename));
      if (fs.existsSync(PLAYLIST_BASE_DIR)) {
        try {
          const subdirs = fs.readdirSync(PLAYLIST_BASE_DIR);
          for (const sub of subdirs) {
            pathsToTry.push(path.join(PLAYLIST_BASE_DIR, sub, filename));
          }
        } catch {}
      }
    }

    for (const p of pathsToTry) {
      if (p && fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
          console.log(`Deleted physical playlist file: ${p}`);
        } catch (e) {
          console.warn('Could not delete physical MP4 file:', p, e);
        }
      }
    }

    // 3. Remove from PostgreSQL table channel_playlists
    try {
      if (!isNaN(Number(id)) && Number(id) > 0) {
        queryPg(`DELETE FROM channel_playlists WHERE id = ${parseInt(id)};`);
      }
      if (filename) {
        queryPg(`DELETE FROM channel_playlists WHERE filename LIKE '%${filename.replace(/'/g, "''")}%';`);
      }
    } catch {}

    // 4. Rebuild FFmpeg autoloop playlist if on Linux
    if (process.platform === 'linux') {
      try {
        execSync(`python3 /usr/local/bin/rtm-rebuild-playlists.py '${channelSlug}'`, { encoding: 'utf-8' });
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Playlist item deleted successfully' });
  } catch (err) {
    console.error('Error deleting playlist item:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// PUT /api/playlist - Reorder items
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'items array is required' }, { status: 400 });
    }

    // Update JSON backup
    const backup = readBackupFile();
    items.forEach(it => {
      const found = backup.find(b => String(b.id) === String(it.id));
      if (found) found.sortOrder = it.sortOrder;
    });
    writeBackupFile(backup);

    return NextResponse.json({ success: true, message: 'Playlist order updated successfully' });
  } catch (err) {
    console.error('Error reordering playlist:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
