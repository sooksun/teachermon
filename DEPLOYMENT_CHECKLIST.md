# 🚀 Deployment Checklist - TeacherMon

## ก่อน Deploy

### ✅ Database Setup

- [ ] สร้าง production database ใน PostgreSQL
- [ ] Backup database เดิม (ถ้ามี)
- [ ] ตั้งค่า DATABASE_URL ใน production environment
- [ ] Run migrations: `pnpm db:migrate:deploy`
- [ ] Verify schema ด้วย Prisma Studio

### ✅ Environment Variables

#### Backend (`apps/api/.env`)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:password@host:5432/teachermon"
JWT_SECRET="<strong-random-secret>"
CORS_ORIGIN="https://your-domain.com"
```

#### Frontend (`apps/web/.env.local`)
```bash
NEXT_PUBLIC_API_URL="https://api.your-domain.com/api"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<strong-random-secret>"
```

### ✅ Security

- [ ] เปลี่ยน JWT_SECRET เป็นค่าที่ปลอดภัย (min 32 characters)
- [ ] เปลี่ยน NEXTAUTH_SECRET
- [ ] เปลี่ยน database password
- [ ] ตั้งค่า CORS ให้ถูกต้อง
- [ ] Enable HTTPS
- [ ] ตั้งค่า rate limiting
- [ ] Review user permissions

### ✅ Build & Test

- [ ] Build backend: `cd apps/api && pnpm build`
- [ ] Build frontend: `cd apps/web && pnpm build`
- [ ] Run tests: `pnpm test`
- [ ] Test production build locally
- [ ] Verify all APIs work

### ✅ Performance

- [ ] Database indexing (ตรวจสอบใน schema.prisma)
- [ ] Enable API caching (optional)
- [ ] Optimize images
- [ ] Enable compression
- [ ] CDN setup (optional)

## Deployment Options

### Option 1: Laragon (Local/Dev Server)

1. Setup database ใน Laragon
2. Copy project ไปที่ `d:\laragon\www\teachermon`
3. Run migrations
4. Start services:
```bash
cd apps/api && pnpm start:prod
cd apps/web && pnpm start
```

### Option 2: Docker

```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 3: Cloud (Vercel + Railway/Supabase)

#### Frontend (Vercel)
1. Push code to GitHub
2. Import project ใน Vercel
3. Set environment variables
4. Deploy

#### Backend (Railway/Render)
1. Push code to GitHub
2. Create new service
3. Set environment variables
4. Deploy

#### Database (Supabase)
1. Create Supabase project
2. Get DATABASE_URL
3. Run migrations
4. Seed data

## หลัง Deploy

### ✅ Verification

- [ ] ทดสอบ login
- [ ] ทดสอบ CRUD operations ทุก module
- [ ] ตรวจสอบ API responses
- [ ] ตรวจสอบ dashboard loading
- [ ] ทดสอบบน mobile devices
- [ ] ตรวจสอบ performance (load time)

### ✅ Monitoring

- [ ] Setup error logging (Sentry, optional)
- [ ] Setup uptime monitoring
- [ ] Setup database backups
- [ ] Monitor API response times
- [ ] Monitor disk space

### ✅ User Management

- [ ] สร้าง admin users
- [ ] สร้าง project manager users
- [ ] Import ข้อมูลครูจริง (327 คน)
- [ ] Import ข้อมูลโรงเรียนจริง (285 แห่ง)
- [ ] ส่ง credentials ให้ผู้ใช้
- [ ] จัด training session

## 📊 Production Data Import

### Step 1: Prepare Data

สร้างไฟล์ CSV/Excel:
- `schools.csv` - ข้อมูลโรงเรียน 285 แห่ง
- `teachers.csv` - ข้อมูลครู 327 คน

### Step 2: Import Script

```bash
cd packages/database
# สร้าง import script ใน prisma/import.ts
pnpm tsx prisma/import.ts
```

### Step 3: Verify

```bash
pnpm db:studio
# ตรวจสอบว่าข้อมูลถูกต้อง
```

## 🔒 Security Checklist

- [ ] HTTPS enabled
- [ ] Strong passwords enforced
- [ ] JWT token expiration set
- [ ] SQL injection protected (Prisma)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] PDPA compliance checked

## 📈 Performance Benchmarks

Target metrics:
- API response time: < 200ms
- Page load time: < 2s
- Database query time: < 100ms
- Uptime: > 99.5%

## 🆘 Rollback Plan

ถ้า deployment มีปัญหา:

1. Backup database ก่อน deploy
2. Keep previous version ready
3. Document all changes
4. Test rollback procedure
5. Have restore script ready

```bash
# Restore database
psql -U postgres teachermon < backup.sql

# Rollback code
git revert <commit-hash>
```

## 📞 Support Contacts

- Technical Lead: [Name]
- Database Admin: [Name]
- Project Manager: นายสุขสันต์ สอนนวล (081-277-1948)

## ✅ Sign-off

- [ ] Project Manager approved
- [ ] Technical review completed
- [ ] Security audit passed
- [ ] Performance test passed
- [ ] User acceptance test passed
- [ ] Documentation complete

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Approved By**: _______________

---

**Version**: 1.0.0  
**Last Updated**: 23 มกราคม 2569
