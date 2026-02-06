#!/bin/bash

# TeacherMon - Setup Monitoring Script
# วิธีใช้: sudo ./scripts/setup-monitoring.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}📊 TeacherMon - Setup Monitoring${NC}"
echo "================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Please run as root (sudo)${NC}"
    exit 1
fi

# 1. Setup log directories
echo -e "${YELLOW}📋 Step 1: Creating log directories...${NC}"
mkdir -p /var/log/teachermon
mkdir -p /var/log/nginx
chmod 755 /var/log/teachermon
echo -e "${GREEN}✅ Log directories created${NC}"
echo ""

# 2. Setup log rotation
echo -e "${YELLOW}📋 Step 2: Setting up log rotation...${NC}"
cat > /etc/logrotate.d/teachermon << 'EOF'
/var/log/teachermon/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        docker restart teachermon-api-prod > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 nginx nginx
    sharedscripts
    postrotate
        docker exec teachermon-nginx nginx -s reopen > /dev/null 2>&1 || true
    endscript
}
EOF
echo -e "${GREEN}✅ Log rotation configured${NC}"
echo ""

# 3. Setup health check cron
echo -e "${YELLOW}📋 Step 3: Setting up health check cron...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Make scripts executable
chmod +x "$PROJECT_DIR/scripts/health-check.sh"
chmod +x "$PROJECT_DIR/scripts/monitor.sh"
chmod +x "$PROJECT_DIR/scripts/backup-db.sh"

# Add to crontab
(crontab -l 2>/dev/null || echo "") | cat - << EOF | crontab -
# TeacherMon Monitoring
*/5 * * * * $PROJECT_DIR/scripts/health-check.sh >> /var/log/teachermon/health.log 2>&1
*/10 * * * * $PROJECT_DIR/scripts/monitor.sh >> /var/log/teachermon/monitor.log 2>&1

# Database backup (daily at 2 AM)
0 2 * * * $PROJECT_DIR/scripts/backup-db.sh >> /var/log/teachermon/backup.log 2>&1

# Cleanup old logs (weekly)
0 3 * * 0 find /var/log/teachermon -name "*.log" -mtime +30 -delete
EOF

echo -e "${GREEN}✅ Cron jobs configured${NC}"
echo ""

# 4. Install monitoring tools
echo -e "${YELLOW}📋 Step 4: Installing monitoring tools...${NC}"

# htop - process monitoring
apt install -y htop

# iotop - disk I/O monitoring  
apt install -y iotop

# netstat - network monitoring
apt install -y net-tools

echo -e "${GREEN}✅ Monitoring tools installed${NC}"
echo ""

# 5. Setup system monitoring (optional)
echo -e "${YELLOW}📋 Step 5: Setup system monitoring (optional)...${NC}"
echo ""
echo "Would you like to install Prometheus + Grafana? (y/n)"
read -r response

if [ "$response" = "y" ]; then
    # Create monitoring docker-compose
    cat > "$PROJECT_DIR/docker-compose.monitoring.yml" << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: teachermon-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - '9090:9090'
    restart: always

  grafana:
    image: grafana/grafana:latest
    container_name: teachermon-grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - '3003:3000'
    restart: always

  node-exporter:
    image: prom/node-exporter:latest
    container_name: teachermon-node-exporter
    ports:
      - '9100:9100'
    restart: always

volumes:
  prometheus_data:
  grafana_data:
EOF

    mkdir -p "$PROJECT_DIR/monitoring"
    
    # Create Prometheus config
    cat > "$PROJECT_DIR/monitoring/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'teachermon-api'
    static_configs:
      - targets: ['api:3001']
  
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

    echo -e "${GREEN}✅ Monitoring stack configured${NC}"
    echo ""
    echo "Start with: docker-compose -f docker-compose.monitoring.yml up -d"
    echo "Prometheus: http://localhost:9090"
    echo "Grafana: http://localhost:3003 (admin/admin)"
else
    echo "Skipped monitoring stack setup"
fi

echo ""
echo -e "${GREEN}🎉 Monitoring setup complete!${NC}"
echo "================================="
echo ""
echo "📊 Configured:"
echo "   - Health checks: every 5 minutes"
echo "   - System monitoring: every 10 minutes"
echo "   - Database backup: daily at 2 AM"
echo "   - Log rotation: daily"
echo ""
echo "📝 Logs location:"
echo "   - Health: /var/log/teachermon/health.log"
echo "   - Monitor: /var/log/teachermon/monitor.log"
echo "   - Backup: /var/log/teachermon/backup.log"
echo ""
echo "🔍 View cron jobs:"
echo "   crontab -l"
echo ""
