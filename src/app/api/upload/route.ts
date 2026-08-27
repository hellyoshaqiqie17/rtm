import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.avif']);
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function getUploadDir(): string {
  const localDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return localDir;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'img';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'File gambar wajib diunggah.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Ukuran file gambar maksimal 15MB.' }, { status: 400 });
    }

    const originalName = file.name || 'image.png';
    const ext = path.extname(originalName).toLowerCase() || '.png';

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({
        success: false,
        error: `Format file ${ext} tidak didukung. Harap gunakan format: PNG, JPG, JPEG, WEBP, SVG, atau GIF.`
      }, { status: 400 });
    }

    const cleanPrefix = type.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'img';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${cleanPrefix}-${timestamp}-${randomSuffix}${ext}`;

    const uploadDir = getUploadDir();
    const targetPath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    fs.writeFileSync(targetPath, buffer);

    // Also write to VPS standard path if exists and different
    const vpsDir = '/var/www/rtm.tl/public/uploads';
    if (process.platform === 'linux' && fs.existsSync(vpsDir) && uploadDir !== vpsDir) {
      try {
        const vpsPath = path.join(vpsDir, fileName);
        fs.writeFileSync(vpsPath, buffer);
      } catch {}
    }

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: file.size,
      mimeType: file.type || 'image/png',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upload error';
    console.error('[Upload API Error]', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
