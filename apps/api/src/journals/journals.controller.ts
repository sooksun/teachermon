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
// @UseGuards(JwtAuthGuard) // TODO: Enable after login is working
@Controller('journals')
export class JournalsController {
  constructor(
    private journalsService: JournalsService,
    private journalAI: JournalAIService,
    private pdpaScanner: PDPAScannerService,
  ) {}

  @ApiOperation({ summary: 'Get all reflective journals' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @Get()
  findAll(@Query('teacherId') teacherId?: string) {
    return this.journalsService.findAll(teacherId);
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

  @ApiOperation({ summary: '[AI] ปรับปรุงภาษาให้เป็นทางการ' })
  @Post('ai/improve-language')
  async improveLanguage(
    @Body() body: { text: string; indicatorCode?: string; focusArea?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 'demo-user';
    return this.journalAI.improveLanguage(body.text, userId, {
      indicatorCode: body.indicatorCode,
      focusArea: body.focusArea,
    });
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
