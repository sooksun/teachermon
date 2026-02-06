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

    if (!apiKey || apiKey === 'your-gemini-api-key-here' || apiKey.trim() === '') {
      this.logger.error('GEMINI_API_KEY not configured or invalid. AI features will be disabled.');
      this.logger.error('Please set GEMINI_API_KEY in .env file to enable AI features.');
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
      const errorMsg = 'AI is disabled. GEMINI_API_KEY is not configured or invalid.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Failed to generate AI response: ' + errorMessage);
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
      // ถ้า parse ไม่ได้ ให้ throw error (ไม่ fallback)
      throw new Error('Failed to parse AI response as JSON. AI returned invalid format.');
    }

    // ถ้าไม่พบ JSON ใน response ให้ throw error
    throw new Error('AI response does not contain valid JSON format.');
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
- WP_1: การออกแบบการจัดการเรียนรู้ (แผนการสอน, สื่อการสอน, การออกแบบกิจกรรม)
- WP_2: การจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ (ภาพกิจกรรม, วิดีโอการสอน, ผลงานนักเรียน)
- WP_3: การวัดและประเมินผล (แบบทดสอบ, ผลการประเมิน, การให้ feedback)
- ET_1: ความเป็นครู (บันทึกสะท้อนตนเอง, ใบประกาศ, การเข้าร่วมชุมชน)
- ET_2: การจัดการชั้นเรียน (ภาพบรรยากาศ, แผนการจัดการพฤติกรรม, การดูแลนักเรียน)
- ET_3: ภาวะผู้นำทางวิชาการ (การเป็นวิทยากร, การนำเสนอใน PLC, งานวิจัย)
- ET_4: การพัฒนาตนเอง (ใบประกาศการอบรม, แผนพัฒนาตนเอง, การเรียนรู้)

ให้สร้างการวิเคราะห์ในรูปแบบ JSON:
{
  "summary": "สรุปสั้นๆ 1 ประโยค",
  "keywords": ["คำสำคัญ 1", "คำสำคัญ 2", ...],
  "suggestedIndicators": ["WP_1", "WP_2", ...]
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
      // ถ้า parse ไม่ได้ ให้ throw error (ไม่ fallback)
      throw new Error('Failed to parse AI response as JSON. AI returned invalid format.');
    }

    // ถ้าไม่พบ JSON ใน response ให้ throw error
    throw new Error('AI response does not contain valid JSON format.');
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
