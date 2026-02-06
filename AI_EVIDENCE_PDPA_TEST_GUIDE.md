# 🧪 คู่มือการทดสอบ AI (Evidence & PDPA)

**วันที่**: 27 มกราคม 2569

---

## 📋 สรุป

คู่มือนี้ใช้ทดสอบ AI features ที่เกี่ยวข้องกับ **Evidence** และ **PDPA Scanning**

---

## 🔑 ข้อกำหนดเบื้องต้น

1. **API Server** รันที่ `http://localhost:3001`
2. **JWT Token** จาก user ที่มีสิทธิ์
3. **GEMINI_API_KEY** (ถ้ามี) - ถ้าไม่มีจะใช้ mock responses
4. **Teacher ID** สำหรับทดสอบ upload evidence

---

## 🤖 AI Features ที่ทดสอบ

### 1. Evidence AI Analysis
- **เมื่อ**: Upload evidence file
- **ทำอะไร**: 
  - วิเคราะห์ชื่อไฟล์และสร้าง summary
  - แนะนำ keywords, indicators, filename
  - ตรวจสอบคุณภาพ (quality check)
  - ให้คำแนะนำ (suggestions)

### 2. PDPA Scanner
- **เมื่อ**: Upload evidence หรือสร้าง journal
- **ทำอะไร**:
  - ตรวจสอบข้อความว่ามีข้อมูลอ่อนไหวหรือไม่
  - ตรวจหา: ชื่อนักเรียน, เลขบัตรประชาชน, เบอร์โทร, ที่อยู่, อีเมล
  - คำนวณระดับความเสี่ยง (SAFE, LOW, MEDIUM, HIGH)
  - สร้างข้อความที่ปลอดภัย (sanitized text)

---

## 🛠️ วิธีทดสอบ

### วิธีที่ 1: ใช้ PowerShell Script (แนะนำ)

```powershell
# ทดสอบ PDPA Scanner
.\scripts\test-ai-pdpa.ps1

# ทดสอบ Evidence Upload (พร้อม AI)
.\scripts\test-ai-evidence.ps1
```

### วิธีที่ 2: ทดสอบผ่าน API โดยตรง

#### 1. ทดสอบ PDPA Scanner (Journal)

```powershell
# Login
$body = @{ email = "admin@teachermon.com"; password = "password123" } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $r.access_token

# Test PDPA Check (มีข้อมูลอ่อนไหว)
$pdpaBody = @{
    text = "นักเรียนชื่อ สมชาย ใจดี เลขบัตรประชาชน 1234567890123 เบอร์โทร 081-234-5678"
} | ConvertTo-Json

$headers = @{ "Authorization" = "Bearer $token" }
$result = Invoke-RestMethod -Uri "http://localhost:3001/api/journals/ai/check-pdpa" -Method Post -Body $pdpaBody -ContentType "application/json" -Headers $headers
$result | ConvertTo-Json -Depth 10
```

#### 2. ทดสอบ Evidence Upload (พร้อม AI Analysis)

**วิธีที่ 1: ใช้ PowerShell Script (แนะนำ)**
```powershell
.\scripts\test-ai-evidence.ps1
```

**วิธีที่ 2: ใช้ curl (ถ้ามี)**
```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teachermon.com","password":"password123"}' | jq -r '.access_token')

# Upload file
curl -X POST http://localhost:3001/api/evidence/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-evidence.pdf" \
  -F "evidenceType=LESSON_PLAN" \
  -F "indicatorCodes=1.1" \
  -F "indicatorCodes=1.2" | jq .
```

**วิธีที่ 3: ใช้ Postman/Insomnia**
- Method: `POST`
- URL: `http://localhost:3001/api/evidence/upload`
- Headers: `Authorization: Bearer <token>`
- Body: `form-data`
  - `file`: (File) เลือกไฟล์
  - `evidenceType`: `LESSON_PLAN`
  - `indicatorCodes`: `1.1` (เพิ่มหลายค่าได้)
  - `indicatorCodes`: `1.2`

#### 3. ดู AI Activities (Admin)

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$activities = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/admin/activities?limit=10" -Method Get -Headers $headers
$activities | ConvertTo-Json -Depth 10
```

#### 4. ดู AI Activities (Admin)

```powershell
$headers = @{ "Authorization" = "Bearer $token" }

# ดู activities ทั้งหมด
$activities = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/admin/activities?limit=10" -Method Get -Headers $headers
$activities | ConvertTo-Json -Depth 10

# ดู activities ของ user
$userId = "user-id-here"
$userActivities = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/admin/activities/user/$userId" -Method Get -Headers $headers
$userActivities | ConvertTo-Json -Depth 10

# ดู activities ที่รอ review
$pending = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/admin/activities/pending-review" -Method Get -Headers $headers
$pending | ConvertTo-Json -Depth 10

# Review activity
$activityId = "activity-id-here"
$reviewBody = @{
    approved = $true
    notes = "Approved - AI analysis looks good"
} | ConvertTo-Json
$review = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/admin/activities/$activityId/review" -Method Patch -Body $reviewBody -ContentType "application/json" -Headers $headers
$review | ConvertTo-Json -Depth 10

# ดูสถิติ
$stats = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/admin/activities/stats" -Method Get -Headers $headers
$stats | ConvertTo-Json -Depth 10
```

#### 5. ดู PDPA Audit History

```powershell
# ดู PDPA history ของ evidence
$evidenceId = "evidence-id-here"
$headers = @{ "Authorization" = "Bearer $token" }
$history = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/admin/pdpa/evidence/$evidenceId" -Method Get -Headers $headers
$history | ConvertTo-Json -Depth 10

# Acknowledge PDPA risk
$auditId = "audit-id-here"
$ack = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/admin/pdpa/$auditId/acknowledge" -Method Patch -Headers $headers
$ack | ConvertTo-Json -Depth 10
```

---

## 📡 API Endpoints

### Evidence Upload (พร้อม AI)
- **POST** `/api/evidence/upload`
- **Body**: `multipart/form-data`
  - `file`: File (PDF, DOCX, JPG, etc.)
  - `evidenceType`: string (LESSON_PLAN, ASSESSMENT, etc.)
  - `indicatorCodes`: string[] (optional)
- **Response**: 
  ```json
  {
    "id": "uuid",
    "aiAnalysis": {
      "summary": "...",
      "keywords": ["..."],
      "suggestedIndicators": ["1.1", "1.2"],
      "suggestedFilename": "...",
      "qualityCheck": {...},
      "suggestions": [...]
    },
    "pdpaCheck": {
      "isSafe": false,
      "riskLevel": "HIGH",
      "violations": [...],
      "suggestions": [...]
    }
  }
  ```

### PDPA Check (Journal)
- **POST** `/api/journals/ai/check-pdpa`
- **Body**:
  ```json
  {
    "text": "ข้อความที่ต้องการตรวจสอบ",
    "sourceId": "optional-id"
  }
  ```
- **Response**:
  ```json
  {
    "isSafe": false,
    "riskLevel": "HIGH",
    "violations": [
      {
        "type": "STUDENT_FULL_NAME",
        "matchedText": "นักเรียนชื่อ สมชาย ใจดี",
        "riskLevel": "HIGH",
        "suggestion": "ใช้ 'นักเรียน ก.' หรือชื่อเล่นแทน"
      }
    ],
    "sanitizedText": "...",
    "suggestions": [...]
  }
  ```

### AI Admin Endpoints
- **GET** `/api/ai/admin/activities` - ดู AI activities
- **GET** `/api/ai/admin/activities/user/:userId` - ดู activities ของ user
- **GET** `/api/ai/admin/activities/pending-review` - ดู activities ที่รอ review
- **PATCH** `/api/ai/admin/activities/:activityId/review` - Review activity
- **GET** `/api/ai/admin/activities/stats` - สถิติการใช้งาน AI
- **GET** `/api/ai/admin/pdpa/:sourceType/:sourceId` - ดู PDPA audit history
- **PATCH** `/api/ai/admin/pdpa/:auditId/acknowledge` - Acknowledge PDPA risk

---

## ✅ Test Checklist

### Evidence AI
- [ ] Upload evidence file → ได้ AI analysis
- [ ] AI สร้าง summary จากชื่อไฟล์
- [ ] AI แนะนำ keywords และ indicators
- [ ] AI แนะนำชื่อไฟล์มาตรฐาน
- [ ] AI ตรวจสอบคุณภาพ (quality check)
- [ ] AI ให้คำแนะนำ (suggestions)

### PDPA Scanner
- [ ] Upload evidence → ตรวจ PDPA อัตโนมัติ
- [ ] สร้าง journal → ตรวจ PDPA อัตโนมัติ
- [ ] ตรวจสอบข้อความที่มีชื่อนักเรียน → ตรวจพบ (HIGH risk)
- [ ] ตรวจสอบข้อความที่มีเลขบัตรประชาชน → ตรวจพบ (HIGH risk)
- [ ] ตรวจสอบข้อความที่มีเบอร์โทร → ตรวจพบ (MEDIUM risk)
- [ ] ตรวจสอบข้อความที่มีที่อยู่ → ตรวจพบ (MEDIUM risk)
- [ ] ตรวจสอบข้อความที่ปลอดภัย → ไม่พบ violations (SAFE)
- [ ] ดู PDPA audit history
- [ ] Acknowledge PDPA risk

### AI Admin
- [ ] ดู AI activities ทั้งหมด
- [ ] ดู AI activities ของ user
- [ ] ดู activities ที่รอ review
- [ ] Review และอนุมัติ/ปฏิเสธ activity
- [ ] ดูสถิติการใช้งาน AI
- [ ] ดู PDPA audit history

---

## 🧪 Test Cases

### Test Case 1: PDPA Check - ชื่อนักเรียน

**Input**:
```
"นักเรียนชื่อ สมชาย ใจดี เรียนดีมาก"
```

**Expected**:
- `isSafe: false`
- `riskLevel: "HIGH"`
- `violations[0].type: "STUDENT_FULL_NAME"`
- `violations[0].suggestion` มีคำแนะนำให้ใช้ "นักเรียน ก."

### Test Case 2: PDPA Check - เลขบัตรประชาชน

**Input**:
```
"นักเรียนเลขบัตรประชาชน 1234567890123"
```

**Expected**:
- `isSafe: false`
- `riskLevel: "HIGH"`
- `violations[0].type: "CITIZEN_ID"`

### Test Case 3: PDPA Check - ข้อความปลอดภัย

**Input**:
```
"นักเรียน ก. มีพัฒนาการดีขึ้นมาก"
```

**Expected**:
- `isSafe: true`
- `riskLevel: "SAFE"`
- `violations: []`

### Test Case 4: Evidence Upload - AI Analysis

**Input**: Upload file ชื่อ `"แผนการสอน_คณิตศาสตร์_ป.1_2567.pdf"`

**Expected**:
- `aiAnalysis.summary` มีคำอธิบาย
- `aiAnalysis.keywords` มี keywords เช่น ["คณิตศาสตร์", "ป.1", "แผนการสอน"]
- `aiAnalysis.suggestedIndicators` มี indicators ที่เกี่ยวข้อง
- `aiAnalysis.suggestedFilename` เป็นชื่อไฟล์มาตรฐาน

---

## 🐛 Troubleshooting

### AI ไม่ทำงาน / ใช้ mock responses
- ตรวจสอบว่า `GEMINI_API_KEY` ถูกตั้งค่าใน `.env`
- ถ้าไม่มี API key ระบบจะใช้ mock responses (fallback)

### PDPA ไม่ตรวจพบข้อมูลอ่อนไหว
- ตรวจสอบว่า pattern matching ถูกต้อง
- ตรวจสอบว่า text ที่ส่งไปมีข้อมูลอ่อนไหวจริงๆ

### Evidence upload ล้มเหลว
- ตรวจสอบว่า `teacherId` ถูกต้อง
- ตรวจสอบว่า file size ไม่เกิน limit
- ตรวจสอบว่า file type ถูกต้อง

---

## 📚 ไฟล์ที่เกี่ยวข้อง

- `apps/api/src/ai/evidence-ai.service.ts` - Evidence AI service
- `apps/api/src/ai/pdpa-scanner.service.ts` - PDPA Scanner service
- `apps/api/src/evidence/evidence.service.ts` - Evidence service (ใช้ AI)
- `apps/api/src/ai/ai-admin.controller.ts` - AI Admin endpoints
- `apps/api/src/journals/journals.controller.ts` - Journal PDPA check endpoint

---

**จัดทำโดย**: AI Cursor Agent  
**วันที่**: 27 มกราคม 2569
