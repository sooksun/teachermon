import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiAIProvider } from '../ai/providers/gemini-ai.provider';
import Redis from 'ioredis';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as https from 'https';
import * as http from 'http';

const DEFAULT_QUOTA = 1_073_741_824; // 1 GB

@Injectable()
export class VideoAnalysisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VideoAnalysisService.name);
  private redis: Redis | null = null;
  private readonly dataRoot: string;
  private readonly quotaLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly geminiAI: GeminiAIProvider,
  ) {
    this.dataRoot = this.configService.get<string>(
      'ANALYSIS_DATA_ROOT',
      path.join(process.cwd(), 'data', 'jobs'),
    );
    this.quotaLimit = parseInt(
      this.configService.get<string>('ANALYSIS_QUOTA_BYTES', String(DEFAULT_QUOTA)),
      10,
    );
  }

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
        this.redis.on('error', (err) =>
          this.logger.warn('Redis connection error (non-fatal)', err.message),
        );
        this.logger.log('Redis connected for video-analysis queue');
      } catch (err) {
        this.logger.warn('Redis not available – queue features disabled', err);
      }
    } else {
      this.logger.warn('REDIS_URL not set – video-analysis queue disabled');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  // ───────── Quota ─────────

  async getOrCreateQuota(userId: string) {
    let quota = await this.prisma.userMediaQuota.findUnique({
      where: { userId },
    });
    if (!quota) {
      quota = await this.prisma.userMediaQuota.create({
        data: { userId, limitBytes: BigInt(this.quotaLimit), usageBytes: BigInt(0) },
      });
    }
    return quota;
  }

  async getQuota(userId: string) {
    const q = await this.getOrCreateQuota(userId);
    const limit = Number(q.limitBytes);
    const usage = Number(q.usageBytes);
    return {
      limitBytes: limit,
      usageBytes: usage,
      remainingBytes: Math.max(0, limit - usage),
    };
  }

  private async addQuotaUsage(userId: string, deltaBytes: number) {
    await this.prisma.userMediaQuota.update({
      where: { userId },
      data: { usageBytes: { increment: deltaBytes } },
    });
  }

  private async subtractQuotaUsage(userId: string, deltaBytes: number) {
    const q = await this.getOrCreateQuota(userId);
    const newUsage = Math.max(0, Number(q.usageBytes) - deltaBytes);
    await this.prisma.userMediaQuota.update({
      where: { userId },
      data: { usageBytes: BigInt(newUsage) },
    });
  }

  // ───────── Job CRUD ─────────

  async createJob(userId: string, teacherId: string | null, dto: { analysisMode: string; sourceType?: string; originalFilename?: string; sourceUrl?: string; description?: string }): Promise<any> {
    // check quota before allowing creation
    const quota = await this.getQuota(userId);
    if (quota.remainingBytes <= 0) {
      throw new ConflictException('โควต้าเต็ม – ไม่สามารถสร้างงานใหม่ได้ กรุณาลบงานเก่า');
    }

    const sourceType = dto.sourceType || 'UPLOAD';

    // For URL-based sources, set status to UPLOADED directly
    const initialStatus = (sourceType === 'GDRIVE' || sourceType === 'YOUTUBE')
      ? 'UPLOADED'
      : 'UPLOADING';

    const jobId = uuidv4();
    const jobDir = path.join(this.dataRoot, jobId);
    await fs.mkdir(path.join(jobDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(jobDir, 'artifacts'), { recursive: true });

    const job = await this.prisma.analysisJob.create({
      data: {
        id: jobId,
        userId,
        teacherId,
        analysisMode: dto.analysisMode as any,
        sourceType: sourceType as any,
        originalFilename: dto.originalFilename || null,
        sourceUrl: dto.sourceUrl || null,
        description: dto.description || null,
        status: initialStatus as any,
      },
    });

    return job;
  }

  async uploadFile(jobId: string, userId: string, file: Express.Multer.File) {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new BadRequestException('Unauthorized');
    if (job.status !== 'UPLOADING') {
      throw new BadRequestException('Job is not in UPLOADING state');
    }

    const quota = await this.getQuota(userId);
    if (file.size > quota.remainingBytes) {
      throw new ConflictException(
        `ไฟล์ขนาด ${(file.size / 1024 / 1024).toFixed(1)} MB เกินโควต้าที่เหลือ ${(quota.remainingBytes / 1024 / 1024).toFixed(1)} MB`,
      );
    }

    // write to disk
    const rawDir = path.join(this.dataRoot, jobId, 'raw');
    await fs.mkdir(rawDir, { recursive: true });

    const ext = path.extname(file.originalname || '.mp4') || '.mp4';
    const destFile = path.join(rawDir, `video${ext}`);
    await fs.writeFile(destFile, file.buffer);

    // update DB + quota
    const rawBytes = file.size;
    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'UPLOADED',
        rawBytes,
        totalBytes: rawBytes,
        mimeType: file.mimetype,
        originalFilename: file.originalname,
        uploadedAt: new Date(),
      },
    });
    await this.addQuotaUsage(userId, rawBytes);

    return { status: 'UPLOADED', rawBytes };
  }

  /**
   * Upload multiple images for IMAGES source type (3-5 images)
   */
  async uploadMultipleImages(jobId: string, userId: string, files: Express.Multer.File[]) {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new BadRequestException('Unauthorized');
    if (job.status !== 'UPLOADING') {
      throw new BadRequestException('Job is not in UPLOADING state');
    }

    if (files.length < 1 || files.length > 5) {
      throw new BadRequestException('กรุณาอัพโหลด 1-5 รูปภาพ');
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const quota = await this.getQuota(userId);
    if (totalSize > quota.remainingBytes) {
      throw new ConflictException(
        `ไฟล์รวม ${(totalSize / 1024 / 1024).toFixed(1)} MB เกินโควต้าที่เหลือ ${(quota.remainingBytes / 1024 / 1024).toFixed(1)} MB`,
      );
    }

    const rawDir = path.join(this.dataRoot, jobId, 'raw');
    await fs.mkdir(rawDir, { recursive: true });

    for (let i = 0; i < files.length; i++) {
      const ext = path.extname(files[i].originalname || '.jpg') || '.jpg';
      const destFile = path.join(rawDir, `image_${i + 1}${ext}`);
      await fs.writeFile(destFile, files[i].buffer);
    }

    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'UPLOADED',
        rawBytes: totalSize,
        totalBytes: totalSize,
        mimeType: files[0].mimetype,
        originalFilename: files.map((f) => f.originalname).join(', '),
        imageCount: files.length,
        uploadedAt: new Date(),
      },
    });
    await this.addQuotaUsage(userId, totalSize);

    return { status: 'UPLOADED', rawBytes: totalSize, imageCount: files.length };
  }

  /**
   * Download file from Google Drive URL and save to job directory
   */
  async downloadFromGDrive(jobId: string, userId: string): Promise<void> {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job || !job.sourceUrl) throw new BadRequestException('Job or source URL not found');

    const fileId = this.extractGDriveFileId(job.sourceUrl);
    if (!fileId) throw new BadRequestException('ไม่สามารถอ่าน Google Drive link ได้ กรุณาตรวจสอบ URL');

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    this.logger.log(`Downloading from Google Drive: ${fileId}`);

    try {
      const buffer = await this.downloadFile(downloadUrl);

      const rawDir = path.join(this.dataRoot, jobId, 'raw');
      await fs.mkdir(rawDir, { recursive: true });

      // default to mp4 for videos
      const destFile = path.join(rawDir, `video.mp4`);
      await fs.writeFile(destFile, buffer);

      const rawBytes = buffer.byteLength;
      const quota = await this.getQuota(userId);
      if (rawBytes > quota.remainingBytes) {
        await fs.unlink(destFile);
        throw new ConflictException('ไฟล์ขนาดเกินโควต้าที่เหลือ');
      }

      await this.prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          rawBytes,
          totalBytes: rawBytes,
          mimeType: 'video/mp4',
          uploadedAt: new Date(),
        },
      });
      await this.addQuotaUsage(userId, rawBytes);

      this.logger.log(`GDrive file downloaded: ${rawBytes} bytes`);
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      this.logger.error(`GDrive download failed`, err);
      throw new BadRequestException(
        'ไม่สามารถดาวน์โหลดไฟล์จาก Google Drive ได้ ตรวจสอบว่าแชร์เป็น "ทุกคนที่มีลิงก์"',
      );
    }
  }

  /**
   * Download a file from URL, following redirects (up to 5)
   */
  private downloadFile(url: string, maxRedirects = 5): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const request = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        // Follow redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (maxRedirects <= 0) {
            reject(new Error('Too many redirects'));
            return;
          }
          this.downloadFile(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });

      request.on('error', reject);
      request.setTimeout(300000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  /**
   * Download video from YouTube URL
   * Uses yt-dlp or direct Gemini URL for analysis
   */
  async downloadFromYouTube(jobId: string, userId: string): Promise<void> {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job || !job.sourceUrl) throw new BadRequestException('Job or source URL not found');

    const videoId = this.extractYouTubeVideoId(job.sourceUrl);
    if (!videoId) throw new BadRequestException('ไม่สามารถอ่าน YouTube link ได้ กรุณาตรวจสอบ URL');

    // Store the YouTube video ID / URL for later Gemini analysis
    // Gemini 2.0 can analyze YouTube URLs directly
    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        originalFilename: `YouTube: ${videoId}`,
        uploadedAt: new Date(),
      },
    });

    this.logger.log(`YouTube video registered: ${videoId}`);
  }

  private extractGDriveFileId(url: string): string | null {
    // Match patterns:
    // https://drive.google.com/file/d/FILE_ID/view
    // https://drive.google.com/open?id=FILE_ID
    // https://drive.google.com/uc?id=FILE_ID
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  private extractYouTubeVideoId(url: string): string | null {
    // Match patterns:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://youtube.com/embed/VIDEO_ID
    const patterns = [
      /[?&]v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /\/embed\/([a-zA-Z0-9_-]{11})/,
      /\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  private getExtFromMime(mime: string): string {
    const map: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[mime] || '.mp4';
  }

  async processJob(jobId: string, userId: string) {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new BadRequestException('Unauthorized');
    if (job.status !== 'UPLOADED') {
      throw new BadRequestException('Job must be UPLOADED before processing');
    }

    // Try Redis queue (for GPU workers) – but don't fail if unavailable
    if (this.redis) {
      try {
        const message = JSON.stringify({
          job_id: jobId,
          analysis_mode: job.analysisMode,
        });
        await this.redis.rpush('queue:jobs', message);
        this.logger.log(`Job ${jobId} pushed to Redis queue`);
      } catch (err) {
        this.logger.warn(`Redis push failed – will process via Gemini directly`, err);
      }
    } else {
      this.logger.log(`Redis not available – job ${jobId} will be processed via Gemini directly`);
    }

    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: 'QUEUED', queuedAt: new Date() },
    });

    return { queued: true, jobId };
  }

  async getJob(jobId: string, userId: string) {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new BadRequestException('Unauthorized');
    return this.formatJob(job);
  }

  async listJobs(userId: string) {
    const jobs = await this.prisma.analysisJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return jobs.map((j) => this.formatJob(j));
  }

  async deleteJob(jobId: string, userId: string) {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new BadRequestException('Unauthorized');

    // free quota
    if (job.totalBytes > 0) {
      await this.subtractQuotaUsage(userId, job.totalBytes);
    }

    // remove files
    const jobDir = path.join(this.dataRoot, jobId);
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
    } catch (err) {
      this.logger.warn(`Failed to remove job dir ${jobDir}`, err);
    }

    await this.prisma.analysisJob.delete({ where: { id: jobId } });
    return { deleted: true };
  }

  // ───────── AI Analysis (called by cron) ─────────

  async runPendingAnalysis() {
    // ─── 1. Direct Gemini analysis for QUEUED jobs (no worker needed) ───
    const queuedJobs = await this.prisma.analysisJob.findMany({
      where: { status: 'QUEUED' as any },
      take: 2, // process 2 at a time to avoid overload
    });

    for (const job of queuedJobs) {
      try {
        await this.analyzeWithGemini(job.id);
      } catch (err) {
        this.logger.error(`Direct Gemini analysis failed for job ${job.id}`, err);
        await this.prisma.analysisJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: `Analysis error: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
    }

    // ─── 2. Handle ASR_DONE jobs from GPU workers (if workers are running) ───
    const asrDoneJobs = await this.prisma.analysisJob.findMany({
      where: {
        OR: [
          { status: 'ASR_DONE' as any, analysisMode: 'TEXT_ONLY' },
          { status: 'ASR_DONE' as any, analysisMode: 'FULL', hasFrames: true },
        ],
      },
      take: 3,
    });

    for (const job of asrDoneJobs) {
      try {
        await this.analyzeTranscript(job.id);
      } catch (err) {
        this.logger.error(`Transcript analysis failed for job ${job.id}`, err);
        await this.prisma.analysisJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: `Analysis error: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
    }
  }

  // ───────── Direct Gemini multimodal analysis (no worker) ─────────

  private async analyzeWithGemini(jobId: string) {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');

    // Route to specialized methods based on source type
    if (job.sourceType === 'YOUTUBE') {
      return this.analyzeYouTubeUrl(job);
    }
    if (job.sourceType === 'IMAGES') {
      return this.analyzeMultipleImages(job);
    }

    // Default: UPLOAD / GDRIVE (file-based analysis)
    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: 'ANALYZING' },
    });

    // find uploaded media file
    const rawDir = path.join(this.dataRoot, jobId, 'raw');
    let mediaFile: string | null = null;
    try {
      const files = await fs.readdir(rawDir);
      mediaFile = files.find((f) =>
        /\.(mp4|webm|mov|avi|mkv|jpg|jpeg|png|gif|bmp|webp)$/i.test(f),
      ) || null;
    } catch {
      // dir might not exist
    }

    if (!mediaFile) {
      throw new Error('ไม่พบไฟล์สื่อที่อัพโหลด');
    }

    const filePath = path.join(rawDir, mediaFile);
    const mimeType = job.mimeType || this.guessMimeType(mediaFile);
    const isImage = /^image\//i.test(mimeType);
    const isVideo = /^video\//i.test(mimeType);
    const artDir = path.join(this.dataRoot, jobId, 'artifacts');
    await fs.mkdir(artDir, { recursive: true });

    this.logger.log(`Analyzing ${isImage ? 'image' : 'video'} via Gemini: ${mediaFile} (${mimeType})`);

    // ─── Step 1: Transcript (ถอดเสียงจากวิดีโอ) ───
    let transcriptText = '';
    if (isVideo) {
      this.logger.log(`Step 1/2: Transcribing audio from video...`);
      await this.prisma.analysisJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING_ASR' as any },
      });

      try {
        const transcriptResult = await this.geminiAI.generateWithMedia(
          this.buildTranscriptPrompt(),
          filePath,
          mimeType,
        );

        transcriptText = transcriptResult.text.trim();

        // parse transcript JSON if possible
        let transcriptData: any;
        try {
          let cleaned = transcriptText;
          if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          transcriptData = JSON.parse(cleaned);
        } catch {
          // plain text transcript
          transcriptData = {
            fullText: transcriptText,
            segments: [],
          };
        }

        // save transcript.json
        await fs.writeFile(
          path.join(artDir, 'transcript.json'),
          JSON.stringify(transcriptData, null, 2),
          'utf-8',
        );

        // save transcript.txt (plain text version)
        const plainText = transcriptData.fullText
          || (transcriptData.segments || []).map((s: any) => s.text).join('\n')
          || transcriptText;
        await fs.writeFile(
          path.join(artDir, 'transcript.txt'),
          plainText,
          'utf-8',
        );

        await this.prisma.analysisJob.update({
          where: { id: jobId },
          data: { hasTranscript: true },
        });

        this.logger.log(`Transcript saved for job ${jobId} (${plainText.length} chars)`);
      } catch (err) {
        this.logger.warn(`Transcript extraction failed for job ${jobId}, continuing with visual analysis`, err);
        // ไม่ fail ทั้ง job - ทำ analysis ต่อได้แม้ไม่มี transcript
      }
    }

    // ─── Step 2: Full Analysis (วิเคราะห์วิดีโอ/รูปภาพ) ───
    this.logger.log(`Step 2/2: Running full analysis...`);
    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: 'ANALYZING' },
    });

    const analysisPrompt = isImage
      ? this.buildImageAnalysisPrompt(job.description || undefined)
      : this.buildVideoAnalysisPrompt(transcriptText, job.description || undefined);

    const result = await this.geminiAI.generateWithMedia(analysisPrompt, filePath, mimeType);

    // parse AI response
    let analysis: any;
    try {
      let cleaned = result.text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        summary: result.text.substring(0, 1000),
        strengths: [],
        improvements: [],
        advice: result.text,
      };
    }

    // write report to disk
    await fs.writeFile(
      path.join(artDir, 'report.json'),
      JSON.stringify(analysis, null, 2),
      'utf-8',
    );

    const now = new Date();
    // FULL mode: keep frames for 1 year
    const framesExpiresAt = job.analysisMode === 'FULL'
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : null;

    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        hasReport: true,
        transcriptSummary: analysis.summary || null,
        analysisReport: analysis,
        evaluationResult: analysis.indicators || null,
        aiAdvice: analysis.advice || null,
        analysisDoneAt: now,
        doneAt: now,
        ...(framesExpiresAt && { framesExpiresAt }),
      },
    });

    this.logger.log(`Gemini analysis DONE for job ${jobId}`);
  }

  // ───────── YouTube URL Analysis (Gemini 2.0 supports YouTube URLs) ─────────

  private async analyzeYouTubeUrl(job: any) {
    const jobId = job.id;
    const youtubeUrl = job.sourceUrl;
    const videoId = this.extractYouTubeVideoId(youtubeUrl || '');

    if (!videoId) throw new Error('Invalid YouTube URL');

    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: 'ANALYZING' },
    });

    const artDir = path.join(this.dataRoot, jobId, 'artifacts');
    await fs.mkdir(artDir, { recursive: true });

    this.logger.log(`Analyzing YouTube video via Gemini: ${videoId}`);

    // Gemini 2.0 can analyze YouTube URLs directly via text prompt
    const youtubeAnalysisPrompt = `${this.buildVideoAnalysisPrompt(undefined, job.description || undefined)}

วิดีโอ YouTube ที่ต้องวิเคราะห์: ${youtubeUrl}

กรุณาดูวิดีโอจาก URL ข้างต้นแล้ววิเคราะห์อย่างละเอียด`;

    const result = await this.geminiAI.generateText(youtubeAnalysisPrompt);

    let analysis: any;
    try {
      let cleaned = result.text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        summary: result.text.substring(0, 1000),
        strengths: [],
        improvements: [],
        advice: result.text,
      };
    }

    await fs.writeFile(
      path.join(artDir, 'report.json'),
      JSON.stringify(analysis, null, 2),
      'utf-8',
    );

    const now = new Date();
    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        hasReport: true,
        transcriptSummary: analysis.summary || null,
        analysisReport: analysis,
        evaluationResult: analysis.indicators || null,
        aiAdvice: analysis.advice || null,
        analysisDoneAt: now,
        doneAt: now,
      },
    });

    this.logger.log(`YouTube analysis DONE for job ${jobId}`);
  }

  // ───────── Multiple Images Analysis ─────────

  private async analyzeMultipleImages(job: any) {
    const jobId = job.id;

    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: 'ANALYZING' },
    });

    const rawDir = path.join(this.dataRoot, jobId, 'raw');
    const artDir = path.join(this.dataRoot, jobId, 'artifacts');
    await fs.mkdir(artDir, { recursive: true });

    // find all image files
    let imageFiles: string[] = [];
    try {
      const files = await fs.readdir(rawDir);
      imageFiles = files
        .filter((f) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f))
        .sort();
    } catch {
      // dir might not exist
    }

    if (imageFiles.length === 0) {
      throw new Error('ไม่พบไฟล์รูปภาพที่อัพโหลด');
    }

    this.logger.log(`Analyzing ${imageFiles.length} images via Gemini multimodal`);

    const filePaths = imageFiles.map((f) => path.join(rawDir, f));
    const mimeTypes = imageFiles.map((f) => this.guessMimeType(f));

    const prompt = this.buildMultiImageAnalysisPrompt(imageFiles.length, job.description || undefined);
    const result = await this.geminiAI.generateWithMultipleImages(prompt, filePaths, mimeTypes);

    let analysis: any;
    try {
      let cleaned = result.text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        summary: result.text.substring(0, 1000),
        strengths: [],
        improvements: [],
        advice: result.text,
      };
    }

    await fs.writeFile(
      path.join(artDir, 'report.json'),
      JSON.stringify(analysis, null, 2),
      'utf-8',
    );

    const now = new Date();
    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        hasReport: true,
        transcriptSummary: analysis.summary || null,
        analysisReport: analysis,
        evaluationResult: analysis.indicators || null,
        aiAdvice: analysis.advice || null,
        analysisDoneAt: now,
        doneAt: now,
      },
    });

    this.logger.log(`Multi-image analysis DONE for job ${jobId}`);
  }

  private buildTranscriptPrompt(): string {
    return `คุณเป็นผู้เชี่ยวชาญด้านการถอดเสียง (Speech-to-Text) ภาษาไทย
กรุณาฟังเสียงในวิดีโอนี้แล้วถอดเสียงเป็นข้อความภาษาไทยอย่างละเอียด

ให้ผลลัพธ์ในรูป JSON (ไม่มี markdown code fence) ดังนี้:
{
  "fullText": "ข้อความทั้งหมดที่ถอดเสียงได้ เรียงตามลำดับเวลา",
  "segments": [
    { "start": "00:00", "end": "00:30", "text": "ข้อความช่วงแรก..." },
    { "start": "00:30", "end": "01:00", "text": "ข้อความช่วงต่อไป..." }
  ],
  "language": "th",
  "speakerCount": 1,
  "duration": "ความยาวโดยประมาณ เช่น 5:30"
}

เงื่อนไข:
1. ถอดเสียงทุกคำที่ได้ยิน รวมถึงคำอุทาน คำถาม
2. แบ่ง segment ทุก 30 วินาที โดยประมาณ
3. ถ้ามีหลายคนพูด ให้ระบุ speakerCount
4. ถ้าได้ยินไม่ชัด ใส่ [ไม่ชัด] แทน
5. ตอบเป็น JSON เท่านั้น ภาษาไทย`;
  }

  private buildVideoAnalysisPrompt(transcript?: string, description?: string): string {
    const transcriptSection = transcript
      ? `\n\nข้อความถอดเสียงจากวิดีโอ (ใช้ประกอบการวิเคราะห์):\n${transcript.substring(0, 10000)}`
      : '';

    const descSection = description
      ? `\n\nคำบรรยายชิ้นงานจากครู:\n"${description}"`
      : '';

    return `คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์การสอนและการประเมินครู
กรุณาดูวิดีโอการสอนนี้แล้ววิเคราะห์อย่างละเอียด${descSection}${transcriptSection}

ให้ผลลัพธ์ในรูป JSON (ไม่มี markdown code fence) ที่มี key ดังนี้:
{
  "summary": "สรุปภาพรวมการสอน (3-5 ประโยค) อธิบายสิ่งที่เห็นในวิดีโอ",
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", ...],
  "improvements": ["ข้อเสนอปรับปรุง 1", "ข้อเสนอปรับปรุง 2", ...],
  "teachingTechniques": ["เทคนิคที่ใช้ 1", "เทคนิคที่ใช้ 2", ...],
  "studentEngagement": "ระดับการมีส่วนร่วมของผู้เรียน (สูง/ปานกลาง/ต่ำ) + คำอธิบาย",
  "indicators": {
    "WP_1": "การออกแบบการจัดการเรียนรู้ – ระดับ (ดีมาก/ดี/พอใช้/ต้องปรับปรุง) + เหตุผล",
    "WP_2": "การจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ – ระดับ + เหตุผล",
    "WP_3": "การวัดและประเมินผล – ระดับ + เหตุผล",
    "ET_1": "ความเป็นครู – ระดับ + เหตุผล",
    "ET_2": "การจัดการชั้นเรียน – ระดับ + เหตุผล",
    "ET_3": "ภาวะผู้นำทางวิชาการ – ระดับ + เหตุผล",
    "ET_4": "การพัฒนาตนเอง – ระดับ + เหตุผล"
  },
  "overallScore": "คะแนนรวม 1-5",
  "advice": "คำแนะนำเชิงปฏิบัติสำหรับครูในการพัฒนา (3-5 ประโยค)"
}

สำคัญ: ตอบเป็น JSON เท่านั้น ภาษาไทย`;
  }

  private buildImageAnalysisPrompt(description?: string): string {
    const descSection = description
      ? `\n\nคำบรรยายชิ้นงานจากครู:\n"${description}"\n`
      : '';

    return `คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์สื่อการสอนและหลักฐานการปฏิบัติงานครู
กรุณาดูรูปภาพนี้แล้ววิเคราะห์อย่างละเอียด (อาจเป็นภาพกิจกรรมการสอน, ผลงานนักเรียน, สื่อการสอน, หรือหลักฐานอื่นๆ)${descSection}

ให้ผลลัพธ์ในรูป JSON (ไม่มี markdown code fence) ที่มี key ดังนี้:
{
  "summary": "สรุปสิ่งที่เห็นในรูปภาพ (3-5 ประโยค)",
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", ...],
  "improvements": ["ข้อเสนอปรับปรุง 1", "ข้อเสนอปรับปรุง 2", ...],
  "teachingTechniques": ["เทคนิคที่เกี่ยวข้อง 1", ...],
  "studentEngagement": "การมีส่วนร่วมของผู้เรียนที่เห็นจากภาพ",
  "indicators": {
    "WP_1": "การออกแบบการจัดการเรียนรู้ – ระดับ + เหตุผล",
    "WP_2": "การจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ – ระดับ + เหตุผล",
    "WP_3": "การวัดและประเมินผล – ระดับ + เหตุผล",
    "ET_1": "ความเป็นครู – ระดับ + เหตุผล",
    "ET_2": "การจัดการชั้นเรียน – ระดับ + เหตุผล",
    "ET_3": "ภาวะผู้นำทางวิชาการ – ระดับ + เหตุผล",
    "ET_4": "การพัฒนาตนเอง – ระดับ + เหตุผล"
  },
  "overallScore": "คะแนนรวม 1-5",
  "advice": "คำแนะนำสำหรับครูในการพัฒนา (3-5 ประโยค)"
}

สำคัญ: ตอบเป็น JSON เท่านั้น ภาษาไทย`;
  }

  private async analyzeTranscript(jobId: string) {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });

    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: 'ANALYZING' },
    });

    // read transcript
    const transcriptPath = path.join(
      this.dataRoot, jobId, 'artifacts', 'transcript.json',
    );
    let transcriptText = '';
    try {
      const raw = await fs.readFile(transcriptPath, 'utf-8');
      const data = JSON.parse(raw);
      transcriptText = (data.segments || [])
        .map((s: any) => s.text)
        .join(' ');
    } catch {
      throw new Error('ไม่พบไฟล์ transcript');
    }

    if (!transcriptText.trim()) {
      throw new Error('Transcript ว่างเปล่า');
    }

    const prompt = `${this.buildVideoAnalysisPrompt(undefined, job?.description || undefined)}

Transcript:
${transcriptText.substring(0, 15000)}`;

    const result = await this.geminiAI.generateText(prompt);
    let analysis: any;
    try {
      let cleaned = result.text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        summary: result.text.substring(0, 1000),
        strengths: [],
        improvements: [],
        advice: result.text,
      };
    }

    const artDir = path.join(this.dataRoot, jobId, 'artifacts');
    await fs.mkdir(artDir, { recursive: true });
    await fs.writeFile(
      path.join(artDir, 'report.json'),
      JSON.stringify(analysis, null, 2),
      'utf-8',
    );

    const now = new Date();
    // Reload job to check mode for frames retention
    const updatedJob = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    const framesExpiresAt = updatedJob?.analysisMode === 'FULL' && updatedJob?.hasFrames
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : null;

    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        hasReport: true,
        transcriptSummary: analysis.summary || null,
        analysisReport: analysis,
        evaluationResult: analysis.indicators || null,
        aiAdvice: analysis.advice || null,
        analysisDoneAt: now,
        doneAt: now,
        ...(framesExpiresAt && { framesExpiresAt }),
      },
    });

    this.logger.log(`Transcript analysis DONE for job ${jobId}`);
  }

  private buildMultiImageAnalysisPrompt(imageCount: number, description?: string): string {
    const descSection = description
      ? `\n\nคำบรรยายชิ้นงานจากครู:\n"${description}"\n`
      : '';

    return `คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์สื่อการสอนและหลักฐานการปฏิบัติงานครู
กรุณาดูรูปภาพทั้ง ${imageCount} รูปนี้แล้ววิเคราะห์อย่างละเอียดรวมกัน
(อาจเป็นภาพกิจกรรมการสอน, ผลงานนักเรียน, สื่อการสอน, สไลด์, แผนการสอน, หรือหลักฐานอื่นๆ)${descSection}

ให้ผลลัพธ์ในรูป JSON (ไม่มี markdown code fence) ที่มี key ดังนี้:
{
  "summary": "สรุปภาพรวมสิ่งที่เห็นจากรูปภาพทั้งหมด (3-5 ประโยค)",
  "imageDescriptions": ["รูปที่ 1: คำอธิบาย", "รูปที่ 2: คำอธิบาย", ...],
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", ...],
  "improvements": ["ข้อเสนอปรับปรุง 1", "ข้อเสนอปรับปรุง 2", ...],
  "teachingTechniques": ["เทคนิคที่เกี่ยวข้อง 1", ...],
  "studentEngagement": "การมีส่วนร่วมของผู้เรียนที่เห็นจากภาพ",
  "indicators": {
    "WP_1": "การออกแบบการจัดการเรียนรู้ – ระดับ + เหตุผล",
    "WP_2": "การจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ – ระดับ + เหตุผล",
    "WP_3": "การวัดและประเมินผล – ระดับ + เหตุผล",
    "ET_1": "ความเป็นครู – ระดับ + เหตุผล",
    "ET_2": "การจัดการชั้นเรียน – ระดับ + เหตุผล",
    "ET_3": "ภาวะผู้นำทางวิชาการ – ระดับ + เหตุผล",
    "ET_4": "การพัฒนาตนเอง – ระดับ + เหตุผล"
  },
  "overallScore": "คะแนนรวม 1-5",
  "advice": "คำแนะนำสำหรับครูในการพัฒนา (3-5 ประโยค)"
}

สำคัญ: ตอบเป็น JSON เท่านั้น ภาษาไทย`;
  }

  private guessMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  // ───────── Retention Cleanup ─────────

  async cleanupExpiredFrames() {
    const now = new Date();
    const expired = await this.prisma.analysisJob.findMany({
      where: {
        framesExpiresAt: { lte: now },
        framesDeletedAt: null,
        hasFrames: true,
      },
    });

    for (const job of expired) {
      try {
        const framesDir = path.join(this.dataRoot, job.id, 'frames');
        await fs.rm(framesDir, { recursive: true, force: true });

        await this.prisma.analysisJob.update({
          where: { id: job.id },
          data: {
            framesDeletedAt: now,
            hasFrames: false,
            totalBytes: Math.max(0, job.totalBytes - job.framesBytes),
            framesBytes: 0,
          },
        });

        // recalculate quota
        await this.subtractQuotaUsage(job.userId, job.framesBytes);

        this.logger.log(`Purged frames for expired job ${job.id}`);
      } catch (err) {
        this.logger.error(`Failed to purge frames for job ${job.id}`, err);
      }
    }

    return { purged: expired.length };
  }

  // ───────── Artifact serving ─────────

  async getArtifactPath(jobId: string, filename: string): Promise<string | null> {
    const artPath = path.join(this.dataRoot, jobId, 'artifacts', filename);
    try {
      await fs.access(artPath);
      return artPath;
    } catch {
      return null;
    }
  }

  async getFramePath(jobId: string, filename: string): Promise<string | null> {
    const framePath = path.join(this.dataRoot, jobId, 'frames', filename);
    try {
      await fs.access(framePath);
      return framePath;
    } catch {
      return null;
    }
  }

  async getCoverPath(jobId: string): Promise<string | null> {
    const coverPath = path.join(this.dataRoot, jobId, 'artifacts', 'cover.jpg');
    try {
      await fs.access(coverPath);
      return coverPath;
    } catch {
      return null;
    }
  }

  /** Resolve raw file path; returns null if not found or path traversal attempt. */
  async getRawFilePath(jobId: string, filename: string): Promise<string | null> {
    if (!filename || filename.includes('..') || path.isAbsolute(filename)) {
      return null;
    }
    const rawDir = path.join(this.dataRoot, jobId, 'raw');
    const resolved = path.resolve(rawDir, filename);
    const rawDirResolved = path.resolve(rawDir);
    if (!resolved.startsWith(rawDirResolved) || resolved === rawDirResolved) {
      return null;
    }
    try {
      await fs.access(resolved);
      return resolved;
    } catch {
      return null;
    }
  }

  /** List filenames in job raw directory (e.g. for IMAGES source). */
  async listRawFiles(jobId: string): Promise<string[]> {
    const rawDir = path.join(this.dataRoot, jobId, 'raw');
    try {
      const files = await fs.readdir(rawDir);
      return files.filter((f) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f)).sort();
    } catch {
      return [];
    }
  }

  // ───────── helpers ─────────

  private formatJob(job: any) {
    return {
      id: job.id,
      status: job.status,
      analysisMode: job.analysisMode,
      sourceType: job.sourceType,
      sourceUrl: job.sourceUrl || null,
      description: job.description || null,
      originalFilename: job.originalFilename,
      imageCount: job.imageCount || 0,
      rawBytes: job.rawBytes,
      audioBytes: job.audioBytes,
      framesBytes: job.framesBytes,
      totalBytes: job.totalBytes,
      errorMessage: job.errorMessage,
      hasTranscript: job.hasTranscript,
      hasFrames: job.hasFrames,
      hasReport: job.hasReport,
      hasCover: job.hasCover,
      transcriptSummary: job.transcriptSummary,
      analysisReport: job.analysisReport,
      evaluationResult: job.evaluationResult,
      aiAdvice: job.aiAdvice,
      createdAt: job.createdAt?.toISOString(),
      uploadedAt: job.uploadedAt?.toISOString() || null,
      queuedAt: job.queuedAt?.toISOString() || null,
      doneAt: job.doneAt?.toISOString() || null,
    };
  }
}
