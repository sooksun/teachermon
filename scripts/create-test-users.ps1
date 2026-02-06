# Create Test Users for All Roles
# ใช้สคริปต์นี้เพื่อสร้าง test users สำหรับทุก role

param(
    [string]$BaseUrl = "http://localhost:3001"
)

Write-Host "`n👥 Creating Test Users..." -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

$testUsers = @(
    @{
        email = "admin@teachermon.com"
        password = "password123"
        role = "ADMIN"
        fullName = "ผู้ดูแลระบบ"
    },
    @{
        email = "manager@teachermon.com"
        password = "password123"
        role = "PROJECT_MANAGER"
        fullName = "ผู้จัดการโครงการ"
    },
    @{
        email = "principal@teachermon.com"
        password = "password123"
        role = "PRINCIPAL"
        fullName = "ผู้อำนวยการโรงเรียน"
    },
    @{
        email = "mentor@teachermon.com"
        password = "password123"
        role = "MENTOR"
        fullName = "พี่เลี้ยงครู"
    }
)

$results = @()

foreach ($user in $testUsers) {
    Write-Host "`n📝 Creating $($user.role)..." -ForegroundColor Cyan
    Write-Host "   Email: $($user.email)" -ForegroundColor Gray

    try {
        $body = $user | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Body $body -ContentType "application/json"
        
        Write-Host "   ✅ สร้างสำเร็จ!" -ForegroundColor Green
        Write-Host "   User ID: $($response.id)" -ForegroundColor Gray
        Write-Host "   Role: $($response.role)" -ForegroundColor Gray
        
        $results += @{
            role = $user.role
            email = $user.email
            success = $true
        }
    } catch {
        $errorMessage = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            try {
                $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorMessage = $errorJson.message
            } catch {
                $errorMessage = $_.ErrorDetails.Message
            }
        }
        
        if ($errorMessage -like "*already registered*" -or $errorMessage -like "*already exists*") {
            Write-Host "   ⚠️  User มีอยู่แล้ว (ข้าม)" -ForegroundColor Yellow
            $results += @{
                role = $user.role
                email = $user.email
                success = $true
                skipped = $true
            }
        } else {
            Write-Host "   ❌ สร้างไม่สำเร็จ: $errorMessage" -ForegroundColor Red
            $results += @{
                role = $user.role
                email = $user.email
                success = $false
                error = $errorMessage
            }
        }
    }
    
    Start-Sleep -Milliseconds 300
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Gray
Write-Host "📊 Summary" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

$successCount = ($results | Where-Object { $_.success }).Count
$skippedCount = ($results | Where-Object { $_.skipped }).Count
$failedCount = ($results | Where-Object { -not $_.success }).Count

foreach ($result in $results) {
    if ($result.skipped) {
        Write-Host "⚠️  $($result.role) : มีอยู่แล้ว" -ForegroundColor Yellow
    } elseif ($result.success) {
        Write-Host "✅ $($result.role) : สร้างสำเร็จ" -ForegroundColor Green
    } else {
        Write-Host "❌ $($result.role) : ล้มเหลว" -ForegroundColor Red
        Write-Host "   Error: $($result.error)" -ForegroundColor Yellow
    }
}

Write-Host "`nTotal: $successCount สร้างสำเร็จ, $skippedCount มีอยู่แล้ว, $failedCount ล้มเหลว" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Yellow" })

Write-Host "`n💡 หมายเหตุ: TEACHER users จะถูกสร้างจาก seed data" -ForegroundColor Cyan
Write-Host "   ใช้ email ของ teacher จาก database" -ForegroundColor Gray
