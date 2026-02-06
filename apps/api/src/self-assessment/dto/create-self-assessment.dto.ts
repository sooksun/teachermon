import {
  IsInt,
  IsEnum,
  IsString,
  IsOptional,
  Min,
  Max,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssessmentPeriod, CompetencyLevel } from '@teachermon/database';

export class CreateSelfAssessmentDto {
  @ApiProperty({ required: false, description: 'Teacher ID (optional, auto-detected from auth)' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiProperty({ enum: AssessmentPeriod })
  @IsEnum(AssessmentPeriod)
  assessmentPeriod: AssessmentPeriod;

  // Scores (1-5)
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  pedagogyScore: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  classroomScore: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  communityScore: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  professionalismScore: number;

  // Reflections
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pedagogyReflection?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  classroomReflection?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  communityReflection?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  professionalismReflection?: string;

  // Overall
  @ApiProperty({ enum: CompetencyLevel })
  @IsEnum(CompetencyLevel)
  overallLevel: CompetencyLevel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  areasForImprovement?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actionPlan?: string;

  // Portfolio items to link
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  portfolioItemIds?: string[];
}
