-- AlterTable: add source_url, description and image_count columns to analysis_job
ALTER TABLE `analysis_job` ADD COLUMN `source_url` TEXT NULL;
ALTER TABLE `analysis_job` ADD COLUMN `description` TEXT NULL;
ALTER TABLE `analysis_job` ADD COLUMN `image_count` INTEGER NOT NULL DEFAULT 0;

-- AlterEnum: add IMAGES to AnalysisSourceType
-- MariaDB uses inline ENUM, so we need to modify the column
ALTER TABLE `analysis_job` MODIFY COLUMN `source_type` ENUM('UPLOAD', 'GDRIVE', 'YOUTUBE', 'IMAGES') NOT NULL DEFAULT 'UPLOAD';
