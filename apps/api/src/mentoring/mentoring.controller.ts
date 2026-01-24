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
import { MentoringService } from './mentoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MentoringAIService } from '../ai/mentoring-ai.service';

@ApiTags('mentoring')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // TODO: Enable after login is working
@Controller('mentoring')
export class MentoringController {
  constructor(
    private mentoringService: MentoringService,
    private mentoringAI: MentoringAIService,
  ) {}

  @ApiOperation({ summary: 'Get all mentoring visits' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiQuery({ name: 'visitType', required: false, type: String })
  @Get()
  findAll(@Query() query: any) {
    return this.mentoringService.findAll(query);
  }

  @ApiOperation({ summary: 'Get mentoring visit by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mentoringService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new mentoring visit' })
  @Post()
  create(@Body() data: any) {
    return this.mentoringService.create(data);
  }

  @ApiOperation({ summary: 'Update mentoring visit' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.mentoringService.update(id, data);
  }

  @ApiOperation({ summary: 'Delete mentoring visit' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mentoringService.remove(id);
  }

  // ========================================
  // AI Features
  // ========================================

  @ApiOperation({ summary: '[AI] สร้างรายงานการนิเทศอัตโนมัติ' })
  @Post(':id/ai/generate-report')
  async generateReport(
    @Param('id') visitId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 'demo-user';
    return this.mentoringAI.generateReport(visitId, userId);
  }
}
