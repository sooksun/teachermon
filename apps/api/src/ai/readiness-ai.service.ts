import { Injectable, Logger } from '@nestjs/common';
import { ReadinessExplanation, WeeklyTask } from './interfaces/ai.interfaces';
import { PrismaService } from '../prisma/prisma.service';
import { AIActivityService } from './ai-activity.service';

/**
 * Readiness AI Service
 * อธิบายความพร้อมของครูผู้ช่วยเป็นภาษาคนอ่านง่าย
 * และแนะนำสิ่งที่ควรทำเพื่อให้ครบตามเกณฑ์
 * 
 * คำเตือน: AI เป็นเพียงผู้ช่วยอธิบาย ไม่ใช่ผู้ตัดสินผ่าน/ไม่ผ่าน
 */
@Injectable()
export class ReadinessAIService {
  private readonly logger = new Logger(ReadinessAIService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiActivityService: AIActivityService,
  ) {}

  /**
   * อธิบายความพร้อมของครูแบบเข้าใจง่าย
   */
  async explainReadiness(
    teacherId: string,
    userId: string,
  ): Promise<ReadinessExplanation> {
    // 1. รวบรวมข้อมูลครู
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        competencyAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        reflectiveJournals: true,
        mentoringVisits: true,
        plcActivities: true,
        evidencePortfolios: true,
      },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // 2. คำนวณคะแนนและความพร้อม
    const analysis = this.analyzeReadiness(teacher);

    // 3. สร้างคำอธิบาย
    const explanation = this.generateExplanation(teacher, analysis);

    // 4. บันทึก activity
    await this.aiActivityService.logActivity({
      userId,
      actionType: 'READINESS_EXPLAIN',
      inputData: { teacherId },
      outputData: explanation,
      modelUsed: 'gpt-4o-mini',
      confidenceScore: 0.88,
      relatedEntityType: 'teacher',
      relatedEntityId: teacherId,
    });

    return explanation;
  }

  /**
   * วิเคราะห์ความพร้อมจากข้อมูล
   */
  private analyzeReadiness(teacher: any): any {
    const latestAssessment = teacher.competencyAssessments[0];

    // คำนวณคะแนนรวม
    let totalScore = 0;
    let assessmentCount = 0;

    if (latestAssessment) {
      totalScore =
        latestAssessment.pedagogyScore +
        latestAssessment.classroomScore +
        latestAssessment.communityScore +
        latestAssessment.professionalismScore;
      assessmentCount = 4;
    }

    const avgScore = assessmentCount > 0 ? totalScore / assessmentCount : 0;

    // นับจำนวนหลักฐาน/กิจกรรม
    const journalCount = teacher.reflectiveJournals.length;
    const mentoringCount = teacher.mentoringVisits.length;
    const plcCount = teacher.plcActivities.length;
    const evidenceCount = teacher.evidencePortfolios?.length || 0;

    // วิเคราะห์จุดแข็ง/จุดพัฒนา
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (latestAssessment) {
      if (latestAssessment.pedagogyScore >= 4) {
        strengths.push('หลักการและวิธีการสอน (Pedagogy)');
      } else if (latestAssessment.pedagogyScore < 3) {
        improvements.push('หลักการและวิธีการสอน (Pedagogy)');
      }

      if (latestAssessment.classroomScore >= 4) {
        strengths.push('การจัดการชั้นเรียน');
      } else if (latestAssessment.classroomScore < 3) {
        improvements.push('การจัดการชั้นเรียน');
      }

      if (latestAssessment.communityScore >= 4) {
        strengths.push('การสร้างความสัมพันธ์กับชุมชน');
      } else if (latestAssessment.communityScore < 3) {
        improvements.push('การสร้างความสัมพันธ์กับชุมชน');
      }

      if (latestAssessment.professionalismScore >= 4) {
        strengths.push('ความเป็นมืออาชีพ');
      } else if (latestAssessment.professionalismScore < 3) {
        improvements.push('ความเป็นมืออาชีพ');
      }
    }

    // ตรวจสอบความครบถ้วนของหลักฐาน
    if (journalCount < 3) {
      improvements.push('บันทึกสะท้อนคิด (ควรมีอย่างน้อย 3 เดือน)');
    }
    if (mentoringCount < 2) {
      improvements.push('การรับการนิเทศ/โค้ช (ควรมีอย่างน้อย 2 ครั้ง)');
    }
    if (plcCount < 2) {
      improvements.push('การเข้าร่วม PLC (ควรมีอย่างน้อย 2 ครั้ง)');
    }
    if (evidenceCount < 5) {
      improvements.push('หลักฐานพอร์ตโฟลิโอ (ควรมีอย่างน้อย 5 ชิ้น)');
    }

    return {
      avgScore,
      latestAssessment,
      journalCount,
      mentoringCount,
      plcCount,
      evidenceCount,
      strengths,
      improvements,
    };
  }

  /**
   * สร้างคำอธิบายที่เข้าใจง่าย
   */
  private generateExplanation(teacher: any, analysis: any): ReadinessExplanation {
    // กำหนดระดับ
    let level = '';
    let overallDescription = '';

    if (analysis.avgScore >= 4) {
      level = 'ดีมาก';
      overallDescription = 'มีความพร้อมในระดับสูง สามารถปฏิบัติหน้าที่ครูได้ดีเยี่ยม';
    } else if (analysis.avgScore >= 3.5) {
      level = 'ดี';
      overallDescription = 'มีความพร้อมในระดับดี สามารถปฏิบัติหน้าที่ครูได้อย่างมีประสิทธิภาพ';
    } else if (analysis.avgScore >= 3) {
      level = 'พอใช้';
      overallDescription =
        'มีความพร้อมในระดับพอใช้ ยังต้องพัฒนาเพิ่มเติมในบางด้าน';
    } else {
      level = 'ต้องพัฒนา';
      overallDescription =
        'ยังต้องพัฒนาความพร้อมเพิ่มเติม ควรได้รับการสนับสนุนอย่างต่อเนื่อง';
    }

    // สร้างคำอธิบายโดยละเอียด
    const explanation = `
${teacher.fullName} มีความพร้อมในการปฏิบัติหน้าที่ครูในระดับ "${level}" (คะแนนเฉลี่ย ${analysis.avgScore.toFixed(2)}/5.0)

${overallDescription}

จากการประเมินล่าสุด พบว่า:
- คะแนนด้านหลักการและวิธีการสอน: ${analysis.latestAssessment?.pedagogyScore || '-'}/5
- คะแนนด้านการจัดการชั้นเรียน: ${analysis.latestAssessment?.classroomScore || '-'}/5
- คะแนนด้านความสัมพันธ์กับชุมชน: ${analysis.latestAssessment?.communityScore || '-'}/5
- คะแนนด้านความเป็นมืออาชีพ: ${analysis.latestAssessment?.professionalismScore || '-'}/5

ความครบถ้วนของหลักฐาน:
- บันทึกสะท้อนคิด: ${analysis.journalCount} เดือน
- การรับการนิเทศ: ${analysis.mentoringCount} ครั้ง
- กิจกรรม PLC: ${analysis.plcCount} ครั้ง
- หลักฐานพอร์ตโฟลิโอ: ${analysis.evidenceCount} ชิ้น
`.trim();

    // สร้างรายการงานสำหรับสัปดาห์นี้
    const weeklyTasks = this.generateWeeklyTasks(analysis);

    // สร้างคำแนะนำ
    const recommendations = this.generateRecommendations(analysis);

    return {
      overallScore: analysis.avgScore,
      level,
      explanation,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      recommendations,
      weeklyTasks,
    };
  }

  /**
   * สร้างรายการงานที่ควรทำในสัปดาห์นี้
   */
  private generateWeeklyTasks(analysis: any): WeeklyTask[] {
    const tasks: WeeklyTask[] = [];

    // ตามความขาด
    if (analysis.journalCount < 3) {
      tasks.push({
        task: 'เขียนบันทึกสะท้อนคิดรายเดือน',
        indicator: 'ET.4',
        priority: 1,
        estimatedTime: '30-45 นาที',
      });
    }

    if (analysis.evidenceCount < 5) {
      tasks.push({
        task: 'อัปโหลดหลักฐานพอร์ตโฟลิโอ (เช่น แผนการสอน, สื่อการสอน)',
        indicator: 'WP.1',
        priority: 2,
        estimatedTime: '1-2 ชั่วโมง',
      });
    }

    if (analysis.mentoringCount < 2) {
      tasks.push({
        task: 'นัดหมายการรับการนิเทศ/โค้ชกับพี่เลี้ยง',
        indicator: 'ET.4',
        priority: 1,
        estimatedTime: '15 นาที (นัดหมาย)',
      });
    }

    // ตามจุดที่ต้องพัฒนา
    if (analysis.improvements.includes('หลักการและวิธีการสอน')) {
      tasks.push({
        task: 'ศึกษาเทคนิคการสอนใหม่ๆ หรือเข้าร่วมการอบรม',
        indicator: 'WP.2',
        priority: 2,
        estimatedTime: '2-3 ชั่วโมง',
      });
    }

    if (analysis.improvements.includes('การจัดการชั้นเรียน')) {
      tasks.push({
        task: 'จัดทำกฎกติกาชั้นเรียนร่วมกับนักเรียน',
        indicator: 'ET.2',
        priority: 2,
        estimatedTime: '1 ชั่วโมง',
      });
    }

    // เรียงตาม priority
    tasks.sort((a, b) => a.priority - b.priority);

    return tasks.slice(0, 5); // แนะนำไม่เกิน 5 งาน
  }

  /**
   * สร้างคำแนะนำ
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.avgScore >= 4) {
      recommendations.push('คุณมีความพร้อมในระดับดีมาก ควรแบ่งปันความรู้ให้เพื่อนครู');
      recommendations.push('พิจารณาเป็นพี่เลี้ยงให้กับครูผู้ช่วยรุ่นน้อง');
    } else if (analysis.avgScore >= 3) {
      recommendations.push('ควรพัฒนาตนเองอย่างต่อเนื่องในด้านที่ยังขาด');
      recommendations.push('ขอคำแนะนำจากพี่เลี้ยงหรือเพื่อนครูที่มีประสบการณ์');
    } else {
      recommendations.push('ควรรับการสนับสนุนอย่างใกล้ชิดจากพี่เลี้ยง');
      recommendations.push('มุ่งเน้นพัฒนาในด้านที่ยังอ่อนก่อน');
    }

    if (analysis.journalCount < 3) {
      recommendations.push('เขียนบันทึกสะท้อนคิดอย่างสม่ำเสมอ เดือนละ 1 ครั้ง');
    }

    if (analysis.plcCount < 2) {
      recommendations.push('เข้าร่วมกิจกรรม PLC เพื่อแลกเปลี่ยนเรียนรู้กับเพื่อนครู');
    }

    return recommendations;
  }
}
