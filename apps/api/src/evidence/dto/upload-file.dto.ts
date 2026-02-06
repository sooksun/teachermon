import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { EvidenceType } from '@teachermon/database';

export class UploadFileDto {
  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  indicatorCodes?: string[];

  @IsOptional()
  @IsString()
  teacherId?: string; // สำหรับ ADMIN/PROJECT_MANAGER ที่ต้องการอัปโหลดให้ครูคนอื่น
}
