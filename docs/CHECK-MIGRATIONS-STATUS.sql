-- ============================================
-- SovereigntyIntroAlignment Migration Status Checker
-- ============================================
-- Run this in your Supabase SQL Editor to check what's been installed
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

-- ============================================
-- 1. CHECK ALL TABLES (Should have ~50 tables)
-- ============================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables if ALL migrations ran:
-- admin_audit_log, ai_action_log, ai_bot_health, ai_governance_rules,
-- badges, community_posts, content_articles, conversation_extractions,
-- conversation_messages, conversations, daily_games, deal_breakers,
-- email_tracking, engagement_games, game_responses, invoices, lead_sources,
-- leads, matches, message_threads, messages, outreach_sequences,
-- profiles, purchases, puzzle_submissions, puzzles, red_flags,
-- sequence_emails, subscription_plans, user_badges, user_deal_breakers,
-- user_saved_content, user_subscriptions, users, waitlist, etc.

-- ============================================
-- 2. COUNT TABLES (Should be ~45-50)
-- ============================================
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';

-- ============================================
-- 3. CHECK SPECIFIC MIGRATIONS
-- ============================================

-- Migration 001: Core tables
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
    THEN '✅ Yes' ELSE '❌ No' END as "001_users_table",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
    THEN '✅ Yes' ELSE '❌ No' END as "001_profiles_table",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations')
    THEN '✅ Yes' ELSE '❌ No' END as "001_conversations_table",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matches')
    THEN '✅ Yes' ELSE '❌ No' END as "001_matches_table";

-- Migration 002: Games
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_games')
    THEN '✅ Yes' ELSE '❌ No' END as "002_engagement_games",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_games')
    THEN '✅ Yes' ELSE '❌ No' END as "002_daily_games",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_responses')
    THEN '✅ Yes' ELSE '❌ No' END as "002_game_responses";

-- Migration 003: Puzzles
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'puzzles')
    THEN '✅ Yes' ELSE '❌ No' END as "003_puzzles",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'puzzle_submissions')
    THEN '✅ Yes' ELSE '❌ No' END as "003_puzzle_submissions";

-- Migration 004: Community
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_posts')
    THEN '✅ Yes' ELSE '❌ No' END as "004_community_posts",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_extractions')
    THEN '✅ Yes' ELSE '❌ No' END as "004_extractions";

-- Migration 007: Conversation System
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_messages')
    THEN '✅ Yes' ELSE '❌ No' END as "007_conversation_messages";

-- Migration 008: Lead Scraper
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_sources')
    THEN '✅ Yes' ELSE '❌ No' END as "008_lead_sources",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads')
    THEN '✅ Yes' ELSE '❌ No' END as "008_leads",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outreach_sequences')
    THEN '✅ Yes' ELSE '❌ No' END as "008_outreach_sequences";

-- Migration 010: Billing
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions')
    THEN '✅ Yes' ELSE '❌ No' END as "010_subscriptions",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans')
    THEN '✅ Yes' ELSE '❌ No' END as "010_plans",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices')
    THEN '✅ Yes' ELSE '❌ No' END as "010_invoices";

-- Migration 012: Match Generation
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'compatibility_score')
    THEN '✅ Yes' ELSE '❌ No' END as "012_compatibility_score_column";

-- Migration 013: Admin Dashboard
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_log')
    THEN '✅ Yes' ELSE '❌ No' END as "013_admin_audit_log",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'red_flags')
    THEN '✅ Yes' ELSE '❌ No' END as "013_red_flags";

-- Migration 014: Content Feed
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_articles')
    THEN '✅ Yes' ELSE '❌ No' END as "014_content_articles",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_saved_content')
    THEN '✅ Yes' ELSE '❌ No' END as "014_saved_content";

-- Migration 017 & 018: Bot System
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_bot_health')
    THEN '✅ Yes' ELSE '❌ No' END as "017_ai_bot_health",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_action_log')
    THEN '✅ Yes' ELSE '❌ No' END as "018_ai_action_log",
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_governance_rules')
    THEN '✅ Yes' ELSE '❌ No' END as "018_governance_rules";

-- ============================================
-- 4. CHECK SEED DATA (Optional migrations)
-- ============================================

-- Migration 005: Game seed data
SELECT COUNT(*) as game_questions_count FROM engagement_games;
-- Expected: 60+ if migration 005 ran

-- Migration 006: Badges seed data
SELECT COUNT(*) as badges_count FROM badges;
-- Expected: 20+ if migration 006 ran

-- Migration 009: Lead sources seed data
SELECT COUNT(*) as lead_sources_count FROM lead_sources;
-- Expected: 5+ if migration 009 ran

-- Migration 011: Subscription plans seed data
SELECT COUNT(*) as subscription_plans_count FROM subscription_plans;
-- Expected: 3+ if migration 011 ran

-- Migration 015: Content articles seed data
SELECT COUNT(*) as content_articles_count FROM content_articles;
-- Expected: 50+ if migration 015 ran

-- Migration 016: Puzzle seed data
SELECT COUNT(*) as puzzles_count FROM puzzles;
-- Expected: 30+ if migration 016 ran

-- ============================================
-- 5. CHECK BOT SYSTEM DATA
-- ============================================

-- Check if bots are initialized
SELECT
  bot_name,
  status,
  last_active,
  actions_today,
  actions_this_hour
FROM ai_bot_health
ORDER BY bot_name;
-- Expected: 6 bots (atlas, annie, henry, dave, dan, jordan) if initialized

-- ============================================
-- 6. FULL SUMMARY
-- ============================================

SELECT
  'Tables Created' as check_type,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as count,
  '45-50' as expected;

-- ============================================
-- INTERPRETATION GUIDE:
-- ============================================
--
-- If you see ~45-50 tables: ✅ All migrations likely ran
-- If you see < 30 tables: ❌ Some migrations missing
-- If you see > 0 rows in seed data queries: ✅ Seed migrations ran
-- If you see 6 bots in ai_bot_health: ✅ Bot system initialized
--
-- Missing tables? Run the corresponding migration file.
-- ============================================
