#!/bin/bash
# ─── API Health Check Test ───────────────────────────────────────
# Verifies the server is running and responding

API_URL="${API_URL:-http://localhost:3001}"

echo "🔍 Testing API health at ${API_URL}/api/health"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/health" 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Health check PASSED (HTTP ${RESPONSE})"
    
    # Show response body
    echo ""
    echo "Response:"
    curl -s "${API_URL}/api/health" | head -c 500
    echo ""
    exit 0
else
    echo "❌ Health check FAILED (HTTP ${RESPONSE})"
    exit 1
fi
