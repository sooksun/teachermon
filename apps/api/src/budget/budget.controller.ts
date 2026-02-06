import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BudgetService } from './budget.service';
import {
  CreateProjectBudgetDto,
  UpdateProjectBudgetDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  ApproveTransactionDto,
} from './dto/create-transaction.dto';
import { TransactionQueryDto, BudgetReportQueryDto } from './dto/budget-query.dto';

@ApiTags('budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // =============================================
  // Project Budget
  // =============================================

  @ApiOperation({ summary: 'รายการงบประมาณโครงการทั้งหมด' })
  @Get()
  findAllBudgets(): Promise<any> {
    return this.budgetService.findAllBudgets();
  }

  @ApiOperation({ summary: 'สร้างงบประมาณโครงการใหม่' })
  @Post()
  createBudget(@Body() data: CreateProjectBudgetDto, @Request() req: any): Promise<any> {
    this.checkAdminOrPM(req.user);
    return this.budgetService.createBudget(data, req.user.sub);
  }

  @ApiOperation({ summary: 'แก้ไขงบประมาณโครงการ' })
  @Put(':id')
  updateBudget(@Param('id') id: string, @Body() data: UpdateProjectBudgetDto, @Request() req: any): Promise<any> {
    this.checkAdminOrPM(req.user);
    return this.budgetService.updateBudget(id, data);
  }

  // =============================================
  // Budget Summary
  // =============================================

  @ApiOperation({ summary: 'สรุปภาพรวมงบประมาณ' })
  @Get('summary')
  getSummary(): Promise<any> {
    return this.budgetService.getSummary();
  }

  // =============================================
  // Transactions
  // =============================================

  @ApiOperation({ summary: 'รายการจ่ายทั้งหมด' })
  @Get('transactions')
  findAllTransactions(@Query() query: TransactionQueryDto): Promise<any> {
    return this.budgetService.findAllTransactions(query);
  }

  @ApiOperation({ summary: 'รายละเอียดรายการจ่าย' })
  @Get('transactions/:id')
  findOneTransaction(@Param('id') id: string): Promise<any> {
    return this.budgetService.findOneTransaction(id);
  }

  @ApiOperation({ summary: 'บันทึกรายจ่ายใหม่' })
  @Post('transactions')
  createTransaction(@Body() data: CreateTransactionDto, @Request() req: any): Promise<any> {
    this.checkCanCreateTransaction(req.user);
    return this.budgetService.createTransaction(data, req.user.sub);
  }

  @ApiOperation({ summary: 'แก้ไขรายการจ่าย (PENDING only)' })
  @Put('transactions/:id')
  updateTransaction(
    @Param('id') id: string,
    @Body() data: UpdateTransactionDto,
    @Request() req: any,
  ): Promise<any> {
    return this.budgetService.updateTransaction(id, data, req.user.sub);
  }

  @ApiOperation({ summary: 'ลบรายการจ่าย (PENDING only)' })
  @Delete('transactions/:id')
  removeTransaction(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.budgetService.removeTransaction(id);
  }

  @ApiOperation({ summary: 'อนุมัติ/ปฏิเสธรายการจ่าย' })
  @Patch('transactions/:id/approve')
  approveTransaction(
    @Param('id') id: string,
    @Body() data: ApproveTransactionDto,
    @Request() req: any,
  ): Promise<any> {
    this.checkAdminOrPM(req.user);
    return this.budgetService.approveTransaction(
      id,
      data.action,
      req.user.sub,
      data.rejectionReason,
    );
  }

  // =============================================
  // Reports
  // =============================================

  @ApiOperation({ summary: 'รายงานการเงิน' })
  @Get('reports')
  getReport(@Query() query: BudgetReportQueryDto, @Request() req: any): Promise<any> {
    this.checkAdminOrPM(req.user);
    return this.budgetService.getReport(query);
  }

  @ApiOperation({ summary: 'ส่งออกรายงานการเงิน (HTML สำหรับพิมพ์/บันทึก PDF)' })
  @Get('reports/pdf')
  async getReportPdf(
    @Query() query: BudgetReportQueryDto,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    this.checkAdminOrPM(req.user);
    const html = await this.budgetService.getReportPdf(query);
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(html);
  }

  // =============================================
  // Helpers
  // =============================================

  private checkAdminOrPM(user: any) {
    if (!['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
      throw new ForbiddenException('เฉพาะ Admin หรือ Project Manager เท่านั้น');
    }
  }

  private checkCanCreateTransaction(user: any) {
    if (!['ADMIN', 'PROJECT_MANAGER', 'MENTOR'].includes(user.role)) {
      throw new ForbiddenException('เฉพาะ Admin, Project Manager หรือ Mentor เท่านั้น');
    }
  }
}
