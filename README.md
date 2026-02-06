# 📊 TeacherMon - ระบบติดตามและหนุนเสริมการพัฒนาครูรัก(ษ์)ถิ่น

> Kru Rak Thin Monitoring & Support System (KRT-MSS)

[![Status](https://img.shields.io/badge/status-ready-green.svg)]()
[![License](https://img.shields.io/badge/license-private-blue.svg)]()

## 🎯 ภาพรวม

ระบบติดตามและหนุนเสริมการพัฒนาครูรัก(ษ์)ถิ่น สำหรับ **327 ครู** ใน **285 โรงเรียน** โดยใช้แนวคิด:
- School-Based Development
- Mentoring System (5 Systems Model)
- Professional Learning Community (PLC)
- Data-Driven Decision Making

**วัตถุประสงค์หลัก:**
1. เก็บข้อมูลและติดตามการพัฒนาครูแบบรายบุคคล
2. สนับสนุนการหนุนเสริมผ่าน Site Visit, Lesson Study, และ Coaching
3. สร้าง Dashboard เชิงบริหารและข้อเสนอเชิงนโยบาย

## ⚡ Quick Start

### Development Mode (5 นาที)

```bash
# 1. ติดตั้ง dependencies
pnpm install

# 2. Setup database (อัตโนมัติ)
docker-compose up -d postgres
.\scripts\setup-db.ps1

# 3. รัน development
pnpm dev
```

**เข้าใช้งาน**: 
- 🌐 Web: http://localhost:3000
- 🔧 API: http://localhost:3001
- 📚 Swagger: http://localhost:3001/api

**Login**: `admin@example.com` / `admin123`

📖 **คู่มือละเอียด**: 
- [QUICK_START.md](QUICK_START.md) - เริ่มใช้งานด่วน
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Setup database
- [READY_TO_TEST.md](READY_TO_TEST.md) - ⭐ เริ่มทดสอบ

## 🛠️ Tech Stack

### Backend
- **NestJS** 10.4 - Progressive Node.js framework
- **Prisma** 5.22 - Next-generation ORM
- **PostgreSQL** 15 - Relational database
- **JWT** - Authentication
- **Swagger** - API documentation

### Frontend
- **Next.js** 14.2 - React framework (App Router)
- **React Query** 5.62 - Data fetching & caching
- **Tailwind CSS** 3.4 - Utility-first CSS
- **Recharts** 2.15 - Charts library
- **Zustand** 5.0 - State management

## 📁 โครงสร้างโปรเจกต์

```
teachermon/
├── apps/
│   ├── web/              # 🌐 Next.js Frontend
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # React Components
│   │   └── lib/         # Utils & Hooks
│   └── api/              # 🔌 NestJS Backend
│       ├── src/
│       │   ├── auth/            # Authentication
│       │   ├── teachers/        # Teacher CRUD
│       │   ├── schools/         # School CRUD
│       │   ├── journals/        # Reflective Journals
│       │   ├── mentoring/       # Site Visits
│       │   ├── plc/             # PLC Activities
│       │   ├── assessment/      # Assessments & IDP
│       │   └── dashboard/       # Statistics
│       └── test/                # Tests
├── packages/
│   ├── database/         # 🗄️ Prisma Schema
│   └── shared/           # 📦 Shared Code
├── doc/                  # 📚 Documentation
│   ├── doc_ref.pdf      # PRD & Data Dictionary
│   └── doc_ref1.pdf     # Project Proposal
├── docker-compose.yml    # 🐳 Docker Setup
├── README.md             # 📖 This file
├── INSTALLATION.md       # 🔧 Full installation guide
├── QUICK_START.md        # ⚡ Quick start guide
└── PROJECT_SUMMARY.md    # 📊 Project summary
```

## ✨ Features

### 👨‍🏫 Teacher Management
- ✅ ข้อมูลครู 327 คน (CRUD operations)
- ✅ Search, Filter, Pagination
- ✅ Teacher Profile พร้อมสถิติ
- ✅ Export ข้อมูล

### 🏫 School Management
- ✅ ข้อมูลโรงเรียน 285 แห่ง
- ✅ โรงเรียนคุณภาพชุมชน
- ✅ รายชื่อครูในโรงเรียน

### 📝 Reflective Journal
- ✅ บันทึกสะท้อนตนเองรายเดือน
- ✅ Success stories & Challenges
- ✅ Timeline view

### 👥 Mentoring & Site Visit
- ✅ บันทึกการลงพื้นที่
- ✅ Lesson Study observations
- ✅ Coaching notes
- ✅ Follow-up tracking

### 🤝 PLC Activities
- ✅ Professional Learning Community
- ✅ Group management (จังหวัด/ภูมิภาค)
- ✅ แลกเปลี่ยนเรียนรู้

### 📊 Assessment & IDP
- ✅ ประเมินสมรรถนะ 4 ด้าน
- ✅ แผนพัฒนารายบุคคล (IDP)
- ✅ Progress tracking

### 📈 Dashboard & Analytics
- ✅ สถิติภาพรวม
- ✅ Charts & Visualizations
- ✅ Monthly trends
- ✅ Recent activities

### 🔐 Security
- ✅ JWT Authentication
- ✅ Role-based Access Control (5 roles)
- ✅ Password hashing
- ✅ Protected routes

## 🚀 การติดตั้ง

### Requirements

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 15
- Laragon (สำหรับ Windows) หรือ Docker

### Quick Install

```bash
# 1. ติดตั้ง dependencies
pnpm install

# 2. Setup database (ใน Laragon: สร้าง database ชื่อ "teachermon")
cd packages/database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 3. รันระบบ
# Terminal 1
cd apps/api && pnpm dev

# Terminal 2
cd apps/web && pnpm dev
```

📖 **คู่มือละเอียด**: [INSTALLATION.md](INSTALLATION.md)

## 📋 Scripts

### Development
```bash
pnpm dev                # รันทั้ง frontend + backend
```

### Database
```bash
pnpm db:studio          # เปิด Prisma Studio (GUI)
pnpm db:migrate         # รัน migrations
pnpm db:seed            # Seed ข้อมูลตัวอย่าง
pnpm db:push            # Push schema โดยไม่สร้าง migration
```

### Build & Deploy
```bash
pnpm build              # Build ทั้งโปรเจกต์
docker-compose up       # รันด้วย Docker
```

### Testing
```bash
pnpm test               # รัน unit tests
pnpm test:watch         # Watch mode
pnpm test:cov           # Coverage report
```

## 🔗 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Web Application |
| Backend API | http://localhost:3001/api | REST API |
| API Docs | http://localhost:3001/api/docs | Swagger UI |
| Prisma Studio | http://localhost:5555 | Database GUI |

## 👤 Test Users (Development)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | manager123 |
| Mentor | mentor@example.com | mentor123 |
| Teacher | teacher1@example.com | teacher123 |

⚠️ **Production**: เปลี่ยน password ทั้งหมดก่อน deploy!

## 🎓 Key Concepts

ระบบนี้ออกแบบตาม **5 Systems Model**:

1. **Local Mentoring System** - ครูพี่เลี้ยงท้องถิ่น
2. **Expert & Coaching System** - ผู้เชี่ยวชาญสนับสนุน
3. **Professional Learning Community** - เพื่อนร่วมวิชาชีพ
4. **Self-Reflection & Growth** - สะท้อนตนเองและพัฒนาต่อเนื่อง
5. **Administrative & Support** - อำนวยการและนโยบาย

## 📚 เอกสารอ้างอิง

### 🚀 Getting Started (เริ่มใช้งาน)
- **[READY_TO_TEST.md](READY_TO_TEST.md)** ⭐ - **เริ่มที่นี่!** Quick Start สำหรับทดสอบ
- [QUICK_START.md](QUICK_START.md) - เริ่มต้นใช้งานด่วน 5 นาที
- [INSTALLATION.md](INSTALLATION.md) - คู่มือติดตั้งแบบละเอียด
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - คู่มือ setup database

### 🧪 Testing & QA
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - คู่มือทดสอบครบถ้วน
- `scripts/test-api.ps1` - ทดสอบ API อัตโนมัติ
- `scripts/import-data.ps1` - Import ข้อมูล CSV
- [data/README.md](data/README.md) - คู่มือ import data

### 🚀 Production Deployment
- **[PRODUCTION_READY.md](PRODUCTION_READY.md)** ⭐ - สรุป deployment ทั้งหมด
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - คู่มือ deploy production
- **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** - Checklist ก่อน deploy
- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Security hardening
- `scripts/deploy-production.sh` - Deploy อัตโนมัติ
- `scripts/backup-db.sh` - Database backup
- `scripts/health-check.sh` - Health monitoring

### 📊 Project Info
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - สรุปโปรเจกต์และฟีเจอร์
- [TASK_SUMMARY.md](TASK_SUMMARY.md) - สรุปงานทั้งหมด (20/20 todos)
- [STATUS.md](STATUS.md) - สถานะปัจจุบัน
- [CHANGELOG.md](CHANGELOG.md) - บันทึกการเปลี่ยนแปลง

## 🏗️ Architecture

### Database Schema (9 Tables)

1. **school_profile** - โรงเรียน
2. **teacher_profile** - ครู
3. **mentoring_visit** - การลงพื้นที่
4. **competency_assessment** - ประเมินสมรรถนะ
5. **reflective_journal** - บันทึกสะท้อนตนเอง
6. **plc_activity** - กิจกรรม PLC
7. **development_plan** - แผนพัฒนารายบุคคล
8. **policy_insight** - บทเรียนเชิงนโยบาย
9. **users** - ผู้ใช้งานระบบ

### API Modules

- 🔐 **Auth** - Authentication & Authorization
- 👨‍🏫 **Teachers** - Teacher management
- 🏫 **Schools** - School management
- 📝 **Journals** - Reflective journals
- 👥 **Mentoring** - Site visits & Lesson Study
- 🤝 **PLC** - PLC activities
- 📊 **Assessment** - Competency & IDP
- 📈 **Dashboard** - Statistics & Analytics

## 📱 Frontend Pages

- `/` - หน้าแรก
- `/login` - เข้าสู่ระบบ
- `/dashboard` - Dashboard หลัก
- `/teachers` - จัดการข้อมูลครู
- `/teachers/[id]` - รายละเอียดครู
- `/teachers/[id]/edit` - แก้ไขข้อมูล
- `/schools` - โรงเรียน
- `/journals` - Reflective Journals
- `/mentoring` - การหนุนเสริม
- `/plc` - กิจกรรม PLC
- `/assessment` - ประเมินสมรรถนะ

## 🔧 Development

### Prerequisites

ติดตั้งและตรวจสอบ versions:

```bash
node --version    # v20.x.x
pnpm --version    # 9.x.x หรือสูงกว่า
```

### Setup

```bash
# Clone & Install
git clone <repo>
cd teachermon
pnpm install

# Database setup
cd packages/database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Run development
cd ../..
pnpm dev
```

### Using Docker

```bash
docker-compose up
```

## 🧪 Testing

```bash
# Backend tests
cd apps/api
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:cov       # Coverage

# Frontend tests (coming soon)
cd apps/web
pnpm test
```

## 📦 Monorepo Structure

```
teachermon/
├── apps/
│   ├── web/              # 🌐 Next.js Frontend
│   └── api/              # 🔌 NestJS Backend
├── packages/
│   ├── database/         # 🗄️ Prisma + PostgreSQL
│   ├── shared/           # 📦 Shared Types & Utils
│   └── ui/               # 🎨 UI Components (future)
├── doc/                  # 📚 Documentation
│   ├── doc_ref.pdf      # PRD & Data Dictionary
│   └── doc_ref1.pdf     # Project Proposal
├── docker-compose.yml    # 🐳 Docker Setup
└── [guides]              # 📖 Installation & Quick Start
```
