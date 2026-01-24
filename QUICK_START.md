# 🚀 Quick Start Guide - TeacherMon

## เริ่มต้นใช้งานด่วน 5 นาที

### Step 1: เปิด PostgreSQL ใน Laragon

1. เปิด Laragon
2. กด "Start All" เพื่อเริ่ม PostgreSQL service
3. คลิกขวาที่ Laragon tray icon → Database → PostgreSQL → Create database
4. ตั้งชื่อว่า `teachermon`

หรือใช้ command line:

```bash
# เปิด PostgreSQL shell
psql -U postgres

# สร้าง database
CREATE DATABASE teachermon;
\q
```

### Step 2: Setup Database

```bash
cd d:\laragon\www\teachermon

# Generate Prisma Client
cd packages\database
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed ข้อมูลตัวอย่าง
pnpm db:seed
```

### Step 3: รันระบบ

เปิด 2 terminals:

**Terminal 1 - Backend API:**
```bash
cd d:\laragon\www\teachermon\apps\api
pnpm dev
```

รอจนกว่าจะเห็น:
```
🚀 TeacherMon API is running on: http://localhost:3001/api
📚 API Documentation: http://localhost:3001/api/docs
```

**Terminal 2 - Frontend:**
```bash
cd d:\laragon\www\teachermon\apps\web
pnpm dev
```

รอจนกว่าจะเห็น:
```
✓ Ready in 3s
○ Local: http://localhost:3000
```

### Step 4: เข้าสู่ระบบ

1. เปิด browser ไปที่ **http://localhost:3000**
2. คลิก "เข้าสู่ระบบ"
3. ใช้ข้อมูลทดสอบ:

```
Email: admin@teachermon.com
Password: password123
```

### Step 5: ทดสอบระบบ

1. ✅ ดู Dashboard - สถิติต่างๆ พร้อม charts
2. ✅ ไปที่ "ข้อมูลครู" - ดูรายชื่อครู 6 คน (ตัวอย่าง)
3. ✅ คลิกที่ครูคนใดคนหนึ่ง - ดูรายละเอียด
4. ✅ ลองแก้ไขข้อมูล
5. ✅ ดู "โรงเรียน" - โรงเรียน 5 แห่ง
6. ✅ ดู "Reflective Journals" - journals ตัวอย่าง
7. ✅ ดู "การหนุนเสริม" - การลงพื้นที่
8. ✅ ดู "PLC" - กิจกรรม PLC

## 🛠️ Tools & URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Docs (Swagger)**: http://localhost:3001/api/docs
- **Prisma Studio**: `pnpm db:studio` → http://localhost:5555

## 📝 ข้อมูลผู้ใช้ทดสอบ

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@teachermon.com | password123 | เข้าถึงได้ทุกอย่าง |
| Manager | manager@teachermon.com | password123 | ผู้จัดการโครงการ |
| Teacher | pimchanok@example.com | password123 | ครูรัก(ษ์)ถิ่น |
| Teacher | thanaphon@example.com | password123 | ครูรัก(ษ์)ถิ่น |

## ⚠️ Troubleshooting

### Database Connection Error

```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
# ใน Laragon: ดูที่ status bar ด้านล่าง

# ตรวจสอบ connection string ใน .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/teachermon?schema=public"
```

### Port Already in Use

```bash
# ถ้า port 3000 หรือ 3001 ถูกใช้อยู่
# แก้ไขใน .env หรือใช้ command:

# Backend
cd apps/api
pnpm dev -- --port 3002

# Frontend
cd apps/web
pnpm dev -- --port 3100
```

### Prisma Generate Error

```bash
cd packages/database
pnpm install
pnpm db:generate
```

## 🎯 Next Steps

หลังจากระบบทำงานได้แล้ว:

1. ✅ ลอง login ด้วย user แต่ละ role
2. ✅ ทดสอบการเพิ่ม/แก้ไข/ลบข้อมูล
3. ✅ ดู API Documentation ที่ http://localhost:3001/api/docs
4. ✅ เปิด Prisma Studio เพื่อดูข้อมูลในฐานข้อมูล
5. ✅ ศึกษา code structure ใน `apps/` และ `packages/`

## 📖 เอกสารเพิ่มเติม

- [INSTALLATION.md](INSTALLATION.md) - คู่มือติดตั้งแบบละเอียด
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - สรุปโปรเจกต์
- [README.md](README.md) - ภาพรวมโปรเจกต์

---

**หมายเหตุ**: ถ้าเจอปัญหาใดๆ ให้ดูที่ [INSTALLATION.md](INSTALLATION.md) หรือตรวจสอบ logs ใน terminals
