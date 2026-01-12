#!/bin/bash

# Test Critical IntroAlignment Endpoints
# Run from project root: bash scripts/test-endpoints.sh

BASE_URL="${1:-http://localhost:3000}"
PASS_COUNT=0
FAIL_COUNT=0

echo "==================================="
echo "Testing IntroAlignment Endpoints"
echo "Base URL: $BASE_URL"
echo "==================================="
echo ""

# Test function
test_endpoint() {
    local endpoint=$1
    local expected_keyword=$2
    local test_name=$3

    echo -n "Testing $test_name... "

    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [[ $http_code == "200" ]] || [[ $http_code == "201" ]]; then
        if echo "$body" | grep -qi "$expected_keyword"; then
            echo "✓ PASS (200, contains '$expected_keyword')"
            ((PASS_COUNT++))
        else
            echo "✗ FAIL (200 but missing '$expected_keyword')"
            ((FAIL_COUNT++))
        fi
    else
        echo "✗ FAIL (HTTP $http_code)"
        ((FAIL_COUNT++))
    fi
}

# Test Core Pages
echo "📄 Testing Pages:"
test_endpoint "/" "Legal Architecture" "Homepage"
test_endpoint "/partners" "attorney" "Partners Page"
test_endpoint "/privacy" "IntroAlignment" "Privacy Page"

# Test Health Endpoints
echo ""
echo "🏥 Testing Health:"
test_endpoint "/api/health" "healthy" "Health Check"
test_endpoint "/api/ping" "pong" "Ping"

# Test Bot Endpoints
echo ""
echo "🤖 Testing Bots:"
test_endpoint "/api/bots/annie" "Legal Services Network" "Annie Bot"
test_endpoint "/api/bots/atlas" "Legal Services Network" "Atlas Bot"
test_endpoint "/api/bots/dan" "Legal Services Network" "Dan Bot"
test_endpoint "/api/bots/dave" "Legal Services Network" "Dave Bot"
test_endpoint "/api/bots/henry" "Legal Services Network" "Henry Bot"
test_endpoint "/api/bots/jordan" "Legal Services Network" "Jordan Bot"

# Test Tracking Endpoints (GET only)
echo ""
echo "📊 Testing Tracking:"
test_endpoint "/api/track/open?eid=test" "image" "Email Open Tracking"

# Test Chat Widget API
echo ""
echo "💬 Testing Chat Widget:"
echo -n "Testing Chat API (POST)... "
chat_response=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"action":"start","userId":"test_user"}' \
    "$BASE_URL/api/chat/annie" 2>&1)
if echo "$chat_response" | grep -qi "annie"; then
    echo "✓ PASS (Contains 'Annie')"
    ((PASS_COUNT++))
else
    echo "✗ FAIL (Missing 'Annie')"
    ((FAIL_COUNT++))
fi

# Summary
echo ""
echo "==================================="
echo "Test Summary"
echo "==================================="
echo "✓ Passed: $PASS_COUNT"
echo "✗ Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed"
    exit 1
fi
