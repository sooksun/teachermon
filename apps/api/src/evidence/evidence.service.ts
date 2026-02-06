import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvidenceAIService } from '../ai/evidence-ai.service';
import { PDPAScannerService } from '../ai/pdpa-scanner.service';
import { IndicatorsService } from '../indicators/indicators.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evidenceAI: EvidenceAIService,
    private readonly pdpaScanner: PDPAScannerService,
    private readonly indicatorsService: IndicatorsService,
  ) {}

  /**
   * แปลง indicator codes เป็น format ที่ถูกต้อง
   */
  private normalizeIndicatorCodes(codes: any): any {
    return this.indicatorsService.normalizeIndicatorCodes(codes);
  }

  /**
   * อัพโหลดไฟล์
   */
  async uploadFile(data: {
    file: Express.Multer.File;
    teacherId: string;
    evidenceType: string;
    indicatorCodes?: string[] | { main?: string[]; sub?: string[] };
    uploadedBy: string;
  }): Promise<any> {
    if (!data.file) {
      throw new BadRequestException('No file provided');
    }

    // File Validation - Security Check
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    // Validate file type
    if (!allowedMimeTypes.includes(data.file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // Validate file size
    if (data.file.size > maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${maxFileSize / 1024 / 1024}MB`
      );
    }

    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const ext = path.extname(data.file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
      );
    }

    // สร้างชื่อไฟล์มาตรฐาน
    const standardFilename = `${uuidv4()}${ext}`;
    // ใช้ path แบบชัดเจน: apps/api/uploads
    // ตรวจสอบว่า process.cwd() อยู่ที่ root หรือ apps/api
    const cwd = process.cwd();
    let uploadDir: string;
    
    // ถ้า cwd ลงท้ายด้วย apps/api หรือ apps\api แสดงว่ารันจาก apps/api directory
    if (cwd.endsWith(path.join('apps', 'api')) || cwd.endsWith('apps\\api')) {
      uploadDir = path.join(cwd, 'uploads');
    } else {
      // ถ้าไม่ใช่ แสดงว่ารันจาก root directory
      uploadDir = path.join(cwd, 'apps', 'api', 'uploads');
    }
    
    // แปลงเป็น absolute path เพื่อความแน่นอน
    uploadDir = path.resolve(uploadDir);
    
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // บันทึกไฟล์
    const filePath = path.join(uploadDir, standardFilename);
    await fs.writeFile(filePath, data.file.buffer);

    // สร้าง URL (adjust ตาม environment)
    // ใช้ API prefix เพื่อให้ frontend สามารถโหลดได้ผ่าน API server
    const apiPrefix = process.env.API_PREFIX || 'api';
    const fileUrl = `/${apiPrefix}/uploads/${standardFilename}`;

    // ตรวจสอบว่า teacherId มีอยู่จริงในฐานข้อมูล
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: data.teacherId },
      select: { id: true },
    });

    if (!teacher) {
      throw new BadRequestException(
        `Teacher with ID ${data.teacherId} not found`
      );
    }

    // เรียก AI Analysis (ถ้า AI enabled)
    let aiSummary = null;
    try {
      if (this.evidenceAI) {
        aiSummary = await this.evidenceAI.summarizeEvidence(
          data.file.originalname,
          data.file.mimetype,
          data.uploadedBy,
        );
        this.logger.log(`AI analysis completed for ${data.file.originalname}`);
      }
    } catch (error) {
      this.logger.warn(`AI analysis failed for ${data.file.originalname}:`, error);
      // ไม่ throw error - ให้ upload สำเร็จแม้ AI จะล้มเหลว
    }

    // Normalize indicator codes
    let normalizedCodes: any;
    if (data.indicatorCodes) {
      normalizedCodes = this.normalizeIndicatorCodes(data.indicatorCodes);
    } else if (aiSummary?.suggestedIndicators) {
      // ถ้า AI แนะนำ ให้แปลงเป็น format ใหม่
      normalizedCodes = this.normalizeIndicatorCodes(aiSummary.suggestedIndicators);
    } else {
      normalizedCodes = { main: [], sub: [] };
    }

    // ตัดชื่อไฟล์ให้สั้นลงถ้ายาวเกิน 180 ตัวอักษร (เหลือที่ว่างสำหรับ extension)
    const MAX_FILENAME_LENGTH = 180;
    let originalFilename = data.file.originalname;
    if (originalFilename.length > MAX_FILENAME_LENGTH) {
      const ext = path.extname(originalFilename);
      const baseName = path.basename(originalFilename, ext);
      const truncatedBase = baseName.substring(0, MAX_FILENAME_LENGTH - ext.length - 10) + '...';
      originalFilename = truncatedBase + ext;
      this.logger.warn(
        `Filename truncated from ${data.file.originalname.length} to ${originalFilename.length} characters: ${originalFilename}`
      );
    }

    // สร้าง portfolio item
    const portfolioItem = await this.prisma.evidencePortfolio.create({
      data: {
        teacherId: data.teacherId,
        itemType: 'FILE',
        originalFilename: originalFilename,
        standardFilename,
        fileUrl,
        fileSize: data.file.size,
        evidenceType: data.evidenceType as any,
        indicatorCodes: normalizedCodes,
        uploadedBy: data.uploadedBy,
        pdpaChecked: false,
        aiSummary: aiSummary ? JSON.stringify(aiSummary) : null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`File uploaded: ${portfolioItem.id} by ${data.uploadedBy}`);

    // Return with AI summary for frontend
    return {
      ...portfolioItem,
      aiSummary: aiSummary || null,
    };
  }

  /**
   * สร้างลิงก์วิดีโอ
   */
  async createVideoLink(data: {
    teacherId: string;
    videoUrl: string;
    videoTitle: string;
    videoDescription?: string;
    videoPlatform?: string;
    evidenceType: string;
    indicatorCodes?: string[];
    uploadedBy: string;
  }): Promise<any> {
    // ตรวจสอบว่า teacherId มีอยู่จริงในฐานข้อมูล
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: data.teacherId },
      select: { id: true },
    });

    if (!teacher) {
      throw new BadRequestException(
        `Teacher with ID ${data.teacherId} not found`
      );
    }

    // ตรวจ PDPA สำหรับ title + description
    const textToCheck = `${data.videoTitle}\n${data.videoDescription || ''}`;
    const pdpaCheck = await this.pdpaScanner.checkText(
      textToCheck,
      data.uploadedBy,
      'video_link',
      'new',
    );

    // สร้าง portfolio item แบบ VIDEO_LINK
    const videoLink = await this.prisma.evidencePortfolio.create({
      data: {
        teacherId: data.teacherId,
        itemType: 'VIDEO_LINK',
        videoUrl: data.videoUrl,
        videoTitle: data.videoTitle,
        videoDescription: data.videoDescription,
        videoPlatform: data.videoPlatform || this.detectVideoPlatform(data.videoUrl),
        evidenceType: data.evidenceType as any,
        indicatorCodes: data.indicatorCodes || [],
        uploadedBy: data.uploadedBy,
        pdpaChecked: true,
        pdpaRiskLevel: pdpaCheck.riskLevel as any,
      },
    });

    this.logger.log(`Video link created: ${videoLink.id} by ${data.uploadedBy}`);

    return {
      ...videoLink,
      pdpaCheck,
    };
  }

  /**
   * ระบุแพลตฟอร์มวิดีโอจาก URL
   */
  private detectVideoPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('drive.google.com')) {
      return 'google_drive';
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return 'facebook';
    }
    return 'other';
  }

  /**
   * อัปโหลดหลักฐานใหม่ (ไฟล์)
   */
  async create(data: {
    teacherId: string;
    originalFilename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
  }): Promise<any> {
    // 1. ใช้ AI วิเคราะห์ชื่อไฟล์
    const aiAnalysis = await this.evidenceAI.summarizeEvidence(
      data.originalFilename,
      data.mimeType,
      data.uploadedBy,
    );

    // 2. ตรวจ PDPA (ในกรณีที่มี description หรือ notes)
    const pdpaCheck = await this.pdpaScanner.checkText(
      data.originalFilename,
      data.uploadedBy,
      'evidence',
      'new',
    );

    // 3. กำหนด evidence type จาก AI
    const evidenceType = this.determineEvidenceType(aiAnalysis);

    // 4. ตัดชื่อไฟล์ให้สั้นลงถ้ายาวเกิน 180 ตัวอักษร
    const MAX_FILENAME_LENGTH = 180;
    let originalFilename = data.originalFilename;
    if (originalFilename.length > MAX_FILENAME_LENGTH) {
      const ext = path.extname(originalFilename);
      const baseName = path.basename(originalFilename, ext);
      const truncatedBase = baseName.substring(0, MAX_FILENAME_LENGTH - ext.length - 10) + '...';
      originalFilename = truncatedBase + ext;
      this.logger.warn(
        `Filename truncated from ${data.originalFilename.length} to ${originalFilename.length} characters: ${originalFilename}`
      );
    }

    // 5. สร้างรายการในฐานข้อมูล
    const evidence = await this.prisma.evidencePortfolio.create({
      data: {
        teacherId: data.teacherId,
        originalFilename: originalFilename,
        standardFilename: aiAnalysis.suggestedFilename,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        evidenceType: evidenceType as any,
        indicatorCodes: aiAnalysis.suggestedIndicators,
        aiSummary: aiAnalysis.summary,
        aiKeywords: aiAnalysis.keywords,
        aiQualityCheck: aiAnalysis.qualityCheck as any,
        aiSuggestions: aiAnalysis.suggestions.join('\n'),
        uploadedBy: data.uploadedBy,
        pdpaChecked: true,
        pdpaRiskLevel: pdpaCheck.riskLevel as any,
      },
    });

    this.logger.log(`Evidence uploaded: ${evidence.id} by ${data.uploadedBy}`);

    return {
      ...evidence,
      aiAnalysis,
      pdpaCheck,
    };
  }

  /**
   * ดึงรายการหลักฐานของครู
   */
  async findByTeacher(teacherId: string, filters?: {
    evidenceType?: string;
    indicatorCode?: string;
    isVerified?: boolean;
  }): Promise<any[]> {
    const where: any = { teacherId };

    if (filters?.evidenceType) {
      where.evidenceType = filters.evidenceType;
    }

    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters?.indicatorCode) {
      where.indicatorCodes = {
        array_contains: filters.indicatorCode,
      };
    }

    return this.prisma.evidencePortfolio.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * ดึงหลักฐานทั้งหมด (สำหรับ admin/ผู้ดูแล)
   */
  async findAll(filters?: {
    teacherId?: string;
    evidenceType?: string;
    isVerified?: boolean;
    limit?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters?.teacherId) where.teacherId = filters.teacherId;
    if (filters?.evidenceType) where.evidenceType = filters.evidenceType;
    if (filters?.isVerified !== undefined) where.isVerified = filters.isVerified;

    return this.prisma.evidencePortfolio.findMany({
      where,
      take: filters?.limit || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            school: {
              select: {
                schoolName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * ดึงหลักฐาน 1 รายการ
   */
  async findOne(id: string): Promise<any> {
    const evidence = await this.prisma.evidencePortfolio.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    return evidence;
  }

  /**
   * ยืนยันหลักฐาน (verified by human)
   */
  async verify(id: string, verifiedBy: string, updates?: {
    indicatorCodes?: string[];
    evidenceType?: string;
  }): Promise<any> {
    return this.prisma.evidencePortfolio.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
        ...(updates?.indicatorCodes && { indicatorCodes: updates.indicatorCodes }),
        ...(updates?.evidenceType && { evidenceType: updates.evidenceType as any }),
      },
    });
  }

  /**
   * ลบหลักฐาน
   */
  async remove(id: string): Promise<any> {
    return this.prisma.evidencePortfolio.delete({
      where: { id },
    });
  }

  /**
   * สถิติหลักฐาน
   */
  async getStats(teacherId?: string) {
    const where: any = teacherId ? { teacherId } : {};

    const [total, byType, byIndicator, verified] = await Promise.all([
      this.prisma.evidencePortfolio.count({ where }),

      this.prisma.evidencePortfolio.groupBy({
        by: ['evidenceType'],
        where,
        _count: true,
      }),

      // Count by indicator (ต้องใช้ raw query เพราะ JSON field)
      this.prisma.evidencePortfolio.findMany({
        where,
        select: { indicatorCodes: true },
      }),

      this.prisma.evidencePortfolio.count({
        where: { ...where, isVerified: true },
      }),
    ]);

    // นับ indicator จาก JSON (รองรับทั้ง format เก่าและใหม่)
    const indicatorCounts: Record<string, number> = {};
    byIndicator.forEach((e: any) => {
      const codes = e.indicatorCodes;
      const normalized = this.normalizeIndicatorCodes(codes);
      
      // นับ main indicators
      normalized.main.forEach((code: string) => {
        indicatorCounts[code] = (indicatorCounts[code] || 0) + 1;
      });
      
      // นับ sub-indicators
      normalized.sub.forEach((code: string) => {
        indicatorCounts[code] = (indicatorCounts[code] || 0) + 1;
      });
    });

    return {
      total,
      verified,
      unverified: total - verified,
      byType: byType.map((item) => ({
        type: item.evidenceType,
        count: item._count,
      })),
      byIndicator: Object.entries(indicatorCounts).map(([code, count]) => ({
        indicator: code,
        count,
      })),
    };
  }

  /**
   * วิเคราะห์ความเชื่อมโยงระหว่างหลักฐานกับตัวชี้วัด
   */
  async analyzeIndicatorConnection(
    evidenceId: string,
    indicatorCodes: string[] | { main?: string[]; sub?: string[] },
    userId: string,
  ): Promise<any> {
    const evidence = await this.prisma.evidencePortfolio.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${evidenceId} not found`);
    }

    // Normalize indicator codes
    const normalized = this.normalizeIndicatorCodes(indicatorCodes);
    
    // รวม main และ sub เป็น array สำหรับ AI analysis
    const allCodes = [...normalized.main, ...normalized.sub];

    const analysis = await this.evidenceAI.analyzeIndicatorConnection(
      evidence.originalFilename,
      evidence.evidenceType,
      allCodes,
      userId,
    );

    // อัปเดต indicator codes และ AI summary
    await this.prisma.evidencePortfolio.update({
      where: { id: evidenceId },
      data: {
        indicatorCodes: normalized,
        aiSummary: JSON.stringify(analysis),
      },
    });

    return {
      evidenceId,
      analysis,
      updatedIndicators: normalized,
    };
  }

  /**
   * กำหนด evidence type จากผลการวิเคราะห์ของ AI
   */
  private determineEvidenceType(aiAnalysis: any): string {
    // Logic นี้ควรจะมาจาก AI แต่ตอนนี้ใช้ rule-based
    const filename = aiAnalysis.suggestedFilename.toLowerCase();

    if (filename.includes('แผนการสอน') || filename.includes('lesson')) return 'LESSON_PLAN';
    if (filename.includes('สื่อ') || filename.includes('media')) return 'TEACHING_MEDIA';
    if (filename.includes('แบบทดสอบ') || filename.includes('test')) return 'ASSESSMENT';
    if (filename.includes('ผลงาน') || filename.includes('work')) return 'STUDENT_WORK';
    if (filename.includes('ภาพ') || filename.includes('.jpg') || filename.includes('.png'))
      return 'CLASSROOM_PHOTO';
    if (filename.includes('วิจัย') || filename.includes('research')) return 'ACTION_RESEARCH';

    return 'OTHER';
  }
}
