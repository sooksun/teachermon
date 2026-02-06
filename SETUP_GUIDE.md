# 🚀 TeacherMon - Setup Guide

## ✅ สถานะปัจจุบัน

- [x] ✅ โค้ดทั้งหมดพร้อมใช้งาน (100%)
- [x] ✅ TypeScript compilation ผ่าน (ไม่มี errors)
- [x] ✅ ไฟล์ `.env` ทั้งหมดสร้างแล้ว
- [ ] ⏳ PostgreSQL (ต้องติดตั้ง)
- [ ] ⏳ Database migrations
- [ ] ⏳ Seed data

---

## 🎯 ขั้นตอนการ Setup (เลือก 1 วิธี)

### 📌 วิธีที่ 1: ใช้ Docker (แนะนำ - ง่ายที่สุด)

**ข้อดี**: ไม่ต้องติดตั้งอะไร, setup อัตโนมัติ, ใช้เวลาแค่ 5 นาที

#### 1. เปิด Docker Desktop
- คลิก Docker Desktop icon
- รอจน status เป็น "Docker Desktop is running" (1-2 นาที)

#### 2. เริ่ม PostgreSQL Container

```powershell
cd d:\laragon\www\teachermon
docker-compose up -d postgres
```

Output ที่ควรเห็น:
```
✔ Container teachermon-db  Started
```

#### 3. ตรวจสอบว่า PostgreSQL รันแล้ว

```powershell
docker ps
```

ควรเห็น:
```
CONTAINER ID   IMAGE                 STATUS        PORTS                    NAMES
xxxxx          postgres:15-alpine    Up 10 sec     0.0.0.0:5432->5432/tcp   teachermon-db
```

#### 4. รัน Setup Script (อัตโนมัติ)

```powershell
.\scripts\setup-db.ps1
```

Script จะทำให้อัตโนมัติ:
- ✅ ตรวจสอบ PostgreSQL
- ✅ สร้าง database `teachermon`
- ✅ Generate Prisma Client
- ✅ Run migrations (สร้าง 9 tables + indexes)
- ✅ Seed ข้อมูลตัวอย่าง (5 schools, 6 teachers, 8 users)

#### 5. เริ่มใช้งาน

```powershell
pnpm dev
```

เปิดเบราว์เซอร์:
- 🌐 Frontend: http://localhost:3000
- 🔧 API: http://localhost:3001
- 📚 Swagger Docs: http://localhost:3001/api

---

### 📌 วิธีที่ 2: ติดตั้ง PostgreSQL Standalone

**ใช้เมื่อ**: ไม่มี Docker หรือต้องการใช้ PostgreSQL แบบถาวร

#### 1. ดาวน์โหลดและติดตั้ง

**ดาวน์โหลด**: https://www.postgresql.org/download/windows/

- เลือก PostgreSQL 15.x
- ตั้ง password: `postgres` (หรือจำไว้)
- Port: `5432`
- เลือก locale ที่ต้องการ

#### 2. เพิ่ม PostgreSQL ใน PATH

```powershell
# ตรวจสอบว่าติดตั้งแล้ว
psql --version
```

ถ้ายังไม่ได้:
1. เปิด "Environment Variables"
2. แก้ไข "Path"
3. เพิ่ม: `C:\Program Files\PostgreSQL\15\bin`
4. **Restart PowerShell**

#### 3. แก้ไข .env (ถ้าใช้ password อื่น)

แก้ไขไฟล์:
- `packages/database/.env`
- `apps/api/.env`

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/teachermon?schema=public"
```

#### 4. รัน Setup Script

```powershell
cd d:\laragon\www\teachermon
.\scripts\setup-db.ps1
```

---

### 📌 วิธีที่ 3: Setup Manual (ทีละขั้นตอน)

ถ้า script ไม่ทำงาน ให้ทำทีละขั้นตอน:

#### 1. สร้าง Database

```powershell
# Login PostgreSQL (Docker)
docker exec -it teachermon-db psql -U postgres

# หรือ Standalone
psql -U postgres
```

```sql
CREATE DATABASE teachermon;
\q
```

#### 2. Generate Prisma Client

```powershell
cd packages/database
pnpm db:generate
```

#### 3. Run Migrations

```powershell
pnpm db:migrate:dev
```

ตั้งชื่อ migration: `initial_schema`

#### 4. Seed Data

```powershell
pnpm db:seed
```

#### 5. กลับไป Root และรันระบบ

```powershell
cd ../..
pnpm dev
```

---

## 🔐 ข้อมูล Login (หลัง Seed)

### Admin (เข้าถึงทุกอย่าง)
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Project Manager
- **Email**: `manager@example.com`
- **Password**: `manager123`

### Mentor (นิเทศก์)
- **Email**: `mentor@example.com`
- **Password**: `mentor123`

### Teacher (ครู)
- **Email**: `teacher1@example.com`
- **Password**: `teacher123`

---

## 📊 ตรวจสอบว่า Setup สำเร็จ

### 1. เช็ค PostgreSQL

```powershell
# Docker
docker exec -it teachermon-db psql -U postgres -c "\l"

# Standalone
psql -U postgres -l
```

ควรเห็น database: `teachermon`

### 2. เช็ค Tables (ควรมี 15 tables)

```powershell
# Docker
docker exec -it teachermon-db psql -U postgres -d teachermon -c "\dt"

# Standalone
psql -U postgres -d teachermon -c "\dt"
```

ควรเห็น 15 tables:
- ✅ school_profile
- ✅ teacher_profile
- ✅ mentoring_visit
- ✅ competency_assessment
- ✅ reflective_journal
- ✅ plc_activity
- ✅ development_plan
- ✅ policy_insight
- ✅ users
- ✅ evidence_portfolio (AI Feature)
- ✅ pdpa_audit (AI Feature)
- ✅ ai_activity (AI Feature)
- ✅ _prisma_migrations

### 3. เช็ค Seed Data

```powershell
# Docker
docker exec -it teachermon-db psql -U postgres -d teachermon -c "SELECT COUNT(*) FROM users;"

# Standalone
psql -U postgres -d teachermon -c "SELECT COUNT(*) FROM users;"
```

ควรได้: `count: 8`

### 4. ทดสอบ API

```powershell
# ต้องรัน pnpm dev ก่อน
curl http://localhost:3001/health
```

ควรได้: `{"status":"ok"}`

### 5. ทดสอบ Login

1. เปิด: http://localhost:3000/login
2. ใส่: `admin@example.com` / `admin123`
3. ควรเข้า Dashboard ได้

---

## 🛠️ Troubleshooting

### ปัญหา: Docker ไม่เปิด

**แก้ไข**:
1. เปิด Docker Desktop
2. ตรวจสอบว่า WSL 2 เปิดอยู่
3. Restart computer ถ้าจำเป็น

### ปัญหา: Port 5432 ถูกใช้

**แก้ไข**:
```powershell
# หา process ที่ใช้ port
netstat -ano | findstr :5432

# ปิด process หรือเปลี่ยน port ใน docker-compose.yml
```

### ปัญหา: psql: command not found

**แก้ไข**:
- เพิ่ม PostgreSQL bin ใน PATH
- Restart terminal
- หรือใช้ full path: `"C:\Program Files\PostgreSQL\15\bin\psql.exe"`

### ปัญหา: password authentication failed

**แก้ไข**:
- ตรวจสอบ password ใน `.env`
- ใช้ password ที่ตั้งไว้เวลาติดตั้ง

### ปัญหา: Migration failed

**แก้ไข**:
1. ลบ database และสร้างใหม่:
   ```sql
   DROP DATABASE teachermon;
   CREATE DATABASE teachermon;
   ```
2. รัน migrate อีกครั้ง

### ปัญหา: Prisma Client ไม่ทำงาน

**แก้ไข**:
```powershell
cd packages/database
rm -rf node_modules/.prisma
pnpm db:generate
```

---

## 🚀 Next Steps (หลัง Setup สำเร็จ)

### ทันที
- [ ] Login และทดสอบระบบ
- [ ] สร้างครูทดสอบ 1-2 คน
- [ ] ทดสอบการบันทึก Journal
- [ ] ทดสอบ AI Features (ถ้าใส่ GEMINI_API_KEY)

### ระยะสั้น
- [ ] Import ข้อมูลจริง (327 ครู, 285 โรงเรียน)
- [ ] ตั้งค่า GEMINI_API_KEY สำหรับ AI
- [ ] User Acceptance Testing (UAT)
- [ ] เก็บ feedback

### ระยะยาว
- [ ] Deploy to production
- [ ] Setup HTTPS
- [ ] Configure backup
- [ ] Setup monitoring

---

## 📞 ติดต่อ

- **โรงเรียน**: บ้านพญาไพร
- **อีเมล**: sooksun2511@gmail.com
- **โทร**: 081-277-1948

---

## 📚 เอกสารเพิ่มเติม

- `README.md` - ภาพรวมโปรเจกต์
- `QUICK_START.md` - คู่มือเริ่มใช้งานด่วน
- `INSTALLATION.md` - คู่มือติดตั้งแบบละเอียด
- `scripts/install-postgresql.md` - คู่มือติดตั้ง PostgreSQL

---

**สร้างเมื่อ**: 24 มกราคม 2569  
**สถานะ**: ✅ พร้อมใช้งาน (หลัง setup database)
