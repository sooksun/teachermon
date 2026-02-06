#!/bin/bash

# TeacherMon - Health Check Script
# วิธีใช้: ./scripts/health-check.sh

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🏥 TeacherMon - Health Check${NC}"
echo "============================="
echo ""

# Check Docker containers
echo -e "${YELLOW}📋 Checking Docker containers...${NC}"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep teachermon; then
    echo -e "${GREEN}✅ Containers running${NC}"
else
    echo -e "${RED}❌ No containers found${NC}"
    exit 1
fi
echo ""

# Check API health
echo -e "${YELLOW}📋 Checking API health...${NC}"
if response=$(curl -f -s "$API_URL/health" 2>&1); then
    echo -e "${GREEN}✅ API is healthy${NC}"
    echo "   Response: $response"
else
    echo -e "${RED}❌ API health check failed${NC}"
    echo "   Error: $response"
    exit 1
fi
echo ""

# Check Web
echo -e "${YELLOW}📋 Checking Web...${NC}"
if curl -f -s "$WEB_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Web is accessible${NC}"
else
    echo -e "${RED}❌ Web is not accessible${NC}"
    exit 1
fi
echo ""

# Check Database connection
echo -e "${YELLOW}📋 Checking Database...${NC}"
if docker exec teachermon-db-prod psql -U postgres -d teachermon -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connected${NC}"
    
    # Count records
    teacher_count=$(docker exec teachermon-db-prod psql -U postgres -d teachermon -t -c "SELECT COUNT(*) FROM teacher_profile;" | xargs)
    school_count=$(docker exec teachermon-db-prod psql -U postgres -d teachermon -t -c "SELECT COUNT(*) FROM school_profile;" | xargs)
    
    echo "   Teachers: $teacher_count"
    echo "   Schools: $school_count"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

# Check disk space
echo -e "${YELLOW}📋 Checking disk space...${NC}"
df_output=$(df -h / | tail -1)
disk_usage=$(echo $df_output | awk '{print $5}' | sed 's/%//')

echo "   $df_output"

if [ $disk_usage -gt 90 ]; then
    echo -e "${RED}⚠️  WARNING: Disk usage above 90%!${NC}"
elif [ $disk_usage -gt 80 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Disk usage above 80%${NC}"
else
    echo -e "${GREEN}✅ Disk space OK${NC}"
fi
echo ""

# Check memory
echo -e "${YELLOW}📋 Checking memory...${NC}"
free -h | grep Mem
echo ""

# Check container logs for errors
echo -e "${YELLOW}📋 Checking recent errors...${NC}"
api_errors=$(docker logs --since 1h teachermon-api-prod 2>&1 | grep -i error | wc -l)
web_errors=$(docker logs --since 1h teachermon-web-prod 2>&1 | grep -i error | wc -l)

if [ $api_errors -eq 0 ] && [ $web_errors -eq 0 ]; then
    echo -e "${GREEN}✅ No errors in last hour${NC}"
else
    echo -e "${YELLOW}⚠️  Found errors in logs:${NC}"
    echo "   API errors: $api_errors"
    echo "   Web errors: $web_errors"
    echo ""
    echo "   Check logs: docker logs teachermon-api-prod"
fi
echo ""

# Summary
echo -e "${GREEN}🎉 All health checks passed!${NC}"
echo ""
echo "Status: $(date)"
