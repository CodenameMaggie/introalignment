# IntroAlignment Platform

> Beyond compatibility. Into alignment.

A sophisticated matchmaking service that helps people find genuine alignment through comprehensive profiling and thoughtful introductions. We use conversational insights, psychometric analysis, and multi-dimensional compatibility algorithms to facilitate meaningful connections.

## Tech Stack

- **Frontend:** Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API (Anthropic)
- **Email:** Resend
- **Deployment:** Vercel
- **Astrology:** Custom calculation engines (BaZi, Vedic, Nine Star Ki)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Name it "IntroAlignment"
3. Wait for the project to be created
4. Get your credentials:
   - Go to Settings → API
   - Copy the `Project URL`
   - Copy the `anon` public key
   - Copy the `service_role` secret key

### 3. Configure Environment Variables

Edit `.env.local` and add your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-claude-api-key
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
ADMIN_EMAIL=your-admin-email@example.com
```

### 4. Run Database Migrations

In your Supabase project:
1. Go to the SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run in the Supabase SQL Editor

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
lib/ai/              - Conversational AI & extraction engine
lib/astrology/       - BaZi, Vedic, Nine Star Ki calculations
lib/matching/        - Compatibility algorithm
app/api/             - API routes
types/               - TypeScript types
supabase/migrations/ - Database schema
```

## Key Features Built

✅ Conversational AI onboarding engine
✅ 40+ question bank across 7 life dimensions
✅ Psychometric extraction (Big Five, Attachment, EQ, etc.)
✅ Astrological calculations (BaZi, Vedic, Nine Star Ki)
✅ Multi-dimensional compatibility matching
✅ Safety screening framework
✅ Complete database schema with RLS policies

## Next Steps

The technical foundation is complete. Next to build:
- User authentication
- Frontend UI components
- Admin dashboard
- Match introduction flow
- Messaging system

See the full build plan in your project documentation.
