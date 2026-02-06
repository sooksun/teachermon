# 🧪 คู่มือการทดสอบ Data Retention API

**วันที่**: 26 มกราคม 2569

---

## 📋 สรุป

คู่มือนี้แสดงวิธีทดสอบ Data Retention API endpoints ทั้งหมด

---

## 🔑 ข้อกำหนดเบื้องต้น

1. **API Server**: ต้องรัน API server ก่อน! 
   ```powershell
   # ใน apps/api directory
   pnpm dev
   # หรือ
   npm run dev
   ```
2. **JWT Token**: ต้องมี JWT token ของผู้ใช้ที่มี role `ADMIN` หรือ `PROJECT_MANAGER`

---

## 🔐 วิธีรับ JWT Token

### 1. ผ่าน Login API

```powershell
# PowerShell
$loginBody = @{
    email = "admin@example.com"
    password = "your-password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.access_token
Write-Host "Token: $token"
```

```bash
# Bash
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  | jq -r '.access_token')
echo "Token: $TOKEN"
```

---

## 📡 API Endpoints

### 1. ดูสถิติ Data Retention

**Endpoint**: `GET /api/pdpa/retention/stats`

**Role**: ADMIN, PROJECT_MANAGER

**ตัวอย่างการเรียกใช้**:

#### PowerShell:
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/pdpa/retention/stats" -Method Get -Headers $headers
$response | ConvertTo-Json -Depth 10
```

#### cURL:
```bash
curl -X GET "http://localhost:3001/api/pdpa/retention/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Response**:
```json
{
  "journals": {
    "total": 150,
    "expiring": 5,
    "retentionDays": 1825
  },
  "evidence": {
    "total": 320,
    "expiring": 12,
    "retentionDays": 1825
  },
  "auditLogs": {
    "total": 45,
    "expiring": 3,
    "retentionDays": 1095
  },
  "aiActivities": {
    "total": 200,
    "expiring": 8,
    "retentionDays": 365
  },
  "assessments": {
    "total": 80,
    "expiring": 2,
    "retentionDays": 2555
  }
}
```

---

### 2. ตรวจสอบข้อมูลที่ใกล้หมดอายุ

**Endpoint**: `GET /api/pdpa/retention/expiring`

**Role**: ADMIN, PROJECT_MANAGER

**ตัวอย่างการเรียกใช้**:

#### PowerShell:
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/pdpa/retention/expiring" -Method Get -Headers $headers
$response | ConvertTo-Json -Depth 10
```

#### cURL:
```bash
curl -X GET "http://localhost:3001/api/pdpa/retention/expiring" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Response**:
```json
{
  "journals": 5,
  "evidence": 12,
  "auditLogs": 3,
  "aiActivities": 8,
  "assessments": 2
}
```

---

### 3. รัน Cleanup แบบ Manual

**Endpoint**: `POST /api/pdpa/retention/cleanup`

**Role**: ADMIN, PROJECT_MANAGER

**Body**:
```json
{
  "dryRun": false  // true = ตรวจสอบเท่านั้น, false = ลบจริง
}
```

**ตัวอย่างการเรียกใช้**:

#### PowerShell (Dry Run):
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    dryRun = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/pdpa/retention/cleanup" -Method Post -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 10
```

#### PowerShell (ลบจริง):
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    dryRun = $false
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/pdpa/retention/cleanup" -Method Post -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 10
```

#### cURL (Dry Run):
```bash
curl -X POST "http://localhost:3001/api/pdpa/retention/cleanup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}' | jq .
```

#### cURL (ลบจริง):
```bash
curl -X POST "http://localhost:3001/api/pdpa/retention/cleanup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}' | jq .
```

**Response (Dry Run)**:
```json
{
  "dryRun": true,
  "wouldDelete": {
    "journals": 5,
    "evidence": 12,
    "auditLogs": 3,
    "aiActivities": 8,
    "assessments": 2
  },
  "message": "This is a dry run. No data was deleted."
}
```

**Response (ลบจริง)**:
```json
{
  "success": true,
  "deleted": {
    "journals": 5,
    "evidence": 12,
    "auditLogs": 3,
    "aiActivities": 8,
    "assessments": 2
  },
  "total": 30,
  "cleanupDate": "2026-01-26T02:00:00.000Z"
}
```

---

## 🛠️ ใช้สคริปต์ทดสอบ

### PowerShell Script

**วิธีที่ 1: ใช้สคริปต์ใน `apps/api` (แนะนำ)**

```powershell
# 1. ไปที่ apps/api directory
cd apps/api

# 2. รับ Token
$loginBody = @{ email = "admin@example.com"; password = "your-password" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.access_token

# 3. ทดสอบ Stats
.\test-retention-api.ps1 -Token $token -Action stats

# 4. ทดสอบ Expiring
.\test-retention-api.ps1 -Token $token -Action expiring

# 5. ทดสอบ Dry Run
.\test-retention-api.ps1 -Token $token -Action dryrun

# 6. ทดสอบ Cleanup (ลบจริง) - ระวัง!
.\test-retention-api.ps1 -Token $token -Action cleanup
```

**วิธีที่ 2: ใช้สคริปต์ใน `scripts`**

```powershell
# 1. ไปที่ root directory
cd D:\laragon\www\teachermon

# 2. รับ Token
$loginBody = @{ email = "admin@example.com"; password = "your-password" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.access_token

# 3. ทดสอบ
.\scripts\test-retention-api.ps1 -Token $token -Action stats
```

### Bash Script

```bash
# 1. ตั้งค่า Token
export TOKEN="your-jwt-token-here"

# 2. ทดสอบ Stats
./scripts/test-retention-api.sh stats

# 3. ทดสอบ Expiring
./scripts/test-retention-api.sh expiring

# 4. ทดสอบ Dry Run
./scripts/test-retention-api.sh dryrun

# 5. ทดสอบ Cleanup (ลบจริง) - ระวัง!
./scripts/test-retention-api.sh cleanup
```

---

## ⚠️ ข้อควรระวัง

1. **Dry Run First**: ควรรัน dry run ก่อนเพื่อดูว่าจะลบอะไรบ้าง
2. **Backup**: ควร backup ข้อมูลก่อนรัน cleanup จริง
3. **Role Check**: ต้องมี role `ADMIN` หรือ `PROJECT_MANAGER`
4. **Scheduled Job**: Cleanup จะรันอัตโนมัติทุกวันเวลา 02:00 น.

---

## 🐛 Troubleshooting

### Error: 401 Unauthorized
- ตรวจสอบว่า Token ถูกต้องและยังไม่หมดอายุ
- ตรวจสอบว่า Token มี role `ADMIN` หรือ `PROJECT_MANAGER`

### Error: 403 Forbidden
- ตรวจสอบว่า user มี role ที่ถูกต้อง
- ตรวจสอบว่า RolesGuard ทำงานถูกต้อง

### Error: Connection Refused
- ตรวจสอบว่า API server รันอยู่ที่ `http://localhost:3001`
- ตรวจสอบว่า port ถูกต้อง

---

## 📚 เอกสารเพิ่มเติม

- `DATA_RETENTION_POLICY.md` - นโยบายการเก็บรักษาข้อมูล
- `PDPA_DATA_RETENTION_IMPLEMENTATION.md` - รายงานการ implement

---

**จัดทำโดย**: AI Cursor Agent  
**วันที่**: 26 มกราคม 2569
