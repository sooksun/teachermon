import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AIActivityService } from './ai-activity.service';
import { PDPAScannerService } from './pdpa-scanner.service';
import { ReadinessAIService } from './readiness-ai.service';

/**
 * AI Admin Controller
 * สำหรับ Admin/Project Manager ในการดู Audit Trail, PDPA violations, และ AI usage stats
 */
@ApiTags('ai-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai/admin')
export class AIAdminController {
  constructor(
    private readonly aiActivity: AIActivityService,
    private readonly pdpaScanner: PDPAScannerService,
    private readonly readinessAI: ReadinessAIService,
  ) {}

  // ========================================
  // AI Activity Audit Trail
  // ========================================

  @ApiOperation({ summary: 'ดึง AI activities ทั้งหมด' })
  @Get('activities')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async getAllActivities(
    @Query('limit') limit?: string,
  ) {
    const activities = await this.aiActivity.getUserActivities(
      'all',
      limit ? parseInt(limit) : 100,
    );
    return activities;
  }

  @ApiOperation({ summary: 'ดึง AI activities ของ user คนเดียว' })
  @Get('activities/user/:userId')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async getUserActivities(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiActivity.getUserActivities(userId, limit ? parseInt(limit) : 50);
  }

  @ApiOperation({ summary: 'ดึง activities ที่รอ review' })
  @Get('activities/pending-review')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'MENTOR')
  async getPendingReviews(@Query('limit') limit?: string) {
    return this.aiActivity.getPendingReviews(limit ? parseInt(limit) : 100);
  }

  @ApiOperation({ summary: 'Review และอนุมัติ/ปฏิเสธ AI output' })
  @Patch('activities/:activityId/review')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'MENTOR')
  async reviewActivity(
    @Param('activityId') activityId: string,
    @Body() body: { approved: boolean; notes?: string },
    @Request() req: any,
  ) {
    const reviewerId = req.user?.userId || 'demo-admin';
    return this.aiActivity.reviewActivity(
      activityId,
      reviewerId,
      body.approved,
      body.notes,
    );
  }

  @ApiOperation({ summary: 'สถิติการใช้งาน AI' })
  @Get('activities/stats')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async getUsageStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.aiActivity.getUsageStats(start, end);
  }

  // ========================================
  // PDPA Audit Trail
  // ========================================

  @ApiOperation({ summary: 'ดึง PDPA audit history' })
  @Get('pdpa/:sourceType/:sourceId')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async getPDPAHistory(
    @Param('sourceType') sourceType: string,
    @Param('sourceId') sourceId: string,
  ): Promise<any[]> {
    return this.pdpaScanner.getAuditHistory(sourceType, sourceId);
  }

  @ApiOperation({ summary: 'ยืนยันว่าได้รับทราบความเสี่ยง PDPA' })
  @Patch('pdpa/:auditId/acknowledge')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'MENTOR')
  async acknowledgePDPA(
    @Param('auditId') auditId: string,
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user?.userId || 'demo-admin';
    return this.pdpaScanner.acknowledgeRisk(auditId, userId);
  }

  // ========================================
  // Readiness Reports
  // ========================================

  @ApiOperation({ summary: 'อธิบายความพร้อมของครู (AI-generated)' })
  @Get('readiness/:teacherId')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'MENTOR')
  async explainReadiness(
    @Param('teacherId') teacherId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 'demo-admin';
    return this.readinessAI.explainReadiness(teacherId, userId);
  }

  // ========================================
  // Cleanup & Maintenance
  // ========================================

  @ApiOperation({ summary: 'ลบ AI activities เก่า (GDPR compliance)' })
  @Post('cleanup/old-activities')
  @Roles('ADMIN')
  async cleanupOldActivities(@Body() body: { olderThanDays?: number }) {
    const days = body.olderThanDays || 365;
    return this.aiActivity.cleanupOldActivities(days);
  }
}
