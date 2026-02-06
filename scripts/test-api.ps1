# TeacherMon - API Testing Script
# วิธีใช้: .\scripts\test-api.ps1

Write-Host "🧪 TeacherMon - API Testing" -ForegroundColor Cyan
Write-Host "===========================`n" -ForegroundColor Cyan

# ตรวจสอบว่า API รันอยู่
Write-Host "📋 Step 1: ตรวจสอบ API..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "✅ API รันอยู่: $($healthCheck | ConvertTo-Json)`n" -ForegroundColor Green
} catch {
    Write-Host "❌ API ไม่ตอบสนอง กรุณารัน 'pnpm dev' ก่อน`n" -ForegroundColor Red
    exit 1
}

# Test 1: Login
Write-Host "📋 Test 1: Authentication (Login)..." -ForegroundColor Yellow

$testUsers = @(
    @{email="admin@example.com"; password="admin123"; role="Admin"},
    @{email="manager@example.com"; password="manager123"; role="Manager"},
    @{email="mentor@example.com"; password="mentor123"; role="Mentor"},
    @{email="teacher1@example.com"; password="teacher123"; role="Teacher"}
)

$tokens = @{}
$passCount = 0
$failCount = 0

foreach ($user in $testUsers) {
    try {
        $body = @{
            email = $user.email
            password = $user.password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
            -Method Post `
            -Headers @{"Content-Type"="application/json"} `
            -Body $body

        $tokens[$user.role] = $response.access_token
        Write-Host "  ✅ $($user.role) login สำเร็จ" -ForegroundColor Green
        $passCount++
    } catch {
        Write-Host "  ❌ $($user.role) login ล้มเหลว: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n  สรุป: ผ่าน $passCount / ไม่ผ่าน $failCount`n" -ForegroundColor Cyan

# Test 2: Teachers API (CRUD)
Write-Host "📋 Test 2: Teachers CRUD..." -ForegroundColor Yellow

if ($tokens["Admin"]) {
    $adminToken = $tokens["Admin"]
    
    # GET all teachers
    try {
        $teachers = Invoke-RestMethod -Uri "http://localhost:3001/api/teachers" `
            -Method Get `
            -Headers @{"Authorization"="Bearer $adminToken"}
        
        Write-Host "  ✅ GET /teachers: พบครู $($teachers.data.Count) คน" -ForegroundColor Green
        $passCount++
    } catch {
        Write-Host "  ❌ GET /teachers ล้มเหลว" -ForegroundColor Red
        $failCount++
    }

    # GET teacher by ID (ใช้คนแรก)
    if ($teachers.data.Count -gt 0) {
        $teacherId = $teachers.data[0].id
        try {
            $teacher = Invoke-RestMethod -Uri "http://localhost:3001/api/teachers/$teacherId" `
                -Method Get `
                -Headers @{"Authorization"="Bearer $adminToken"}
            
            Write-Host "  ✅ GET /teachers/$teacherId สำเร็จ" -ForegroundColor Green
            $passCount++
        } catch {
            Write-Host "  ❌ GET /teachers/$teacherId ล้มเหลว" -ForegroundColor Red
            $failCount++
        }
    }
}

Write-Host "`n  สรุป: ผ่าน $passCount / ไม่ผ่าน $failCount`n" -ForegroundColor Cyan

# Test 3: Schools API
Write-Host "📋 Test 3: Schools API..." -ForegroundColor Yellow

if ($tokens["Admin"]) {
    try {
        $schools = Invoke-RestMethod -Uri "http://localhost:3001/api/schools" `
            -Method Get `
            -Headers @{"Authorization"="Bearer $adminToken"}
        
        Write-Host "  ✅ GET /schools: พบโรงเรียน $($schools.Count) แห่ง" -ForegroundColor Green
        $passCount++
    } catch {
        Write-Host "  ❌ GET /schools ล้มเหลว" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n  สรุป: ผ่าน $passCount / ไม่ผ่าน $failCount`n" -ForegroundColor Cyan

# Test 4: Dashboard API
Write-Host "📋 Test 4: Dashboard API..." -ForegroundColor Yellow

if ($tokens["Admin"]) {
    try {
        $stats = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/stats" `
            -Method Get `
            -Headers @{"Authorization"="Bearer $adminToken"}
        
        Write-Host "  ✅ GET /dashboard/stats สำเร็จ" -ForegroundColor Green
        Write-Host "     - ครูทั้งหมด: $($stats.summary.totalTeachers)" -ForegroundColor White
        Write-Host "     - โรงเรียน: $($stats.summary.totalSchools)" -ForegroundColor White
        $passCount++
    } catch {
        Write-Host "  ❌ GET /dashboard/stats ล้มเหลว" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n  สรุป: ผ่าน $passCount / ไม่ผ่าน $failCount`n" -ForegroundColor Cyan

# Test 5: AI Features (ถ้าเปิดใช้งาน)
Write-Host "📋 Test 5: AI Features..." -ForegroundColor Yellow

if ($tokens["Admin"]) {
    # Test PDPA Scanner
    try {
        $body = @{
            text = "วันนี้สอนนักเรียน ก. และ ข. เรื่องการบวกเลข"
            sourceType = "journal"
            sourceId = "test"
        } | ConvertTo-Json

        $pdpaResult = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/pdpa/check" `
            -Method Post `
            -Headers @{
                "Authorization"="Bearer $adminToken"
                "Content-Type"="application/json"
            } `
            -Body $body
        
        Write-Host "  ✅ PDPA Scanner: $($pdpaResult.riskLevel)" -ForegroundColor Green
        $passCount++
    } catch {
        Write-Host "  ⚠️  PDPA Scanner: ไม่พร้อมใช้งาน (ตรวจสอบ AI_ENABLED)" -ForegroundColor Yellow
    }
}

Write-Host "`n  สรุป: ผ่าน $passCount / ไม่ผ่าน $failCount`n" -ForegroundColor Cyan

# Summary
Write-Host "`n🎉 สรุปผลการทดสอบ" -ForegroundColor Cyan
Write-Host "==================`n" -ForegroundColor Cyan
Write-Host "  ✅ ผ่าน: $passCount tests" -ForegroundColor Green
Write-Host "  ❌ ไม่ผ่าน: $failCount tests" -ForegroundColor Red

$totalTests = $passCount + $failCount
if ($totalTests -gt 0) {
    $passRate = [math]::Round(($passCount / $totalTests) * 100, 2)
    Write-Host "  📊 Pass Rate: $passRate%`n" -ForegroundColor Cyan
}

if ($failCount -eq 0) {
    Write-Host "🎉 ทุก tests ผ่านหมด!" -ForegroundColor Green
} else {
    Write-Host "⚠️  มี $failCount tests ที่ล้มเหลว กรุณาตรวจสอบ" -ForegroundColor Yellow
}

Write-Host "`n💾 Token สำหรับทดสอบ Manual:" -ForegroundColor Cyan
foreach ($role in $tokens.Keys) {
    Write-Host "  $role Token: $($tokens[$role].Substring(0, 30))..." -ForegroundColor White
}

Write-Host "`n📚 ดูรายละเอียดเพิ่มเติม: TESTING_GUIDE.md`n" -ForegroundColor Cyan
