#!/bin/bash

echo "======================================"
echo "SOVEREIGNTYINTROALIGNMENT SYSTEM STATUS"
echo "======================================"
echo ""

echo "=== 1. LEAD SCRAPING SYSTEM ==="
curl -s http://localhost:3000/api/cron/scrape 2>&1 | python3 -m json.tool 2>/dev/null || echo "❌ Scraper API not responding"
echo ""

echo "=== 2. LEAD ENRICHMENT SYSTEM ==="
curl -s http://localhost:3000/api/cron/enrich 2>&1 | python3 -m json.tool 2>/dev/null || echo "❌ Enrichment API not responding"
echo ""

echo "=== 3. LEAD SCORING SYSTEM ==="
curl -s http://localhost:3000/api/cron/score 2>&1 | python3 -m json.tool 2>/dev/null || echo "❌ Scoring API not responding"
echo ""

echo "=== 4. MATCH GENERATION SYSTEM ==="
curl -s http://localhost:3000/api/cron/generate-matches 2>&1 | python3 -m json.tool 2>/dev/null || echo "❌ Matching API not responding"
echo ""

echo "=== 5. ADMIN DASHBOARD METRICS ==="
curl -s http://localhost:3000/api/admin/stats 2>&1 | python3 -m json.tool 2>/dev/null || echo "❌ Admin stats not responding"
echo ""

echo "=== 6. BOT SYSTEMS ==="
echo "Testing Henry (Lead Conversion)..."
curl -s -X POST http://localhost:3000/api/bots/henry -H "Content-Type: application/json" -d '{"message":"test"}' 2>&1 | head -100 || echo "❌ Henry bot not responding"
echo ""

echo "Testing Dan (Dating Specialist)..."
curl -s -X POST http://localhost:3000/api/bots/dan -H "Content-Type: application/json" -d '{"message":"test"}' 2>&1 | head -100 || echo "❌ Dan bot not responding"
echo ""

echo "Testing Annie (Relationship Specialist)..."
curl -s -X POST http://localhost:3000/api/bots/annie -H "Content-Type: application/json" -d '{"message":"test"}' 2>&1 | head -100 || echo "❌ Annie bot not responding"
echo ""

echo "Testing Atlas (Content Bot)..."
curl -s -X POST http://localhost:3000/api/bots/atlas -H "Content-Type: application/json" -d '{"message":"test"}' 2>&1 | head -100 || echo "❌ Atlas bot not responding"
echo ""

echo "=== 7. HEALTH CHECK ==="
curl -s http://localhost:3000/api/health 2>&1 | python3 -m json.tool 2>/dev/null || echo "❌ Health endpoint not responding"
echo ""

echo "=== 8. LEAD SOURCES ==="
curl -s http://localhost:3000/api/debug/sources 2>&1 | python3 -m json.tool 2>/dev/null || echo "❌ Debug sources not responding"
echo ""

echo "======================================"
echo "SYSTEM CHECK COMPLETE"
echo "======================================"
