import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'strict',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute (for sensitive endpoints)
      },
    ]),
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
