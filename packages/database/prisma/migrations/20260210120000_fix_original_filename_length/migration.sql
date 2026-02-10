-- แก้คอลัมน์ original_filename ให้รองรับชื่อไฟล์ยาว (LINE_ALBUM ภาษาไทย ฯลฯ)
ALTER TABLE `analysis_job` MODIFY COLUMN `original_filename` TEXT NULL;
