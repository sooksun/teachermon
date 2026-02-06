#!/bin/bash

# TeacherMon - Database Restore Script
# วิธีใช้: ./scripts/restore-db.sh [backup_file]

# Configuration
DB_NAME="${DB_NAME:-teachermon}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 TeacherMon - Database Restore${NC}"
echo "================================"
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Please provide backup file${NC}"
    echo ""
    echo "Usage: ./scripts/restore-db.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -1t backups/teachermon_*.sql.gz 2>/dev/null | head -10
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: File not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will REPLACE the current database!${NC}"
echo ""
echo "   Database: $DB_NAME"
echo "   Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}📋 Starting restore...${NC}"

# Decompress if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${YELLOW}📦 Decompressing...${NC}"
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c $BACKUP_FILE > $TEMP_FILE
    RESTORE_FILE=$TEMP_FILE
else
    RESTORE_FILE=$BACKUP_FILE
fi

# Drop existing connections
echo -e "${YELLOW}🔌 Closing existing connections...${NC}"
PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$DB_NAME'
    AND pid <> pg_backend_pid();"

# Restore
echo -e "${YELLOW}🔄 Restoring database...${NC}"
if PGPASSWORD=$PGPASSWORD pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $RESTORE_FILE; then
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
    
    # Clean up temp file
    if [[ $BACKUP_FILE == *.gz ]]; then
        rm -f $TEMP_FILE
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Database restored!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify data: psql -U $DB_USER -d $DB_NAME"
    echo "2. Restart application"
    
    exit 0
else
    echo -e "${RED}❌ Restore failed!${NC}"
    
    # Clean up temp file
    if [[ $BACKUP_FILE == *.gz ]]; then
        rm -f $TEMP_FILE
    fi
    
    exit 1
fi
