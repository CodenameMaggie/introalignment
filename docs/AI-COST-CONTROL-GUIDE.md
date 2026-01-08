# IntroAlignment: AI Cost Control Guide

## 🎯 Summary

**CURRENT STATUS:** AI is **DISABLED** - saving you $2-5 per user onboarding
**COST:** $0 per user in free mode vs $2-5 per user in AI mode

---

## 💰 Cost Breakdown

### AI Mode (Currently DISABLED)
- **Claude API calls per user:** 88-132 API calls
- **Cost per user:** $2-5
- **100 users:** $200-500
- **1,000 users:** $2,000-5,000

### Free Mode (Currently ACTIVE)
- **Claude API calls per user:** 0
- **Cost per user:** $0
- **100 users:** $0
- **1,000 users:** $0

---

## 🔄 How It Works

### Free Questionnaire Mode (ACTIVE NOW)

1. **User starts onboarding** → No AI, just questions displayed one by one
2. **User types answer** → Saved directly to database
3. **Move to next question** → Simple form submission
4. **Complete all 49 questions** → Done! No AI costs

**What happens to the data?**
- All answers are saved in `conversation_messages` table
- You (the matchmaker) can manually review answers later
- When you're profitable, you can enable AI for automatic psychometric analysis

### AI Conversation Mode (DISABLED)

1. **User sends message** → Claude API call #1 (conversational response)
2. **AI analyzes answer** → Claude API call #2 (psychometric extraction)
3. **Repeat 98-147 times** → 196-294 total API calls per user (49 questions × 2-3 exchanges each × 2 API calls)
4. **Result:** Deep psychological profile automatically extracted

---

## ⚙️ How to Switch Modes

### Current Settings (.env.local)

```bash
# AI Features (Cost Control)
ENABLE_AI_CONVERSATION=false            # Backend AI
ENABLE_AI_EXTRACTION=false              # Psychometric extraction
NEXT_PUBLIC_ENABLE_AI_CONVERSATION=false # Frontend mode selection
```

### To Enable AI (When Profitable)

1. Open `.env.local`
2. Change all three to `true`:
   ```bash
   ENABLE_AI_CONVERSATION=true
   ENABLE_AI_EXTRACTION=true
   NEXT_PUBLIC_ENABLE_AI_CONVERSATION=true
   ```
3. Add your Anthropic API key:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```
4. Restart the dev server

---

## 📊 What You Get in Each Mode

| Feature | Free Mode | AI Mode |
|---------|-----------|---------|
| **Collects all 49 questions** | ✅ Yes | ✅ Yes |
| **Saves all user answers** | ✅ Yes | ✅ Yes |
| **Conversational flow** | ❌ No (form-based) | ✅ Yes |
| **Automatic psychometric extraction** | ❌ No | ✅ Yes |
| **Big Five personality scores** | ❌ No | ✅ Yes |
| **Attachment style analysis** | ❌ No | ✅ Yes |
| **Red flag detection** | ❌ No | ✅ Yes |
| **Cost per user** | **$0** | **$2-5** |

---

## 🎓 Manual Review Process (Free Mode)

Since AI extraction is disabled, here's how you'll review users manually:

### 1. Access User Responses

```sql
-- Get all responses for a specific user
SELECT
  cm.question_number,
  cm.question_text,
  cm.content as answer,
  cm.created_at
FROM conversation_messages cm
JOIN conversations c ON c.id = cm.conversation_id
WHERE c.user_id = 'user-id-here'
  AND cm.role = 'user'
ORDER BY cm.question_number;
```

### 2. Review Answers Manually

Read through their responses to the 22 questions and make notes on:
- **Big Five traits:** Extraversion, Openness, Conscientiousness, Agreeableness, Neuroticism
- **Attachment style:** Secure, Anxious, Avoidant, Disorganized
- **Values:** What matters to them
- **Red flags:** Any concerning patterns
- **Green flags:** Positive indicators

### 3. Create Matches Manually

Based on your manual analysis, create matches by:
1. Finding compatible profiles
2. Checking deal-breakers
3. Using your matchmaking expertise
4. Creating introduction records

---

## 🚀 Recommended Strategy

### Phase 1: Pre-Revenue (NOW)
- **Keep AI disabled** (free mode)
- **Manually review** first 10-50 users
- **Learn patterns** in what makes good matches
- **Build revenue** from successful matches

### Phase 2: Early Revenue ($1,000-5,000/month)
- **Keep AI disabled**
- **Hire part-time assistant** to help with manual review
- **Budget for tools:** $200-500/month for manual operations
- **Continue scaling** without AI costs

### Phase 3: Profitable ($5,000+/month)
- **Enable AI selectively:**
  - Turn on for new users only
  - Or: Use AI for extraction but not conversation
  - Or: Enable full AI experience
- **Budget 10-20% of revenue** for AI costs
- **Monitor ROI:** Does AI improve match quality enough to justify cost?

### Phase 4: Scaled ($20,000+/month)
- **Enable full AI** for all users
- **Budget $2,000-4,000/month** for AI (assuming 1,000 users/month)
- **Still < 20% of revenue** at this scale

---

## 💡 Hybrid Approach (Best of Both Worlds)

When you have some revenue but want to control costs:

1. **Free questionnaire for data collection** (current setup)
2. **Manual review for first 50 users** (learn what works)
3. **Enable AI extraction only** (no conversational AI):
   - Set `ENABLE_AI_CONVERSATION=false`
   - Set `ENABLE_AI_EXTRACTION=true`
   - Cuts costs in half (~$1-2 per user)
4. **Full AI when profitable** (premium experience)

---

## 📈 ROI Calculation

### When to Enable AI?

**Example:** You charge $500 for a successful match

- **AI Mode:** Spend $5 per user onboarding
- **Need:** 1% conversion to break even (1 match per 100 onboardings)
- **Profit:** At 5% conversion, you make $2,500 revenue - $500 AI costs = $2,000 profit

**Break-even point:** When AI costs < 10% of revenue from matches

### Current Recommendation

At $0 revenue → Keep AI disabled ✅
At $1,000/month → Keep AI disabled ✅
At $5,000/month → Consider enabling extraction only
At $10,000/month → Enable full AI if it improves conversion

---

## 🔧 Technical Notes

### Files Modified
- `.env.local` - Feature flags added
- `app/api/conversation/questionnaire/route.ts` - Free questionnaire API (NEW)
- `components/conversation/QuestionnaireForm.tsx` - Free form UI (NEW)
- `app/conversation/page.tsx` - Toggle between AI and free mode

### How to Test

1. Make sure `.env.local` has all flags set to `false`
2. Restart dev server: `npm run dev`
3. Go to http://localhost:3000
4. Sign up for an account
5. Navigate to `/conversation`
6. You should see the simple questionnaire form (not AI chat)

### How to Enable AI (for testing)

1. Get Anthropic API key from https://console.anthropic.com/settings/keys
2. Add to `.env.local`: `ANTHROPIC_API_KEY=sk-ant-api03-...`
3. Change flags to `true`:
   ```bash
   ENABLE_AI_CONVERSATION=true
   ENABLE_AI_EXTRACTION=true
   NEXT_PUBLIC_ENABLE_AI_CONVERSATION=true
   ```
4. Restart server
5. Visit `/conversation` - should see AI chat interface

---

## ⚠️ Important Notes

1. **Don't enable AI without API key** - It will throw errors
2. **Monitor Anthropic usage** - Set spending limits in their dashboard
3. **Start with extraction only** - If you want to test AI cheaply
4. **Users don't know the difference** - Quality data collection works in both modes
5. **Manual review builds expertise** - You'll learn what makes great matches

---

## 📞 Questions?

This system is designed to let you:
- ✅ Start collecting user data **immediately** with $0 AI costs
- ✅ Build your matchmaking expertise **manually** first
- ✅ Enable AI **when profitable** to scale operations
- ✅ **Switch back and forth** as needed based on budget

**Bottom line:** You're collecting the same 49 questions worth of data either way. The difference is whether you pay AI to analyze it automatically ($2-5 per user) or do it yourself manually ($0 per user).
