-- CreateTable
CREATE TABLE `development_summary` (
    `id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `assessment_round` INTEGER NOT NULL,
    `academic_year` VARCHAR(191) NOT NULL DEFAULT '2568',
    `total_evidence` INTEGER NOT NULL DEFAULT 0,
    `total_analysis_jobs` INTEGER NOT NULL DEFAULT 0,
    `total_video_links` INTEGER NOT NULL DEFAULT 0,
    `total_files` INTEGER NOT NULL DEFAULT 0,
    `overall_score` INTEGER NOT NULL DEFAULT 0,
    `professional_score` INTEGER NOT NULL DEFAULT 0,
    `social_score` INTEGER NULL,
    `personal_score` INTEGER NOT NULL DEFAULT 0,
    `overall_passed` BOOLEAN NOT NULL DEFAULT false,
    `evidence_by_indicator` JSON NULL,
    `ai_insights` JSON NULL,
    `domain_summaries` JSON NULL,
    `summary_narrative` TEXT NULL,
    `deck_path` VARCHAR(191) NULL,
    `deck_markdown` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `development_summary_teacher_id_idx`(`teacher_id`),
    INDEX `development_summary_status_idx`(`status`),
    UNIQUE INDEX `development_summary_teacher_id_assessment_round_academic_year_key`(`teacher_id`, `assessment_round`, `academic_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `development_summary` ADD CONSTRAINT `development_summary_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
