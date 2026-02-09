import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeckGeneratorService } from './deck-generator.service';

@ApiTags('deck-generator')
@Controller('deck')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeckGeneratorController {
  constructor(private readonly deckService: DeckGeneratorService) {}

  /**
   * สร้าง Slidev deck สำหรับครูผู้ช่วยรายคน
   */
  @ApiOperation({ summary: 'Generate Slidev deck for teacher' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: String })
  @Post('generate/:teacherId')
  async generateDeck(
    @Param('teacherId') teacherId: string,
    @Query('round') round?: string,
    @Query('year') year?: string,
  ) {
    const assessmentRound = round ? parseInt(round, 10) : 1;
    const academicYear = year || '2568';

    const result = await this.deckService.generateDeck(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
      academicYear,
    );

    return {
      success: true,
      deckPath: result.deckPath,
      deckScore: result.completeness.deck.score,
      status: result.completeness.deck.status,
      message: `Deck generated: ${result.completeness.deck.score}% (${result.completeness.deck.status})`,
    };
  }

  /**
   * สร้าง Slidev deck ให้ตัวเอง
   */
  @ApiOperation({ summary: 'Generate my Slidev deck' })
  @ApiQuery({ name: 'round', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: String })
  @Post('generate/me')
  async generateMyDeck(
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

    const result = await this.deckService.generateDeck(
      teacherId,
      Math.min(Math.max(assessmentRound, 1), 4),
      academicYear,
    );

    return {
      success: true,
      deckPath: result.deckPath,
      deckScore: result.completeness.deck.score,
      status: result.completeness.deck.status,
    };
  }
}
