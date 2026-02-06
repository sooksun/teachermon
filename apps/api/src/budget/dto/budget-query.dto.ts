import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BudgetCategory, TransactionStatus } from '@teachermon/database';

export class TransactionQueryDto {
  @ApiProperty({ description: 'หมวดหมู่', enum: BudgetCategory, required: false })
  @IsOptional()
  @IsEnum(BudgetCategory)
  category?: BudgetCategory;

  @ApiProperty({ description: 'สถานะ', enum: TransactionStatus, required: false })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({ description: 'ID งบประมาณโครงการ', required: false })
  @IsOptional()
  @IsString()
  projectBudgetId?: string;

  @ApiProperty({ description: 'วันที่เริ่มต้น (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'วันที่สิ้นสุด (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'หน้าที่', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;

  @ApiProperty({ description: 'จำนวนต่อหน้า', required: false, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}

export class BudgetReportQueryDto {
  @ApiProperty({ description: 'ID งบประมาณโครงการ', required: false })
  @IsOptional()
  @IsString()
  projectBudgetId?: string;

  @ApiProperty({ description: 'วันที่เริ่มต้น (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'วันที่สิ้นสุด (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
