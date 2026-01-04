# IntroAlignment Matching Algorithm - Data Sources

## ✅ ALL Data Sources Used in Enhanced Algorithm

### 1. **profiles** table (Onboarding Questionnaire)
```
Used for:
- Big Five personality scores (baseline)
- Attachment style (questionnaire answer)
- EQ scores
- Enneagram type
- MBTI type
- DISC scores
- Love languages
- Core values array
- Life vision summary
- Career trajectory
- Financial philosophy
- Family goals (wants_children, has_children)
- Lifestyle preferences
- Geographic flexibility
- Deal breakers
- Demographics (age, gender, location)
```

### 2. **profile_extractions** table (Daily Games)
```
Used for:
- Big Five personality (VALIDATED from games)
  * If confidence > 0.5, use games data
  * Otherwise use questionnaire data
  * Provides cross-validation!

- Attachment style (validated from game responses)
  * Secure/Anxious/Avoidant scores from behavior

- Decision speed (behavioral signal)
  * Impulsive vs Deliberate vs Slow
  * From response timing

- Risk tolerance (from choices)

- Persistence score (from puzzle attempts)

- Creativity score (from puzzle solutions)

- Values hierarchy (validated from games)
  * Cross-checks questionnaire values

- Interests with strength scores
  * {"travel": 0.9, "cooking": 0.6}

- Lifestyle indicators
  * social_preference
  * activity_level
  * home_vs_out
  * planning_style
  * chronotype

- Relationship indicators
  * communication_preference
  * conflict_style
  * affection_style
  * independence_level

- Profile completeness (0-1)
  * Used for confidence scoring
```

### 3. **dealbreaker_responses** table (Swipe Cards)
```
Used for:
- HARD FILTERS (automatic disqualification)
- Check if user1's dealbreakers match user2's traits
- Check if user2's dealbreakers match user1's traits
- Must-haves vs dealbreakers
- -50 points per dealbreaker violation
```

### 4. **poll_votes** table (Community Polls)
```
Used for:
- Values alignment validation
- Compare votes on common polls
- Calculate agreement rate
- +10 points if >70% agreement
- -5 points if <30% agreement
```

### 5. **content_interactions** table (Articles Read)
```
Used for:
- Intellectual overlap
- Shared interests discovery
- Count common articles read
- +5 points per shared article (max 20)
```

### 6. **discussion_responses** table (Community Posts)
```
Future enhancement:
- LLM analysis of writing style
- Values extraction from posts
- Communication style assessment
- Emotional expression patterns
```

### 7. **astro_profiles** table (Birth Data)
```
Used for:
- BaZi compatibility (40% weight)
- Vedic compatibility (35% weight)
- Nine Star Ki compatibility (25% weight)
- Overall astrological score (5% of total)
```

### 8. **engagement_sessions** table (Activity Level)
```
Potential use:
- Filter by seriousness (high streak = serious user)
- Prioritize active users
- Ensure both users are engaged
```

## 📊 Scoring Breakdown

### Total: 100 points

1. **Psychological (25 points)**
   - Big Five compatibility (questionnaire + games)
   - Attachment style (questionnaire + games)
   - EQ compatibility

2. **Behavioral (15 points)**
   - Decision speed match (from games)
   - Risk tolerance (from games)
   - Persistence patterns (from puzzles)
   - Creativity alignment (from puzzles)

3. **Values & Vision (20 points)**
   - Core values (questionnaire + games validation)
   - Values hierarchy (games)
   - Children plans (questionnaire) - CRITICAL
   - Poll votes alignment

4. **Interests (10 points)**
   - Interests from games
   - Content overlap (articles read)
   - Hobby compatibility

5. **Lifestyle (10 points)**
   - Lifestyle indicators (games)
   - Relationship indicators (games)
   - Social preferences (games + questionnaire)
   - Geographic proximity (questionnaire)

6. **Deal Breakers (15 points)**
   - Swipe card responses
   - HARD FILTER - violations = -50 each
   - Automatic disqualification if violated

7. **Astrological (5 points)**
   - BaZi + Vedic + Nine Star Ki
   - Optional enhancement

## 🎯 Confidence Scoring

```javascript
confidence = (user1.profile_completeness + user2.profile_completeness) / 2

- < 0.3 = "Building profile" (don't show match yet)
- 0.3-0.6 = "Emerging compatibility"
- 0.6-0.8 = "Good confidence"
- > 0.8 = "High confidence match"
```

## 🔄 Data Flow Example

### User completes questionnaire:
```
profiles.openness_score = 75
profiles.wants_children = "yes"
profiles.core_values = ["family", "adventure", "growth"]
```

### User plays games daily:
```
After 10 games:
profile_extractions.openness = 0.78
profile_extractions.openness_confidence = 0.50
profile_extractions.values_hierarchy = ["adventure", "family", "growth"]
```

### User swipes dealbreakers:
```
dealbreaker_responses:
- "Smoking" → dealbreaker
- "Wants children" → must_have
- "Night owl" → prefer_not
```

### User reads articles:
```
content_interactions:
- "Travel in Southeast Asia" → read_completed
- "Building Strong Relationships" → saved
```

### User votes in polls:
```
poll_votes:
- "How important is physical attraction?" → "Important but not everything"
```

## 🧮 Matching Algorithm Logic

```javascript
// Pseudo-code
async function match(user1, user2) {
  // 1. HARD FILTERS (immediate disqualification)
  const dealbreakers = await checkDealBreakers(user1.id, user2.id);
  if (dealbreakers.score < 50) return null; // Dealbreaker violated!

  // 2. Check data completeness
  if (user1.completeness < 0.3 || user2.completeness < 0.3) {
    return { message: "Not enough data yet" };
  }

  // 3. Calculate compatibility across ALL dimensions
  const psych = calculatePsychological(
    user1.profiles,      // Questionnaire
    user2.profiles,
    user1.extractions,   // Games
    user2.extractions
  );

  const behavioral = calculateBehavioral(
    user1.extractions,   // Decision speed, risk tolerance
    user2.extractions
  );

  const values = await calculateValues(
    user1.profiles.core_values,     // Questionnaire
    user2.profiles.core_values,
    user1.extractions.values_hierarchy, // Games
    user2.extractions.values_hierarchy,
    user1.poll_votes,                   // Polls
    user2.poll_votes
  );

  const interests = await calculateInterests(
    user1.extractions.interests,  // Games
    user2.extractions.interests,
    user1.content_interactions,   // Articles
    user2.content_interactions
  );

  const lifestyle = calculateLifestyle(
    user1.extractions.lifestyle_indicators,    // Games
    user2.extractions.lifestyle_indicators,
    user1.extractions.relationship_indicators, // Games
    user2.extractions.relationship_indicators,
    user1.profiles.location,                   // Questionnaire
    user2.profiles.location
  );

  // 4. Weighted total
  const overall =
    psych * 0.25 +
    behavioral * 0.15 +
    values * 0.20 +
    interests * 0.10 +
    lifestyle * 0.10 +
    dealbreakers * 0.15 +
    astro * 0.05;

  return {
    score: overall,
    confidence: (user1.completeness + user2.completeness) / 2
  };
}
```

## ✅ No Unused Data!

Every table is utilized:
- ✅ profiles - Used for baseline + hard filters
- ✅ profile_extractions - Used for validation + behavioral
- ✅ dealbreaker_responses - Used for hard filtering
- ✅ poll_votes - Used for values alignment
- ✅ content_interactions - Used for interest overlap
- ✅ astro_profiles - Used for astrological compatibility
- 🔮 discussion_responses - Ready for future LLM analysis
- 🔮 engagement_sessions - Ready for seriousness filtering

## 🎯 Why This Works

1. **Cross-Validation**
   - Questionnaire says "adventurous"
   - Games confirm with high openness
   - Articles show travel content clicks
   - Polls show risk-taking preferences
   - → HIGH CONFIDENCE

2. **Behavioral Truth**
   - Questionnaires = what people SAY
   - Games = what people DO
   - Actions > Words

3. **Continuous Refinement**
   - Week 1: Questionnaire baseline (0.3 confidence)
   - Month 1: Games validation (0.6 confidence)
   - Month 3: Rich multi-source data (0.9 confidence)

4. **Hard Filters First**
   - Check dealbreakers BEFORE calculating score
   - No point scoring someone who's disqualified

5. **Dynamic Weighting**
   - Use game data if confidence > 0.5
   - Fall back to questionnaire otherwise
   - Best available data always wins

## 🚀 Result

**Most comprehensive compatibility algorithm in the dating space!**

- 8 data sources
- 7 scoring dimensions
- Cross-validation
- Behavioral + stated preferences
- Continuous refinement
- Deal breaker filtering
- Confidence scoring

No other dating app does this!
