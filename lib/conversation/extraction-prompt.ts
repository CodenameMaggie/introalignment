/**
 * IntroAlignment Extraction Prompt
 * Analyzes user responses to extract psychological insights
 */

export function getExtractionPrompt(
  question: string,
  userResponse: string,
  extractionTargets: string[]
): string {
  return `You are a psychological profiling expert for a deep compatibility matchmaking platform. Analyze the user's response to extract psychological insights that will help us understand who they are and find compatible matches.

# QUESTION ASKED
"${question}"

# USER'S RESPONSE
"${userResponse}"

# EXTRACTION TARGETS
Focus on extracting insights about: ${extractionTargets.join(', ')}

# YOUR TASK
Analyze the response and extract structured psychological data. Be nuanced and evidence-based - only extract what you can reasonably infer from what they actually said. Don't make wild assumptions.

Return your analysis as a JSON object with the following structure:

{
  "big_five_updates": {
    // Only include traits you can reasonably infer from their response
    // Values should be 0-1 (0 = low, 0.5 = neutral, 1 = high)
    "openness": 0.0-1.0,          // Creativity, curiosity, openness to experience
    "conscientiousness": 0.0-1.0,  // Organization, planning, discipline
    "extraversion": 0.0-1.0,       // Social energy, outgoingness
    "agreeableness": 0.0-1.0,      // Warmth, cooperation, empathy
    "neuroticism": 0.0-1.0         // Emotional stability (high = more anxious)
  },

  "attachment_indicators": {
    // Only include if there's evidence in the response
    // Values should sum to ~1.0 but can overlap
    "secure": 0.0-1.0,      // Comfortable with intimacy, trusts others
    "anxious": 0.0-1.0,     // Needs reassurance, fears abandonment
    "avoidant": 0.0-1.0     // Values independence highly, uncomfortable with closeness
  },

  "values_mentioned": [
    // List any values explicitly or implicitly mentioned
    // Examples: "family", "adventure", "growth", "stability", "freedom", "creativity"
  ],

  "interests_mentioned": {
    // Map of interests to strength (0-1)
    "interest_name": 0.0-1.0
    // Examples: {"travel": 0.9, "cooking": 0.6, "reading": 0.8}
  },

  "relationship_insights": {
    // Only include if relevant to the response
    "communication_style": "",      // "direct", "indirect", "expressive", "reserved"
    "conflict_style": "",           // "collaborative", "avoidant", "assertive", "accommodating"
    "affection_style": "",          // "words", "acts", "quality_time", "physical", "gifts"
    "independence_level": "",       // "highly_independent", "balanced", "interdependent"
    "vulnerability": ""             // "open", "guarded", "selective"
  },

  "lifestyle_indicators": {
    // Only include if relevant to the response
    "social_preference": "",        // "extraverted", "introverted", "ambivert"
    "activity_level": "",           // "high", "moderate", "low"
    "home_vs_out": "",              // "homebody", "balanced", "always_out"
    "planning_style": "",           // "planner", "flexible", "spontaneous"
    "chronotype": ""                // "morning_person", "night_owl", "flexible"
  },

  "emotional_intelligence": {
    // 0-1 scale, only include if you have evidence
    "self_awareness": 0.0-1.0,      // Understanding their own emotions
    "empathy": 0.0-1.0,             // Understanding others' emotions
    "emotional_regulation": 0.0-1.0 // Managing their emotions
  },

  "cognitive_indicators": {
    // Only include if relevant
    "decision_style": "",           // "analytical", "intuitive", "mixed"
    "planning_orientation": "",     // "future_focused", "present_focused", "past_focused"
    "learning_style": "",           // "visual", "experiential", "analytical"
    "complexity_tolerance": ""      // "high", "moderate", "low"
  },

  "red_flags": [
    // ONLY include clear warning signs - be conservative
    // Examples: "poor_boundaries", "blame_others", "black_white_thinking", "possessiveness"
  ],

  "green_flags": [
    // Positive relationship indicators
    // Examples: "self_awareness", "emotional_maturity", "growth_mindset", "healthy_boundaries"
  ],

  "confidence_score": 0.0-1.0,
    // How confident are you in this extraction?
    // 0.3 = vague response, limited data
    // 0.5 = decent response, some clear signals
    // 0.7 = detailed response, multiple clear signals
    // 0.9 = very detailed, multiple strong signals across dimensions

  "reasoning": "Brief explanation of your analysis and what stood out"
}

# EXTRACTION GUIDELINES

## Big Five Personality Traits

**Openness** (0-1 scale):
- HIGH (0.7-1.0): Creative, curious, loves new experiences, abstract thinking, artistic
- MEDIUM (0.4-0.6): Balanced, open to some new things, practical creativity
- LOW (0.0-0.3): Prefers routine, practical, traditional, concrete thinking

**Conscientiousness** (0-1 scale):
- HIGH (0.7-1.0): Organized, plans ahead, disciplined, detail-oriented, reliable
- MEDIUM (0.4-0.6): Some structure but flexible, generally reliable
- LOW (0.0-0.3): Spontaneous, flexible, goes with flow, less structured

**Extraversion** (0-1 scale):
- HIGH (0.7-1.0): Energized by people, outgoing, lots of social connections
- MEDIUM (0.4-0.6): Ambivert, balanced social needs
- LOW (0.0-0.3): Energized by alone time, small circles, quieter

**Agreeableness** (0-1 scale):
- HIGH (0.7-1.0): Warm, cooperative, empathetic, puts others first, conflict-avoidant
- MEDIUM (0.4-0.6): Balanced, can be assertive and cooperative
- LOW (0.0-0.3): Direct, competitive, prioritizes truth over harmony

**Neuroticism** (0-1 scale):
- HIGH (0.7-1.0): Anxious, worries often, sensitive to stress, emotionally reactive
- MEDIUM (0.4-0.6): Normal emotional ups and downs, generally stable
- LOW (0.0-0.3): Very emotionally stable, calm, rarely anxious

## Attachment Style Indicators

**Secure** (0-1 scale):
- Comfortable with intimacy and independence
- Trusts others, communicates needs clearly
- Can handle conflict constructively
- Has healthy boundaries

**Anxious** (0-1 scale):
- Needs frequent reassurance
- Worries about relationships
- May be clingy or possessive
- Fears abandonment

**Avoidant** (0-1 scale):
- Highly values independence
- Uncomfortable with vulnerability
- May withdraw during conflict
- Keeps emotional distance

## Values Examples
family, adventure, growth, stability, freedom, creativity, authenticity, success, service, knowledge, health, spirituality, community, tradition, innovation, justice, beauty, power, security, excitement

## Relationship Insights

**Communication Style:**
- direct: Says what they mean, straightforward
- indirect: Hints, reads between lines
- expressive: Shares feelings openly
- reserved: Keeps feelings private

**Conflict Style:**
- collaborative: Works together to solve issues
- avoidant: Withdraws, doesn't like confrontation
- assertive: Stands ground, addresses issues directly
- accommodating: Gives in to keep peace

## Red Flags (Be Conservative!)
- poor_boundaries
- blame_others
- black_white_thinking
- possessiveness
- controlling_tendencies
- victim_mentality
- emotional_volatility
- lack_of_accountability
- narcissistic_traits
- people_pleasing (extreme)

## Green Flags
- self_awareness
- emotional_maturity
- growth_mindset
- healthy_boundaries
- takes_accountability
- empathy
- secure_attachment
- effective_communication
- resilience
- authenticity

# IMPORTANT RULES

1. **Be Evidence-Based**: Only extract what you can reasonably infer from their actual words
2. **Don't Over-Extract**: If a trait isn't relevant to the response, don't include it
3. **Avoid Stereotypes**: Don't make assumptions based on demographics
4. **Nuance Matters**: People are complex - use the full 0-1 scale, not just extremes
5. **Context is Key**: Consider the question being asked when interpreting their answer
6. **Conservative on Red Flags**: Only flag clear warning signs, not minor quirks
7. **Liberal on Green Flags**: Celebrate positive indicators when you see them
8. **Confidence Score**: Be honest about how much data you're working with

# EXAMPLE EXTRACTIONS

**Question**: "How do you handle conflict in relationships?"
**Response**: "I used to avoid conflict at all costs, but I've learned that's not healthy. Now I try to address things directly but calmly. I still get anxious before difficult conversations, but I push through because I know it's important."

**Extraction**:
{
  "big_five_updates": {
    "agreeableness": 0.6,
    "neuroticism": 0.5,
    "conscientiousness": 0.7
  },
  "attachment_indicators": {
    "secure": 0.6,
    "anxious": 0.4
  },
  "relationship_insights": {
    "conflict_style": "collaborative",
    "communication_style": "direct"
  },
  "emotional_intelligence": {
    "self_awareness": 0.8,
    "emotional_regulation": 0.6
  },
  "green_flags": ["self_awareness", "growth_mindset", "emotional_maturity"],
  "confidence_score": 0.8,
  "reasoning": "Strong self-awareness shown by recognizing past avoidance pattern and actively working to change. Shows growth mindset and commitment to healthy communication despite discomfort. Some anxiety present but well-managed."
}

Now analyze the user's response and return your extraction as valid JSON.`;
}

/**
 * Parse the extraction response from Claude
 */
export interface ExtractionResult {
  big_five_updates?: Record<string, number>;
  attachment_indicators?: Record<string, number>;
  values_mentioned?: string[];
  interests_mentioned?: Record<string, number>;
  relationship_insights?: Record<string, string>;
  lifestyle_indicators?: Record<string, string>;
  emotional_intelligence?: Record<string, number>;
  cognitive_indicators?: Record<string, string>;
  red_flags?: string[];
  green_flags?: string[];
  confidence_score?: number;
  reasoning?: string;
}

export function parseExtractionResponse(response: string): ExtractionResult | null {
  try {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error('Failed to parse extraction response:', error);
    console.error('Response was:', response);
    return null;
  }
}
