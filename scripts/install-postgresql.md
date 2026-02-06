# คู่มือติดตั้ง PostgreSQL บน Windows

## วิธีที่ 1: ใช้ Docker (แนะนำ - ง่ายที่สุด)

### 1. เปิด Docker Desktop
- คลิก Docker Desktop icon
- รอจนกว่าจะเห็น "Docker Desktop is running"
- ใช้เวลาประมาณ 1-2 นาที

### 2. เริ่ม PostgreSQL Container

```bash
cd d:\laragon\www\teachermon
docker-compose up -d postgres
```

### 3. ตรวจสอบว่า PostgreSQL รันแล้ว

```bash
docker ps
# ควรเห็น container ชื่อ "teachermon-db"
```

### 4. ต่อไปทำตามขั้นตอนใน setup-db.ps1

---

## วิธีที่ 2: ติดตั้ง PostgreSQL Standalone

### 1. Download PostgreSQL

ดาวน์โหลดจาก: https://www.postgresql.org/download/windows/

- เลือก PostgreSQL 15.x (stable version)
- ขนาดประมาณ 300 MB
- รองรับ Windows 10/11

### 2. ติดตั้ง PostgreSQL

1. รัน installer ที่ดาวน์โหลดมา
2. ตั้งค่าตามนี้:
   - Installation Directory: `C:\Program Files\PostgreSQL\15`
   - Port: `5432` (default)
   - Locale: `Thai, Thailand` หรือ `English, United States`
   - **Password**: `postgres` (จำไว้!)
3. ติดตั้ง components:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (GUI tool)
   - ✅ Command Line Tools
   - ⬜ Stack Builder (ไม่จำเป็น)
4. คลิก "Next" จนเสร็จ

### 3. เพิ่ม PostgreSQL ใน PATH

1. เปิด "Environment Variables"
2. แก้ไข "Path" ใน System variables
3. เพิ่ม: `C:\Program Files\PostgreSQL\15\bin`
4. กด OK
5. **ปิด PowerShell แล้วเปิดใหม่**

### 4. ตรวจสอบว่าติดตั้งสำเร็จ

```powershell
psql --version
# Output: psql (PostgreSQL) 15.x
```

### 5. สร้าง Database

```powershell
# Login เข้า PostgreSQL
psql -U postgres

# สร้าง database
CREATE DATABASE teachermon;

# ตรวจสอบ
\l

# ออกจาก psql
\q
```

### 6. แก้ไข .env ใน packages/database/.env

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/teachermon?schema=public"
```

**เปลี่ยน `your_password` เป็นรหัสผ่านที่ตั้งไว้!**

---

## วิธีที่ 3: ใช้ PostgreSQL Portable (ไม่ต้องติดตั้ง)

### 1. Download Portable Version

จาก: https://www.enterprisedb.com/download-postgresql-binaries

### 2. แตกไฟล์

```
D:\postgresql\
  ├── bin\
  ├── lib\
  └── ...
```

### 3. Init Database

```bash
cd D:\postgresql
.\bin\initdb.exe -D data -U postgres -W
```

### 4. เริ่ม PostgreSQL

```bash
.\bin\pg_ctl.exe -D data start
```

### 5. สร้าง Database

```bash
.\bin\psql.exe -U postgres -c "CREATE DATABASE teachermon;"
```

---

## เมื่อ PostgreSQL พร้อมแล้ว

รันสคริปต์เพื่อ setup database:

```powershell
cd d:\laragon\www\teachermon
.\scripts\setup-db.ps1
```

หรือทำทีละขั้นตอน:

```bash
# 1. Generate Prisma Client
cd packages/database
pnpm db:generate

# 2. Run Migrations
pnpm db:migrate:dev

# 3. Seed Data
pnpm db:seed

# 4. กลับไป root
cd ../..

# 5. เริ่มใช้งาน
pnpm dev
```

---

## Troubleshooting

### ปัญหา: psql: command not found

**แก้ไข**: เพิ่ม PostgreSQL ใน PATH (ดูวิธีที่ 2 ข้อ 3)

### ปัญหา: FATAL: password authentication failed

**แก้ไข**: 
1. ตรวจสอบ password ใน `.env`
2. Reset password:
   ```sql
   ALTER USER postgres PASSWORD 'new_password';
   ```

### ปัญหา: Port 5432 ถูกใช้งานแล้ว

**แก้ไข**:
1. หา process ที่ใช้ port:
   ```powershell
   netstat -ano | findstr :5432
   ```
2. ปิด process หรือเปลี่ยน port ใน docker-compose.yml

### ปัญหา: Docker Desktop ไม่เปิด

**แก้ไข**:
- ตรวจสอบว่า Hyper-V เปิดอยู่ (Windows Features)
- หรือใช้ WSL 2 backend
- ติดตั้งใหม่ถ้าจำเป็น

---

## ตรวจสอบว่า Setup สำเร็จ

```bash
# เช็คว่า PostgreSQL รัน
psql -U postgres -h localhost -p 5432 -c "SELECT version();"

# เช็คว่ามี database
psql -U postgres -h localhost -p 5432 -l

# เช็คว่ามี tables
psql -U postgres -h localhost -p 5432 -d teachermon -c "\dt"
```

ควรเห็น 9 tables:
- school_profile
- teacher_profile
- mentoring_visit
- competency_assessment
- reflective_journal
- plc_activity
- development_plan
- policy_insight
- users

---

## ข้อมูล Login Demo

หลังจาก seed data แล้ว ใช้ข้อมูลนี้ login:

**Admin**
- Email: `admin@example.com`
- Password: `admin123`

**Project Manager**
- Email: `manager@example.com`
- Password: `manager123`

**Mentor**
- Email: `mentor@example.com`
- Password: `mentor123`

**Teacher**
- Email: `teacher1@example.com`
- Password: `teacher123`
