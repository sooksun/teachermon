#!/usr/bin/env bash
# ============================================
# TeacherMon — Let's Encrypt SSL Setup
# ============================================
# วิธีใช้:
#   chmod +x scripts/setup-ssl.sh
#   ./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com
# ============================================

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✔]${NC} $1"; }
info()  { echo -e "${BLUE}[ℹ]${NC} $1"; }
error() { echo -e "${RED}[✘]${NC} $1"; exit 1; }

[ -z "$DOMAIN" ] && error "Usage: $0 <domain> <email>"
[ -z "$EMAIL" ]  && error "Usage: $0 <domain> <email>"

# Install certbot if not present
if ! command -v certbot >/dev/null 2>&1; then
    info "กำลังติดตั้ง Certbot..."
    apt-get update -qq
    apt-get install -y certbot
    log "Certbot ติดตั้งเรียบร้อย"
fi

# Stop nginx temporarily (to free port 80)
info "หยุด nginx ชั่วคราว..."
docker stop teachermon-nginx 2>/dev/null || true

# Get certificate
info "กำลังขอ SSL certificate สำหรับ $DOMAIN..."
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Copy certs to nginx/ssl
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/fullchain.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem   nginx/ssl/privkey.pem
chmod 600 nginx/ssl/privkey.pem

log "SSL Certificate ติดตั้งเรียบร้อย"

# Restart nginx
info "กำลัง restart nginx..."
docker start teachermon-nginx 2>/dev/null || true

# Setup auto-renew
info "ตั้งค่า auto-renew (cron)..."
CRON_CMD="0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $(pwd)/nginx/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $(pwd)/nginx/ssl/ && docker restart teachermon-nginx'"
(crontab -l 2>/dev/null; echo "$CRON_CMD") | sort -u | crontab -

log "Auto-renew ตั้งค่าเรียบร้อย (ตรวจสอบทุกวัน 03:00)"
echo ""
log "===== SSL Setup เสร็จสมบูรณ์ ====="
info "ทดสอบ: curl -I https://$DOMAIN"
