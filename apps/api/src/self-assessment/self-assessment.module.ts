import { Module } from '@nestjs/common';
import { SelfAssessmentController } from './self-assessment.controller';
import { SelfAssessmentService } from './self-assessment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SelfAssessmentController],
  providers: [SelfAssessmentService],
  exports: [SelfAssessmentService],
})
export class SelfAssessmentModule {}
