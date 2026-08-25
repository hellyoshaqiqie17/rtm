import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const RECORDINGS_BASE_DIR = '/var/media/recordings';
const LOCAL_RECORDINGS_DIR = path.join(process.cwd(), 'public', 'recordings');

function queryPg(sql: string) {
  try {
    const cmd = `sudo -u postgres psql -d rtmdb -t -A -c ${JSON.stringify(sql)}`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    return output.trim();
  } catch (err) {
    return null;
  }
}

function scanDiskRecordings(targetSlug?: string): any[] {
  const dirsToScan = [RECORDINGS_BASE_DIR, LOCAL_RECORDINGS_DIR];
  const diskRecordings: any[] = [];
  const seenFiles = new Set<string>();

  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((filename, idx) => {
          if (filename.toLowerCase().endsWith('.mp4') && !seenFiles.has(filename)) {
            seenFiles.add(filename);
            const filePath = path.join(dir, filename);
            const playbackUrl = `/recordings/${filename}`;
            let fileSize = 0;
            let recordedAt = new Date().toISOString();

            try {
              const stat = fs.statSync(filePath);
              fileSize = stat.size;
              recordedAt = stat.mtime.toISOString();
            } catch {}

            // Extract streamKey prefix if filename is slug_timestamp.mp4
            let streamKey = filename.split('_')[0] || 'tv';
            if (targetSlug && targetSlug !== 'all' && streamKey !== targetSlug && !filename.includes(targetSlug)) {
              // Skip if explicitly filtering by slug and doesn't match
              return;
            }

            diskRecordings.push({
              id: `rec-disk-${idx + 1}-${filename}`,
              channelId: streamKey,
              streamKey: streamKey,
              filename: filename,
              filePath: filePath,
              playbackUrl: playbackUrl,
              fileSize: fileSize,
              durationSeconds: 0,
              recordedAt: recordedAt,
            });
          }
        });
      } catch (e) {
        console.error('Error scanning recordings dir:', dir, e);
      }
    }
  }

  return diskRecordings;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const slug = searchParams.get('slug');

    // 1. Fetch from PostgreSQL Database
    let dbRecordings: any[] = [];
    try {
      let filterClause = '';
      if (slug) {
        filterClause = `WHERE stream_key = ${JSON.stringify(slug)}`;
      } else if (channelId) {
        filterClause = `WHERE channel_id = ${JSON.stringify(channelId)}`;
      }

      const sql = `
        SELECT json_agg(json_build_object(
          'id', id,
          'channelId', channel_id,
          'streamKey', stream_key,
          'filename', filename,
          'filePath', file_path,
          'playbackUrl', playback_url,
          'fileSize', file_size,
          'durationSeconds', duration_seconds,
          'recordedAt', recorded_at
        )) FROM (
          SELECT * FROM recordings ${filterClause} ORDER BY recorded_at DESC LIMIT 50
        ) t;
      `;

      const raw = queryPg(sql);
      if (raw && raw !== '') {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dbRecordings = parsed;
        }
      }
    } catch {}

    // 2. Scan Disk Directory
    const diskRecordings = scanDiskRecordings(slug || undefined);

    // 3. Merge DB + Disk Recordings without duplicates
    const combinedMap = new Map<string, any>();
    diskRecordings.forEach(rec => combinedMap.set(rec.filename, rec));
    dbRecordings.forEach(rec => combinedMap.set(rec.filename, { ...combinedMap.get(rec.filename), ...rec }));

    let finalRecordings = Array.from(combinedMap.values());

    // NOTE: Removed universal fallback to prevent new channels from inheriting recordings from other channels!
    if (slug || channelId) {
      finalRecordings = finalRecordings.filter(rec => rec.streamKey === slug || rec.channelId === channelId || rec.filename.startsWith(`${slug}_`));
    }

    return NextResponse.json({ success: true, recordings: finalRecordings }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');
    const recordingId = searchParams.get('id');

    if (!filename && !recordingId) {
      return NextResponse.json({ success: false, error: 'Filename or recording ID required' }, { status: 400 });
    }

    const targetFilename = filename || '';

    // 1. Delete physical files from disk
    const dirsToClean = [RECORDINGS_BASE_DIR, LOCAL_RECORDINGS_DIR];
    for (const dir of dirsToClean) {
      if (targetFilename) {
        const fp = path.join(dir, targetFilename);
        if (fs.existsSync(fp)) {
          try {
            fs.unlinkSync(fp);
            console.log('[RECORDINGS DELETE] Unlinked file:', fp);
          } catch (e) {
            console.error('Failed to unlink file:', fp, e);
          }
        }
      }
    }

    // 2. Delete DB record
    if (targetFilename) {
      queryPg(`DELETE FROM recordings WHERE filename = ${JSON.stringify(targetFilename)};`);
    }
    if (recordingId) {
      queryPg(`DELETE FROM recordings WHERE id = ${JSON.stringify(recordingId)};`);
    }

    // 3. Clear selected/recordedPlaybackUrl in channels if it matches
    const playbackUrl = `/recordings/${targetFilename}`;
    queryPg(`UPDATE channels SET selected_recording_url = '' WHERE selected_recording_url = ${JSON.stringify(playbackUrl)};`);
    queryPg(`UPDATE channels SET recorded_playback_url = '' WHERE recorded_playback_url = ${JSON.stringify(playbackUrl)};`);

    // 4. Update cms.json if exists
    try {
      const cmsPath = path.join(process.cwd(), 'data', 'cms.json');
      if (fs.existsSync(cmsPath)) {
        const data = JSON.parse(fs.readFileSync(cmsPath, 'utf-8'));
        let modified = false;
        if (Array.isArray(data.channels)) {
          for (const c of data.channels) {
            if (c.selectedRecordingUrl === playbackUrl) {
              c.selectedRecordingUrl = '';
              modified = true;
            }
            if (c.recordedPlaybackUrl === playbackUrl) {
              c.recordedPlaybackUrl = '';
              modified = true;
            }
          }
        }
        if (modified) {
          fs.writeFileSync(cmsPath, JSON.stringify(data, null, 2), 'utf-8');
        }
      }
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'File rekaman berhasil dihapus.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
