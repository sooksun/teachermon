import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompletenessService, DeckCompleteness } from './completeness.service';
import {
  INDICATOR_CHECK_CONFIG,
  SLIDE_TEMPLATES,
  PASS_CRITERIA,
  getSlidesForRound,
} from '@teachermon/shared';

@ApiTags('completeness')
@Controller('completeness')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompletenessController {
  constructor(private readonly completenessService: CompletenessService) {}

  /**
   * ดึง % ความสมบูรณ์ของครูผู้ช่วย (ตามครั้งที่ประเมิน)
   */
  @ApiOperation({ summary: 'Get completeness score for a teacher' })
  @ApiQuery({ name: 'round', required: false, type: Number, description: 'ครั้งที่ประเมิน (1-4)' })
  @Get('teacher/:teacherId')
  async getTeacherCompleteness(
    @Param('teacherId') teacherId: string,
    @Query('round') round?: string,
  ): Promise<DeckCompleteness> {
    const assessmentRound = round ? parseInt(round, 10) : 1;
    return this.completenessService.calculateCompleteness(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
    );
  }

  /**
   * ดึง % ความสมบูรณ์ของตัวเอง (current user)
   */
  @ApiOperation({ summary: 'Get my completeness score' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @Get('me')
  async getMyCompleteness(
    @Request() req: any,
    @Query('round') round?: string,
  ): Promise<DeckCompleteness> {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return {
        generatedAt: new Date().toISOString(),
        teacherId: '',
        teacherName: 'ไม่พบข้อมูลครู',
        assessmentRound: 1,
        deck: { score: 0, status: 'INSUFFICIENT' },
        domains: {},
        items: {},
        slides: [],
        passCriteria: {
          professional: { required: 9, actual: 0, passed: false },
          social: null,
          personal: { required: 7, actual: 0, passed: false },
          overall: false,
        },
      };
    }

    const assessmentRound = round ? parseInt(round, 10) : 1;
    return this.completenessService.calculateCompleteness(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
    );
  }

  /**
   * ดึง indicator check config (ว19/2568)
   */
  @ApiOperation({ summary: 'Get indicator check configuration (w19/2568)' })
  @Get('config')
  async getConfig(): Promise<any> {
    return INDICATOR_CHECK_CONFIG;
  }

  /**
   * ดึง slide templates (ตามครั้งที่ประเมิน)
   */
  @ApiOperation({ summary: 'Get slide templates for assessment round' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @Get('slides')
  async getSlideTemplates(
    @Query('round') round?: string,
  ): Promise<any> {
    const assessmentRound = round ? parseInt(round, 10) : 1;
    const roundNum = Math.min(Math.max(assessmentRound, 1), 4);
    return {
      round: roundNum,
      slides: getSlidesForRound(roundNum),
      total: getSlidesForRound(roundNum).length,
    };
  }

  /**
   * ดึงเกณฑ์ผ่าน
   */
  @ApiOperation({ summary: 'Get pass criteria' })
  @Get('criteria')
  async getPassCriteria(): Promise<any> {
    return PASS_CRITERIA;
  }
}
