import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Data Retention Service
 * ตาม PDPA มาตรา 28 - การเก็บรักษาข้อมูล
 * 
 * Retention Periods:
 * - ข้อมูลครู: 7 ปี
 * - ข้อมูลการประเมิน: 7 ปี
 * - ข้อมูล Journal และ Evidence: 5 ปี
 * - ข้อมูล Audit Log: 3 ปี
 * - ข้อมูล AI Activity: 1 ปี (หลังจาก review แล้ว)
 */
@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  // Retention Periods (in days)
  private readonly RETENTION_PERIODS = {
    TEACHER_DATA: 7 * 365, // 7 years
    ASSESSMENT: 7 * 365, // 7 years
    JOURNAL: 5 * 365, // 5 years
    EVIDENCE: 5 * 365, // 5 years
    AUDIT_LOG: 3 * 365, // 3 years
    AI_ACTIVITY: 1 * 365, // 1 year (after reviewed)
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * รันทุกวันเวลา 02:00 น. เพื่อลบข้อมูลที่หมดอายุ
   * Cron: 0 2 * * * (ทุกวันเวลา 02:00 น.)
   */
  @Cron('0 2 * * *')
  async cleanupExpiredData() {
    this.logger.log('Starting data retention cleanup...');
    
    try {
      const results = {
        journals: 0,
        evidence: 0,
        auditLogs: 0,
        aiActivities: 0,
        assessments: 0,
      };

      // 1. ลบ Journals ที่เก่ากว่า 5 ปี
      const journalCutoff = new Date();
      journalCutoff.setDate(journalCutoff.getDate() - this.RETENTION_PERIODS.JOURNAL);
      const deletedJournals = await this.prisma.reflectiveJournal.deleteMany({
        where: {
          createdAt: { lt: journalCutoff },
        },
      });
      results.journals = deletedJournals.count;
      this.logger.log(`Deleted ${results.journals} old journals`);

      // 2. ลบ Evidence ที่เก่ากว่า 5 ปี
      const evidenceCutoff = new Date();
      evidenceCutoff.setDate(evidenceCutoff.getDate() - this.RETENTION_PERIODS.EVIDENCE);
      const deletedEvidence = await this.prisma.evidencePortfolio.deleteMany({
        where: {
          createdAt: { lt: evidenceCutoff },
        },
      });
      results.evidence = deletedEvidence.count;
      this.logger.log(`Deleted ${results.evidence} old evidence`);

      // 3. ลบ PDPA Audit Logs ที่เก่ากว่า 3 ปี
      const auditCutoff = new Date();
      auditCutoff.setDate(auditCutoff.getDate() - this.RETENTION_PERIODS.AUDIT_LOG);
      const deletedAudits = await this.prisma.pDPAAudit.deleteMany({
        where: {
          createdAt: { lt: auditCutoff },
        },
      });
      results.auditLogs = deletedAudits.count;
      this.logger.log(`Deleted ${results.auditLogs} old audit logs`);

      // 4. ลบ AI Activities ที่เก่ากว่า 1 ปี (หลังจาก review แล้ว)
      const aiCutoff = new Date();
      aiCutoff.setDate(aiCutoff.getDate() - this.RETENTION_PERIODS.AI_ACTIVITY);
      const deletedAI = await this.prisma.aIActivity.deleteMany({
        where: {
          createdAt: { lt: aiCutoff },
          isReviewed: true,
        },
      });
      results.aiActivities = deletedAI.count;
      this.logger.log(`Deleted ${results.aiActivities} old AI activities`);

      // 5. ลบ Assessments ที่เก่ากว่า 7 ปี
      const assessmentCutoff = new Date();
      assessmentCutoff.setDate(assessmentCutoff.getDate() - this.RETENTION_PERIODS.ASSESSMENT);
      const deletedAssessments = await this.prisma.competencyAssessment.deleteMany({
        where: {
          createdAt: { lt: assessmentCutoff },
        },
      });
      results.assessments = deletedAssessments.count;
      this.logger.log(`Deleted ${results.assessments} old assessments`);

      const total = Object.values(results).reduce((a, b) => a + b, 0);
      this.logger.log(`Data retention cleanup completed. Total deleted: ${total}`);
      
      return {
        success: true,
        deleted: results,
        total,
        cleanupDate: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error during data retention cleanup', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบข้อมูลที่ใกล้หมดอายุ (30 วันก่อนหมดอายุ)
   */
  async checkExpiringData() {
    const warnings = {
      journals: 0,
      evidence: 0,
      auditLogs: 0,
      aiActivities: 0,
      assessments: 0,
    };

    const warningDays = 30; // แจ้งเตือน 30 วันก่อนหมดอายุ

    // Journals (5 years)
    const journalWarningDate = new Date();
    journalWarningDate.setDate(
      journalWarningDate.getDate() - (this.RETENTION_PERIODS.JOURNAL - warningDays)
    );
    const expiringJournals = await this.prisma.reflectiveJournal.count({
      where: {
        createdAt: { lt: journalWarningDate },
      },
    });
    warnings.journals = expiringJournals;

    // Evidence (5 years)
    const evidenceWarningDate = new Date();
    evidenceWarningDate.setDate(
      evidenceWarningDate.getDate() - (this.RETENTION_PERIODS.EVIDENCE - warningDays)
    );
    const expiringEvidence = await this.prisma.evidencePortfolio.count({
      where: {
        createdAt: { lt: evidenceWarningDate },
      },
    });
    warnings.evidence = expiringEvidence;

    // Audit Logs (3 years)
    const auditWarningDate = new Date();
    auditWarningDate.setDate(
      auditWarningDate.getDate() - (this.RETENTION_PERIODS.AUDIT_LOG - warningDays)
    );
    const expiringAudits = await this.prisma.pDPAAudit.count({
      where: {
        createdAt: { lt: auditWarningDate },
      },
    });
    warnings.auditLogs = expiringAudits;

    // AI Activities (1 year)
    const aiWarningDate = new Date();
    aiWarningDate.setDate(
      aiWarningDate.getDate() - (this.RETENTION_PERIODS.AI_ACTIVITY - warningDays)
    );
    const expiringAI = await this.prisma.aIActivity.count({
      where: {
        createdAt: { lt: aiWarningDate },
        isReviewed: true,
      },
    });
    warnings.aiActivities = expiringAI;

    // Assessments (7 years)
    const assessmentWarningDate = new Date();
    assessmentWarningDate.setDate(
      assessmentWarningDate.getDate() - (this.RETENTION_PERIODS.ASSESSMENT - warningDays)
    );
    const expiringAssessments = await this.prisma.competencyAssessment.count({
      where: {
        createdAt: { lt: assessmentWarningDate },
      },
    });
    warnings.assessments = expiringAssessments;

    return warnings;
  }

  /**
   * ดึงสถิติข้อมูลที่เก็บไว้
   */
  async getRetentionStats() {
    const now = new Date();

    const stats = {
      journals: {
        total: await this.prisma.reflectiveJournal.count(),
        expiring: await this.prisma.reflectiveJournal.count({
          where: {
            createdAt: {
              lt: new Date(now.getTime() - (this.RETENTION_PERIODS.JOURNAL - 30) * 24 * 60 * 60 * 1000),
            },
          },
        }),
        retentionDays: this.RETENTION_PERIODS.JOURNAL,
      },
      evidence: {
        total: await this.prisma.evidencePortfolio.count(),
        expiring: await this.prisma.evidencePortfolio.count({
          where: {
            createdAt: {
              lt: new Date(now.getTime() - (this.RETENTION_PERIODS.EVIDENCE - 30) * 24 * 60 * 60 * 1000),
            },
          },
        }),
        retentionDays: this.RETENTION_PERIODS.EVIDENCE,
      },
      auditLogs: {
        total: await this.prisma.pDPAAudit.count(),
        expiring: await this.prisma.pDPAAudit.count({
          where: {
            createdAt: {
              lt: new Date(now.getTime() - (this.RETENTION_PERIODS.AUDIT_LOG - 30) * 24 * 60 * 60 * 1000),
            },
          },
        }),
        retentionDays: this.RETENTION_PERIODS.AUDIT_LOG,
      },
      aiActivities: {
        total: await this.prisma.aIActivity.count(),
        expiring: await this.prisma.aIActivity.count({
          where: {
            createdAt: {
              lt: new Date(now.getTime() - (this.RETENTION_PERIODS.AI_ACTIVITY - 30) * 24 * 60 * 60 * 1000),
            },
            isReviewed: true,
          },
        }),
        retentionDays: this.RETENTION_PERIODS.AI_ACTIVITY,
      },
      assessments: {
        total: await this.prisma.competencyAssessment.count(),
        expiring: await this.prisma.competencyAssessment.count({
          where: {
            createdAt: {
              lt: new Date(now.getTime() - (this.RETENTION_PERIODS.ASSESSMENT - 30) * 24 * 60 * 60 * 1000),
            },
          },
        }),
        retentionDays: this.RETENTION_PERIODS.ASSESSMENT,
      },
    };

    return stats;
  }

  /**
   * รัน cleanup แบบ manual (สำหรับ Admin)
   */
  async manualCleanup(options?: { dryRun?: boolean }) {
    if (options?.dryRun) {
      const expiring = await this.checkExpiringData();
      return {
        dryRun: true,
        wouldDelete: expiring,
        message: 'This is a dry run. No data was deleted.',
      };
    }

    return this.cleanupExpiredData();
  }
}
