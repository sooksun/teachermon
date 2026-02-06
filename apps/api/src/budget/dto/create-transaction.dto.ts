import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { BudgetCategory } from '@teachermon/database';

export class CreateProjectBudgetDto {
  @ApiProperty({ description: 'ปีงบประมาณ เช่น 2569' })
  @IsString()
  fiscalYear: string;

  @ApiProperty({ description: 'ชื่องบประมาณ' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'งบจัดสรรรวม (บาท)' })
  @IsNumber()
  @Min(0)
  totalAllocated: number;

  @ApiProperty({ description: 'แหล่งเงิน', required: false })
  @IsOptional()
  @IsString()
  fundingSource?: string;

  @ApiProperty({ description: 'รายละเอียด', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectBudgetDto {
  @ApiProperty({ description: 'ชื่องบประมาณ', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'งบจัดสรรรวม (บาท)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAllocated?: number;

  @ApiProperty({ description: 'แหล่งเงิน', required: false })
  @IsOptional()
  @IsString()
  fundingSource?: string;

  @ApiProperty({ description: 'รายละเอียด', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'สถานะเปิดใช้งาน', required: false })
  @IsOptional()
  isActive?: boolean;
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID งบประมาณโครงการ' })
  @IsString()
  projectBudgetId: string;

  @ApiProperty({ description: 'วันที่ทำรายการ' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'จำนวนเงิน (บาท)' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'หมวดหมู่', enum: BudgetCategory })
  @IsEnum(BudgetCategory)
  category: BudgetCategory;

  @ApiProperty({ description: 'รายละเอียด' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'ผู้รับเงิน', required: false })
  @IsOptional()
  @IsString()
  recipient?: string;

  @ApiProperty({ description: 'เลขที่ใบเสร็จ', required: false })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiProperty({ description: 'ไฟล์ใบเสร็จ (URL)', required: false })
  @IsOptional()
  @IsString()
  receiptFile?: string;

  @ApiProperty({ description: 'ประเภทกิจกรรมที่เกี่ยวข้อง', required: false })
  @IsOptional()
  @IsString()
  relatedActivityType?: string;

  @ApiProperty({ description: 'ID กิจกรรมที่เกี่ยวข้อง', required: false })
  @IsOptional()
  @IsString()
  relatedActivityId?: string;
}

export class UpdateTransactionDto {
  @ApiProperty({ description: 'วันที่ทำรายการ', required: false })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiProperty({ description: 'จำนวนเงิน (บาท)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({ description: 'หมวดหมู่', enum: BudgetCategory, required: false })
  @IsOptional()
  @IsEnum(BudgetCategory)
  category?: BudgetCategory;

  @ApiProperty({ description: 'รายละเอียด', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ผู้รับเงิน', required: false })
  @IsOptional()
  @IsString()
  recipient?: string;

  @ApiProperty({ description: 'เลขที่ใบเสร็จ', required: false })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiProperty({ description: 'ไฟล์ใบเสร็จ (URL)', required: false })
  @IsOptional()
  @IsString()
  receiptFile?: string;

  @ApiProperty({ description: 'ประเภทกิจกรรมที่เกี่ยวข้อง', required: false })
  @IsOptional()
  @IsString()
  relatedActivityType?: string;

  @ApiProperty({ description: 'ID กิจกรรมที่เกี่ยวข้อง', required: false })
  @IsOptional()
  @IsString()
  relatedActivityId?: string;
}

export class ApproveTransactionDto {
  @ApiProperty({ description: 'อนุมัติหรือปฏิเสธ', enum: ['APPROVED', 'REJECTED'] })
  @IsEnum({ APPROVED: 'APPROVED', REJECTED: 'REJECTED' })
  action: 'APPROVED' | 'REJECTED';

  @ApiProperty({ description: 'เหตุผลที่ปฏิเสธ', required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
