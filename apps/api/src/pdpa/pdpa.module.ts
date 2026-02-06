import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PDPAController } from './pdpa.controller';
import { PDPAService } from './pdpa.service';
import { DataRetentionService } from './data-retention.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [PDPAController],
  providers: [PDPAService, DataRetentionService],
  exports: [PDPAService, DataRetentionService],
})
export class PDPAModule {}
