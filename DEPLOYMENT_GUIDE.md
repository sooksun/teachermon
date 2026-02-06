# 🚀 TeacherMon - Production Deployment Guide

**วันที่สร้าง**: 24 มกราคม 2569  
**เวอร์ชัน**: 1.0.0

---

## 📋 Overview

คู่มือนี้จะแนะนำการ deploy ระบบ TeacherMon ไปยัง production server พร้อมการตั้งค่า security, monitoring, และ backup

---

## 🎯 Deployment Options (เลือก 1 วิธี)

### Option 1: Deploy ด้วย Docker (แนะนำ)
- ✅ ง่าย รวดเร็ว สม่ำเสมอ
- ✅ Scalable และ Portable
- ✅ เหมาะกับ cloud (AWS, GCP, Azure, DigitalOcean)

### Option 2: Deploy แบบ Traditional (บน VM)
- ✅ ควบคุมได้เต็มที่
- ✅ เหมาะกับ on-premise server
- ✅ Performance ดีกว่า (ถ้าตั้งค่าถูก)

### Option 3: Deploy บน Platform-as-a-Service (PaaS)
- ✅ Deploy ง่ายที่สุด
- ✅ Maintenance น้อย
- ✅ Heroku, Railway, Render, Vercel

---

## 🔴 Pre-Deployment Checklist

### ✅ 1. Code Quality
- [ ] TypeScript compilation ผ่าน (0 errors)
- [ ] Tests ผ่านทั้งหมด
- [ ] Linter ผ่าน (no warnings)
- [ ] Build สำเร็จ (`pnpm build`)
- [ ] Code review เสร็จ

### ✅ 2. Security
- [ ] เปลี่ยน JWT_SECRET (ใหม่ strong)
- [ ] เปลี่ยน Database password
- [ ] ลบ default admin accounts (หรือเปลี่ยน password)
- [ ] Environment variables ไม่มี sensitive data
- [ ] CORS ตั้งค่าถูกต้อง (production domain only)
- [ ] Rate limiting เปิดใช้งาน

### ✅ 3. Database
- [ ] Backup database ปัจจุบัน
- [ ] Migration scripts พร้อม
- [ ] Seed data พร้อม (ถ้าต้องการ)
- [ ] Database indexes ครบถ้วน
- [ ] Connection pooling ตั้งค่าแล้ว

### ✅ 4. Infrastructure
- [ ] Server/Cloud account พร้อม
- [ ] Domain name พร้อม
- [ ] SSL Certificate พร้อม
- [ ] DNS configured
- [ ] Firewall rules ตั้งค่าแล้ว

### ✅ 5. Monitoring & Logging
- [ ] Error tracking setup (Sentry, LogRocket)
- [ ] Application monitoring (PM2, Datadog)
- [ ] Database monitoring
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Alert notifications setup

---

## 📦 Option 1: Docker Deployment (แนะนำ)

### Step 1: เตรียม Production Environment Files

```bash
# 1. สร้าง .env.production
cp .env .env.production

# 2. แก้ไข .env.production
nano .env.production
```

**`apps/api/.env.production`**:
```env
NODE_ENV=production
PORT=3001

# Database (Production)
DATABASE_URL="postgresql://prod_user:STRONG_PASSWORD@db_host:5432/teachermon?schema=public"

# JWT (MUST CHANGE!)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_EXPIRES_IN="7d"

# CORS (Production domain only!)
CORS_ORIGIN="https://yourdomain.com"

# AI Features
AI_ENABLED=true
GEMINI_API_KEY="your-production-gemini-key"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

**`apps/web/.env.production`**:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Step 2: Build Docker Images

```bash
# Build API image
docker build -f apps/api/Dockerfile -t teachermon-api:latest .

# Build Web image
docker build -f apps/web/Dockerfile -t teachermon-web:latest .
```

### Step 3: Create Production Docker Compose

**`docker-compose.prod.yml`**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: teachermon-db-prod
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: teachermon
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - '5432:5432'
    restart: always
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: teachermon-api:latest
    container_name: teachermon-api-prod
    env_file:
      - apps/api/.env.production
    ports:
      - '3001:3001'
    depends_on:
      postgres:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/health']
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: teachermon-web:latest
    container_name: teachermon-web-prod
    env_file:
      - apps/web/.env.production
    ports:
      - '3000:3000'
    depends_on:
      - api
    restart: always

  nginx:
    image: nginx:alpine
    container_name: teachermon-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - '80:80'
      - '443:443'
    depends_on:
      - api
      - web
    restart: always

volumes:
  postgres_data_prod:
```

### Step 4: Deploy

```bash
# 1. สร้าง environment variables
export POSTGRES_USER=prod_user
export POSTGRES_PASSWORD=your_strong_password

# 2. รัน services
docker-compose -f docker-compose.prod.yml up -d

# 3. Run migrations
docker exec -it teachermon-api-prod pnpm db:migrate:deploy

# 4. ตรวจสอบ
docker ps
curl http://localhost:3001/health
```

---

## 🌐 Setup HTTPS & SSL Certificates

### Option 1: Let's Encrypt (ฟรี - แนะนำ)

#### 1. ติดตั้ง Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### 2. สร้าง SSL Certificate

```bash
# สำหรับ domain เดียว
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# สำหรับ subdomain (API)
sudo certbot --nginx -d api.yourdomain.com
```

#### 3. Auto-renewal

```bash
# ทดสอบ renewal
sudo certbot renew --dry-run

# Cron job (auto-renew ทุก 12 ชั่วโมง)
sudo crontab -e
```

เพิ่มบรรทัดนี้:
```
0 0,12 * * * certbot renew --quiet
```

### Option 2: Cloudflare SSL (ฟรี + CDN)

1. สร้าง account ที่ https://cloudflare.com
2. เพิ่ม domain
3. เปลี่ยน nameservers ไปที่ Cloudflare
4. เปิด "Full (Strict)" SSL mode
5. เปิด "Always Use HTTPS"

**ข้อดี**:
- ✅ ฟรี forever
- ✅ CDN included
- ✅ DDoS protection
- ✅ Auto SSL renewal

---

## 🔒 Security Configuration

### 1. Nginx Security Headers

**`nginx/nginx.conf`**:
```nginx
http {
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # API Server
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;
        
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        location / {
            proxy_pass http://api:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Rate limiting
            limit_req zone=api burst=20 nodelay;
        }
        
        location /api/auth/login {
            proxy_pass http://api:3001;
            # Stricter rate limit for login
            limit_req zone=login burst=3 nodelay;
        }
    }
    
    # Web Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;
        
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        location / {
            proxy_pass http://web:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }
}
```

### 2. Firewall Setup (UFW)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Check status
sudo ufw status
```

### 3. Fail2Ban (Protection against brute force)

```bash
# Install
sudo apt install fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local
```

**`/etc/fail2ban/jail.local`**:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring (PM2)

```bash
# Install PM2
npm install -g pm2

# Start API
pm2 start apps/api/dist/main.js --name teachermon-api

# Start Web
pm2 start apps/web/.next/standalone/server.js --name teachermon-web

# Monitor
pm2 monit

# Logs
pm2 logs

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### 2. Error Tracking (Sentry)

```bash
# Install
pnpm add @sentry/node @sentry/nextjs
```

**`apps/api/src/main.ts`**:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 3. Database Monitoring

```sql
-- Create monitoring user
CREATE USER monitoring WITH PASSWORD 'monitor_password';
GRANT pg_monitor TO monitoring;

-- Monitor queries
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start DESC;

-- Monitor database size
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname))
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

### 4. Uptime Monitoring

**Services แนะนำ**:
- **UptimeRobot** (https://uptimerobot.com) - ฟรี 50 monitors
- **Pingdom** (https://pingdom.com)
- **StatusCake** (https://statuscake.com)

**Setup**:
1. สร้าง account
2. เพิ่ม monitors:
   - `https://yourdomain.com` (Web)
   - `https://api.yourdomain.com/health` (API)
3. ตั้งค่า alerts (Email, SMS, Slack)

---

## 💾 Backup & Disaster Recovery

### 1. Database Backup Script

**`scripts/backup-db.sh`**:
```bash
#!/bin/bash

# Configuration
DB_NAME="teachermon"
DB_USER="postgres"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/teachermon_$DATE.sql"
RETENTION_DAYS=30

# Create backup
echo "🗄️  Starting backup: $BACKUP_FILE"
pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE

# Compress
gzip $BACKUP_FILE
echo "✅ Backup completed: ${BACKUP_FILE}.gz"

# Delete old backups
find $BACKUP_DIR -name "teachermon_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "🗑️  Cleaned up backups older than $RETENTION_DAYS days"

# Upload to cloud (optional)
# aws s3 cp ${BACKUP_FILE}.gz s3://your-bucket/backups/
# rclone copy ${BACKUP_FILE}.gz remote:backups/
```

### 2. Automated Backup (Cron)

```bash
# สร้าง executable
chmod +x scripts/backup-db.sh

# ตั้ง cron (backup ทุกวันเวลา 2:00 AM)
crontab -e
```

เพิ่ม:
```
0 2 * * * /path/to/teachermon/scripts/backup-db.sh >> /var/log/teachermon-backup.log 2>&1
```

### 3. Restore Database

```bash
# จาก backup file
gunzip -c teachermon_20260124_020000.sql.gz | psql -U postgres -d teachermon

# หรือใช้ pg_restore
gunzip teachermon_20260124_020000.sql.gz
pg_restore -U postgres -d teachermon -c teachermon_20260124_020000.sql
```

### 4. Application Backup

```bash
# Backup code, configs, และ uploads
tar -czf teachermon_app_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  /path/to/teachermon
```

---

## 🚨 Disaster Recovery Plan

### Scenario 1: Database Failure

```bash
# 1. Stop services
docker-compose down

# 2. Restore latest backup
gunzip -c /backups/latest.sql.gz | psql -U postgres -d teachermon

# 3. Restart services
docker-compose up -d

# 4. Verify
curl http://localhost:3001/health
```

### Scenario 2: Server Failure

```bash
# 1. Spin up new server
# 2. Install Docker
# 3. Clone repository
git clone https://github.com/your-org/teachermon.git

# 4. Restore environment files
cp /backups/.env.production apps/api/.env

# 5. Restore database
# (upload backup file to server first)
docker-compose up -d postgres
gunzip -c backup.sql.gz | docker exec -i teachermon-db psql -U postgres -d teachermon

# 6. Start all services
docker-compose -f docker-compose.prod.yml up -d
```

### Scenario 3: Data Corruption

```bash
# 1. Identify corruption point
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;

# 2. Restore to point-in-time
# (ถ้ามี WAL archiving enabled)
pg_restore --target-time="2026-01-24 10:00:00"

# 3. Re-run migrations
pnpm db:migrate:deploy
```

---

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_teacher_school ON teacher_profile(school_id);
CREATE INDEX idx_journal_teacher ON reflective_journal(teacher_id);
CREATE INDEX idx_evidence_teacher ON evidence_portfolio(teacher_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM teacher_profile WHERE school_id = 'xxx';

-- Vacuum database
VACUUM ANALYZE;
```

### 2. API Optimization

```typescript
// Enable compression
import compression from 'compression';
app.use(compression());

// Cache static assets
app.use(express.static('public', {
  maxAge: '1y',
  immutable: true,
}));
```

### 3. Frontend Optimization

```typescript
// next.config.js
module.exports = {
  compress: true,
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable SWC minifier
  swcMinify: true,
};
```

---

## ✅ Post-Deployment Checklist

### Immediately After Deploy
- [ ] ทดสอบ login ทุก role
- [ ] ทดสอบ CRUD operations
- [ ] ตรวจสอบ logs (ไม่มี errors)
- [ ] ทดสอบ HTTPS certificate
- [ ] ทดสอบ mobile responsive
- [ ] ตรวจสอบ performance (page load time)

### Within 24 Hours
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Review security logs
- [ ] Test backup & restore
- [ ] Verify monitoring alerts work

### Within 1 Week
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation update
- [ ] Team training

---

## 📞 Support & Maintenance

### Daily Tasks
- ตรวจสอบ logs
- Monitor uptime
- Check disk space

### Weekly Tasks
- Review error reports
- Database maintenance
- Security updates

### Monthly Tasks
- Full backup test
- Performance review
- Security audit
- Dependency updates

---

## 📚 Resources

- **NestJS Production**: https://docs.nestjs.com/faq/deployment
- **Next.js Production**: https://nextjs.org/docs/deployment
- **PostgreSQL Backup**: https://www.postgresql.org/docs/current/backup.html
- **Docker Production**: https://docs.docker.com/config/containers/start-containers-automatically/
- **Nginx Security**: https://www.nginx.com/blog/nginx-ssl-configuration-step-by-step/

---

**Last Updated**: 24 มกราคม 2569  
**Version**: 1.0.0
