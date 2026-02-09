-- =============================================
-- Migration: Update Indicators Schema V2
-- Based on doc_ref6.pdf - ตัวชี้วัดการเตรียมความพร้อมครูผู้ช่วย
-- =============================================

-- 1. Add IndicatorAspect enum (if not exists)
-- Note: MariaDB doesn't support native ENUMs in the same way
-- We'll use VARCHAR for aspect field

-- 2. Alter 'indicators' table - add new columns
ALTER TABLE `indicators` 
ADD COLUMN IF NOT EXISTS `section` VARCHAR(191) NULL AFTER `aspect`,
ADD COLUMN IF NOT EXISTS `sub_section` VARCHAR(191) NULL AFTER `section`,
ADD COLUMN IF NOT EXISTS `assessment_rounds` JSON DEFAULT '[1,2,3,4]' AFTER `sub_section`,
ADD COLUMN IF NOT EXISTS `min_pass_count` INT NULL AFTER `assessment_rounds`;

-- 3. Alter 'sub_indicators' table - add assessment_rounds column
ALTER TABLE `sub_indicators`
ADD COLUMN IF NOT EXISTS `assessment_rounds` JSON DEFAULT '[1,2,3,4]' AFTER `evidence_examples`;

-- 4. Update aspect column to use new values
-- Old values: 'วิชาชีพ', 'สังคม', 'คุณลักษณะส่วนบุคคล'
-- New values: 'PROFESSIONAL', 'SOCIAL', 'PERSONAL'
UPDATE `indicators` SET `aspect` = 'PROFESSIONAL' WHERE `aspect` = 'วิชาชีพ';
UPDATE `indicators` SET `aspect` = 'SOCIAL' WHERE `aspect` = 'สังคม';
UPDATE `indicators` SET `aspect` = 'PERSONAL' WHERE `aspect` = 'คุณลักษณะส่วนบุคคล';

-- 5. Drop old 'category' column (now using section/subSection instead)
-- Note: Keep category for backward compatibility, or uncomment below to drop
-- ALTER TABLE `indicators` DROP COLUMN IF EXISTS `category`;

-- 6. Create indexes for new columns
CREATE INDEX IF NOT EXISTS `indicators_section_idx` ON `indicators`(`section`);

-- =============================================
-- 7. Create indicator_assessments table (ผลการประเมินตัวชี้วัด)
-- =============================================
CREATE TABLE IF NOT EXISTS `indicator_assessments` (
  `id` VARCHAR(191) NOT NULL,
  `teacher_id` VARCHAR(191) NOT NULL,
  `assessment_round` INT NOT NULL,
  `assessment_date` DATETIME(3) NOT NULL,
  `assessor_id` VARCHAR(191) NULL,
  `professional_passed` INT NOT NULL DEFAULT 0,
  `professional_total` INT NOT NULL DEFAULT 10,
  `social_passed` INT NOT NULL DEFAULT 0,
  `social_total` INT NOT NULL DEFAULT 2,
  `personal_passed` INT NOT NULL DEFAULT 0,
  `personal_total` INT NOT NULL DEFAULT 15,
  `overall_result` VARCHAR(191) NULL,
  `comments` TEXT NULL,
  `assessment_details` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `indicator_assessments_teacher_id_assessment_round_key`(`teacher_id`, `assessment_round`),
  INDEX `indicator_assessments_teacher_id_idx`(`teacher_id`),
  INDEX `indicator_assessments_assessment_round_idx`(`assessment_round`),
  INDEX `indicator_assessments_assessment_date_idx`(`assessment_date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key
ALTER TABLE `indicator_assessments` ADD CONSTRAINT `indicator_assessments_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- 8. Create indicator_reports table (สรุปรายงานตามหมวดหมู่)
-- =============================================
CREATE TABLE IF NOT EXISTS `indicator_reports` (
  `id` VARCHAR(191) NOT NULL,
  `school_id` VARCHAR(191) NOT NULL,
  `assessment_round` INT NOT NULL,
  `academic_year` VARCHAR(191) NOT NULL,
  `report_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `total_teachers` INT NOT NULL DEFAULT 0,
  `passed_teachers` INT NOT NULL DEFAULT 0,
  `failed_teachers` INT NOT NULL DEFAULT 0,
  `professional_avg_percent` DOUBLE NOT NULL DEFAULT 0,
  `social_avg_percent` DOUBLE NOT NULL DEFAULT 0,
  `personal_avg_percent` DOUBLE NOT NULL DEFAULT 0,
  `indicator_breakdown` JSON NULL,
  `recommendations` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `indicator_reports_school_id_assessment_round_academic_year_key`(`school_id`, `assessment_round`, `academic_year`),
  INDEX `indicator_reports_school_id_idx`(`school_id`),
  INDEX `indicator_reports_assessment_round_idx`(`assessment_round`),
  INDEX `indicator_reports_academic_year_idx`(`academic_year`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key
ALTER TABLE `indicator_reports` ADD CONSTRAINT `indicator_reports_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
