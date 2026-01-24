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
