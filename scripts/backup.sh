#!/usr/bin/env bash
# ============================================
# TeacherMon — MariaDB Backup Script
# Database: MariaDB 11.4 @ 192.168.1.4
# ============================================
# วิธีใช้:
#   chmod +x scripts/backup.sh
#   ./scripts/backup.sh
#
# ตั้ง cron job (ทุกวัน 02:00):
#   0 2 * * * cd /DATA/AppData/www/rukthin && ./scripts/backup.sh >> backups/backup.log 2>&1
# ============================================

set -euo pipefail

# ---------- CONFIG ----------
DB_HOST="192.168.1.4"
DB_PORT="3306"
DB_USER="casaos"
DB_PASS="casaos"
DB_NAME="teachermon"

BACKUP_DIR="/DATA/AppData/www/rukthin/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/teachermon_${DATE}.sql.gz"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}[✔]${NC} $1"; }
warn()  { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}[⚠]${NC} $1"; }
error() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}[✘]${NC} $1"; exit 1; }

# Create backup dir
mkdir -p "$BACKUP_DIR"

# Find dump command
DUMP_CMD=""
if command -v mariadb-dump >/dev/null 2>&1; then
    DUMP_CMD="mariadb-dump"
elif command -v mysqldump >/dev/null 2>&1; then
    DUMP_CMD="mysqldump"
else
    error "ไม่พบ mariadb-dump หรือ mysqldump กรุณาติดตั้ง: apt install mariadb-client"
fi

# Run backup
log "เริ่มสำรองข้อมูล ($DUMP_CMD)..."
$DUMP_CMD \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --quick \
    "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "สำรองข้อมูลเสร็จ: $BACKUP_FILE ($FILESIZE)"

# Clean old backups
if [ "$RETENTION_DAYS" -gt 0 ]; then
    DELETED=$(find "$BACKUP_DIR" -name "teachermon_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    if [ "$DELETED" -gt 0 ]; then
        log "ลบ backup เก่า $DELETED ไฟล์ (เกิน ${RETENTION_DAYS} วัน)"
    fi
fi

# List recent backups
echo ""
log "Backups ล่าสุด:"
ls -lh "$BACKUP_DIR"/teachermon_*.sql.gz 2>/dev/null | tail -5

echo ""
log "===== Backup เสร็จสมบูรณ์ ====="
