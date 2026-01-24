import { Injectable, Logger } from '@nestjs/common';
import { EvidenceSummaryResult, EvidenceQualityCheck } from './interfaces/ai.interfaces';
import { AIActivityService } from './ai-activity.service';
import { GeminiAIProvider } from './providers/gemini-ai.provider';

/**
 * Evidence AI Service
 * ช่วยสรุป วิเคราะห์ และจัดการหลักฐานพอร์ตโฟลิโอ
 * 
 * คำเตือน: AI เป็นเพียงผู้ช่วยเสนอแนะ ครูต้องตรวจสอบและยืนยันเอง
 */
@Injectable()
export class EvidenceAIService {
  private readonly logger = new Logger(EvidenceAIService.name);

  constructor(
    private readonly geminiAI: GeminiAIProvider,
    private readonly aiActivityService: AIActivityService,
  ) {}

  /**
   * สรุปเนื้อหาจากชื่อไฟล์และ metadata
   * (ในการใช้จริงจะใช้ OCR/PDF parsing เพื่ออ่านเนื้อหาจริง)
   */
  async summarizeEvidence(
    filename: string,
    fileType: string,
    userId: string,
  ): Promise<EvidenceSummaryResult> {
    // ใช้ Gemini AI วิเคราะห์
    let analysis;
    try {
      analysis = await this.geminiAI.analyzeEvidence(filename);
    } catch (error) {
      this.logger.warn('Gemini AI failed, using fallback analysis');
      analysis = this.analyzeFromFilename(filename);
    }

    // สร้างชื่อไฟล์มาตรฐาน
    const suggestedFilename = this.generateStandardFilename(analysis);

    // ตรวจคุณภาพเบื้องต้น
    const qualityCheck = this.performQualityCheck(analysis);

    // สร้างข้อเสนอแนะ
    const suggestions = this.generateSuggestions(analysis, qualityCheck);

    const result: EvidenceSummaryResult = {
      summary: analysis.summary,
      keywords: analysis.keywords,
      suggestedIndicators: analysis.indicators,
      suggestedFilename,
      qualityCheck,
      suggestions,
    };

    // บันทึก activity
    await this.aiActivityService.logActivity({
      userId,
      actionType: 'EVIDENCE_SUMMARY',
      inputData: { filename, fileType },
      outputData: result,
      modelUsed: this.geminiAI.getModelName(),
      confidenceScore: 0.75,
    });

    return result;
  }

  /**
   * วิเคราะห์จากชื่อไฟล์
   */
  private analyzeFromFilename(filename: string): any {
    const lower = filename.toLowerCase();
    const keywords: string[] = [];
    const indicators: string[] = [];
    let summary = '';
    let evidenceType = '';

    // ตรวจหาประเภทหลักฐาน
    if (lower.includes('แผนการสอน') || lower.includes('lesson plan')) {
      evidenceType = 'LESSON_PLAN';
      keywords.push('แผนการสอน', 'การออกแบบการเรียนรู้');
      indicators.push('WP.1');
      summary = 'แผนการสอนที่แสดงการออกแบบกิจกรรมการเรียนรู้';
    }

    if (lower.includes('สื่อ') || lower.includes('media')) {
      evidenceType = 'TEACHING_MEDIA';
      keywords.push('สื่อการสอน', 'นวัตกรรม');
      indicators.push('WP.1', 'WP.2');
      summary = 'สื่อการสอนที่ใช้ในการจัดการเรียนการสอน';
    }

    if (lower.includes('แบบทดสอบ') || lower.includes('test') || lower.includes('assessment')) {
      evidenceType = 'ASSESSMENT';
      keywords.push('การวัดผล', 'การประเมินผล');
      indicators.push('WP.3');
      summary = 'เครื่องมือวัดและประเมินผลการเรียนรู้';
    }

    if (lower.includes('ผลงานนักเรียน') || lower.includes('student work')) {
      evidenceType = 'STUDENT_WORK';
      keywords.push('ผลงานนักเรียน', 'ชิ้นงาน');
      indicators.push('WP.2', 'WP.3');
      summary = 'ผลงานของนักเรียนที่แสดงการเรียนรู้';
    }

    if (lower.includes('ภาพ') || lower.includes('photo') || lower.includes('.jpg') || lower.includes('.png')) {
      evidenceType = 'CLASSROOM_PHOTO';
      keywords.push('ภาพกิจกรรม', 'บรรยากาศชั้นเรียน');
      indicators.push('WP.2');
      summary = 'ภาพกิจกรรมการเรียนการสอนในชั้นเรียน';
    }

    if (lower.includes('วิจัย') || lower.includes('research')) {
      evidenceType = 'ACTION_RESEARCH';
      keywords.push('การวิจัยในชั้นเรียน', 'การพัฒนา');
      indicators.push('ET.3', 'ET.4');
      summary = 'งานวิจัยในชั้นเรียนเพื่อพัฒนาการเรียนการสอน';
    }

    // หาวิชา
    const subjects = ['คณิตศาสตร์', 'วิทยาศาสตร์', 'ภาษาไทย', 'ภาษาอังกฤษ', 'สังคม'];
    for (const subject of subjects) {
      if (lower.includes(subject.toLowerCase())) {
        keywords.push(subject);
      }
    }

    // หาระดับชั้น
    const grades = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3'];
    for (const grade of grades) {
      if (lower.includes(grade)) {
        keywords.push(grade);
      }
    }

    if (!summary) {
      summary = 'เอกสารหลักฐานเกี่ยวกับการจัดการเรียนการสอน';
      evidenceType = 'OTHER';
    }

    return {
      summary,
      keywords,
      indicators,
      evidenceType,
    };
  }

  /**
   * สร้างชื่อไฟล์มาตรฐาน
   * รูปแบบ: {Indicator}_{ประเภท}_{วิชา}_{ระดับชั้น}_{วันที่}.{ext}
   */
  private generateStandardFilename(analysis: any): string {
    const indicator = analysis.indicators[0] || 'WP1';
    const type = this.getTypeShortName(analysis.evidenceType);
    const subject = analysis.keywords.find((k: string) =>
      ['คณิตศาสตร์', 'วิทยาศาสตร์', 'ภาษาไทย', 'ภาษาอังกฤษ', 'สังคม'].includes(k),
    );
    const grade = analysis.keywords.find((k: string) => k.match(/^[ปม]\.\d$/));
    const date = new Date().toISOString().split('T')[0];

    const parts = [
      indicator.replace('.', ''),
      type,
      subject,
      grade,
      date,
    ].filter(Boolean);

    return parts.join('_') + '.pdf';
  }

  /**
   * แปลง evidence type เป็นชื่อสั้น
   */
  private getTypeShortName(type: string): string {
    const map: Record<string, string> = {
      LESSON_PLAN: 'แผนการสอน',
      TEACHING_MEDIA: 'สื่อ',
      ASSESSMENT: 'แบบทดสอบ',
      STUDENT_WORK: 'ผลงานนร',
      CLASSROOM_PHOTO: 'ภาพกิจกรรม',
      ACTION_RESEARCH: 'วิจัย',
      OTHER: 'เอกสาร',
    };
    return map[type] || 'เอกสาร';
  }

  /**
   * ตรวจคุณภาพเบื้องต้น
   */
  private performQualityCheck(analysis: any): EvidenceQualityCheck {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // ตรวจตามประเภท
    if (analysis.evidenceType === 'LESSON_PLAN') {
      // แผนการสอนควรมี...
      recommendations.push('ตรวจสอบว่ามี: วัตถุประสงค์, ขั้นตอนการสอน, การวัดผล');
    }

    if (analysis.evidenceType === 'TEACHING_MEDIA') {
      recommendations.push('สื่อควรเหมาะสมกับวัยและระดับนักเรียน');
    }

    if (analysis.evidenceType === 'ASSESSMENT') {
      recommendations.push('แบบทดสอบควรครอบคลุมจุดประสงค์การเรียนรู้');
    }

    // ตรวจความสมบูรณ์
    let completeness = 60; // base score

    if (analysis.keywords.length >= 3) completeness += 20;
    if (analysis.indicators.length > 0) completeness += 20;

    return {
      completeness,
      issues,
      recommendations,
    };
  }

  /**
   * สร้างข้อเสนอแนะ
   */
  private generateSuggestions(analysis: any, qualityCheck: EvidenceQualityCheck): string[] {
    const suggestions: string[] = [];

    if (analysis.indicators.length === 0) {
      suggestions.push('ควรระบุ Indicator ที่เกี่ยวข้อง (เช่น WP.1, ET.2)');
    }

    if (analysis.keywords.length < 3) {
      suggestions.push('ควรเพิ่มรายละเอียด เช่น วิชา ระดับชั้น หรือหัวข้อเรื่อง');
    }

    suggestions.push(...qualityCheck.recommendations);
    suggestions.push('ตรวจสอบว่าไฟล์ไม่มีข้อมูลส่วนบุคคลของนักเรียน');

    return suggestions;
  }
}
