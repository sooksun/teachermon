# Test AI PDPA Scanner
# ทดสอบ PDPA Scanner สำหรับตรวจสอบข้อมูลอ่อนไหว

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$Token = ""
)

Write-Host "`n🔍 Testing PDPA Scanner..." -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

# Helper function
function Invoke-Api {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        return Invoke-RestMethod @params
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
        Write-Host "   ❌ Error: $errorMessage" -ForegroundColor Red
        return $null
    }
}

# Get token if not provided
if (-not $Token) {
    Write-Host "`n🔐 Logging in..." -ForegroundColor Cyan
    $loginBody = @{
        email = "admin@teachermon.com"
        password = "password123"
    }
    $loginResponse = Invoke-Api -Method Post -Uri "$BaseUrl/api/auth/login" -Body $loginBody
    if ($loginResponse -and $loginResponse.access_token) {
        $Token = $loginResponse.access_token
        Write-Host "   ✅ Login successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Login failed" -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    "Authorization" = "Bearer $Token"
}

# Test Cases
$testCases = @(
    @{
        name = "Test 1: ชื่อนักเรียน (HIGH risk)"
        text = "นักเรียนชื่อ สมชาย ใจดี เรียนดีมาก"
        expectedRisk = "HIGH"
        expectedType = "STUDENT_FULL_NAME"
    },
    @{
        name = "Test 2: เลขบัตรประชาชน (HIGH risk)"
        text = "นักเรียนเลขบัตรประชาชน 1234567890123"
        expectedRisk = "HIGH"
        expectedType = "CITIZEN_ID"
    },
    @{
        name = "Test 3: เบอร์โทรศัพท์ (MEDIUM risk)"
        text = "ติดต่อได้ที่เบอร์โทร 081-234-5678"
        expectedRisk = "MEDIUM"
        expectedType = "PHONE_NUMBER"
    },
    @{
        name = "Test 4: ที่อยู่ (MEDIUM risk)"
        text = "บ้านเลขที่ 123/45"
        expectedRisk = "MEDIUM"
        expectedType = "HOME_ADDRESS"
    },
    @{
        name = "Test 5: ข้อความปลอดภัย (SAFE)"
        text = "นักเรียน ก. มีพัฒนาการดีขึ้นมาก"
        expectedRisk = "SAFE"
        expectedType = $null
    },
    @{
        name = "Test 6: หลาย violations"
        text = "นักเรียนชื่อ สมชาย ใจดี เลขบัตรประชาชน 1234567890123 เบอร์โทร 081-234-5678"
        expectedRisk = "HIGH"
        expectedType = "STUDENT_FULL_NAME"
    }
)

$results = @()

foreach ($testCase in $testCases) {
    Write-Host "`n📝 $($testCase.name)" -ForegroundColor Cyan
    Write-Host "   Text: $($testCase.text)" -ForegroundColor Gray

    $body = @{
        text = $testCase.text
        sourceId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    }

    $response = Invoke-Api -Method Post -Uri "$BaseUrl/api/journals/ai/check-pdpa" -Body $body -Headers $headers

    if ($response) {
        $riskLevel = $response.riskLevel
        $isSafe = $response.isSafe
        $violations = $response.violations

        Write-Host "   Risk Level: $riskLevel" -ForegroundColor $(if ($riskLevel -eq $testCase.expectedRisk) { "Green" } else { "Yellow" })
        Write-Host "   Is Safe: $isSafe" -ForegroundColor Gray
        Write-Host "   Violations: $($violations.Count)" -ForegroundColor Gray

        if ($violations.Count -gt 0) {
            foreach ($violation in $violations) {
                Write-Host "     - $($violation.type): $($violation.matchedText)" -ForegroundColor Yellow
                Write-Host "       Suggestion: $($violation.suggestion)" -ForegroundColor Gray
            }
        }

        # Check expectations
        $passed = $true
        if ($riskLevel -ne $testCase.expectedRisk) {
            $passed = $false
            Write-Host "   ⚠️  Expected risk: $($testCase.expectedRisk), got: $riskLevel" -ForegroundColor Yellow
        }

        if ($testCase.expectedType -and $violations.Count -gt 0) {
            $foundType = $violations | Where-Object { $_.type -eq $testCase.expectedType }
            if (-not $foundType) {
                $passed = $false
                Write-Host "   ⚠️  Expected violation type: $($testCase.expectedType), not found" -ForegroundColor Yellow
            }
        }

        if ($passed) {
            Write-Host "   ✅ Test passed" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Test partially passed" -ForegroundColor Yellow
        }

        $results += @{
            name = $testCase.name
            passed = $passed
            riskLevel = $riskLevel
            violations = $violations.Count
        }
    } else {
        Write-Host "   ❌ Test failed (no response)" -ForegroundColor Red
        $results += @{
            name = $testCase.name
            passed = $false
            riskLevel = "ERROR"
            violations = 0
        }
    }

    Start-Sleep -Milliseconds 500
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Gray
Write-Host "📊 Summary" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

$passedCount = ($results | Where-Object { $_.passed }).Count
$totalCount = $results.Count

foreach ($result in $results) {
    $status = if ($result.passed) { "✅" } else { "⚠️" }
    Write-Host "$status $($result.name)" -ForegroundColor $(if ($result.passed) { "Green" } else { "Yellow" })
    Write-Host "   Risk: $($result.riskLevel), Violations: $($result.violations)" -ForegroundColor Gray
}

Write-Host "`nTotal: $passedCount/$totalCount tests passed" -ForegroundColor $(if ($passedCount -eq $totalCount) { "Green" } else { "Yellow" })

Write-Host "`n💡 หมายเหตุ:" -ForegroundColor Cyan
Write-Host "   - ถ้า GEMINI_API_KEY ไม่ได้ตั้งค่า ระบบจะใช้ mock responses" -ForegroundColor Gray
Write-Host "   - PDPA Scanner ใช้ pattern matching ไม่ได้ใช้ AI" -ForegroundColor Gray
