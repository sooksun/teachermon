import { IsOptional, IsString, IsEnum, IsInt, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Region, TeacherStatus } from '@teachermon/database';

export class TeacherReportQueryDto {
  @ApiProperty({ required: false, description: 'Filter by school ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({ required: false, description: 'Filter by province' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ required: false, enum: Region, description: 'Filter by region' })
  @IsOptional()
  @IsEnum(Region)
  region?: Region;

  @ApiProperty({ required: false, description: 'Filter by teacher cohort' })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  cohort?: number;

  @ApiProperty({ required: false, enum: TeacherStatus, description: 'Filter by teacher status' })
  @IsOptional()
  @IsEnum(TeacherStatus)
  status?: TeacherStatus;

  @ApiProperty({ required: false, description: 'Filter by start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Filter by end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
