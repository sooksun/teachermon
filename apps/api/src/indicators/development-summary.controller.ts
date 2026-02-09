import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DevelopmentSummaryService } from './development-summary.service';
import { PptxGeneratorService } from './pptx-generator.service';
import { Response } from 'express';

@ApiTags('development-summary')
@Controller('development-summary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevelopmentSummaryController {
  constructor(
    private readonly summaryService: DevelopmentSummaryService,
    private readonly pptxService: PptxGeneratorService,
  ) {}

  /**
   * สร้างสรุปผลการพัฒนาอย่างเข้ม (generate / regenerate)
   */
  @ApiOperation({ summary: 'Generate development summary for a teacher' })
  @ApiQuery({ name: 'round', required: false, type: Number, description: 'ครั้งที่ประเมิน (1-4)' })
  @ApiQuery({ name: 'year', required: false, type: String, description: 'ปีการศึกษา' })
  @Post('generate/:teacherId')
  async generateSummary(
    @Param('teacherId') teacherId: string,
    @Query('round') round?: string,
    @Query('year') year?: string,
  ) {
    const assessmentRound = round ? parseInt(round, 10) : 1;
    const academicYear = year || '2568';

    const result = await this.summaryService.generateSummary(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
      academicYear,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * สร้างสรุปผลของตัวเอง
   */
  @ApiOperation({ summary: 'Generate my development summary' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: String })
  @Post('generate/me')
  async generateMySummary(
    @Request() req: any,
    @Query('round') round?: string,
    @Query('year') year?: string,
  ) {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return { success: false, message: 'ไม่พบข้อมูลครูผู้ช่วย' };
    }

    const assessmentRound = round ? parseInt(round, 10) : 1;
    const academicYear = year || '2568';

    const result = await this.summaryService.generateSummary(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
      academicYear,
    );

    return { success: true, data: result };
  }

  /**
   * ดึงสรุปผลจาก DB (ไม่สร้างใหม่)
   */
  @ApiOperation({ summary: 'Get existing development summary' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: String })
  @Get('teacher/:teacherId')
  async getSummary(
    @Param('teacherId') teacherId: string,
    @Query('round') round?: string,
    @Query('year') year?: string,
  ): Promise<any> {
    const assessmentRound = round ? parseInt(round, 10) : 1;
    const academicYear = year || '2568';

    const existing = await this.summaryService.getSummary(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
      academicYear,
    );

    if (!existing) {
      return { success: false, message: 'ยังไม่มีสรุปผล กรุณาสร้างก่อน' };
    }

    return { success: true, data: existing };
  }

  /**
   * ดึงสรุปผลของตัวเอง
   */
  @ApiOperation({ summary: 'Get my existing development summary' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: String })
  @Get('me')
  async getMySummary(
    @Request() req: any,
    @Query('round') round?: string,
    @Query('year') year?: string,
  ): Promise<any> {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return { success: false, message: 'ไม่พบข้อมูลครูผู้ช่วย' };
    }

    const assessmentRound = round ? parseInt(round, 10) : 1;
    const academicYear = year || '2568';

    const existing = await this.summaryService.getSummary(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
      academicYear,
    );

    if (!existing) {
      return { success: false, message: 'ยังไม่มีสรุปผล กรุณาสร้างก่อน' };
    }

    return { success: true, data: existing };
  }

  /**
   * ดึงสรุปผลทุกครั้งของครู
   */
  @ApiOperation({ summary: 'Get all summaries for a teacher' })
  @Get('teacher/:teacherId/all')
  async getAllSummaries(@Param('teacherId') teacherId: string): Promise<any> {
    const summaries = await this.summaryService.getAllSummaries(teacherId);
    return { success: true, data: summaries };
  }

  /**
   * ดึงสรุปผลทุกครั้งของตัวเอง
   */
  @ApiOperation({ summary: 'Get all my summaries' })
  @Get('me/all')
  async getAllMySummaries(@Request() req: any): Promise<any> {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return { success: false, data: [] };
    }
    const summaries = await this.summaryService.getAllSummaries(teacherId);
    return { success: true, data: summaries };
  }

  /**
   * ดาวน์โหลด Deck Markdown
   */
  @ApiOperation({ summary: 'Download deck markdown' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: String })
  @Get('teacher/:teacherId/deck')
  async getDeckMarkdown(
    @Param('teacherId') teacherId: string,
    @Query('round') round?: string,
    @Query('year') year?: string,
    @Res() res?: Response,
  ) {
    const assessmentRound = round ? parseInt(round, 10) : 1;
    const academicYear = year || '2568';

    const existing = await this.summaryService.getSummary(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
      academicYear,
    );

    if (!existing || !existing.deckMarkdown) {
      res?.status(404).json({ success: false, message: 'ไม่พบ deck' });
      return;
    }

    res?.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res?.setHeader(
      'Content-Disposition',
      `attachment; filename="development-summary-round${assessmentRound}.md"`,
    );
    res?.send(existing.deckMarkdown);
  }

  /**
   * ดาวน์โหลด PowerPoint (.pptx)
   */
  @ApiOperation({ summary: 'Download PowerPoint presentation' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: String })
  @Post('teacher/:teacherId/pptx')
  async downloadPptx(
    @Param('teacherId') teacherId: string,
    @Query('round') round?: string,
    @Query('year') year?: string,
    @Res() res?: Response,
  ) {
    const assessmentRound = round ? parseInt(round, 10) : 1;
    const academicYear = year || '2568';

    try {
      // Generate summary first (or use existing)
      const summaryData = await this.summaryService.generateSummary(
        teacherId,
        Math.min(Math.max(assessmentRound, 1), 4),
        academicYear,
      );

      // Generate PowerPoint
      const buffer = await this.pptxService.generatePptx(summaryData);

      const filename = encodeURIComponent(
        `สรุปผลพัฒนาอย่างเข้ม-ครั้งที่${assessmentRound}-${summaryData.teacherName}.pptx`,
      );

      res?.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      );
      res?.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${filename}`,
      );
      res?.setHeader('Content-Length', buffer.length.toString());
      res?.send(buffer);
    } catch (error: any) {
      res?.status(500).json({
        success: false,
        message: error.message || 'ไม่สามารถสร้าง PowerPoint ได้',
      });
    }
  }

  /**
   * ดาวน์โหลด PowerPoint ของตัวเอง
   */
  @ApiOperation({ summary: 'Download my PowerPoint presentation' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: String })
  @Post('me/pptx')
  async downloadMyPptx(
    @Request() req: any,
    @Query('round') round?: string,
    @Query('year') year?: string,
    @Res() res?: Response,
  ) {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      res?.status(400).json({ success: false, message: 'ไม่พบข้อมูลครูผู้ช่วย' });
      return;
    }

    const assessmentRound = round ? parseInt(round, 10) : 1;
    const academicYear = year || '2568';

    try {
      const summaryData = await this.summaryService.generateSummary(
        teacherId,
        Math.min(Math.max(assessmentRound, 1), 4),
        academicYear,
      );

      const buffer = await this.pptxService.generatePptx(summaryData);

      const filename = encodeURIComponent(
        `สรุปผลพัฒนาอย่างเข้ม-ครั้งที่${assessmentRound}.pptx`,
      );

      res?.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      );
      res?.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${filename}`,
      );
      res?.setHeader('Content-Length', buffer.length.toString());
      res?.send(buffer);
    } catch (error: any) {
      res?.status(500).json({
        success: false,
        message: error.message || 'ไม่สามารถสร้าง PowerPoint ได้',
      });
    }
  }
}
