#!/usr/bin/env bash
# รัน Prisma migrate deploy บน production
# ใช้ได้สองแบบ:
#   1) จากโฮสต์ (ต้องมี DATABASE_URL ใน .env.production): ./scripts/migrate-deploy.sh
#   2) ผ่านคอนเทนเนอร์ API: ./scripts/migrate-deploy.sh --docker

set -e
cd "$(dirname "$0")/.."
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ "$1" = "--docker" ]; then
  echo "Running migration inside API container..."
  docker compose -f "$COMPOSE_FILE" exec api sh -c 'cd /app && pnpm exec prisma migrate deploy --schema=packages/database/prisma/schema.prisma'
else
  echo "Running migration on host (requires pnpm install and DATABASE_URL)..."
  if [ ! -d "node_modules" ] || [ ! -f "packages/database/node_modules/.bin/prisma" ]; then
    echo "Installing dependencies..."
    pnpm install --frozen-lockfile
  fi
  pnpm exec prisma migrate deploy --schema=packages/database/prisma/schema.prisma
fi

echo "Migration completed."
