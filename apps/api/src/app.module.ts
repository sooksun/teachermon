import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeachersModule } from './teachers/teachers.module';
import { SchoolsModule } from './schools/schools.module';
import { JournalsModule } from './journals/journals.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MentoringModule } from './mentoring/mentoring.module';
import { PLCModule } from './plc/plc.module';
import { AssessmentModule } from './assessment/assessment.module';
import { AIModule } from './ai/ai.module';
import { EvidenceModule } from './evidence/evidence.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    TeachersModule,
    SchoolsModule,
    JournalsModule,
    DashboardModule,
    MentoringModule,
    PLCModule,
    AssessmentModule,
    AIModule,
    EvidenceModule,
  ],
})
export class AppModule {}
