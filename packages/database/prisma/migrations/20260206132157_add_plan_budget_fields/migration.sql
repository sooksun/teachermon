-- AlterTable
ALTER TABLE `development_plan` ADD COLUMN `budget_allocated` DECIMAL(15, 2) NULL,
    ADD COLUMN `budget_used` DECIMAL(15, 2) NULL;

-- CreateTable
CREATE TABLE `indicators` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `aspect` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `indicators_code_key`(`code`),
    INDEX `indicators_code_idx`(`code`),
    INDEX `indicators_aspect_idx`(`aspect`),
    INDEX `indicators_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_indicators` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `requirements` TEXT NOT NULL,
    `assessment_methods` TEXT NULL,
    `evidence_examples` JSON NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `indicator_id` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sub_indicators_code_key`(`code`),
    INDEX `sub_indicators_indicator_id_idx`(`indicator_id`),
    INDEX `sub_indicators_code_idx`(`code`),
    INDEX `sub_indicators_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sub_indicators` ADD CONSTRAINT `sub_indicators_indicator_id_fkey` FOREIGN KEY (`indicator_id`) REFERENCES `indicators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
