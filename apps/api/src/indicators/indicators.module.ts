import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IndicatorsController } from './indicators.controller';
import { IndicatorsService } from './indicators.service';
import { CompletenessController } from './completeness.controller';
import { CompletenessService } from './completeness.service';
import { DeckGeneratorController } from './deck-generator.controller';
import { DeckGeneratorService } from './deck-generator.service';

@Module({
  imports: [PrismaModule],
  controllers: [IndicatorsController, CompletenessController, DeckGeneratorController],
  providers: [IndicatorsService, CompletenessService, DeckGeneratorService],
  exports: [IndicatorsService, CompletenessService, DeckGeneratorService],
})
export class IndicatorsModule {}
