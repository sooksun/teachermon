# Setup Database Script for TeacherMon
# วิธีใช้: .\scripts\setup-db.ps1

Write-Host "🚀 TeacherMon - Database Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# ตรวจสอบว่า PostgreSQL ทำงานอยู่หรือไม่
Write-Host "📋 Step 1: ตรวจสอบ PostgreSQL..." -ForegroundColor Yellow

$pgReady = $false
try {
    $env:PGPASSWORD = "postgres"
    $result = psql -U postgres -h localhost -p 5432 -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pgReady = $true
        Write-Host "✅ PostgreSQL พร้อมใช้งาน`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  PostgreSQL ยังไม่พร้อม`n" -ForegroundColor Red
}

if (-not $pgReady) {
    Write-Host "❌ กรุณาเริ่ม PostgreSQL ก่อน:`n" -ForegroundColor Red
    Write-Host "   ทางเลือก 1: เปิด Docker Desktop แล้วรัน 'docker-compose up -d postgres'" -ForegroundColor White
    Write-Host "   ทางเลือก 2: ติดตั้ง PostgreSQL standalone จาก https://www.postgresql.org/download/windows/`n" -ForegroundColor White
    exit 1
}

# สร้าง database (ถ้ายังไม่มี)
Write-Host "📋 Step 2: สร้าง database 'teachermon'..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "postgres"
    $checkDb = psql -U postgres -h localhost -p 5432 -lqt 2>&1 | Select-String -Pattern "teachermon"
    
    if (-not $checkDb) {
        $createResult = psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE teachermon;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ สร้าง database 'teachermon' สำเร็จ`n" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $createResult`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ Database 'teachermon' มีอยู่แล้ว`n" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ไม่สามารถสร้าง database: $_`n" -ForegroundColor Red
}

# Generate Prisma Client
Write-Host "📋 Step 3: Generate Prisma Client..." -ForegroundColor Yellow
Set-Location packages/database
pnpm db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Generate Prisma Client สำเร็จ`n" -ForegroundColor Green
} else {
    Write-Host "❌ Generate Prisma Client ล้มเหลว`n" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

# Run Migrations
Write-Host "📋 Step 4: Run Database Migrations..." -ForegroundColor Yellow
pnpm db:migrate:dev
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations สำเร็จ`n" -ForegroundColor Green
} else {
    Write-Host "❌ Migrations ล้มเหลว`n" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

# Seed Data
Write-Host "📋 Step 5: Seed ข้อมูลตัวอย่าง..." -ForegroundColor Yellow
pnpm db:seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Seed ข้อมูลสำเร็จ`n" -ForegroundColor Green
} else {
    Write-Host "❌ Seed ข้อมูลล้มเหลว`n" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Set-Location ../..

Write-Host "`n🎉 Database Setup เสร็จสมบูรณ์!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "📌 ข้อมูลการ Login (Demo):" -ForegroundColor Yellow
Write-Host "   Email: admin@example.com" -ForegroundColor White
Write-Host "   Password: admin123`n" -ForegroundColor White
Write-Host "🚀 รันระบบด้วยคำสั่ง: pnpm dev" -ForegroundColor Cyan
Write-Host "   - API: http://localhost:3001" -ForegroundColor White
Write-Host "   - Web: http://localhost:3000" -ForegroundColor White
Write-Host "   - Swagger: http://localhost:3001/api`n" -ForegroundColor White
