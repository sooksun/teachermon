# หน้าการประเมินตนเอง (Self-Assessment)

## ไฟล์ที่สร้าง

### หน้าหลัก
- **`page.tsx`** - หน้าแสดงรายการการประเมินตนเองทั้งหมด

### Components
- **`components/self-assessment/self-assessment-card.tsx`** - Card แสดงข้อมูลการประเมินแต่ละรายการ
- **`components/self-assessment/assessment-filters.tsx`** - ตัวกรองข้อมูล (ช่วงเวลา + สถานะ)

## Features ที่มี

### 1. หน้าหลัก (`/self-assessment`)
- แสดงสถิติสรุป (ทั้งหมด, ร่าง, ส่งแล้ว, ตรวจแล้ว)
- ฟิลเตอร์ตามช่วงเวลาและสถานะ
- แสดงการประเมินแบบ Grid Cards
- ปุ่มสร้างการประเมินใหม่
- Empty state เมื่อยังไม่มีข้อมูล

### 2. Self-Assessment Card
- แสดงสถานะ (DRAFT, SUBMITTED, REVIEWED) พร้อมสีและไอคอน
- แสดงคะแนน 4 ด้าน:
  - การสอน (Pedagogy)
  - การจัดการห้องเรียน (Classroom)
  - การทำงานกับชุมชน (Community)
  - ความเป็นมืออาชีพ (Professionalism)
- คะแนนเฉลี่ยและระดับ (Overall Level)
- จำนวน portfolio items ที่เชื่อม
- แสดงความเห็นผู้ตรวจสอบ (ถ้ามี)
- ปุ่มดูรายละเอียด

### 3. Filters Component
- กรองตามช่วงเวลา (BEFORE, MIDTERM, AFTER, QUARTERLY_1-4)
- กรองตามสถานะ (DRAFT, SUBMITTED, REVIEWED)
- แสดง active filters แบบ badges
- ปุ่มล้างตัวกรอง

## Status Colors

```typescript
DRAFT:     สีเหลือง (bg-yellow-100 text-yellow-800)
SUBMITTED: สีม่วง (bg-purple-100 text-purple-800)
REVIEWED:  สีเขียว (bg-green-100 text-green-800)
```

## การใช้งาน

1. เข้าไปที่ `/self-assessment`
2. ระบบจะดึงข้อมูลการประเมินทั้งหมดของครู
3. ใช้ filters เพื่อกรองข้อมูล
4. คลิก "สร้างการประเมินใหม่" → ไปหน้า `/self-assessment/new` (ยังไม่สร้าง)
5. คลิก "ดูรายละเอียด" → ไปหน้า `/self-assessment/:id` (ยังไม่สร้าง)

## API Integration

ใช้ React Query เรียก:
```typescript
GET /api/self-assessment?period=BEFORE&status=DRAFT
```

Response:
```json
[
  {
    "id": "uuid",
    "assessmentPeriod": "BEFORE",
    "assessmentDate": "2024-01-15T...",
    "pedagogyScore": 4,
    "classroomScore": 4,
    "communityScore": 3,
    "professionalismScore": 4,
    "overallLevel": "GOOD",
    "status": "DRAFT",
    "portfolioItems": [...],
    "reviewerComments": null
  }
]
```

## ที่ยังต้องสร้าง

- [ ] `/self-assessment/new` - ฟอร์มสร้างการประเมิน
- [ ] `/self-assessment/:id` - หน้าดูรายละเอียด/แก้ไข
- [ ] `/portfolio` - จัดการ e-Portfolio
- [ ] การอัพโหลดไฟล์และวิดีโอ

## Shared Constants

เพิ่มใน `packages/shared/src/constants/index.ts`:
```typescript
export const ASSESSMENT_PERIOD = {
  BEFORE: 'ก่อนการพัฒนา',
  MIDTERM: 'กลางการพัฒนา',
  AFTER: 'หลังการพัฒนา',
  QUARTERLY_1: 'ไตรมาส 1',
  QUARTERLY_2: 'ไตรมาส 2',
  QUARTERLY_3: 'ไตรมาส 3',
  QUARTERLY_4: 'ไตรมาส 4',
};

export const COMPETENCY_LEVEL = {
  NEEDS_SUPPORT: 'ต้องเสริม',
  FAIR: 'พอใช้',
  GOOD: 'ดี',
  EXCELLENT: 'ดีเยี่ยม',
};
```
