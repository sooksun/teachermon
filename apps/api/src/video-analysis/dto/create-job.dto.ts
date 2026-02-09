import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @IsEnum(['TEXT_ONLY', 'FULL'])
  analysisMode: 'TEXT_ONLY' | 'FULL';

  @IsEnum(['UPLOAD', 'GDRIVE', 'YOUTUBE', 'IMAGES'])
  @IsOptional()
  sourceType?: 'UPLOAD' | 'GDRIVE' | 'YOUTUBE' | 'IMAGES' = 'UPLOAD';

  @IsString()
  @IsOptional()
  originalFilename?: string;

  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
