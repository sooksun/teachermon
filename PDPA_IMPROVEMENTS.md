# 🔒 แผนการปรับปรุง PDPA Compliance

**วันที่**: 26 มกราคม 2569  
**สถานะ**: 🚧 **กำลังดำเนินการ**

---

## 📋 สรุป

ระบบ TeacherMon มี **PDPA Scanner** และ **Audit Trail** ที่ดีแล้ว แต่ยังขาดส่วนสำคัญหลายอย่างตามรายงาน **PDPA_COMPLIANCE_REPORT.md**

แผนการปรับปรุงนี้จะเพิ่ม:
1. ✅ Consent Management System
2. ✅ User Rights API (Access, Delete, Export)
3. ✅ Privacy Policy Page
4. ✅ Data Retention Service
5. ✅ Data Encryption

---

## 1. Consent Management System

### 1.1 Database Schema

**เพิ่มใน `schema.prisma`**:

```prisma
enum ConsentType {
  DATA_COLLECTION      // การเก็บรวบรวมข้อมูล
  DATA_PROCESSING      // การประมวลผลข้อมูล
  DATA_SHARING         // การเปิดเผยข้อมูล
  MARKETING            // การตลาด
  ANALYTICS            // การวิเคราะห์ข้อมูล
}

enum ConsentStatus {
  PENDING              // รอการยินยอม
  GRANTED              // ยินยอมแล้ว
  REVOKED              // ถอนความยินยอม
  EXPIRED              // หมดอายุ
}

model Consent {
  id                  String          @id @default(uuid())
  userId              String          @map("user_id")
  teacherId           String?         @map("teacher_id")
  consentType         ConsentType     @map("consent_type")
  status              ConsentStatus   @default(PENDING)
  
  // Consent Details
  grantedAt           DateTime?       @map("granted_at")
  revokedAt           DateTime?       @map("revoked_at")
  expiresAt           DateTime?       @map("expires_at")
  
  // Legal
  privacyPolicyVersion String?        @map("privacy_policy_version")
  termsVersion        String?         @map("terms_version")
  ipAddress           String?         @map("ip_address")
  userAgent           String?         @map("user_agent")
  
  // Relations
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  teacher             Teacher?        @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")
  
  @@unique([userId, consentType])
  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@map("consent")
}
```

### 1.2 API Endpoints

**Controller**: `apps/api/src/pdpa/pdpa.controller.ts`

```typescript
@Controller('pdpa')
@UseGuards(JwtAuthGuard)
export class PDPAController {
  // GET /api/pdpa/consents - ดู consent ทั้งหมดของ user
  @Get('consents')
  async getMyConsents(@Request() req) {
    return this.pdpaService.getUserConsents(req.user.sub);
  }

  // POST /api/pdpa/consents - ให้ความยินยอม
  @Post('consents')
  async grantConsent(@Body() dto: GrantConsentDto, @Request() req) {
    return this.pdpaService.grantConsent(req.user.sub, dto);
  }

  // DELETE /api/pdpa/consents/:type - ถอนความยินยอม
  @Delete('consents/:type')
  async revokeConsent(@Param('type') type: string, @Request() req) {
    return this.pdpaService.revokeConsent(req.user.sub, type);
  }
}
```

### 1.3 Frontend Components

**หน้า Privacy Policy**: `apps/web/app/privacy-policy/page.tsx`
**หน้า Consent Management**: `apps/web/app/settings/privacy/page.tsx`
**Consent Checkbox Component**: `apps/web/components/pdpa/consent-checkbox.tsx`

---

## 2. User Rights API

### 2.1 Right to Access (ขอข้อมูลส่วนตัว)

**API**: `GET /api/pdpa/my-data`

**Response**:
```json
{
  "personalInfo": {
    "fullName": "...",
    "email": "...",
    "phone": "...",
    "citizenId": "***",
    "address": "..."
  },
  "activities": [...],
  "assessments": [...],
  "journals": [...],
  "evidence": [...]
}
```

### 2.2 Right to Delete (ลบข้อมูลส่วนตัว)

**API**: `DELETE /api/pdpa/my-data`

**Options**:
- Delete all data
- Delete specific categories
- Anonymize instead of delete

### 2.3 Right to Data Portability (Export ข้อมูล)

**API**: `GET /api/pdpa/export-my-data`

**Formats**:
- JSON
- CSV
- PDF

---

## 3. Privacy Policy Page

### 3.1 Content Structure

1. **ข้อมูลที่เก็บรวบรวม**
2. **วัตถุประสงค์ในการใช้ข้อมูล**
3. **การเปิดเผยข้อมูล**
4. **สิทธิของเจ้าของข้อมูล**
5. **การรักษาความปลอดภัย**
6. **การเก็บรักษาข้อมูล**
7. **การติดต่อ**

### 3.2 Implementation

**File**: `apps/web/app/privacy-policy/page.tsx`

---

## 4. Data Retention Service

### 4.1 Retention Periods

```typescript
const RETENTION_PERIODS = {
  TEACHER_DATA: 7 * 365, // 7 years
  JOURNAL: 5 * 365,      // 5 years
  EVIDENCE: 5 * 365,     // 5 years
  ASSESSMENT: 7 * 365,   // 7 years
  AUDIT_LOG: 3 * 365,    // 3 years
};
```

### 4.2 Scheduled Job

**Service**: `apps/api/src/pdpa/data-retention.service.ts`

```typescript
@Injectable()
export class DataRetentionService {
  // Run daily at 2 AM
  @Cron('0 2 * * *')
  async cleanupExpiredData() {
    // Delete data older than retention period
  }
}
```

---

## 5. Data Encryption

### 5.1 Sensitive Fields

- `citizenId` (เลขประจำตัวประชาชน)
- `phone` (เบอร์โทรศัพท์)
- `address` (ที่อยู่)
- `email` (อีเมล)

### 5.2 Implementation

**Service**: `apps/api/src/common/encryption.service.ts`

```typescript
@Injectable()
export class EncryptionService {
  encrypt(data: string): string {
    // AES-256 encryption
  }

  decrypt(encrypted: string): string {
    // AES-256 decryption
  }
}
```

---

## 6. Implementation Steps

### Phase 1: Critical (Week 1)
1. ✅ สร้าง Consent Management System
2. ✅ สร้าง User Rights API
3. ✅ สร้าง Privacy Policy Page

### Phase 2: High Priority (Week 2)
4. ✅ สร้าง Data Retention Service
5. ✅ เพิ่ม Data Encryption

### Phase 3: Medium Priority (Week 3)
6. ✅ เพิ่ม Data Breach Notification
7. ✅ เพิ่ม Data Processing Agreement

---

## 7. Testing Checklist

- [ ] ทดสอบ Consent Management
- [ ] ทดสอบ Right to Access
- [ ] ทดสอบ Right to Delete
- [ ] ทดสอบ Data Export
- [ ] ทดสอบ Data Retention
- [ ] ทดสอบ Data Encryption
- [ ] ทดสอบ Privacy Policy Page

---

**จัดทำโดย**: AI Cursor Agent  
**วันที่**: 26 มกราคม 2569
