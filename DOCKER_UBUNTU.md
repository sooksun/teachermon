# Docker setup for Ubuntu 24

รัน TeacherMon ด้วย Docker บน **Ubuntu 24.04** (หรือ 22.04) ใช้ **Supabase** เป็น database (ไม่รัน Postgres ใน container)

## สิ่งที่ได้

- **API** (NestJS): Node 22, Debian Bookworm
- **Web** (Next.js): Node 22, Debian Bookworm
- **ไม่รัน Postgres**: ใช้ `DATABASE_URL` ชี้ไป Supabase

## 1. ความต้องการ

- Ubuntu 24.04 หรือ 22.04
- สิทธิ์ `sudo`
- Supabase project + `DATABASE_URL` (Direct connection)

## 2. ติดตั้งและรัน (แนะนำ)

```bash
# โคลนหรือเข้าไปที่โฟลเดอร์โปรเจกต์
cd teachermon

# รันสคริปต์ (ติดตั้ง Docker ถ้ายังไม่มี แล้วสร้าง .env และขึ้น container)
chmod +x scripts/setup-docker-ubuntu24.sh
./scripts/setup-docker-ubuntu24.sh
```

สคริปต์จะ:

1. ติดตั้ง Docker Engine + Compose plugin (ถ้ายังไม่มี)
2. สร้าง `.env` จาก `.env.docker.example` ถ้ายังไม่มี แล้วให้แก้ `DATABASE_URL`, `JWT_SECRET` ฯลฯ
3. รัน `docker compose -f docker-compose.ubuntu.yml up -d --build`

**ถ้า Docker ติดตั้งแล้ว** และอยากแค่ขึ้น container:

```bash
./scripts/setup-docker-ubuntu24.sh --skip-install
```

## 3. แก้ `.env` เอง

```bash
cp .env.docker.example .env
# แก้ .env ให้ตรงกับ Supabase และค่าอื่นๆ
```

ตัวอย่างที่ต้องตั้งค่า:

- `DATABASE_URL` – Supabase Direct URL (`db.<project-ref>.supabase.co:5432`)
- `JWT_SECRET` – คีย์สำหรับ JWT
- `CORS_ORIGIN` – เช่น `http://localhost:3000` หรือโดเมน frontend
- `NEXT_PUBLIC_API_URL` – เช่น `http://localhost:3001/api` หรือ URL ของ API ที่ frontend เรียก

## 4. Database (Supabase)

ก่อนรัน Docker ครั้งแรก ให้ sync schema กับ Supabase จากเครื่องที่ต่อ DB ได้ (มี `pnpm` + โปรเจกต์):

```bash
pnpm --filter @teachermon/database db:push
# หรือ migrate ถ้าใช้ migrations
pnpm --filter @teachermon/database db:seed   # ถ้าต้องการ seed
```

## 5. รัน Docker แบบใช้ Compose โดยตรง

```bash
docker compose -f docker-compose.ubuntu.yml up -d --build
```

- **Web**: http://localhost:3000  
- **API**: http://localhost:3001/api  
- **Swagger**: http://localhost:3001/api/docs  

## 6. Nginx (reverse proxy, ไม่บังคับ)

รัน API + Web + Nginx ให้เข้า through port 80:

```bash
# ใน .env ตั้ง NEXT_PUBLIC_API_URL=http://localhost/api แล้ว rebuild web
docker compose -f docker-compose.ubuntu.yml --profile nginx up -d --build
```

เข้าเว็บผ่าน http://localhost (port 80)

## 7. คำสั่งอื่นๆ

```bash
# ดู logs
docker compose -f docker-compose.ubuntu.yml logs -f

# หยุด
docker compose -f docker-compose.ubuntu.yml down

# Rebuild และขึ้นใหม่
docker compose -f docker-compose.ubuntu.yml up -d --build
```

## 8. ไฟล์ที่เกี่ยวกับ Docker (Ubuntu)

| ไฟล์ | การใช้ |
|------|--------|
| `docker-compose.ubuntu.yml` | Compose สำหรับ Ubuntu (API + Web, ไม่มี Postgres) |
| `docker/Dockerfile.api.ubuntu` | Build image API |
| `docker/Dockerfile.web.ubuntu` | Build image Web |
| `.env.docker.example` | ตัวอย่าง env สำหรับ Docker |
| `nginx/nginx.docker.conf` | Nginx config สำหรับ Docker (ใช้กับ profile `nginx`) |
| `scripts/setup-docker-ubuntu24.sh` | สคริปต์ติดตั้ง Docker + สร้าง .env + รัน Compose |

## 9. ปัญหาที่พบบ่อย

- **เชื่อม DB ไม่ได้**: ตรวจสอบ `DATABASE_URL` ใน `.env` ใช้ Direct connection ของ Supabase และ network ที่เครื่องรัน Docker ไปถึง Supabase ได้  
- **ฟรอนต์เรียก API ไม่ถึง**: ตรวจสอบ `NEXT_PUBLIC_API_URL` และ `CORS_ORIGIN` ว่าเป็น URL ที่เบราว์เซอร์ใช้จริง  
- **Docker permission denied**: ถ้าไม่ใช้ `sudo` ให้ `usermod -aG docker $USER` แล้ว log out / log in ใหม่
