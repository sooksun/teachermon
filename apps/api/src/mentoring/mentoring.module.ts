import { Module } from '@nestjs/common';
import { MentoringService } from './mentoring.service';
import { MentoringController } from './mentoring.controller';
import { AIModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [MentoringController],
  providers: [MentoringService],
  exports: [MentoringService],
})
export class MentoringModule {}
