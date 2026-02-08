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
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
    return this.service.getQuota(req.user.userId);
  }

  // ───────── Jobs ─────────

  @Post('jobs')
  async createJob(@Request() req: any, @Body() dto: CreateJobDto) {
    const teacherId = req.user.teacherId || null;
    return this.service.createJob(req.user.userId, teacherId, dto);
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
    return this.service.uploadFile(jobId, req.user.userId, file);
  }

  @Post('jobs/:id/process')
  async processJob(@Param('id') jobId: string, @Request() req: any) {
    return this.service.processJob(jobId, req.user.userId);
  }

  @Get('jobs')
  async listJobs(@Request() req: any) {
    return this.service.listJobs(req.user.userId);
  }

  @Get('jobs/:id')
  async getJob(@Param('id') jobId: string, @Request() req: any) {
    return this.service.getJob(jobId, req.user.userId);
  }

  @Delete('jobs/:id')
  async deleteJob(@Param('id') jobId: string, @Request() req: any) {
    return this.service.deleteJob(jobId, req.user.userId);
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
    await this.service.getJob(jobId, req.user.userId);

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
    await this.service.getJob(jobId, req.user.userId);
    const coverPath = await this.service.getCoverPath(jobId);
    if (!coverPath) {
      throw new BadRequestException('Cover image not available');
    }
    return res.sendFile(coverPath);
  }

  @Get('jobs/:id/frame/:filename')
  async getFrame(
    @Param('id') jobId: string,
    @Param('filename') filename: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    await this.service.getJob(jobId, req.user.userId);
    const framePath = await this.service.getFramePath(jobId, filename);
    if (!framePath) {
      throw new BadRequestException('Frame not found');
    }
    return res.sendFile(framePath);
  }
}
