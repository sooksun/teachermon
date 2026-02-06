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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { EvidenceService } from './evidence.service';
import { CreateVideoLinkDto } from './dto/create-video-link.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  /**
   * อัปโหลดไฟล์หลักฐาน (ครู, Admin)
   */
  @Post('upload')
  @Roles('TEACHER', 'ADMIN', 'PROJECT_MANAGER')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Request() req: any,
  ): Promise<any> {
    // กำหนด teacherId ตาม role
    let teacherId: string | undefined;

    if (req.user.role === 'TEACHER') {
      // TEACHER ต้องใช้ teacherId จาก token
      if (!req.user.teacherId) {
        throw new BadRequestException(
          'Teacher ID is required. Please ensure you are logged in as a teacher.'
        );
      }
      teacherId = req.user.teacherId;
    } else if (req.user.role === 'ADMIN' || req.user.role === 'PROJECT_MANAGER') {
      // ADMIN/PROJECT_MANAGER สามารถระบุ teacherId ใน body หรือใช้จาก token (ถ้ามี)
      teacherId = dto.teacherId || req.user.teacherId;
      
      if (!teacherId) {
        throw new BadRequestException(
          'Teacher ID is required. Please specify teacherId in the request body or ensure your account is linked to a teacher.'
        );
      }
    } else {
      throw new BadRequestException('Invalid role for this operation.');
    }
    
    return this.evidenceService.uploadFile({
      file,
      teacherId,
      uploadedBy: req.user.sub,
      evidenceType: dto.evidenceType,
      indicatorCodes: dto.indicatorCodes || [],
    });
  }

  /**
   * เพิ่มลิงก์วิดีโอ (ครู, Admin)
   */
  @Post('video-link')
  @Roles('TEACHER', 'ADMIN', 'PROJECT_MANAGER')
  async createVideoLink(
    @Body() dto: CreateVideoLinkDto,
    @Request() req: any,
  ): Promise<any> {
    // ตรวจสอบว่า teacherId มีอยู่จริง
    if (!req.user.teacherId) {
      throw new BadRequestException(
        'Teacher ID is required. Please ensure you are logged in as a teacher.'
      );
    }
    
    return this.evidenceService.createVideoLink({
      teacherId: req.user.teacherId,
      uploadedBy: req.user.sub,
      ...dto,
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
  ): Promise<any[]> {
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
  ): Promise<any[]> {
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
  async findOne(@Param('id') id: string): Promise<any> {
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
  ): Promise<any> {
    return this.evidenceService.verify(id, req.user.userId, updateDto);
  }

  /**
   * ลบหลักฐาน
   */
  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  async remove(@Param('id') id: string): Promise<any> {
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

  /**
   * วิเคราะห์ความเชื่อมโยงระหว่างหลักฐานกับตัวชี้วัด
   */
  @Post(':id/analyze-connection')
  @Roles('TEACHER', 'ADMIN', 'PROJECT_MANAGER')
  async analyzeConnection(
    @Param('id') id: string,
    @Body() body: { indicatorCodes: string[] | { main?: string[]; sub?: string[] } },
    @Request() req: any,
  ): Promise<any> {
    return this.evidenceService.analyzeIndicatorConnection(
      id,
      body.indicatorCodes,
      req.user.sub,
    );
  }

}
