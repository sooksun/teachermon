# TeacherMon - Data Import Script
# วิธีใช้: .\scripts\import-data.ps1 -Type schools -File "path/to/schools.csv"
# วิธีใช้: .\scripts\import-data.ps1 -Type teachers -File "path/to/teachers.csv"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("schools", "teachers")]
    [string]$Type,
    
    [Parameter(Mandatory=$true)]
    [string]$File,
    
    [string]$ApiUrl = "http://localhost:3001/api",
    
    [string]$Email = "admin@example.com",
    
    [string]$Password = "admin123"
)

Write-Host "📦 TeacherMon - Data Import" -ForegroundColor Cyan
Write-Host "==========================`n" -ForegroundColor Cyan

# ตรวจสอบว่าไฟล์มีอยู่
if (-not (Test-Path $File)) {
    Write-Host "❌ ไม่พบไฟล์: $File`n" -ForegroundColor Red
    exit 1
}

Write-Host "📋 กำลัง import: $Type" -ForegroundColor Yellow
Write-Host "📄 จากไฟล์: $File`n" -ForegroundColor Yellow

# Login เพื่อเอา token
Write-Host "🔐 กำลัง login..." -ForegroundColor Yellow
try {
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/auth/login" `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body

    $token = $loginResponse.access_token
    Write-Host "✅ Login สำเร็จ`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Login ล้มเหลว: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# อ่านข้อมูลจาก CSV
Write-Host "📖 กำลังอ่านข้อมูลจาก CSV..." -ForegroundColor Yellow
try {
    $data = Import-Csv -Path $File -Encoding UTF8
    Write-Host "✅ พบข้อมูล $($data.Count) รายการ`n" -ForegroundColor Green
} catch {
    Write-Host "❌ อ่านไฟล์ล้มเหลว: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Import ทีละรายการ
$successCount = 0
$failCount = 0
$skipCount = 0

Write-Host "🚀 กำลัง import..." -ForegroundColor Yellow

foreach ($item in $data) {
    $itemName = if ($Type -eq "schools") { $item.schoolName } else { $item.fullName }
    
    try {
        # สร้าง body ตาม type
        if ($Type -eq "schools") {
            $body = @{
                schoolName = $item.schoolName
                province = $item.province
                district = $item.district
                region = $item.region
                area = $item.area
                schoolType = $item.schoolType
            } | ConvertTo-Json
            
            $endpoint = "$ApiUrl/schools"
        } elseif ($Type -eq "teachers") {
            # ต้องหา schoolId ก่อน
            try {
                $schools = Invoke-RestMethod -Uri "$ApiUrl/schools" `
                    -Method Get `
                    -Headers @{"Authorization"="Bearer $token"}
                
                $school = $schools | Where-Object { $_.schoolName -eq $item.schoolName } | Select-Object -First 1
                
                if (-not $school) {
                    Write-Host "  ⚠️  ข้าม: $itemName (ไม่พบโรงเรียน $($item.schoolName))" -ForegroundColor Yellow
                    $skipCount++
                    continue
                }
                
                $body = @{
                    fullName = $item.fullName
                    personalId = $item.personalId
                    schoolId = $school.id
                    subject = $item.subject
                    cohort = [int]$item.cohort
                    status = $item.status
                } | ConvertTo-Json
                
                $endpoint = "$ApiUrl/teachers"
            } catch {
                Write-Host "  ⚠️  ข้าม: $itemName (ไม่พบโรงเรียน)" -ForegroundColor Yellow
                $skipCount++
                continue
            }
        }
        
        # ส่ง API request
        $response = Invoke-RestMethod -Uri $endpoint `
            -Method Post `
            -Headers @{
                "Authorization"="Bearer $token"
                "Content-Type"="application/json"
            } `
            -Body $body
        
        Write-Host "  ✅ $itemName" -ForegroundColor Green
        $successCount++
        
    } catch {
        Write-Host "  ❌ ล้มเหลว: $itemName - $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    # หน่วงเวลาเล็กน้อยเพื่อไม่ให้ถล่ม API
    Start-Sleep -Milliseconds 100
}

# สรุปผล
Write-Host "`n📊 สรุปผลการ Import" -ForegroundColor Cyan
Write-Host "==================`n" -ForegroundColor Cyan
Write-Host "  ✅ สำเร็จ: $successCount รายการ" -ForegroundColor Green
Write-Host "  ❌ ล้มเหลว: $failCount รายการ" -ForegroundColor Red
Write-Host "  ⚠️  ข้าม: $skipCount รายการ" -ForegroundColor Yellow

$totalProcessed = $successCount + $failCount + $skipCount
Write-Host "  📦 รวม: $totalProcessed / $($data.Count) รายการ`n" -ForegroundColor Cyan

if ($failCount -eq 0 -and $skipCount -eq 0) {
    Write-Host "🎉 Import เสร็จสมบูรณ์!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Import เสร็จแล้ว แต่มีบางรายการที่ล้มเหลวหรือถูกข้าม" -ForegroundColor Yellow
}

# ตรวจสอบจำนวนในฐานข้อมูล
Write-Host "`n🔍 กำลังตรวจสอบจำนวนในฐานข้อมูล..." -ForegroundColor Yellow
try {
    if ($Type -eq "schools") {
        $result = Invoke-RestMethod -Uri "$ApiUrl/schools" `
            -Method Get `
            -Headers @{"Authorization"="Bearer $token"}
        
        Write-Host "✅ พบโรงเรียนในระบบ: $($result.Count) แห่ง`n" -ForegroundColor Green
    } elseif ($Type -eq "teachers") {
        $result = Invoke-RestMethod -Uri "$ApiUrl/teachers" `
            -Method Get `
            -Headers @{"Authorization"="Bearer $token"}
        
        Write-Host "✅ พบครูในระบบ: $($result.data.Count) คน`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  ไม่สามารถตรวจสอบจำนวนได้`n" -ForegroundColor Yellow
}

Write-Host "📚 ดูรายละเอียดเพิ่มเติม: TESTING_GUIDE.md`n" -ForegroundColor Cyan
