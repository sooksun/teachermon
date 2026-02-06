# แก้ไขปัญหา "ยังไม่มี แบบประเมินตนเอง"

## สถานะปัจจุบัน

### ✅ ข้อมูลในระบบ
- **มี Self-Assessments:** 2 รายการ
  - ID: `6e5ca980-3456-459a-99d9-2d89fae52d4b` (Status: SUBMITTED)
  - ID: `8db7fbdb-1292-4135-9abb-d207282e63d2` (Status: DRAFT)
- **Teacher ID:** `0f65aca1-3586-4a49-9d7a-2bfb5ffd3e55`
- **API ทำงาน:** ✅ GET `/api/self-assessment` ส่งคืนข้อมูลได้

### ⚠️ ปัญหาที่พบ
- **หน้า UI:** อาจไม่แสดงข้อมูล (Empty state)
- **สาเหตุที่เป็นไปได้:**
  1. Authentication token ไม่ถูกต้อง
  2. API call ล้มเหลว (network error)
  3. Teacher ID ไม่ตรงกัน
  4. React Query cache ไม่ทำงาน

## วิธีแก้ไข

### 1. ตรวจสอบ Authentication
```javascript
// ตรวจสอบว่า user มี teacherId หรือไม่
const { user } = useAuth();
console.log('User:', user);
console.log('Teacher ID:', user?.teacherId);
```

### 2. ตรวจสอบ API Call
```javascript
// เปิด Browser DevTools → Network tab
// ดู request ไปที่ /api/self-assessment
// ตรวจสอบ:
// - Status code (ควรเป็น 200)
// - Response body (ควรมี array ของ assessments)
// - Headers (ควรมี Authorization: Bearer <token>)
```

### 3. ตรวจสอบ Console Errors
```javascript
// เปิด Browser DevTools → Console
// ดูว่ามี error อะไรหรือไม่
```

### 4. ลอง Refresh หน้า
- กด `F5` หรือ `Ctrl+R` เพื่อ refresh
- หรือ Clear cache และ reload

### 5. ตรวจสอบ API Server
```bash
# ตรวจสอบว่า API server ทำงานอยู่
curl http://localhost:3001/api/self-assessment \
  -H "Authorization: Bearer <token>"
```

## วิธีเข้าถึงแบบประเมินตนเอง

### ผ่าน URL โดยตรง
```
http://localhost:3000/self-assessment
```

### ผ่านเมนู (ถ้าเพิ่มแล้ว)
- คลิกเมนู "การประเมินตนเอง" ใน sidebar

### สร้างการประเมินใหม่
```
http://localhost:3000/self-assessment/new
```

## สร้างการประเมินใหม่

ถ้ายังไม่มีข้อมูล หรือต้องการสร้างใหม่:

1. **ไปที่:** `http://localhost:3000/self-assessment/new`
2. **กรอกข้อมูล:**
   - เลือกช่วงเวลา (เช่น "ก่อนการพัฒนา")
   - ให้คะแนน 4 ด้าน (1-5)
   - เขียน reflection (optional)
   - ระบุจุดเด่น, จุดพัฒนา, แผนพัฒนา
   - เลือก portfolio items (optional)
3. **บันทึก:**
   - คลิก "บันทึกร่าง" (DRAFT)
   - หรือ "บันทึกและส่ง" (SUBMITTED)

## ตรวจสอบข้อมูลในฐานข้อมูล

### ผ่าน API
```bash
# Login
POST /api/auth/login
{
  "email": "somsak@example.com",
  "password": "password123"
}

# Get assessments
GET /api/self-assessment
Authorization: Bearer <token>
```

### ผ่าน Supabase Dashboard
1. เปิด Supabase Dashboard
2. ไปที่ Table Editor
3. เปิดตาราง `self_assessment`
4. ดูข้อมูลที่มีอยู่

## สรุป

**ข้อมูลมีอยู่แล้ว:** ✅ 2 รายการ  
**API ทำงาน:** ✅  
**หน้า UI:** ⚠️ อาจต้องตรวจสอบ  

**วิธีแก้:**
1. ตรวจสอบ Browser Console
2. ตรวจสอบ Network tab
3. ลอง refresh หน้า
4. สร้างการประเมินใหม่ถ้าต้องการ

---

**ถ้ายังไม่แสดง:** กรุณาแจ้ง error message จาก Browser Console เพื่อช่วยแก้ไขต่อ
