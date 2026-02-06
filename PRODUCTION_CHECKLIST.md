# ✅ TeacherMon - Production Deployment Checklist

**วันที่**: 6 กุมภาพันธ์ 2569  
**Version**: 1.1.0

---

## 📋 Pre-Deployment (ก่อน Deploy)

### Code Quality
- [x] ✅ TypeScript compilation ผ่าน (0 errors)
- [ ] ✅ All tests ผ่าน
- [x] ✅ Linter ผ่าน (no warnings)
- [ ] ✅ Code review เสร็จ
- [x] ✅ Build production สำเร็จ (`pnpm build`)

### Security
- [x] 🔒 เปลี่ยน `JWT_SECRET` — ตั้งค่าใน `.env.production` (minimum 32 characters)
- [x] 🔒 เปลี่ยน Database password — ตั้งค่า `MYSQL_PASSWORD` ใน `.env.production`
- [ ] 🔒 เปลี่ยนหรือลบ default admin accounts
- [x] 🔒 `CORS_ORIGIN` ตั้งค่าเป็น production domain — อ่านจาก env, block ใน production mode (`main.ts`)
- [x] 🔒 Rate limiting เปิดใช้งาน — ThrottlerModule 100 req/min default, 10 req/min strict (`app.module.ts`)
- [x] 🔒 Helmet security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) — `main.ts`
- [x] 🔒 Environment files ไม่มี sensitive data ที่ไม่จำเป็น
- [x] 🔒 `.gitignore` ครบถ้วน (ไม่ commit `.env`, `uploads/`, `data/`, `query.sql`)

### Database
- [ ] 💾 Backup database ปัจจุบัน — ใช้ `scripts/backup.sh`
- [x] 💾 Migration scripts พร้อม — 4 migration files ใน `packages/database/prisma/migrations/`
- [x] 💾 Database indexes ครบถ้วน — 40+ indexes ใน `schema.prisma` (teachers, journals, mentoring, budget ฯลฯ)
- [x] 💾 Connection pooling — Prisma ORM จัดการ connection pool อัตโนมัติ
- [x] 💾 Prisma `db:migrate:deploy` script พร้อมใน `deploy.sh`
- [ ] 💾 ทดสอบ backup & restore script

### Infrastructure
- [ ] 🖥️  Server/Cloud account พร้อม
- [ ] 🌐 Domain name พร้อม
- [ ] 🔐 SSL Certificate พร้อม — `scripts/setup-ssl.sh` สำหรับ Let's Encrypt
- [ ] 🌐 DNS configured และทดสอบแล้ว
- [x] 🔥 Firewall rules — `scripts/setup-server.sh` ตั้งค่า UFW (22, 80, 443)
- [ ] 💰 Billing alert setup (cloud)

### Configuration Files
- [x] 📝 `docker-compose.prod.yml` พร้อม — MySQL 8 + API + Web + Nginx
- [x] 📝 `nginx/nginx.prod.conf` configured — reverse proxy, SSL, rate limiting, cache
- [x] 📝 `.env.production.example` สร้างแล้ว — template ตัวแปรทั้งหมด
- [x] 📝 `apps/api/Dockerfile` — multi-stage build, health check
- [x] 📝 `apps/web/Dockerfile` — multi-stage build, health check
- [x] 📝 `.dockerignore` — กรอง node_modules, .git, .env ฯลฯ
- [ ] 📝 SSL certificates วางใน `nginx/ssl/` (สร้างอัตโนมัติเมื่อรัน deploy)

---

## 🚀 Deployment (ตอน Deploy)

### Build & Deploy
- [x] 🏗️  Dockerfile พร้อม (multi-stage build)
  ```bash
  # build อัตโนมัติผ่าน docker compose
  docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
  ```
- [ ] 🚢 Push images to registry (ถ้าใช้)
- [x] 📦 Deploy script พร้อม
  ```bash
  chmod +x scripts/deploy.sh
  ./scripts/deploy.sh          # deploy ปกติ
  ./scripts/deploy.sh --fresh  # deploy ใหม่ทั้งหมด
  ```
- [x] 🗄️  Database migration อัตโนมัติใน `deploy.sh`
  ```bash
  # รันอัตโนมัติ: prisma migrate deploy
  ```
- [ ] 🌱 Seed initial data (ถ้าจำเป็น) — uncomment ใน `deploy.sh`

### SSL Setup
- [x] 🔐 Setup script พร้อม: `scripts/setup-ssl.sh`
  ```bash
  ./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com
  ```
- [x] 🔐 Auto-renewal ตั้งค่าใน script (cron ทุกวัน 03:00)
- [ ] 🔐 Test SSL configuration
  - https://www.ssllabs.com/ssltest/
- [x] 🔐 Self-signed cert สร้างอัตโนมัติเมื่อยังไม่มี cert (ใน `deploy.sh`)

### Nginx Configuration
- [x] 🌐 Nginx config ถูกต้อง — `nginx/nginx.prod.conf`
- [x] 🌐 HTTP redirect to HTTPS ทำงาน
- [x] 🌐 Rate limiting — general: 20r/s, login: 5r/m
- [x] 🌐 Gzip compression เปิด
- [x] 🌐 Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- [x] 🌐 Static asset caching (`_next/static/` max-age 1 year)
- [x] 🌐 API proxy (`/api/` → api:3001)

---

## ✅ Post-Deployment (หลัง Deploy)

### Immediate Testing (ทันที)
- [ ] 🧪 ทดสอบ HTTPS ทำงาน
  - https://yourdomain.com
- [ ] 🧪 ทดสอบ login ทุก role
  - Admin
  - Manager
  - Mentor
  - Teacher
- [ ] 🧪 ทดสอบ CRUD operations
  - Teachers
  - Schools
  - Journals
  - Budget
- [ ] 🧪 ทดสอบ file upload
- [ ] 🧪 ตรวจสอบ logs (ไม่มี errors)
  ```bash
  docker logs -f teachermon-api
  docker logs -f teachermon-web
  docker logs -f teachermon-db
  ```
- [x] 🧪 Health check endpoint พร้อม
  ```bash
  curl https://yourdomain.com/api/health
  # Response: { status: "ok", uptime, database: "connected" }
  ```

### Within 1 Hour
- [ ] 📊 ตรวจสอบ container status
  ```bash
  docker compose -f docker-compose.prod.yml -p teachermon ps
  ```
- [ ] 📊 ตรวจสอบ disk space
- [ ] 💾 Verify database connectivity
- [ ] 📧 Test alert notifications

### Within 24 Hours
- [ ] 👥 User feedback collection
- [ ] 📈 Monitor performance metrics
  - API response time
  - Page load time
  - Database query time
- [ ] 🔒 Review security logs
- [ ] 🗄️  Database performance check (slow query log)
- [ ] 🧪 Load testing (optional)

### Within 1 Week
- [ ] 📝 Update documentation
- [ ] 👥 Team training
- [ ] 📊 Performance optimization (ถ้าจำเป็น)
- [ ] 🔒 Security audit
- [ ] 💾 Test disaster recovery plan

---

## 🔒 Security Checklist

### Server Security
- [x] 🔥 UFW firewall — `scripts/setup-server.sh` (เปิด 22, 80, 443)
- [x] 🔥 Fail2Ban — ตั้งค่าอัตโนมัติใน `scripts/setup-server.sh`
- [ ] 🔥 SSH key-based auth (disable password)
- [x] 🔥 Non-root user for Docker — Dockerfile ใช้ `USER node`
- [x] 🔥 Auto security updates — unattended-upgrades ใน `scripts/setup-server.sh`

### Application Security
- [x] 🔒 HTTPS enforced (HTTP redirects) — nginx config
- [x] 🔒 Security headers configured
  - X-Frame-Options: SAMEORIGIN (`main.ts` + `nginx.prod.conf`)
  - X-Content-Type-Options: nosniff (`main.ts` + `nginx.prod.conf`)
  - X-XSS-Protection: 1; mode=block (`main.ts` + `nginx.prod.conf`)
  - Content-Security-Policy: self-only (`main.ts`)
  - HSTS: max-age=31536000 (`main.ts`)
- [x] 🔒 Rate limiting active — ThrottlerGuard + Nginx rate limiting
- [x] 🔒 CORS configured — อ่านจาก env, block unknown origins ใน production
- [x] 🔒 SQL injection protection — Prisma ORM parameterized queries
- [x] 🔒 XSS protection — Helmet + validation pipes
- [x] 🔒 Input validation — class-validator, whitelist: true, forbidNonWhitelisted
- [x] 🔒 Password hashing — bcryptjs (10 rounds)
- [x] 🔒 JWT authentication — passport-jwt
- [x] 🔒 Error sanitization — HttpExceptionFilter ซ่อน details ใน production

### Database Security
- [x] 🗄️  MySQL accessible from localhost only — `127.0.0.1:3306` ใน docker-compose
- [x] 🗄️  Strong database password — ตั้งค่าใน `.env.production`
- [x] 🗄️  Regular backups — `scripts/backup.sh` + cron
- [x] 🗄️  MySQL charset: utf8mb4, collation: utf8mb4_unicode_ci
- [x] 🗄️  Slow query log enabled — docker-compose MySQL command
- [x] 🗄️  Production database clean protection — `PrismaService.cleanDatabase()` blocked ใน production

---

## 📊 Monitoring Setup

### Application Monitoring
- [x] 📈 Health check endpoint — `GET /api/health` (database, uptime, response time)
- [x] 📈 Docker health checks — ทั้ง API, Web, MySQL containers
- [x] 📈 Application logs — Docker json-file driver, max 10MB x 5 files
- [ ] 📈 Error tracking (Sentry, Rollbar) — ยังไม่ได้ตั้งค่า
- [ ] 📈 Performance monitoring (New Relic, Datadog) — optional

### Infrastructure Monitoring
- [ ] 🖥️  Server resource monitoring (CPU, RAM, Disk)
- [ ] 🖥️  Uptime monitoring (UptimeRobot, Pingdom)
- [ ] 🖥️  SSL expiry monitoring
- [ ] 🖥️  Disk space alerts

### Database Monitoring
- [x] 🗄️  Slow query log — enabled ใน docker-compose (long_query_time=2s)
- [ ] 🗄️  Connection pool monitoring
- [ ] 🗄️  Database size monitoring
- [x] 🗄️  Max connections configured — 200

### Alert Setup
- [ ] 🔔 Email alerts configured
- [ ] 🔔 Slack/Discord webhook (optional)
- [ ] 🔔 SMS alerts for critical (optional)
- [ ] 🔔 Test all alert channels

---

## 💾 Backup & Recovery

### Automated Backups
- [x] 💾 Database backup script — `scripts/backup.sh`
  ```bash
  chmod +x scripts/backup.sh
  ./scripts/backup.sh
  ```
- [x] 💾 Backup ใช้ `mysqldump --single-transaction` (ไม่ lock tables)
- [x] 💾 Backup compression — gzip
- [x] 💾 Cron job สำหรับ daily backup
  ```bash
  crontab -e
  0 2 * * * cd /opt/teachermon && ./scripts/backup.sh >> backups/backup.log 2>&1
  ```
- [x] 💾 Backup retention policy — 30 วัน (ลบอัตโนมัติ)
- [ ] 💾 Cloud backup (S3, GCS) configured
- [ ] 💾 Test restore process

### Disaster Recovery
- [ ] 🚨 Disaster recovery plan documented
- [ ] 🚨 Backup restoration tested
- [ ] 🚨 RTO/RPO defined
  - RTO (Recovery Time Objective): < 4 hours
  - RPO (Recovery Point Objective): < 24 hours
- [ ] 🚨 Emergency contacts list
- [ ] 🚨 Runbook สำหรับ common issues

---

## 🎯 Performance Optimization

### Database
- [x] ⚡ Indexes — 40+ indexes ครอบคลุม foreign keys, search fields, composite indexes
- [x] ⚡ Prisma ORM query optimization (select, include only needed fields)
- [x] ⚡ Connection pooling — Prisma จัดการอัตโนมัติ
- [x] ⚡ MySQL InnoDB buffer pool — 256MB

### API
- [x] ⚡ Response compression — gzip level 6, threshold 1KB (`main.ts`)
- [x] ⚡ In-memory caching — CacheModule (30s TTL, max 100 items)
- [x] ⚡ Rate limiting — ThrottlerModule
- [x] ⚡ Body parser limits — 5MB max (ป้องกัน DoS)
- [x] ⚡ Swagger API docs — เปิดใช้งาน (`/api/docs`)

### Frontend
- [x] ⚡ Next.js gzip compression
- [x] ⚡ Image optimization — formats: avif, webp
- [x] ⚡ Package optimization — optimizePackageImports (recharts, react-toastify, react-query)
- [x] ⚡ Static asset caching — nginx 1 year cache
- [ ] ⚡ CDN for static assets (optional)
- [ ] ⚡ Service worker/PWA (optional)

---

## 📝 Documentation

### Technical Documentation
- [x] 📚 API documentation — Swagger (`/api/docs`)
- [x] 📚 Deployment process — `scripts/deploy.sh` + checklist นี้
- [ ] 📚 Disaster recovery plan
- [ ] 📚 Monitoring setup guide
- [x] 📚 Backup/restore procedures — `scripts/backup.sh`

### User Documentation
- [ ] 📖 User manual
- [ ] 📖 Video tutorials (optional)
- [ ] 📖 FAQ
- [ ] 📖 Support contact info

---

## 👥 Team Preparation

### Training
- [ ] 🎓 Development team trained on production
- [ ] 🎓 Support team trained on common issues
- [ ] 🎓 Admin users trained on system
- [ ] 🎓 End users training completed

### Support
- [ ] 💬 Support channel setup (Line, Email, Phone)
- [ ] 💬 Issue tracking system (GitHub Issues, Jira)
- [ ] 💬 On-call rotation (if applicable)
- [ ] 💬 Escalation procedure defined

---

## 🎉 Go-Live

### Final Checks (1 hour before)
- [ ] ✅ All checklist items completed
- [ ] ✅ Team ready and available
- [ ] ✅ Rollback plan ready
- [ ] ✅ Backup completed
- [ ] ✅ Monitoring confirmed working

### During Go-Live
- [ ] 🚀 Deploy to production
  ```bash
  ./scripts/deploy.sh
  ```
- [ ] 🚀 Smoke tests pass
- [ ] 🚀 Monitor logs in real-time
  ```bash
  docker compose -f docker-compose.prod.yml -p teachermon logs -f
  ```
- [ ] 🚀 Announce to users

### Post Go-Live (First 2 Hours)
- [ ] 👀 Active monitoring
- [ ] 👀 Respond to issues immediately
- [ ] 👀 User feedback collection
- [ ] 👀 Performance metrics review

---

## 📞 Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Tech Lead | | | |
| DevOps | | | |
| DBA | | | |
| Support | | | |

---

## 🔄 Post-Launch Tasks

### Day 1
- [ ] Monitor all systems
- [ ] Address urgent issues
- [ ] Collect user feedback

### Week 1
- [ ] Performance review
- [ ] Security audit
- [ ] Bug fixes
- [ ] User training

### Month 1
- [ ] Full system review
- [ ] Optimization round
- [ ] Feature requests review
- [ ] Team retrospective

---

## 📁 Production Files Reference

| ไฟล์ | คำอธิบาย |
|---|---|
| `docker-compose.prod.yml` | Production Docker Compose (MySQL + API + Web + Nginx) |
| `apps/api/Dockerfile` | API multi-stage Docker build |
| `apps/web/Dockerfile` | Web multi-stage Docker build |
| `nginx/nginx.prod.conf` | Nginx reverse proxy + SSL + rate limiting |
| `.env.production.example` | Template ตัวแปร production |
| `.dockerignore` | Docker build exclusions |
| `scripts/deploy.sh` | Main deployment script |
| `scripts/backup.sh` | MySQL backup + retention |
| `scripts/setup-ssl.sh` | Let's Encrypt SSL setup + auto-renew |
| `scripts/setup-server.sh` | Server initial setup (Docker, UFW, Fail2ban) |

---

## Quick Deploy Commands

```bash
# 1. Setup server (ครั้งแรก)
sudo ./scripts/setup-server.sh

# 2. ตั้งค่า environment
cp .env.production.example .env.production
nano .env.production

# 3. ติดตั้ง SSL (ถ้ามีโดเมน)
./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com

# 4. Deploy
./scripts/deploy.sh

# 5. ดู logs
docker compose -f docker-compose.prod.yml -p teachermon logs -f

# 6. Backup
./scripts/backup.sh

# 7. Restart
docker compose -f docker-compose.prod.yml -p teachermon restart

# 8. หยุด
docker compose -f docker-compose.prod.yml -p teachermon down
```

---

## ✅ Sign-off

**เมื่อทุกอย่างพร้อม ให้ sign-off**:

- [ ] Project Manager: _______________ Date: __________
- [ ] Tech Lead: _______________ Date: __________
- [ ] DevOps: _______________ Date: __________
- [ ] Security: _______________ Date: __________

---

**Version**: 1.1.0  
**Last Updated**: 6 กุมภาพันธ์ 2569

**หมายเหตุ**: เก็บเอกสารนี้และอัพเดทหลังจาก deploy เพื่อใช้อ้างอิงในอนาคต
