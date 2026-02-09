import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompletenessService, DeckCompleteness, TeacherEvidence } from './completeness.service';
import { DeckGeneratorService } from './deck-generator.service';
import { INDICATOR_CHECK_CONFIG } from '@teachermon/shared';

// =============================================
// Types
// =============================================

export interface EvidenceItem {
  id: string;
  type: 'file' | 'video_link' | 'ai_analysis';
  title: string;
  description?: string;
  url?: string;
  mimeType?: string;
  fileSize?: number;
  // AI analysis specific
  transcriptSummary?: string;
  analysisMode?: string;
  aiAdvice?: string;
  evaluationResult?: any;
  analysisReport?: any;
  doneAt?: string;
  createdAt: string;
}

export interface IndicatorEvidence {
  indicatorId: string;
  indicatorName: string;
  score: number;
  status: string;
  files: EvidenceItem[];
  videoLinks: EvidenceItem[];
  aiAnalyses: EvidenceItem[];
  totalCount: number;
}

export interface DomainSummary {
  domainId: string;
  domainName: string;
  score: number;
  status: string;
  indicatorCount: number;
  passedCount: number;
  totalEvidence: number;
  highlights: string[]; // key AI insights
  indicators: IndicatorEvidence[];
}

export interface DevelopmentSummaryData {
  teacherId: string;
  teacherName: string;
  assessmentRound: number;
  academicYear: string;
  generatedAt: string;

  // Scores
  overallScore: number;
  overallStatus: string;
  overallPassed: boolean;

  // Evidence counts
  totalEvidence: number;
  totalAnalysisJobs: number;
  totalVideoLinks: number;
  totalFiles: number;

  // Domain summaries
  domains: Record<string, DomainSummary>;

  // AI Insights (aggregated from all analysis jobs)
  aiInsights: {
    teachingStrengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    activeLearningSignals: string[];
  };

  // Narrative
  summaryNarrative: string;

  // Raw completeness data
  completeness: DeckCompleteness;
}

@Injectable()
export class DevelopmentSummaryService {
  private readonly logger = new Logger(DevelopmentSummaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly completenessService: CompletenessService,
    private readonly deckGeneratorService: DeckGeneratorService,
  ) {}

  /**
   * สร้างสรุปผลการพัฒนาอย่างเข้ม
   */
  async generateSummary(
    teacherId: string,
    assessmentRound: number,
    academicYear: string = '2568',
  ): Promise<DevelopmentSummaryData> {
    // 1. ดึงข้อมูลครู
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { school: true },
    });
    if (!teacher) {
      throw new NotFoundException('ไม่พบข้อมูลครูผู้ช่วย');
    }

    // 2. คำนวณ completeness
    const completeness = await this.completenessService.calculateCompleteness(
      teacherId,
      assessmentRound,
    );

    // 3. ดึงหลักฐานเต็ม (rich data)
    const evidence = await this.completenessService.gatherEvidence(teacherId);

    // 4. จัดกลุ่มหลักฐานตามตัวชี้วัด
    const evidenceByIndicator = this.mapEvidenceToIndicators(evidence, completeness);

    // 5. สร้าง domain summaries
    const domains = this.buildDomainSummaries(completeness, evidenceByIndicator);

    // 6. รวบรวม AI insights
    const aiInsights = this.aggregateAiInsights(evidence);

    // 7. สร้าง narrative
    const summaryNarrative = this.buildNarrative(
      teacher,
      completeness,
      domains,
      aiInsights,
      assessmentRound,
      academicYear,
    );

    // 8. สร้างและ/อัปเดต deck
    const { deckPath } = await this.deckGeneratorService.generateDeck(
      teacherId,
      assessmentRound,
      academicYear,
    );

    // สร้าง enhanced deck markdown
    const deckMarkdown = this.buildEnhancedDeckMarkdown(
      teacher,
      completeness,
      domains,
      aiInsights,
      evidence,
      assessmentRound,
      academicYear,
    );

    // 9. Evidence counts
    const totalFiles = evidence.portfolios.filter(
      (p: any) => p.itemType === 'FILE',
    ).length;
    const totalVideoLinks = evidence.portfolios.filter(
      (p: any) => p.itemType === 'VIDEO_LINK',
    ).length;
    const totalAnalysisJobs = evidence.analysisJobs.filter(
      (j: any) => j.status === 'DONE',
    ).length;

    const summaryData: DevelopmentSummaryData = {
      teacherId,
      teacherName: teacher.fullName,
      assessmentRound,
      academicYear,
      generatedAt: new Date().toISOString(),
      overallScore: completeness.deck.score,
      overallStatus: completeness.deck.status,
      overallPassed: completeness.passCriteria.overall,
      totalEvidence: totalFiles + totalVideoLinks + totalAnalysisJobs,
      totalAnalysisJobs,
      totalVideoLinks,
      totalFiles,
      domains,
      aiInsights,
      summaryNarrative,
      completeness,
    };

    // 10. บันทึกลงฐานข้อมูล (upsert)
    await this.prisma.developmentSummary.upsert({
      where: {
        teacherId_assessmentRound_academicYear: {
          teacherId,
          assessmentRound,
          academicYear,
        },
      },
      create: {
        teacherId,
        assessmentRound,
        academicYear,
        totalEvidence: summaryData.totalEvidence,
        totalAnalysisJobs,
        totalVideoLinks,
        totalFiles,
        overallScore: summaryData.overallScore,
        professionalScore: completeness.domains.PROFESSIONAL?.score || 0,
        socialScore: completeness.domains.SOCIAL?.score ?? null,
        personalScore: completeness.domains.PERSONAL?.score || 0,
        overallPassed: summaryData.overallPassed,
        evidenceByIndicator: evidenceByIndicator as any,
        aiInsights: aiInsights as any,
        domainSummaries: domains as any,
        summaryNarrative,
        deckPath,
        deckMarkdown,
        status: 'GENERATED',
        generatedAt: new Date(),
      },
      update: {
        totalEvidence: summaryData.totalEvidence,
        totalAnalysisJobs,
        totalVideoLinks,
        totalFiles,
        overallScore: summaryData.overallScore,
        professionalScore: completeness.domains.PROFESSIONAL?.score || 0,
        socialScore: completeness.domains.SOCIAL?.score ?? null,
        personalScore: completeness.domains.PERSONAL?.score || 0,
        overallPassed: summaryData.overallPassed,
        evidenceByIndicator: evidenceByIndicator as any,
        aiInsights: aiInsights as any,
        domainSummaries: domains as any,
        summaryNarrative,
        deckPath,
        deckMarkdown,
        status: 'GENERATED',
        generatedAt: new Date(),
      },
    });

    this.logger.log(
      `Development summary generated for teacher ${teacherId}, round ${assessmentRound}`,
    );

    return summaryData;
  }

  /**
   * ดึงสรุปจากฐานข้อมูล (ไม่สร้างใหม่)
   */
  async getSummary(
    teacherId: string,
    assessmentRound: number,
    academicYear: string = '2568',
  ) {
    return this.prisma.developmentSummary.findUnique({
      where: {
        teacherId_assessmentRound_academicYear: {
          teacherId,
          assessmentRound,
          academicYear,
        },
      },
    });
  }

  /**
   * ดึงสรุปทั้งหมดของครู
   */
  async getAllSummaries(teacherId: string) {
    return this.prisma.developmentSummary.findMany({
      where: { teacherId },
      orderBy: [{ assessmentRound: 'desc' }, { academicYear: 'desc' }],
    });
  }

  // =============================================
  // Private helpers
  // =============================================

  /**
   * จัดกลุ่มหลักฐานตามตัวชี้วัด
   */
  private mapEvidenceToIndicators(
    evidence: TeacherEvidence,
    completeness: DeckCompleteness,
  ): Record<string, IndicatorEvidence> {
    const result: Record<string, IndicatorEvidence> = {};

    for (const [indicatorId, item] of Object.entries(completeness.items)) {
      const files: EvidenceItem[] = [];
      const videoLinks: EvidenceItem[] = [];
      const aiAnalyses: EvidenceItem[] = [];

      // 1. จับคู่ portfolios ที่ tag ตัวชี้วัดนี้
      for (const p of evidence.portfolios) {
        const codes = p.indicatorCodes || [];
        const matched =
          Array.isArray(codes) &&
          codes.some(
            (c: string) => c === indicatorId || c.startsWith(indicatorId),
          );

        if (!matched) continue;

        if (p.itemType === 'FILE') {
          files.push({
            id: p.id,
            type: 'file',
            title: p.originalFilename || p.standardFilename || 'ไฟล์',
            description: p.aiSummary || undefined,
            url: p.fileUrl || undefined,
            mimeType: p.mimeType || undefined,
            fileSize: p.fileSize || undefined,
            createdAt: p.createdAt?.toISOString?.() || new Date().toISOString(),
          });
        } else if (p.itemType === 'VIDEO_LINK') {
          videoLinks.push({
            id: p.id,
            type: 'video_link',
            title: p.videoTitle || 'วิดีโอ',
            description: p.videoDescription || p.aiSummary || undefined,
            url: p.videoUrl || undefined,
            createdAt: p.createdAt?.toISOString?.() || new Date().toISOString(),
          });
        }
      }

      // 2. จับคู่ AI analysis jobs (ทุก job ที่สำเร็จ ถือเป็นหลักฐานสำหรับ PRO_1.3 และตัวชี้วัดที่เกี่ยวกับการสอน)
      if (this.isAnalysisRelevant(indicatorId)) {
        for (const j of evidence.analysisJobs) {
          if (j.status !== 'DONE') continue;
          aiAnalyses.push({
            id: j.id,
            type: 'ai_analysis',
            title: j.originalFilename || 'AI Analysis',
            description: j.transcriptSummary || undefined,
            analysisMode: j.analysisMode,
            transcriptSummary: j.transcriptSummary || undefined,
            aiAdvice: j.aiAdvice || undefined,
            evaluationResult: j.evaluationResult || undefined,
            analysisReport: j.analysisReport || undefined,
            doneAt: j.doneAt?.toISOString?.() || undefined,
            createdAt:
              j.createdAt?.toISOString?.() || new Date().toISOString(),
          });
        }
      }

      result[indicatorId] = {
        indicatorId,
        indicatorName: item.name,
        score: item.score,
        status: item.status,
        files,
        videoLinks,
        aiAnalyses,
        totalCount: files.length + videoLinks.length + aiAnalyses.length,
      };
    }

    return result;
  }

  /**
   * ตรวจว่า AI analysis เกี่ยวข้องกับตัวชี้วัดไหน
   */
  private isAnalysisRelevant(indicatorId: string): boolean {
    // AI analysis เกี่ยวข้องกับการจัดการเรียนรู้
    const relevantPrefixes = [
      'PRO_1.1', // วิเคราะห์หลักสูตร
      'PRO_1.2', // ออกแบบการจัดการเรียนรู้
      'PRO_1.3', // Active Learning (มีเกี่ยวข้องมากที่สุด)
      'PRO_1.4', // สื่อ นวัตกรรม เทคโนโลยี
      'PRO_1.5', // วัดผลประเมินผล
      'PRO_1.6', // วิจัยในชั้นเรียน
      'PRO_1.7', // เรียนรู้ร่วมกัน
    ];
    return relevantPrefixes.some((prefix) => indicatorId.startsWith(prefix));
  }

  /**
   * สร้าง domain summaries พร้อม highlights
   */
  private buildDomainSummaries(
    completeness: DeckCompleteness,
    evidenceByIndicator: Record<string, IndicatorEvidence>,
  ): Record<string, DomainSummary> {
    const result: Record<string, DomainSummary> = {};

    for (const [domainId, domain] of Object.entries(completeness.domains)) {
      const indicators = Object.entries(evidenceByIndicator)
        .filter(([id]) => {
          if (domainId === 'PROFESSIONAL') return id.startsWith('PRO_');
          if (domainId === 'SOCIAL') return id.startsWith('SOC_');
          if (domainId === 'PERSONAL') return id.startsWith('PER_');
          return false;
        })
        .map(([, v]) => v);

      const totalEvidence = indicators.reduce(
        (sum, ind) => sum + ind.totalCount,
        0,
      );

      // สร้าง highlights จาก AI insights ของ domain นี้
      const highlights: string[] = [];
      for (const ind of indicators) {
        for (const analysis of ind.aiAnalyses) {
          if (analysis.transcriptSummary) {
            highlights.push(
              `${ind.indicatorName}: ${analysis.transcriptSummary.substring(0, 100)}...`,
            );
          }
        }
      }

      result[domainId] = {
        domainId,
        domainName: domain.name,
        score: domain.score,
        status: domain.status,
        indicatorCount: domain.itemCount,
        passedCount: domain.passedCount,
        totalEvidence,
        highlights: highlights.slice(0, 5),
        indicators,
      };
    }

    return result;
  }

  /**
   * รวบรวม AI insights จากทุก analysis jobs
   */
  private aggregateAiInsights(evidence: TeacherEvidence): DevelopmentSummaryData['aiInsights'] {
    const insights = {
      teachingStrengths: [] as string[],
      areasForImprovement: [] as string[],
      recommendations: [] as string[],
      activeLearningSignals: [] as string[],
    };

    for (const job of evidence.analysisJobs) {
      if (job.status !== 'DONE') continue;

      // จาก analysisReport (structured JSON)
      const report = job.analysisReport as any;
      if (report) {
        if (report.strengths) {
          const items = Array.isArray(report.strengths)
            ? report.strengths
            : [report.strengths];
          insights.teachingStrengths.push(...items);
        }
        if (report.weaknesses || report.improvements) {
          const items = Array.isArray(report.weaknesses || report.improvements)
            ? report.weaknesses || report.improvements
            : [report.weaknesses || report.improvements];
          insights.areasForImprovement.push(...items);
        }
        if (report.activeLearning) {
          const items = Array.isArray(report.activeLearning)
            ? report.activeLearning
            : [report.activeLearning];
          insights.activeLearningSignals.push(...items);
        }
      }

      // จาก aiAdvice
      if (job.aiAdvice) {
        insights.recommendations.push(job.aiAdvice);
      }
    }

    // Deduplicate
    insights.teachingStrengths = [...new Set(insights.teachingStrengths)].slice(0, 10);
    insights.areasForImprovement = [...new Set(insights.areasForImprovement)].slice(0, 10);
    insights.recommendations = [...new Set(insights.recommendations)].slice(0, 10);
    insights.activeLearningSignals = [...new Set(insights.activeLearningSignals)].slice(0, 10);

    return insights;
  }

  /**
   * สร้าง narrative สรุป
   */
  private buildNarrative(
    teacher: any,
    completeness: DeckCompleteness,
    domains: Record<string, DomainSummary>,
    aiInsights: DevelopmentSummaryData['aiInsights'],
    round: number,
    year: string,
  ): string {
    const lines: string[] = [];

    lines.push(
      `สรุปผลการเตรียมความพร้อมและพัฒนาอย่างเข้ม ของ ${teacher.fullName}`,
    );
    lines.push(
      `ตำแหน่ง ${teacher.position} โรงเรียน${teacher.school?.name || '-'}`,
    );
    lines.push(`ครั้งที่ ${round} ปีการศึกษา ${year}`);
    lines.push('');

    // ภาพรวม
    lines.push(`## ภาพรวมความสมบูรณ์: ${completeness.deck.score}%`);
    lines.push(
      completeness.passCriteria.overall
        ? 'ผ่านเกณฑ์การประเมิน'
        : 'ยังไม่ผ่านเกณฑ์การประเมิน',
    );
    lines.push('');

    // ด้านต่างๆ
    for (const [, domain] of Object.entries(domains)) {
      lines.push(`### ${domain.domainName} (${domain.score}%)`);
      lines.push(
        `ผ่าน ${domain.passedCount}/${domain.indicatorCount} ตัวชี้วัด | หลักฐาน ${domain.totalEvidence} ชิ้น`,
      );
      if (domain.highlights.length > 0) {
        lines.push('จุดเด่น:');
        for (const h of domain.highlights) {
          lines.push(`- ${h}`);
        }
      }
      lines.push('');
    }

    // AI Insights
    if (aiInsights.teachingStrengths.length > 0) {
      lines.push('### จุดแข็ง (จาก AI วิเคราะห์)');
      for (const s of aiInsights.teachingStrengths.slice(0, 5)) {
        lines.push(`- ${s}`);
      }
      lines.push('');
    }

    if (aiInsights.areasForImprovement.length > 0) {
      lines.push('### สิ่งที่ควรพัฒนา');
      for (const a of aiInsights.areasForImprovement.slice(0, 5)) {
        lines.push(`- ${a}`);
      }
      lines.push('');
    }

    if (aiInsights.recommendations.length > 0) {
      lines.push('### คำแนะนำจาก AI');
      for (const r of aiInsights.recommendations.slice(0, 3)) {
        lines.push(`- ${r}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * สร้าง Enhanced Slidev Deck Markdown (มีเนื้อหาจริง)
   */
  private buildEnhancedDeckMarkdown(
    teacher: any,
    completeness: DeckCompleteness,
    domains: Record<string, DomainSummary>,
    aiInsights: DevelopmentSummaryData['aiInsights'],
    evidence: TeacherEvidence,
    round: number,
    year: string,
  ): string {
    const slides: string[] = [];

    // ─── Slide 1: Cover ───
    slides.push(`---
theme: default
title: "สรุปผลการเตรียมความพร้อมและพัฒนาอย่างเข้ม"
download: true
---

# สรุปผลการเตรียมความพร้อม
## และพัฒนาอย่างเข้ม (ว19/2568) ครั้งที่ ${round}

**${teacher.fullName}**

${teacher.position} | ${teacher.major || '-'}

โรงเรียน${teacher.school?.name || '-'}

ปีการศึกษา ${year}

<div class="text-sm opacity-60 mt-4">สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
`);

    // ─── Slide 2: Overview ───
    const proScore = completeness.domains.PROFESSIONAL?.score || 0;
    const socScore = completeness.domains.SOCIAL?.score;
    const perScore = completeness.domains.PERSONAL?.score || 0;
    const totalEvidence =
      evidence.portfolios.length +
      evidence.analysisJobs.filter((j: any) => j.status === 'DONE').length;

    slides.push(`---
layout: two-cols
---

## ภาพรวมความสมบูรณ์

### คะแนนรวม: **${completeness.deck.score}%**

| ด้าน | คะแนน | สถานะ |
|------|--------|-------|
| ด้านวิชาชีพ | ${proScore}% | ${this.getStatusEmoji(completeness.domains.PROFESSIONAL?.status)} |
| ด้านสังคม | ${socScore != null ? socScore + '%' : 'ยังไม่ใช้'} | ${socScore != null ? this.getStatusEmoji(completeness.domains.SOCIAL?.status) : '➖'} |
| ด้านคุณลักษณะ | ${perScore}% | ${this.getStatusEmoji(completeness.domains.PERSONAL?.status)} |

**หลักฐานทั้งหมด:** ${totalEvidence} ชิ้น

::right::

### เกณฑ์ผ่าน (ครั้งที่ ${round})

${completeness.passCriteria.professional.passed ? '✅' : '❌'} วิชาชีพ: ${completeness.passCriteria.professional.actual}/${completeness.passCriteria.professional.required}

${completeness.passCriteria.social ? `${completeness.passCriteria.social.passed ? '✅' : '❌'} สังคม: ${completeness.passCriteria.social.actual}/${completeness.passCriteria.social.required}` : '➖ สังคม: ยังไม่ใช้ในครั้งนี้'}

${completeness.passCriteria.personal.passed ? '✅' : '❌'} คุณลักษณะ: ${completeness.passCriteria.personal.actual}/${completeness.passCriteria.personal.required}

---

**ผลรวม: ${completeness.passCriteria.overall ? '✅ ผ่านเกณฑ์' : '❌ ยังไม่ผ่านเกณฑ์'}**
`);

    // ─── Slide 3: Evidence Overview ───
    const fileCount = evidence.portfolios.filter(
      (p: any) => p.itemType === 'FILE',
    ).length;
    const videoCount = evidence.portfolios.filter(
      (p: any) => p.itemType === 'VIDEO_LINK',
    ).length;
    const analysisCount = evidence.analysisJobs.filter(
      (j: any) => j.status === 'DONE',
    ).length;

    slides.push(`---

## หลักฐานที่รวบรวม

| แหล่งข้อมูล | จำนวน |
|-------------|--------|
| ไฟล์อัพโหลด | ${fileCount} ไฟล์ |
| ลิงก์วิดีโอ | ${videoCount} ลิงก์ |
| AI วิเคราะห์ | ${analysisCount} ชิ้น |
| บันทึกสะท้อนคิด | ${evidence.journals.length} รายการ |
| การนิเทศ | ${evidence.mentoringVisits.length} ครั้ง |
| กิจกรรม PLC | ${evidence.plcActivities.length} ครั้ง |

**รวมทั้งหมด ${totalEvidence} ชิ้น**
`);

    // ─── Slides: Professional Domain ───
    if (domains.PROFESSIONAL) {
      slides.push(`---

## ด้านวิชาชีพ (${proScore}%)

| # | ตัวชี้วัด | คะแนน | หลักฐาน | สถานะ |
|---|----------|--------|---------|-------|
${domains.PROFESSIONAL.indicators
  .map(
    (ind, i) =>
      `| ${i + 1} | ${ind.indicatorName} | ${ind.score}% | ${ind.totalCount} ชิ้น | ${this.getStatusEmoji(ind.status)} |`,
  )
  .join('\n')}
`);

      // Detailed slides for each PRO indicator with evidence
      for (const ind of domains.PROFESSIONAL.indicators) {
        const checksList = (completeness.items[ind.indicatorId]?.checks || [])
          .map(
            (ch: any) =>
              `- ${ch.passed ? '✅' : '⬜'} ${ch.label} (${ch.weight}%)`,
          )
          .join('\n');

        // Evidence list
        const evidenceList: string[] = [];
        for (const f of ind.files.slice(0, 3)) {
          evidenceList.push(`- 📄 ${f.title}`);
        }
        for (const v of ind.videoLinks.slice(0, 3)) {
          evidenceList.push(`- 🎬 ${v.title}`);
        }
        for (const a of ind.aiAnalyses.slice(0, 2)) {
          evidenceList.push(
            `- 🤖 ${a.title} (${a.analysisMode === 'FULL' ? 'วิเคราะห์เต็ม' : 'ถอดเสียง'})`,
          );
        }

        // AI summary if available
        let aiSummarySection = '';
        const firstAnalysis = ind.aiAnalyses[0];
        if (firstAnalysis?.transcriptSummary) {
          aiSummarySection = `\n### สรุปจาก AI\n> ${firstAnalysis.transcriptSummary.substring(0, 200)}${firstAnalysis.transcriptSummary.length > 200 ? '...' : ''}`;
        }

        slides.push(`---

## ${ind.indicatorName} (${ind.score}%)

### Checklist
${checksList}

### หลักฐาน (${ind.totalCount} ชิ้น)
${evidenceList.length > 0 ? evidenceList.join('\n') : '- ยังไม่มีหลักฐาน'}
${aiSummarySection}
`);
      }
    }

    // ─── Social Domain (if round >= 3) ───
    if (round >= 3 && domains.SOCIAL) {
      slides.push(`---

## ด้านสังคม (${domains.SOCIAL.score}%)

${domains.SOCIAL.indicators
  .map((ind) => {
    const checks = (completeness.items[ind.indicatorId]?.checks || [])
      .map((ch: any) => `- ${ch.passed ? '✅' : '⬜'} ${ch.label}`)
      .join('\n');
    return `### ${ind.indicatorName} (${ind.score}%) | หลักฐาน ${ind.totalCount} ชิ้น\n${checks}`;
  })
  .join('\n\n')}
`);
    }

    // ─── Personal Domain ───
    if (domains.PERSONAL) {
      slides.push(`---

## ด้านคุณลักษณะส่วนบุคคล (${perScore}%)

${domains.PERSONAL.indicators
  .map(
    (ind) =>
      `- ${ind.score >= 60 ? '✅' : '⬜'} ${ind.indicatorName} (${ind.score}%) | หลักฐาน ${ind.totalCount} ชิ้น`,
  )
  .join('\n')}
`);
    }

    // ─── AI Insights Slide ───
    if (
      aiInsights.teachingStrengths.length > 0 ||
      aiInsights.recommendations.length > 0
    ) {
      slides.push(`---
layout: two-cols
---

## AI Insights

### จุดแข็ง
${
  aiInsights.teachingStrengths.length > 0
    ? aiInsights.teachingStrengths
        .slice(0, 5)
        .map((s) => `- 🌟 ${s}`)
        .join('\n')
    : '- ยังไม่มีข้อมูล'
}

::right::

### สิ่งที่ควรพัฒนา
${
  aiInsights.areasForImprovement.length > 0
    ? aiInsights.areasForImprovement
        .slice(0, 5)
        .map((a) => `- 📌 ${a}`)
        .join('\n')
    : '- ยังไม่มีข้อมูล'
}

### คำแนะนำ
${
  aiInsights.recommendations.length > 0
    ? aiInsights.recommendations
        .slice(0, 3)
        .map((r) => `- 💡 ${typeof r === 'string' ? r.substring(0, 100) : r}`)
        .join('\n')
    : '- ยังไม่มีข้อมูล'
}
`);
    }

    // ─── Completed Analysis Jobs Slide ───
    const doneJobs = evidence.analysisJobs.filter(
      (j: any) => j.status === 'DONE',
    );
    if (doneJobs.length > 0) {
      slides.push(`---

## AI วิเคราะห์ชิ้นงาน (${doneJobs.length} ชิ้น)

| # | ชื่อไฟล์ | โหมด | สรุป |
|---|---------|------|------|
${doneJobs
  .slice(0, 10)
  .map((j: any, i: number) => {
    const mode =
      j.analysisMode === 'FULL' ? 'เต็มรูปแบบ' : 'ถอดเสียงเท่านั้น';
    const summary = j.transcriptSummary
      ? j.transcriptSummary.substring(0, 60) + '...'
      : '-';
    return `| ${i + 1} | ${j.originalFilename || '-'} | ${mode} | ${summary} |`;
  })
  .join('\n')}
`);
    }

    // ─── Summary / End Slide ───
    const allMissing = Object.entries(completeness.items)
      .filter(([, item]) => (item.missing || []).length > 0)
      .map(
        ([, item]) =>
          `- **${item.name}**: ${item.missing.slice(0, 2).join(', ')}`,
      )
      .slice(0, 8);

    slides.push(`---
layout: end
---

# สรุป

${
  completeness.deck.score >= 80
    ? '### 🎉 ความสมบูรณ์ ≥ 80% — พร้อมนำเสนอ!'
    : `### ⚠️ ความสมบูรณ์ ${completeness.deck.score}% — กรุณาเติมหลักฐานให้ครบ`
}

${
  allMissing.length > 0
    ? '### สิ่งที่ต้องเติม\n' + allMissing.join('\n')
    : '### ✅ ไม่มีรายการที่ขาด — พร้อมนำเสนอ!'
}
`);

    return slides.join('\n');
  }

  private getStatusEmoji(status?: string): string {
    switch (status) {
      case 'READY':
        return '🟢';
      case 'DRAFT':
        return '🟡';
      default:
        return '🔴';
    }
  }
}
