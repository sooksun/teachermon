#!/bin/bash

# TeacherMon - Database Backup Script
# วิธีใช้: ./scripts/backup-db.sh

# Configuration
DB_NAME="${DB_NAME:-teachermon}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/teachermon_$DATE.sql"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  TeacherMon - Database Backup${NC}"
echo "================================"
echo ""

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Start backup
echo -e "${YELLOW}📋 Starting backup...${NC}"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"
echo "   File: ${BACKUP_FILE}"
echo ""

# Backup using pg_dump
if PGPASSWORD=$PGPASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE; then
    echo -e "${GREEN}✅ Backup completed${NC}"
    
    # Compress
    echo -e "${YELLOW}📦 Compressing backup...${NC}"
    gzip $BACKUP_FILE
    
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    
    echo -e "${GREEN}✅ Compressed: ${FILE_SIZE}${NC}"
    echo ""
    
    # Delete old backups
    echo -e "${YELLOW}🗑️  Cleaning up old backups...${NC}"
    find $BACKUP_DIR -name "teachermon_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    REMAINING=$(ls -1 $BACKUP_DIR/teachermon_*.sql.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Cleaned up. Remaining backups: ${REMAINING}${NC}"
    
    # Optional: Upload to cloud
    # Uncomment ถ้าต้องการ upload ไป S3, Google Cloud Storage, etc.
    # echo ""
    # echo -e "${YELLOW}☁️  Uploading to cloud...${NC}"
    # aws s3 cp $COMPRESSED_FILE s3://your-bucket/backups/
    # rclone copy $COMPRESSED_FILE remote:backups/
    
    echo ""
    echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
    echo "   File: ${COMPRESSED_FILE}"
    echo "   Size: ${FILE_SIZE}"
    
    exit 0
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi
