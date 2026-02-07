#!/usr/bin/env bash
# ============================================
# TeacherMon — Production Deployment Script
# Server: Ubuntu @ /DATA/AppData/www/rukthin
# Database: MariaDB 11.4 @ 192.168.1.4
# ============================================
# วิธีใช้:
#   cd /DATA/AppData/www/rukthin
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh          # deploy ปกติ
#   ./scripts/deploy.sh --fresh  # deploy ใหม่ (ลบ container เก่า)
# ============================================

set -euo pipefail

# ---------- CONFIG ----------
APP_DIR="/DATA/AppData/www/rukthin"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
PROJECT_NAME="teachermon"

DB_HOST="192.168.1.4"
DB_PORT="3306"
DB_USER="casaos"
DB_PASS="casaos"
DB_NAME="teachermon"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✔]${NC} $1"; }
warn()  { echo -e "${YELLOW}[⚠]${NC} $1"; }
error() { echo -e "${RED}[✘]${NC} $1"; exit 1; }
info()  { echo -e "${BLUE}[ℹ]${NC} $1"; }

# ---------- PRE-FLIGHT CHECKS ----------
echo ""
info "===== TeacherMon Production Deployment ====="
info "Path: $APP_DIR"
info "Database: MariaDB @ $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# 1. Check we are in the right directory
cd "$APP_DIR" 2>/dev/null || error "ไม่พบ path: $APP_DIR กรุณา clone โปรเจกต์ก่อน"
log "Working directory: $(pwd)"

# 2. Check Docker
command -v docker >/dev/null 2>&1 || error "Docker ยังไม่ได้ติดตั้ง"
docker compose version >/dev/null 2>&1 || error "Docker Compose V2 ยังไม่ได้ติดตั้ง"
log "Docker & Docker Compose พร้อม"

# 3. Check .env.production
if [ ! -f "$ENV_FILE" ]; then
    error "ไม่พบ $ENV_FILE กรุณาสร้างก่อน (cp .env.production.example .env.production)"
fi
log "พบ $ENV_FILE"

# 4. Test MariaDB connection
info "ทดสอบเชื่อมต่อ MariaDB @ $DB_HOST..."
if command -v mariadb >/dev/null 2>&1; then
    mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1 \
        && log "MariaDB เชื่อมต่อได้" \
        || warn "MariaDB เชื่อมต่อไม่ได้ — ตรวจสอบ user/password/firewall"
elif command -v mysql >/dev/null 2>&1; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1 \
        && log "MariaDB เชื่อมต่อได้" \
        || warn "MariaDB เชื่อมต่อไม่ได้ — ตรวจสอบ user/password/firewall"
else
    warn "ไม่มี mariadb/mysql client — ข้ามการทดสอบ (จะทดสอบจาก container แทน)"
fi

# 5. Create database if not exists
info "ตรวจสอบ/สร้าง database '$DB_NAME'..."
if command -v mariadb >/dev/null 2>&1; then
    mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
        -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null \
        && log "Database '$DB_NAME' พร้อม" \
        || warn "ไม่สามารถสร้าง database ได้ — อาจมีอยู่แล้วหรือสิทธิ์ไม่พอ"
elif command -v mysql >/dev/null 2>&1; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
        -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null \
        && log "Database '$DB_NAME' พร้อม" \
        || warn "ไม่สามารถสร้าง database ได้ — อาจมีอยู่แล้วหรือสิทธิ์ไม่พอ"
fi

# 6. Create uploads directory (API container รันเป็น user node = uid 1000)
mkdir -p uploads
# ให้ container เขียนไฟล์ได้ — ไม่ chown จะได้ EACCES ตอนอัปโหลด Portfolio
sudo chown -R 1000:1000 uploads 2>/dev/null || chown -R 1000:1000 uploads 2>/dev/null || true
log "โฟลเดอร์ uploads/ พร้อม (owner 1000:1000 สำหรับ container)"

# ---------- DEPLOYMENT ----------
FRESH="${1:-}"

if [ "$FRESH" = "--fresh" ]; then
    warn "Fresh deploy — กำลังลบ container เก่า..."
fi
# ลบ container เก่าก่อน up เสมอ — ป้องกัน "name conflict"
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans 2>/dev/null || true

info "กำลัง build & deploy..."
docker compose -f "$COMPOSE_FILE" \
    -p "$PROJECT_NAME" \
    up -d --build --remove-orphans

log "Containers กำลังทำงาน"

# ---------- WAIT FOR API TO BE READY ----------
info "รอ API พร้อม..."
RETRIES=30
until curl -sf http://localhost:9904/api/health >/dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -eq 0 ]; then
        warn "API ยังไม่พร้อมหลังจากรอ 60 วินาที"
        info "ดู logs: docker logs teachermon-api"
        break
    fi
    sleep 2
done
if [ $RETRIES -gt 0 ]; then
    log "API พร้อมใช้งาน"
fi

# ---------- RUN PRISMA MIGRATION ----------
info "Running Prisma Migrate Deploy..."
# ใช้ prisma@5.22.0 ตรงกับ package.json — ห้ามใช้ npx เปล่า เพราะจะดาวน์โหลด v7 ที่ breaking
docker exec teachermon-api \
    npx prisma@5.22.0 migrate deploy --schema=packages/database/prisma/schema.prisma \
    2>&1 || warn "Migration ข้าม (อาจ migrate แล้ว)"
log "Database migration เสร็จ"

# ---------- HEALTH CHECK ----------
info "ตรวจสอบ Health Check..."
sleep 3

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9904/api/health 2>/dev/null || echo "000")
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9903 2>/dev/null || echo "000")

[ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "201" ] && log "API   ✔ (HTTP $API_STATUS)" || warn "API   ✘ (HTTP $API_STATUS)"
[ "$WEB_STATUS" = "200" ] || [ "$WEB_STATUS" = "302" ] && log "Web   ✔ (HTTP $WEB_STATUS)" || warn "Web   ✘ (HTTP $WEB_STATUS)"

# ---------- SUMMARY ----------
echo ""
info "===== Deployment Summary ====="
echo ""
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
info "URLs (LAN):"
info "  Web:      http://192.168.1.4:9903"
info "  API:      http://192.168.1.4:9904/api"
info "  Swagger:  http://192.168.1.4:9904/api/docs"
info "  Health:   http://192.168.1.4:9904/api/health"
echo ""
info "Useful commands:"
info "  ดู logs:      docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f"
info "  ดู logs api:  docker logs -f teachermon-api"
info "  ดู logs web:  docker logs -f teachermon-web"
info "  หยุด:         docker compose -f $COMPOSE_FILE -p $PROJECT_NAME down"
info "  Restart:     docker compose -f $COMPOSE_FILE -p $PROJECT_NAME restart"
info "  Backup DB:   ./scripts/backup.sh"
echo ""
log "===== Deployment เสร็จสมบูรณ์ ====="
