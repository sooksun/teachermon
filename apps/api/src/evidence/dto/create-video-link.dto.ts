import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EvidenceType } from '@teachermon/database';

export class CreateVideoLinkDto {
  @ApiProperty()
  @IsUrl()
  videoUrl: string;

  @ApiProperty()
  @IsString()
  videoTitle: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  videoDescription?: string;

  @ApiProperty({ required: false, example: 'youtube' })
  @IsOptional()
  @IsString()
  videoPlatform?: string;

  @ApiProperty({ enum: EvidenceType })
  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  indicatorCodes?: string[];
}
