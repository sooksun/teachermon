#!/usr/bin/env bash
# ============================================
# TeacherMon — Server Initial Setup (Ubuntu 22/24)
# ============================================
# วิธีใช้ (รันเป็น root):
#   curl -sSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/setup-server.sh | bash
#   หรือ:
#   chmod +x scripts/setup-server.sh && sudo ./scripts/setup-server.sh
# ============================================
# สิ่งที่ script นี้ติดตั้ง:
#   - Docker & Docker Compose
#   - MySQL client (สำหรับ backup)
#   - Certbot (สำหรับ SSL)
#   - UFW Firewall (เปิดเฉพาะ 22, 80, 443)
#   - Fail2ban
#   - Unattended upgrades
# ============================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✔]${NC} $1"; }
info()  { echo -e "${BLUE}[ℹ]${NC} $1"; }
warn()  { echo -e "${YELLOW}[⚠]${NC} $1"; }
error() { echo -e "${RED}[✘]${NC} $1"; exit 1; }

# Check root
[ "$(id -u)" -ne 0 ] && error "กรุณารันด้วย sudo หรือ root"

info "===== เริ่มติดตั้ง Server สำหรับ TeacherMon ====="
echo ""

# ---------- 1. System Update ----------
info "อัปเดตระบบ..."
apt-get update -qq
apt-get upgrade -y -qq
log "อัปเดตระบบเรียบร้อย"

# ---------- 2. Essential packages ----------
info "ติดตั้ง packages พื้นฐาน..."
apt-get install -y -qq \
    curl wget git unzip htop \
    ca-certificates gnupg lsb-release \
    mysql-client certbot \
    fail2ban ufw \
    unattended-upgrades
log "Packages พื้นฐานเรียบร้อย"

# ---------- 3. Docker ----------
if ! command -v docker >/dev/null 2>&1; then
    info "ติดตั้ง Docker..."
    curl -fsSL https://get.docker.com | bash
    systemctl enable --now docker
    log "Docker ติดตั้งเรียบร้อย ($(docker --version))"
else
    log "Docker ติดตั้งอยู่แล้ว ($(docker --version))"
fi

# Add current user to docker group (if not root)
if [ "${SUDO_USER:-}" ]; then
    usermod -aG docker "$SUDO_USER"
    info "เพิ่ม $SUDO_USER เข้ากลุ่ม docker แล้ว (login ใหม่เพื่อใช้งาน)"
fi

# ---------- 4. Firewall (UFW) ----------
info "ตั้งค่า Firewall..."
ufw --force reset >/dev/null 2>&1
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp  comment "SSH"
ufw allow 80/tcp  comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw --force enable
log "Firewall เปิดใช้งาน (SSH:22, HTTP:80, HTTPS:443)"

# ---------- 5. Fail2ban ----------
info "ตั้งค่า Fail2ban..."
cat > /etc/fail2ban/jail.local << 'JAIL'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = systemd
JAIL
systemctl enable --now fail2ban
systemctl restart fail2ban
log "Fail2ban เปิดใช้งาน"

# ---------- 6. Auto-update ----------
info "ตั้งค่า Automatic Security Updates..."
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'AUTO'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
AUTO
log "Auto-update เปิดใช้งาน"

# ---------- 7. Swap (ถ้ายังไม่มี) ----------
if [ ! -f /swapfile ]; then
    info "สร้าง swap 2GB..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log "Swap 2GB เรียบร้อย"
else
    log "Swap มีอยู่แล้ว"
fi

# ---------- 8. Kernel tuning ----------
info "ปรับแต่ง kernel..."
cat >> /etc/sysctl.d/99-teachermon.conf << 'SYSCTL'
# Network performance
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1

# File descriptors
fs.file-max = 65535

# VM
vm.swappiness = 10
vm.overcommit_memory = 1
SYSCTL
sysctl -p /etc/sysctl.d/99-teachermon.conf >/dev/null 2>&1
log "Kernel tuning เรียบร้อย"

# ---------- Summary ----------
echo ""
info "===== Setup เสร็จสมบูรณ์ ====="
echo ""
log "สิ่งที่ติดตั้งแล้ว:"
echo "  - Docker:     $(docker --version 2>/dev/null || echo 'N/A')"
echo "  - Firewall:   UFW (22, 80, 443)"
echo "  - Fail2ban:   Active"
echo "  - Auto-update: Enabled"
echo "  - Swap:       $(free -h | awk '/Swap/{print $2}')"
echo ""
info "ขั้นตอนถัดไป:"
echo "  1. Clone โปรเจกต์: git clone <repo-url> /opt/teachermon"
echo "  2. ตั้งค่า env:     cd /opt/teachermon && cp .env.production.example .env.production"
echo "  3. แก้ไข env:       nano .env.production"
echo "  4. ตั้ง SSL:        ./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com"
echo "  5. Deploy:          ./scripts/deploy.sh"
echo ""
warn "อย่าลืม: login ใหม่เพื่อให้ docker group มีผล"
