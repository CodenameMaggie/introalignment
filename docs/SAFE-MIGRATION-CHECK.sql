-- ============================================
-- SAFE Migration Checker (Won't Error)
-- ============================================
-- This checks what's installed WITHOUT causing errors

-- STEP 1: Count total tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';

-- STEP 2: List all tables you have
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- STEP 3: Check each migration individually (safe queries)

-- Migration 001 - Initial Schema
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') as has_users,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as has_profiles,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') as has_conversations,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matches') as has_matches;

-- Migration 002 - Engagement Games
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_games') as has_engagement_games,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_games') as has_daily_games,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_responses') as has_game_responses;

-- Migration 003 - Puzzles
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'puzzles') as has_puzzles,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'puzzle_submissions') as has_puzzle_submissions;

-- Migration 004 - Community
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_posts') as has_community_posts,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_extractions') as has_conversation_extractions;

-- Migration 007 - Conversation Messages
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_messages') as has_conversation_messages;

-- Migration 008 - Lead Scraper
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_sources') as has_lead_sources,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') as has_leads,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outreach_sequences') as has_outreach_sequences;

-- Migration 010 - Billing
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') as has_subscription_plans,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') as has_user_subscriptions,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') as has_invoices;

-- Migration 012 - Match Generation (check for specific column)
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'compatibility_score'
  ) as has_compatibility_score;

-- Migration 013 - Admin Dashboard
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_log') as has_admin_audit_log,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'red_flags') as has_red_flags;

-- Migration 014 - Content Feed
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_articles') as has_content_articles,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_saved_content') as has_user_saved_content;

-- Migration 017 - Bot System
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_bot_health') as has_ai_bot_health;

-- Migration 018 - Bot Support Tables
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_action_log') as has_ai_action_log,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_governance_rules') as has_ai_governance_rules;

-- ============================================
-- RESULTS GUIDE:
-- ============================================
-- 't' (true) = table exists = migration ran
-- 'f' (false) = table missing = migration NOT run
-- ============================================
