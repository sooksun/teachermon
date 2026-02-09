import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  INDICATOR_CHECK_CONFIG,
  SLIDE_TEMPLATES,
  getCompletenessStatus,
  getSlidesForRound,
  type CompletenessStatus,
  type EvidenceCheck,
  type IndicatorChecks,
} from '@teachermon/shared';

// =============================================
// Types for Completeness Results
// =============================================

export interface CheckResult {
  id: string;
  label: string;
  weight: number;
  passed: boolean;
  score: number; // 0 or weight
}

export interface IndicatorCompleteness {
  id: string;
  name: string;
  score: number; // 0-100
  status: CompletenessStatus;
  breakdown: Record<string, number>; // checkId -> score
  missing: string[]; // list of missing items
  evidence: {
    sessions: string[];
    files: string[];
    journals: string[];
  };
  checks: CheckResult[];
}

export interface DomainCompleteness {
  id: string;
  name: string;
  score: number;
  status: CompletenessStatus;
  itemCount: number;
  passedCount: number;
}

export interface SlideCompleteness {
  id: string;
  name: string;
  score: number;
  status: CompletenessStatus;
  indicatorIds: string[];
}

export interface DeckCompleteness {
  generatedAt: string;
  teacherId: string;
  teacherName: string;
  assessmentRound: number;
  deck: {
    score: number;
    status: CompletenessStatus;
  };
  domains: Record<string, DomainCompleteness>;
  items: Record<string, IndicatorCompleteness>;
  slides: SlideCompleteness[];
  passCriteria: {
    professional: { required: number; actual: number; passed: boolean };
    social: { required: number; actual: number; passed: boolean } | null;
    personal: { required: number; actual: number; passed: boolean };
    overall: boolean;
  };
}

@Injectable()
export class CompletenessService {
  private readonly logger = new Logger(CompletenessService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * คำนวณ % ความสมบูรณ์ของครูผู้ช่วยรายคน
   */
  async calculateCompleteness(
    teacherId: string,
    assessmentRound: number,
  ): Promise<DeckCompleteness> {
    // 1. ดึงข้อมูลครู
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { school: true },
    });
    if (!teacher) {
      throw new NotFoundException('ไม่พบข้อมูลครูผู้ช่วย');
    }

    // 2. ดึงหลักฐานทั้งหมดของครู
    const evidence = await this.gatherEvidence(teacherId);

    // 3. คำนวณ completeness ต่อตัวชี้วัด
    const itemResults: Record<string, IndicatorCompleteness> = {};

    for (const domain of INDICATOR_CHECK_CONFIG.domains) {
      for (const indicator of domain.items) {
        // ตรวจสอบว่าตัวชี้วัดนี้ใช้ในครั้งนี้หรือไม่
        if (!this.isIndicatorInRound(indicator.id, assessmentRound)) {
          continue;
        }

        const result = this.evaluateIndicator(indicator, evidence);
        itemResults[indicator.id] = result;
      }
    }

    // 4. คำนวณ domain scores
    const domainResults: Record<string, DomainCompleteness> = {};
    for (const domain of INDICATOR_CHECK_CONFIG.domains) {
      const domainItems = domain.items
        .filter((item) => this.isIndicatorInRound(item.id, assessmentRound))
        .map((item) => itemResults[item.id])
        .filter(Boolean);

      if (domainItems.length === 0) continue;

      const avgScore =
        domainItems.reduce((sum, item) => sum + item.score, 0) / domainItems.length;
      const passedCount = domainItems.filter((item) => item.score >= 60).length;

      domainResults[domain.id] = {
        id: domain.id,
        name: domain.name,
        score: Math.round(avgScore),
        status: getCompletenessStatus(avgScore),
        itemCount: domainItems.length,
        passedCount,
      };
    }

    // 5. คำนวณ slide scores
    const roundSlides = getSlidesForRound(assessmentRound);
    const slideResults: SlideCompleteness[] = roundSlides.map((slide) => {
      if (slide.indicatorIds.length === 0) {
        // Cover/Summary slides ใช้ deck score
        return {
          id: slide.id,
          name: slide.name,
          score: 0, // จะอัปเดตทีหลัง
          status: 'INSUFFICIENT' as CompletenessStatus,
          indicatorIds: slide.indicatorIds,
        };
      }

      const slideItems = slide.indicatorIds
        .map((id) => itemResults[id])
        .filter(Boolean);

      const avgScore =
        slideItems.length > 0
          ? slideItems.reduce((sum, item) => sum + item.score, 0) / slideItems.length
          : 0;

      return {
        id: slide.id,
        name: slide.name,
        score: Math.round(avgScore),
        status: getCompletenessStatus(avgScore),
        indicatorIds: slide.indicatorIds,
      };
    });

    // 6. คำนวณ deck score
    const scoredSlides = slideResults.filter((s) => s.indicatorIds.length > 0);
    const deckScore =
      scoredSlides.length > 0
        ? Math.round(
            scoredSlides.reduce((sum, s) => sum + s.score, 0) / scoredSlides.length,
          )
        : 0;

    // อัปเดต cover/summary slides
    for (const slide of slideResults) {
      if (slide.indicatorIds.length === 0) {
        slide.score = deckScore;
        slide.status = getCompletenessStatus(deckScore);
      }
    }

    // 7. คำนวณเกณฑ์ผ่าน
    const passCriteria = this.evaluatePassCriteria(
      assessmentRound,
      itemResults,
    );

    return {
      generatedAt: new Date().toISOString(),
      teacherId,
      teacherName: teacher.fullName,
      assessmentRound,
      deck: {
        score: deckScore,
        status: getCompletenessStatus(deckScore),
      },
      domains: domainResults,
      items: itemResults,
      slides: slideResults,
      passCriteria,
    };
  }

  /**
   * ประเมินตัวชี้วัดแต่ละตัว
   */
  private evaluateIndicator(
    indicator: IndicatorChecks,
    evidence: TeacherEvidence,
  ): IndicatorCompleteness {
    const checkResults: CheckResult[] = [];
    const breakdown: Record<string, number> = {};
    const missing: string[] = [];
    const linkedSessions: string[] = [];
    const linkedFiles: string[] = [];
    const linkedJournals: string[] = [];

    for (const check of indicator.checks) {
      const passed = this.evaluateCheck(check, indicator.id, evidence);
      const score = passed ? check.weight : 0;

      checkResults.push({
        id: check.id,
        label: check.label,
        weight: check.weight,
        passed,
        score,
      });

      breakdown[check.id] = score;

      if (!passed) {
        missing.push(check.label);
      }

      // ดึงหลักฐานที่เชื่อมกับ check
      if (passed) {
        const linked = this.getLinkedEvidence(check, indicator.id, evidence);
        linkedSessions.push(...linked.sessions);
        linkedFiles.push(...linked.files);
        linkedJournals.push(...linked.journals);
      }
    }

    const totalScore = checkResults.reduce((sum, r) => sum + r.score, 0);

    return {
      id: indicator.id,
      name: indicator.name,
      score: Math.round(totalScore),
      status: getCompletenessStatus(totalScore),
      breakdown,
      missing,
      evidence: {
        sessions: [...new Set(linkedSessions)],
        files: [...new Set(linkedFiles)],
        journals: [...new Set(linkedJournals)],
      },
      checks: checkResults,
    };
  }

  /**
   * ตรวจสอบ check แต่ละข้อ (กลไกตรวจจับอัตโนมัติ + manual)
   */
  private evaluateCheck(
    check: EvidenceCheck,
    indicatorId: string,
    evidence: TeacherEvidence,
  ): boolean {
    // Auto-detect based on available evidence
    if (check.autoDetectable) {
      return this.autoDetectCheck(check, indicatorId, evidence);
    }

    // Manual checks: ดูจาก uploaded evidence ที่ tag ตัวชี้วัดนี้
    return this.hasManualEvidence(check, indicatorId, evidence);
  }

  /**
   * ตรวจจับอัตโนมัติ
   */
  private autoDetectCheck(
    check: EvidenceCheck,
    indicatorId: string,
    evidence: TeacherEvidence,
  ): boolean {
    switch (check.id) {
      // PRO_1.3 - Active Learning
      case 'HAS_SESSION':
        return evidence.analysisJobs.some((j) => j.status === 'DONE');
      case 'HAS_TRANSCRIPT':
        return evidence.analysisJobs.some((j) => j.hasTranscript);
      case 'AL_SIGNALS':
        // ตรวจจาก AI analysis report
        return evidence.analysisJobs.some(
          (j) => j.analysisReport && j.status === 'DONE',
        );
      case 'REFLECTION_NOTE':
        return evidence.journals.length > 0;
      case 'POST_TEACHING_NOTE':
        return evidence.journals.length > 0;

      // SOC_1 - Mentor
      case 'MENTOR_LEARNING':
        return evidence.mentoringVisits.length > 0;
      case 'OBSERVATION_REPORT':
        return evidence.mentoringVisits.some(
          (v) => v.observationNotes || v.feedbackSummary,
        );
      case 'MENTOR_APPLY':
        return evidence.journals.some(
          (j) =>
            j.content &&
            (j.content.includes('นิเทศ') ||
              j.content.includes('ครูพี่เลี้ยง') ||
              j.content.includes('Mentor')),
        );

      // SOC_2 - PLC
      case 'PLC_EVIDENCE':
        return evidence.plcActivities.length > 0;
      case 'RESULT_NOTE':
        return evidence.journals.some(
          (j) => j.content && j.content.includes('PLC'),
        );

      // PRO_1.2 - Design
      case 'EVIDENCE_LINKED_SESSION':
        return evidence.analysisJobs.length > 0 || evidence.portfolios.length > 0;

      default:
        return false;
    }
  }

  /**
   * ตรวจหลักฐาน manual (จาก portfolio/evidence)
   */
  private hasManualEvidence(
    check: EvidenceCheck,
    indicatorId: string,
    evidence: TeacherEvidence,
  ): boolean {
    // ตรวจจาก portfolio items ที่ tag ตัวชี้วัดนี้
    const matchedPortfolios = evidence.portfolios.filter((p) => {
      const codes = p.indicatorCodes || [];
      return Array.isArray(codes) && codes.some((c: string) =>
        c === indicatorId || c.startsWith(indicatorId),
      );
    });

    if (matchedPortfolios.length > 0) return true;

    // ตรวจจาก assessment details
    const assessment = evidence.indicatorAssessments.find(
      (a) => {
        if (!a.assessmentDetails) return false;
        const details = a.assessmentDetails as any[];
        return Array.isArray(details) && details.some(
          (d: any) => d.code === indicatorId && d.passed,
        );
      },
    );

    if (assessment) return true;

    // ตรวจจาก checklist (สำหรับ PER_ items)
    if (check.evidenceTypes.includes('checklist')) {
      const hasChecklist = evidence.indicatorAssessments.some((a) => {
        if (!a.assessmentDetails) return false;
        const details = a.assessmentDetails as any[];
        return Array.isArray(details) && details.some(
          (d: any) => d.code === indicatorId && d.checkId === check.id && d.passed,
        );
      });
      if (hasChecklist) return true;
    }

    return false;
  }

  /**
   * ดึงหลักฐานที่เชื่อมกับ check
   */
  private getLinkedEvidence(
    check: EvidenceCheck,
    indicatorId: string,
    evidence: TeacherEvidence,
  ): { sessions: string[]; files: string[]; journals: string[] } {
    const sessions: string[] = [];
    const files: string[] = [];
    const journals: string[] = [];

    // Sessions (from analysis jobs)
    if (check.evidenceTypes.some((t) => ['video', 'audio', 'transcript'].includes(t))) {
      evidence.analysisJobs
        .filter((j) => j.status === 'DONE')
        .forEach((j) => sessions.push(j.id));
    }

    // Files (from portfolios)
    evidence.portfolios
      .filter((p) => {
        const codes = p.indicatorCodes || [];
        return Array.isArray(codes) && codes.some((c: string) => c === indicatorId);
      })
      .forEach((p) => files.push(p.id));

    // Journals
    evidence.journals.forEach((j) => journals.push(j.id));

    return { sessions, files, journals };
  }

  /**
   * ตรวจว่าตัวชี้วัดใช้ในครั้งที่เท่าไหร่
   */
  private isIndicatorInRound(indicatorId: string, round: number): boolean {
    // SOC ใช้ครั้งที่ 3-4
    if (indicatorId.startsWith('SOC')) return round >= 3;
    // PER_2 ใช้ครั้งที่ 3-4
    if (indicatorId.startsWith('PER_2')) return round >= 3;
    // อื่นๆ ใช้ทุกครั้ง
    return true;
  }

  /**
   * ประเมินเกณฑ์ผ่าน
   */
  private evaluatePassCriteria(
    round: number,
    items: Record<string, IndicatorCompleteness>,
  ): DeckCompleteness['passCriteria'] {
    // นับจำนวนข้อที่ผ่าน (score >= 60%) ต่อด้าน
    const proItems = Object.entries(items)
      .filter(([id]) => id.startsWith('PRO_'))
      .map(([, v]) => v);
    const socItems = Object.entries(items)
      .filter(([id]) => id.startsWith('SOC_'))
      .map(([, v]) => v);
    const perItems = Object.entries(items)
      .filter(([id]) => id.startsWith('PER_'))
      .map(([, v]) => v);

    const proPassed = proItems.filter((i) => i.score >= 60).length;
    const socPassed = socItems.filter((i) => i.score >= 60).length;
    const perPassed = perItems.filter((i) => i.score >= 60).length;

    if (round <= 2) {
      const proRequired = 9;
      const perRequired = 7;
      return {
        professional: {
          required: proRequired,
          actual: proPassed,
          passed: proPassed >= proRequired,
        },
        social: null,
        personal: {
          required: perRequired,
          actual: perPassed,
          passed: perPassed >= perRequired,
        },
        overall: proPassed >= proRequired && perPassed >= perRequired,
      };
    }

    // ครั้งที่ 3-4
    const proRequired = 11;
    const socRequired = 3;
    const perRequired = 11;

    const socialResult = {
      required: socRequired,
      actual: socPassed,
      passed: socPassed >= socRequired,
    };

    return {
      professional: {
        required: proRequired,
        actual: proPassed,
        passed: proPassed >= proRequired,
      },
      social: socialResult,
      personal: {
        required: perRequired,
        actual: perPassed,
        passed: perPassed >= perRequired,
      },
      overall:
        proPassed >= proRequired &&
        socPassed >= socRequired &&
        perPassed >= perRequired,
    };
  }

  /**
   * รวบรวมหลักฐานทั้งหมดของครู
   */
  private async gatherEvidence(teacherId: string): Promise<TeacherEvidence> {
    const [
      analysisJobs,
      journals,
      portfolios,
      mentoringVisits,
      plcActivities,
      indicatorAssessments,
    ] = await Promise.all([
      // Video Analysis Jobs
      this.prisma.analysisJob.findMany({
        where: { teacherId },
        select: {
          id: true,
          status: true,
          hasTranscript: true,
          hasReport: true,
          analysisReport: true,
          originalFilename: true,
          mimeType: true,
        },
      }),
      // Reflective Journals
      this.prisma.reflectiveJournal.findMany({
        where: { teacherId },
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      }),
      // Evidence Portfolios
      this.prisma.evidencePortfolio.findMany({
        where: { teacherId },
        select: {
          id: true,
          title: true,
          indicatorCodes: true,
          evidenceType: true,
          fileUrl: true,
        },
      }),
      // Mentoring Visits
      this.prisma.mentoringVisit.findMany({
        where: { teacherId },
        select: {
          id: true,
          observationNotes: true,
          feedbackSummary: true,
          visitDate: true,
        },
      }),
      // PLC Activities
      this.prisma.plcActivity.findMany({
        where: { teacherId },
        select: {
          id: true,
          activityDate: true,
          topic: true,
        },
      }),
      // Indicator Assessments
      this.prisma.indicatorAssessment.findMany({
        where: { teacherId },
        select: {
          id: true,
          assessmentRound: true,
          assessmentDetails: true,
        },
      }).catch(() => []), // ถ้ายังไม่มี table ให้คืน array ว่าง
    ]);

    return {
      analysisJobs: analysisJobs as any[],
      journals: journals as any[],
      portfolios: portfolios as any[],
      mentoringVisits: mentoringVisits as any[],
      plcActivities: plcActivities as any[],
      indicatorAssessments: indicatorAssessments as any[],
    };
  }
}

// =============================================
// Internal types
// =============================================

interface TeacherEvidence {
  analysisJobs: any[];
  journals: any[];
  portfolios: any[];
  mentoringVisits: any[];
  plcActivities: any[];
  indicatorAssessments: any[];
}
