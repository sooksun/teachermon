-- ขยายโควต้าวิดีโอเป็นครูคนละ 2 GB (อัปเดตผู้ใช้เดิม)
UPDATE "user_media_quota"
SET "limit_bytes" = 2147483648
WHERE "limit_bytes" < 2147483648;

-- ตั้ง default ของคอลัมน์เป็น 2 GB สำหรับแถวใหม่
ALTER TABLE "user_media_quota" ALTER COLUMN "limit_bytes" SET DEFAULT 2147483648;
