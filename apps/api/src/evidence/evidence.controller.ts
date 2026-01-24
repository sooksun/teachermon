import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Patch,
  Request,
} from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  /**
   * อัปโหลดหลักฐาน (ครู, Admin)
   */
  @Post()
  @Roles('TEACHER', 'ADMIN', 'PROJECT_MANAGER')
  async create(@Body() createDto: any, @Request() req: any) {
    return this.evidenceService.create({
      ...createDto,
      uploadedBy: req.user.userId,
    });
  }

  /**
   * ดึงหลักฐานของครูคนเดียว
   */
  @Get('teacher/:teacherId')
  @Roles('TEACHER', 'MENTOR', 'ADMIN', 'PROJECT_MANAGER')
  async findByTeacher(
    @Param('teacherId') teacherId: string,
    @Query('evidenceType') evidenceType?: string,
    @Query('indicatorCode') indicatorCode?: string,
    @Query('isVerified') isVerified?: string,
  ) {
    return this.evidenceService.findByTeacher(teacherId, {
      evidenceType,
      indicatorCode,
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
    });
  }

  /**
   * ดึงหลักฐานทั้งหมด (Admin/Manager)
   */
  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'MENTOR')
  async findAll(
    @Query('teacherId') teacherId?: string,
    @Query('evidenceType') evidenceType?: string,
    @Query('isVerified') isVerified?: string,
    @Query('limit') limit?: string,
  ) {
    return this.evidenceService.findAll({
      teacherId,
      evidenceType,
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * ดึงหลักฐาน 1 รายการ
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.evidenceService.findOne(id);
  }

  /**
   * ยืนยันหลักฐาน (Mentor/Admin เท่านั้น)
   */
  @Patch(':id/verify')
  @Roles('MENTOR', 'ADMIN', 'PROJECT_MANAGER')
  async verify(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    return this.evidenceService.verify(id, req.user.userId, updateDto);
  }

  /**
   * ลบหลักฐาน
   */
  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  async remove(@Param('id') id: string) {
    return this.evidenceService.remove(id);
  }

  /**
   * สถิติหลักฐาน
   */
  @Get('stats/summary')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'MENTOR')
  async getStats(@Query('teacherId') teacherId?: string) {
    return this.evidenceService.getStats(teacherId);
  }
}
