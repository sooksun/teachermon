import { Injectable, Logger } from '@nestjs/common';
import { MentoringReportResult, FollowUpTask } from './interfaces/ai.interfaces';
import { AIActivityService } from './ai-activity.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiAIProvider } from './providers/gemini-ai.provider';

/**
 * Mentoring AI Service
 * ช่วยสร้างรายงานการนิเทศ/โค้ช/เยี่ยมชั้นเรียนอัตโนมัติ
 * 
 * คำเตือน: 
 * - AI เป็นเพียงผู้ช่วยสรุป ผู้นิเทศต้องตรวจสอบและปรับแก้
 * - ข้อเสนอแนะต้องผ่านการพิจารณาจากผู้นิเทศก่อนส่งให้ครู
 */
@Injectable()
export class MentoringAIService {
  private readonly logger = new Logger(MentoringAIService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiAI: GeminiAIProvider,
    private readonly aiActivityService: AIActivityService,
  ) {}

  /**
   * สร้างรายงานการนิเทศจากบันทึกการเยี่ยม
   */
  async generateReport(
    visitId: string,
    userId: string,
  ): Promise<MentoringReportResult> {
    // 1. ดึงข้อมูลการเยี่ยม
    const visit = await this.prisma.mentoringVisit.findUnique({
      where: { id: visitId },
      include: {
        teacher: {
          include: { school: true },
        },
      },
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // 2. วิเคราะห์และสรุปด้วย Gemini AI
    const reportSections = await this.analyzeVisitWithAI(visit);

    // 3. สร้างรายงานฉบับเต็ม
    const reportText = this.formatReport(visit, reportSections);

    // 4. บันทึก activity
    await this.aiActivityService.logActivity({
      userId,
      actionType: 'MENTORING_SUMMARY',
      inputData: {
        visitId,
        strengths: visit.strengths,
        challenges: visit.challenges,
        suggestions: visit.suggestions,
      },
      outputData: { report: reportText, sections: reportSections },
      modelUsed: this.geminiAI.getModelName(),
      confidenceScore: 0.82,
      relatedEntityType: 'mentoring_visit',
      relatedEntityId: visitId,
    });

    return {
      reportText,
      sections: reportSections,
      confidenceScore: 0.82,
    };
  }

  /**
   * วิเคราะห์การเยี่ยมด้วย Gemini AI
   */
  private async analyzeVisitWithAI(visit: any): Promise<{
    summary: string;
    strengths: string[];
    improvements: string[];
    followUpTasks: FollowUpTask[];
  }> {
    const aiResult = await this.geminiAI.summarizeMentoringVisit({
      teacherName: visit.teacher.fullName,
      schoolName: visit.teacher.school.schoolName,
      visitDate: this.formatThaiDate(visit.visitDate),
      visitType: this.mapVisitType(visit.visitType),
      focusArea: this.mapFocusArea(visit.focusArea),
      strengths: visit.strengths,
      challenges: visit.challenges,
      suggestions: visit.suggestions,
    });

    // แปลง followUpTasks string[] เป็น FollowUpTask[]
    const followUpTasks: FollowUpTask[] = aiResult.followUpTasks.map((task, index) => ({
      task,
      deadline: index === 0 ? '1 สัปดาห์' : '2 สัปดาห์',
      priority: index === 0 ? 'HIGH' : 'MEDIUM',
    }));

    return {
      summary: aiResult.summary,
      strengths: aiResult.strengths,
      improvements: aiResult.improvements,
      followUpTasks,
    };
  }

  /**
   * วิเคราะห์การเยี่ยมแบบ Fallback (ถ้า AI ไม่พร้อม)
   */
  private async analyzeVisit(visit: any): Promise<{
    summary: string;
    strengths: string[];
    improvements: string[];
    followUpTasks: FollowUpTask[];
  }> {
    // Mock analysis (ในการใช้จริงจะเรียก AI)
    const strengths = this.extractStrengths(visit.strengths);
    const improvements = this.extractImprovements(visit.challenges);
    const followUpTasks = this.generateFollowUpTasks(visit);

    const summary = this.generateSummary(visit, strengths, improvements);

    return {
      summary,
      strengths,
      improvements,
      followUpTasks,
    };
  }

  /**
   * สกัดจุดเด่นจากบันทึก
   */
  private extractStrengths(strengthsText?: string): string[] {
    if (!strengthsText) return [];

    // Mock extraction (ในการใช้จริงจะใช้ AI NLP)
    const strengths: string[] = [];

    if (strengthsText.includes('แผนการสอน')) {
      strengths.push('มีการเตรียมแผนการสอนที่ชัดเจนและครบถ้วน');
    }
    if (strengthsText.includes('นักเรียนมีส่วนร่วม') || strengthsText.includes('active learning')) {
      strengths.push('จัดกิจกรรมให้นักเรียนมีส่วนร่วมอย่างเหมาะสม');
    }
    if (strengthsText.includes('สื่อ') || strengthsText.includes('วัสดุ')) {
      strengths.push('เตรียมสื่อและอุปกรณ์การสอนได้ดี');
    }
    if (strengthsText.includes('ถาม') || strengthsText.includes('คำถาม')) {
      strengths.push('ใช้คำถามกระตุ้นการคิดของนักเรียนได้ดี');
    }

    // ถ้าไม่มีจุดเด่นเฉพาะ ให้ทั่วไป
    if (strengths.length === 0) {
      strengths.push('มีความตั้งใจในการจัดการเรียนการสอน');
    }

    return strengths;
  }

  /**
   * สกัดจุดที่ควรพัฒนา
   */
  private extractImprovements(challengesText?: string): string[] {
    if (!challengesText) return [];

    // Mock extraction
    const improvements: string[] = [];

    if (challengesText.includes('เวลา')) {
      improvements.push('การบริหารจัดการเวลาในชั้นเรียน');
    }
    if (challengesText.includes('วินัย') || challengesText.includes('พฤติกรรม')) {
      improvements.push('การจัดการพฤติกรรมนักเรียนในชั้นเรียน');
    }
    if (challengesText.includes('สื่อ') || challengesText.includes('ขาด')) {
      improvements.push('การเตรียมและใช้สื่อการสอนให้หลากหลาย');
    }
    if (challengesText.includes('ประเมิน') || challengesText.includes('วัดผล')) {
      improvements.push('การวัดและประเมินผลการเรียนรู้');
    }

    return improvements;
  }

  /**
   * สร้าง Follow-up Tasks อัตโนมัติ
   */
  private generateFollowUpTasks(visit: any): FollowUpTask[] {
    const tasks: FollowUpTask[] = [];

    // ตาม focus area
    switch (visit.focusArea) {
      case 'CLASSROOM':
        tasks.push({
          task: 'ปรับปรุงแผนการสอนตามข้อเสนอแนะ',
          deadline: '1 สัปดาห์',
          priority: 'HIGH',
          relatedIndicator: 'WP.1',
        });
        tasks.push({
          task: 'จัดทำสื่อการสอนเพิ่มเติม',
          deadline: '2 สัปดาห์',
          priority: 'MEDIUM',
          relatedIndicator: 'WP.2',
        });
        break;

      case 'MANAGEMENT':
        tasks.push({
          task: 'จัดทำกฎกติกาชั้นเรียนร่วมกับนักเรียน',
          deadline: '1 สัปดาห์',
          priority: 'HIGH',
          relatedIndicator: 'ET.2',
        });
        break;

      case 'PEDAGOGY':
        tasks.push({
          task: 'ศึกษาเทคนิคการสอนแบบ Active Learning',
          deadline: '2 สัปดาห์',
          priority: 'MEDIUM',
          relatedIndicator: 'WP.2',
        });
        break;
    }

    // ถ้าต้องการ follow-up
    if (visit.followUpRequired) {
      tasks.push({
        task: 'นัดหมายการติดตามผลครั้งถัดไป',
        deadline: '1 เดือน',
        priority: 'HIGH',
      });
    }

    return tasks;
  }

  /**
   * สร้างสรุปโดยรวม
   */
  private generateSummary(visit: any, strengths: string[], improvements: string[]): string {
    const teacherName = visit.teacher.fullName;
    const schoolName = visit.teacher.school.schoolName;
    const visitType = this.mapVisitType(visit.visitType);

    return `การ${visitType}ครู${teacherName} โรงเรียน${schoolName} พบว่าโดยรวมมีความพร้อม
ในการจัดการเรียนการสอนในระดับที่ดี โดยมีจุดเด่นในเรื่อง${strengths[0] || 'การเตรียมการสอน'} 
อย่างไรก็ตามยังมีประเด็นที่ควรพัฒนาในด้าน${improvements[0] || 'การบริหารจัดการเวลา'} 
เพื่อให้การจัดการเรียนการสอนมีประสิทธิภาพมากยิ่งขึ้น`;
  }

  /**
   * จัดรูปแบบรายงานฉบับเต็ม (แบบราชการ)
   */
  private formatReport(visit: any, sections: any): string {
    const date = this.formatThaiDate(visit.visitDate);

    return `
รายงานการนิเทศการสอน

วันที่: ${date}
ครูผู้สอน: ${visit.teacher.fullName}
โรงเรียน: ${visit.teacher.school.schoolName}
ผู้นิเทศ/สังเกต: ${visit.observer}
ประเภทการนิเทศ: ${this.mapVisitType(visit.visitType)}
จุดเน้นการสังเกต: ${this.mapFocusArea(visit.focusArea)}

สรุปผลการนิเทศ
${sections.summary}

จุดเด่นที่พบ
${sections.strengths.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

จุดที่ควรพัฒนา
${sections.improvements.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

ข้อเสนอแนะ
${visit.suggestions || 'ควรพัฒนาอย่างต่อเนื่องตามจุดที่แนะนำ'}

แผนติดตามผล
${sections.followUpTasks.map((t: FollowUpTask, i: number) => 
  `${i + 1}. ${t.task} (ภายใน ${t.deadline})${t.relatedIndicator ? ` - เกี่ยวข้องกับ ${t.relatedIndicator}` : ''}`
).join('\n')}

ลงชื่อ: ${visit.observer}
ตำแหน่ง: ผู้นิเทศ
`;
  }

  /**
   * แปลง Visit Type เป็นภาษาไทย
   */
  private mapVisitType(type: string): string {
    const map: Record<string, string> = {
      LESSON_STUDY: 'Lesson Study',
      COACHING: 'การโค้ช',
      OBSERVATION: 'การสังเกตการสอน',
      FOLLOW_UP: 'การติดตามผล',
    };
    return map[type] || type;
  }

  /**
   * แปลง Focus Area เป็นภาษาไทย
   */
  private mapFocusArea(area: string): string {
    const map: Record<string, string> = {
      CLASSROOM: 'การจัดการเรียนการสอนในชั้นเรียน',
      MANAGEMENT: 'การบริหารจัดการชั้นเรียน',
      STUDENT_CARE: 'การดูแลนักเรียน',
      COMMUNITY: 'การสร้างความสัมพันธ์กับชุมชน',
      PEDAGOGY: 'หลักการและวิธีการสอน',
    };
    return map[area] || area;
  }

  /**
   * Format วันที่เป็นภาษาไทย
   */
  private formatThaiDate(date: Date): string {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];

    const d = new Date(date);
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543; // พ.ศ.

    return `${day} ${month} ${year}`;
  }
}
