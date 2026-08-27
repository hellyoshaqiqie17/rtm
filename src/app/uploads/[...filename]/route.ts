import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
};

export async function GET(
  request: Request,
  { params }: { params: { filename: string[] } }
) {
  try {
    const filePathSegment = Array.isArray(params.filename)
      ? params.filename.join('/')
      : params.filename;

    const safeFileName = path.normalize(filePathSegment).replace(/^(\.\.[\/\\])+/, '');
    
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'uploads', safeFileName),
      path.join('/var/www/rtm.tl/public/uploads', safeFileName),
    ];

    let targetPath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }

    if (!targetPath) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(targetPath);
    const ext = path.extname(safeFileName).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
