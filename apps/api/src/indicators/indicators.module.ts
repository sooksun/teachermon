import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IndicatorsController } from './indicators.controller';
import { IndicatorsService } from './indicators.service';
import { CompletenessController } from './completeness.controller';
import { CompletenessService } from './completeness.service';
import { DeckGeneratorController } from './deck-generator.controller';
import { DeckGeneratorService } from './deck-generator.service';
import { DevelopmentSummaryController } from './development-summary.controller';
import { DevelopmentSummaryService } from './development-summary.service';
import { PptxGeneratorService } from './pptx-generator.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    IndicatorsController,
    CompletenessController,
    DeckGeneratorController,
    DevelopmentSummaryController,
  ],
  providers: [
    IndicatorsService,
    CompletenessService,
    DeckGeneratorService,
    DevelopmentSummaryService,
    PptxGeneratorService,
  ],
  exports: [
    IndicatorsService,
    CompletenessService,
    DeckGeneratorService,
    DevelopmentSummaryService,
    PptxGeneratorService,
  ],
})
export class IndicatorsModule {}
