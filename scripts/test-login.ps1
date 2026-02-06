# Test Login for All Roles
# ใช้สคริปต์นี้เพื่อทดสอบ Login สำหรับทุก role

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$Action = "all"
)

# Test Users for each role
$testUsers = @{
    ADMIN = @{
        email = "admin@teachermon.com"
        password = "password123"
        role = "ADMIN"
    }
    PROJECT_MANAGER = @{
        email = "manager@teachermon.com"
        password = "password123"
        role = "PROJECT_MANAGER"
    }
    TEACHER = @{
        email = "pimchanok@example.com"
        password = "password123"
        role = "TEACHER"
    }
    PRINCIPAL = @{
        email = "principal@teachermon.com"
        password = "password123"
        role = "PRINCIPAL"
    }
    MENTOR = @{
        email = "mentor@teachermon.com"
        password = "password123"
        role = "MENTOR"
    }
}

function Test-Login {
    param(
        [string]$Email,
        [string]$Password,
        [string]$Role,
        [string]$BaseUrl
    )

    Write-Host "`n🔐 Testing Login for $Role..." -ForegroundColor Cyan
    Write-Host "   Email: $Email" -ForegroundColor Gray

    try {
        $body = @{
            email = $Email
            password = $Password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $body -ContentType "application/json"
        
        if ($response.access_token) {
            Write-Host "   ✅ Login สำเร็จ!" -ForegroundColor Green
            Write-Host "   Token: $($response.access_token.Substring(0, 20))..." -ForegroundColor Gray
            Write-Host "   User Role: $($response.user.role)" -ForegroundColor Gray
            Write-Host "   User ID: $($response.user.id)" -ForegroundColor Gray
            if ($response.user.teacherId) {
                Write-Host "   Teacher ID: $($response.user.teacherId)" -ForegroundColor Gray
            }
            return @{
                success = $true
                token = $response.access_token
                user = $response.user
            }
        } else {
            Write-Host "   ❌ Login ไม่สำเร็จ: ไม่มี token" -ForegroundColor Red
            return @{ success = $false }
        }
    } catch {
        $errorMessage = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            $errorMessage = $_.ErrorDetails.Message | ConvertFrom-Json | Select-Object -ExpandProperty message
        }
        Write-Host "   ❌ Login ไม่สำเร็จ: $errorMessage" -ForegroundColor Red
        return @{ success = $false; error = $errorMessage }
    }
}

function Test-Profile {
    param(
        [string]$Token,
        [string]$BaseUrl
    )

    Write-Host "`n👤 Testing Profile API..." -ForegroundColor Cyan

    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        }

        $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/profile" -Method Get -Headers $headers
        
        Write-Host "   ✅ Profile สำเร็จ!" -ForegroundColor Green
        Write-Host "   Email: $($response.email)" -ForegroundColor Gray
        Write-Host "   Role: $($response.role)" -ForegroundColor Gray
        Write-Host "   Full Name: $($response.fullName)" -ForegroundColor Gray
        if ($response.teacher) {
            Write-Host "   Teacher: $($response.teacher.fullName)" -ForegroundColor Gray
            Write-Host "   School: $($response.teacher.school.schoolName)" -ForegroundColor Gray
        }
        return @{ success = $true; profile = $response }
    } catch {
        Write-Host "   ❌ Profile ไม่สำเร็จ: $($_.Exception.Message)" -ForegroundColor Red
        return @{ success = $false }
    }
}

# Main execution
Write-Host "`n🧪 Login Testing Script" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

$results = @{}

switch ($Action.ToLower()) {
    "all" {
        Write-Host "Testing all roles..." -ForegroundColor Yellow
        foreach ($role in $testUsers.Keys) {
            $user = $testUsers[$role]
            $result = Test-Login -Email $user.email -Password $user.password -Role $role -BaseUrl $BaseUrl
            
            if ($result.success) {
                # Test profile API
                Test-Profile -Token $result.token -BaseUrl $BaseUrl
            }
            
            $results[$role] = $result
            Start-Sleep -Milliseconds 500
        }
    }
    "admin" {
        $user = $testUsers.ADMIN
        $results.ADMIN = Test-Login -Email $user.email -Password $user.password -Role "ADMIN" -BaseUrl $BaseUrl
        if ($results.ADMIN.success) {
            Test-Profile -Token $results.ADMIN.token -BaseUrl $BaseUrl
        }
    }
    "manager" {
        $user = $testUsers.PROJECT_MANAGER
        $results.PROJECT_MANAGER = Test-Login -Email $user.email -Password $user.password -Role "PROJECT_MANAGER" -BaseUrl $BaseUrl
        if ($results.PROJECT_MANAGER.success) {
            Test-Profile -Token $results.PROJECT_MANAGER.token -BaseUrl $BaseUrl
        }
    }
    "teacher" {
        $user = $testUsers.TEACHER
        $results.TEACHER = Test-Login -Email $user.email -Password $user.password -Role "TEACHER" -BaseUrl $BaseUrl
        if ($results.TEACHER.success) {
            Test-Profile -Token $results.TEACHER.token -BaseUrl $BaseUrl
        }
    }
    "principal" {
        $user = $testUsers.PRINCIPAL
        $results.PRINCIPAL = Test-Login -Email $user.email -Password $user.password -Role "PRINCIPAL" -BaseUrl $BaseUrl
        if ($results.PRINCIPAL.success) {
            Test-Profile -Token $results.PRINCIPAL.token -BaseUrl $BaseUrl
        }
    }
    "mentor" {
        $user = $testUsers.MENTOR
        $results.MENTOR = Test-Login -Email $user.email -Password $user.password -Role "MENTOR" -BaseUrl $BaseUrl
        if ($results.MENTOR.success) {
            Test-Profile -Token $results.MENTOR.token -BaseUrl $BaseUrl
        }
    }
    default {
        Write-Host "❌ Action ไม่ถูกต้อง: $Action" -ForegroundColor Red
        Write-Host "ใช้: all, admin, manager, teacher, principal, mentor" -ForegroundColor Yellow
        exit 1
    }
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Gray
Write-Host "📊 Test Summary" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

$successCount = ($results.Values | Where-Object { $_.success }).Count
$totalCount = $results.Count

foreach ($role in $results.Keys) {
    $result = $results[$role]
    if ($result.success) {
        Write-Host "✅ $role : สำเร็จ" -ForegroundColor Green
    } else {
        Write-Host "❌ $role : ล้มเหลว" -ForegroundColor Red
        if ($result.error) {
            Write-Host "   Error: $($result.error)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nTotal: $successCount/$totalCount สำเร็จ" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
