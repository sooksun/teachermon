# 🚀 ขั้นตอนการ Migration และ Setup

**วันที่**: 27 มกราคม 2569

---

## ✅ สิ่งที่ทำเสร็จแล้ว

1. ✅ **Database Schema** - เพิ่ม `Indicator` และ `SubIndicator` models ใน `schema.prisma`
2. ✅ **Backend API** - สร้าง `IndicatorsModule`, `IndicatorsController`, `IndicatorsService`
3. ✅ **EvidenceService** - อัปเดตให้รองรับ format ใหม่ (backward compatible)
4. ✅ **Seed Data Script** - `seed-indicators.ts` พร้อมข้อมูล 8 Main + 25 Sub-indicators

---

## 🔧 ขั้นตอนการ Migration

### Step 1: Generate Prisma Client

```powershell
cd D:\laragon\www\teachermon\packages\database
pnpm db:generate
```

**หมายเหตุ**: ถ้ามี permission error ให้:
- ปิด API server (ถ้ารันอยู่)
- ลองรันอีกครั้ง
- หรือใช้ `pnpm db:push` แทน

### Step 2: Create Migration

```powershell
cd D:\laragon\www\teachermon\packages\database
pnpm db:migrate dev --name add_indicator_system
```

**หรือใช้ db:push** (ถ้า migration ไม่ทำงาน):
```powershell
pnpm db:push
```

### Step 3: Seed Indicators Data

```powershell
cd D:\laragon\www\teachermon\packages\database
npx tsx prisma/seed-indicators.ts
```

**หรือเพิ่มใน seed.ts**:
```typescript
// packages/database/prisma/seed.ts
import { seedIndicators } from './seed-indicators';

async function main() {
  // ... existing seed code ...
  
  // Seed indicators
  await seedIndicators();
}
```

แล้วรัน:
```powershell
pnpm db:seed
```

---

## 🧪 ทดสอบ Backend API

### 1. เริ่ม API Server

```powershell
cd D:\laragon\www\teachermon\apps\api
pnpm dev
```

### 2. ทดสอบ Endpoints

#### GET `/indicators`
```bash
curl -X GET "http://localhost:3001/indicators" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET `/indicators/WP_1`
```bash
curl -X GET "http://localhost:3001/indicators/WP_1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET `/indicators/sub-indicators`
```bash
curl -X GET "http://localhost:3001/indicators/sub-indicators" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET `/indicators/aspect/วิชาชีพ`
```bash
curl -X GET "http://localhost:3001/indicators/aspect/วิชาชีพ" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 API Endpoints ที่สร้าง

### Indicators API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/indicators` | ดึงตัวชี้วัดหลักทั้งหมด |
| GET | `/indicators/:code` | ดึงตัวชี้วัดหลักตาม code |
| GET | `/indicators/sub-indicators` | ดึง sub-indicators ทั้งหมด |
| GET | `/indicators/sub-indicators/:code` | ดึง sub-indicator ตาม code |
| GET | `/indicators/aspect/:aspect` | ดึงตัวชี้วัดตาม aspect |
| GET | `/indicators/category/:category` | ดึงตัวชี้วัดตาม category |
| GET | `/indicators/validate` | ตรวจสอบ indicator codes |

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
  "sub": ["WP_1.2", "WP_1.3", "ET_P1.4"]
}
```

### Helper Function
`IndicatorsService.normalizeIndicatorCodes()` จะแปลง format เก่าเป็น format ใหม่อัตโนมัติ

---

## ⚠️ Troubleshooting

### Error: Permission denied
**แก้ไข**: ปิด API server และลองใหม่

### Error: Migration failed
**แก้ไข**: ใช้ `pnpm db:push` แทน

### Error: Prisma client not generated
**แก้ไข**: 
```powershell
cd packages/database
pnpm db:generate
```

### Error: Module not found
**แก้ไข**: 
```powershell
cd apps/api
pnpm install
```

---

## 📚 Files ที่สร้าง/แก้ไข

### New Files
- `apps/api/src/indicators/indicators.module.ts`
- `apps/api/src/indicators/indicators.controller.ts`
- `apps/api/src/indicators/indicators.service.ts`
- `packages/database/prisma/seed-indicators.ts`
- `MIGRATION_STEPS.md` (ไฟล์นี้)

### Updated Files
- `packages/database/prisma/schema.prisma` - เพิ่ม Indicator models
- `apps/api/src/app.module.ts` - เพิ่ม IndicatorsModule
- `apps/api/src/evidence/evidence.module.ts` - เพิ่ม IndicatorsModule import
- `apps/api/src/evidence/evidence.service.ts` - รองรับ format ใหม่

---

## ✅ Checklist

- [ ] Generate Prisma client
- [ ] Create migration
- [ ] Seed indicators data
- [ ] ทดสอบ API endpoints
- [ ] อัปเดต Frontend (ต่อไป)

---

**สร้างเมื่อ**: 27 มกราคม 2569  
**อัปเดตล่าสุด**: 27 มกราคม 2569
