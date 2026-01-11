#!/bin/bash

# Comprehensive API Endpoint Test Suite
# Tests all major endpoints for stability

echo "========================================="
echo "  SovereigntyIntroAlignment API Endpoint Test Suite"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

# Test helper function
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local expected_status="${4:-200}"

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$url" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" 2>&1)
    fi

    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ PASS (HTTP $status_code)"
        ((PASS++))
        return 0
    else
        echo "❌ FAIL (HTTP $status_code, expected $expected_status)"
        ((FAIL++))
        return 1
    fi
}

echo "## 1. HEALTH & MONITORING ENDPOINTS"
echo "-----------------------------------"
test_endpoint "Ping endpoint" "/api/ping"
test_endpoint "Health check" "/api/health"
echo ""

echo "## 2. BOT SYSTEM ENDPOINTS"
echo "-----------------------------------"
test_endpoint "Atlas bot (research)" "/api/bots/atlas" "POST" "400"  # 400 expected (no body)
test_endpoint "Annie bot (conversation)" "/api/bots/annie" "POST" "400"
test_endpoint "Henry bot (matching)" "/api/bots/henry" "POST" "400"
test_endpoint "Dave bot (content)" "/api/bots/dave" "POST" "400"
test_endpoint "Dan bot (lead scraping)" "/api/bots/dan"
test_endpoint "Jordan bot (enrichment)" "/api/bots/jordan"
echo ""

echo "## 3. LEAD GENERATION ENDPOINTS"
echo "-----------------------------------"
test_endpoint "Lead scraper (cron)" "/api/cron/scrape"
test_endpoint "Qualified leads export" "/api/admin/export-qualified-leads"
echo ""

echo "## 4. GAME & ENGAGEMENT ENDPOINTS"
echo "-----------------------------------"
test_endpoint "Daily games list" "/api/games/daily"
test_endpoint "Daily puzzle" "/api/puzzles/daily"
test_endpoint "Engagement streak" "/api/engagement/streak" "GET" "401"  # 401 expected (auth required)
echo ""

echo "## 5. STATIC PAGES"
echo "-----------------------------------"
test_endpoint "Privacy policy page" "/privacy-policy"
test_endpoint "Home page" "/"
echo ""

echo "## 6. SPECIAL ENDPOINTS"
echo "-----------------------------------"
test_endpoint "SMTP port check" "/api/admin/check-smtp"
echo ""

echo "========================================="
echo "  TEST SUMMARY"
echo "========================================="
echo "✅ PASSED: $PASS"
echo "❌ FAILED: $FAIL"
echo "TOTAL: $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Review the output above."
    exit 1
fi
