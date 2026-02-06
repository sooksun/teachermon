# 🔒 TeacherMon - Security Guide

**วันที่สร้าง**: 24 มกราคม 2569  
**Level**: Production Security Hardening

---

## 🎯 Security Overview

เอกสารนี้ครอบคลุม security best practices สำหรับระบบ TeacherMon

---

## 🔴 Critical Security Tasks (ต้องทำก่อน Deploy!)

### 1. เปลี่ยน Secrets ทั้งหมด

```bash
# Generate strong JWT secret (32+ characters)
openssl rand -base64 32

# Generate strong database password
openssl rand -base64 24

# Generate session secret
openssl rand -hex 32
```

**แก้ไขใน `apps/api/.env.production`**:
```env
JWT_SECRET="[ใส่ค่าจาก openssl rand -base64 32]"
DATABASE_URL="postgresql://prod_user:[ใส่ password จาก openssl]@localhost:5432/teachermon"
SESSION_SECRET="[ใส่ค่าจาก openssl rand -hex 32]"
```

### 2. ลบหรือเปลี่ยน Default Accounts

```sql
-- Login เข้า PostgreSQL
psql -U postgres -d teachermon

-- เปลี่ยน password ของ admin
UPDATE users 
SET password = '$2b$10$NEW_HASHED_PASSWORD'
WHERE email = 'admin@example.com';

-- หรือลบ demo accounts
DELETE FROM users WHERE email LIKE '%@example.com';

-- สร้าง admin account ใหม่
-- (ทำผ่าน API หรือ seed script)
```

### 3. ตั้งค่า CORS Properly

**`apps/api/src/main.ts`**:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN, // 'https://yourdomain.com' เท่านั้น!
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## 🛡️ Server Security

### 1. Firewall (UFW)

```bash
# Enable firewall
sudo ufw enable

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (only from specific IP - แนะนำ)
sudo ufw allow from YOUR_IP_ADDRESS to any port 22

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# PostgreSQL (localhost only!)
# ไม่ต้อง allow จาก internet

# Check status
sudo ufw status numbered
```

### 2. Fail2Ban (Brute Force Protection)

```bash
# Install
sudo apt install fail2ban

# Create jail config
sudo nano /etc/fail2ban/jail.local
```

**`/etc/fail2ban/jail.local`**:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@yourdomain.com
sendername = Fail2Ban-TeacherMon

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
```

เริ่มใช้งาน:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status
```

### 3. SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

แก้ไข:
```
# Disable root login
PermitRootLogin no

# Disable password authentication (use key only)
PasswordAuthentication no
PubkeyAuthentication yes

# Change default port (optional)
Port 2222

# Limit user access
AllowUsers your_username
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

---

## 🔐 Application Security

### 1. Rate Limiting

**NestJS Rate Limiting** (มีอยู่แล้ว):

```typescript
// apps/api/src/main.ts
import { ThrottlerGuard } from '@nestjs/throttler';

// Global rate limiting
app.useGlobalGuards(new ThrottlerGuard());
```

**Nginx Rate Limiting** (เพิ่มเติม):

```nginx
# Define zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Apply to endpoints
location /api/ {
    limit_req zone=api burst=20 nodelay;
}

location /api/auth/login {
    limit_req zone=login burst=3 nodelay;
}
```

### 2. Input Validation

**ใน NestJS Controllers**:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### 3. SQL Injection Prevention

✅ **Prisma ORM ป้องกันอัตโนมัติ**

```typescript
// ✅ SAFE - Prisma parameterized queries
await prisma.user.findUnique({ where: { email } });

// ❌ UNSAFE - Raw SQL (หลีกเลี่ยง!)
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

### 4. XSS Prevention

**Frontend**:
```typescript
// React/Next.js ป้องกัน XSS อัตโนมัติ
// แต่ต้องระวัง dangerouslySetInnerHTML

// ✅ SAFE
<div>{userInput}</div>

// ❌ UNSAFE
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Backend**:
```typescript
// Sanitize input
import { sanitize } from 'class-sanitizer';

@Post()
create(@Body() data: CreateDto) {
  const sanitized = sanitize(data);
  // ...
}
```

---

## 🗄️ Database Security

### 1. PostgreSQL Security

```sql
-- สร้าง user สำหรับ application (ไม่ใช้ postgres user)
CREATE USER teachermon_app WITH PASSWORD 'strong_password';

-- Grant เฉพาะที่จำเป็น
GRANT CONNECT ON DATABASE teachermon TO teachermon_app;
GRANT USAGE ON SCHEMA public TO teachermon_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO teachermon_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO teachermon_app;

-- สร้าง read-only user สำหรับ reporting
CREATE USER teachermon_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE teachermon TO teachermon_readonly;
GRANT USAGE ON SCHEMA public TO teachermon_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO teachermon_readonly;
```

### 2. PostgreSQL Configuration

**`postgresql.conf`**:
```ini
# Connection Security
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'

# Listen on localhost only (ถ้าไม่ต้องการ remote access)
listen_addresses = 'localhost'

# Connection limits
max_connections = 100
```

**`pg_hba.conf`**:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
host    teachermon      teachermon_app  127.0.0.1/32           scram-sha-256
host    teachermon      teachermon_app  ::1/128                scram-sha-256

# Deny all others
host    all             all             0.0.0.0/0              reject
```

### 3. Database Encryption

```sql
-- Encrypt sensitive columns (ถ้าจำเป็น)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypt personal ID
UPDATE teacher_profile 
SET personal_id_encrypted = pgp_sym_encrypt(personal_id, 'encryption_key');
```

---

## 🔍 Security Monitoring

### 1. Audit Logging

**Enable PostgreSQL Logging**:

```sql
-- Log all DDL statements
ALTER SYSTEM SET log_statement = 'ddl';

-- Log all failed login attempts
ALTER SYSTEM SET log_connections = on;

-- Reload config
SELECT pg_reload_conf();
```

### 2. Application Logging

```typescript
// Log security events
logger.warn('Failed login attempt', {
  email,
  ip: req.ip,
  timestamp: new Date(),
});

logger.info('User logged in', {
  userId,
  ip: req.ip,
  timestamp: new Date(),
});
```

### 3. Security Monitoring Tools

**Install Lynis** (Security audit tool):
```bash
sudo apt install lynis
sudo lynis audit system
```

**Install OSSEC** (Intrusion detection):
```bash
# Install OSSEC HIDS
wget -q -O - https://updates.atomicorp.com/installers/atomic | sudo bash
sudo apt install ossec-hids-server
```

---

## 🚨 Incident Response

### 1. Security Incident Checklist

```
[ ] Identify the incident
[ ] Isolate affected systems
[ ] Preserve evidence (logs, screenshots)
[ ] Notify stakeholders
[ ] Investigate root cause
[ ] Fix vulnerability
[ ] Document incident
[ ] Post-mortem review
```

### 2. Breach Response Plan

```bash
# 1. Immediate actions
docker-compose -f docker-compose.prod.yml down  # Stop services
./scripts/backup-db.sh  # Backup current state

# 2. Investigate
docker logs teachermon-api-prod > incident-api.log
docker logs teachermon-nginx > incident-nginx.log
grep "suspicious" /var/log/nginx/access.log

# 3. Fix
# - Patch vulnerability
# - Change all passwords
# - Revoke compromised tokens
# - Update dependencies

# 4. Restore
docker-compose -f docker-compose.prod.yml up -d

# 5. Monitor
./scripts/monitor.sh
```

---

## 🔄 Regular Security Tasks

### Daily
- [ ] Review error logs
- [ ] Monitor failed login attempts
- [ ] Check uptime status

### Weekly
- [ ] Review access logs
- [ ] Update dependencies
  ```bash
  pnpm update
  ```
- [ ] Scan for vulnerabilities
  ```bash
  pnpm audit
  ```

### Monthly
- [ ] Full security audit
- [ ] Password rotation (ถ้ามี policy)
- [ ] SSL certificate check
- [ ] Backup restoration test
- [ ] Penetration testing (ถ้าทำได้)

---

## 🛠️ Security Tools

### 1. Dependency Scanning

```bash
# Check for known vulnerabilities
pnpm audit

# Fix automatically (ระวัง breaking changes)
pnpm audit --fix

# Check for outdated packages
pnpm outdated
```

### 2. Docker Security Scanning

```bash
# Scan Docker images
docker scan teachermon-api:latest
docker scan teachermon-web:latest

# Trivy scanner
trivy image teachermon-api:latest
```

### 3. SSL Testing

```bash
# Test SSL configuration
testssl.sh yourdomain.com

# Or use online tool
# https://www.ssllabs.com/ssltest/
```

---

## 📞 Security Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Security Lead | | | |
| Tech Lead | | | |
| On-call Engineer | | | |

---

## 📚 Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **NestJS Security**: https://docs.nestjs.com/security/
- **PostgreSQL Security**: https://www.postgresql.org/docs/current/security.html
- **Docker Security**: https://docs.docker.com/engine/security/

---

**Last Updated**: 24 มกราคม 2569
