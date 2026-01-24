import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PDPAScannerService } from './pdpa-scanner.service';
import { JournalAIService } from './journal-ai.service';
import { MentoringAIService } from './mentoring-ai.service';
import { ReadinessAIService } from './readiness-ai.service';
import { EvidenceAIService } from './evidence-ai.service';
import { AIActivityService } from './ai-activity.service';
import { AIAdminController } from './ai-admin.controller';
import { GeminiAIProvider } from './providers/gemini-ai.provider';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AIAdminController],
  providers: [
    GeminiAIProvider,
    PDPAScannerService,
    JournalAIService,
    MentoringAIService,
    ReadinessAIService,
    EvidenceAIService,
    AIActivityService,
  ],
  exports: [
    GeminiAIProvider,
    PDPAScannerService,
    JournalAIService,
    MentoringAIService,
    ReadinessAIService,
    EvidenceAIService,
    AIActivityService,
  ],
})
export class AIModule {}
