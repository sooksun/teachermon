/**
 * All-in-one fix: resolve Prisma migration history + apply 2 GB quota directly
 *
 * Usage (inside API container):
 *   node /tmp/fix-migrations.js
 */
const { PrismaClient } = require('/app/packages/database');

const MIGRATIONS_TO_RESOLVE = [
  '20260208151200_add_video_analysis',
  '20260209100000_update_indicators_v2',
  '20260209120000_add_development_summary',
  '20260209180000_add_analysis_source_features',
  '20260209200000_quota_2gb_per_teacher',
];

async function main() {
  const prisma = new PrismaClient();
  try {
    // --- Part 1: ดูโครงสร้างตาราง _prisma_migrations ---
    console.log('=== Part 1: Fix migration history ===');
    const columns = await prisma.$queryRawUnsafe('DESCRIBE _prisma_migrations');
    const colNames = columns.map((c) => c.Field);
    console.log('Table columns:', colNames.join(', '));

    for (const name of MIGRATIONS_TO_RESOLVE) {
      const rows = await prisma.$queryRawUnsafe(
        'SELECT id FROM _prisma_migrations WHERE migration_name = ?',
        name
      );

      if (rows.length > 0) {
        await prisma.$executeRawUnsafe(
          'UPDATE _prisma_migrations SET rolled_back_at = NULL, finished_at = NOW() WHERE migration_name = ?',
          name
        );
        console.log('  Updated:', name);
      } else {
        await prisma.$executeRawUnsafe(
          "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at) VALUES (UUID(), '', NOW(), ?, NULL, NULL, NOW())",
          name
        );
        console.log('  Inserted:', name);
      }
    }
    console.log('Migration history fixed!\n');

    // --- Part 2: อัปเดตโควต้าเป็น 2 GB ตรงๆ ---
    console.log('=== Part 2: Update quota to 2 GB ===');
    const TWO_GB = 2147483648;

    // ดูสถานะก่อนอัปเดต
    const before = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) as total, SUM(CASE WHEN limit_bytes < ? THEN 1 ELSE 0 END) as need_update FROM user_media_quota',
      TWO_GB
    );
    console.log(`  Total quota records: ${before[0].total}`);
    console.log(`  Records with < 2 GB: ${before[0].need_update}`);

    // อัปเดตโควต้า
    const updated = await prisma.$executeRawUnsafe(
      'UPDATE user_media_quota SET limit_bytes = ? WHERE limit_bytes < ?',
      TWO_GB,
      TWO_GB
    );
    console.log(`  Updated ${updated} records to 2 GB`);

    // เปลี่ยน default ของคอลัมน์
    await prisma.$executeRawUnsafe(
      'ALTER TABLE user_media_quota ALTER COLUMN limit_bytes SET DEFAULT 2147483648'
    );
    console.log('  Column default set to 2 GB');

    // ยืนยันผลลัพธ์
    const after = await prisma.$queryRawUnsafe(
      'SELECT user_id, limit_bytes, usage_bytes FROM user_media_quota'
    );
    console.log('\n=== Current quota status ===');
    for (const row of after) {
      const limitMB = Number(row.limit_bytes) / 1024 / 1024;
      const usageMB = Number(row.usage_bytes) / 1024 / 1024;
      console.log(`  User ${row.user_id}: ${usageMB.toFixed(1)} / ${limitMB.toFixed(0)} MB`);
    }

    console.log('\nDone! Quota updated to 2 GB for all users.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
