import { Injectable, Logger } from '@nestjs/common';
import { JournalImproveResult, ReflectionPromptResult } from './interfaces/ai.interfaces';
import { AIActivityService } from './ai-activity.service';
import { PDPAScannerService } from './pdpa-scanner.service';
import { GeminiAIProvider } from './providers/gemini-ai.provider';

/**
 * Journal AI Service
 * ช่วยครูในการเขียนบันทึกสะท้อนคิด (Reflective Journal)
 * 
 * คำเตือน: AI เป็นเพียงผู้ช่วยเสนอแนะ ครูต้องตรวจสอบและปรับแก้เอง
 */
@Injectable()
export class JournalAIService {
  private readonly logger = new Logger(JournalAIService.name);

  constructor(
    private readonly geminiAI: GeminiAIProvider,
    private readonly aiActivityService: AIActivityService,
    private readonly pdpaScanner: PDPAScannerService,
  ) {}

  /**
   * ปรับปรุงภาษาให้เป็นทางการ เหมาะสำหรับบันทึกครู
   * 
   * ตัวอย่าง Input: "วันนี้สอนเรื่องเศษส่วน เด็กๆ เข้าใจดี แต่มีบางคนยังสับสน"
   * ตัวอย่าง Output: "ในวันนี้ได้จัดการเรียนรู้เรื่องเศษส่วน โดยภาพรวมนักเรียนสามารถเข้าใจแนวคิดได้ดี 
   *                   อย่างไรก็ตามยังพบว่านักเรียนบางส่วนยังมีความสับสนในการแยกแยะเศษส่วน..."
   */
  async improveLanguage(
    input: string,
    userId: string,
    context?: { indicatorCode?: string; focusArea?: string },
  ): Promise<JournalImproveResult> {
    // ตรวจสอบว่า AI enabled หรือไม่
    if (!this.geminiAI.isAIEnabled()) {
      const errorMsg = 'AI is not enabled. Please configure GEMINI_API_KEY in .env file.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 1. ตรวจ PDPA ก่อน
    const pdpaCheck = await this.pdpaScanner.checkText(
      input,
      userId,
      'journal_draft',
      'temp-' + Date.now(),
    );

    if (pdpaCheck.riskLevel === 'HIGH_RISK') {
      this.logger.warn(`HIGH PDPA RISK detected in journal input by user ${userId}`);
    }

    // 2. เรียกใช้ Gemini AI (จะ throw error ถ้าเกิดปัญหา)
    const improvedText = await this.geminiAI.improveLanguage(input, context);

    // 3. สร้างข้อเสนอแนะ
    const suggestions = this.generateImprovementSuggestions(input, improvedText);

    // 4. บันทึก activity
    await this.aiActivityService.logActivity({
      userId,
      actionType: 'JOURNAL_IMPROVE',
      inputData: { original: input, context },
      outputData: { improved: improvedText, suggestions },
      modelUsed: this.geminiAI.getModelName(),
      confidenceScore: 0.85,
    });

    return {
      improvedText,
      suggestions,
      confidenceScore: 0.85,
      model: this.geminiAI.getModelName(),
    };
  }

  /**
   * ปรับปรุงภาษาหลายช่องพร้อมกัน
   * รับ fields เป็น object { reflectionText, successStory, difficulty, supportRequest }
   * ปรับภาษาทุกช่องที่มีข้อมูล
   */
  async improveMultipleFields(
    fields: Record<string, string>,
    userId: string,
    context?: { indicatorCode?: string; focusArea?: string },
  ): Promise<{
    improvedFields: Record<string, string>;
    suggestions: string[];
    confidenceScore: number;
    model: string;
  }> {
    if (!this.geminiAI.isAIEnabled()) {
      const errorMsg = 'AI is not enabled. Please configure GEMINI_API_KEY in .env file.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const fieldLabels: Record<string, string> = {
      reflectionText: 'การสะท้อนตนเอง',
      successStory: 'เรื่องเล่าความสำเร็จ',
      difficulty: 'ความท้าทาย/ปัญหาที่พบ',
      supportRequest: 'ต้องการความช่วยเหลือ',
    };

    // 1. ตรวจ PDPA ทุกช่อง
    const allText = Object.values(fields).join('\n\n');
    const pdpaCheck = await this.pdpaScanner.checkText(
      allText,
      userId,
      'journal_draft',
      'temp-' + Date.now(),
    );

    if (pdpaCheck.riskLevel === 'HIGH_RISK') {
      this.logger.warn(`HIGH PDPA RISK detected in journal multi-field input by user ${userId}`);
    }

    // 2. ปรับภาษาแต่ละช่อง
    const improvedFields: Record<string, string> = {};
    const allSuggestions: string[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (!value || value.trim().length < 5) continue;

      try {
        const improved = await this.geminiAI.improveLanguage(value, {
          ...context,
          focusArea: fieldLabels[key] || key,
        });
        improvedFields[key] = improved;

        const fieldSuggestions = this.generateImprovementSuggestions(value, improved);
        allSuggestions.push(...fieldSuggestions.slice(0, 1));
      } catch (err) {
        this.logger.error(`Failed to improve field ${key}: ${err}`);
        // ข้ามช่องที่ error ไม่ต้องหยุดทั้งหมด
        improvedFields[key] = value;
      }
    }

    // 3. เพิ่ม suggestions ถ้ามีช่องว่าง
    const emptyFieldNames = Object.entries(fieldLabels)
      .filter(([key]) => !fields[key] || !fields[key].trim())
      .map(([, label]) => label);

    if (emptyFieldNames.length > 0) {
      allSuggestions.unshift(`ยังไม่ได้กรอก: ${emptyFieldNames.join(', ')} - แนะนำให้กรอกทุกช่องเพื่อบันทึกที่สมบูรณ์`);
    }

    // 4. ลบ suggestions ซ้ำ
    const uniqueSuggestions = [...new Set(allSuggestions)];

    // 5. บันทึก activity
    await this.aiActivityService.logActivity({
      userId,
      actionType: 'JOURNAL_IMPROVE_MULTI',
      inputData: { originalFields: fields, context },
      outputData: { improvedFields, suggestions: uniqueSuggestions },
      modelUsed: this.geminiAI.getModelName(),
      confidenceScore: 0.85,
    });

    return {
      improvedFields,
      suggestions: uniqueSuggestions,
      confidenceScore: 0.85,
      model: this.geminiAI.getModelName(),
    };
  }

  /**
   * แนะนำคำถามสะท้อนคิดตาม Indicator
   */
  async suggestReflectionPrompts(
    indicatorCode: string,
    userId: string,
  ): Promise<ReflectionPromptResult> {
    const prompts = this.getPromptsForIndicator(indicatorCode);

    // บันทึก activity
    await this.aiActivityService.logActivity({
      userId,
      actionType: 'JOURNAL_SUGGEST',
      inputData: { indicatorCode },
      outputData: prompts,
      modelUsed: 'rule-based',
    });

    return prompts;
  }

  /**
   * สร้างข้อเสนอแนะ
   */
  private generateImprovementSuggestions(original: string, improved: string): string[] {
    const suggestions: string[] = [];

    if (original !== improved) {
      suggestions.push('ปรับปรุงภาษาให้เป็นทางการมากขึ้น');
    }

    if (original.includes('เด็ก') || original.includes('เด็กๆ')) {
      suggestions.push('เปลี่ยนจาก "เด็ก" เป็น "นักเรียน" เพื่อความเป็นทางการ');
    }

    if (original.length < 50) {
      suggestions.push('ควรเพิ่มรายละเอียดเพื่อให้บันทึกมีความสมบูรณ์');
    }

    suggestions.push('ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก');
    suggestions.push('พิจารณาเพิ่มตัวอย่างเฉพาะจากการเรียนการสอนจริง');

    return suggestions;
  }

  /**
   * คำถามสะท้อนคิดตาม Indicator (Knowledge Base)
   */
  private getPromptsForIndicator(indicatorCode: string): ReflectionPromptResult {
    const promptsMap: Record<string, ReflectionPromptResult> = {
      WP_1: {
        prompts: [
          'วันนี้ฉันออกแบบกิจกรรมการเรียนรู้อย่างไรให้สอดคล้องกับจุดประสงค์การเรียนรู้?',
          'สื่อและแหล่งเรียนรู้ที่ใช้วันนี้เหมาะสมกับนักเรียนหรือไม่? เพราะเหตุใด?',
          'นักเรียนมีส่วนร่วมในการออกแบบกิจกรรมการเรียนรู้ในระดับใด?',
          'หากต้องสอนบทเรียนนี้อีกครั้ง ฉันจะปรับแผนการสอนอย่างไร?',
        ],
        relatedIndicators: ['WP.2', 'WP.3'],
        focusAreas: ['การออกแบบการเรียนรู้', 'สื่อการสอน', 'กิจกรรมการเรียนรู้'],
      },
      WP_2: {
        prompts: [
          'นักเรียนได้แสดงความคิดเห็นและตั้งคำถามมากน้อยเพียงใด?',
          'ฉันใช้วิธีการใดเพื่อกระตุ้นให้นักเรียนคิดวิเคราะห์?',
          'นักเรียนที่มีความสามารถแตกต่างกันได้รับการดูแลอย่างเหมาะสมหรือไม่?',
          'บรรยากาศในชั้นเรียนเอื้อต่อการเรียนรู้หรือไม่? อย่างไร?',
        ],
        relatedIndicators: ['WP.1', 'ET.2'],
        focusAreas: ['การจัดการเรียนรู้', 'การมีส่วนร่วม', 'บรรยากาศชั้นเรียน'],
      },
      WP_3: {
        prompts: [
          'วิธีการวัดและประเมินผลที่ใช้วันนี้สอดคล้องกับจุดประสงค์การเรียนรู้หรือไม่?',
          'ผลการประเมินสะท้อนให้เห็นความก้าวหน้าของนักเรียนอย่างไร?',
          'ฉันให้ข้อมูลย้อนกลับ (feedback) แก่นักเรียนอย่างไรบ้าง?',
          'นักเรียนได้ประเมินตนเองหรือประเมินเพื่อนหรือไม่? เป็นอย่างไร?',
        ],
        relatedIndicators: ['WP.1', 'WP.2'],
        focusAreas: ['การวัดผล', 'การประเมินผล', 'การให้ข้อมูลย้อนกลับ'],
      },
      ET_1: {
        prompts: [
          'วันนี้ฉันแสดงออกถึงความเป็นครูที่ดีอย่างไร?',
          'ฉันสร้างความสัมพันธ์ที่ดีกับนักเรียนอย่างไร?',
          'ฉันเป็นแบบอย่างที่ดีให้กับนักเรียนในเรื่องใด?',
          'ฉันจัดการกับสถานการณ์ที่ท้าทายอย่างไร?',
        ],
        relatedIndicators: ['ET.2', 'ET.4'],
        focusAreas: ['ความเป็นครู', 'จรรยาบรรณ', 'การเป็นแบบอย่าง'],
      },
      ET_2: {
        prompts: [
          'ฉันจัดการชั้นเรียนอย่างไรเพื่อให้เกิดบรรยากาศที่เอื้อต่อการเรียนรู้?',
          'เมื่อมีปัญหาเกิดขึ้นในชั้นเรียน ฉันจัดการอย่างไร?',
          'นักเรียนมีส่วนร่วมในการกำหนดกฎกติกาของชั้นเรียนหรือไม่?',
          'การจัดการเวลาและทรัพยากรในชั้นเรียนเป็นอย่างไร?',
        ],
        relatedIndicators: ['WP.2', 'ET.1'],
        focusAreas: ['การจัดการชั้นเรียน', 'วินัย', 'บรรยากาศ'],
      },
      ET_3: {
        prompts: [
          'ฉันแบ่งปันความรู้และประสบการณ์กับเพื่อนครูอย่างไร?',
          'ฉันมีส่วนร่วมในการพัฒนาวิชาการของโรงเรียนอย่างไร?',
          'ฉันนำความรู้ใหม่ๆ มาใช้ในการเรียนการสอนอย่างไร?',
          'ฉันช่วยเหลือเพื่อนครูหรือรับคำแนะนำจากผู้อื่นอย่างไร?',
        ],
        relatedIndicators: ['ET.4', 'WP.1'],
        focusAreas: ['ภาวะผู้นำ', 'การแบ่งปัน', 'ชุมชนการเรียนรู้'],
      },
      ET_4: {
        prompts: [
          'วันนี้ฉันได้เรียนรู้สิ่งใหม่อะไรบ้าง?',
          'ฉันพัฒนาตนเองในด้านใดบ้างในสัปดาห์นี้?',
          'ฉันมีแผนในการพัฒนาตนเองอย่างไรในเดือนหน้า?',
          'ฉันขอคำแนะนำหรือข้อมูลย้อนกลับจากใครบ้าง?',
        ],
        relatedIndicators: ['ET.1', 'ET.3'],
        focusAreas: ['การพัฒนาตนเอง', 'การเรียนรู้', 'การไตร่ตรอง'],
      },
    };

    return (
      promptsMap[indicatorCode] || {
        prompts: ['วันนี้การสอนเป็นอย่างไร?', 'มีอะไรที่น่าประทับใจ?', 'มีอะไรที่ต้องปรับปรุง?'],
        relatedIndicators: [],
        focusAreas: ['ทั่วไป'],
      }
    );
  }
}
