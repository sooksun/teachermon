import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // TODO: Enable after login is working
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Get overall statistics' })
  @Get('stats')
  getOverallStats() {
    return this.dashboardService.getOverallStats();
  }

  @ApiOperation({ summary: 'Get teacher statistics' })
  @Get('teachers')
  getTeacherStats() {
    return this.dashboardService.getTeacherStats();
  }

  @ApiOperation({ summary: 'Get monthly trends' })
  @Get('trends')
  getMonthlyTrends() {
    return this.dashboardService.getMonthlyTrends();
  }
}
