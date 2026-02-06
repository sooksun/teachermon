# ระบบประเมินตนเอง (Self-Assessment) และ e-Portfolio

ระบบสำหรับครูประเมินตนเอง พร้อมอัพโหลดหลักฐาน (PDF, รูป, วิดีโอ) เข้า e-portfolio และให้คะแนนตนเองตามเกณฑ์การประเมิน 4 ด้าน

## สิ่งที่สร้างเสร็จแล้ว ✅

### 1. Database Schema ✅

**เพิ่ม Enum:**
- `PortfolioItemType` - FILE, VIDEO_LINK
- `SelfAssessmentStatus` - DRAFT, SUBMITTED, REVIEWED

**Model ใหม่: `SelfAssessment`**
```prisma
model SelfAssessment {
  id                      String
  teacherId               String
  assessmentPeriod        AssessmentPeriod
  assessmentDate          DateTime
  
  // Scores (1-5)
  pedagogyScore           Int
  classroomScore          Int
  communityScore          Int
  professionalismScore    Int
  
  // Reflections
  pedagogyReflection      String?
  classroomReflection     String?
  communityReflection     String?
  professionalismReflection String?
  
  // Overall
  overallLevel            CompetencyLevel
  strengths               String?
  areasForImprovement     String?
  actionPlan              String?
  
  // Status
  status                  SelfAssessmentStatus
  submittedAt             DateTime?
  reviewedBy              String?
  reviewedAt              DateTime?
  reviewerComments        String?
  
  // Relations
  portfolioItems          EvidencePortfolio[]
}
```

**อัพเดต `EvidencePortfolio`:**
- เพิ่ม `itemType` (FILE หรือ VIDEO_LINK)
- เพิ่ม `videoUrl`, `videoTitle`, `videoDescription`, `videoPlatform`
- เพิ่ม `selfAssessmentId` (เชื่อมกับการประเมิน)

### 2. Backend API ✅

**Module:** `self-assessment`
- ที่ตั้ง: `apps/api/src/self-assessment/`
- Register ใน `app.module.ts` แล้ว

**API Endpoints:**

#### Self-Assessment
```
POST   /api/self-assessment          สร้างการประเมินตนเอง (DRAFT)
GET    /api/self-assessment          ดึงการประเมินทั้งหมดของครู
GET    /api/self-assessment/:id      ดึงการประเมินตาม ID
PUT    /api/self-assessment/:id      แก้ไขการประเมิน (เฉพาะ DRAFT)
PATCH  /api/self-assessment/:id/submit    ส่งการประเมิน (DRAFT → SUBMITTED)
PATCH  /api/self-assessment/:id/review    ตรวจสอบการประเมิน (สำหรับ mentor)
DELETE /api/self-assessment/:id      ลบการประเมิน
```

#### Portfolio (Video Link Support)
```
POST   /api/evidence/video-link     เพิ่มลิงก์วิดีโอเข้า portfolio
```

**DTOs:**
- `CreateSelfAssessmentDto` - สร้างการประเมิน + เชื่อม portfolio items
- `UpdateSelfAssessmentDto` - แก้ไขการประเมิน
- `CreateVideoLinkDto` - เพิ่มลิงก์วิดีโอ

**Features:**
- ครูประเมินตนเอง 4 ด้าน (คะแนน 1-5)
- เขียน reflection แต่ละด้าน
- ระบุ strengths, areas for improvement, action plan
- เชื่อมหลักฐาน (portfolio items) เข้ากับการประเมิน
- Status workflow: DRAFT → SUBMITTED → REVIEWED
- รองรับ video links (YouTube, Google Drive, Vimeo, Facebook)
- Auto-detect แพลตฟอร์มวิดีโอจาก URL
- PDPA check สำหรับ video title/description

### 3. ไฟล์ที่สร้าง

**Backend (13 ไฟล์):**
```
apps/api/src/self-assessment/
├── dto/
│   ├── create-self-assessment.dto.ts
│   ├── update-self-assessment.dto.ts
│   └── submit-self-assessment.dto.ts
├── self-assessment.controller.ts
├── self-assessment.service.ts
└── self-assessment.module.ts

apps/api/src/evidence/
└── dto/
    └── create-video-link.dto.ts

Prisma Schema:
packages/database/prisma/schema.prisma (updated)

Module Registration:
apps/api/src/app.module.ts (updated)
apps/api/src/evidence/evidence.service.ts (updated)
apps/api/src/evidence/evidence.controller.ts (updated)
```

## สิ่งที่ยังต้องทำ ⏳

### 4. Frontend UI (ยังไม่ได้ทำ)

**หน้าที่ต้องสร้าง:**

1. **`/self-assessment`** - หน้าหลักแสดงการประเมินทั้งหมด
   - แสดงรายการการประเมิน (DRAFT, SUBMITTED, REVIEWED)
   - สร้างการประเมินใหม่
   - ดูรายละเอียดแต่ละการประเมิน

2. **`/self-assessment/new`** - สร้างการประเมินใหม่
   - Form ให้คะแนน 4 ด้าน (1-5)
   - Textarea สำหรับ reflection แต่ละด้าน
   - เลือก portfolio items ที่จะเชื่อม
   - บันทึกเป็น DRAFT หรือ SUBMIT

3. **`/self-assessment/:id`** - ดูรายละเอียด/แก้ไข
   - แสดงคะแนนและ reflections
   - แสดง portfolio items ที่เชื่อมโยง
   - ปุ่มแก้ไข (ถ้า DRAFT)
   - ปุ่ม Submit (ถ้า DRAFT)
   - แสดง reviewer comments (ถ้า REVIEWED)

4. **`/portfolio`** - จัดการ e-Portfolio
   - อัพโหลดไฟล์ (PDF, รูป)
   - เพิ่มลิงก์วิดีโอ
   - แสดงรายการ portfolio items
   - จัดหมวดหมู่ตาม evidence type
   - เชื่อมกับ self-assessment

**Components ที่ต้องสร้าง:**
- `SelfAssessmentForm` - ฟอร์มประเมิน
- `ScoreSlider` - ให้คะแนน 1-5
- `ReflectionTextarea` - เขียน reflection
- `PortfolioSelector` - เลือก portfolio items
- `VideoLinkForm` - เพิ่มลิงก์วิดีโอ
- `PortfolioCard` - แสดง portfolio item
- `SelfAssessmentCard` - แสดงข้อมูลการประเมิน
- `SelfAssessmentList` - รายการการประเมิน

### 5. การทดสอบ (ยังไม่ได้ทำ)

**Backend Testing:**
- ทดสอบ API endpoints ด้วย Postman/curl
- ทดสอบ CRUD self-assessment
- ทดสอบ video link creation
- ทดสอบ portfolio linkage

**Frontend Testing:**
- ทดสอบ UI flow
- ทดสอบการอัพโหลดไฟล์
- ทดสอบการเพิ่มวิดีโอ
- ทดสอบการประเมิน + เชื่อม portfolio

## โครงสร้างข้อมูล

### การประเมินตนเอง (Self-Assessment)

**4 สมรรถนะหลัก:**
1. **PEDAGOGY** (การพัฒนาการสอน)
   - คะแนน 1-5
   - Reflection: ฉันพัฒนาการสอนอย่างไร?

2. **CLASSROOM** (การจัดการชั้นเรียน)
   - คะแนน 1-5
   - Reflection: ฉันจัดการชั้นเรียนอย่างไร?

3. **COMMUNITY** (การทำงานกับชุมชน)
   - คะแนน 1-5
   - Reflection: ฉันมีส่วนร่วมกับชุมชนอย่างไร?

4. **PROFESSIONALISM** (ความเป็นมืออาชีพ)
   - คะแนน 1-5
   - Reflection: ฉันแสดงความเป็นมืออาชีพอย่างไร?

**การเชื่อมหลักฐาน:**
- แต่ละการประเมินสามารถเชื่อมกับ portfolio items หลายรายการ
- Portfolio items สามารถเป็น:
  - ไฟล์ PDF (แผนการสอน, รายงาน)
  - รูปภาพ (กิจกรรมในชั้นเรียน)
  - ลิงก์วิดีโอ (การสอน, กิจกรรม)

### e-Portfolio

**ประเภทหลักฐาน (EvidenceType):**
- LESSON_PLAN - แผนการสอน
- TEACHING_MEDIA - สื่อการสอน
- ASSESSMENT - แบบทดสอบ/การวัดผล
- STUDENT_WORK - ผลงานนักเรียน
- CLASSROOM_PHOTO - ภาพกิจกรรมในชั้นเรียน
- REFLECTION - บันทึกสะท้อนคิด
- ACTION_RESEARCH - งานวิจัยในชั้นเรียน
- OTHER - อื่นๆ

**Video Platforms รองรับ:**
- YouTube
- Google Drive
- Vimeo
- Facebook
- อื่นๆ (ตรวจจาก URL)

## API Usage Examples

### 1. สร้างการประเมินตนเอง

```bash
POST /api/self-assessment
Authorization: Bearer <token>

{
  "assessmentPeriod": "BEFORE",
  "pedagogyScore": 4,
  "classroomScore": 4,
  "communityScore": 3,
  "professionalismScore": 4,
  "pedagogyReflection": "ฉันพัฒนาแผนการสอนให้เน้นผู้เรียนเป็นศูนย์กลาง...",
  "classroomReflection": "ฉันปรับปรุงการจัดการชั้นเรียนให้มีส่วนร่วมมากขึ้น...",
  "communityReflection": "ฉันร่วมกิจกรรมชุมชนและเชื่อมโยงกับการสอน...",
  "professionalismReflection": "ฉันพัฒนาตนเองอย่างต่อเนื่องและเป็นแบบอย่างที่ดี...",
  "overallLevel": "GOOD",
  "strengths": "มีความคิดสร้างสรรค์ในการจัดการเรียนรู้",
  "areasForImprovement": "ต้องพัฒนาการประเมินผลให้หลากหลายมากขึ้น",
  "actionPlan": "จะเข้าอบรมการประเมินผลแบบ Authentic Assessment",
  "portfolioItemIds": ["uuid1", "uuid2", "uuid3"]
}
```

### 2. เพิ่มลิงก์วิดีโอ

```bash
POST /api/evidence/video-link
Authorization: Bearer <token>

{
  "videoUrl": "https://www.youtube.com/watch?v=xxxxx",
  "videoTitle": "การสอนวิชาคณิตศาสตร์ ป.1",
  "videoDescription": "บันทึกการสอนเรื่องการบวกเลข ใช้สื่อเกมและกิจกรรม",
  "evidenceType": "CLASSROOM_PHOTO",
  "indicatorCodes": ["WP_1", "WP_2"]
}
```

### 3. ส่งการประเมิน

```bash
PATCH /api/self-assessment/:id/submit
Authorization: Bearer <token>
```

### 4. ตรวจสอบการประเมิน (Mentor/Admin)

```bash
PATCH /api/self-assessment/:id/review
Authorization: Bearer <token>

{
  "comments": "การประเมินตนเองดีมาก แสดงถึงความตระหนักรู้และแผนพัฒนาที่ชัดเจน"
}
```

## Next Steps

### ต้องทำต่อ:

1. **สร้าง Frontend UI** (2-3 ชั่วโมง)
   - หน้าแสดงรายการการประเมิน
   - ฟอร์มสร้าง/แก้ไขการประเมิน
   - หน้าจัดการ portfolio
   - อัพโหลดไฟล์ + video link

2. **ทดสอบระบบ** (30 นาที)
   - ทดสอบ API
   - ทดสอบ UI flow
   - ทดสอบการเชื่อมข้อมูล

3. **เอกสารเพิ่มเติม**
   - User guide สำหรับครู
   - แนวทางการประเมินตนเอง
   - ตัวอย่างการเขียน reflection

## Database Migration

Schema ได้ push ไปยัง Supabase แล้ว:
```bash
pnpm --filter database db:push
```

## Build Status

Backend API build สำเร็จ:
```bash
pnpm --filter @teachermon/api build
✓ Success
```

---

**สรุป:** Backend API พร้อมใช้งานแล้ว เหลือแค่สร้าง Frontend UI และทดสอบระบบ! 🎉
