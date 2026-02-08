import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @IsEnum(['TEXT_ONLY', 'FULL'])
  analysisMode: 'TEXT_ONLY' | 'FULL';

  @IsEnum(['UPLOAD', 'GDRIVE', 'YOUTUBE'])
  @IsOptional()
  sourceType?: 'UPLOAD' | 'GDRIVE' | 'YOUTUBE' = 'UPLOAD';

  @IsString()
  @IsOptional()
  originalFilename?: string;
}
