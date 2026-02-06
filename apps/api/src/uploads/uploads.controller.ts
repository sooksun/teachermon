import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Serve uploaded files with authentication and ownership check
   */
  @Get(':filename')
  async serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    // Find the evidence by filename
    const evidence = await this.prisma.evidencePortfolio.findFirst({
      where: {
        OR: [
          { fileUrl: { contains: filename } },
          { standardFilename: filename },
          { originalFilename: filename },
        ],
      },
    });

    // Check ownership - only owner or admin can view
    if (evidence) {
      const user = req.user;
      const isOwner = evidence.teacherId === user.teacherId;
      const isAdmin = ['ADMIN', 'PROJECT_MANAGER', 'MENTOR'].includes(user.role);

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You do not have permission to access this file');
      }
    }

    // Build file path
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
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

    // Set headers for cross-origin access
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Send file
    res.sendFile(filePath);
  }
}
