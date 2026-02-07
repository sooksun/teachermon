import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

// Content type mapping
const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

// Uploads directory — mounted via Docker volume
// Docker: /app/uploads (mapped from host ./uploads)
// Local dev: ../../api/uploads (relative to web app)
function getUploadsDir(): string {
  const dockerPath = '/app/uploads';
  const localPath = path.resolve(process.cwd(), '..', 'api', 'uploads');

  // Try Docker path first (production)
  try {
    require('fs').accessSync(dockerPath);
    return dockerPath;
  } catch {
    return localPath;
  }
}

// Next.js 14 — params is NOT a Promise
export async function GET(
  request: NextRequest,
  context: { params: { filename: string } },
) {
  const filename = context.params.filename;

  // Security: only allow basename (no path traversal)
  const safeName = path.basename(filename);
  if (safeName !== filename || filename.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const uploadsDir = getUploadsDir();
  const filePath = path.join(uploadsDir, safeName);

  // Verify file is inside uploads dir
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(uploadsDir))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Check file exists
    await stat(filePath);

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type
    const ext = path.extname(safeName).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    // Return with cache headers (1 hour browser cache)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
