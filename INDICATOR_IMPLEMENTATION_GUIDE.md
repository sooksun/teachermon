# 🚀 คู่มือการใช้งานระบบตัวชี้วัดแบบ Sub-indicators

**วันที่สร้าง**: 27 มกราคม 2569  
**อ้างอิง**: INDICATOR_SCHEMA_DESIGN.md

---

## 📋 สรุป

ระบบตัวชี้วัดแบบ **Sub-indicators** ได้ถูกออกแบบและพร้อมใช้งานแล้ว!

### ✅ สิ่งที่ทำเสร็จแล้ว

1. ✅ **Database Schema** - เพิ่ม `Indicator` และ `SubIndicator` models
2. ✅ **Seed Data Script** - `seed-indicators.ts` พร้อมข้อมูล 8 Main + 25 Sub-indicators
3. ✅ **Design Document** - `INDICATOR_SCHEMA_DESIGN.md` อธิบายการออกแบบ

### 🔄 สิ่งที่ต้องทำต่อ

1. ⏳ **Backend API** - สร้าง `IndicatorsController` และ `IndicatorsService`
2. ⏳ **Frontend Components** - อัปเดต `IndicatorSelector` ให้รองรับ Sub-indicators
3. ⏳ **AI Services** - อัปเดต AI prompts ให้แนะนำทั้ง Main และ Sub
4. ⏳ **Migration** - รัน migration และ seed data

---

## 🗄️ Database Schema

### ตาราง `indicators` (ตัวชี้วัดหลัก)

```sql
CREATE TABLE `indicators` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL UNIQUE,  -- WP_1, WP_2, ET_1, etc.
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `aspect` VARCHAR(191) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `indicators_code_idx` (`code`),
  INDEX `indicators_aspect_idx` (`aspect`),
  INDEX `indicators_is_active_idx` (`is_active`)
);
```

### ตาราง `sub_indicators` (ตัวชี้วัดย่อย)

```sql
CREATE TABLE `sub_indicators` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL UNIQUE,  -- WP_1.1, WP_1.2, ET_P1.1, etc.
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `requirements` TEXT NOT NULL,
  `assessment_methods` TEXT,
  `evidence_examples` JSON,
  `order` INT NOT NULL DEFAULT 0,
  `indicator_id` VARCHAR(191) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `sub_indicators_indicator_id_idx` (`indicator_id`),
  INDEX `sub_indicators_code_idx` (`code`),
  INDEX `sub_indicators_is_active_idx` (`is_active`),
  FOREIGN KEY (`indicator_id`) REFERENCES `indicators`(`id`) ON DELETE CASCADE
);
```

---

## 🔧 การติดตั้งและ Migration

### Step 1: Generate Prisma Client

```bash
cd packages/database
pnpm db:generate
```

### Step 2: Create Migration

```bash
cd packages/database
pnpm db:migrate dev --name add_indicator_system
```

### Step 3: Seed Indicators Data

```bash
cd packages/database
npx ts-node prisma/seed-indicators.ts
```

หรือเพิ่มใน `seed.ts`:

```typescript
// packages/database/prisma/seed.ts
import { seedIndicators } from './seed-indicators';

async function main() {
  // ... existing seed code ...
  
  // Seed indicators
  await seedIndicators();
}
```

---

## 📊 ข้อมูลตัวชี้วัด

### Main Indicators (8 ตัว)

| Code | Name | Category | Aspect |
|------|------|----------|--------|
| WP_1 | การออกแบบการจัดการเรียนรู้ | การพัฒนาการสอน | วิชาชีพ |
| WP_2 | การจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ | การพัฒนาการสอน | วิชาชีพ |
| WP_3 | การวัดและประเมินผล | การพัฒนาการสอน | วิชาชีพ |
| ET_1 | ความเป็นครู | ความเป็นมืออาชีพ | คุณลักษณะส่วนบุคคล |
| ET_2 | การจัดการชั้นเรียน | ความเป็นมืออาชีพ | คุณลักษณะส่วนบุคคล |
| ET_3 | ภาวะผู้นำทางวิชาการ | ความเป็นมืออาชีพ | สังคม |
| ET_4 | การพัฒนาตนเอง | ความเป็นมืออาชีพ | คุณลักษณะส่วนบุคคล |

### Sub-indicators (25 ตัว)

#### WP_1 → 2 Sub-indicators
- WP_1.1: การวิเคราะห์หลักสูตร
- WP_1.2: การออกแบบการจัดการเรียนรู้

#### WP_2 → 5 Sub-indicators
- WP_1.3: การจัดกิจกรรมการเรียนรู้
- WP_1.4: การเลือกและการใช้สื่อ เทคโนโลยี
- WP_1.6: การจัดบรรยากาศที่ส่งเสริมและพัฒนาผู้เรียน
- WP_1.7: การส่งเสริมการเรียนรู้โดยใช้เทคโนโลยีดิจิทัล
- WP_2.1: การจัดทำข้อมูลสารสนเทศของผู้เรียนและรายวิชา

#### WP_3 → 3 Sub-indicators
- WP_1.5: การวัดและประเมินผล
- WP_2.2: การดำเนินการตามระบบดูแลช่วยเหลือผู้เรียน
- WP_2.3: การเรียนรู้ด้านกฎหมาย ระเบียบที่เกี่ยวข้อง

#### ET_1 → 2 Sub-indicators
- ET_P1.10: การเป็นแบบอย่างที่ดี
- ET_P1.11: จรรยาบรรณวิชาชีพ

#### ET_2 → 1 Sub-indicator (shared)
- WP_1.6: การจัดบรรยากาศที่ส่งเสริมและพัฒนาผู้เรียน

#### ET_3 → 2 Sub-indicators
- ET_S1: การเรียนรู้จากกัลยาณมิตร
- ET_S2: การเรียนรู้ร่วมกันเป็นเครือข่ายทางวิชาชีพ (PLC)

#### ET_4 → 4 Sub-indicators
- ET_P2.1: ภาษาไทยและภาษาอังกฤษ
- ET_P2.2: เทคโนโลยีดิจิทัล
- ET_P2.3: การวางแผนการเงิน
- ET_P2.4: การดูแลสุขภาพกายและใจ

---

## 🔄 Backward Compatibility

### Format เก่า (ยังรองรับ)

```json
// evidence_portfolio.indicator_codes
["WP_1", "ET_2"]
```

### Format ใหม่ (แนะนำ)

```json
// evidence_portfolio.indicator_codes
{
  "main": ["WP_1", "ET_2"],
  "sub": ["WP_1.2", "WP_1.3", "ET_P1.4"]  // optional
}
```

### Helper Function

```typescript
function normalizeIndicatorCodes(codes: any): {
  main: string[];
  sub: string[];
} {
  // ถ้าเป็น array แสดงว่าเป็น format เก่า
  if (Array.isArray(codes)) {
    return { main: codes, sub: [] };
  }
  
  // ถ้าเป็น object แสดงว่าเป็น format ใหม่
  if (typeof codes === 'object' && codes !== null) {
    return {
      main: codes.main || [],
      sub: codes.sub || [],
    };
  }
  
  return { main: [], sub: [] };
}
```

---

## 📝 API Endpoints ที่ต้องสร้าง

### 1. GET `/indicators`
```typescript
// Response
{
  "main": [
    {
      "id": "...",
      "code": "WP_1",
      "name": "การออกแบบการจัดการเรียนรู้",
      "description": "...",
      "category": "การพัฒนาการสอน",
      "aspect": "วิชาชีพ",
      "subIndicators": [
        {
          "id": "...",
          "code": "WP_1.1",
          "name": "การวิเคราะห์หลักสูตร",
          "description": "...",
          "requirements": "...",
          "assessmentMethods": "...",
          "evidenceExamples": [...]
        }
      ]
    }
  ]
}
```

### 2. GET `/indicators/:code`
```typescript
// Response
{
  "id": "...",
  "code": "WP_1",
  "name": "การออกแบบการจัดการเรียนรู้",
  "subIndicators": [...]
}
```

### 3. GET `/sub-indicators`
```typescript
// Response
{
  "data": [
    {
      "id": "...",
      "code": "WP_1.1",
      "name": "การวิเคราะห์หลักสูตร",
      "indicator": {
        "code": "WP_1",
        "name": "การออกแบบการจัดการเรียนรู้"
      }
    }
  ]
}
```

---

## 🎨 Frontend Component Design

### Enhanced IndicatorSelector

```typescript
interface IndicatorSelectorProps {
  selectedCodes: {
    main?: string[];
    sub?: string[];
  };
  onSelectionChange: (codes: { main: string[]; sub?: string[] }) => void;
  mode?: 'main' | 'sub' | 'both'; // เลือกโหมดการแสดง
  aiSuggestedCodes?: {
    main?: string[];
    sub?: string[];
  };
  showTree?: boolean; // แสดงแบบ Tree view
}
```

### UI Options

#### Option 1: Tree View (Recommended)
```
☑ WP_1 - การออกแบบการจัดการเรียนรู้
  ☐ WP_1.1 - การวิเคราะห์หลักสูตร
  ☑ WP_1.2 - การออกแบบการจัดการเรียนรู้
☑ WP_2 - การจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ
  ☑ WP_1.3 - การจัดกิจกรรมการเรียนรู้
  ☐ WP_1.4 - การเลือกและการใช้สื่อ เทคโนโลยี
```

#### Option 2: Tabs View
```
[Main Indicators] [Sub-indicators]
```

#### Option 3: Collapsible Sections
```
▼ WP_1 - การออกแบบการจัดการเรียนรู้ (1/2 เลือก)
  ☑ WP_1.1 - การวิเคราะห์หลักสูตร
  ☐ WP_1.2 - การออกแบบการจัดการเรียนรู้
```

---

## 🤖 AI Integration

### 1. Evidence AI - Suggest Indicators

```typescript
// AI จะแนะนำทั้ง Main และ Sub
{
  "main": ["WP_1", "WP_2"],
  "sub": ["WP_1.2", "WP_1.3", "WP_1.4"]
}
```

### 2. Analyze Indicator Connection

```typescript
// วิเคราะห์ความเชื่อมโยงกับ Sub-indicators ที่เลือก
analyzeIndicatorConnection(
  evidenceId: string,
  selectedIndicators: {
    main: string[];
    sub: string[];
  }
)
```

---

## ✅ Checklist การพัฒนา

### Phase 1: Database ✅
- [x] สร้าง Prisma schema
- [x] สร้าง seed data script
- [ ] รัน migration
- [ ] Seed ข้อมูลตัวชี้วัด

### Phase 2: Backend API ⏳
- [ ] สร้าง `IndicatorsModule`
- [ ] สร้าง `IndicatorsController`
- [ ] สร้าง `IndicatorsService`
- [ ] สร้าง DTOs
- [ ] อัปเดต `EvidenceService` ให้รองรับ format ใหม่
- [ ] อัปเดต AI services

### Phase 3: Frontend Components ⏳
- [ ] อัปเดต `IndicatorSelector` component
- [ ] สร้าง Tree/Collapsible UI
- [ ] อัปเดต Upload modal
- [ ] อัปเดต Portfolio page

### Phase 4: Testing & Migration ⏳
- [ ] ทดสอบ backward compatibility
- [ ] Migration script (optional)
- [ ] Integration testing
- [ ] User acceptance testing

---

## 📚 Files Reference

### Schema & Seed
- `packages/database/prisma/schema.prisma` - Indicator & SubIndicator models
- `packages/database/prisma/seed-indicators.ts` - Seed data script

### Design Documents
- `INDICATOR_SCHEMA_DESIGN.md` - การออกแบบ schema
- `INDICATOR_TABLE_DETAILED.md` - ตารางตัวชี้วัดแบบละเอียด
- `INDICATOR_IMPLEMENTATION_GUIDE.md` - คู่มือนี้

### Components (ต้องอัปเดต)
- `apps/web/components/portfolio/indicator-selector.tsx`
- `apps/web/components/portfolio/upload-modal.tsx`

### Services (ต้องสร้าง/อัปเดต)
- `apps/api/src/indicators/` (ใหม่)
- `apps/api/src/evidence/evidence.service.ts` (อัปเดต)
- `apps/api/src/ai/evidence-ai.service.ts` (อัปเดต)

---

## 🚀 Next Steps

1. **รัน Migration**: `pnpm db:migrate dev`
2. **Seed Data**: `npx ts-node prisma/seed-indicators.ts`
3. **สร้าง Backend API**: เริ่มจาก `IndicatorsController`
4. **อัปเดต Frontend**: เริ่มจาก `IndicatorSelector` component
5. **ทดสอบ**: ทดสอบ backward compatibility และ integration

---

**สร้างเมื่อ**: 27 มกราคม 2569  
**อัปเดตล่าสุด**: 27 มกราคม 2569
