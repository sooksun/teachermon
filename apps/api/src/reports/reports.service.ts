import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';
import { TeacherReportQueryDto } from './dto/teacher-report-query.dto';
import { TeacherReportSummary } from './dto/teacher-report-response.dto';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeacherAssessmentReport(
    filters: TeacherReportQueryDto,
  ): Promise<TeacherReportSummary[]> {
    // Build Prisma where clause from filters
    const where: Prisma.TeacherWhereInput = {
      position: 'ครูผู้ช่วย', // Filter for assistant teachers only
      ...(filters.schoolId && { schoolId: filters.schoolId }),
      ...(filters.province && {
        school: { is: { province: filters.province } },
      }),
      ...(filters.region && { school: { is: { region: filters.region } } }),
      ...(filters.cohort && { cohort: filters.cohort }),
      ...(filters.status && { status: filters.status }),
    };

    // Fetch teachers with all related data
    const teachers = await this.prisma.teacher.findMany({
      where,
      include: {
        school: {
          select: {
            schoolName: true,
            province: true,
            region: true,
          },
        },
        competencyAssessments: {
          orderBy: { createdAt: 'desc' },
        },
        mentoringVisits: {
          orderBy: { visitDate: 'desc' },
        },
        reflectiveJournals: {
          select: { id: true, createdAt: true },
        },
        plcActivities: {
          select: { id: true, plcDate: true },
        },
        developmentPlans: {
          select: { id: true, createdAt: true },
        },
      },
      orderBy: [{ school: { province: 'asc' } }, { fullName: 'asc' }],
    });

    // Transform to summary format
    return teachers.map((teacher) => {
      const latestAssessment = teacher.competencyAssessments[0] || null;
      const latestMentoring = teacher.mentoringVisits[0] || null;

      // Calculate average score from latest assessment
      let averageScore: number | null = null;
      if (latestAssessment) {
        averageScore =
          (latestAssessment.pedagogyScore +
            latestAssessment.classroomScore +
            latestAssessment.communityScore +
            latestAssessment.professionalismScore) /
          4;
      }

      // Find last activity date
      const activityDates: Date[] = [
        ...teacher.competencyAssessments.map((a) => a.createdAt),
        ...teacher.mentoringVisits.map((v) => v.visitDate),
        ...teacher.reflectiveJournals.map((j) => j.createdAt),
        ...teacher.plcActivities.map((p) => p.plcDate),
        ...teacher.developmentPlans.map((d) => d.createdAt),
      ].filter(Boolean);

      const lastActivityDate =
        activityDates.length > 0
          ? new Date(Math.max(...activityDates.map((d) => d.getTime())))
          : null;

      return {
        teacherId: teacher.id,
        fullName: teacher.fullName,
        position: teacher.position,
        cohort: teacher.cohort,
        school: {
          schoolName: teacher.school.schoolName,
          province: teacher.school.province,
          region: teacher.school.region,
        },
        assessmentCount: teacher.competencyAssessments.length,
        latestAssessment: latestAssessment
          ? {
              period: latestAssessment.assessmentPeriod,
              overallLevel: latestAssessment.overallLevel,
              scores: {
                pedagogy: latestAssessment.pedagogyScore,
                classroom: latestAssessment.classroomScore,
                community: latestAssessment.communityScore,
                professionalism: latestAssessment.professionalismScore,
              },
              date: latestAssessment.createdAt,
              assessor: latestAssessment.assessor,
            }
          : null,
        averageScore,
        mentoringCount: teacher.mentoringVisits.length,
        latestMentoring: latestMentoring
          ? {
              visitType: latestMentoring.visitType,
              focusArea: latestMentoring.focusArea,
              date: latestMentoring.visitDate,
              observer: latestMentoring.observer,
            }
          : null,
        journalCount: teacher.reflectiveJournals.length,
        plcCount: teacher.plcActivities.length,
        developmentPlanCount: teacher.developmentPlans.length,
        status: teacher.status,
        lastActivityDate,
      };
    });
  }

  async generatePDF(
    data: TeacherReportSummary[],
    filters: TeacherReportQueryDto,
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    try {
      const page = await browser.newPage();
      const html = this.generateHTMLTemplate(data, filters);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        printBackground: true,
      });
      
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateHTMLTemplate(
    data: TeacherReportSummary[],
    filters: TeacherReportQueryDto,
  ): string {
    const filterSummary = [];
    if (filters.province) filterSummary.push(`จังหวัด: ${filters.province}`);
    if (filters.region) filterSummary.push(`ภูมิภาค: ${filters.region}`);
    if (filters.cohort) filterSummary.push(`รุ่น: ${filters.cohort}`);
    if (filters.status) filterSummary.push(`สถานะ: ${filters.status}`);

    const filterText = filterSummary.length > 0 ? filterSummary.join(' | ') : 'ทั้งหมด';

    // Thai number labels
    const levelLabels: Record<string, string> = {
      NEEDS_SUPPORT: 'ต้องเสริม',
      FAIR: 'พอใช้',
      GOOD: 'ดี',
      EXCELLENT: 'ดีเยี่ยม',
    };

    const statusLabels: Record<string, string> = {
      ACTIVE: 'ปฏิบัติงาน',
      TRANSFERRED: 'ย้าย',
      RESIGNED: 'ลาออก',
      ON_LEAVE: 'ลา',
    };

    return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานสรุปผลการประเมินครูผู้ช่วย</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 10px;
      line-height: 1.4;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #2563eb;
    }
    .header h1 {
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .header .filter-info {
      font-size: 11px;
      color: #64748b;
    }
    .summary {
      display: flex;
      justify-content: space-around;
      margin-bottom: 15px;
      padding: 10px;
      background: #f1f5f9;
      border-radius: 4px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-item .label {
      font-size: 9px;
      color: #64748b;
    }
    .summary-item .value {
      font-size: 16px;
      font-weight: 700;
      color: #2563eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 6px 4px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #1e40af;
    }
    td {
      padding: 5px 4px;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .level-excellent { color: #059669; font-weight: 600; }
    .level-good { color: #0891b2; font-weight: 600; }
    .level-fair { color: #d97706; font-weight: 600; }
    .level-needs-support { color: #dc2626; font-weight: 600; }
    .status-active { color: #059669; }
    .status-transferred { color: #d97706; }
    .status-resigned { color: #64748b; }
    .footer {
      margin-top: 15px;
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>รายงานสรุปผลการประเมินครูผู้ช่วย</h1>
    <div class="filter-info">เงื่อนไข: ${filterText} | วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="label">จำนวนครูทั้งหมด</div>
      <div class="value">${data.length}</div>
    </div>
    <div class="summary-item">
      <div class="label">ผ่านการประเมิน</div>
      <div class="value">${data.filter((t) => t.assessmentCount > 0).length}</div>
    </div>
    <div class="summary-item">
      <div class="label">คะแนนเฉลี่ย</div>
      <div class="value">${data.filter((t) => t.averageScore).length > 0 ? (data.reduce((sum, t) => sum + (t.averageScore || 0), 0) / data.filter((t) => t.averageScore).length).toFixed(2) : '-'}</div>
    </div>
    <div class="summary-item">
      <div class="label">การหนุนเสริม</div>
      <div class="value">${data.reduce((sum, t) => sum + t.mentoringCount, 0)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 3%;">ลำดับ</th>
        <th style="width: 15%;">ชื่อ-สกุล</th>
        <th style="width: 3%;">รุ่น</th>
        <th style="width: 15%;">โรงเรียน</th>
        <th style="width: 8%;">จังหวัด</th>
        <th style="width: 8%;">ระดับประเมิน</th>
        <th style="width: 5%;">คะแนน</th>
        <th style="width: 5%;">การประเมิน</th>
        <th style="width: 5%;">หนุนเสริม</th>
        <th style="width: 5%;">Journal</th>
        <th style="width: 4%;">PLC</th>
        <th style="width: 7%;">สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (teacher, index) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${teacher.fullName}</td>
          <td style="text-align: center;">${teacher.cohort}</td>
          <td>${teacher.school.schoolName}</td>
          <td>${teacher.school.province}</td>
          <td class="level-${teacher.latestAssessment?.overallLevel.toLowerCase().replace('_', '-') || ''}">${teacher.latestAssessment ? levelLabels[teacher.latestAssessment.overallLevel] || '-' : '-'}</td>
          <td style="text-align: center;">${teacher.averageScore ? teacher.averageScore.toFixed(2) : '-'}</td>
          <td style="text-align: center;">${teacher.assessmentCount}</td>
          <td style="text-align: center;">${teacher.mentoringCount}</td>
          <td style="text-align: center;">${teacher.journalCount}</td>
          <td style="text-align: center;">${teacher.plcCount}</td>
          <td class="status-${teacher.status.toLowerCase()}">${statusLabels[teacher.status] || teacher.status}</td>
        </tr>
      `,
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    ระบบติดตามและหนุนเสริมการพัฒนาครูรัก(ษ์)ถิ่น - TeacherMon | พิมพ์โดย: ระบบอัตโนมัติ
  </div>
</body>
</html>
    `;
  }
}
