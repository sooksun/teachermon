import { Injectable, Logger } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import {
  DevelopmentSummaryData,
  DomainSummary,
  IndicatorEvidence,
} from './development-summary.service';
import { DeckCompleteness } from './completeness.service';

// =============================================
// Color & Style Constants
// =============================================

const COLORS = {
  primary: '1E40AF',    // blue-800
  secondary: '1D4ED8',  // blue-700
  accent: '2563EB',     // blue-600
  success: '16A34A',    // green-600
  warning: 'D97706',    // amber-600
  danger: 'DC2626',     // red-600
  dark: '1F2937',       // gray-800
  text: '374151',       // gray-700
  muted: '6B7280',      // gray-500
  light: 'F3F4F6',      // gray-100
  white: 'FFFFFF',
  bgBlue: 'EFF6FF',     // blue-50
  bgGreen: 'F0FDF4',    // green-50
  bgAmber: 'FFFBEB',    // amber-50
  bgRed: 'FEF2F2',      // red-50
};

const FONTS = {
  title: 'Calibri',
  body: 'Calibri',
  thai: 'TH Sarabun New',
};

function scoreColor(score: number): string {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'READY': return 'พร้อมนำเสนอ';
    case 'DRAFT': return 'ฉบับร่าง';
    default: return 'ยังไม่เพียงพอ';
  }
}

function statusEmoji(status: string): string {
  switch (status) {
    case 'READY': return '✅';
    case 'DRAFT': return '🟡';
    default: return '❌';
  }
}

@Injectable()
export class PptxGeneratorService {
  private readonly logger = new Logger(PptxGeneratorService.name);

  /**
   * สร้าง PowerPoint Buffer จากข้อมูลสรุปผล
   */
  async generatePptx(data: DevelopmentSummaryData): Promise<Buffer> {
    const pptx = new PptxGenJS();

    // Master slide settings
    pptx.author = 'TeacherMon AI';
    pptx.company = 'ระบบติดตามครูรัก(ษ์)ถิ่น';
    pptx.subject = `สรุปผลการพัฒนาอย่างเข้ม - ${data.teacherName}`;
    pptx.title = `สรุปผลการเตรียมความพร้อม ครั้งที่ ${data.assessmentRound}`;
    pptx.layout = 'LAYOUT_16x9';

    // Define master slide with blue header
    pptx.defineSlideMaster({
      title: 'CONTENT_SLIDE',
      background: { color: COLORS.white },
      objects: [
        // Top blue bar
        {
          rect: {
            x: 0, y: 0, w: '100%', h: 0.6,
            fill: { color: COLORS.primary },
          },
        },
        // Bottom gray bar
        {
          rect: {
            x: 0, y: 7.0, w: '100%', h: 0.5,
            fill: { color: COLORS.light },
          },
        },
        // Footer text
        {
          text: {
            text: `${data.teacherName} | ครั้งที่ ${data.assessmentRound} | ปีการศึกษา ${data.academicYear}`,
            options: {
              x: 0.5, y: 7.05, w: 8, h: 0.4,
              fontSize: 9, color: COLORS.muted,
              fontFace: FONTS.body,
            },
          },
        },
        // Page number
        {
          text: {
            text: 'TeacherMon AI',
            options: {
              x: 8.5, y: 7.05, w: 1.5, h: 0.4,
              fontSize: 9, color: COLORS.muted,
              fontFace: FONTS.body, align: 'right',
            },
          },
        },
      ],
    });

    // ─── Slide 1: Cover ───
    this.addCoverSlide(pptx, data);

    // ─── Slide 2: Overview ───
    this.addOverviewSlide(pptx, data);

    // ─── Slide 3: Evidence Summary ───
    this.addEvidenceSummarySlide(pptx, data);

    // ─── Slide 4: Pass Criteria ───
    this.addPassCriteriaSlide(pptx, data);

    // ─── Domain Slides ───
    if (data.domains.PROFESSIONAL) {
      this.addDomainSlide(pptx, data.domains.PROFESSIONAL, data.completeness);
      this.addDomainDetailSlides(pptx, data.domains.PROFESSIONAL, data.completeness);
    }

    if (data.domains.SOCIAL) {
      this.addDomainSlide(pptx, data.domains.SOCIAL, data.completeness);
    }

    if (data.domains.PERSONAL) {
      this.addDomainSlide(pptx, data.domains.PERSONAL, data.completeness);
    }

    // ─── AI Insights Slide ───
    if (data.aiInsights.teachingStrengths.length > 0 || data.aiInsights.recommendations.length > 0) {
      this.addAiInsightsSlide(pptx, data);
    }

    // ─── Summary Slide ───
    this.addSummarySlide(pptx, data);

    // Generate buffer
    const output = await pptx.write({ outputType: 'nodebuffer' });
    this.logger.log(`PPTX generated for ${data.teacherName}, round ${data.assessmentRound}`);
    return output as Buffer;
  }

  // =============================================
  // Slide Builders
  // =============================================

  private addCoverSlide(pptx: PptxGenJS, data: DevelopmentSummaryData): void {
    const slide = pptx.addSlide();

    // Full blue background
    slide.background = { color: COLORS.primary };

    // Main title
    slide.addText('สรุปผลการเตรียมความพร้อม\nและพัฒนาอย่างเข้ม', {
      x: 0.8, y: 1.0, w: 8.4, h: 1.6,
      fontSize: 32, fontFace: FONTS.body, color: COLORS.white,
      bold: true, align: 'center', lineSpacingMultiple: 1.3,
    });

    // Sub title (ว19/2568)
    slide.addText(`ตามหลักเกณฑ์ ว19/2568 ครั้งที่ ${data.assessmentRound}`, {
      x: 0.8, y: 2.8, w: 8.4, h: 0.5,
      fontSize: 18, fontFace: FONTS.body, color: 'BFDBFE', // blue-200
      align: 'center',
    });

    // Divider line
    slide.addShape(pptx.ShapeType.line, {
      x: 3, y: 3.6, w: 4, h: 0,
      line: { color: 'BFDBFE', width: 1.5 },
    });

    // Teacher name
    slide.addText(data.teacherName, {
      x: 0.8, y: 3.9, w: 8.4, h: 0.6,
      fontSize: 24, fontFace: FONTS.body, color: COLORS.white,
      bold: true, align: 'center',
    });

    // Academic year
    slide.addText(`ปีการศึกษา ${data.academicYear}`, {
      x: 0.8, y: 4.6, w: 8.4, h: 0.5,
      fontSize: 16, fontFace: FONTS.body, color: 'BFDBFE',
      align: 'center',
    });

    // Date
    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    slide.addText(`อัปเดตเมื่อ ${dateStr}`, {
      x: 0.8, y: 6.2, w: 8.4, h: 0.4,
      fontSize: 11, fontFace: FONTS.body, color: '93C5FD', // blue-300
      align: 'center',
    });
  }

  private addOverviewSlide(pptx: PptxGenJS, data: DevelopmentSummaryData): void {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    // Title
    slide.addText('ภาพรวมความสมบูรณ์', {
      x: 0.5, y: 0.08, w: 9, h: 0.5,
      fontSize: 18, fontFace: FONTS.body, color: COLORS.white, bold: true,
    });

    // Overall score circle (simulated with shape + text)
    const sc = data.overallScore;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.8, y: 1.2, w: 2.2, h: 2.2,
      fill: { color: COLORS.white },
      line: { color: scoreColor(sc), width: 6 },
    });
    slide.addText(`${sc}%`, {
      x: 0.8, y: 1.6, w: 2.2, h: 1.0,
      fontSize: 36, fontFace: FONTS.body, color: scoreColor(sc),
      bold: true, align: 'center', valign: 'middle',
    });
    slide.addText('ความสมบูรณ์รวม', {
      x: 0.8, y: 2.6, w: 2.2, h: 0.5,
      fontSize: 11, fontFace: FONTS.body, color: COLORS.muted,
      align: 'center',
    });

    // Domain scores as bars
    const domains = data.domains;
    let yPos = 1.2;
    const barX = 3.5;
    const barW = 6.0;

    const domainList = [
      { key: 'PROFESSIONAL', label: 'ด้านวิชาชีพ', color: COLORS.accent },
      { key: 'SOCIAL', label: 'ด้านสังคม', color: '7C3AED' },
      { key: 'PERSONAL', label: 'ด้านคุณลักษณะ', color: 'EA580C' },
    ];

    for (const d of domainList) {
      const domain = domains[d.key];
      if (!domain) continue;

      // Label
      slide.addText(`${d.label} (${domain.passedCount}/${domain.indicatorCount})`, {
        x: barX, y: yPos, w: barW, h: 0.35,
        fontSize: 12, fontFace: FONTS.body, color: COLORS.text,
      });

      // Background bar
      slide.addShape(pptx.ShapeType.rect, {
        x: barX, y: yPos + 0.35, w: barW, h: 0.28,
        fill: { color: COLORS.light }, rectRadius: 0.14,
      });

      // Progress bar
      const progressW = Math.max(0.05, (domain.score / 100) * barW);
      slide.addShape(pptx.ShapeType.rect, {
        x: barX, y: yPos + 0.35, w: progressW, h: 0.28,
        fill: { color: scoreColor(domain.score) }, rectRadius: 0.14,
      });

      // Score text
      slide.addText(`${domain.score}%`, {
        x: barX + barW - 0.8, y: yPos, w: 0.8, h: 0.35,
        fontSize: 12, fontFace: FONTS.body,
        color: scoreColor(domain.score), bold: true, align: 'right',
      });

      yPos += 1.0;
    }

    // Status badge
    const statusBg = sc >= 80 ? COLORS.bgGreen : sc >= 50 ? COLORS.bgAmber : COLORS.bgRed;
    const statusClr = sc >= 80 ? COLORS.success : sc >= 50 ? COLORS.warning : COLORS.danger;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 3.5, y: 5.0, w: 3.0, h: 0.5,
      fill: { color: statusBg },
      rectRadius: 0.25,
    });
    slide.addText(`${statusEmoji(data.overallStatus)} ${statusLabel(data.overallStatus)}`, {
      x: 3.5, y: 5.0, w: 3.0, h: 0.5,
      fontSize: 14, fontFace: FONTS.body, color: statusClr,
      bold: true, align: 'center', valign: 'middle',
    });
  }

  private addEvidenceSummarySlide(pptx: PptxGenJS, data: DevelopmentSummaryData): void {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    slide.addText('หลักฐานที่รวบรวม', {
      x: 0.5, y: 0.08, w: 9, h: 0.5,
      fontSize: 18, fontFace: FONTS.body, color: COLORS.white, bold: true,
    });

    // Evidence boxes
    const boxes = [
      { label: 'ไฟล์อัพโหลด', count: data.totalFiles, icon: '📄', bg: COLORS.bgBlue, clr: COLORS.accent },
      { label: 'ลิงก์วิดีโอ', count: data.totalVideoLinks, icon: '🎬', bg: COLORS.bgRed, clr: COLORS.danger },
      { label: 'AI วิเคราะห์', count: data.totalAnalysisJobs, icon: '🤖', bg: 'F5F3FF', clr: '7C3AED' },
      { label: 'รวมทั้งหมด', count: data.totalEvidence, icon: '📊', bg: COLORS.bgGreen, clr: COLORS.success },
    ];

    const boxW = 2.0;
    const startX = 0.9;
    const gapX = 0.3;

    boxes.forEach((box, i) => {
      const bx = startX + i * (boxW + gapX);

      slide.addShape(pptx.ShapeType.roundRect, {
        x: bx, y: 1.2, w: boxW, h: 2.0,
        fill: { color: box.bg },
        rectRadius: 0.15,
        line: { color: COLORS.light, width: 0.5 },
      });

      slide.addText(box.icon, {
        x: bx, y: 1.4, w: boxW, h: 0.6,
        fontSize: 28, align: 'center',
      });

      slide.addText(`${box.count}`, {
        x: bx, y: 2.0, w: boxW, h: 0.6,
        fontSize: 30, fontFace: FONTS.body, color: box.clr,
        bold: true, align: 'center',
      });

      slide.addText(box.label, {
        x: bx, y: 2.6, w: boxW, h: 0.4,
        fontSize: 12, fontFace: FONTS.body, color: COLORS.muted,
        align: 'center',
      });
    });

    // Table with detail
    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: 'แหล่งข้อมูล', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 12 } },
        { text: 'จำนวน', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 12, align: 'center' } },
        { text: 'คำอธิบาย', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 12 } },
      ],
      [
        { text: '📄 ไฟล์อัพโหลด', options: { fontSize: 11 } },
        { text: `${data.totalFiles}`, options: { fontSize: 11, align: 'center' } },
        { text: 'เอกสาร, ภาพ, รูปถ่ายที่อัพโหลด', options: { fontSize: 11, color: COLORS.muted } },
      ],
      [
        { text: '🎬 ลิงก์วิดีโอ', options: { fontSize: 11 } },
        { text: `${data.totalVideoLinks}`, options: { fontSize: 11, align: 'center' } },
        { text: 'YouTube, Google Drive, Vimeo', options: { fontSize: 11, color: COLORS.muted } },
      ],
      [
        { text: '🤖 AI วิเคราะห์', options: { fontSize: 11 } },
        { text: `${data.totalAnalysisJobs}`, options: { fontSize: 11, align: 'center' } },
        { text: 'ถอดเสียง + วิเคราะห์ด้วย AI', options: { fontSize: 11, color: COLORS.muted } },
      ],
    ];

    slide.addTable(tableRows, {
      x: 0.9, y: 3.8, w: 8.2,
      border: { type: 'solid', pt: 0.5, color: COLORS.light },
      colW: [2.5, 1.2, 4.5],
      rowH: [0.4, 0.4, 0.4, 0.4],
      fontFace: FONTS.body,
    });
  }

  private addPassCriteriaSlide(pptx: PptxGenJS, data: DevelopmentSummaryData): void {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
    const c = data.completeness;

    slide.addText('เกณฑ์ผ่านการประเมิน', {
      x: 0.5, y: 0.08, w: 9, h: 0.5,
      fontSize: 18, fontFace: FONTS.body, color: COLORS.white, bold: true,
    });

    slide.addText(`ครั้งที่ ${data.assessmentRound} ปีการศึกษา ${data.academicYear}`, {
      x: 0.5, y: 0.8, w: 9, h: 0.4,
      fontSize: 14, fontFace: FONTS.body, color: COLORS.muted,
    });

    // Criteria rows
    const criteria = [
      {
        label: 'ด้านวิชาชีพ',
        actual: c.passCriteria.professional.actual,
        required: c.passCriteria.professional.required,
        passed: c.passCriteria.professional.passed,
      },
      ...(c.passCriteria.social ? [{
        label: 'ด้านสังคม',
        actual: c.passCriteria.social.actual,
        required: c.passCriteria.social.required,
        passed: c.passCriteria.social.passed,
      }] : []),
      {
        label: 'ด้านคุณลักษณะ',
        actual: c.passCriteria.personal.actual,
        required: c.passCriteria.personal.required,
        passed: c.passCriteria.personal.passed,
      },
    ];

    let yy = 1.5;
    for (const cr of criteria) {
      const icon = cr.passed ? '✅' : '❌';
      const bgColor = cr.passed ? COLORS.bgGreen : COLORS.bgRed;
      const txtColor = cr.passed ? COLORS.success : COLORS.danger;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.5, y: yy, w: 7.0, h: 0.8,
        fill: { color: bgColor },
        rectRadius: 0.1,
      });

      slide.addText(`${icon} ${cr.label}`, {
        x: 1.8, y: yy, w: 3.5, h: 0.8,
        fontSize: 16, fontFace: FONTS.body, color: COLORS.text,
        bold: true, valign: 'middle',
      });

      slide.addText(`${cr.actual} / ${cr.required} ตัวชี้วัด`, {
        x: 5.5, y: yy, w: 2.5, h: 0.8,
        fontSize: 16, fontFace: FONTS.body, color: txtColor,
        bold: true, align: 'right', valign: 'middle',
      });

      yy += 1.1;
    }

    // Overall result
    const overallBg = c.passCriteria.overall ? COLORS.success : COLORS.danger;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 2.5, y: yy + 0.3, w: 5.0, h: 0.8,
      fill: { color: overallBg },
      rectRadius: 0.4,
    });
    slide.addText(c.passCriteria.overall ? '✅ ผ่านเกณฑ์การประเมิน' : '❌ ยังไม่ผ่านเกณฑ์การประเมิน', {
      x: 2.5, y: yy + 0.3, w: 5.0, h: 0.8,
      fontSize: 18, fontFace: FONTS.body, color: COLORS.white,
      bold: true, align: 'center', valign: 'middle',
    });
  }

  private addDomainSlide(pptx: PptxGenJS, domain: DomainSummary, completeness: DeckCompleteness): void {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    slide.addText(`${domain.domainName} (${domain.score}%)`, {
      x: 0.5, y: 0.08, w: 9, h: 0.5,
      fontSize: 18, fontFace: FONTS.body, color: COLORS.white, bold: true,
    });

    slide.addText(`ผ่าน ${domain.passedCount}/${domain.indicatorCount} ตัวชี้วัด | หลักฐาน ${domain.totalEvidence} ชิ้น`, {
      x: 0.5, y: 0.75, w: 9, h: 0.4,
      fontSize: 12, fontFace: FONTS.body, color: COLORS.muted,
    });

    // Indicator table
    const headerRow: PptxGenJS.TableRow = [
      { text: '#', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, align: 'center' } },
      { text: 'ตัวชี้วัด', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10 } },
      { text: 'คะแนน', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, align: 'center' } },
      { text: 'หลักฐาน', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, align: 'center' } },
      { text: 'สถานะ', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, align: 'center' } },
    ];

    const dataRows: PptxGenJS.TableRow[] = domain.indicators.map((ind, i) => {
      const rowBg = ind.score >= 60 ? COLORS.bgGreen : (ind.score >= 30 ? COLORS.bgAmber : COLORS.bgRed);
      return [
        { text: `${i + 1}`, options: { fontSize: 10, align: 'center', fill: { color: rowBg } } },
        { text: ind.indicatorName, options: { fontSize: 10, fill: { color: rowBg } } },
        { text: `${ind.score}%`, options: { fontSize: 10, align: 'center', color: scoreColor(ind.score), bold: true, fill: { color: rowBg } } },
        { text: `${ind.totalCount}`, options: { fontSize: 10, align: 'center', fill: { color: rowBg } } },
        { text: statusEmoji(ind.status), options: { fontSize: 10, align: 'center', fill: { color: rowBg } } },
      ];
    });

    slide.addTable([headerRow, ...dataRows], {
      x: 0.5, y: 1.3, w: 9.0,
      border: { type: 'solid', pt: 0.5, color: COLORS.light },
      colW: [0.5, 4.5, 1.0, 1.0, 1.0],
      rowH: 0.4,
      fontFace: FONTS.body,
    });
  }

  private addDomainDetailSlides(pptx: PptxGenJS, domain: DomainSummary, completeness: DeckCompleteness): void {
    // สร้างสไลด์รายละเอียดแต่ละตัวชี้วัด (กลุ่มละ 2 ตัว)
    const indicators = domain.indicators;
    const chunkSize = 2;

    for (let i = 0; i < indicators.length; i += chunkSize) {
      const chunk = indicators.slice(i, i + chunkSize);
      const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

      slide.addText(`${domain.domainName} - รายละเอียด`, {
        x: 0.5, y: 0.08, w: 9, h: 0.5,
        fontSize: 16, fontFace: FONTS.body, color: COLORS.white, bold: true,
      });

      let yPos = 0.9;

      for (const ind of chunk) {
        // Indicator header
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y: yPos, w: 9.0, h: 0.45,
          fill: { color: scoreColor(ind.score) },
          rectRadius: 0.08,
        });
        slide.addText(`${ind.indicatorName} — ${ind.score}% (${statusLabel(ind.status)})`, {
          x: 0.7, y: yPos, w: 8.6, h: 0.45,
          fontSize: 12, fontFace: FONTS.body, color: COLORS.white, bold: true,
          valign: 'middle',
        });

        yPos += 0.55;

        // Checklist items
        const checks = completeness.items[ind.indicatorId]?.checks || [];
        for (const ch of checks.slice(0, 5)) {
          const icon = (ch as any).passed ? '✅' : '⬜';
          slide.addText(`${icon} ${(ch as any).label} (${(ch as any).weight}%)`, {
            x: 0.8, y: yPos, w: 5.5, h: 0.28,
            fontSize: 9, fontFace: FONTS.body, color: (ch as any).passed ? COLORS.text : COLORS.muted,
          });
          yPos += 0.28;
        }

        // Evidence summary
        const evidenceItems: string[] = [];
        for (const f of ind.files.slice(0, 2)) {
          evidenceItems.push(`📄 ${f.title}`);
        }
        for (const v of ind.videoLinks.slice(0, 2)) {
          evidenceItems.push(`🎬 ${v.title}`);
        }
        for (const a of ind.aiAnalyses.slice(0, 1)) {
          evidenceItems.push(`🤖 ${a.title}`);
        }

        if (evidenceItems.length > 0) {
          slide.addText(`หลักฐาน (${ind.totalCount} ชิ้น): ${evidenceItems.join(' | ')}`, {
            x: 0.8, y: yPos, w: 8.4, h: 0.3,
            fontSize: 8, fontFace: FONTS.body, color: COLORS.accent,
            italic: true,
          });
          yPos += 0.3;
        }

        // AI Summary if available
        const firstAnalysis = ind.aiAnalyses[0];
        if (firstAnalysis?.transcriptSummary) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8, y: yPos, w: 8.4, h: 0.5,
            fill: { color: COLORS.bgBlue },
            rectRadius: 0.08,
          });
          slide.addText(`💡 AI: ${firstAnalysis.transcriptSummary.substring(0, 120)}${firstAnalysis.transcriptSummary.length > 120 ? '...' : ''}`, {
            x: 1.0, y: yPos, w: 8.0, h: 0.5,
            fontSize: 8, fontFace: FONTS.body, color: COLORS.accent,
            valign: 'middle',
          });
          yPos += 0.55;
        }

        yPos += 0.25;
      }
    }
  }

  private addAiInsightsSlide(pptx: PptxGenJS, data: DevelopmentSummaryData): void {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
    const ai = data.aiInsights;

    slide.addText('AI Insights (สรุปจากการวิเคราะห์อัตโนมัติ)', {
      x: 0.5, y: 0.08, w: 9, h: 0.5,
      fontSize: 18, fontFace: FONTS.body, color: COLORS.white, bold: true,
    });

    // Two columns
    const colW = 4.3;
    const leftX = 0.5;
    const rightX = 5.2;

    // Left: Strengths
    slide.addShape(pptx.ShapeType.roundRect, {
      x: leftX, y: 0.9, w: colW, h: 2.8,
      fill: { color: COLORS.bgGreen },
      rectRadius: 0.1,
    });
    slide.addText('🌟 จุดแข็ง', {
      x: leftX + 0.2, y: 1.0, w: colW - 0.4, h: 0.4,
      fontSize: 14, fontFace: FONTS.body, color: COLORS.success, bold: true,
    });

    let yLeft = 1.5;
    for (const s of ai.teachingStrengths.slice(0, 5)) {
      const text = typeof s === 'string' ? s.substring(0, 80) : JSON.stringify(s).substring(0, 80);
      slide.addText(`• ${text}`, {
        x: leftX + 0.3, y: yLeft, w: colW - 0.5, h: 0.35,
        fontSize: 9, fontFace: FONTS.body, color: COLORS.text,
      });
      yLeft += 0.38;
    }

    // Right: Areas for improvement
    slide.addShape(pptx.ShapeType.roundRect, {
      x: rightX, y: 0.9, w: colW, h: 2.8,
      fill: { color: COLORS.bgAmber },
      rectRadius: 0.1,
    });
    slide.addText('📌 สิ่งที่ควรพัฒนา', {
      x: rightX + 0.2, y: 1.0, w: colW - 0.4, h: 0.4,
      fontSize: 14, fontFace: FONTS.body, color: COLORS.warning, bold: true,
    });

    let yRight = 1.5;
    for (const a of ai.areasForImprovement.slice(0, 5)) {
      const text = typeof a === 'string' ? a.substring(0, 80) : JSON.stringify(a).substring(0, 80);
      slide.addText(`• ${text}`, {
        x: rightX + 0.3, y: yRight, w: colW - 0.5, h: 0.35,
        fontSize: 9, fontFace: FONTS.body, color: COLORS.text,
      });
      yRight += 0.38;
    }

    // Recommendations
    if (ai.recommendations.length > 0) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.5, y: 4.0, w: 9.0, h: 2.5,
        fill: { color: COLORS.bgBlue },
        rectRadius: 0.1,
      });
      slide.addText('💡 คำแนะนำจาก AI', {
        x: 0.7, y: 4.1, w: 8.6, h: 0.4,
        fontSize: 14, fontFace: FONTS.body, color: COLORS.accent, bold: true,
      });

      let yRec = 4.6;
      for (const r of ai.recommendations.slice(0, 3)) {
        const text = typeof r === 'string' ? r.substring(0, 200) : JSON.stringify(r).substring(0, 200);
        slide.addText(`• ${text}`, {
          x: 0.9, y: yRec, w: 8.2, h: 0.55,
          fontSize: 9, fontFace: FONTS.body, color: COLORS.text,
          valign: 'top',
        });
        yRec += 0.6;
      }
    }
  }

  private addSummarySlide(pptx: PptxGenJS, data: DevelopmentSummaryData): void {
    const slide = pptx.addSlide();
    const sc = data.overallScore;

    // Background based on result
    slide.background = { color: sc >= 80 ? COLORS.success : sc >= 50 ? COLORS.warning : COLORS.danger };

    // Title
    slide.addText('สรุป', {
      x: 0.8, y: 0.5, w: 8.4, h: 0.8,
      fontSize: 36, fontFace: FONTS.body, color: COLORS.white,
      bold: true, align: 'center',
    });

    // Score
    slide.addText(`${sc}%`, {
      x: 0.8, y: 1.5, w: 8.4, h: 1.2,
      fontSize: 72, fontFace: FONTS.body, color: COLORS.white,
      bold: true, align: 'center',
    });

    // Status
    slide.addText(
      data.overallPassed
        ? '✅ ผ่านเกณฑ์การประเมิน'
        : '⚠️ กรุณาเติมหลักฐานให้ครบ',
      {
        x: 0.8, y: 3.0, w: 8.4, h: 0.6,
        fontSize: 22, fontFace: FONTS.body, color: COLORS.white,
        bold: true, align: 'center',
      },
    );

    // Missing items
    const missingItems = Object.entries(data.completeness.items)
      .filter(([, item]) => item.missing && item.missing.length > 0)
      .map(([, item]) => `${item.name}: ${item.missing.slice(0, 2).join(', ')}`)
      .slice(0, 5);

    if (missingItems.length > 0) {
      slide.addText('สิ่งที่ต้องเติม:', {
        x: 0.8, y: 3.9, w: 8.4, h: 0.4,
        fontSize: 14, fontFace: FONTS.body, color: COLORS.white,
        bold: true, align: 'center',
      });

      let yMiss = 4.4;
      for (const m of missingItems) {
        slide.addText(`• ${m}`, {
          x: 1.5, y: yMiss, w: 7.0, h: 0.35,
          fontSize: 10, fontFace: FONTS.body, color: COLORS.white,
        });
        yMiss += 0.35;
      }
    }

    // Footer
    slide.addText(
      `${data.teacherName} | ครั้งที่ ${data.assessmentRound} | ปีการศึกษา ${data.academicYear} | สร้างโดย TeacherMon AI`,
      {
        x: 0.8, y: 6.5, w: 8.4, h: 0.4,
        fontSize: 10, fontFace: FONTS.body, color: COLORS.white,
        align: 'center', italic: true,
      },
    );
  }
}
