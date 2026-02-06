# ✅ TeacherMon - Ready to Test!

**วันที่**: 24 มกราคม 2569  
**สถานะ**: 🟢 **พร้อมทดสอบ** (หลัง setup database)

---

## 🎉 สิ่งที่เสร็จแล้วทั้งหมด

### ✅ Development (100%)
- [x] ✅ โค้ดทั้งหมด 100+ ไฟล์
- [x] ✅ TypeScript compilation ผ่าน (0 errors)
- [x] ✅ Backend API - 9 modules พร้อมใช้งาน
- [x] ✅ Frontend Web - 12 หน้าพร้อมใช้งาน
- [x] ✅ Database Schema - 15 tables (รวม AI features)
- [x] ✅ AI Features - Evidence, PDPA, Activity Tracking

### ✅ Configuration (100%)
- [x] ✅ Environment files (.env) ทั้งหมด
- [x] ✅ Docker Compose สำหรับ PostgreSQL
- [x] ✅ TypeScript configs
- [x] ✅ API ตั้งค่าเรียบร้อย

### ✅ Documentation (100%)
- [x] ✅ README.md - ภาพรวม
- [x] ✅ QUICK_START.md - เริ่มใช้งานด่วน
- [x] ✅ INSTALLATION.md - คู่มือติดตั้ง
- [x] ✅ SETUP_GUIDE.md - **Setup database**
- [x] ✅ TESTING_GUIDE.md - **คู่มือทดสอบ** (New!)
- [x] ✅ TASK_SUMMARY.md - สรุปงานทั้งหมด

### ✅ Testing Scripts (100%)
- [x] ✅ `scripts/setup-db.ps1` - Setup database อัตโนมัติ
- [x] ✅ `scripts/test-api.ps1` - **ทดสอบ API อัตโนมัติ** (New!)
- [x] ✅ `scripts/import-data.ps1` - **Import CSV data** (New!)

### ✅ Sample Data (100%)
- [x] ✅ `data/sample-schools.csv` - ตัวอย่างโรงเรียน 5 แห่ง
- [x] ✅ `data/sample-teachers.csv` - ตัวอย่างครู 5 คน
- [x] ✅ `data/README.md` - คู่มือ import data

---

## 🚀 ขั้นตอนการเริ่มทดสอบ (3 Steps)

### Step 1: Setup Database (ครั้งเดียว)

เลือก **1 วิธี**:

#### วิธีที่ 1: Docker (แนะนำ)
```powershell
# 1. เปิด Docker Desktop
# 2. รัน PostgreSQL
docker-compose up -d postgres
# 3. รัน setup script
.\scripts\setup-db.ps1
```

#### วิธีที่ 2: PostgreSQL Standalone
```powershell
# 1. ติดตั้ง PostgreSQL จาก https://www.postgresql.org/
# 2. รัน setup script
.\scripts\setup-db.ps1
```

**Expected**: Database พร้อม + 8 users + 5 schools + 6 teachers

---

### Step 2: รันระบบ

```powershell
# รันทั้ง API + Web
pnpm dev
```

**Expected**:
- ✅ API: http://localhost:3001 (Health: http://localhost:3001/health)
- ✅ Swagger: http://localhost:3001/api
- ✅ Web: http://localhost:3000

---

### Step 3: เริ่มทดสอบ!

---

## 📋 5 งานทดสอบหลัก

### ✅ 1. ทดสอบ Login

#### ผ่าน UI (ง่ายที่สุด)
1. เปิด: http://localhost:3000/login
2. ใส่:
   - **Email**: `admin@example.com`
   - **Password**: `admin123`
3. คลิก "เข้าสู่ระบบ"

**Expected**: เข้า Dashboard ได้

#### ผ่าน Script (อัตโนมัติ)
```powershell
.\scripts\test-api.ps1
```

**Expected**: 
```
✅ Admin login สำเร็จ
✅ Manager login สำเร็จ
✅ Mentor login สำเร็จ
✅ Teacher login สำเร็จ
```

#### ข้อมูล Login ทั้งหมด

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | manager123 |
| Mentor | mentor@example.com | mentor123 |
| Teacher | teacher1@example.com | teacher123 |

---

### ✅ 2. ทดสอบ CRUD Operations

#### Teachers
1. **Create**: ไปที่ http://localhost:3000/teachers → คลิก "เพิ่มครู"
2. **Read**: ดูรายการครู (ควรมี 6 คน)
3. **Update**: คลิกแก้ไขครูคนใดคนหนึ่ง
4. **Delete**: คลิกลบ (ถ้ามี)

#### Schools
1. เข้า: http://localhost:3000/schools
2. ควรเห็น 5 โรงเรียน
3. ทดสอบ search/filter

#### Journals
1. เข้า: http://localhost:3000/journals
2. คลิก "สร้างบันทึกใหม่"
3. กรอกข้อมูล → บันทึก
4. ควรเห็นใน Timeline

**หรือใช้ Script**:
```powershell
.\scripts\test-api.ps1
```

---

### ✅ 3. ทดสอบ AI Features

#### 3.1 Evidence Upload (ถ้าใส่ GEMINI_API_KEY)

**ผ่าน UI**:
1. Login เป็น Teacher
2. ไปที่ Evidence/Portfolio
3. อัปโหลดไฟล์ (PDF/Image)

**Expected**:
- ✅ AI วิเคราะห์ชื่อไฟล์
- ✅ แนะนำ Indicator
- ✅ แนะนำ Keywords
- ✅ ตรวจสอบ PDPA

#### 3.2 PDPA Scanner

**ทดสอบผ่าน Script**:
```powershell
.\scripts\test-api.ps1
```

**หรือทดสอบ Manual**:

**Test Case 1: ข้อความมีปัญหา**
```
"นักเรียน ด.ช. สมชาย ใจดี เลขที่ 1-2345-67890-12-3"
```
**Expected**: HIGH_RISK ❌

**Test Case 2: ข้อความปลอดภัย**
```
"วันนี้สอนนักเรียน ก. และ ข. เรื่องการบวกเลข"
```
**Expected**: SAFE ✅

#### 3.3 ตรวจสอบ AI ทำงาน

**ใน `apps/api/.env`** ต้องมี:
```env
AI_ENABLED=true
GEMINI_API_KEY="your-api-key-here"
```

**ถ้าไม่มี API Key**:
- AI จะใช้ Mock responses
- ยังทดสอบ flow ได้ แต่ไม่ได้ผลจริง

---

### ✅ 4. Import ข้อมูลจริง

#### 4.1 เตรียมไฟล์ CSV

**ตัวอย่างมีให้แล้ว**:
- `data/sample-schools.csv` (5 โรงเรียน)
- `data/sample-teachers.csv` (5 ครู)

**สำหรับข้อมูลจริง (327 ครู, 285 โรงเรียน)**:
1. สร้างไฟล์ `data/schools.csv` (285 แห่ง)
2. สร้างไฟล์ `data/teachers.csv` (327 คน)

**รูปแบบ CSV**: ดูใน `data/README.md`

#### 4.2 รัน Import

```powershell
# 1. Import โรงเรียนก่อน
.\scripts\import-data.ps1 -Type schools -File "data/schools.csv"

# 2. Import ครู (หลังโรงเรียน)
.\scripts\import-data.ps1 -Type teachers -File "data/teachers.csv"
```

#### 4.3 ตรวจสอบผล

```powershell
# ตรวจสอบจำนวน
docker exec -it teachermon-db psql -U postgres -d teachermon -c "
SELECT 
  (SELECT COUNT(*) FROM school_profile) as schools,
  (SELECT COUNT(*) FROM teacher_profile) as teachers;
"
```

**Expected**:
```
 schools | teachers
---------+----------
     285 |      327
```

---

### ✅ 5. User Acceptance Testing (UAT)

#### 5.1 Test Scenarios

**Scenario 1: ครูบันทึก Journal**
1. Login เป็น `teacher1@example.com`
2. ไปที่ "บันทึกสะท้อนคิด"
3. สร้างบันทึกใหม่
4. เลือกเดือน + Indicator + เขียนเนื้อหา
5. บันทึก

**Expected**: ✅ บันทึกสำเร็จ, PDPA check ทำงาน

**Scenario 2: Mentor นิเทศครู**
1. Login เป็น `mentor@example.com`
2. ไปที่ "การนิเทศ"
3. บันทึกการนิเทศใหม่
4. เลือกครู + กรอกรายละเอียด
5. บันทึก

**Expected**: ✅ บันทึกสำเร็จ, ครูเห็นการนิเทศ

**Scenario 3: Admin ดู Dashboard**
1. Login เป็น `admin@example.com`
2. เข้า Dashboard
3. ดูกราฟและสถิติ

**Expected**: ✅ แสดงข้อมูลครบถ้วน

#### 5.2 UAT Checklist

**Functionality**:
- [ ] Login/Logout ทำงาน
- [ ] CRUD operations ทำงาน
- [ ] Search/Filter ทำงาน
- [ ] Pagination ทำงาน
- [ ] File upload ทำงาน
- [ ] AI features ทำงาน (ถ้าเปิด)
- [ ] Role-based access ทำงาน

**Usability**:
- [ ] UI สวยงาม ใช้งานง่าย
- [ ] เมนูเข้าใจง่าย
- [ ] Form validation ชัดเจน
- [ ] Error messages เป็นภาษาไทย
- [ ] Responsive (ใช้มือถือได้)

**Performance**:
- [ ] Page load < 3 วินาที
- [ ] API response < 500ms
- [ ] ไม่มี lag เวลาใช้งาน

---

## 📊 Test Report Template

หลังทดสอบเสร็จ สรุปผลตามนี้:

```markdown
# UAT Report - TeacherMon

**วันที่**: [วันที่ทดสอบ]
**ผู้ทดสอบ**: [ชื่อ]

## สรุปผล

| หมวด | ทดสอบ | ผ่าน | ไม่ผ่าน | %ผ่าน |
|------|-------|------|---------|-------|
| Login | 5 | 5 | 0 | 100% |
| CRUD | 12 | 12 | 0 | 100% |
| AI | 8 | 8 | 0 | 100% |
| UAT | 20 | 18 | 2 | 90% |
| **รวม** | **45** | **43** | **2** | **95.6%** |

## ปัญหาที่พบ

### [BUG-001] Title
- **Severity**: High/Medium/Low
- **Description**: [รายละเอียด]
- **Steps to reproduce**: [...]
- **Fix**: [วิธีแก้ไข]

## ข้อเสนอแนะ

1. [ข้อเสนอแนะ 1]
2. [ข้อเสนอแนะ 2]

## สรุป

[สรุปผลการทดสอบ]
```

---

## 🎯 Quick Testing Checklist

```
Pre-requisites:
[x] ✅ โค้ดพร้อม (100%)
[x] ✅ TypeScript ผ่าน
[x] ✅ .env files พร้อม
[x] ✅ Scripts พร้อม
[ ] ⏳ PostgreSQL รัน
[ ] ⏳ pnpm dev รัน

Test 1 - Login:
[ ] Login ผ่าน UI
[ ] Login ผ่าน API
[ ] Logout ทำงาน
[ ] Protected routes ทำงาน

Test 2 - CRUD:
[ ] Create Teacher
[ ] Read Teachers
[ ] Update Teacher
[ ] Delete Teacher
[ ] Schools CRUD
[ ] Journals CRUD

Test 3 - AI:
[ ] Evidence upload + AI analysis
[ ] PDPA scanner ตรวจจับข้อมูลอ่อนไหว
[ ] AI activity tracking

Test 4 - Import:
[ ] Import schools.csv
[ ] Import teachers.csv
[ ] ตรวจสอบจำนวนถูกต้อง

Test 5 - UAT:
[ ] Teacher scenarios
[ ] Mentor scenarios  
[ ] Admin scenarios
[ ] Performance OK
[ ] Security OK
```

---

## 📚 เอกสารที่เกี่ยวข้อง

| เอกสาร | คำอธิบาย |
|--------|----------|
| `TESTING_GUIDE.md` | **คู่มือทดสอบฉบับเต็ม** ⭐ |
| `SETUP_GUIDE.md` | คู่มือ setup database |
| `data/README.md` | คู่มือ import data |
| `scripts/test-api.ps1` | Script ทดสอบ API |
| `scripts/import-data.ps1` | Script import CSV |
| `README.md` | ภาพรวมโปรเจกต์ |

---

## 🆘 ถ้าเจอปัญหา

### ปัญหา: API ไม่ตอบสนอง
```powershell
# ตรวจสอบ
curl http://localhost:3001/health

# ดู logs
cd apps/api
pnpm dev
```

### ปัญหา: Database error
```powershell
# ตรวจสอบ PostgreSQL
docker ps

# ตรวจสอบ connection
psql -U postgres -h localhost -p 5432 -d teachermon
```

### ปัญหา: AI ไม่ทำงาน
1. ตรวจสอบ `GEMINI_API_KEY` ใน `.env`
2. ตรวจสอบ `AI_ENABLED=true`
3. ดู logs ว่ามี error อะไร

---

## 📞 ติดต่อ

- **โรงเรียน**: บ้านพญาไพร
- **อีเมล**: sooksun2511@gmail.com
- **โทร**: 081-277-1948

---

## 🎉 พร้อมแล้ว!

ระบบพร้อมทดสอบ 100% 🚀

**Next Steps**:
1. ✅ Setup database → `SETUP_GUIDE.md`
2. ✅ รัน `pnpm dev`
3. ✅ เริ่มทดสอบ! → `TESTING_GUIDE.md`

**Good Luck! 🎊**

---

**Last Updated**: 24 มกราคม 2569
