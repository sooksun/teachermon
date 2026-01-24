import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIActivityLog } from './interfaces/ai.interfaces';

/**
 * AI Activity Service
 * บันทึก Audit Trail ของการใช้งาน AI ทุกครั้ง
 * 
 * หมายเหตุสำคัญ:
 * - บันทึกทุกการเรียกใช้ AI เพื่อตรวจสอบย้อนหลัง
 * - เก็บ input/output สำหรับ review
 * - ต้องมีคนตรวจสอบและอนุมัติก่อนใช้จริง (สำหรับเอกสารสำคัญ)
 */
@Injectable()
export class AIActivityService {
  private readonly logger = new Logger(AIActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * บันทึกการใช้งาน AI
   */
  async logActivity(log: AIActivityLog): Promise<string> {
    try {
      const activity = await this.prisma.aIActivity.create({
        data: {
          userId: log.userId,
          actionType: log.actionType as any,
          inputData: JSON.stringify(log.inputData),
          outputData: JSON.stringify(log.outputData),
          modelUsed: log.modelUsed,
          tokensUsed: log.tokensUsed,
          confidenceScore: log.confidenceScore,
          relatedEntityType: log.relatedEntityType,
          relatedEntityId: log.relatedEntityId,
        },
      });

      this.logger.log(
        `AI Activity logged: ${log.actionType} by ${log.userId} using ${log.modelUsed}`,
      );

      return activity.id;
    } catch (error) {
      this.logger.error('Failed to log AI activity', error);
      throw error;
    }
  }

  /**
   * ดึงประวัติการใช้งาน AI ของผู้ใช้
   */
  async getUserActivities(userId: string, limit = 50) {
    return this.prisma.aIActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * ดึง activities ที่เกี่ยวข้องกับ entity เฉพาะ
   */
  async getEntityActivities(entityType: string, entityId: string) {
    return this.prisma.aIActivity.findMany({
      where: {
        relatedEntityType: entityType,
        relatedEntityId: entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ดึง activities ที่รอการ review
   */
  async getPendingReviews(limit = 100) {
    return this.prisma.aIActivity.findMany({
      where: {
        isReviewed: false,
        actionType: {
          in: ['ASSESSMENT_DRAFT', 'MENTORING_SUMMARY'], // activities ที่ต้อง review
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Review และอนุมัติ/ปฏิเสธ AI output
   */
  async reviewActivity(
    activityId: string,
    reviewerId: string,
    approved: boolean,
    notes?: string,
  ) {
    return this.prisma.aIActivity.update({
      where: { id: activityId },
      data: {
        isReviewed: true,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        isApproved: approved,
        reviewNotes: notes,
      },
    });
  }

  /**
   * สถิติการใช้งาน AI
   */
  async getUsageStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, byActionType, avgConfidence, totalTokens] = await Promise.all([
      // จำนวนรวม
      this.prisma.aIActivity.count({ where }),

      // แยกตามประเภท
      this.prisma.aIActivity.groupBy({
        by: ['actionType'],
        where,
        _count: true,
      }),

      // ค่าเฉลี่ย confidence
      this.prisma.aIActivity.aggregate({
        where: { ...where, confidenceScore: { not: null } },
        _avg: { confidenceScore: true },
      }),

      // Total tokens used
      this.prisma.aIActivity.aggregate({
        where: { ...where, tokensUsed: { not: null } },
        _sum: { tokensUsed: true },
      }),
    ]);

    return {
      total,
      byActionType: byActionType.map((item) => ({
        actionType: item.actionType,
        count: item._count,
      })),
      avgConfidence: avgConfidence._avg.confidenceScore,
      totalTokens: totalTokens._sum.tokensUsed,
    };
  }

  /**
   * ลบ activities เก่า (GDPR compliance - ลบหลังจากเวลาที่กำหนด)
   */
  async cleanupOldActivities(olderThanDays = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deleted = await this.prisma.aIActivity.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isReviewed: true, // ลบเฉพาะที่ review แล้ว
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} old AI activities`);
    return deleted.count;
  }
}
