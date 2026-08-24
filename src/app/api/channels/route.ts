import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'cms.json');

export async function GET() {
  let channels = [];
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (Array.isArray(data?.channels)) {
        channels = data.channels;
      }
    }
  } catch (err) {
    console.error('Error reading channels from cms.json:', err);
  }

  return NextResponse.json({
    success: true,
    channels,
  });
}
