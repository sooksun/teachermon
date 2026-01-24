import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDPACheckResult, PDPAViolation } from './interfaces/ai.interfaces';

/**
 * PDPA Scanner Service
 * ตรวจสอบข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
 * 
 * หมายเหตุสำคัญ:
 * - ไม่ควรระบุชื่อ-นามสกุลนักเรียนในเอกสารราชการ
 * - ใช้ชื่อเล่น หรือ "นักเรียน ก.", "นักเรียน ข." แทน
 * - ไม่ควรมีเลขประจำตัว, ที่อยู่, เบอร์โทรศัพท์นักเรียน
 */
@Injectable()
export class PDPAScannerService {
  private readonly logger = new Logger(PDPAScannerService.name);

  // รูปแบบข้อมูลอ่อนไหวที่ต้องตรวจสอบ
  private readonly SENSITIVE_PATTERNS = [
    // ชื่อนักเรียนแบบเต็ม
    {
      pattern: /(?:นักเรียน|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)\s*(?:ชื่อ\s*)?([ก-๙]{2,}\s+[ก-๙]{2,})/g,
      type: 'STUDENT_FULL_NAME',
      riskLevel: 'HIGH' as const,
      suggestion: 'ใช้ "นักเรียน ก." หรือชื่อเล่นแทน เช่น "นักเรียนชื่อเล่น โจ้"',
    },
    // เลขประจำตัวประชาชน 13 หลัก
    {
      pattern: /\b\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1}\b/g,
      type: 'CITIZEN_ID',
      riskLevel: 'HIGH' as const,
      suggestion: 'ห้ามระบุเลขประจำตัวประชาชนในเอกสาร',
    },
    // เบอร์โทรศัพท์
    {
      pattern: /(?:โทร|Tel|เบอร์|เบอร์โทร|โทรศัพท์)[\s:]*(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4})/g,
      type: 'PHONE_NUMBER',
      riskLevel: 'MEDIUM' as const,
      suggestion: 'ไม่ควรระบุเบอร์โทรศัพท์นักเรียนในเอกสารสาธารณะ',
    },
    // ที่อยู่บ้านเลขที่
    {
      pattern: /บ้านเลขที่\s+\d+\/?\d*/g,
      type: 'HOME_ADDRESS',
      riskLevel: 'MEDIUM' as const,
      suggestion: 'ไม่ควรระบุที่อยู่เฉพาะเจาะจงของนักเรียน',
    },
    // อีเมลนักเรียน
    {
      pattern: /(?:นักเรียน|เด็ก).*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      type: 'EMAIL',
      riskLevel: 'LOW' as const,
      suggestion: 'พิจารณาไม่ระบุอีเมลนักเรียนในเอกสารสาธารณะ',
    },
    // ชื่อโรงเรียนเดิม (อาจระบุตัวตน)
    {
      pattern: /(?:มาจาก|โอนมาจาก|เคยเรียนที่).*?(?:โรงเรียน|โรงเรียน[ก-๙]{3,})/g,
      type: 'PREVIOUS_SCHOOL',
      riskLevel: 'LOW' as const,
      suggestion: 'ถ้าไม่จำเป็น ควรหลีกเลี่ยงการระบุโรงเรียนเดิม',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ตรวจสอบข้อความว่ามีข้อมูลอ่อนไหวหรือไม่
   */
  async checkText(
    text: string,
    userId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<PDPACheckResult> {
    const violations: PDPAViolation[] = [];

    // ตรวจสอบทุก pattern
    for (const patternDef of this.SENSITIVE_PATTERNS) {
      const matches = Array.from(text.matchAll(patternDef.pattern));

      for (const match of matches) {
        violations.push({
          type: patternDef.type,
          pattern: patternDef.pattern.source,
          matchedText: match[0],
          startIndex: match.index!,
          endIndex: match.index! + match[0].length,
          riskLevel: patternDef.riskLevel,
          suggestion: patternDef.suggestion,
        });
      }
    }

    // คำนวณระดับความเสี่ยงรวม
    const riskLevel = this.calculateOverallRisk(violations);

    // สร้างข้อความที่ปลอดภัย (ถ้าจำเป็น)
    const sanitizedText = violations.length > 0 ? this.sanitizeText(text, violations) : undefined;

    // เก็บ log ใน database
    await this.logPDPACheck(userId, sourceType, sourceId, text, riskLevel, violations, sanitizedText);

    const result: PDPACheckResult = {
      isSafe: riskLevel === 'SAFE',
      riskLevel,
      violations,
      sanitizedText,
      suggestions: this.generateSuggestions(violations),
    };

    this.logger.log(
      `PDPA Check: ${sourceType}/${sourceId} - Risk: ${riskLevel}, Violations: ${violations.length}`,
    );

    return result;
  }

  /**
   * คำนวณระดับความเสี่ยงรวม
   */
  private calculateOverallRisk(
    violations: PDPAViolation[],
  ): 'SAFE' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' {
    if (violations.length === 0) return 'SAFE';

    const hasHigh = violations.some((v) => v.riskLevel === 'HIGH');
    const hasMedium = violations.some((v) => v.riskLevel === 'MEDIUM');

    if (hasHigh) return 'HIGH_RISK';
    if (hasMedium) return 'MEDIUM_RISK';
    return 'LOW_RISK';
  }

  /**
   * สร้างข้อความที่ปลอดภัย (ซ่อนข้อมูลอ่อนไหว)
   */
  private sanitizeText(text: string, violations: PDPAViolation[]): string {
    let sanitized = text;

    // เรียงจากตำแหน่งท้ายไปหน้า เพื่อไม่ให้ index เปลี่ยน
    const sorted = [...violations].sort((a, b) => b.startIndex - a.startIndex);

    for (const violation of sorted) {
      const replacement = this.getReplacementText(violation.type);
      sanitized =
        sanitized.substring(0, violation.startIndex) +
        replacement +
        sanitized.substring(violation.endIndex);
    }

    return sanitized;
  }

  /**
   * กำหนดข้อความแทนที่สำหรับแต่ละประเภท
   */
  private getReplacementText(type: string): string {
    const replacements: Record<string, string> = {
      STUDENT_FULL_NAME: 'นักเรียน [ระบุชื่อเล่น]',
      CITIZEN_ID: '[เลขประจำตัว]',
      PHONE_NUMBER: '[เบอร์โทรศัพท์]',
      HOME_ADDRESS: '[ที่อยู่]',
      EMAIL: '[อีเมล]',
      PREVIOUS_SCHOOL: '[โรงเรียนเดิม]',
    };

    return replacements[type] || '[ข้อมูลส่วนบุคคล]';
  }

  /**
   * สร้างข้อเสนอแนะ
   */
  private generateSuggestions(violations: PDPAViolation[]): string[] {
    const suggestions = new Set<string>();

    // เพิ่มข้อแนะนำจาก violations
    for (const violation of violations) {
      suggestions.add(violation.suggestion);
    }

    // เพิ่มข้อแนะนำทั่วไป
    if (violations.length > 0) {
      suggestions.add('ตรวจสอบให้แน่ใจว่าไม่มีข้อมูลส่วนบุคคลของนักเรียนก่อนบันทึก');
      suggestions.add('หากจำเป็นต้องอ้างถึงนักเรียน ควรใช้ชื่อเล่นหรือ "นักเรียน ก., ข., ค."');
    }

    return Array.from(suggestions);
  }

  /**
   * บันทึก log การตรวจ PDPA
   */
  private async logPDPACheck(
    userId: string,
    sourceType: string,
    sourceId: string,
    originalText: string,
    riskLevel: string,
    violations: PDPAViolation[],
    sanitizedText?: string,
  ): Promise<void> {
    try {
      await this.prisma.pDPAAudit.create({
        data: {
          sourceType,
          sourceId,
          originalText,
          riskLevel: riskLevel as any,
          violations: violations as any,
          sanitizedText,
          wasAutoFixed: !!sanitizedText,
          checkedBy: userId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log PDPA check', error);
    }
  }

  /**
   * ดึงประวัติการตรวจ PDPA
   */
  async getAuditHistory(sourceType: string, sourceId: string) {
    return this.prisma.pDPAAudit.findMany({
      where: { sourceType, sourceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * ยืนยันว่าได้รับทราบความเสี่ยง PDPA แล้ว
   */
  async acknowledgeRisk(auditId: string, userId: string) {
    return this.prisma.pDPAAudit.update({
      where: { id: auditId },
      data: {
        isAcknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });
  }
}
