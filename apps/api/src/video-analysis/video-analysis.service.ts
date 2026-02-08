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

  async createJob(userId: string, teacherId: string | null, dto: { analysisMode: string; sourceType?: string; originalFilename?: string }) {
    // check quota before allowing creation
    const quota = await this.getQuota(userId);
    if (quota.remainingBytes <= 0) {
      throw new ConflictException('โควต้าเต็ม – ไม่สามารถสร้างงานใหม่ได้ กรุณาลบงานเก่า');
    }

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
        sourceType: (dto.sourceType || 'UPLOAD') as any,
        originalFilename: dto.originalFilename || null,
        status: 'UPLOADING',
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

  async processJob(jobId: string, userId: string) {
    const job = await this.prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new BadRequestException('Unauthorized');
    if (job.status !== 'UPLOADED') {
      throw new BadRequestException('Job must be UPLOADED before processing');
    }

    if (!this.redis) {
      throw new BadRequestException(
        'ระบบ Queue ไม่พร้อมใช้งาน (Redis ไม่ได้เชื่อมต่อ)',
      );
    }

    // enqueue to redis
    const message = JSON.stringify({
      job_id: jobId,
      analysis_mode: job.analysisMode,
    });
    await this.redis.rpush('queue:jobs', message);

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
    // find jobs that are ASR_DONE (TEXT_ONLY) or have frames done
    const readyJobs = await this.prisma.analysisJob.findMany({
      where: {
        OR: [
          { status: 'ASR_DONE', analysisMode: 'TEXT_ONLY' },
          { status: 'ASR_DONE', analysisMode: 'FULL' },
          // vision-worker will push to queue:frames after ASR_DONE
          // and update status when frames are done
        ],
      },
      take: 5,
    });

    for (const job of readyJobs) {
      try {
        if (job.analysisMode === 'TEXT_ONLY') {
          await this.analyzeTranscript(job.id);
        } else {
          // FULL mode: check if frames are already done
          // If frames not started yet, skip – vision-worker will handle
          if (job.hasFrames) {
            await this.analyzeMultimodal(job.id);
          }
          // otherwise wait for frames
        }
      } catch (err) {
        this.logger.error(`Analysis failed for job ${job.id}`, err);
        await this.prisma.analysisJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: `Analysis error: ${err.message}`,
          },
        });
      }
    }

    // also check jobs where status=PROCESSING_FRAMES but frames are done
    const frameDoneJobs = await this.prisma.analysisJob.findMany({
      where: {
        status: 'PROCESSING_FRAMES' as any,
        hasFrames: true,
      },
      take: 5,
    });
    for (const job of frameDoneJobs) {
      try {
        await this.analyzeMultimodal(job.id);
      } catch (err) {
        this.logger.error(`Analysis failed for job ${job.id}`, err);
      }
    }
  }

  private async analyzeTranscript(jobId: string) {
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

    // AI Analysis using Gemini
    const prompt = `คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์การสอน กรุณาวิเคราะห์ transcript การสอนต่อไปนี้
และให้ผลลัพธ์ในรูป JSON (ไม่มี markdown code fence) ที่มี key ดังนี้:
{
  "summary": "สรุปภาพรวมการสอน (3-5 ประโยค)",
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", ...],
  "improvements": ["ข้อเสนอปรับปรุง 1", "ข้อเสนอปรับปรุง 2", ...],
  "teachingTechniques": ["เทคนิคที่ใช้ 1", "เทคนิคที่ใช้ 2", ...],
  "studentEngagement": "ระดับการมีส่วนร่วมของผู้เรียน (สูง/ปานกลาง/ต่ำ) + คำอธิบาย",
  "indicators": {
    "WP_1": "ระดับ (ดีมาก/ดี/พอใช้/ต้องปรับปรุง) + เหตุผล",
    "WP_2": "...",
    "WP_3": "...",
    "ET_1": "...",
    "ET_2": "...",
    "ET_3": "...",
    "ET_4": "..."
  },
  "overallScore": "คะแนนรวม 1-5",
  "advice": "คำแนะนำสำหรับครูในการพัฒนา (3-5 ประโยค)"
}

Transcript:
${transcriptText.substring(0, 15000)}`;

    const result = await this.geminiAI.generateText(prompt);
    let analysis: any;
    try {
      // strip markdown code fences if present
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
    const artDir = path.join(this.dataRoot, jobId, 'artifacts');
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

    this.logger.log(`Analysis DONE for job ${jobId}`);
  }

  private async analyzeMultimodal(jobId: string) {
    // FULL mode: transcript + frame references
    // For now, use same transcript analysis + note frames available
    await this.analyzeTranscript(jobId);

    // set frames expiration (1 year from done)
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: { framesExpiresAt: expiresAt },
    });
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

  // ───────── helpers ─────────

  private formatJob(job: any) {
    return {
      id: job.id,
      status: job.status,
      analysisMode: job.analysisMode,
      sourceType: job.sourceType,
      originalFilename: job.originalFilename,
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
