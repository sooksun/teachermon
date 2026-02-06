-- CreateTable
CREATE TABLE `project_budget` (
    `id` VARCHAR(191) NOT NULL,
    `fiscal_year` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `total_allocated` DECIMAL(15, 2) NOT NULL,
    `funding_source` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `project_budget_fiscal_year_idx`(`fiscal_year`),
    INDEX `project_budget_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_transaction` (
    `id` VARCHAR(191) NOT NULL,
    `project_budget_id` VARCHAR(191) NOT NULL,
    `transaction_date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `category` ENUM('MENTORING', 'PLC', 'TRAINING', 'MATERIAL', 'TRAVEL', 'ACCOMMODATION', 'FOOD', 'PRINTING', 'COMMUNICATION', 'OTHER') NOT NULL,
    `description` TEXT NOT NULL,
    `recipient` VARCHAR(191) NULL,
    `receipt_number` VARCHAR(191) NULL,
    `receipt_file` VARCHAR(191) NULL,
    `related_activity_type` VARCHAR(191) NULL,
    `related_activity_id` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_by` VARCHAR(191) NOT NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `budget_transaction_project_budget_id_idx`(`project_budget_id`),
    INDEX `budget_transaction_category_idx`(`category`),
    INDEX `budget_transaction_status_idx`(`status`),
    INDEX `budget_transaction_transaction_date_idx`(`transaction_date`),
    INDEX `budget_transaction_created_by_idx`(`created_by`),
    INDEX `budget_transaction_project_budget_id_status_idx`(`project_budget_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `budget_transaction` ADD CONSTRAINT `budget_transaction_project_budget_id_fkey` FOREIGN KEY (`project_budget_id`) REFERENCES `project_budget`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
