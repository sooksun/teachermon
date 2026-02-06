import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentType, ConsentStatus } from './pdpa.enums';
import { DeleteCategory, DELETE_CATEGORIES } from './dto/delete-my-data.dto';

@Injectable()
export class PDPAService {
  private readonly logger = new Logger(PDPAService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ดึง consent ทั้งหมดของ user
   */
  async getUserConsents(userId: string) {
    const consents = await this.prisma.consent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    // ตรวจสอบ consent ที่หมดอายุ
    const now = new Date();
    for (const consent of consents) {
      if (consent.expiresAt && consent.expiresAt < now && consent.status === 'GRANTED') {
        await this.prisma.consent.update({
          where: { id: consent.id },
          data: { status: 'EXPIRED' },
        });
        consent.status = 'EXPIRED';
      }
    }

    return consents;
  }

  /**
   * ให้ความยินยอม
   */
  async grantConsent(
    userId: string,
    consentType: ConsentType,
    options: {
      privacyPolicyVersion?: string;
      termsVersion?: string;
      ipAddress?: string;
      userAgent?: string;
      expiresInDays?: number;
    } = {},
  ) {
    // ตรวจสอบว่ามี consent อยู่แล้วหรือไม่
    const existing = await this.prisma.consent.findUnique({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
    });

    const expiresAt = options.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const data = {
      userId,
      consentType,
      status: ConsentStatus.GRANTED,
      grantedAt: new Date(),
      revokedAt: null,
      expiresAt,
      privacyPolicyVersion: options.privacyPolicyVersion,
      termsVersion: options.termsVersion,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    };

    if (existing) {
      return this.prisma.consent.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.consent.create({
      data,
    });
  }

  /**
   * ถอนความยินยอม
   */
  async revokeConsent(userId: string, consentType: ConsentType) {
    const consent = await this.prisma.consent.findUnique({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
    });

    if (!consent) {
      throw new NotFoundException('ไม่พบการยินยอมที่ต้องการถอน');
    }

    if (consent.status === 'REVOKED') {
      throw new BadRequestException('การยินยอมนี้ถูกถอนไปแล้ว');
    }

    return this.prisma.consent.update({
      where: { id: consent.id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  /**
   * ตรวจสอบว่า user ให้ความยินยอมแล้วหรือไม่
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const consent = await this.prisma.consent.findUnique({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
    });

    if (!consent) return false;
    if (consent.status !== 'GRANTED') return false;

    // ตรวจสอบว่าหมดอายุหรือไม่
    if (consent.expiresAt && consent.expiresAt < new Date()) {
      await this.prisma.consent.update({
        where: { id: consent.id },
        data: { status: 'EXPIRED' },
      });
      return false;
    }

    return true;
  }

  /**
   * ตรวจสอบ consent ที่หมดอายุและอัพเดตสถานะ
   */
  async checkExpiredConsents() {
    const now = new Date();
    const expired = await this.prisma.consent.updateMany({
      where: {
        status: 'GRANTED',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    this.logger.log(`Updated ${expired.count} expired consents`);
    return expired.count;
  }

  /**
   * ดึง consent summary สำหรับ dashboard
   */
  async getConsentSummary(userId: string) {
    const consents = await this.getUserConsents(userId);

    const summary = {
      total: consents.length,
      granted: consents.filter((c) => c.status === 'GRANTED').length,
      pending: consents.filter((c) => c.status === 'PENDING').length,
      revoked: consents.filter((c) => c.status === 'REVOKED').length,
      expired: consents.filter((c) => c.status === 'EXPIRED').length,
      required: {
        dataCollection: consents.find((c) => c.consentType === 'DATA_COLLECTION')?.status || 'PENDING',
        dataProcessing: consents.find((c) => c.consentType === 'DATA_PROCESSING')?.status || 'PENDING',
        dataSharing: consents.find((c) => c.consentType === 'DATA_SHARING')?.status || 'PENDING',
      },
    };

    return summary;
  }

  // ==================== User Rights API (PDPA มาตรา 30–35) ====================

  /**
   * Right to Access – ขอข้อมูลส่วนตัวของฉัน
   */
  async getMyData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            birthDate: true,
            cohort: true,
            appointmentDate: true,
            position: true,
            major: true,
            email: true,
            phone: true,
            status: true,
            citizenId: true,
            createdAt: true,
            school: {
              select: {
                id: true,
                schoolName: true,
                province: true,
                region: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('ไม่พบข้อมูลผู้ใช้');
    }

    const teacherId = user.teacherId ?? user.teacher?.id;
    const maskCitizenId = (v: string | null) =>
      v ? `${v.slice(0, 1)}***${v.slice(-4)}` : null;

    const personalInfo: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
    if (user.teacher) {
      const { citizenId, ...rest } = user.teacher;
      (personalInfo as any).teacher = {
        ...rest,
        citizenId: maskCitizenId(citizenId),
      };
    }

    let activities: Record<string, unknown[]> = {};

    if (teacherId) {
      const [
        mentoringVisits,
        competencyAssessments,
        selfAssessments,
        reflectiveJournals,
        plcActivities,
        developmentPlans,
        evidencePortfolios,
      ] = await Promise.all([
        this.prisma.mentoringVisit.findMany({ where: { teacherId } }),
        this.prisma.competencyAssessment.findMany({ where: { teacherId } }),
        this.prisma.selfAssessment.findMany({
          where: { teacherId },
          include: { portfolioItems: true },
        }),
        this.prisma.reflectiveJournal.findMany({ where: { teacherId } }),
        this.prisma.pLCActivity.findMany({ where: { teacherId } }),
        this.prisma.developmentPlan.findMany({ where: { teacherId } }),
        this.prisma.evidencePortfolio.findMany({
          where: { teacherId },
          select: {
            id: true,
            itemType: true,
            evidenceType: true,
            originalFilename: true,
            videoTitle: true,
            createdAt: true,
          },
        }),
      ]);

      activities = {
        mentoringVisits,
        competencyAssessments,
        selfAssessments,
        reflectiveJournals,
        plcActivities,
        developmentPlans,
        evidencePortfolios,
      };
    }

    const consents = await this.getUserConsents(userId);
    const aiActivities = await this.prisma.aIActivity.findMany({
      where: { userId },
      select: {
        id: true,
        actionType: true,
        modelUsed: true,
        createdAt: true,
      },
    });

    return {
      personalInfo,
      activities,
      consents: consents.map((c) => ({
        consentType: c.consentType,
        status: c.status,
        grantedAt: c.grantedAt,
        expiresAt: c.expiresAt,
      })),
      aiActivities,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Right to Erasure – ลบหรือทำข้อมูลเป็นนิรนาม
   */
  async deleteMyData(
    userId: string,
    options: {
      deleteAll?: boolean;
      categories?: string[];
      anonymize?: boolean;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });

    if (!user) {
      throw new NotFoundException('ไม่พบข้อมูลผู้ใช้');
    }

    const teacherId = user.teacherId;
    const validCategories = options.categories?.filter((c) =>
      DELETE_CATEGORIES.includes(c as DeleteCategory),
    );

    if (options.anonymize) {
      return this.anonymizeUserData(userId, user, teacherId, validCategories);
    }

    if (options.deleteAll) {
      return this.prisma.$transaction(async (tx) => {
        await tx.aIActivity.deleteMany({ where: { userId } });
        if (teacherId) {
          await tx.user.update({
            where: { id: userId },
            data: { teacherId: null },
          });
          await tx.teacher.delete({ where: { id: teacherId } });
        }
        await tx.user.delete({ where: { id: userId } });
        this.logger.log(`User ${userId} and related data deleted (Right to Erasure)`);
        return {
          success: true,
          message: 'ลบข้อมูลทั้งหมดเรียบร้อยแล้ว',
          deletedAt: new Date().toISOString(),
        };
      });
    }

    if (validCategories && validCategories.length > 0) {
      return this.deleteByCategories(userId, teacherId, validCategories);
    }

    throw new BadRequestException(
      'กรุณาระบุ deleteAll: true หรือ categories หรือ anonymize: true',
    );
  }

  private async anonymizeUserData(
    userId: string,
    user: { id: string; email: string; fullName: string | null; teacherId: string | null; teacher: unknown },
    teacherId: string | null,
    categories?: string[],
  ) {
    const anonymized = `anonymized-${userId.slice(0, 8)}`;
    const deleteTeacher = !categories || categories.includes('personal_info');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `${anonymized}@deleted.local`,
          fullName: 'ผู้ใช้ที่ถอนตัว',
          isActive: false,
        },
      });

      if (teacherId && deleteTeacher) {
        await tx.teacher.update({
          where: { id: teacherId },
          data: {
            fullName: 'ผู้ใช้ที่ถอนตัว',
            email: null,
            phone: null,
            citizenId: `***-****-*****-**-*`,
          },
        });
      }
    });

    this.logger.log(`User ${userId} anonymized (Right to Erasure)`);
    return {
      success: true,
      message: 'ทำข้อมูลเป็นนิรนามเรียบร้อยแล้ว',
      anonymizedAt: new Date().toISOString(),
    };
  }

  private async deleteByCategories(
    userId: string,
    teacherId: string | null,
    categories: string[],
  ) {
    if (!teacherId) {
      await this.prisma.aIActivity.deleteMany({ where: { userId } });
      return {
        success: true,
        message: 'ลบข้อมูลตามหมวดหมู่เรียบร้อยแล้ว',
        deletedCategories: categories,
        deletedAt: new Date().toISOString(),
      };
    }

    const deletes: Promise<unknown>[] = [];

    if (categories.includes('assessments')) {
      deletes.push(
        this.prisma.competencyAssessment.deleteMany({ where: { teacherId } }),
        this.prisma.selfAssessment.deleteMany({ where: { teacherId } }),
      );
    }
    if (categories.includes('journals')) {
      deletes.push(this.prisma.reflectiveJournal.deleteMany({ where: { teacherId } }));
    }
    if (categories.includes('evidence')) {
      deletes.push(this.prisma.evidencePortfolio.deleteMany({ where: { teacherId } }));
    }
    if (categories.includes('mentoring')) {
      deletes.push(this.prisma.mentoringVisit.deleteMany({ where: { teacherId } }));
    }
    if (categories.includes('plc')) {
      deletes.push(this.prisma.pLCActivity.deleteMany({ where: { teacherId } }));
    }
    if (categories.includes('development_plans')) {
      deletes.push(this.prisma.developmentPlan.deleteMany({ where: { teacherId } }));
    }
    if (categories.includes('personal_info')) {
      deletes.push(this.prisma.aIActivity.deleteMany({ where: { userId } }));
    }

    await Promise.all(deletes);

    this.logger.log(`User ${userId} deleted categories: ${categories.join(', ')}`);
    return {
      success: true,
      message: 'ลบข้อมูลตามหมวดหมู่เรียบร้อยแล้ว',
      deletedCategories: categories,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Right to Data Portability – Export ข้อมูลของฉัน
   */
  async exportMyData(userId: string, format: 'json' | 'csv') {
    const data = await this.getMyData(userId);

    if (format === 'json') {
      return {
        format: 'json',
        data,
        exportedAt: data.exportedAt,
      };
    }

    const rows: string[][] = [];
    const flatten = (obj: unknown, prefix = ''): [string, string][] => {
      if (obj == null) return [];
      if (typeof obj !== 'object') return [[prefix, String(obj)]];
      if (obj instanceof Date) return [[prefix, obj.toISOString()]];
      if (Array.isArray(obj)) {
        return [[prefix, JSON.stringify(obj)]];
      }
      const out: [string, string][] = [];
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
          out.push(...flatten(v, key));
        } else {
          out.push([key, v instanceof Date ? v.toISOString() : String(v ?? '')]);
        }
      }
      return out;
    };

    rows.push(['key', 'value']);
    for (const [k, v] of flatten(data)) {
      rows.push([k, v]);
    }

    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return {
      format: 'csv',
      content: csv,
      exportedAt: data.exportedAt,
    };
  }
}
