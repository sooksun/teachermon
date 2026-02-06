# 🧪 TeacherMon - Testing Guide

**วันที่สร้าง**: 24 มกราคม 2569  
**สถานะ**: พร้อมทดสอบหลัง database setup เสร็จ

---

## ⚠️ ข้อกำหนดเบื้องต้น

ก่อนเริ่มทดสอบ ต้องทำสิ่งเหล่านี้ให้เสร็จก่อน:

- [x] ✅ โค้ดทั้งหมดพร้อมใช้งาน
- [x] ✅ TypeScript compilation ผ่าน
- [x] ✅ ไฟล์ .env ทั้งหมดพร้อม
- [ ] ⏳ PostgreSQL รันอยู่
- [ ] ⏳ Database migrations เสร็จ
- [ ] ⏳ Seed data เสร็จ
- [ ] ⏳ API และ Web รันอยู่

**หากยังไม่ได้ setup database**: ดูที่ `SETUP_GUIDE.md`

---

## 🚀 การเริ่มต้น - รันระบบทั้งหมด

### วิธีที่ 1: รันทั้ง 3 services พร้อมกัน (แนะนำ)

```powershell
# Terminal 1: รัน Development mode (API + Web)
pnpm dev
```

### วิธีที่ 2: รันทีละส่วน (สำหรับ debugging)

```powershell
# Terminal 1: API
cd apps/api
pnpm dev

# Terminal 2: Web
cd apps/web
pnpm dev

# Terminal 3: Database (ถ้าใช้ Docker)
docker-compose up postgres
```

### ตรวจสอบว่าทุก service รันแล้ว

```powershell
# API health check
curl http://localhost:3001/health

# Web
# เปิด browser: http://localhost:3000

# Database
docker exec -it teachermon-db psql -U postgres -d teachermon -c "SELECT COUNT(*) FROM users;"
```

---

## 📋 Test Checklist - 5 งานหลัก

### ✅ 1. ทดสอบ Login (Authentication)

#### 1.1 ทดสอบ Login ผ่าน UI

**URL**: http://localhost:3000/login

**Test Cases**:

| Role | Email | Password | Expected Result |
|------|-------|----------|-----------------|
| Admin | admin@example.com | admin123 | ✅ เข้า Dashboard ได้ |
| Manager | manager@example.com | manager123 | ✅ เข้า Dashboard ได้ |
| Mentor | mentor@example.com | mentor123 | ✅ เข้า Dashboard ได้ |
| Teacher | teacher1@example.com | teacher123 | ✅ เข้า Dashboard ได้ |
| Invalid | wrong@email.com | wrong123 | ❌ แสดง error message |

**Checklist**:
- [ ] Login สำเร็จ - redirect ไป `/dashboard`
- [ ] Login ผิด - แสดง error message
- [ ] Token ถูกเก็บใน localStorage/cookies
- [ ] Logout ได้ - token ถูกลบ
- [ ] Protected routes ทำงาน - ไม่ login ไม่เข้าได้

#### 1.2 ทดสอบ Login API (ด้วย curl)

```powershell
# Test 1: Login สำเร็จ (Admin)
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}'

# Expected: {"access_token": "jwt-token-here", "user": {...}}

# Test 2: Login ผิด
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"wrong@email.com\",\"password\":\"wrong\"}'

# Expected: {"statusCode": 401, "message": "Invalid credentials"}
```

#### 1.3 ทดสอบ JWT Token

```powershell
# 1. Login และเก็บ token
$response = curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}' | ConvertFrom-Json

$token = $response.access_token

# 2. ใช้ token เข้า protected route
curl http://localhost:3001/api/teachers `
  -H "Authorization: Bearer $token"

# Expected: รายการครูทั้งหมด
```

**Test Results**:
```
✅ Login UI ทำงาน
✅ Login API ทำงาน
✅ JWT Token ถูกต้อง
✅ Protected routes ทำงาน
✅ Role-based access ทำงาน
```

---

### ✅ 2. ทดสอบ CRUD Operations

#### 2.1 Teachers CRUD

**2.1.1 Create (สร้างครูใหม่)**

```powershell
# ผ่าน API
curl -X POST http://localhost:3001/api/teachers `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    \"fullName\": \"นายทดสอบ ระบบ\",
    \"personalId\": \"1234567890123\",
    \"schoolId\": \"existing-school-id\",
    \"subject\": \"คณิตศาสตร์\",
    \"cohort\": 2024,
    \"status\": \"ACTIVE\"
  }'
```

**ผ่าน UI**: 
1. เข้า http://localhost:3000/teachers
2. คลิก "เพิ่มครูใหม่"
3. กรอกฟอร์ม
4. คลิก "บันทึก"

**Expected**: 
- ✅ ครูใหม่ถูกสร้าง
- ✅ แสดงใน Teacher List
- ✅ มี ID และ timestamps

**2.1.2 Read (ดูรายการครู)**

```powershell
# ดูทั้งหมด
curl http://localhost:3001/api/teachers `
  -H "Authorization: Bearer $token"

# ดูครูคนเดียว
curl http://localhost:3001/api/teachers/{teacherId} `
  -H "Authorization: Bearer $token"
```

**ผ่าน UI**:
1. เข้า http://localhost:3000/teachers
2. คลิกที่ชื่อครู

**Expected**:
- ✅ แสดงรายการครูทั้งหมด
- ✅ Filter/Search ทำงาน
- ✅ Pagination ทำงาน
- ✅ แสดงรายละเอียดครูได้

**2.1.3 Update (แก้ไขข้อมูลครู)**

```powershell
curl -X PUT http://localhost:3001/api/teachers/{teacherId} `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{\"status\": \"INACTIVE\"}'
```

**ผ่าน UI**:
1. เข้า http://localhost:3000/teachers/{id}/edit
2. แก้ไขข้อมูล
3. คลิก "บันทึก"

**Expected**:
- ✅ ข้อมูลอัพเดท
- ✅ แสดงข้อความสำเร็จ
- ✅ updatedAt เปลี่ยน

**2.1.4 Delete (ลบครู)**

```powershell
curl -X DELETE http://localhost:3001/api/teachers/{teacherId} `
  -H "Authorization: Bearer $token"
```

**Expected**:
- ✅ ครูถูกลบ
- ⚠️ ควรมี confirmation dialog

**Test Results**:
```
✅ Create Teacher ทำงาน
✅ Read Teachers ทำงาน
✅ Update Teacher ทำงาน
✅ Delete Teacher ทำงาน
✅ Validation ทำงาน (ป้องกัน invalid data)
```

#### 2.2 Schools CRUD

**ทดสอบแบบเดียวกับ Teachers**:
- [ ] Create School
- [ ] Read Schools (list + detail)
- [ ] Update School
- [ ] Delete School

**API Endpoints**:
- `POST /api/schools`
- `GET /api/schools`
- `GET /api/schools/:id`
- `PUT /api/schools/:id`
- `DELETE /api/schools/:id`

#### 2.3 Journals (Reflective Journals) CRUD

**URL**: http://localhost:3000/journals

**Test Cases**:
- [ ] สร้าง Journal ใหม่ (New Journal Form)
- [ ] ดูรายการ Journals (Timeline view)
- [ ] กรอก Indicator (WP.1, WP.2, ET.1, etc.)
- [ ] เลือกเดือน
- [ ] บันทึกและแสดงผล

**Expected**:
- ✅ Journal ถูกสร้าง
- ✅ แสดง Timeline
- ✅ Filter by month/indicator
- ✅ AI suggestions (ถ้าเปิด AI)

---

### ✅ 3. ทดสอบ AI Features

**⚠️ หมายเหตุ**: ต้องใส่ `GEMINI_API_KEY` ใน `apps/api/.env` ก่อน

#### 3.1 Evidence Upload (การจัดการหลักฐาน)

**URL**: http://localhost:3000/evidence (หรือผ่าน API)

**Test Cases**:

**3.1.1 อัปโหลดไฟล์หลักฐาน**

```powershell
# ผ่าน API
curl -X POST http://localhost:3001/api/evidence `
  -H "Authorization: Bearer $token" `
  -F "file=@path/to/file.pdf" `
  -F "teacherId=teacher-id" `
  -F "originalFilename=แผนการสอน-คณิตศาสตร์.pdf"
```

**Expected AI Analysis**:
```json
{
  "id": "evidence-id",
  "aiAnalysis": {
    "summary": "เอกสารแผนการสอนคณิตศาสตร์",
    "suggestedIndicators": ["WP.1", "WP.2"],
    "keywords": ["แผนการสอน", "คณิตศาสตร์"],
    "qualityCheck": "GOOD",
    "suggestions": [...]
  },
  "pdpaCheck": {
    "isSafe": true,
    "riskLevel": "SAFE",
    "violations": []
  }
}
```

**Test Checklist**:
- [ ] อัปโหลดไฟล์ได้ (PDF, JPG, PNG, DOCX)
- [ ] AI วิเคราะห์ชื่อไฟล์และแนะนำ Indicator
- [ ] แนะนำชื่อไฟล์มาตรฐาน
- [ ] แนะนำ keywords
- [ ] ตรวจสอบคุณภาพเอกสาร

#### 3.2 PDPA Scanner (ตรวจสอบข้อมูลส่วนบุคคล)

**Test Cases**:

**3.2.1 ข้อความที่มีข้อมูลอ่อนไหว**

```powershell
curl -X POST http://localhost:3001/api/ai/pdpa/check `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    \"text\": \"นักเรียน ด.ช. สมชาย ใจดี เลขที่ 1-2345-67890-12-3 โทร 081-234-5678\",
    \"sourceType\": \"journal\",
    \"sourceId\": \"test-id\"
  }'
```

**Expected Response**:
```json
{
  "isSafe": false,
  "riskLevel": "HIGH_RISK",
  "violations": [
    {
      "type": "STUDENT_FULL_NAME",
      "matchedText": "ด.ช. สมชาย ใจดี",
      "riskLevel": "HIGH",
      "suggestion": "ใช้ \"นักเรียน ก.\" หรือชื่อเล่นแทน"
    },
    {
      "type": "CITIZEN_ID",
      "matchedText": "1-2345-67890-12-3",
      "riskLevel": "HIGH",
      "suggestion": "ห้ามระบุเลขประจำตัวประชาชน"
    },
    {
      "type": "PHONE_NUMBER",
      "matchedText": "081-234-5678",
      "riskLevel": "MEDIUM",
      "suggestion": "ไม่ควรระบุเบอร์โทรศัพท์นักเรียน"
    }
  ],
  "sanitizedText": "นักเรียน [ระบุชื่อเล่น] เลขที่ [เลขประจำตัว] โทร [เบอร์โทรศัพท์]",
  "suggestions": [
    "ใช้ \"นักเรียน ก.\" หรือชื่อเล่นแทน",
    "ห้ามระบุเลขประจำตัวประชาชน",
    "ไม่ควรระบุเบอร์โทรศัพท์นักเรียน"
  ]
}
```

**3.2.2 ข้อความที่ปลอดภัย**

```powershell
curl -X POST http://localhost:3001/api/ai/pdpa/check `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    \"text\": \"วันนี้สอนนักเรียน ก. และ ข. เรื่องการบวกเลข ทั้งสองคนเข้าใจดี\",
    \"sourceType\": \"journal\",
    \"sourceId\": \"test-id\"
  }'
```

**Expected**:
```json
{
  "isSafe": true,
  "riskLevel": "SAFE",
  "violations": [],
  "suggestions": []
}
```

**Test Checklist**:
- [ ] ตรวจจับชื่อ-นามสกุลเต็ม (HIGH_RISK)
- [ ] ตรวจจับเลขบัตรประชาชน (HIGH_RISK)
- [ ] ตรวจจับเบอร์โทรศัพท์ (MEDIUM_RISK)
- [ ] ตรวจจับที่อยู่ (MEDIUM_RISK)
- [ ] แนะนำการแก้ไข (suggestions)
- [ ] สร้าง sanitized text

#### 3.3 AI Activity Tracking

**ดูประวัติการใช้ AI**:

```powershell
# Admin: ดูทั้งหมด
curl http://localhost:3001/api/ai/admin/activities?limit=10 `
  -H "Authorization: Bearer $adminToken"

# User: ดูของตัวเอง
curl http://localhost:3001/api/ai/admin/activities/user/{userId} `
  -H "Authorization: Bearer $token"
```

**Expected**:
- ✅ บันทึกทุกครั้งที่ใช้ AI
- ✅ แสดงข้อมูล: user, timestamp, feature, tokens used
- ✅ Admin เห็นทั้งหมด
- ✅ User เห็นของตัวเอง

**Test Results**:
```
✅ Evidence AI Analysis ทำงาน
✅ PDPA Scanner ทำงาน (ตรวจจับถูกต้อง)
✅ AI Activity Tracking ทำงาน
✅ Sanitized text ถูกต้อง
✅ Suggestions มีประโยชน์
```

---

### ✅ 4. Import ข้อมูลจริง (327 ครู, 285 โรงเรียน)

#### 4.1 เตรียมข้อมูล

**รูปแบบ CSV/Excel ที่รองรับ**:

**Schools (285 โรงเรียน)**:
```csv
schoolName,province,district,region,area,schoolType
โรงเรียนบ้านพญาไพร,พะเยา,เชียงคำ,ภาคเหนือ,ห่างไกล,ประถมศึกษา
...
```

**Teachers (327 ครู)**:
```csv
fullName,personalId,schoolName,subject,cohort,status
นายสมชาย ใจดี,1234567890123,โรงเรียนบ้านพญาไพร,คณิตศาสตร์,2024,ACTIVE
...
```

#### 4.2 สร้าง Import Script

```powershell
# สร้างไฟล์ import script
# ดูที่ scripts/import-data.ps1 (จะสร้างให้)
```

#### 4.3 รัน Import

```powershell
# Import โรงเรียน
.\scripts\import-data.ps1 -Type schools -File "path/to/schools.csv"

# Import ครู
.\scripts\import-data.ps1 -Type teachers -File "path/to/teachers.csv"
```

#### 4.4 ตรวจสอบผล

```powershell
# นับจำนวน
docker exec -it teachermon-db psql -U postgres -d teachermon -c "SELECT COUNT(*) FROM school_profile;"
# Expected: 285

docker exec -it teachermon-db psql -U postgres -d teachermon -c "SELECT COUNT(*) FROM teacher_profile;"
# Expected: 327
```

**Test Checklist**:
- [ ] Import schools สำเร็จ (285 แห่ง)
- [ ] Import teachers สำเร็จ (327 คน)
- [ ] ข้อมูลถูกต้อง (spot check 10-20 records)
- [ ] Relations ถูกต้อง (teacher → school)
- [ ] ไม่มี duplicate records

---

### ✅ 5. User Acceptance Testing (UAT)

#### 5.1 UAT Test Cases (ตาม User Stories)

**5.1.1 ครู (Teacher) - บันทึกบันทึกสะท้อนคิด**

**User Story**: 
> "ในฐานะครู ฉันต้องการบันทึกบันทึกสะท้อนคิดประจำเดือน เพื่อสะท้อนการพัฒนาตนเอง"

**Test Steps**:
1. Login ด้วย teacher account
2. ไปที่ "บันทึกสะท้อนคิด"
3. คลิก "สร้างบันทึกใหม่"
4. เลือกเดือน
5. เลือก Indicator (WP.1, WP.2, etc.)
6. เขียนเนื้อหา
7. คลิก "บันทึก"

**Expected**:
- ✅ บันทึกถูกสร้าง
- ✅ AI แนะนำการปรับปรุงภาษา (ถ้าเปิด AI)
- ✅ PDPA check ทำงาน
- ✅ แสดงใน Timeline

**5.1.2 Mentor - นิเทศครู**

**User Story**:
> "ในฐานะ Mentor ฉันต้องการบันทึกการนิเทศครู เพื่อติดตามความก้าวหน้า"

**Test Steps**:
1. Login ด้วย mentor account
2. ไปที่ "การนิเทศ"
3. คลิก "บันทึกการนิเทศใหม่"
4. เลือกครู
5. เลือกประเภทการนิเทศ
6. กรอกรายละเอียด
7. คลิก "บันทึก"

**Expected**:
- ✅ การนิเทศถูกบันทึก
- ✅ ครูเห็นรายการนิเทศของตัวเอง
- ✅ Mentor เห็นการนิเทศทั้งหมดที่ทำ

**5.1.3 Admin - ดูภาพรวม Dashboard**

**User Story**:
> "ในฐานะ Admin ฉันต้องการเห็นภาพรวมของระบบ เพื่อตัดสินใจ"

**Test Steps**:
1. Login ด้วย admin account
2. เข้า Dashboard
3. ดูกราฟและสถิติ

**Expected**:
- ✅ แสดงจำนวนครูทั้งหมด
- ✅ แสดงจำนวนโรงเรียน
- ✅ แสดงกราฟแนวโน้ม (Trends)
- ✅ แสดง Recent Activities
- ✅ แสดงข้อมูลแบบ real-time

#### 5.2 UAT Checklist (ครอบคลุมทุก Role)

**Teacher Role**:
- [ ] บันทึก Journal ได้
- [ ] อัปโหลดหลักฐานได้
- [ ] ดูประวัติการนิเทศของตัวเอง
- [ ] ดู IDP ของตัวเอง
- [ ] แก้ไขข้อมูลส่วนตัวได้

**Mentor Role**:
- [ ] บันทึกการนิเทศได้
- [ ] ดูรายการครูที่รับผิดชอบ
- [ ] ให้ feedback ครูได้
- [ ] ดูสถิติการนิเทศ

**Project Manager Role**:
- [ ] ดูรายงานภาพรวมได้
- [ ] Export ข้อมูลได้
- [ ] ดู AI usage statistics
- [ ] ดู PDPA audit trail

**Admin Role**:
- [ ] จัดการ users ได้ (CRUD)
- [ ] จัดการ teachers/schools ได้
- [ ] ดูระบบทั้งหมด
- [ ] Export ข้อมูลทั้งหมด
- [ ] ดู System logs

#### 5.3 Performance Testing

**Test Cases**:
- [ ] Page load time < 3 วินาที
- [ ] API response time < 500ms
- [ ] Upload file < 5MB ใช้เวลา < 10 วินาที
- [ ] Dashboard โหลดภายใน 2 วินาที
- [ ] Search/Filter ตอบสนองทันที

#### 5.4 Security Testing

**Test Cases**:
- [ ] ไม่ login ไม่เข้าระบบได้
- [ ] Role-based access ทำงาน
- [ ] JWT token expire หลังเวลาที่กำหนด
- [ ] SQL Injection ป้องกันได้
- [ ] XSS ป้องกันได้
- [ ] CSRF ป้องกันได้

---

## 📊 Test Report Template

```markdown
# Test Report - TeacherMon

**Date**: [วันที่ทดสอบ]
**Tester**: [ชื่อผู้ทดสอบ]
**Environment**: Development / Staging / Production

## Test Summary

| Category | Total Tests | Passed | Failed | Pass Rate |
|----------|-------------|--------|--------|-----------|
| Authentication | 5 | 5 | 0 | 100% |
| CRUD Operations | 12 | 12 | 0 | 100% |
| AI Features | 8 | 8 | 0 | 100% |
| UAT | 20 | 18 | 2 | 90% |
| **Total** | **45** | **43** | **2** | **95.6%** |

## Failed Tests

1. **Test**: [ชื่อ test ที่ fail]
   - **Expected**: [ผลที่คาดหวัง]
   - **Actual**: [ผลที่ได้จริง]
   - **Screenshots**: [แนบภาพถ้ามี]
   - **Fix**: [วิธีแก้ไข]

## Issues Found

1. **[BUG-001]** Title
   - **Severity**: High/Medium/Low
   - **Steps to reproduce**: [...]
   - **Expected**: [...]
   - **Actual**: [...]

## Recommendations

1. [ข้อเสนอแนะ 1]
2. [ข้อเสนอแนะ 2]

## Conclusion

[สรุปผลการทดสอบ]
```

---

## 🛠️ Troubleshooting

### ปัญหา: API ไม่ตอบสนอง

**แก้ไข**:
```powershell
# ตรวจสอบว่า API รันอยู่
curl http://localhost:3001/health

# ดู logs
cd apps/api
pnpm dev
```

### ปัญหา: Database connection error

**แก้ไข**:
```powershell
# ตรวจสอบ PostgreSQL
docker ps

# ตรวจสอบ DATABASE_URL ใน .env
cat apps/api/.env | Select-String "DATABASE_URL"
```

### ปัญหา: AI features ไม่ทำงาน

**แก้ไข**:
1. ตรวจสอบ `GEMINI_API_KEY` ใน `apps/api/.env`
2. ตรวจสอบว่า `AI_ENABLED=true`
3. ดู logs ว่ามี error อะไร

---

## 📞 ติดต่อ

- **โรงเรียน**: บ้านพญาไพร
- **อีเมล**: sooksun2511@gmail.com
- **โทร**: 081-277-1948

---

**Last Updated**: 24 มกราคม 2569
