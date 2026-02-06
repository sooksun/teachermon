import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { TeacherReportQueryDto } from './dto/teacher-report-query.dto';
import { TeacherReportSummary } from './dto/teacher-report-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@ApiTags('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('teacher-assessment')
  @ApiOperation({ summary: 'Get teacher assessment summary report' })
  @ApiQuery({ name: 'schoolId', required: false, description: 'Filter by school ID' })
  @ApiQuery({ name: 'province', required: false, description: 'Filter by province' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  @ApiQuery({ name: 'cohort', required: false, description: 'Filter by teacher cohort', type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by teacher status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  async getTeacherAssessmentReport(
    @Query() query: TeacherReportQueryDto,
  ): Promise<TeacherReportSummary[]> {
    return this.reportsService.getTeacherAssessmentReport(query);
  }

  @Get('teacher-assessment/pdf')
  @ApiOperation({ summary: 'Export teacher assessment report as PDF' })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'province', required: false })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'cohort', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  async exportTeacherAssessmentPDF(
    @Query() query: TeacherReportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const data = await this.reportsService.getTeacherAssessmentReport(query);
      const pdf = await this.reportsService.generatePDF(data, query);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="teacher-assessment-report-${Date.now()}.pdf"`,
      );
      res.send(pdf);
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        message: error?.message || 'Failed to generate PDF',
      });
    }
  }
}
