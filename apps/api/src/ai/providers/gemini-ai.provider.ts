import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

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
  private apiKey: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.apiKey = apiKey || '';
    const modelName = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash');
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
        model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash'),
      };
    } catch (error) {
      this.logger.error('Gemini API error', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Failed to generate AI response: ' + errorMessage);
    }
  }

  /**
   * วิเคราะห์ไฟล์สื่อ (video/image) ด้วย Gemini multimodal
   * - ไฟล์ ≤ 20MB: ส่งเป็น inline base64
   * - ไฟล์ > 20MB: ใช้ Gemini File API upload แล้ววิเคราะห์
   */
  async generateWithMedia(
    prompt: string,
    filePath: string,
    mimeType: string,
  ): Promise<{ text: string; tokensUsed?: number; model: string }> {
    if (!this.isEnabled) {
      throw new Error('AI is disabled. GEMINI_API_KEY is not configured.');
    }

    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    const INLINE_LIMIT = 20 * 1024 * 1024; // 20 MB

    if (fileSize <= INLINE_LIMIT) {
      // ── Small file → inline base64 ──
      this.logger.log(`Analyzing file inline (${(fileSize / 1024 / 1024).toFixed(1)} MB): ${path.basename(filePath)}`);
      const data = await fs.readFile(filePath);
      const base64 = data.toString('base64');

      const result = await this.model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        { text: prompt },
      ]);
      const response = await result.response;
      return { text: response.text(), model: this.getModelName() };
    }

    // ── Large file → Gemini File API ──
    this.logger.log(`Uploading large file via File API (${(fileSize / 1024 / 1024).toFixed(1)} MB): ${path.basename(filePath)}`);
    const fileManager = new GoogleAIFileManager(this.apiKey);

    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName: path.basename(filePath),
    });

    // Wait until Gemini finishes processing the file
    let file = uploadResult.file;
    let waitMs = 5000;
    const maxWait = 10 * 60 * 1000; // 10 minutes max
    let totalWait = 0;

    while (file.state === FileState.PROCESSING) {
      if (totalWait >= maxWait) {
        throw new Error('File processing timeout (10 min)');
      }
      this.logger.log(`File still processing... waiting ${waitMs / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      totalWait += waitMs;
      file = await fileManager.getFile(file.name);
      waitMs = Math.min(waitMs * 1.5, 30000); // exponential backoff, max 30s
    }

    if (file.state === FileState.FAILED) {
      throw new Error('Gemini file processing failed');
    }

    this.logger.log(`File ready (${file.name}), generating analysis...`);
    const result = await this.model.generateContent([
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        },
      },
      { text: prompt },
    ]);
    const response = await result.response;

    // Cleanup: delete temporary file from Gemini storage
    fileManager.deleteFile(file.name).catch((e) => {
      this.logger.warn(`Failed to delete temp file from Gemini: ${e.message}`);
    });

    return { text: response.text(), model: this.getModelName() };
  }

  /**
   * วิเคราะห์หลายรูปภาพพร้อมกัน (3-5 รูป)
   */
  async generateWithMultipleImages(
    prompt: string,
    filePaths: string[],
    mimeTypes: string[],
  ): Promise<{ text: string; tokensUsed?: number; model: string }> {
    if (!this.isEnabled) {
      throw new Error('AI is disabled. GEMINI_API_KEY is not configured.');
    }

    const parts: any[] = [];

    // add each image as inline base64
    for (let i = 0; i < filePaths.length; i++) {
      const data = await fs.readFile(filePaths[i]);
      const base64 = data.toString('base64');
      parts.push({
        inlineData: { mimeType: mimeTypes[i], data: base64 },
      });
    }

    // add prompt text
    parts.push({ text: prompt });

    this.logger.log(`Analyzing ${filePaths.length} images via Gemini multimodal`);
    const result = await this.model.generateContent(parts);
    const response = await result.response;
    return { text: response.text(), model: this.getModelName() };
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
    return this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash');
  }
}
