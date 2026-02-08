import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
// APP_GUARD + ThrottlerGuard ปิดชั่วคราว — ใช้ Nginx rate limit แทน
// import { APP_GUARD } from '@nestjs/core';
// import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { ReportsModule } from './reports/reports.module';
import { SelfAssessmentModule } from './self-assessment/self-assessment.module';
import { PDPAModule } from './pdpa/pdpa.module';
import { IndicatorsModule } from './indicators/indicators.module';
import { UploadsModule } from './uploads/uploads.module';
import { BudgetModule } from './budget/budget.module';
import { HealthModule } from './health/health.module';
import { VideoAnalysisModule } from './video-analysis/video-analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'], // Load from root .env first, then apps/api/.env
      expandVariables: true,
    }),
    // In-memory cache for frequently accessed data (dashboard, stats)
    CacheModule.register({
      isGlobal: true,
      ttl: 30000, // 30 seconds default TTL
      max: 100,   // Maximum number of items in cache
    }),
    // Rate Limiting — ปิด global guard เพราะอยู่หลัง reverse proxy
    // (ทุก request มาจาก IP เดียวกัน ทำให้ limit โดนหมด)
    // ให้ Nginx Proxy Manager จัดการ rate limit แทน
    ThrottlerModule.forRoot([]),
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
    ReportsModule,
    SelfAssessmentModule,
    PDPAModule,
    IndicatorsModule,
    UploadsModule,
    BudgetModule,
    HealthModule,
    VideoAnalysisModule,
  ],
  providers: [
    // ThrottlerGuard ถูกปิด — ใช้ Nginx rate limit แทน
    // หากต้องการเปิดกลับ ให้ uncomment และตั้ง limit ใน ThrottlerModule.forRoot
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
