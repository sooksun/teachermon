# Test AI Evidence Upload
# ทดสอบ Evidence Upload พร้อม AI Analysis

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$Token = "",
    [string]$TeacherId = ""
)

Write-Host "`n🤖 Testing AI Evidence Upload..." -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

# Helper function for JSON requests
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

# Helper function for file upload (multipart/form-data)
function Invoke-FileUpload {
    param(
        [string]$Uri,
        [string]$FilePath,
        [hashtable]$FormFields = @{},
        [hashtable]$Headers = @{}
    )
    
    # Try using curl first (if available)
    $curlPath = Get-Command curl -ErrorAction SilentlyContinue
    if ($curlPath) {
        try {
            Write-Host "   Using curl for file upload..." -ForegroundColor Gray
            $authHeader = $Headers["Authorization"]
            
            # Build curl command
            $curlArgs = @(
                "-X", "POST",
                "-H", "Authorization: $authHeader",
                "-F", "file=@$FilePath"
            )
            
            foreach ($key in $FormFields.Keys) {
                $value = $FormFields[$key]
                if ($value -is [array]) {
                    foreach ($item in $value) {
                        $curlArgs += "-F", "$key=$item"
                    }
                } else {
                    $curlArgs += "-F", "$key=$value"
                }
            }
            
            $curlArgs += $Uri
            
            $response = & curl @curlArgs 2>&1
            if ($LASTEXITCODE -eq 0) {
                return $response | ConvertFrom-Json
            } else {
                Write-Host "   ❌ Curl failed: $response" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ⚠️  Curl failed, trying .NET method..." -ForegroundColor Yellow
        }
    }
    
    # Fallback to .NET HttpClient
    try {
        Write-Host "   Using .NET HttpClient for file upload..." -ForegroundColor Gray
        Add-Type -AssemblyName System.Net.Http
        
        $httpClient = New-Object System.Net.Http.HttpClient
        $multipartContent = New-Object System.Net.Http.MultipartFormDataContent
        
        # Add file
        $fileStream = [System.IO.File]::OpenRead($FilePath)
        $fileName = [System.IO.Path]::GetFileName($FilePath)
        $fileContent = New-Object System.Net.Http.StreamContent($fileStream)
        $multipartContent.Add($fileContent, "file", $fileName)
        
        # Add form fields
        foreach ($key in $FormFields.Keys) {
            $value = $FormFields[$key]
            if ($value -is [array]) {
                foreach ($item in $value) {
                    $stringContent = New-Object System.Net.Http.StringContent($item)
                    $multipartContent.Add($stringContent, $key)
                }
            } else {
                $stringContent = New-Object System.Net.Http.StringContent([string]$value)
                $multipartContent.Add($stringContent, $key)
            }
        }
        
        # Add headers
        foreach ($key in $Headers.Keys) {
            if ($key -eq "Authorization") {
                $httpClient.DefaultRequestHeaders.Authorization = 
                    New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $Headers[$key].Replace("Bearer ", ""))
            } else {
                $httpClient.DefaultRequestHeaders.Add($key, $Headers[$key])
            }
        }
        
        # Send request
        $response = $httpClient.PostAsync($Uri, $multipartContent).Result
        $responseContent = $response.Content.ReadAsStringAsync().Result
        
        # Cleanup
        $fileStream.Close()
        $httpClient.Dispose()
        
        if ($response.IsSuccessStatusCode) {
            return $responseContent | ConvertFrom-Json
        } else {
            Write-Host "   ❌ Upload failed: $($response.StatusCode) - $responseContent" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   💡 Tip: Try using Postman or Insomnia for file upload testing" -ForegroundColor Cyan
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

# Get teacher ID if not provided
if (-not $TeacherId) {
    Write-Host "`n👤 Getting teacher ID..." -ForegroundColor Cyan
    $headers = @{ "Authorization" = "Bearer $Token" }
    $teachersResponse = Invoke-Api -Method Get -Uri "$BaseUrl/api/teachers?limit=1" -Headers $headers
    if ($teachersResponse -and $teachersResponse.data -and $teachersResponse.data.Count -gt 0) {
        $TeacherId = $teachersResponse.data[0].id
        Write-Host "   ✅ Using teacher: $($teachersResponse.data[0].fullName)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ No teachers found" -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    "Authorization" = "Bearer $Token"
}

# Create a test file
Write-Host "`n📄 Creating test file..." -ForegroundColor Cyan
$testFileName = "test-evidence-$(Get-Date -Format 'yyyyMMddHHmmss').txt"
$testFilePath = Join-Path $env:TEMP $testFileName
$testContent = @"
แผนการสอนคณิตศาสตร์ ป.1
วิชา: คณิตศาสตร์
ระดับชั้น: ป.1
วันที่: $(Get-Date -Format 'yyyy-MM-dd')
"@
Set-Content -Path $testFilePath -Value $testContent -Encoding UTF8
Write-Host "   ✅ Created: $testFilePath" -ForegroundColor Green

# Test Evidence Upload
Write-Host "`n📤 Uploading evidence with AI analysis..." -ForegroundColor Cyan

try {
    # Create form fields
    $formFields = @{
        evidenceType = "LESSON_PLAN"
        indicatorCodes = @("1.1", "1.2")
    }

    $response = Invoke-FileUpload -Uri "$BaseUrl/api/evidence/upload" -FilePath $testFilePath -FormFields $formFields -Headers $headers

    if ($response) {
        Write-Host "   ✅ Upload successful" -ForegroundColor Green
        Write-Host "`n📊 AI Analysis Results:" -ForegroundColor Yellow
        Write-Host "   " + ("-" * 48) -ForegroundColor Gray

        if ($response.aiAnalysis) {
            $ai = $response.aiAnalysis
            Write-Host "   Summary: $($ai.summary)" -ForegroundColor Cyan
            Write-Host "   Keywords: $($ai.keywords -join ', ')" -ForegroundColor Cyan
            Write-Host "   Suggested Indicators: $($ai.suggestedIndicators -join ', ')" -ForegroundColor Cyan
            Write-Host "   Suggested Filename: $($ai.suggestedFilename)" -ForegroundColor Cyan
            if ($ai.qualityCheck) {
                Write-Host "   Quality Check: $($ai.qualityCheck | ConvertTo-Json -Compress)" -ForegroundColor Cyan
            }
            if ($ai.suggestions) {
                Write-Host "   Suggestions:" -ForegroundColor Cyan
                foreach ($suggestion in $ai.suggestions) {
                    Write-Host "     - $suggestion" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "   ⚠️  No AI analysis in response" -ForegroundColor Yellow
        }

        Write-Host "`n🔍 PDPA Check Results:" -ForegroundColor Yellow
        Write-Host "   " + ("-" * 48) -ForegroundColor Gray

        if ($response.pdpaCheck) {
            $pdpa = $response.pdpaCheck
            Write-Host "   Is Safe: $($pdpa.isSafe)" -ForegroundColor $(if ($pdpa.isSafe) { "Green" } else { "Yellow" })
            Write-Host "   Risk Level: $($pdpa.riskLevel)" -ForegroundColor $(if ($pdpa.isSafe) { "Green" } else { "Yellow" })
            Write-Host "   Violations: $($pdpa.violations.Count)" -ForegroundColor Gray

            if ($pdpa.violations.Count -gt 0) {
                Write-Host "   Violations Details:" -ForegroundColor Yellow
                foreach ($violation in $pdpa.violations) {
                    Write-Host "     - Type: $($violation.type)" -ForegroundColor Yellow
                    Write-Host "       Matched: $($violation.matchedText)" -ForegroundColor Gray
                    Write-Host "       Risk: $($violation.riskLevel)" -ForegroundColor Gray
                    Write-Host "       Suggestion: $($violation.suggestion)" -ForegroundColor Gray
                }
            }

            if ($pdpa.suggestions) {
                Write-Host "   Suggestions:" -ForegroundColor Cyan
                foreach ($suggestion in $pdpa.suggestions) {
                    Write-Host "     - $suggestion" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "   ⚠️  No PDPA check in response" -ForegroundColor Yellow
        }

        Write-Host "`n📋 Evidence Details:" -ForegroundColor Yellow
        Write-Host "   " + ("-" * 48) -ForegroundColor Gray
        Write-Host "   ID: $($response.id)" -ForegroundColor Gray
        Write-Host "   Original Filename: $($response.originalFilename)" -ForegroundColor Gray
        Write-Host "   Standard Filename: $($response.standardFilename)" -ForegroundColor Gray
        Write-Host "   Evidence Type: $($response.evidenceType)" -ForegroundColor Gray
        Write-Host "   Indicator Codes: $($response.indicatorCodes -join ', ')" -ForegroundColor Gray

        # Test viewing the evidence
        Write-Host "`n👁️  Viewing uploaded evidence..." -ForegroundColor Cyan
        $evidenceResponse = Invoke-Api -Method Get -Uri "$BaseUrl/api/evidence/$($response.id)" -Headers $headers
        if ($evidenceResponse) {
            Write-Host "   ✅ Evidence retrieved successfully" -ForegroundColor Green
        }

    } else {
        Write-Host "   ❌ Upload failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Cleanup test file
    if (Test-Path $testFilePath) {
        Remove-Item $testFilePath -Force
        Write-Host "`n🧹 Cleaned up test file" -ForegroundColor Gray
    }
}

Write-Host "`n💡 หมายเหตุ:" -ForegroundColor Cyan
Write-Host "   - ถ้า GEMINI_API_KEY ไม่ได้ตั้งค่า AI จะใช้ mock responses" -ForegroundColor Gray
Write-Host "   - PDPA Scanner ทำงานอัตโนมัติเมื่อ upload evidence" -ForegroundColor Gray
Write-Host "   - ดู AI activities ได้ที่: GET /api/ai/admin/activities" -ForegroundColor Gray
