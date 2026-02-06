import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PDPAService } from './pdpa.service';
import { DataRetentionService } from './data-retention.service';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { DeleteMyDataDto } from './dto/delete-my-data.dto';
import { ConsentType } from './pdpa.enums';

@ApiTags('pdpa')
@Controller('pdpa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PDPAController {
  constructor(
    private readonly pdpaService: PDPAService,
    private readonly dataRetentionService: DataRetentionService,
  ) {}

  /**
   * ดู consent ทั้งหมดของ user
   */
  @Get('consents')
  @ApiOperation({ summary: 'ดูความยินยอมทั้งหมดของฉัน' })
  async getMyConsents(@Request() req) {
    return this.pdpaService.getUserConsents(req.user.sub);
  }

  /**
   * ดู consent summary
   */
  @Get('consents/summary')
  @ApiOperation({ summary: 'ดูสรุปสถานะความยินยอม' })
  async getConsentSummary(@Request() req) {
    return this.pdpaService.getConsentSummary(req.user.sub);
  }

  /**
   * ให้ความยินยอม
   */
  @Post('consents')
  @ApiOperation({ summary: 'ให้ความยินยอม' })
  async grantConsent(
    @Body() dto: GrantConsentDto,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.pdpaService.grantConsent(req.user.sub, dto.consentType, {
      privacyPolicyVersion: dto.privacyPolicyVersion,
      termsVersion: dto.termsVersion,
      ipAddress,
      userAgent,
      expiresInDays: dto.expiresInDays,
    });
  }

  /**
   * ถอนความยินยอม
   */
  @Delete('consents/:type')
  @ApiOperation({ summary: 'ถอนความยินยอม' })
  async revokeConsent(
    @Param('type') type: ConsentType,
    @Request() req,
  ) {
    return this.pdpaService.revokeConsent(req.user.sub, type);
  }

  /**
   * ตรวจสอบว่าให้ความยินยอมแล้วหรือไม่
   */
  @Get('consents/:type/check')
  @ApiOperation({ summary: 'ตรวจสอบสถานะความยินยอม' })
  async checkConsent(
    @Param('type') type: ConsentType,
    @Request() req,
  ) {
    const hasConsent = await this.pdpaService.hasConsent(req.user.sub, type);
    return { hasConsent, consentType: type };
  }

  // ==================== User Rights API (PDPA มาตรา 30–35) ====================

  /**
   * Right to Access – ขอข้อมูลส่วนตัวของฉัน
   */
  @Get('my-data')
  @ApiOperation({ summary: 'ขอข้อมูลส่วนตัว (Right to Access)' })
  async getMyData(@Request() req) {
    return this.pdpaService.getMyData(req.user.sub);
  }

  /**
   * Right to Erasure – ลบหรือทำข้อมูลเป็นนิรนาม
   */
  @Delete('my-data')
  @ApiOperation({ summary: 'ลบข้อมูลส่วนตัว (Right to Erasure)' })
  async deleteMyData(
    @Body() dto: DeleteMyDataDto,
    @Request() req,
  ) {
    return this.pdpaService.deleteMyData(req.user.sub, {
      deleteAll: dto.deleteAll,
      categories: dto.categories,
      anonymize: dto.anonymize,
    });
  }

  /**
   * Right to Data Portability – Export ข้อมูลของฉัน
   */
  @Get('export-my-data')
  @ApiOperation({ summary: 'Export ข้อมูลส่วนตัว (Right to Data Portability)' })
  @ApiQuery({ name: 'format', required: true, enum: ['json', 'csv'] })
  async exportMyData(
    @Query('format') format: 'json' | 'csv',
    @Request() req,
  ) {
    return this.pdpaService.exportMyData(req.user.sub, format || 'json');
  }

  // ==================== Data Retention Policy ====================

  /**
   * ดูสถิติ Data Retention (Admin only)
   */
  @Get('retention/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @ApiOperation({ summary: 'ดูสถิติการเก็บรักษาข้อมูล (Admin only)' })
  async getRetentionStats() {
    return this.dataRetentionService.getRetentionStats();
  }

  /**
   * ตรวจสอบข้อมูลที่ใกล้หมดอายุ (Admin only)
   */
  @Get('retention/expiring')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @ApiOperation({ summary: 'ตรวจสอบข้อมูลที่ใกล้หมดอายุ (Admin only)' })
  async checkExpiringData() {
    return this.dataRetentionService.checkExpiringData();
  }

  /**
   * รัน cleanup แบบ manual (Admin only)
   */
  @Post('retention/cleanup')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @ApiOperation({ summary: 'รัน cleanup ข้อมูลที่หมดอายุ (Admin only)' })
  async manualCleanup(@Body() body?: { dryRun?: boolean }) {
    return this.dataRetentionService.manualCleanup(body);
  }
}
