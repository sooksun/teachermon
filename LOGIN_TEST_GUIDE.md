# 🧪 คู่มือการทดสอบ Login (4 Roles)

**วันที่**: 27 มกราคม 2569

---

## 📋 สรุป

คู่มือนี้แสดงวิธีทดสอบ Login สำหรับทุก role ในระบบ TeacherMon

---

## 🔑 Roles ในระบบ

ระบบมี **5 roles** แต่สำหรับการทดสอบหลักจะเน้น **4 roles**:

1. **ADMIN** - ผู้ดูแลระบบ ✅
2. **PROJECT_MANAGER** - ผู้จัดการโครงการ ✅
3. **TEACHER** - ครู ✅
4. **PRINCIPAL** - ผู้อำนวยการ ⚠️ (อาจต้องสร้าง)
5. **MENTOR** - พี่เลี้ยง ⚠️ (อาจต้องสร้าง)

---

## 👥 Test Users

### 1. ADMIN
- **Email**: `admin@teachermon.com`
- **Password**: `password123`
- **Role**: `ADMIN`
- **สิทธิ์**: เข้าถึงได้ทุกอย่าง

### 2. PROJECT_MANAGER
- **Email**: `manager@teachermon.com`
- **Password**: `password123`
- **Role**: `PROJECT_MANAGER`
- **สิทธิ์**: จัดการโครงการ, ดูรายงาน, จัดการข้อมูลครู

### 3. TEACHER
- **Email**: `pimchanok@example.com` (หรือ email ของ teacher อื่นๆ)
- **Password**: `password123`
- **Role**: `TEACHER`
- **สิทธิ์**: ดูและจัดการข้อมูลของตัวเอง, สร้าง journal, evidence

### 4. PRINCIPAL
- **Email**: `principal@teachermon.com`
- **Password**: `password123`
- **Role**: `PRINCIPAL`
- **สิทธิ์**: ดูข้อมูลครูในโรงเรียน, รายงาน

### 5. MENTOR
- **Email**: `mentor@teachermon.com`
- **Password**: `password123`
- **Role**: `MENTOR`
- **สิทธิ์**: ดูและจัดการข้อมูลครูที่รับผิดชอบ, สร้าง mentoring visit

---

## 🛠️ วิธีทดสอบ

### วิธีที่ 1: ใช้ PowerShell Script (แนะนำ)

```powershell
# ทดสอบทุก role
.\scripts\test-login.ps1

# ทดสอบ role เดียว
.\scripts\test-login.ps1 -Action admin
.\scripts\test-login.ps1 -Action manager
.\scripts\test-login.ps1 -Action teacher
.\scripts\test-login.ps1 -Action principal
.\scripts\test-login.ps1 -Action mentor
```

### วิธีที่ 2: ทดสอบผ่าน Browser

1. เปิด `http://localhost:3000/login`
2. ใส่ email และ password ตาม test users
3. ตรวจสอบว่า login สำเร็จและ redirect ไปที่ `/dashboard`
4. ตรวจสอบ role ใน profile

### วิธีที่ 3: ทดสอบผ่าน API โดยตรง

#### PowerShell:
```powershell
# Login
$body = @{
    email = "admin@teachermon.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.access_token

# Test Profile
$headers = @{
    "Authorization" = "Bearer $token"
}
$profile = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" -Method Get -Headers $headers
$profile | ConvertTo-Json
```

#### cURL:
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teachermon.com","password":"password123"}' | jq .

# Get Profile
TOKEN="your-token-here"
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## ✅ Test Checklist

### สำหรับแต่ละ Role:

- [ ] Login สำเร็จ
- [ ] ได้รับ JWT token
- [ ] Token ถูกต้อง (สามารถใช้เรียก API ได้)
- [ ] Profile API ทำงาน (GET /api/auth/profile)
- [ ] Role ถูกต้อง
- [ ] Redirect ไปที่ dashboard ถูกต้อง
- [ ] UI แสดงข้อมูลตาม role

### Edge Cases:

- [ ] Login ด้วย email ที่ไม่มีในระบบ → ควรได้ error
- [ ] Login ด้วย password ผิด → ควรได้ error
- [ ] Login ด้วย user ที่ isActive = false → ควรได้ error
- [ ] Login แล้ว token ใช้งานได้
- [ ] Login แล้ว lastLogin อัพเดต

---

## 🔍 ตรวจสอบผลลัพธ์

### 1. Response จาก Login API

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@teachermon.com",
    "role": "ADMIN",
    "fullName": "ผู้ดูแลระบบ",
    "teacherId": null
  }
}
```

### 2. Profile API Response

```json
{
  "id": "uuid",
  "email": "admin@teachermon.com",
  "role": "ADMIN",
  "fullName": "ผู้ดูแลระบบ",
  "teacherId": null,
  "isActive": true,
  "lastLogin": "2026-01-27T06:00:00.000Z",
  "createdAt": "2026-01-26T00:00:00.000Z",
  "teacher": null
}
```

---

## 🐛 Troubleshooting

### Error: Invalid credentials
- ตรวจสอบว่า email และ password ถูกต้อง
- ตรวจสอบว่า user มี `isActive = true`
- ตรวจสอบว่า password ถูก hash ถูกต้อง

### Error: Email already registered
- User นี้มีอยู่แล้วในระบบ
- ใช้ email อื่นหรือลบ user เก่าก่อน

### Error: Connection refused
- ตรวจสอบว่า API server รันอยู่ที่ `http://localhost:3001`
- ตรวจสอบว่า port ถูกต้อง

### Token ไม่ทำงาน
- ตรวจสอบว่า token ถูกส่งใน header: `Authorization: Bearer <token>`
- ตรวจสอบว่า token ยังไม่หมดอายุ
- ตรวจสอบว่า JWT_SECRET ถูกต้อง

---

## 📝 สร้าง Test Users

### วิธีที่ 1: ใช้ PowerShell Script (แนะนำ)

```powershell
# สร้าง test users สำหรับทุก role
.\scripts\create-test-users.ps1
```

### วิธีที่ 2: สร้างผ่าน API โดยตรง

ถ้ายังไม่มี test users สำหรับบาง role สามารถสร้างได้ผ่าน API:

```powershell
# Register PRINCIPAL
$body = @{
    email = "principal@teachermon.com"
    password = "password123"
    role = "PRINCIPAL"
    fullName = "ผู้อำนวยการโรงเรียน"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -Body $body -ContentType "application/json"

# Register MENTOR
$body = @{
    email = "mentor@teachermon.com"
    password = "password123"
    role = "MENTOR"
    fullName = "พี่เลี้ยงครู"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

---

## 📚 เอกสารเพิ่มเติม

- `apps/api/src/auth/auth.service.ts` - Authentication service
- `apps/api/src/auth/auth.controller.ts` - Authentication endpoints
- `apps/web/app/login/page.tsx` - Login page

---

**จัดทำโดย**: AI Cursor Agent  
**วันที่**: 27 มกราคม 2569
