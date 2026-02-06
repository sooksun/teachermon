# ทดสอบระบบ Upload + Video - สำเร็จ! ✅

## สิ่งที่ทดสอบเสร็จ

### 1. เพิ่มวิดีโอลิงก์ ✅
**ทดสอบ 2 รายการ:**

**Test 1: YouTube Video**
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "videoTitle": "การสอนคณิตศาสตร์เบื้องต้น",
  "videoDescription": "วิดีโอแสดงการสอนคณิตศาสตร์...",
  "evidenceType": "CLASSROOM_PHOTO",
  "indicatorCodes": ["WP_1", "WP_2", "CM_1"]
}
```
**ผลลัพธ์:**
- ✅ สร้างสำเร็จ
- ✅ Platform: youtube
- ✅ PDPA Checked: true
- ✅ Indicators: WP_1, WP_2, CM_1

**Test 2: YouTube Video (ก่อนหน้า)**
- ✅ Platform: youtube
- ✅ Title: Video teaching demo

### 2. API Endpoints ที่ทำงาน

```
✅ POST   /api/evidence/video-link       เพิ่มวิดีโอลิงก์
✅ GET    /api/evidence/teacher/:id      ดึงรายการ Portfolio
✅ POST   /api/evidence/upload           อัพโหลดไฟล์ (เพิ่งสร้าง)
```

### 3. รายการใน Portfolio

**ข้อมูลปัจจุบัน:**
- Total Items: **2**
- Videos: **2** (YouTube)
- Files: **0** (ยังไม่ทดสอบ)

### 4. Platform Support ✅

**ทดสอบแล้ว:**
- ✅ **YouTube** - Auto-detect สำเร็จ

**พร้อมใช้:**
- ⏳ Google Drive (endpoint พร้อม)
- ⏳ Vimeo (endpoint พร้อม)
- ⏳ Facebook (endpoint พร้อม)

## การอัพเดต Backend

### ไฟล์ที่แก้ไข/สร้าง:

**1. Controller (`evidence.controller.ts`)**
```typescript
@Post('upload')
@Roles('TEACHER', 'ADMIN', 'PROJECT_MANAGER')
@UseInterceptors(FileInterceptor('file'))
async upload(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UploadFileDto,
  @Request() req: any,
): Promise<any>
```

**2. Service (`evidence.service.ts`)**
- เพิ่ม `uploadFile` method
- รองรับ multipart/form-data
- บันทึกไฟล์ใน `/uploads`
- สร้าง standardFilename (UUID)

**3. DTO (`upload-file.dto.ts`)**
```typescript
export class UploadFileDto {
  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;
  
  @IsOptional()
  @IsArray()
  indicatorCodes?: string[];
}
```

**4. Dependencies**
```bash
pnpm add @nestjs/platform-express multer @types/multer uuid
```

## สถานะการทดสอบ

### ✅ ทำงานแล้ว
- Login (Teacher)
- Create Video Link (YouTube)
- Auto-detect Platform
- PDPA Check
- Get Portfolio Items

### ⏳ รอทดสอบ
- Upload File (endpoint พร้อม)
- Delete Item
- Frontend Integration

## วิธีใช้งาน

### เพิ่มวิดีโอ (ผ่าน API)
```bash
POST /api/evidence/video-link
Authorization: Bearer {token}
Content-Type: application/json

{
  "videoUrl": "https://www.youtube.com/watch?v=xxxxx",
  "videoTitle": "ชื่อวิดีโอ",
  "videoDescription": "คำอธิบาย",
  "evidenceType": "TEACHING_MEDIA",
  "indicatorCodes": ["WP_1", "CM_1"]
}
```

### อัพโหลดไฟล์ (ผ่าน API)
```bash
POST /api/evidence/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

- file: [FILE]
- evidenceType: LESSON_PLAN
- indicatorCodes: WP_1,WP_2
```

### ดูรายการ Portfolio
```bash
GET /api/evidence/teacher/:teacherId
Authorization: Bearer {token}
```

## Evidence Types ที่ถูกต้อง

```
LESSON_PLAN         แผนการสอน
TEACHING_MEDIA      สื่อการสอน
ASSESSMENT          การประเมิน
STUDENT_WORK        ผลงานนักเรียน
CLASSROOM_PHOTO     ภาพถ่ายการสอน
REFLECTION          การสะท้อนคิด
ACTION_RESEARCH     การวิจัยปฏิบัติการ
OTHER               อื่นๆ
```

## การทดสอบถัดไป

1. ✅ ทดสอบ Video Link (YouTube) - สำเร็จ
2. ⏳ ทดสอบ Upload File
3. ⏳ ทดสอบ Delete Item
4. ⏳ ทดสอบ Frontend UI
5. ⏳ ทดสอบ Platform อื่นๆ (Drive, Vimeo, Facebook)

## Login Credentials

**Teacher:**
```
Email: somsak@example.com
Password: password123
Teacher ID: 0f65aca1-3586-4a49-9d7a-2bfb5ffd3e55
```

---

**สถานะ: ระบบพื้นฐานทำงานแล้ว ✅**  
**ต่อไป: ทดสอบ Upload File + Frontend Integration**
