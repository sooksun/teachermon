-- CreateTable
CREATE TABLE `school_profile` (
    `id` VARCHAR(191) NOT NULL,
    `school_name` VARCHAR(191) NOT NULL,
    `province` VARCHAR(191) NOT NULL,
    `region` ENUM('NORTH', 'NORTHEAST', 'CENTRAL', 'SOUTH') NOT NULL,
    `school_size` ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
    `area_type` ENUM('REMOTE', 'VERY_REMOTE', 'SPECIAL') NOT NULL,
    `student_total` INTEGER NOT NULL,
    `director_name` VARCHAR(191) NULL,
    `community_context` TEXT NULL,
    `quality_school_flag` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_profile` (
    `id` VARCHAR(191) NOT NULL,
    `citizen_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `birth_date` DATETIME(3) NOT NULL,
    `cohort` INTEGER NOT NULL,
    `appointment_date` DATETIME(3) NOT NULL,
    `position` VARCHAR(191) NOT NULL DEFAULT 'ครูผู้ช่วย',
    `major` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `school_id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'TRANSFERRED', 'RESIGNED', 'ON_LEAVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teacher_profile_citizen_id_key`(`citizen_id`),
    UNIQUE INDEX `teacher_profile_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mentoring_visit` (
    `id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `visit_date` DATETIME(3) NOT NULL,
    `visit_type` ENUM('LESSON_STUDY', 'COACHING', 'OBSERVATION', 'FOLLOW_UP') NOT NULL,
    `observer` VARCHAR(191) NOT NULL,
    `focus_area` ENUM('CLASSROOM', 'MANAGEMENT', 'STUDENT_CARE', 'COMMUNITY', 'PEDAGOGY') NOT NULL,
    `strengths` TEXT NULL,
    `challenges` TEXT NULL,
    `suggestions` TEXT NULL,
    `follow_up_required` BOOLEAN NOT NULL DEFAULT false,
    `attachments` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competency_assessment` (
    `id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `assessment_period` ENUM('BEFORE', 'MID', 'AFTER') NOT NULL,
    `pedagogy_score` INTEGER NOT NULL,
    `classroom_score` INTEGER NOT NULL,
    `community_score` INTEGER NOT NULL,
    `professionalism_score` INTEGER NOT NULL,
    `overall_level` ENUM('NEEDS_SUPPORT', 'FAIR', 'GOOD', 'EXCELLENT') NOT NULL,
    `assessor` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reflective_journal` (
    `id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `reflection_text` TEXT NOT NULL,
    `success_story` TEXT NULL,
    `difficulty` TEXT NULL,
    `support_request` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reflective_journal_teacher_id_month_key`(`teacher_id`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plc_activity` (
    `id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `plc_date` DATETIME(3) NOT NULL,
    `plc_level` ENUM('PROVINCIAL', 'REGIONAL', 'NATIONAL') NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `role` ENUM('PARTICIPANT', 'PRESENTER', 'FACILITATOR') NOT NULL,
    `takeaway` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `development_plan` (
    `id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `focus_competency` VARCHAR(191) NOT NULL,
    `action_plan` TEXT NOT NULL,
    `support_type` ENUM('COACHING', 'TRAINING', 'MENTORING', 'WORKSHOP') NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `progress_status` ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `progress_notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `policy_insight` (
    `id` VARCHAR(191) NOT NULL,
    `period` INTEGER NOT NULL DEFAULT 2025,
    `key_issue` TEXT NOT NULL,
    `systemic_barrier` TEXT NULL,
    `successful_practice` TEXT NULL,
    `policy_recommendation` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('TEACHER', 'PRINCIPAL', 'MENTOR', 'PROJECT_MANAGER', 'ADMIN') NOT NULL DEFAULT 'TEACHER',
    `teacher_id` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_teacher_id_key`(`teacher_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `self_assessment` (
    `id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `assessment_period` ENUM('BEFORE', 'MID', 'AFTER') NOT NULL,
    `assessment_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pedagogy_score` INTEGER NOT NULL,
    `classroom_score` INTEGER NOT NULL,
    `community_score` INTEGER NOT NULL,
    `professionalism_score` INTEGER NOT NULL,
    `pedagogy_reflection` TEXT NULL,
    `classroom_reflection` TEXT NULL,
    `community_reflection` TEXT NULL,
    `professionalism_reflection` TEXT NULL,
    `overall_level` ENUM('NEEDS_SUPPORT', 'FAIR', 'GOOD', 'EXCELLENT') NOT NULL,
    `strengths` TEXT NULL,
    `areas_for_improvement` TEXT NULL,
    `action_plan` TEXT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'REVIEWED') NOT NULL DEFAULT 'DRAFT',
    `submitted_at` DATETIME(3) NULL,
    `reviewed_by` VARCHAR(191) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `reviewer_comments` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `self_assessment_teacher_id_idx`(`teacher_id`),
    INDEX `self_assessment_assessment_period_idx`(`assessment_period`),
    INDEX `self_assessment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evidence_portfolio` (
    `id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `self_assessment_id` VARCHAR(191) NULL,
    `item_type` ENUM('FILE', 'VIDEO_LINK') NOT NULL DEFAULT 'FILE',
    `original_filename` VARCHAR(191) NULL,
    `standard_filename` VARCHAR(191) NULL,
    `file_url` VARCHAR(191) NULL,
    `file_size` INTEGER NULL,
    `mime_type` VARCHAR(191) NULL,
    `video_url` VARCHAR(191) NULL,
    `video_title` VARCHAR(191) NULL,
    `video_description` TEXT NULL,
    `video_platform` VARCHAR(191) NULL,
    `evidence_type` ENUM('LESSON_PLAN', 'TEACHING_MEDIA', 'ASSESSMENT', 'STUDENT_WORK', 'CLASSROOM_PHOTO', 'REFLECTION', 'ACTION_RESEARCH', 'OTHER') NOT NULL,
    `indicator_codes` JSON NOT NULL,
    `ai_summary` TEXT NULL,
    `ai_keywords` JSON NULL,
    `ai_quality_check` JSON NULL,
    `ai_suggestions` TEXT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_by` VARCHAR(191) NULL,
    `verified_at` DATETIME(3) NULL,
    `pdpa_checked` BOOLEAN NOT NULL DEFAULT false,
    `pdpa_risk_level` ENUM('SAFE', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `evidence_portfolio_teacher_id_idx`(`teacher_id`),
    INDEX `evidence_portfolio_evidence_type_idx`(`evidence_type`),
    INDEX `evidence_portfolio_self_assessment_id_idx`(`self_assessment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_activity` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `action_type` ENUM('JOURNAL_IMPROVE', 'JOURNAL_SUGGEST', 'PDPA_CHECK', 'MENTORING_SUMMARY', 'EVIDENCE_SUMMARY', 'EVIDENCE_TAG', 'READINESS_EXPLAIN', 'ASSESSMENT_DRAFT') NOT NULL,
    `input_data` TEXT NOT NULL,
    `output_data` TEXT NOT NULL,
    `model_used` VARCHAR(191) NOT NULL DEFAULT 'gpt-4o-mini',
    `tokens_used` INTEGER NULL,
    `confidence_score` DOUBLE NULL,
    `is_reviewed` BOOLEAN NOT NULL DEFAULT false,
    `reviewed_by` VARCHAR(191) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `review_notes` TEXT NULL,
    `is_approved` BOOLEAN NULL,
    `related_entity_type` VARCHAR(191) NULL,
    `related_entity_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_activity_user_id_idx`(`user_id`),
    INDEX `ai_activity_action_type_idx`(`action_type`),
    INDEX `ai_activity_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pdpa_audit` (
    `id` VARCHAR(191) NOT NULL,
    `source_type` VARCHAR(191) NOT NULL,
    `source_id` VARCHAR(191) NOT NULL,
    `original_text` TEXT NOT NULL,
    `risk_level` ENUM('SAFE', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK') NOT NULL,
    `violations` JSON NOT NULL,
    `sanitized_text` TEXT NULL,
    `was_auto_fixed` BOOLEAN NOT NULL DEFAULT false,
    `checked_by` VARCHAR(191) NOT NULL,
    `is_acknowledged` BOOLEAN NOT NULL DEFAULT false,
    `acknowledged_by` VARCHAR(191) NULL,
    `acknowledged_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pdpa_audit_source_type_source_id_idx`(`source_type`, `source_id`),
    INDEX `pdpa_audit_risk_level_idx`(`risk_level`),
    INDEX `pdpa_audit_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consent` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `teacher_id` VARCHAR(191) NULL,
    `consent_type` ENUM('DATA_COLLECTION', 'DATA_PROCESSING', 'DATA_SHARING', 'MARKETING', 'ANALYTICS') NOT NULL,
    `status` ENUM('PENDING', 'GRANTED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `granted_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `privacy_policy_version` VARCHAR(191) NULL,
    `terms_version` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `consent_user_id_idx`(`user_id`),
    INDEX `consent_status_idx`(`status`),
    INDEX `consent_expires_at_idx`(`expires_at`),
    UNIQUE INDEX `consent_user_id_consent_type_key`(`user_id`, `consent_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teacher_profile` ADD CONSTRAINT `teacher_profile_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school_profile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mentoring_visit` ADD CONSTRAINT `mentoring_visit_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competency_assessment` ADD CONSTRAINT `competency_assessment_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reflective_journal` ADD CONSTRAINT `reflective_journal_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plc_activity` ADD CONSTRAINT `plc_activity_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `development_plan` ADD CONSTRAINT `development_plan_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_assessment` ADD CONSTRAINT `self_assessment_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidence_portfolio` ADD CONSTRAINT `evidence_portfolio_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidence_portfolio` ADD CONSTRAINT `evidence_portfolio_self_assessment_id_fkey` FOREIGN KEY (`self_assessment_id`) REFERENCES `self_assessment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consent` ADD CONSTRAINT `consent_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consent` ADD CONSTRAINT `consent_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
