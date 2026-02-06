#!/bin/bash

# TeacherMon - Production Deployment Script
# วิธีใช้: ./scripts/deploy-production.sh

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 TeacherMon - Production Deployment${NC}"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please do not run as root${NC}"
    exit 1
fi

# Pre-flight checks
echo -e "${YELLOW}📋 Pre-flight checks...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker installed${NC}"

# Check docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installed${NC}"

# Check if .env.production exists
if [ ! -f "apps/api/.env.production" ]; then
    echo -e "${RED}❌ apps/api/.env.production not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Environment files found${NC}"

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will deploy to PRODUCTION!${NC}"
echo ""
read -p "Are you sure? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}❌ Deployment cancelled${NC}"
    exit 0
fi

# Backup current database
echo ""
echo -e "${YELLOW}📋 Step 1: Backup current database...${NC}"
./scripts/backup-db.sh || {
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
}

# Build Docker images
echo ""
echo -e "${YELLOW}📋 Step 2: Building Docker images...${NC}"
echo "This may take 5-10 minutes..."

docker build -f apps/api/Dockerfile -t teachermon-api:latest . || {
    echo -e "${RED}❌ API build failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ API image built${NC}"

docker build -f apps/web/Dockerfile -t teachermon-web:latest . || {
    echo -e "${RED}❌ Web build failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Web image built${NC}"

# Stop old containers (if exists)
echo ""
echo -e "${YELLOW}📋 Step 3: Stopping old containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Start new containers
echo ""
echo -e "${YELLOW}📋 Step 4: Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo ""
echo -e "${YELLOW}📋 Step 5: Waiting for services to be ready...${NC}"
sleep 10

# Check health
for i in {1..30}; do
    if curl -f http://localhost:3001/health &> /dev/null; then
        echo -e "${GREEN}✅ API is healthy${NC}"
        break
    fi
    echo "Waiting for API... ($i/30)"
    sleep 2
done

# Run migrations
echo ""
echo -e "${YELLOW}📋 Step 6: Running database migrations...${NC}"
docker exec -it teachermon-api-prod sh -c "cd packages/database && pnpm db:migrate:deploy" || {
    echo -e "${RED}❌ Migration failed${NC}"
    echo "Rolling back..."
    docker-compose -f docker-compose.prod.yml down
    exit 1
}
echo -e "${GREEN}✅ Migrations completed${NC}"

# Smoke tests
echo ""
echo -e "${YELLOW}📋 Step 7: Running smoke tests...${NC}"

# Test API
if curl -f http://localhost:3001/health &> /dev/null; then
    echo -e "${GREEN}✅ API health check passed${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
    exit 1
fi

# Test Web
if curl -f http://localhost:3000 &> /dev/null; then
    echo -e "${GREEN}✅ Web health check passed${NC}"
else
    echo -e "${RED}❌ Web health check failed${NC}"
    exit 1
fi

# Success!
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "======================================"
echo ""
echo "📊 Services Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🌐 URLs:"
echo "   API: http://localhost:3001"
echo "   Web: http://localhost:3000"
echo "   Swagger: http://localhost:3001/api"
echo ""
echo "📝 Next steps:"
echo "   1. Test login: http://localhost:3000/login"
echo "   2. Monitor logs: docker logs -f teachermon-api-prod"
echo "   3. Check monitoring dashboards"
echo ""
echo -e "${CYAN}✅ Deployment complete!${NC}"
