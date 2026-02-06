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
  Request,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SelfAssessmentService } from './self-assessment.service';
import { CreateSelfAssessmentDto } from './dto/create-self-assessment.dto';
import { UpdateSelfAssessmentDto } from './dto/update-self-assessment.dto';

@ApiTags('self-assessment')
@Controller('self-assessment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SelfAssessmentController {
  constructor(private readonly selfAssessmentService: SelfAssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างการประเมินตนเอง (ร่าง)' })
  create(@Request() req: any, @Body() dto: CreateSelfAssessmentDto): Promise<any> {
    // Use teacherId from DTO if provided, otherwise from user auth
    const teacherId = dto.teacherId || req.user.teacherId || req.user.sub;
    return this.selfAssessmentService.create(req.user.sub, teacherId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงการประเมินตนเองทั้งหมดของครู' })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Request() req: any,
    @Query('period') period?: string,
    @Query('status') status?: string,
  ): Promise<any[]> {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.selfAssessmentService.findAll(teacherId, period, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงการประเมินตนเองตาม ID' })
  findOne(@Param('id') id: string): Promise<any> {
    return this.selfAssessmentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'แก้ไขการประเมินตนเอง (เฉพาะ DRAFT)' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateSelfAssessmentDto,
  ): Promise<any> {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.selfAssessmentService.update(id, teacherId, dto);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'ส่งการประเมินตนเอง (DRAFT → SUBMITTED)' })
  submit(@Param('id') id: string, @Request() req: any): Promise<any> {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.selfAssessmentService.submit(id, teacherId);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'ตรวจสอบการประเมินตนเอง (สำหรับ mentor/admin)' })
  review(
    @Param('id') id: string,
    @Request() req: any,
    @Body('comments') comments: string,
  ): Promise<any> {
    return this.selfAssessmentService.review(id, req.user.sub, comments);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบการประเมินตนเอง (เฉพาะ DRAFT/SUBMITTED)' })
  delete(@Param('id') id: string, @Request() req: any): Promise<any> {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.selfAssessmentService.delete(id, teacherId);
  }
}
