# User Rights API (PDPA มาตรา 30–35)

**วันที่**: 26 มกราคม 2569  
**สถานะ**: ✅ **พร้อมใช้งาน**

---

## สรุป

เพิ่ม **User Rights API** ตาม PDPA มาตรา 30–35 ประกอบด้วย:

1. **Right to Access** – ขอข้อมูลส่วนตัว (`GET /api/pdpa/my-data`)
2. **Right to Erasure** – ลบหรือทำข้อมูลเป็นนิรนาม (`DELETE /api/pdpa/my-data`)
3. **Right to Data Portability** – Export ข้อมูล (`GET /api/pdpa/export-my-data`)

---

## API Endpoints

### 1. Right to Access – ขอข้อมูลส่วนตัว

```http
GET /api/pdpa/my-data
Authorization: Bearer <token>
```

**Response**: ข้อมูลส่วนตัว + กิจกรรม + consents + AI activities  
- `personalInfo`: User + Teacher (บัง citizenId เป็น `****1234`)  
- `activities`: mentoringVisits, assessments, journals, plc, developmentPlans, evidence  
- `consents`: สถานะความยินยอม  
- `aiActivities`: บันทึกการใช้งาน AI  
- `exportedAt`: เวลาที่ export  

---

### 2. Right to Erasure – ลบหรือทำข้อมูลเป็นนิรนาม

```http
DELETE /api/pdpa/my-data
Authorization: Bearer <token>
Content-Type: application/json

{
  "deleteAll": true
}
```

**ตัวเลือกใน Body**:

| คีย์ | ประเภท | คำอธิบาย |
|-----|--------|----------|
| `deleteAll` | boolean | ลบบัญชีและข้อมูลที่เชื่อมโยงทั้งหมด |
| `anonymize` | boolean | ทำข้อมูลเป็นนิรนาม (เก็บโครงสร้าง ลบ PII) |
| `categories` | string[] | ลบเฉพาะหมวด: `personal_info`, `assessments`, `journals`, `evidence`, `mentoring`, `plc`, `development_plans` |

**ตัวอย่าง**:

```json
{ "deleteAll": true }
```
→ ลบบัญชี + ครู (ถ้ามี) + ข้อมูลที่เกี่ยวข้อง

```json
{ "anonymize": true }
```
→ Anonymize user + teacher, ปิดการใช้งานบัญชี

```json
{ "categories": ["journals", "evidence"] }
```
→ ลบเฉพาะ journals และ evidence

---

### 3. Right to Data Portability – Export ข้อมูล

```http
GET /api/pdpa/export-my-data?format=json
GET /api/pdpa/export-my-data?format=csv
Authorization: Bearer <token>
```

**Query**:
- `format`: `json` | `csv` (จำเป็น)

**Response (JSON)**:
```json
{
  "format": "json",
  "data": { ... },
  "exportedAt": "2026-01-26T..."
}
```

**Response (CSV)**:
```json
{
  "format": "csv",
  "content": "\"key\",\"value\"\n...",
  "exportedAt": "2026-01-26T..."
}
```

---

## ไฟล์ที่เกี่ยวข้อง

### Backend
- `apps/api/src/pdpa/pdpa.service.ts` – `getMyData`, `deleteMyData`, `exportMyData`, `anonymizeUserData`, `deleteByCategories`
- `apps/api/src/pdpa/pdpa.controller.ts` – User Rights endpoints
- `apps/api/src/pdpa/dto/delete-my-data.dto.ts` – DTO สำหรับลบ/ anonymize

### Frontend
- `apps/web/app/settings/privacy/page.tsx` – ส่วน User Rights (ดูข้อมูล, Export JSON/CSV, ทำนิรนาม, ลบทั้งหมด)

---

## การใช้งานจาก Frontend

- **ดูข้อมูลของฉัน**: เรียก `GET /pdpa/my-data` แล้วแสดงในหน้า  
- **Export JSON**: เรียก `GET /pdpa/export-my-data?format=json` แล้วดาวน์โหลดเป็นไฟล์  
- **Export CSV**: เรียก `GET /pdpa/export-my-data?format=csv` แล้วดาวน์โหลดเป็นไฟล์  
- **ทำข้อมูลเป็นนิรนาม**: เรียก `DELETE /pdpa/my-data` ด้วย `{ "anonymize": true }` หลัง confirm  
- **ลบบัญชีและข้อมูลทั้งหมด**: เรียก `DELETE /pdpa/my-data` ด้วย `{ "deleteAll": true }` หลัง confirm  

---

## ความปลอดภัย

- ทุก endpoint ใช้ `JwtAuthGuard`  
- ดึงข้อมูลเฉพาะของ user ที่ login (`req.user.sub`)  
- ลบ/ anonymize เฉพาะข้อมูลของ user นั้น  
- ใช้ transaction สำหรับการลบ  
- บัง `citizenId` ใน Right to Access  

---

**จัดทำโดย**: AI Cursor Agent  
**วันที่**: 26 มกราคม 2569
