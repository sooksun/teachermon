# คู่มือการติดตั้งระบบ TeacherMon

## ข้อกำหนดระบบ

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 15
- Git

## ขั้นตอนการติดตั้ง

### 1. Clone และติดตั้ง Dependencies

```bash
cd d:\laragon\www\teachermon
pnpm install
```

### 2. Setup Database

#### สำหรับ Laragon (Windows)

1. เปิด Laragon และเริ่ม PostgreSQL service
2. สร้าง database ใหม่ชื่อ `teachermon`

```sql
CREATE DATABASE teachermon;
```

#### Setup Environment Variables

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.local.example apps/web/.env.local

# Database
cp packages/database/.env.example packages/database/.env
```

แก้ไขไฟล์ `.env` ให้ตรงกับการตั้งค่า PostgreSQL ของคุณ:

```
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/teachermon?schema=public"
```

### 3. Generate Prisma Client

```bash
cd packages/database
pnpm db:generate
```

### 4. Run Database Migrations

```bash
pnpm db:migrate
```

### 5. Seed Database

```bash
pnpm db:seed
```

### 6. รันระบบ

#### แบบ Development (แยกทีละ service)

```bash
# Terminal 1 - Backend API
cd apps/api
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

#### แบบ Docker (รันทุกอย่างพร้อมกัน)

```bash
docker-compose up
```

### 7. เข้าถึงระบบ

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Documentation**: http://localhost:3001/api/docs
- **Prisma Studio**: `pnpm db:studio` (http://localhost:5555)

## ข้อมูลผู้ใช้สำหรับทดสอบ

หลังจาก seed database แล้ว สามารถใช้ข้อมูลเข้าสู่ระบบได้ดังนี้:

### Admin
- **Email**: admin@teachermon.com
- **Password**: password123

### Project Manager
- **Email**: manager@teachermon.com
- **Password**: password123

### ครู (Teacher)
- **Email**: pimchanok@example.com
- **Password**: password123

## Scripts ที่สำคัญ

```bash
# รันทั้งระบบ
pnpm dev

# Build ทั้งโปรเจกต์
pnpm build

# Database
pnpm db:studio      # เปิด Prisma Studio
pnpm db:migrate     # รัน migrations
pnpm db:seed        # Seed ข้อมูล
pnpm db:reset       # Reset database (ระวัง!)

# Testing
pnpm test           # รัน tests ทั้งหมด
pnpm test:watch     # รัน tests แบบ watch mode
pnpm test:cov       # Generate coverage report
```

## โครงสร้างโปรเจกต์

```
teachermon/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/          # Authentication
│   │   │   ├── teachers/      # Teacher CRUD
│   │   │   ├── schools/       # School CRUD
│   │   │   ├── journals/      # Reflective Journals
│   │   │   ├── mentoring/     # Mentoring Visits
│   │   │   ├── plc/           # PLC Activities
│   │   │   ├── assessment/    # Assessments & Plans
│   │   │   └── dashboard/     # Dashboard Stats
│   │   └── test/              # E2E Tests
│   └── web/                   # Next.js Frontend
│       ├── app/               # App Router Pages
│       ├── components/        # React Components
│       └── lib/               # Utilities
├── packages/
│   ├── database/              # Prisma Schema
│   └── shared/                # Shared Types & Utils
└── doc/                       # Documentation
```

## การแก้ปัญหาที่พบบ่อย

### Database Connection Error

ตรวจสอบว่า PostgreSQL service ทำงานอยู่:

```bash
# Windows (Laragon)
# ตรวจสอบใน Laragon UI หรือ Services

# Check connection
psql -U postgres -d teachermon
```

### Port Already in Use

ถ้า port 3000 หรือ 3001 ถูกใช้งานอยู่:

```bash
# เปลี่ยน port ในไฟล์ .env
PORT=3002  # สำหรับ backend
```

### Prisma Generate Error

ลบ node_modules และติดตั้งใหม่:

```bash
pnpm clean
rm -rf node_modules
pnpm install
cd packages/database
pnpm db:generate
```

## การ Deploy

### Development

```bash
docker-compose up
```

### Production

อัปเดต environment variables ในไฟล์ `.env`:
- เปลี่ยน `NODE_ENV=production`
- เปลี่ยน `JWT_SECRET` และ `NEXTAUTH_SECRET` เป็นค่าที่ปลอดภัย
- อัปเดต `DATABASE_URL` เป็น production database

```bash
pnpm build
pnpm start:prod
```

## สนับสนุนและติดต่อ

สำหรับปัญหาหรือคำถาม กรุณาติดต่อทีมพัฒนา
