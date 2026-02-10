import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { VideoAnalysisService } from './video-analysis.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('video-analysis')
@UseGuards(JwtAuthGuard)
export class VideoAnalysisController {
  constructor(private readonly service: VideoAnalysisService) {}

  // ───────── Quota ─────────

  @Get('quota')
  async getQuota(@Request() req: any) {
    return this.service.getQuota(req.user.sub);
  }

  // ───────── Jobs ─────────

  @Post('jobs')
  async createJob(@Request() req: any, @Body() dto: CreateJobDto): Promise<any> {
    const teacherId = req.user.teacherId || null;
    return this.service.createJob(req.user.sub, teacherId, dto);
  }

  @Post('jobs/:id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max single file
    }),
  )
  async uploadFile(
    @Param('id') jobId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('กรุณาเลือกไฟล์ที่ต้องการอัพโหลด');
    }
    return this.service.uploadFile(jobId, req.user.sub, file);
  }

  // ───────── Multiple Images Upload ─────────

  @Post('jobs/:id/upload-images')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max per image
    }),
  )
  async uploadImages(
    @Param('id') jobId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');
    }
    if (files.length > 5) {
      throw new BadRequestException('อัพโหลดได้สูงสุด 5 รูปภาพ');
    }
    // Validate image types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    for (const f of files) {
      if (!allowedTypes.includes(f.mimetype)) {
        const name = Buffer.from(f.originalname || '', 'latin1').toString('utf8');
        throw new BadRequestException(`ไฟล์ ${name} ไม่ใช่รูปภาพ รองรับ JPG, PNG, WebP, GIF`);
      }
    }
    return this.service.uploadMultipleImages(jobId, req.user.sub, files);
  }

  // ───────── URL-based sources (Google Drive / YouTube) ─────────

  @Post('jobs/:id/process-url')
  async processUrlJob(@Param('id') jobId: string, @Request() req: any) {
    const job = await this.service.getJob(jobId, req.user.sub);

    if (job.sourceType === 'GDRIVE') {
      await this.service.downloadFromGDrive(jobId, req.user.sub);
    } else if (job.sourceType === 'YOUTUBE') {
      await this.service.downloadFromYouTube(jobId, req.user.sub);
    }

    return this.service.processJob(jobId, req.user.sub);
  }

  @Post('jobs/:id/process')
  async processJob(@Param('id') jobId: string, @Request() req: any) {
    return this.service.processJob(jobId, req.user.sub);
  }

  @Get('jobs')
  async listJobs(@Request() req: any) {
    return this.service.listJobs(req.user.sub);
  }

  @Get('jobs/:id')
  async getJob(@Param('id') jobId: string, @Request() req: any) {
    return this.service.getJob(jobId, req.user.sub);
  }

  @Delete('jobs/:id')
  async deleteJob(@Param('id') jobId: string, @Request() req: any) {
    return this.service.deleteJob(jobId, req.user.sub);
  }

  // ───────── Artifacts ─────────

  @Get('jobs/:id/artifact/:filename')
  async getArtifact(
    @Param('id') jobId: string,
    @Param('filename') filename: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    // verify ownership
    await this.service.getJob(jobId, req.user.sub);

    const artPath = await this.service.getArtifactPath(jobId, filename);
    if (!artPath) {
      throw new BadRequestException('Artifact not found');
    }
    return res.sendFile(artPath);
  }

  @Get('jobs/:id/cover')
  async getCover(
    @Param('id') jobId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    await this.service.getJob(jobId, req.user.sub);
    const coverPath = await this.service.getCoverPath(jobId);
    if (!coverPath) {
      throw new BadRequestException('Cover image not available');
    }
    return res.sendFile(coverPath);
  }

  @Get('jobs/:id/raw-files')
  async listRawFiles(@Param('id') jobId: string, @Request() req: any) {
    await this.service.getJob(jobId, req.user.sub);
    const files = await this.service.listRawFiles(jobId);
    return { files };
  }

  @Get('jobs/:id/raw-video-filename')
  async getRawVideoFilename(@Param('id') jobId: string, @Request() req: any) {
    await this.service.getJob(jobId, req.user.sub);
    const filename = await this.service.getRawVideoFilename(jobId);
    if (!filename) {
      throw new NotFoundException('No video file in this job');
    }
    return { filename };
  }

  @Get('jobs/:id/raw/:filename')
  async getRawFile(
    @Param('id') jobId: string,
    @Param('filename') filename: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    await this.service.getJob(jobId, req.user.sub);
    const rawPath = await this.service.getRawFilePath(jobId, filename);
    if (!rawPath) {
      throw new BadRequestException('Raw file not found');
    }
    return res.sendFile(rawPath);
  }

  @Get('jobs/:id/frame/:filename')
  async getFrame(
    @Param('id') jobId: string,
    @Param('filename') filename: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    await this.service.getJob(jobId, req.user.sub);
    const framePath = await this.service.getFramePath(jobId, filename);
    if (!framePath) {
      throw new BadRequestException('Frame not found');
    }
    return res.sendFile(framePath);
  }
}
