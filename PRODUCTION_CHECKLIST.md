# ✅ TeacherMon - Production Deployment Checklist

**วันที่**: 24 มกราคม 2569  
**Version**: 1.0.0

---

## 📋 Pre-Deployment (ก่อน Deploy)

### Code Quality
- [ ] ✅ TypeScript compilation ผ่าน (0 errors)
- [ ] ✅ All tests ผ่าน
- [ ] ✅ Linter ผ่าน (no warnings)
- [ ] ✅ Code review เสร็จ
- [ ] ✅ Build production สำเร็จ (`pnpm build`)

### Security
- [ ] 🔒 เปลี่ยน `JWT_SECRET` (ใหม่ minimum 32 characters)
- [ ] 🔒 เปลี่ยน Database password
- [ ] 🔒 เปลี่ยนหรือลบ default admin accounts
- [ ] 🔒 `CORS_ORIGIN` ตั้งค่าเป็น production domain
- [ ] 🔒 Rate limiting เปิดใช้งาน
- [ ] 🔒 Environment files ไม่มี sensitive data ที่ไม่จำเป็น
- [ ] 🔒 `.gitignore` ครบถ้วน (ไม่ commit `.env` files)

### Database
- [ ] 💾 Backup database ปัจจุบัน
- [ ] 💾 Migration scripts พร้อม
- [ ] 💾 Database indexes ครบถ้วน
- [ ] 💾 Connection pooling ตั้งค่าแล้ว
- [ ] 💾 ทดสอบ backup & restore script

### Infrastructure
- [ ] 🖥️  Server/Cloud account พร้อม
- [ ] 🌐 Domain name พร้อม
- [ ] 🔐 SSL Certificate พร้อม
- [ ] 🌐 DNS configured และทดสอบแล้ว
- [ ] 🔥 Firewall rules ตั้งค่าแล้ว
- [ ] 💰 Billing alert setup (cloud)

### Configuration Files
- [ ] 📝 `docker-compose.prod.yml` พร้อม
- [ ] 📝 `nginx.conf` configured
- [ ] 📝 `.env.production` files สร้างแล้ว
- [ ] 📝 SSL certificates วางในตำแหน่งที่ถูกต้อง

---

## 🚀 Deployment (ตอน Deploy)

### Build & Deploy
- [ ] 🏗️  Build Docker images
  ```bash
  docker build -f apps/api/Dockerfile -t teachermon-api:latest .
  docker build -f apps/web/Dockerfile -t teachermon-web:latest .
  ```
- [ ] 🚢 Push images to registry (ถ้าใช้)
- [ ] 📦 Deploy to server
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```
- [ ] 🗄️  Run database migrations
  ```bash
  docker exec -it teachermon-api-prod pnpm db:migrate:deploy
  ```
- [ ] 🌱 Seed initial data (ถ้าจำเป็น)

### SSL Setup
- [ ] 🔐 Install Certbot (ถ้าใช้ Let's Encrypt)
- [ ] 🔐 Generate SSL certificates
  ```bash
  sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
  ```
- [ ] 🔐 Test SSL configuration
  - https://www.ssllabs.com/ssltest/
- [ ] 🔐 Setup auto-renewal
  ```bash
  sudo certbot renew --dry-run
  ```

### Nginx Configuration
- [ ] 🌐 Nginx config ถูกต้อง
- [ ] 🌐 Test config: `nginx -t`
- [ ] 🌐 Reload nginx: `nginx -s reload`
- [ ] 🌐 HTTP redirect to HTTPS ทำงาน
- [ ] 🌐 Rate limiting ทำงาน

---

## ✅ Post-Deployment (หลัง Deploy)

### Immediate Testing (ทันที)
- [ ] 🧪 ทดสอบ HTTPS ทำงาน
  - https://yourdomain.com
  - https://api.yourdomain.com
- [ ] 🧪 ทดสอบ login ทุก role
  - Admin
  - Manager
  - Mentor
  - Teacher
- [ ] 🧪 ทดสอบ CRUD operations
  - Teachers
  - Schools
  - Journals
- [ ] 🧪 ทดสอบ file upload
- [ ] 🧪 ตรวจสอบ logs (ไม่มี errors)
  ```bash
  docker logs teachermon-api-prod
  docker logs teachermon-web-prod
  ```
- [ ] 🧪 Test API health
  ```bash
  curl https://api.yourdomain.com/health
  ```

### Within 1 Hour
- [ ] 📊 ตรวจสอบ monitoring dashboards
- [ ] 📊 ตรวจสอบ error tracking (Sentry)
- [ ] 📊 ตรวจสอบ uptime monitoring
- [ ] 💾 Verify first automatic backup
- [ ] 📧 Test alert notifications

### Within 24 Hours
- [ ] 👥 User feedback collection
- [ ] 📈 Monitor performance metrics
  - API response time
  - Page load time
  - Database query time
- [ ] 🔒 Review security logs
- [ ] 🗄️  Database performance check
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
- [ ] 🔥 UFW firewall enabled
- [ ] 🔥 Fail2Ban configured
- [ ] 🔥 SSH key-based auth (disable password)
- [ ] 🔥 Non-root user for deployment
- [ ] 🔥 Auto security updates enabled
  ```bash
  sudo apt install unattended-upgrades
  ```

### Application Security
- [ ] 🔒 HTTPS enforced (HTTP redirects)
- [ ] 🔒 Security headers configured
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Content-Security-Policy
- [ ] 🔒 Rate limiting active
- [ ] 🔒 CORS configured properly
- [ ] 🔒 SQL injection protection (Prisma ORM)
- [ ] 🔒 XSS protection enabled

### Database Security
- [ ] 🗄️  PostgreSQL accessible from localhost only
- [ ] 🗄️  Strong database password
- [ ] 🗄️  Regular backups enabled
- [ ] 🗄️  Connection encryption (SSL/TLS)

---

## 📊 Monitoring Setup

### Application Monitoring
- [ ] 📈 PM2 monitoring (ถ้าใช้)
- [ ] 📈 Error tracking (Sentry, Rollbar)
- [ ] 📈 Application logs centralized
- [ ] 📈 Performance monitoring (New Relic, Datadog)

### Infrastructure Monitoring
- [ ] 🖥️  Server resource monitoring (CPU, RAM, Disk)
- [ ] 🖥️  Uptime monitoring (UptimeRobot, Pingdom)
- [ ] 🖥️  SSL expiry monitoring
- [ ] 🖥️  Disk space alerts

### Database Monitoring
- [ ] 🗄️  Query performance monitoring
- [ ] 🗄️  Connection pool monitoring
- [ ] 🗄️  Database size monitoring
- [ ] 🗄️  Slow query log enabled

### Alert Setup
- [ ] 🔔 Email alerts configured
- [ ] 🔔 Slack/Discord webhook (optional)
- [ ] 🔔 SMS alerts for critical (optional)
- [ ] 🔔 Test all alert channels

---

## 💾 Backup & Recovery

### Automated Backups
- [ ] 💾 Database backup script configured
  ```bash
  chmod +x scripts/backup-db.sh
  ```
- [ ] 💾 Cron job for daily backup
  ```bash
  crontab -e
  0 2 * * * /path/to/backup-db.sh
  ```
- [ ] 💾 Backup retention policy (30 days)
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
- [ ] ⚡ Indexes created
- [ ] ⚡ Query optimization
- [ ] ⚡ Connection pooling configured
- [ ] ⚡ Vacuum schedule

### API
- [ ] ⚡ Response compression enabled
- [ ] ⚡ Caching strategy implemented
- [ ] ⚡ Rate limiting configured
- [ ] ⚡ Database query optimization

### Frontend
- [ ] ⚡ Image optimization
- [ ] ⚡ Code splitting
- [ ] ⚡ CDN for static assets (optional)
- [ ] ⚡ Service worker/PWA (optional)

---

## 📝 Documentation

### Technical Documentation
- [ ] 📚 API documentation updated
- [ ] 📚 Deployment process documented
- [ ] 📚 Disaster recovery plan
- [ ] 📚 Monitoring setup guide
- [ ] 📚 Backup/restore procedures

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
- [ ] 🚀 Smoke tests pass
- [ ] 🚀 Monitor logs in real-time
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

## ✅ Sign-off

**เมื่อทุกอย่างพร้อม ให้ sign-off**:

- [ ] Project Manager: _______________ Date: __________
- [ ] Tech Lead: _______________ Date: __________
- [ ] DevOps: _______________ Date: __________
- [ ] Security: _______________ Date: __________

---

**Version**: 1.0.0  
**Last Updated**: 24 มกราคม 2569

**หมายเหตุ**: เก็บเอกสารนี้และอัพเดทหลังจาก deploy เพื่อใช้อ้างอิงในอนาคต
