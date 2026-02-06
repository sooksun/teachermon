# 🧪 คู่มือการทดสอบ CRUD (Teachers, Schools, Journals)

**วันที่**: 27 มกราคม 2569

---

## 📋 สรุป

คู่มือนี้ใช้ทดสอบการสร้าง อ่าน แก้ไข ลบ (CRUD) สำหรับ **Teachers**, **Schools** และ **Journals**

---

## 🔑 ข้อกำหนดเบื้องต้น

1. **API Server** รันที่ `http://localhost:3001`
2. **JWT Token** จาก user ที่มีสิทธิ์ (เช่น ADMIN, PROJECT_MANAGER)
3. **ข้อมูลเบื้องต้น**: มี School อย่างน้อย 1 แห่ง (จาก seed) สำหรับทดสอบ Teachers/Journals

---

## 🛠️ วิธีทดสอบ

### วิธีที่ 1: ใช้ PowerShell Script (แนะนำ)

```powershell
# 1. รับ Token
$body = @{ email = "admin@teachermon.com"; password = "password123" } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $r.access_token

# 2. รัน CRUD test
.\scripts\test-crud.ps1 -Token $token
```

หรือใช้ script login ก่อน:

```powershell
.\scripts\test-login.ps1 -Action admin
# Copy token จาก output แล้วรัน:
.\scripts\test-crud.ps1 -Token "<paste-token>"
```

### วิธีที่ 2: ทดสอบผ่าน API (Manual)

ใช้ Postman, Insomnia หรือ cURL กับ endpoints ด้านล่าง พร้อม header  
`Authorization: Bearer <token>`

---

## 📡 API Endpoints

### Schools

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/schools` | รายการโรงเรียน (รองรับ `?page=&limit=&search=&region=&province=`) |
| GET | `/api/schools/:id` | ดูโรงเรียนตาม ID |
| GET | `/api/schools/:id/teachers` | รายการครูในโรงเรียน |
| POST | `/api/schools` | สร้างโรงเรียน |
| PUT | `/api/schools/:id` | แก้ไขโรงเรียน |
| DELETE | `/api/schools/:id` | ลบโรงเรียน |

**ตัวอย่าง POST Body (School)**:
```json
{
  "schoolName": "โรงเรียนทดสอบ",
  "province": "กรุงเทพฯ",
  "region": "CENTRAL",
  "schoolSize": "SMALL",
  "areaType": "REMOTE",
  "studentTotal": 100,
  "directorName": "ผู้อำนวยการ",
  "qualitySchoolFlag": false,
  "communityContext": "บริบทชุมชน"
}
```
`region`: NORTH | NORTHEAST | CENTRAL | SOUTH  
`schoolSize`: SMALL | MEDIUM | LARGE  
`areaType`: REMOTE | VERY_REMOTE | SPECIAL  

---

### Teachers

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/teachers` | รายการครู (รองรับ `?page=&limit=&search=&schoolId=&region=&status=&cohort=`) |
| GET | `/api/teachers/:id` | ดูครูตาม ID |
| GET | `/api/teachers/:id/statistics` | สถิติครู |
| POST | `/api/teachers` | สร้างครู |
| PUT | `/api/teachers/:id` | แก้ไขครู |
| DELETE | `/api/teachers/:id` | ลบครู |

**ตัวอย่าง POST Body (Teacher)**:
```json
{
  "citizenId": "1234567890123",
  "fullName": "นายทดสอบ ระบบ",
  "gender": "MALE",
  "birthDate": "1995-01-15",
  "cohort": 1,
  "appointmentDate": "2024-05-01",
  "position": "ครูผู้ช่วย",
  "major": "คณิตศาสตร์",
  "schoolId": "<school-uuid>",
  "status": "ACTIVE",
  "email": "teacher@example.com",
  "phone": "081-234-5678"
}
```
`gender`: MALE | FEMALE | OTHER  
`status`: ACTIVE | TRANSFERRED | RESIGNED | ON_LEAVE  

---

### Journals

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/journals` | รายการ Journal (รองรับ `?teacherId=`) |
| GET | `/api/journals/:id` | ดู Journal ตาม ID |
| POST | `/api/journals` | สร้าง Journal |
| PUT | `/api/journals/:id` | แก้ไข Journal |
| DELETE | `/api/journals/:id` | ลบ Journal |

**ตัวอย่าง POST Body (Journal)**:
```json
{
  "teacher": { "connect": { "id": "<teacher-uuid>" } },
  "month": "2026-01",
  "reflectionText": "บันทึกสะท้อนคิด...",
  "successStory": "ผลสำเร็จ",
  "difficulty": "อุปสรรค",
  "supportRequest": "ความช่วยเหลือ"
}
```
`month`: รูปแบบ `YYYY-MM` และต้องไม่ซ้ำกับเดือนที่มีอยู่ของครูคนเดียวกัน  

---

## ✅ Test Checklist

### Schools
- [ ] GET /schools — แสดงรายการ
- [ ] POST /schools — สร้างโรงเรียนใหม่
- [ ] GET /schools/:id — อ่านรายละเอียด
- [ ] PUT /schools/:id — แก้ไข
- [ ] DELETE /schools/:id — ลบ (กรณีไม่มีครูผูกอยู่)

### Teachers
- [ ] GET /teachers — แสดงรายการ
- [ ] POST /teachers — สร้างครูใหม่ (ใช้ schoolId ที่มีอยู่)
- [ ] GET /teachers/:id — อ่านรายละเอียด
- [ ] PUT /teachers/:id — แก้ไข
- [ ] DELETE /teachers/:id — ลบครูที่สร้างสำหรับทดสอบ

### Journals
- [ ] GET /journals — แสดงรายการ (ใส่ `?teacherId=` ถ้าต้องการ)
- [ ] POST /journals — สร้าง Journal (ใช้ teacherId + month ที่ยังไม่มี)
- [ ] GET /journals/:id — อ่านรายละเอียด
- [ ] PUT /journals/:id — แก้ไข
- [ ] DELETE /journals/:id — ลบ

---

## 🧹 Cleanup

สคริปต์ `test-crud.ps1` จะ:
1. สร้าง School ชั่วคราว → ทดสอบ CRUD (ยกเว้น Delete ถ้าใช้โรงเรียนนี้กับ Teacher)
2. สร้าง Teacher ชั่วคราว (ผูกกับ School ข้างต้น) → ทดสอบ CRUD
3. สร้าง Journal ชั่วคราว (ผูกกับ Teacher) → ทดสอบ CRUD รวมถึง Delete
4. ลบ Teacher ที่สร้าง
5. ลบ School ที่สร้าง  

ดังนั้นหลังรัน script จะไม่เหลือข้อมูลทดสอบในระบบ (ยกเว้นลบไม่สำเร็จ)

---

## 🐛 Troubleshooting

### Invalid credentials / 401
- ใช้ token ที่ได้จาก `/api/auth/login` และส่งใน header `Authorization: Bearer <token>`

### Journal for this month already exists
- เลือก `month` (YYYY-MM) ที่ยังไม่มีของครูคนนั้น หรือใช้ครูอีกคน

### School delete ล้มเหลว
- ลบครูที่ผูกกับโรงเรียนก่อน แล้วค่อยลบโรงเรียน

### Teacher create ล้มเหลว (citizenId / email)
- ให้ `citizenId` และ `email` ไม่ซ้ำกับที่มีใน DB

### Connection refused
- ตรวจสอบว่า API รันที่ `http://localhost:3001`

---

## 📚 ไฟล์ที่เกี่ยวข้อง

- `apps/api/src/teachers/` — Teachers API
- `apps/api/src/schools/` — Schools API  
- `apps/api/src/journals/` — Journals API  
- `scripts/test-crud.ps1` — สคริปต์ทดสอบ CRUD

---

**จัดทำโดย**: AI Cursor Agent  
**วันที่**: 27 มกราคม 2569
