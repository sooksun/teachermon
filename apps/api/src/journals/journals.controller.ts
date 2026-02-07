import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JournalsService } from './journals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JournalAIService } from '../ai/journal-ai.service';
import { PDPAScannerService } from '../ai/pdpa-scanner.service';

@ApiTags('journals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('journals')
export class JournalsController {
  constructor(
    private journalsService: JournalsService,
    private journalAI: JournalAIService,
    private pdpaScanner: PDPAScannerService,
  ) {}

  @ApiOperation({ summary: 'Get all reflective journals' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(
    @Query('teacherId') teacherId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.journalsService.findAll(teacherId, page || 1, Math.min(limit || 20, 100));
  }

  @ApiOperation({ summary: 'Get journal by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.journalsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new journal' })
  @Post()
  create(@Body() data: any) {
    return this.journalsService.create(data);
  }

  @ApiOperation({ summary: 'Update journal' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.journalsService.update(id, data);
  }

  @ApiOperation({ summary: 'Delete journal' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.journalsService.remove(id);
  }

  // ========================================
  // AI Features
  // ========================================

  @ApiOperation({ summary: '[AI] ปรับปรุงภาษาให้เป็นทางการ (รองรับหลายช่อง)' })
  @Post('ai/improve-language')
  async improveLanguage(
    @Body() body: { text?: string; fields?: Record<string, string>; indicatorCode?: string; focusArea?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 'demo-user';
    const context = {
      indicatorCode: body.indicatorCode,
      focusArea: body.focusArea,
    };

    try {
      // รองรับแบบหลายช่อง (fields) 
      if (body.fields && Object.keys(body.fields).length > 0) {
        return await this.journalAI.improveMultipleFields(body.fields, userId, context);
      }

      // รองรับแบบเดิม (text เดี่ยว) สำหรับ backward compatibility
      if (body.text) {
        return await this.journalAI.improveLanguage(body.text, userId, context);
      }

      return { improvedText: '', improvedFields: {}, suggestions: ['กรุณากรอกข้อมูลก่อนปรับภาษา'] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      return {
        improvedText: body.text || '',
        improvedFields: body.fields || {},
        suggestions: [`เกิดข้อผิดพลาด: ${message}`],
        error: true,
      };
    }
  }

  @ApiOperation({ summary: '[AI] แนะนำคำถามสะท้อนคิด' })
  @Post('ai/suggest-prompts')
  async suggestPrompts(
    @Body() body: { indicatorCode: string },
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 'demo-user';
    return this.journalAI.suggestReflectionPrompts(body.indicatorCode, userId);
  }

  @ApiOperation({ summary: '[AI] ตรวจสอบ PDPA' })
  @Post('ai/check-pdpa')
  async checkPDPA(
    @Body() body: { text: string; sourceId?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 'demo-user';
    const sourceId = body.sourceId || 'temp-' + Date.now();
    return this.pdpaScanner.checkText(body.text, userId, 'journal', sourceId);
  }
}
