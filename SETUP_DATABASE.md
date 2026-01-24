# 🚀 Setup Database - MySQL (Laragon)

## ✅ เปลี่ยนมาใช้ MySQL เรียบร้อยแล้ว!

---

## 📋 ขั้นตอนการติดตั้ง

### 1️⃣ เปิด Laragon และ Start MySQL

**วิธีที่ 1: ใช้ GUI**
```
1. เปิดโปรแกรม Laragon (หาที่ Desktop หรือ Start Menu)
2. คลิกปุ่ม [Start All]
3. รอจนเห็นสถานะเป็น "Apache & MySQL are running"
```

**วิธีที่ 2: ใช้ System Tray**
```
1. หาไอคอน Laragon ที่มุมขวาล่าง (System Tray)
2. คลิกขวา
3. เลือก "Start All"
```

---

### 2️⃣ สร้าง Database `teachermon`

**วิธีที่ 1: ใช้ HeidiSQL (GUI - แนะนำ)**

```
1. เปิด Laragon
2. คลิกเมนู "Database" หรือไอคอน HeidiSQL
3. เชื่อมต่อ (จะ auto connect)
4. คลิกขวาที่ connection
5. เลือก "Create new" → "Database"
6. ตั้งชื่อ: teachermon
7. คลิก OK
```

**วิธีที่ 2: ใช้ Command Line**

```powershell
# ไปที่โฟลเดอร์ MySQL
cd D:\laragon\bin\mysql\bin

# เชื่อมต่อและสร้าง database
.\mysql -u root -e "CREATE DATABASE teachermon;"

# หรือเข้า MySQL shell
.\mysql -u root
# พิมพ์:
CREATE DATABASE teachermon;
exit;
```

**วิธีที่ 3: ใช้ Laragon Quick Create**

```
1. เปิด Laragon
2. คลิกเมนู "Database" → "Create database"
3. ตั้งชื่อ: teachermon
4. คลิก OK
```

---

### 3️⃣ Generate Prisma Client

```powershell
cd D:\laragon\www\teachermon\packages\database
pnpm db:generate
```

**คาดว่าจะเห็น:**
```
✔ Generated Prisma Client to .\..\..\node_modules\...
```

---

### 4️⃣ Run Migrations

```powershell
pnpm db:migrate
```

**คาดว่าจะเห็น:**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": MySQL database "teachermon"

✔ Enter a name for the new migration: ... (enter)
✔ Applied migration(s)
```

---

### 5️⃣ Seed Data

```powershell
pnpm db:seed
```

**คาดว่าจะเห็น:**
```
🌱 Starting database seeding...
✅ Cleared existing data
✅ Created 5 schools
✅ Created 6 teachers
✅ Created 8 users
...
🎉 Database seeded successfully!
```

---

### 6️⃣ ตรวจสอบข้อมูล (Optional)

```powershell
# เปิด Prisma Studio
pnpm db:studio
```

เบราว์เซอร์จะเปิดที่ http://localhost:5555 
ดูข้อมูลในตาราง Teacher, School, User ได้

---

## 🎯 Quick Commands

```powershell
# เปลี่ยนไปที่ packages/database
cd D:\laragon\www\teachermon\packages\database

# รันทั้งหมดทีเดียว
pnpm db:generate && pnpm db:migrate && pnpm db:seed
```

---

## ⚠️ Troubleshooting

### ปัญหา: MySQL ไม่ทำงาน

**แก้:**
```
1. เปิด Laragon
2. Stop All
3. Start All
```

### ปัญหา: Cannot connect to MySQL

**เช็ค:**
```powershell
# เช็คว่า MySQL ทำงานหรือไม่
netstat -an | findstr "3306"

# ควรเห็น:
TCP    0.0.0.0:3306          0.0.0.0:0              LISTENING
```

**แก้:**
```
1. เปิด Laragon
2. คลิกขวาที่ไอคอน Laragon (System Tray)
3. MySQL → Restart MySQL
```

### ปัญหา: Database already exists

**ไม่เป็นไร!** แสดงว่า database มีอยู่แล้ว ข้ามไปขั้นตอนที่ 3 เลย

### ปัญหา: Migration failed

**แก้:**
```powershell
# Reset database และสร้างใหม่
pnpm db:reset
```

---

## 📊 หลังจาก Setup เสร็จ

ข้อมูลที่จะมีในระบบ:

- 🏫 5 โรงเรียน (เชียงราย 2, กาฬสินธุ์ 1, สุรินทร์ 1, สุราษฎร์ธานี 1)
- 👨‍🏫 6 ครู (ทุกภูมิภาค)
- 👤 8 Users:
  - **Admin**: admin@teachermon.com / password123
  - **Manager**: manager@teachermon.com / password123
  - **Teachers**: ชื่อเมล @ teachermon.com / password123

---

## 🚀 รันระบบ

หลังจาก setup database เสร็จแล้ว:

```powershell
# Terminal 1 - Backend API
cd D:\laragon\www\teachermon\apps\api
pnpm dev

# Terminal 2 - Frontend
cd D:\laragon\www\teachermon\apps\web
pnpm dev
```

เปิดเบราว์เซอร์ไปที่:
- Frontend: http://localhost:3000
- API Docs: http://localhost:3001/api/docs

Login ด้วย: **admin@teachermon.com** / **password123**

---

## ✅ Done!

ระบบพร้อมใช้งานแล้ว! 🎉
