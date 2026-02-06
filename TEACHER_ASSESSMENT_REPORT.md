# รายงานสรุปผลการประเมินครูผู้ช่วย

ระบบรายงานออนไลน์สำหรับแสดงผลการประเมินและกิจกรรมของครูผู้ช่วยทั้งหมด รองรับการกรองข้อมูลและ Export เป็น PDF

## ฟีเจอร์

### 1. การแสดงผลแบบตาราง
- แสดงรายชื่อครูผู้ช่วยทั้งหมด (ตำแหน่ง "ครูผู้ช่วย")
- แสดงข้อมูล:
  - ชื่อ-สกุล และรุ่น
  - โรงเรียน และจังหวัด
  - การประเมินล่าสุด (ระดับ + วันที่)
  - คะแนนเฉลี่ย (จาก 4 ด้าน)
  - จำนวนการหนุนเสริม, Journal, PLC
  - สถานะการทำงาน

### 2. การกรองข้อมูล (Filters)
- กรองตามโรงเรียน
- กรองตามจังหวัด
- กรองตามภูมิภาค (เหนือ/อีสาน/กลาง/ใต้)
- กรองตามรุ่น (Cohort)
- กรองตามสถานะ (ปฏิบัติงาน/ย้าย/ลาออก/ลา)

### 3. Summary Cards
- จำนวนครูผู้ช่วยทั้งหมด
- จำนวนครูที่ผ่านการประเมิน
- คะแนนเฉลี่ย (Overall)
- จำนวนการหนุนเสริมทั้งหมด
- เปอร์เซ็นต์ครูระดับดี/ดีเยี่ยม

### 4. Export PDF
- ดาวน์โหลดรายงานเป็นไฟล์ PDF
- รูปแบบ A4 Landscape
- รองรับฟอนต์ไทย (Sarabun)
- แสดงผลครบทุกคอลัมน์พร้อมสี

### 5. รายละเอียดครูแต่ละคน (Modal)
- คลิก "ดูรายละเอียด" เพื่อเปิด Modal
- แสดงข้อมูลครบทั้งหมด:
  - ข้อมูลส่วนตัว + โรงเรียน
  - ประวัติการประเมินทั้งหมด (พร้อมคะแนน 4 ด้าน)
  - ประวัติการหนุนเสริมล่าสุด 5 รายการ
  - สรุปจำนวน Journals, PLC, แผนพัฒนา

## API Endpoints

### GET `/api/reports/teacher-assessment`

ดึงข้อมูลรายงานครูผู้ช่วยทั้งหมด

**Query Parameters:**
- `schoolId` (optional) - กรองตามโรงเรียน
- `province` (optional) - กรองตามจังหวัด
- `region` (optional) - กรองตามภูมิภาค (NORTH, NORTHEAST, CENTRAL, SOUTH)
- `cohort` (optional) - กรองตามรุ่น (number)
- `status` (optional) - กรองตามสถานะ (ACTIVE, TRANSFERRED, RESIGNED, ON_LEAVE)

**Response:**
```json
[
  {
    "teacherId": "uuid",
    "fullName": "ชื่อ-สกุล",
    "position": "ครูผู้ช่วย",
    "cohort": 1,
    "school": {
      "schoolName": "ชื่อโรงเรียน",
      "province": "จังหวัด",
      "region": "NORTH"
    },
    "assessmentCount": 2,
    "latestAssessment": {
      "period": "BEFORE",
      "overallLevel": "GOOD",
      "scores": {
        "pedagogy": 4,
        "classroom": 4,
        "community": 3,
        "professionalism": 4
      },
      "date": "2024-01-15T...",
      "assessor": "ผู้ประเมิน"
    },
    "averageScore": 3.75,
    "mentoringCount": 1,
    "latestMentoring": {
      "visitType": "LESSON_STUDY",
      "focusArea": "CLASSROOM",
      "date": "2024-01-20T...",
      "observer": "ทีมหนุนเสริม"
    },
    "journalCount": 0,
    "plcCount": 0,
    "developmentPlanCount": 0,
    "status": "ACTIVE",
    "lastActivityDate": "2024-01-20T..."
  }
]
```

### GET `/api/reports/teacher-assessment/pdf`

Export รายงานเป็น PDF

**Query Parameters:** เหมือนกับ endpoint ข้างบน

**Response:** PDF binary (Content-Type: application/pdf)

## หน้าเว็บ

### หน้าหลัก: `/reports`

แสดงรายการรายงานที่มีให้เลือก:
- **รายงานครูผู้ช่วย** → `/reports/teacher-assessment`
- **รายงานสรุปทั้งหมด** → `/reports/overview`

### หน้ารายงานครูผู้ช่วย: `/reports/teacher-assessment`

ฟีเจอร์:
- กรองข้อมูลด้วย dropdown filters
- แสดง Summary cards ด้านบน
- แสดงตารางข้อมูลครบทุกคอลัมน์
- ปุ่ม "Export PDF" สีแดง
- คลิก "ดูรายละเอียด" ในแต่ละแถวเพื่อเปิด Modal

## การติดตั้งและใช้งาน

### ติดตั้ง Chrome สำหรับ Puppeteer (ครั้งเดียว)

```bash
cd apps/api
pnpm exec puppeteer browsers install chrome
```

### รัน Dev Server

```bash
# Root directory
pnpm dev   # รัน API + Web พร้อมกัน

# หรือแยกรัน
cd apps/api && pnpm dev   # API: http://localhost:3001/api
cd apps/web && pnpm dev   # Web: http://localhost:3000
```

### เข้าใช้งาน

1. เปิดเว็บ: http://localhost:3000
2. Login ด้วย: `admin@teachermon.com` / `password123`
3. ไปที่เมนู **รายงาน** → **รายงานครูผู้ช่วย**
4. เลือกฟิลเตอร์ (เช่น จังหวัด, รุ่น)
5. คลิก **Export PDF** เพื่อดาวน์โหลด

## โครงสร้างไฟล์

### Backend (NestJS)

```
apps/api/src/reports/
├── reports.module.ts           # Module definition
├── reports.controller.ts       # REST endpoints
├── reports.service.ts          # Business logic + PDF generation
└── dto/
    ├── teacher-report-query.dto.ts      # Query filters
    └── teacher-report-response.dto.ts   # Response types
```

### Frontend (Next.js)

```
apps/web/
├── app/reports/
│   ├── page.tsx                          # Reports landing page
│   ├── teacher-assessment/page.tsx       # รายงานครูผู้ช่วย
│   └── overview/page.tsx                 # รายงานสรุปทั้งหมด (เดิม)
└── components/reports/
    ├── report-filters.tsx                # Filter component
    ├── summary-cards.tsx                 # Summary statistics cards
    ├── teacher-assessment-table.tsx      # Data table
    └── teacher-detail-modal.tsx          # Detail modal
```

## ข้อมูลที่รวมในรายงาน

### จาก Database (Supabase)

รายงานดึงข้อมูลจาก:
- `teacher_profile` - ข้อมูลครู (กรองเฉพาะ position = "ครูผู้ช่วย")
- `school_profile` - ข้อมูลโรงเรียน
- `competency_assessment` - การประเมินสมรรถนะ
- `mentoring_visit` - การหนุนเสริม
- `reflective_journal` - บันทึกสะท้อนคิด
- `plc_activity` - กิจกรรม PLC
- `development_plan` - แผนพัฒนา

### การคำนวณ

- **คะแนนเฉลี่ย**: (pedagogyScore + classroomScore + communityScore + professionalismScore) / 4
- **กิจกรรมล่าสุด**: หา max date จากทุกกิจกรรม

## การ Customize

### เปลี่ยนรูปแบบ PDF

แก้ไขใน [`apps/api/src/reports/reports.service.ts`](apps/api/src/reports/reports.service.ts):

```typescript
private generateHTMLTemplate(data, filters): string {
  // แก้ไข HTML + CSS ได้ที่นี่
  // เปลี่ยนสี, ฟอนต์, layout, เพิ่ม/ลดคอลัมน์
}
```

### เพิ่มฟิลเตอร์

1. เพิ่มใน `TeacherReportQueryDto` (Backend)
2. เพิ่ม dropdown ใน `report-filters.tsx` (Frontend)
3. เพิ่มเงื่อนไขใน `ReportsService.getTeacherAssessmentReport()`

### เปลี่ยนรูปแบบตาราง

แก้ไข [`teacher-assessment-table.tsx`](apps/web/components/reports/teacher-assessment-table.tsx) - เพิ่ม/ลดคอลัมน์, เปลี่ยนสี, เพิ่ม actions

## ปัญหาที่อาจพบและแก้ไข

### PDF ไม่ออก

**อาการ:** Error "Could not find Chrome"

**แก้ไข:**
```bash
cd apps/api
pnpm exec puppeteer browsers install chrome
```

### ฟอนต์ไทยไม่แสดงใน PDF

**แก้ไข:** ใช้ Google Fonts CDN ใน HTML template (เราทำแล้ว)

### ข้อมูลไม่แสดง

**ตรวจสอบ:**
1. API server รันอยู่หรือไม่: http://localhost:3001/api/docs
2. Login สำเร็จหรือไม่ (ดู Console Browser)
3. ฟิลเตอร์กรองออกทั้งหมดหรือไม่ (ลอง "ล้างทั้งหมด")

### Performance ช้าตอนมีครูเยอะ

**แก้ไข:**
- เพิ่ม pagination
- เพิ่ม index ใน database
- Cache report data

## การทดสอบ

### ทดสอบ API

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teachermon.com","password":"password123"}'

# Get report data
curl http://localhost:3001/api/reports/teacher-assessment \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get PDF
curl http://localhost:3001/api/reports/teacher-assessment/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o report.pdf
```

### ทดสอบ Frontend

1. เข้า http://localhost:3000/reports
2. คลิก "รายงานครูผู้ช่วย"
3. ทดสอบฟิลเตอร์แต่ละตัว
4. คลิก "Export PDF" → ดาวน์โหลดได้
5. คลิก "ดูรายละเอียด" → เปิด Modal

## Next Steps (ถ้าต้องการพัฒนาต่อ)

### เพิ่มรายงานอื่นๆ

- รายงานตามโรงเรียน
- รายงานตามภูมิภาค
- รายงานเปรียบเทียบระหว่างรุ่น
- รายงานแนวโน้ม (Trend Analysis)

### Export รูปแบบอื่น

- Excel (.xlsx) - ใช้ `exceljs`
- CSV - มีอยู่แล้วในหน้า overview
- Chart images - ใช้ `chart.js` + Canvas

### Dashboard เชิงลึก

- กราฟแสดงการเปลี่ยนแปลงคะแนนตามเวลา
- Heat map ตามภูมิภาค
- Comparison charts

## Credits

**พัฒนาโดย:** AI Agent (Cursor)  
**วันที่:** 25 มกราคม 2569  
**Technology Stack:**
- Backend: NestJS + Puppeteer
- Frontend: Next.js + React Query + Tailwind CSS
- Database: Supabase (PostgreSQL)
