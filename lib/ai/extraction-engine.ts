import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Extraction result types
export interface ExtractionResult {
  framework: string;
  traits: Record<string, {
    value: any;
    confidence: number; // 0-1
    evidence: string[];
  }>;
}

interface SafetySignal {
  category: 'attached' | 'narcissism' | 'machiavellianism' | 'psychopathy' | 'inconsistency';
  severity: number; // 0-100
  evidence: string;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a psychometric extraction engine for a sophisticated matchmaking platform. Your role is to analyze user responses and extract personality traits, attachment patterns, cognitive indicators, and values with high accuracy.

# Frameworks You Extract

1. **Big Five** (0-100 scale for each):
   - Openness (curiosity, creativity, openness to experience)
   - Conscientiousness (organization, reliability, self-discipline)
   - Extraversion (sociability, assertiveness, energy from others)
   - Agreeableness (compassion, cooperation, trust)
   - Neuroticism (emotional stability, anxiety, stress response)

2. **Attachment Style**:
   - Secure (comfortable with intimacy and independence)
   - Anxious (fears abandonment, seeks reassurance)
   - Avoidant (values independence, uncomfortable with closeness)
   - Disorganized (conflicted, trauma indicators)

3. **Emotional Intelligence** (0-100 scale for each):
   - Self-awareness
   - Self-regulation
   - Motivation
   - Empathy
   - Social skills
   - Overall EQ

4. **Cognitive Indicators** (0-100 scale):
   - Vocabulary level (word choice sophistication)
   - Cognitive complexity (nuanced thinking, both-and vs either-or)
   - Abstract reasoning (ability to work with abstract concepts)
   - IQ estimate range: 'average', 'above_average', 'high', 'very_high'

5. **MBTI Indicators**:
   - E/I (Extraversion vs Introversion)
   - S/N (Sensing vs Intuition)
   - T/F (Thinking vs Feeling)
   - J/P (Judging vs Perceiving)

6. **Enneagram** (1-9, with wing and health level):
   - Type (1-9)
   - Wing
   - Health level (1=healthy, 9=unhealthy)

7. **DISC**:
   - Dominance (0-100)
   - Influence (0-100)
   - Steadiness (0-100)
   - Conscientiousness (0-100)

8. **Love Languages** (rank 1-5):
   - Words of Affirmation
   - Acts of Service
   - Gifts
   - Quality Time
   - Physical Touch

9. **Core Values** (extract top 5):
   - Examples: family, growth, faith, adventure, security, achievement, creativity, service, etc.

10. **Life Vision**:
    - Career trajectory
    - Family goals
    - Lifestyle preferences
    - Geographic flexibility
    - Deal-breakers

# Safety Screening

Look for red flags in these categories:

1. **Married/Attached Indicators**:
   - Time availability patterns (only free certain times)
   - Living situation vagueness or contradictions
   - Social life compartmentalization
   - Future commitment avoidance
   - Weekend/holiday availability issues

2. **Dark Triad**:
   - **Narcissism**: Credit-taking, blame avoidance, grandiosity, lack of empathy in stories, need for admiration
   - **Machiavellianism**: Manipulation comfort, cynicism, strategic relationship language, ends-justify-means
   - **Psychopathy**: Shallow emotional expression, lack of remorse, impulsivity, irresponsibility, emotional coldness

3. **Inconsistencies**:
   - Stories that don't align
   - Stated values vs described behaviors
   - Timeline contradictions
   - Fact changes across questions

# Linguistic Analysis

Extract cognitive indicators from:
- **Vocabulary**: Sophisticated vs basic word choices
- **Sentence structure**: Complex vs simple, varied vs repetitive
- **Abstract thinking**: Can they discuss concepts, or only concrete specifics?
- **Emotional vocabulary**: Range and depth of emotion words
- **Pronoun usage**: "I" vs "we" (self-focus vs collaborative)
- **Blame patterns**: "They did X to me" vs "I contributed by..."

# Confidence Scoring

- **High (0.8-1.0)**: Multiple clear signals, consistent across responses
- **Medium (0.5-0.8)**: Some signals, generally consistent
- **Low (0.3-0.5)**: Limited data, ambiguous signals
- **Very Low (<0.3)**: Insufficient data

# Output Format

Return a JSON object with your extractions and confidence scores. For each framework, provide:
- The extracted value/score
- Confidence level (0-1)
- Evidence (specific quotes or observations)

# Example Output:

{
  "big_five": {
    "openness": {
      "value": 75,
      "confidence": 0.8,
      "evidence": ["Mentioned changing mind about major belief", "Enjoys philosophical conversations", "Seeks novelty on weekends"]
    },
    "extraversion": {
      "value": 35,
      "confidence": 0.9,
      "evidence": ["Recharges alone", "Prefers small gatherings", "Describes self as introvert"]
    }
  },
  "attachment": {
    "style": {
      "value": "secure",
      "confidence": 0.7,
      "evidence": ["Comfortable with vulnerability", "Balanced view of past relationships", "Reaches out but also okay alone"]
    }
  },
  "safety_flags": [
    {
      "category": "inconsistency",
      "severity": 30,
      "evidence": "Said lives alone but mentioned 'we' when describing home setup - needs clarification"
    }
  ]
}

# Important
- Be precise and evidence-based
- Don't over-infer from limited data - mark confidence as low
- Look for patterns across multiple responses
- Flag inconsistencies for follow-up
- Consider cultural and individual differences`;

export async function extractFromConversation(
  questionId: string,
  questionText: string,
  userResponse: string,
  conversationHistory: Array<{ question: string; answer: string }>
): Promise<{
  extractions: ExtractionResult[];
  safetyFlags: SafetySignal[];
  needsFollowUp: boolean;
  followUpSuggestion?: string;
}> {
  // Build context from conversation history
  const historyContext = conversationHistory
    .map(h => `Q: ${h.question}\nA: ${h.answer}`)
    .join('\n\n');

  const prompt = `# Conversation History So Far

${historyContext}

# Current Question
${questionText}

# User's Response
${userResponse}

# Your Task

Analyze this response (and the full conversation context) to extract personality traits, attachment patterns, values, and cognitive indicators. Also flag any safety concerns.

Consider:
1. What does this response reveal about their personality?
2. Are there linguistic markers (vocabulary, structure, emotional depth)?
3. Does this align with or contradict earlier responses?
4. Are there any red flags?
5. Is the response deep enough, or should we ask a follow-up?

Return your analysis as a JSON object following the format specified in your system prompt.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = response.content[0];
  const analysisText = content.type === 'text' ? content.text : '';

  // Parse the JSON response
  try {
    const analysis = JSON.parse(analysisText);

    // Convert the analysis into our structured format
    const extractions: ExtractionResult[] = [];
    const safetyFlags: SafetySignal[] = analysis.safety_flags || [];

    // Extract each framework
    for (const [framework, traits] of Object.entries(analysis)) {
      if (framework !== 'safety_flags' && framework !== 'needs_follow_up' && framework !== 'follow_up_suggestion') {
        extractions.push({
          framework,
          traits: traits as any
        });
      }
    }

    return {
      extractions,
      safetyFlags,
      needsFollowUp: analysis.needs_follow_up || false,
      followUpSuggestion: analysis.follow_up_suggestion
    };
  } catch (error) {
    console.error('Failed to parse extraction response:', error);
    console.error('Raw response:', analysisText);

    // Return empty result on parse failure
    return {
      extractions: [],
      safetyFlags: [],
      needsFollowUp: false
    };
  }
}

// Aggregate extractions across the full conversation
export async function aggregateExtractions(
  allExtractions: ExtractionResult[]
): Promise<{
  profile: any;
  safetyScreening: any;
  confidenceLevels: Record<string, number>;
}> {
  // This function will combine all individual extractions into a final profile
  // For now, this is a placeholder - you'll implement the aggregation logic
  // that weighs multiple signals, averages scores, and selects highest-confidence values

  const profile: any = {
    big_five: {},
    attachment: {},
    eq: {},
    cognitive: {},
    mbti: {},
    enneagram: {},
    disc: {},
    love_languages: {},
    values: {},
    life_vision: {}
  };

  const safetyScreening: any = {
    attached_risk_score: 0,
    narcissism_score: 0,
    machiavellianism_score: 0,
    psychopathy_score: 0,
    inconsistency_count: 0,
    overall_risk_level: 'green'
  };

  // Aggregate logic here (weighted averaging, confidence-based selection, etc.)
  // This is complex and will be implemented based on the specific extraction patterns

  return {
    profile,
    safetyScreening,
    confidenceLevels: {}
  };
}
