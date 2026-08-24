import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const RADIO_PLAYLIST_BASE_DIR = '/var/media/radio-playlists';
const LOCAL_RADIO_PLAYLIST_DIR = path.join(process.cwd(), 'public', 'radio-playlists');

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.aac':
      return 'audio/aac';
    case '.m4a':
      return 'audio/mp4';
    case '.ogg':
      return 'audio/ogg';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; filename: string } }
) {
  try {
    const slug = params.slug;
    const rawFilename = params.filename;
    const filename = decodeURIComponent(rawFilename);

    if (!slug || !filename) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Try finding physical audio file across possible directories
    const candidatePaths = [
      path.join(RADIO_PLAYLIST_BASE_DIR, slug, filename),
      path.join(LOCAL_RADIO_PLAYLIST_DIR, slug, filename),
      path.join(RADIO_PLAYLIST_BASE_DIR, filename),
      path.join(LOCAL_RADIO_PLAYLIST_DIR, filename),
    ];

    let targetFilePath = '';
    for (const p of candidatePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        targetFilePath = p;
        break;
      }
    }

    if (!targetFilePath) {
      return new NextResponse('Audio File Not Found', { status: 404 });
    }

    const stat = fs.statSync(targetFilePath);
    const fileSize = stat.size;
    const contentType = getContentType(filename);

    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      // Parse Range Header (e.g. "bytes=0-")
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse('Requested Range Not Satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(targetFilePath, { start, end });

      // Convert Node readable stream to Web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206, // Partial Content
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
      // Full File Response
      const fileStream = fs.createReadStream(targetFilePath);

      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (err) {
    console.error('Error streaming radio audio file:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
