# Test Data Retention API Endpoints
# ใช้สคริปต์นี้เพื่อทดสอบ Data Retention API

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$Token = "",
    [string]$Action = "stats"
)

# ถ้าไม่มี Token ให้แจ้งเตือน
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "⚠️  ต้องมี JWT Token" -ForegroundColor Yellow
    Write-Host "ตัวอย่าง: .\test-retention-api.ps1 -Token 'your-jwt-token' -Action 'stats'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Green
    Write-Host "  - stats      : ดูสถิติ retention (GET /api/pdpa/retention/stats)" -ForegroundColor White
    Write-Host "  - expiring   : ตรวจสอบข้อมูลที่ใกล้หมดอายุ (GET /api/pdpa/retention/expiring)" -ForegroundColor White
    Write-Host "  - cleanup    : รัน cleanup (POST /api/pdpa/retention/cleanup)" -ForegroundColor White
    Write-Host "  - dryrun     : รัน cleanup แบบ dry run (POST /api/pdpa/retention/cleanup)" -ForegroundColor White
    exit 1
}

# Headers
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

try {
    switch ($Action.ToLower()) {
        "stats" {
            Write-Host "📊 ดูสถิติ Data Retention..." -ForegroundColor Cyan
            $url = "$BaseUrl/api/pdpa/retention/stats"
            $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
            $response | ConvertTo-Json -Depth 10
        }
        "expiring" {
            Write-Host "⚠️  ตรวจสอบข้อมูลที่ใกล้หมดอายุ..." -ForegroundColor Yellow
            $url = "$BaseUrl/api/pdpa/retention/expiring"
            $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
            $response | ConvertTo-Json -Depth 10
        }
        "cleanup" {
            Write-Host "🗑️  รัน Cleanup (ลบข้อมูลจริง)..." -ForegroundColor Red
            $url = "$BaseUrl/api/pdpa/retention/cleanup"
            $body = @{
                dryRun = $false
            } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
            $response | ConvertTo-Json -Depth 10
        }
        "dryrun" {
            Write-Host "🔍 รัน Cleanup แบบ Dry Run (ไม่ลบจริง)..." -ForegroundColor Green
            $url = "$BaseUrl/api/pdpa/retention/cleanup"
            $body = @{
                dryRun = $true
            } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
            $response | ConvertTo-Json -Depth 10
        }
        default {
            Write-Host "❌ Action ไม่ถูกต้อง: $Action" -ForegroundColor Red
            Write-Host "ใช้: stats, expiring, cleanup, dryrun" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}
