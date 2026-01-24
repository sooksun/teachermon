import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('assessment')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // TODO: Enable after login is working
@Controller('assessment')
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  // Competency Assessments
  @ApiOperation({ summary: 'Get all competency assessments' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @Get('competency')
  findAllAssessments(@Query('teacherId') teacherId?: string) {
    return this.assessmentService.findAllAssessments(teacherId);
  }

  @ApiOperation({ summary: 'Get competency assessment by ID' })
  @Get('competency/:id')
  findOneAssessment(@Param('id') id: string) {
    return this.assessmentService.findOneAssessment(id);
  }

  @ApiOperation({ summary: 'Create new competency assessment' })
  @Post('competency')
  createAssessment(@Body() data: any) {
    return this.assessmentService.createAssessment(data);
  }

  @ApiOperation({ summary: 'Update competency assessment' })
  @Put('competency/:id')
  updateAssessment(@Param('id') id: string, @Body() data: any) {
    return this.assessmentService.updateAssessment(id, data);
  }

  @ApiOperation({ summary: 'Delete competency assessment' })
  @Delete('competency/:id')
  removeAssessment(@Param('id') id: string) {
    return this.assessmentService.removeAssessment(id);
  }

  // Development Plans
  @ApiOperation({ summary: 'Get all development plans' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @Get('plans')
  findAllPlans(@Query('teacherId') teacherId?: string) {
    return this.assessmentService.findAllPlans(teacherId);
  }

  @ApiOperation({ summary: 'Get development plan by ID' })
  @Get('plans/:id')
  findOnePlan(@Param('id') id: string) {
    return this.assessmentService.findOnePlan(id);
  }

  @ApiOperation({ summary: 'Create new development plan' })
  @Post('plans')
  createPlan(@Body() data: any) {
    return this.assessmentService.createPlan(data);
  }

  @ApiOperation({ summary: 'Update development plan' })
  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.assessmentService.updatePlan(id, data);
  }

  @ApiOperation({ summary: 'Delete development plan' })
  @Delete('plans/:id')
  removePlan(@Param('id') id: string) {
    return this.assessmentService.removePlan(id);
  }
}
