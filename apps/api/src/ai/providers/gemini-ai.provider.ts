import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * Gemini AI Provider
 * ใช้ Google Gemini API สำหรับ AI Features
 */
@Injectable()
export class GeminiAIProvider {
  private readonly logger = new Logger(GeminiAIProvider.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const modelName = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash-exp');
    this.isEnabled = this.configService.get<boolean>('AI_ENABLED', true);

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      this.logger.warn('GEMINI_API_KEY not configured. AI features will use mock responses.');
      this.isEnabled = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: modelName });
      this.logger.log(`Gemini AI initialized with model: ${modelName}`);
    } catch (error) {
      this.logger.error('Failed to initialize Gemini AI', error);
      this.isEnabled = false;
    }
  }

  /**
   * สร้าง text จาก prompt
   */
  async generateText(prompt: string): Promise<{
    text: string;
    tokensUsed?: number;
    model: string;
  }> {
    if (!this.isEnabled) {
      this.logger.warn('AI is disabled. Returning mock response.');
      return {
        text: '[Mock AI Response] ' + prompt.substring(0, 100),
        model: 'mock',
      };
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Gemini API ไม่ return token count โดยตรง
      // ประมาณจากความยาวข้อความ (1 token ≈ 4 characters)
      const estimatedTokens = Math.ceil((prompt.length + text.length) / 4);

      return {
        text,
        tokensUsed: estimatedTokens,
        model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash-exp'),
      };
    } catch (error) {
      this.logger.error('Gemini API error', error);
      throw new Error('Failed to generate AI response: ' + error.message);
    }
  }

  /**
   * ปรับปรุงภาษาให้เป็นทางการ
   */
  async improveLanguage(
    text: string,
    context?: { indicatorCode?: string; focusArea?: string },
  ): Promise<string> {
    const prompt = `คุณคือผู้ช่วยครูที่เชี่ยวชาญด้านการเขียนบันทึกสะท้อนคิด

งาน: ปรับปรุงข้อความนี้ให้เป็นภาษาไทยที่เป็นทางการ เหมาะสำหรับบันทึกครู

ข้อความต้นฉบับ:
"${text}"

${context?.indicatorCode ? `บริบท: Indicator ${context.indicatorCode}` : ''}
${context?.focusArea ? `จุดเน้น: ${context.focusArea}` : ''}

เงื่อนไข:
1. ใช้ภาษาไทยที่สุภาพ เป็นทางการ แต่อ่านง่าย
2. คงความหมายเดิม
3. ไม่ระบุชื่อนักเรียนเต็ม (ใช้ "นักเรียน ก." แทน)
4. ยาวประมาณ 3-5 ประโยค
5. เพิ่มรายละเอียดเล็กน้อยเพื่อให้สมบูรณ์

ตอบเฉพาะข้อความที่ปรับปรุงแล้วเท่านั้น ไม่ต้องอธิบาย:`;

    const result = await this.generateText(prompt);
    return result.text.trim();
  }

  /**
   * สรุปรายงานการนิเทศ
   */
  async summarizeMentoringVisit(data: {
    teacherName: string;
    schoolName: string;
    visitDate: string;
    visitType: string;
    focusArea: string;
    strengths?: string;
    challenges?: string;
    suggestions?: string;
  }): Promise<{
    summary: string;
    strengths: string[];
    improvements: string[];
    followUpTasks: string[];
  }> {
    const prompt = `คุณคือผู้เชี่ยวชาญด้านการนิเทศการสอน

งาน: สรุปการนิเทศเป็นรายงานแบบราชการ

ข้อมูล:
- ครู: ${data.teacherName}
- โรงเรียน: ${data.schoolName}
- วันที่: ${data.visitDate}
- ประเภท: ${data.visitType}
- จุดเน้น: ${data.focusArea}

จุดเด่นที่สังเกตได้:
${data.strengths || 'ไม่ได้ระบุ'}

ปัญหา/อุปสรรค:
${data.challenges || 'ไม่ได้ระบุ'}

ข้อเสนอแนะ:
${data.suggestions || 'ไม่ได้ระบุ'}

ให้สร้างรายงานในรูปแบบ JSON:
{
  "summary": "สรุปโดยรวม 2-3 ประโยค",
  "strengths": ["จุดเด่น 1", "จุดเด่น 2", ...],
  "improvements": ["จุดที่ควรพัฒนา 1", "จุดที่ควรพัฒนา 2", ...],
  "followUpTasks": ["งานติดตาม 1", "งานติดตาม 2", ...]
}

ตอบเฉพาะ JSON เท่านั้น:`;

    const result = await this.generateText(prompt);
    
    try {
      // แยก JSON จากข้อความ
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.logger.error('Failed to parse Gemini response as JSON', error);
    }

    // Fallback
    return {
      summary: result.text.substring(0, 200),
      strengths: ['ตรวจสอบจากบันทึกการนิเทศ'],
      improvements: ['ตรวจสอบจากบันทึกการนิเทศ'],
      followUpTasks: ['ติดตามผลในครั้งถัดไป'],
    };
  }

  /**
   * วิเคราะห์หลักฐาน
   */
  async analyzeEvidence(filename: string): Promise<{
    summary: string;
    keywords: string[];
    suggestedIndicators: string[];
  }> {
    const prompt = `คุณคือผู้เชี่ยวชาญด้านการจัดการหลักฐานพอร์ตโฟลิโอครู

งาน: วิเคราะห์ชื่อไฟล์และแนะนำการจัดหมวดหมู่

ชื่อไฟล์: "${filename}"

Indicators ที่มี:
- WP.1: การออกแบบการเรียนรู้
- WP.2: การจัดการเรียนรู้
- WP.3: การวัดและประเมินผล
- ET.1: ความเป็นครู
- ET.2: การจัดการชั้นเรียน
- ET.3: ภาวะผู้นำ
- ET.4: การพัฒนาตนเอง

ให้สร้างการวิเคราะห์ในรูปแบบ JSON:
{
  "summary": "สรุปสั้นๆ 1 ประโยค",
  "keywords": ["คำสำคัญ 1", "คำสำคัญ 2", ...],
  "suggestedIndicators": ["WP.1", "WP.2", ...]
}

ตอบเฉพาะ JSON เท่านั้น:`;

    const result = await this.generateText(prompt);

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.logger.error('Failed to parse Gemini response', error);
    }

    // Fallback
    return {
      summary: 'เอกสารหลักฐานเกี่ยวกับการจัดการเรียนการสอน',
      keywords: ['เอกสาร'],
      suggestedIndicators: ['WP.1'],
    };
  }

  /**
   * ตรวจสอบว่า AI พร้อมใช้งานหรือไม่
   */
  isAIEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * ดึงชื่อ model ที่ใช้
   */
  getModelName(): string {
    return this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash-exp');
  }
}
