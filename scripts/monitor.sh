#!/bin/bash

# TeacherMon - Monitoring Script
# วิธีใช้: ./scripts/monitor.sh
# หรือใส่ใน cron: */5 * * * * /path/to/monitor.sh

# Configuration
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_TO="${EMAIL_TO:-admin@yourdomain.com}"
API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
ERROR_THRESHOLD=10

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Log file
LOG_FILE="/var/log/teachermon-monitor.log"
ALERT_FILE="/tmp/teachermon-alerts.txt"

# Function to send alert
send_alert() {
    local message=$1
    local severity=$2
    
    # Log
    echo "$(date): [$severity] $message" >> $LOG_FILE
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"🚨 TeacherMon Alert: $message\"}" \
            &> /dev/null
    fi
    
    # Email (ถ้าติดตั้ง mailutils)
    if command -v mail &> /dev/null && [ -n "$EMAIL_TO" ]; then
        echo "$message" | mail -s "TeacherMon Alert: $severity" $EMAIL_TO
    fi
}

# Check API health
check_api() {
    if ! curl -f -s "$API_URL/health" > /dev/null 2>&1; then
        send_alert "API is DOWN!" "CRITICAL"
        return 1
    fi
    return 0
}

# Check Web
check_web() {
    if ! curl -f -s "$WEB_URL" > /dev/null 2>&1; then
        send_alert "Web is DOWN!" "CRITICAL"
        return 1
    fi
    return 0
}

# Check Database
check_database() {
    if ! docker exec teachermon-db-prod psql -U postgres -d teachermon -c "SELECT 1;" > /dev/null 2>&1; then
        send_alert "Database is DOWN!" "CRITICAL"
        return 1
    fi
    return 0
}

# Check CPU usage
check_cpu() {
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d'.' -f1)
    
    if [ $cpu_usage -gt $CPU_THRESHOLD ]; then
        send_alert "High CPU usage: ${cpu_usage}%" "WARNING"
        return 1
    fi
    return 0
}

# Check Memory usage
check_memory() {
    memory_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    
    if [ $memory_usage -gt $MEMORY_THRESHOLD ]; then
        send_alert "High Memory usage: ${memory_usage}%" "WARNING"
        return 1
    fi
    return 0
}

# Check Disk usage
check_disk() {
    disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ $disk_usage -gt $DISK_THRESHOLD ]; then
        send_alert "High Disk usage: ${disk_usage}%" "WARNING"
        return 1
    fi
    return 0
}

# Check for errors in logs
check_errors() {
    # API errors in last 5 minutes
    api_errors=$(docker logs --since 5m teachermon-api-prod 2>&1 | grep -i "error\|exception\|fatal" | wc -l)
    
    if [ $api_errors -gt $ERROR_THRESHOLD ]; then
        send_alert "High error rate: $api_errors errors in last 5 minutes" "WARNING"
        return 1
    fi
    return 0
}

# Check SSL expiry
check_ssl() {
    # ตรวจสอบ SSL expiry (ถ้ามี SSL)
    if command -v openssl &> /dev/null; then
        domain="yourdomain.com"
        expiry_date=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        
        if [ -n "$expiry_date" ]; then
            expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
            current_epoch=$(date +%s)
            days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
            
            if [ $days_left -lt 7 ]; then
                send_alert "SSL certificate expires in $days_left days!" "CRITICAL"
                return 1
            elif [ $days_left -lt 30 ]; then
                send_alert "SSL certificate expires in $days_left days" "WARNING"
            fi
        fi
    fi
    return 0
}

# Main monitoring
echo "$(date): Starting health check..." >> $LOG_FILE

status=0

check_api || status=1
check_web || status=1
check_database || status=1
check_cpu || status=1
check_memory || status=1
check_disk || status=1
check_errors || status=1
check_ssl || status=1

if [ $status -eq 0 ]; then
    echo "$(date): All checks passed" >> $LOG_FILE
else
    echo "$(date): Some checks failed" >> $LOG_FILE
fi

exit $status
