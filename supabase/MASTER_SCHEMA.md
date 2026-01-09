# IntroAlignment Master Database Schema

**Last Updated:** 2026-01-09
**Migration Version:** 019
**Purpose:** Single source of truth for database schema

## Migration Order (MUST BE SEQUENTIAL)

```
001 → initial_schema
002 → engagement_games
003 → puzzles_content
004 → community_extraction
005 → seed_games
006 → seed_badges_dealbreakers
007 → conversation_system
008 → lead_scraper_system
009 → seed_lead_sources
010 → massive_source_expansion
011 → match_generation_system
012 → admin_dashboard_system
013 → update_content_feed_system
014 → seed_content_articles
015 → seed_finish_sentence_and_puzzles
016 → bot_system
017 → bot_system_support_tables
018 → subscription_billing_system
019 → seed_subscription_plans
```

## Core Tables

### User & Profile System
- `users` (auth.users) - Supabase Auth
- `profiles` - User profiles with personality data
- `user_preferences` - User dating preferences
- `user_images` - Profile photos
- `user_badges` - Gamification badges
- `engagement_sessions` - Daily engagement tracking

### Matching & Compatibility
- `matches` - Generated matches between users
- `match_feedback` - User feedback on matches
- `introduction_reports` - Detailed match reports
- `dealbreakers` - Universal dealbreaker categories
- `user_dealbreakers` - User-specific dealbreakers

### Games & Engagement
- `games` - Game definitions
- `game_questions` - Questions for games
- `user_game_sessions` - Active game sessions
- `user_game_responses` - User responses to games

### Content System
- `content_articles` - Educational content
- `content_topics` - Topic categories
- `user_content_interactions` - Reading tracking
- `community_posts` - User-generated content
- `post_comments` - Comments on posts
- `post_reactions` - Reactions to content

### Lead Generation & Outreach
- `lead_sources` - Scraping source configuration
- `leads` - Scraped potential users
- `scrape_runs` - Scraping execution logs
- `outreach_sequences` - Email campaign sequences
- `sequence_emails` - Individual email templates
- `sequence_enrollments` - Lead enrollments in sequences
- `email_sends` - Individual email send records
- `outreach_responses` - Responses from leads

### AI Bot System
- `ai_bot_health` - Bot health monitoring
- `bot_actions_log` - Bot action audit log

### Billing & Subscriptions
- `subscription_plans` - Available plans
- `user_subscriptions` - Active subscriptions
- `payment_methods` - Saved payment methods
- `invoices` - Billing invoices
- `usage_tracking` - Feature usage metrics

### Conversations (AI Onboarding)
- `conversation_questions` - Question bank
- `conversation_flows` - Conversation flows
- `user_conversations` - User conversation sessions
- `conversation_responses` - User responses

## Key Relationships

```
users (1) ─── (1) profiles
profiles (1) ─── (∞) user_preferences
profiles (1) ─── (∞) user_images
profiles (1) ─── (∞) user_badges
profiles (1) ─── (∞) engagement_sessions

profiles (∞) ─── (∞) matches ─── (∞) profiles
matches (1) ─── (∞) match_feedback
matches (1) ─── (1) introduction_reports

lead_sources (1) ─── (∞) leads
leads (1) ─── (∞) email_sends
outreach_sequences (1) ─── (∞) sequence_enrollments ─── (1) leads

profiles (1) ─── (∞) user_subscriptions ─── (1) subscription_plans
```

## Migration Rules

### DO:
✅ Always use sequential numbering (001, 002, 003...)
✅ Use descriptive migration names
✅ Test migrations locally before deploying
✅ Document breaking changes
✅ Use `IF NOT EXISTS` and `IF EXISTS` clauses
✅ Add this schema file to git

### DON'T:
❌ Skip numbers or create duplicates
❌ Modify existing migration files after deployment
❌ Delete old migration files
❌ Create migrations with same number
❌ Deploy without testing locally

## Verification Commands

```bash
# Check for duplicate migration numbers
ls supabase/migrations/ | cut -d'_' -f1 | sort | uniq -d

# Verify sequential order
ls supabase/migrations/ | sort | nl

# Run verification script
node scripts/verify-migrations.js
```

## Troubleshooting

### Duplicate Migration Numbers
If you see duplicate numbers:
1. Identify the duplicates: `ls supabase/migrations/ | cut -d'_' -f1 | sort | uniq -d`
2. Rename the later one to next available number
3. Update this documentation

### Migration Conflicts
If Supabase shows migration conflicts:
1. Check migration order in dashboard
2. Verify all migrations applied successfully
3. If needed, manually apply missing migrations
4. Never modify existing migration files

### Schema Drift
If local schema differs from production:
1. Export production schema: `supabase db dump`
2. Compare with local migrations
3. Create new migration to fix drift
4. Never manually modify production database

## Production Database Connection

**Supabase Project:** cxiazrciueruvvsxaxcz
**Region:** us-east-1
**Database:** PostgreSQL 15+

## Last Schema Change

**Date:** 2026-01-09
**Migration:** 019_seed_subscription_plans.sql
**Changes:** Fixed duplicate 010 migration numbering conflict
