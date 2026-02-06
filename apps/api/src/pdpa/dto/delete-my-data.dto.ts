import { IsBoolean, IsOptional, IsArray, IsString } from 'class-validator';

/** หมวดหมู่ข้อมูลที่สามารถลบได้ */
export const DELETE_CATEGORIES = [
  'personal_info',
  'assessments',
  'journals',
  'evidence',
  'mentoring',
  'plc',
  'development_plans',
] as const;

export type DeleteCategory = (typeof DELETE_CATEGORIES)[number];

export class DeleteMyDataDto {
  /** ลบข้อมูลทั้งหมด (บัญชี + ข้อมูลที่เกี่ยวข้อง) */
  @IsOptional()
  @IsBoolean()
  deleteAll?: boolean;

  /** ลบเฉพาะหมวดหมู่ที่ระบุ */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  /** ทำเป็นนิรนามแทนการลบ (เก็บโครงสร้างแต่ลบข้อมูลส่วนบุคคล) */
  @IsOptional()
  @IsBoolean()
  anonymize?: boolean;
}
