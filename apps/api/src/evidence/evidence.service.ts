import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvidenceAIService } from '../ai/evidence-ai.service';
import { PDPAScannerService } from '../ai/pdpa-scanner.service';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evidenceAI: EvidenceAIService,
    private readonly pdpaScanner: PDPAScannerService,
  ) {}

  /**
   * อัปโหลดหลักฐานใหม่
   */
  async create(data: {
    teacherId: string;
    originalFilename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
  }) {
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

    // 4. สร้างรายการในฐานข้อมูล
    const evidence = await this.prisma.evidencePortfolio.create({
      data: {
        teacherId: data.teacherId,
        originalFilename: data.originalFilename,
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
  }) {
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
  }) {
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
  async findOne(id: string) {
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
  }) {
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
  async remove(id: string) {
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

    // นับ indicator จาก JSON
    const indicatorCounts: Record<string, number> = {};
    byIndicator.forEach((e: any) => {
      const codes = e.indicatorCodes as string[];
      codes.forEach((code) => {
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
