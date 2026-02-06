#!/bin/bash
# Test Data Retention API Endpoints
# ใช้สคริปต์นี้เพื่อทดสอบ Data Retention API

BASE_URL="${BASE_URL:-http://localhost:3001}"
TOKEN="${TOKEN:-}"
ACTION="${1:-stats}"

# ถ้าไม่มี Token ให้แจ้งเตือน
if [ -z "$TOKEN" ]; then
    echo "⚠️  ต้องมี JWT Token"
    echo "ตัวอย่าง: TOKEN='your-jwt-token' ./test-retention-api.sh stats"
    echo ""
    echo "Actions:"
    echo "  - stats      : ดูสถิติ retention (GET /api/pdpa/retention/stats)"
    echo "  - expiring   : ตรวจสอบข้อมูลที่ใกล้หมดอายุ (GET /api/pdpa/retention/expiring)"
    echo "  - cleanup    : รัน cleanup (POST /api/pdpa/retention/cleanup)"
    echo "  - dryrun     : รัน cleanup แบบ dry run (POST /api/pdpa/retention/cleanup)"
    exit 1
fi

case "$ACTION" in
    "stats")
        echo "📊 ดูสถิติ Data Retention..."
        curl -X GET "$BASE_URL/api/pdpa/retention/stats" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" | jq .
        ;;
    "expiring")
        echo "⚠️  ตรวจสอบข้อมูลที่ใกล้หมดอายุ..."
        curl -X GET "$BASE_URL/api/pdpa/retention/expiring" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" | jq .
        ;;
    "cleanup")
        echo "🗑️  รัน Cleanup (ลบข้อมูลจริง)..."
        curl -X POST "$BASE_URL/api/pdpa/retention/cleanup" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"dryRun": false}' | jq .
        ;;
    "dryrun")
        echo "🔍 รัน Cleanup แบบ Dry Run (ไม่ลบจริง)..."
        curl -X POST "$BASE_URL/api/pdpa/retention/cleanup" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"dryRun": true}' | jq .
        ;;
    *)
        echo "❌ Action ไม่ถูกต้อง: $ACTION"
        echo "ใช้: stats, expiring, cleanup, dryrun"
        exit 1
        ;;
esac
