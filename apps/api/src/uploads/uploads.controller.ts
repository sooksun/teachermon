import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Uploads Controller — Public endpoint
 * ชื่อไฟล์เป็น UUID (เดาไม่ได้) จึงไม่จำเป็นต้อง auth
 * ให้ browser cache ได้เลย เพื่อลด request ซ้ำ
 */
@Controller('uploads')
@SkipThrottle()
export class UploadsController {
  @Get(':filename')
  async serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // ป้องกัน path traversal (เช่น ../../etc/passwd)
    const safeName = path.basename(filename);
    if (safeName !== filename || filename.includes('..')) {
      throw new NotFoundException('File not found');
    }

    // Build file path — ต้องตรงกับ evidence.service (Docker: /app/apps/api/uploads)
    const cwd = process.cwd();
    const uploadsDirResolved = path.resolve(
      (cwd.endsWith(path.join('apps', 'api')) || cwd.endsWith('apps\\api'))
        ? path.join(cwd, 'uploads')
        : path.join(cwd, 'apps', 'api', 'uploads'),
    );
    const filePath = path.resolve(uploadsDirResolved, safeName);

    // Double-check path is inside uploads dir
    if (!filePath.startsWith(uploadsDirResolved)) {
      throw new NotFoundException('File not found');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Determine content type
    const ext = path.extname(safeName).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Set headers — browser cache 1 ชั่วโมง + Cross-Origin
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');

    // Send file
    res.sendFile(filePath);
  }
}
