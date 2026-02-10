/**
 * Fix Prisma migration history: mark existing migrations as "applied"
 * so that `prisma migrate deploy` can proceed with new migrations.
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
];

async function main() {
  const prisma = new PrismaClient();
  try {
    for (const name of MIGRATIONS_TO_RESOLVE) {
      const rows = await prisma.$queryRawUnsafe(
        'SELECT id, finished_at, rolled_back_at FROM _prisma_migrations WHERE migration_name = ?',
        name
      );

      if (rows.length > 0) {
        // Migration record exists (possibly failed) — mark as successfully applied
        await prisma.$executeRawUnsafe(
          'UPDATE _prisma_migrations SET rolled_back_at = NULL, finished_at = NOW(), applied_steps_done = 1 WHERE migration_name = ?',
          name
        );
        console.log('Updated (marked as applied):', name);
      } else {
        // Migration record doesn't exist — insert it as applied
        await prisma.$executeRawUnsafe(
          "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_done) VALUES (UUID(), '', NOW(), ?, NULL, NULL, NOW(), 1)",
          name
        );
        console.log('Inserted (marked as applied):', name);
      }
    }
    console.log('\nAll migrations resolved! Now run: pnpm --filter @teachermon/database db:migrate:deploy');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
