# Test CRUD for Teachers, Schools, Journals
# ใช้สคริปต์นี้เพื่อทดสอบ CRUD operations

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$Token = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "⚠️  ต้องมี JWT Token" -ForegroundColor Yellow
    Write-Host "ตัวอย่าง: " -NoNewline; Write-Host ".\scripts\test-crud.ps1 -Token `$token" -ForegroundColor Cyan
    Write-Host "รับ Token: " -NoNewline; Write-Host ".\scripts\test-login.ps1 -Action admin" -ForegroundColor Gray
    Write-Host "หรือ: " -NoNewline
    Write-Host "`$body = @{ email='admin@teachermon.com'; password='password123' } | ConvertTo-Json; `$r = Invoke-RestMethod -Uri '$BaseUrl/api/auth/login' -Method Post -Body `$body -ContentType 'application/json'; `$token = `$r.access_token" -ForegroundColor Gray
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

$results = @{ Schools = @{}; Teachers = @{}; Journals = @{} }
$created = @{ SchoolId = $null; SchoolIdTemp = $null; TeacherId = $null; JournalId = $null }

function Invoke-Api {
    param([string]$Method, [string]$Path, [object]$Body = $null)
    $uri = "$BaseUrl$Path"
    $params = @{ Uri = $uri; Method = $Method; Headers = $headers }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
    try {
        return Invoke-RestMethod @params
    } catch {
        $err = $_.ErrorDetails.Message
        if ($err) { try { $o = $err | ConvertFrom-Json; $err = $o.message } catch {} }
        throw $err
    }
}

# ========== LOGIN CHECK ==========
Write-Host "`n🧪 CRUD Test (Teachers, Schools, Journals)" -ForegroundColor Yellow
Write-Host ("=" * 55) -ForegroundColor Gray
try {
    $prof = Invoke-Api -Method Get -Path "/api/auth/profile"
    Write-Host "✅ Login OK — $($prof.email) [$($prof.role)]" -ForegroundColor Green
} catch {
    Write-Host "❌ Invalid token or API unreachable: $_" -ForegroundColor Red
    exit 1
}

# ========== SCHOOLS CRUD ==========
Write-Host "`n📁 SCHOOLS CRUD" -ForegroundColor Cyan
Write-Host ("-" * 40) -ForegroundColor Gray

try {
    $list = Invoke-Api -Method Get -Path "/api/schools?limit=5"
    $arr = if ($list.data) { $list.data } elseif ($list -is [array]) { $list } else { @($list) }
    Write-Host "  GET /schools — ✅ $($arr.Count) items"

    $schoolPayload = @{
        schoolName       = "โรงเรียนทดสอบ CRUD"
        province         = "กรุงเทพฯ"
        region           = "CENTRAL"
        schoolSize       = "SMALL"
        areaType         = "REMOTE"
        studentTotal     = 100
        directorName     = "ผู้อำนวยการทดสอบ"
        qualitySchoolFlag = $false
        communityContext = "บริบททดสอบ"
    }
    $newSchool = Invoke-Api -Method Post -Path "/api/schools" -Body $schoolPayload
    $created.SchoolId = $newSchool.id
    Write-Host "  POST /schools — ✅ Created $($newSchool.id)"

    $one = Invoke-Api -Method Get -Path "/api/schools/$($newSchool.id)"
    Write-Host "  GET /schools/:id — ✅ $($one.schoolName)"

    $updatePayload = @{ directorName = "ผู้อำนวยการ (แก้ไขแล้ว)" }
    $updated = Invoke-Api -Method Put -Path "/api/schools/$($newSchool.id)" -Body $updatePayload
    Write-Host "  PUT /schools/:id — ✅ Updated"

    $results.Schools = @{ Create = $true; Read = $true; Update = $true; Delete = $false }
} catch {
    Write-Host "  ❌ Schools: $_" -ForegroundColor Red
    $results.Schools = @{ Create = $false; Read = $false; Update = $false; Delete = $false }
}

# ========== TEACHERS CRUD ==========
Write-Host "`n👩‍🏫 TEACHERS CRUD" -ForegroundColor Cyan
Write-Host ("-" * 40) -ForegroundColor Gray

$schoolId = $created.SchoolId
if (-not $schoolId) {
    try {
        $list = Invoke-Api -Method Get -Path "/api/schools?limit=1"
        $arr = if ($list.data) { $list.data } elseif ($list -is [array]) { $list } else { @($list) }
        $schoolId = $arr[0].id
    } catch {}
}

if ($schoolId) {
    try {
        $list = Invoke-Api -Method Get -Path "/api/teachers?limit=5"
        $arr = if ($list.data) { $list.data } elseif ($list -is [array]) { $list } else { @($list) }
        Write-Host "  GET /teachers — ✅ $($arr.Count) items"

        $cid = "1" + (-join ((1..12) | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 }))
        $teacherPayload = @{
            citizenId       = $cid
            fullName        = "ครูทดสอบ CRUD"
            gender          = "MALE"
            birthDate       = "1995-01-15"
            cohort          = 99
            appointmentDate = "2025-01-01"
            position        = "ครูผู้ช่วย"
            major           = "คณิตศาสตร์"
            schoolId        = $schoolId
            status          = "ACTIVE"
            email           = "crud-test-$([guid]::NewGuid().ToString('N').Substring(0,8))@test.local"
            phone           = "081-111-2233"
        }
        $newTeacher = Invoke-Api -Method Post -Path "/api/teachers" -Body $teacherPayload
        $created.TeacherId = $newTeacher.id
        Write-Host "  POST /teachers — ✅ Created $($newTeacher.id)"

        $one = Invoke-Api -Method Get -Path "/api/teachers/$($newTeacher.id)"
        Write-Host "  GET /teachers/:id — ✅ $($one.fullName)"

        $teacherUpdate = @{ position = "ครูประจำการ"; phone = "082-999-8877" }
        $utu = Invoke-Api -Method Put -Path "/api/teachers/$($newTeacher.id)" -Body $teacherUpdate
        Write-Host "  PUT /teachers/:id — ✅ Updated"

        $results.Teachers = @{ Create = $true; Read = $true; Update = $true; Delete = $false }
    } catch {
        Write-Host "  ❌ Teachers: $_" -ForegroundColor Red
        $results.Teachers = @{ Create = $false; Read = $false; Update = $false; Delete = $false }
    }
} else {
    Write-Host "  ⚠️ Skip Teachers (no school)" -ForegroundColor Yellow
    $results.Teachers = @{ Create = $false; Read = $false; Update = $false; Delete = $false }
}

# ========== JOURNALS CRUD ==========
Write-Host "`n📓 JOURNALS CRUD" -ForegroundColor Cyan
Write-Host ("-" * 40) -ForegroundColor Gray

$teacherId = $created.TeacherId
if (-not $teacherId) {
    try {
        $list = Invoke-Api -Method Get -Path "/api/teachers?limit=1"
        $arr = if ($list.data) { $list.data } elseif ($list -is [array]) { $list } else { @($list) }
        $teacherId = $arr[0].id
    } catch {}
}

if ($teacherId) {
    try {
        $list = Invoke-Api -Method Get -Path "/api/journals?teacherId=$teacherId"
        $arr = if ($list.data) { $list.data } elseif ($list -is [array]) { $list } else { @($list) }
        Write-Host "  GET /journals — ✅ $($arr.Count) items"

        $month = "2030-" + (Get-Date -Format "MM")
        $journalPayload = @{
            teacher        = @{ connect = @{ id = $teacherId } }
            month          = $month
            reflectionText = "บันทึกสะท้อนคิดจากการทดสอบ CRUD — " + (Get-Date -Format "yyyy-MM-dd HH:mm")
            successStory   = "ผลสำเร็จจากการทดสอบ"
            difficulty     = "อุปสรรคจากการทดสอบ"
            supportRequest = "ความช่วยเหลือที่ต้องการ"
        }
        $newJournal = Invoke-Api -Method Post -Path "/api/journals" -Body $journalPayload
        $created.JournalId = $newJournal.id
        Write-Host "  POST /journals — ✅ Created $($newJournal.id)"

        $one = Invoke-Api -Method Get -Path "/api/journals/$($newJournal.id)"
        Write-Host "  GET /journals/:id — ✅ month=$($one.month)"

        $journalUpdate = @{ reflectionText = "บันทึกสะท้อนคิด (แก้ไขแล้ว)"; successStory = "อัพเดต success" }
        Invoke-Api -Method Put -Path "/api/journals/$($newJournal.id)" -Body $journalUpdate | Out-Null
        Write-Host "  PUT /journals/:id — ✅ Updated"

        Invoke-Api -Method Delete -Path "/api/journals/$($newJournal.id)" | Out-Null
        Write-Host "  DELETE /journals/:id — ✅ Deleted"

        $results.Journals = @{ Create = $true; Read = $true; Update = $true; Delete = $true }
    } catch {
        Write-Host "  ❌ Journals: $_" -ForegroundColor Red
        $results.Journals = @{ Create = $false; Read = $false; Update = $false; Delete = $false }
    }
} else {
    Write-Host "  ⚠️ Skip Journals (no teacher)" -ForegroundColor Yellow
    $results.Journals = @{ Create = $false; Read = $false; Update = $false; Delete = $false }
}

# ========== CLEANUP ==========
Write-Host "`n🧹 CLEANUP" -ForegroundColor Cyan
Write-Host ("-" * 40) -ForegroundColor Gray

if ($created.TeacherId) {
    try {
        Invoke-Api -Method Delete -Path "/api/teachers/$($created.TeacherId)" | Out-Null
        Write-Host "  DELETE /teachers/:id — ✅ Deleted test teacher"
        $results.Teachers.Delete = $true
    } catch {
        Write-Host "  DELETE /teachers — ⚠️ $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
if ($created.SchoolId) {
    try {
        Invoke-Api -Method Delete -Path "/api/schools/$($created.SchoolId)" | Out-Null
        Write-Host "  DELETE /schools/:id — ✅ Deleted test school"
        $results.Schools.Delete = $true
    } catch {
        Write-Host "  DELETE /schools — ⚠️ $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# ========== SUMMARY ==========
Write-Host "`n" + ("=" * 55) -ForegroundColor Gray
Write-Host "📊 CRUD Summary" -ForegroundColor Yellow
Write-Host ("=" * 55) -ForegroundColor Gray

foreach ($resource in @("Schools", "Teachers", "Journals")) {
    $r = $results[$resource]
    $c = if ($r.Create) { "✅" } else { "❌" }
    $read = if ($r.Read) { "✅" } else { "❌" }
    $u = if ($r.Update) { "✅" } else { "❌" }
    $d = if ($r.Delete) { "✅" } else { "❌" }
    Write-Host "  $resource : Create $c | Read $read | Update $u | Delete $d"
}

$total = 0
$pass = 0
foreach ($r in $results.Values) {
    foreach ($k in @("Create","Read","Update","Delete")) {
        $total++
        if ($r[$k]) { $pass++ }
    }
}
Write-Host "`nTotal: $pass/$total operations passed" -ForegroundColor $(if ($pass -eq $total) { "Green" } else { "Yellow" })
