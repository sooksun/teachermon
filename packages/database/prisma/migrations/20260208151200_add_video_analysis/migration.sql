-- CreateEnum: AnalysisMode, AnalysisJobStatus, AnalysisSourceType (handled by Prisma via column type)

-- CreateTable: analysis_job
CREATE TABLE `analysis_job` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NULL,
    `analysis_mode` ENUM('TEXT_ONLY', 'FULL') NOT NULL DEFAULT 'TEXT_ONLY',
    `source_type` ENUM('UPLOAD', 'GDRIVE', 'YOUTUBE') NOT NULL DEFAULT 'UPLOAD',
    `status` ENUM('UPLOADING', 'UPLOADED', 'QUEUED', 'PROCESSING_ASR', 'ASR_DONE', 'PROCESSING_FRAMES', 'ANALYZING', 'DONE', 'FAILED', 'REJECTED_QUOTA') NOT NULL DEFAULT 'UPLOADING',
    `original_filename` VARCHAR(191) NULL,
    `mime_type` VARCHAR(191) NULL,
    `raw_bytes` INTEGER NOT NULL DEFAULT 0,
    `audio_bytes` INTEGER NOT NULL DEFAULT 0,
    `frames_bytes` INTEGER NOT NULL DEFAULT 0,
    `total_bytes` INTEGER NOT NULL DEFAULT 0,
    `error_message` TEXT NULL,
    `error_code` VARCHAR(191) NULL,
    `has_transcript` BOOLEAN NOT NULL DEFAULT false,
    `has_frames` BOOLEAN NOT NULL DEFAULT false,
    `has_report` BOOLEAN NOT NULL DEFAULT false,
    `has_cover` BOOLEAN NOT NULL DEFAULT false,
    `transcript_summary` TEXT NULL,
    `analysis_report` JSON NULL,
    `evaluation_result` JSON NULL,
    `ai_advice` TEXT NULL,
    `uploaded_at` DATETIME(3) NULL,
    `queued_at` DATETIME(3) NULL,
    `asr_started_at` DATETIME(3) NULL,
    `asr_done_at` DATETIME(3) NULL,
    `frames_started_at` DATETIME(3) NULL,
    `frames_done_at` DATETIME(3) NULL,
    `analysis_done_at` DATETIME(3) NULL,
    `done_at` DATETIME(3) NULL,
    `frames_expires_at` DATETIME(3) NULL,
    `frames_deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `analysis_job_user_id_idx`(`user_id`),
    INDEX `analysis_job_teacher_id_idx`(`teacher_id`),
    INDEX `analysis_job_status_idx`(`status`),
    INDEX `analysis_job_created_at_idx`(`created_at`),
    INDEX `analysis_job_frames_expires_at_idx`(`frames_expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: user_media_quota
CREATE TABLE `user_media_quota` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `limit_bytes` BIGINT NOT NULL DEFAULT 1073741824,
    `usage_bytes` BIGINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_media_quota_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
