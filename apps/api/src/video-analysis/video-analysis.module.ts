import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { VideoAnalysisController } from './video-analysis.controller';
import { VideoAnalysisService } from './video-analysis.service';
import { VideoAnalysisCron } from './video-analysis.cron';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [VideoAnalysisController],
  providers: [VideoAnalysisService, VideoAnalysisCron],
  exports: [VideoAnalysisService],
})
export class VideoAnalysisModule {}
