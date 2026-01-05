# Game Components System - Implementation Status

**Status:** Partially Complete ⚠️
**Build:** 57/57 routes compiled successfully ✅
**Next Phase:** Complete remaining components, API routes, and integration

---

## ✅ COMPLETED

### Database Schema
**Existing (Migrations 002 & 005):**
- ✅ `games` table - Game definitions
- ✅ `game_questions` table - Questions/scenarios
- ✅ `game_responses` table - User answers
- ✅ `engagement_sessions` table - Daily play tracking
- ✅ `puzzles` table - Puzzle definitions
- ✅ `puzzle_attempts` table - User attempts

### Seed Data
**Migration 005 - Already Seeded:**
- ✅ Would You Rather (10 questions)
- ✅ This or That (10 questions)
- ✅ Red Flag Green Flag (10 scenarios)

**Migration 016 - Ready to Run:**
- ✅ Finish the Sentence (10 prompts)
- ✅ Daily Puzzles (10 puzzles - mix of scenario and logic types)

### Game Components Built
- ✅ `WouldYouRatherGame.tsx` - Binary choice game (existing)
- ✅ `ThisOrThatGame.tsx` - Quick preference picker
- ✅ `RedFlagGreenFlagGame.tsx` - Dating scenario judgment

---

## 🚧 IN PROGRESS / TODO

### Components to Build

#### 1. Finish the Sentence Component
**File:** `components/games/FinishSentenceGame.tsx`

**Requirements:**
- Multi-line text input (min 20, max 500 chars)
- Character counter
- Submit button
- Progress through 10 prompts
- "Reflecting..." state while AI processes
- Must call AI extraction endpoint

**Complexity:** Medium (requires AI integration)

#### 2. Daily Puzzle Component
**File:** `components/games/DailyPuzzleGame.tsx`

**Requirements:**
- Display puzzle title and scenario/problem
- Text input for response
- Submit button
- Show insight/feedback after submission
- One puzzle per day (same for all users)
- Different puzzle tomorrow

**Complexity:** Medium (requires daily puzzle rotation logic)

---

### API Routes to Build

#### 1. GET /api/games/[type]
**Purpose:** Get game questions by type

**Parameters:**
- `type`: game_type (this_or_that, red_flag_green_flag, finish_sentence, etc.)

**Logic:**
1. Check if user already played this game today
2. If yes, return `{ alreadyPlayed: true, playedAt: timestamp }`
3. If no, fetch game and questions
4. Return game data with questions

**Response:**
```typescript
{
  alreadyPlayed: boolean;
  playedAt?: string;
  game?: {
    id: string;
    game_type: string;
    title: string;
    description: string;
    points_value: number;
    game_questions: GameQuestion[];
  }
}
```

#### 2. POST /api/games/[type]/complete
**Purpose:** Mark game as complete for today

**Body:**
```typescript
{
  userId: string;
  gameId: string;
}
```

**Logic:**
1. Find or create today's engagement_session
2. Mark appropriate game as completed (daily_game_completed = true)
3. Update streak if appropriate
4. Award points
5. Check for badges/achievements

**Response:**
```typescript
{
  success: boolean;
  streak: number;
  points: number;
  totalPoints: number;
  badge?: {
    id: string;
    name: string;
    description: string;
  }
}
```

#### 3. GET /api/puzzles/daily
**Purpose:** Get today's puzzle

**Logic:**
1. Determine today's puzzle (rotate through available puzzles, same for all users each day)
2. Check if user already attempted today
3. Return puzzle or { alreadyAttempted: true }

**Response:**
```typescript
{
  alreadyAttempted: boolean;
  attemptedAt?: string;
  puzzle?: {
    id: string;
    title: string;
    puzzle_type: string;
    puzzle_data: object;
    points_value: number;
    time_limit_seconds?: number;
  }
}
```

#### 4. POST /api/puzzles/daily/submit
**Purpose:** Submit puzzle attempt

**Body:**
```typescript
{
  userId: string;
  puzzleId: string;
  response: string;
  timeSpentSeconds: number;
}
```

**Logic:**
1. Save attempt to puzzle_attempts
2. Run extraction analysis (scenario puzzles)
3. Generate insight/feedback
4. Award points
5. Update engagement session

**Response:**
```typescript
{
  success: boolean;
  insight: string;
  points: number;
  extracted?: {
    values: object;
    personality: object;
  }
}
```

#### 5. POST /api/games/finish-sentence/extract
**Purpose:** AI extraction for open-ended responses

**Body:**
```typescript
{
  userId: string;
  questionId: string;
  response: string;
}
```

**Logic:**
1. Call AI service (OpenAI, Claude, etc.) to analyze response
2. Extract: values, communication style, emotional depth, vocabulary level
3. Store in profile_extractions
4. Return extraction results

**Response:**
```typescript
{
  success: boolean;
  extraction: {
    values: object;
    communication_style: string;
    emotional_depth: number;
    vocabulary_level: string;
  }
}
```

---

### Dashboard Integration

**File:** `app/dashboard-interactive/page.tsx` (or new games dashboard)

**Requirements:**
1. Display all 5 games:
   - Would You Rather
   - This or That
   - Red Flag Green Flag
   - Finish the Sentence
   - Daily Puzzle

2. Each game card shows:
   - Game icon
   - Game title
   - Description
   - Status: "Play Now" or "Completed ✓"
   - Streak count for that game
   - Points value

3. Completed games:
   - Grayed out
   - Show checkmark
   - Show "Come back tomorrow"
   - Cannot click

4. Available games:
   - Full color
   - Click opens game modal/component
   - Show estimated time

5. Modal/component system:
   - Click game card → show game component
   - Component handles game flow
   - On complete → update dashboard
   - Close → return to dashboard

**UI Layout:**
```
┌─────────────────────────────────────┐
│  Daily Games                         │
│  Keep your streak alive!             │
├─────────────────────────────────────┤
│                                      │
│  [Game Card] [Game Card] [Game Card] │
│  [Game Card] [Game Card]             │
│                                      │
│  Your Streak: 🔥 7 days              │
│  Total Points: ⭐ 450                │
└─────────────────────────────────────┘
```

---

### Daily Limit & Streak Tracking

**Logic to Implement:**

1. **Daily Reset:**
   - Games reset at midnight (user's timezone or UTC)
   - New engagement_session created for new day
   - All games become available again

2. **Streak Calculation:**
   - Increment streak if user played yesterday and plays today
   - Reset streak if missed a day
   - Track longest_streak separately

3. **Points System:**
   - Each game awards points_value on completion
   - Points accumulate in total_points
   - Can be used for levels, badges, rewards

4. **Session Tracking:**
   - Create engagement_session on first activity each day
   - Update last_activity_at on each interaction
   - Track which games completed today

---

## Example API Implementation

### GET /api/games/this-or-that

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if played today
  const today = new Date().toISOString().split('T')[0];
  const { data: responses } = await supabase
    .from('game_responses')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('game_type', type)
    .gte('created_at', today)
    .limit(1);

  if (responses && responses.length > 0) {
    return NextResponse.json({
      alreadyPlayed: true,
      playedAt: responses[0].created_at
    });
  }

  // Fetch game and questions
  const { data: game } = await supabase
    .from('games')
    .select(`
      id,
      game_type,
      title,
      description,
      points_value,
      game_questions (
        id,
        question_text,
        question_type,
        options,
        sequence_order
      )
    `)
    .eq('game_type', type)
    .eq('is_active', true)
    .single();

  // Sort questions by sequence_order
  if (game?.game_questions) {
    game.game_questions.sort((a, b) => a.sequence_order - b.sequence_order);
  }

  return NextResponse.json({ alreadyPlayed: false, game });
}
```

---

## Classic Romance UI Specifications

### Game Cards (Dashboard)
```css
/* Available */
background: white
border: 2px solid #E8E4E0 (soft gray)
hover: border-color: #F4E4E1 (blush), background: blush/10
icon: full color
text: #2C3E50 (navy)

/* Completed */
background: #F4E4E1 (blush)
border: 2px solid #7C9A8E (sage)
checkmark: #7C9A8E (sage)
text: gray-600
cursor: not-allowed
```

### This or That Buttons
```css
/* Default */
border: 2px solid gray-200
background: white
hover: border-color: blush, background: blush/10

/* Selected */
background: #D4A574 (gold)
border: gold
text: white
scale: 1.05
```

### Red Flag Green Flag Buttons
```css
/* Green Flag */
background: #10b981 (green-500)
hover: #059669 (green-600)
text: white

/* Red Flag */
background: #ef4444 (red-500)
hover: #dc2626 (red-600)
text: white

/* Selected state */
scale: 1.05
box-shadow: large
```

### Progress Bars
```css
background: gray-200
fill: #D4A574 (gold)
height: 8px
border-radius: full
transition: all 300ms
```

---

## Testing Checklist

### This or That
- [ ] Loads 10 questions
- [ ] Options display side by side
- [ ] Selection highlights correctly
- [ ] Auto-advances after selection
- [ ] Progress bar updates
- [ ] Completes after question 10
- [ ] Response saved to database
- [ ] Timing data captured
- [ ] Cannot play again same day

### Red Flag Green Flag
- [ ] Scenarios display correctly
- [ ] Green button is green
- [ ] Red button is red
- [ ] Selection highlights
- [ ] Completes after 10 scenarios
- [ ] Responses saved
- [ ] Daily limit works

### Finish the Sentence
- [ ] Prompts display
- [ ] Text input works
- [ ] Character count shows
- [ ] Min/max enforced
- [ ] AI extraction triggers
- [ ] Loading state shows
- [ ] Extraction saved
- [ ] Completes after 10 prompts

### Daily Puzzle
- [ ] Today's puzzle loads
- [ ] Same puzzle for all users
- [ ] Can submit response
- [ ] Insight displays
- [ ] Points awarded
- [ ] Cannot attempt again today
- [ ] Different puzzle tomorrow

### Dashboard Integration
- [ ] All 5 games display
- [ ] Correct icons and descriptions
- [ ] Status shows correctly (available/completed)
- [ ] Clicking opens game
- [ ] Completed games disabled
- [ ] Streak counter accurate
- [ ] Points total correct

### Daily Reset
- [ ] Games reset at midnight
- [ ] Streak increments correctly
- [ ] Streak resets if day missed
- [ ] New session created each day

---

## Deployment Steps

1. **Run Migration 016:**
   ```
   Visit: https://introalignment.vercel.app/admin/migrations
   Copy SQL for 016_seed_finish_sentence_and_puzzles.sql
   Run in Supabase SQL Editor
   ```

2. **Complete remaining components:**
   - Build Finish the Sentence component
   - Build Daily Puzzle component

3. **Complete API routes:**
   - Build all 5 API routes listed above

4. **Dashboard integration:**
   - Add game cards to dashboard
   - Implement modal/component system
   - Add streak and points display

5. **Test thoroughly:**
   - Test each game individually
   - Test daily limits
   - Test streak tracking
   - Test on mobile

6. **Deploy:**
   ```bash
   npm run build
   git add .
   git commit -m "Add game components system"
   git push
   vercel --prod
   ```

---

## Current Files

**Completed:**
- `supabase/migrations/016_seed_finish_sentence_and_puzzles.sql`
- `components/games/WouldYouRatherGame.tsx`
- `components/games/ThisOrThatGame.tsx`
- `components/games/RedFlagGreenFlagGame.tsx`

**To Create:**
- `components/games/FinishSentenceGame.tsx`
- `components/games/DailyPuzzleGame.tsx`
- `app/api/games/[type]/route.ts`
- `app/api/games/[type]/complete/route.ts`
- `app/api/puzzles/daily/route.ts`
- `app/api/puzzles/daily/submit/route.ts`
- `app/api/games/finish-sentence/extract/route.ts`
- Updated dashboard page with game integration

---

## Notes

- **No placeholders used** - All seed data is complete and meaningful
- **Classic Romance palette** - UI specifications provided for consistency
- **Extraction-focused** - Games designed to capture personality and preference data
- **Daily engagement** - All games have daily limits to encourage habit formation
- **Streak-driven** - Gamification to increase retention

**Next steps:** Complete remaining components and API routes, then test and deploy.
