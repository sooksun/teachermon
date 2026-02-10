#!/bin/bash
# ============================================================
# TeacherMon - รันบนเซิร์ฟเวอร์ (pull + build + up)
# ใช้บน server ที่ clone โปรเจกต์แล้ว เช่น /DATA/AppData/www/rukthin
# ============================================================
# วิธีใช้:
#   cd /DATA/AppData/www/rukthin   # หรือ path โปรเจกต์บน server
#   chmod +x scripts/run-on-server.sh
#   ./scripts/run-on-server.sh
# ============================================================
# ต้องมีไฟล์ .env.production ที่ root โปรเจกต์ (ไม่ commit ใน git)
# ตัวอย่างใน .env.docker.example
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}TeacherMon - Run on server${NC}"
echo "======================================"

# โฟลเดอร์โปรเจกต์ = โฟลเดอร์ที่มี docker-compose.prod.yml
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "docker-compose.prod.yml" ]; then
  echo -e "${RED}ไม่พบ docker-compose.prod.yml (ต้องรันจาก root โปรเจกต์)${NC}"
  exit 1
fi

if [ ! -f ".env.production" ]; then
  echo -e "${RED}ไม่พบ .env.production ที่ $PROJECT_ROOT${NC}"
  echo "สร้างจาก .env.docker.example หรือ .env.example แล้วแก้ค่าให้ตรงกับ server"
  exit 1
fi

echo -e "${YELLOW}1. Git pull...${NC}"
git pull origin main || true

echo -e "${YELLOW}2. Docker Compose (build + up)...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo -e "${GREEN}เสร็จสิ้น${NC}"
echo "Web: port 9903, API: port 9904 (ตาม docker-compose.prod.yml)"
echo "ดู log: docker compose -f docker-compose.prod.yml logs -f"
