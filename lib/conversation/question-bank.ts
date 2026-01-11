/**
 * SovereigntyIntroAlignment Conversation Question Bank
 * 49 questions across 7 chapters
 * Each question designed to extract specific psychological insights
 */

export interface ConversationQuestion {
  id: string;
  chapter: number;
  questionNumber: number;
  question: string;
  extractionTargets: string[];
  followUpHints?: string[];
}

export const QUESTION_BANK: ConversationQuestion[] = [
  // =====================================================
  // CHAPTER 1: YOUR WORLD (Questions 1-7)
  // =====================================================
  {
    id: 'ch1_q1',
    chapter: 1,
    questionNumber: 1,
    question: "Let's start with the basics - what does a typical day look like for you?",
    extractionTargets: ['lifestyle_indicators', 'activity_level', 'social_preference', 'work_life_balance'],
    followUpHints: [
      "That sounds interesting! What part of your day do you look forward to most?",
      "How do you usually wind down after a day like that?"
    ]
  },
  {
    id: 'ch1_q2',
    chapter: 1,
    questionNumber: 2,
    question: "Where are you currently based, and how do you feel about where you live?",
    extractionTargets: ['geographic_flexibility', 'lifestyle_indicators', 'openness', 'values'],
    followUpHints: [
      "What do you love most about living there?",
      "Could you see yourself somewhere else, or are you pretty rooted?"
    ]
  },
  {
    id: 'ch1_q3',
    chapter: 1,
    questionNumber: 3,
    question: "Tell me about your work or what keeps you busy these days.",
    extractionTargets: ['conscientiousness', 'career_trajectory', 'values', 'interests'],
    followUpHints: [
      "What drew you to that field?",
      "What's the most rewarding part of what you do?"
    ]
  },
  {
    id: 'ch1_q4',
    chapter: 1,
    questionNumber: 4,
    question: "Outside of work, what do you do for fun?",
    extractionTargets: ['interests', 'extraversion', 'openness', 'activity_level'],
    followUpHints: [
      "How did you get into that?",
      "Do you prefer doing that solo or with others?"
    ]
  },
  {
    id: 'ch1_q5',
    chapter: 1,
    questionNumber: 5,
    question: "Are you more of a homebody or someone who's always out and about?",
    extractionTargets: ['extraversion', 'social_preference', 'lifestyle_indicators'],
    followUpHints: [
      "What's your ideal weekend?",
      "Has that changed over time?"
    ]
  },
  {
    id: 'ch1_q6',
    chapter: 1,
    questionNumber: 6,
    question: "Do you have any pets, or are you a plant parent? Or neither?",
    extractionTargets: ['lifestyle_indicators', 'nurturing_tendencies', 'agreeableness'],
    followUpHints: [
      "Tell me about them!",
      "Have you always been an animal/plant person?"
    ]
  },
  {
    id: 'ch1_q7',
    chapter: 1,
    questionNumber: 7,
    question: "What's something you're working on improving in your life right now?",
    extractionTargets: ['conscientiousness', 'openness', 'self_awareness', 'growth_mindset'],
    followUpHints: [
      "What inspired you to focus on that?",
      "How's it going so far?"
    ]
  },

  // =====================================================
  // CHAPTER 2: YOUR STORY (Questions 8-14)
  // =====================================================
  {
    id: 'ch2_q1',
    chapter: 2,
    questionNumber: 8,
    question: "Where did you grow up, and what was that like for you?",
    extractionTargets: ['attachment_style', 'values', 'family_dynamics', 'openness'],
    followUpHints: [
      "What's something from your childhood that shaped who you are?",
      "Do you still have ties there?"
    ]
  },
  {
    id: 'ch2_q2',
    chapter: 2,
    questionNumber: 9,
    question: "Tell me about your family - are you close with them?",
    extractionTargets: ['attachment_style', 'family_goals', 'relationship_patterns', 'agreeableness'],
    followUpHints: [
      "What role do you play in your family?",
      "How has that relationship evolved?"
    ]
  },
  {
    id: 'ch2_q3',
    chapter: 2,
    questionNumber: 10,
    question: "What's a defining moment or experience that made you who you are today?",
    extractionTargets: ['resilience', 'self_awareness', 'values', 'emotional_intelligence'],
    followUpHints: [
      "How did that change your perspective?",
      "Looking back, what did you learn from that?"
    ]
  },
  {
    id: 'ch2_q4',
    chapter: 2,
    questionNumber: 11,
    question: "Have you had any major plot twists in life - career changes, big moves, unexpected turns?",
    extractionTargets: ['openness', 'risk_tolerance', 'adaptability', 'neuroticism'],
    followUpHints: [
      "What prompted that change?",
      "How do you feel about it now?"
    ]
  },
  {
    id: 'ch2_q5',
    chapter: 2,
    questionNumber: 12,
    question: "Is there a person who's had a significant influence on your life?",
    extractionTargets: ['values', 'attachment_style', 'relationship_patterns'],
    followUpHints: [
      "What did they teach you?",
      "Are they still in your life?"
    ]
  },
  {
    id: 'ch2_q6',
    chapter: 2,
    questionNumber: 13,
    question: "What's something you used to believe that you've completely changed your mind about?",
    extractionTargets: ['openness', 'growth_mindset', 'cognitive_flexibility', 'self_awareness'],
    followUpHints: [
      "What caused that shift?",
      "How did that feel?"
    ]
  },
  {
    id: 'ch2_q7',
    chapter: 2,
    questionNumber: 14,
    question: "If you could go back and give your younger self one piece of advice, what would it be?",
    extractionTargets: ['wisdom', 'self_awareness', 'emotional_intelligence', 'values'],
    followUpHints: [
      "Do you think you would have listened?",
      "What made you learn that lesson?"
    ]
  },

  // =====================================================
  // CHAPTER 3: YOUR RELATIONSHIPS (Questions 15-21)
  // =====================================================
  {
    id: 'ch3_q1',
    chapter: 3,
    questionNumber: 15,
    question: "What does your social circle look like - big group, tight-knit few, or somewhere in between?",
    extractionTargets: ['extraversion', 'social_preference', 'relationship_patterns'],
    followUpHints: [
      "What do you value most in your friendships?",
      "How do you prefer to spend time with friends?"
    ]
  },
  {
    id: 'ch3_q2',
    chapter: 3,
    questionNumber: 16,
    question: "How do you typically handle conflict in relationships?",
    extractionTargets: ['conflict_style', 'emotional_intelligence', 'agreeableness', 'neuroticism', 'communication_preference'],
    followUpHints: [
      "Has that always been your approach?",
      "What works best for you when tensions arise?"
    ]
  },
  {
    id: 'ch3_q3',
    chapter: 3,
    questionNumber: 17,
    question: "When you're going through something difficult, do you reach out or retreat?",
    extractionTargets: ['attachment_style', 'emotional_intelligence', 'coping_mechanisms', 'independence_level'],
    followUpHints: [
      "Why do you think you do that?",
      "Who do you usually turn to?"
    ]
  },
  {
    id: 'ch3_q4',
    chapter: 3,
    questionNumber: 18,
    question: "What's your communication style - are you an open book, more reserved, or does it depend?",
    extractionTargets: ['communication_preference', 'extraversion', 'openness', 'vulnerability'],
    followUpHints: [
      "When do you open up most?",
      "Is that something you're comfortable with?"
    ]
  },
  {
    id: 'ch3_q5',
    chapter: 3,
    questionNumber: 19,
    question: "Tell me about a past relationship that taught you something important.",
    extractionTargets: ['relationship_patterns', 'attachment_style', 'self_awareness', 'growth_mindset', 'red_flags', 'green_flags'],
    followUpHints: [
      "What did you learn about yourself?",
      "How has that shaped what you're looking for now?"
    ]
  },
  {
    id: 'ch3_q6',
    chapter: 3,
    questionNumber: 20,
    question: "How do you show someone you care about them?",
    extractionTargets: ['love_languages', 'affection_style', 'emotional_expression'],
    followUpHints: [
      "What about how you like to receive care?",
      "Are those the same or different?"
    ]
  },
  {
    id: 'ch3_q7',
    chapter: 3,
    questionNumber: 21,
    question: "What's a dealbreaker for you in any relationship - romantic or otherwise?",
    extractionTargets: ['values', 'boundaries', 'red_flags', 'self_awareness'],
    followUpHints: [
      "Has that always been a dealbreaker, or did you learn that?",
      "What makes that so important to you?"
    ]
  },

  // =====================================================
  // CHAPTER 4: YOUR MIND (Questions 22-28)
  // =====================================================
  {
    id: 'ch4_q1',
    chapter: 4,
    questionNumber: 22,
    question: "How do you usually make big decisions?",
    extractionTargets: ['decision_style', 'conscientiousness', 'neuroticism', 'cognitive_indicators'],
    followUpHints: [
      "Do you trust your gut, or do you need all the data?",
      "How long does it usually take you?"
    ]
  },
  {
    id: 'ch4_q2',
    chapter: 4,
    questionNumber: 23,
    question: "Are you more of a planner or do you go with the flow?",
    extractionTargets: ['conscientiousness', 'planning_style', 'openness', 'neuroticism'],
    followUpHints: [
      "How do you feel when plans change unexpectedly?",
      "What's your ideal balance?"
    ]
  },
  {
    id: 'ch4_q3',
    chapter: 4,
    questionNumber: 24,
    question: "What's something you're naturally curious about or love learning?",
    extractionTargets: ['openness', 'interests', 'intellectual_compatibility', 'growth_mindset'],
    followUpHints: [
      "When did you first get interested in that?",
      "How do you usually explore new topics?"
    ]
  },
  {
    id: 'ch4_q4',
    chapter: 4,
    questionNumber: 25,
    question: "Do you consider yourself more logical or emotional?",
    extractionTargets: ['cognitive_style', 'emotional_intelligence', 'decision_style'],
    followUpHints: [
      "Does that show up in how you solve problems?",
      "Has that changed over time?"
    ]
  },
  {
    id: 'ch4_q5',
    chapter: 4,
    questionNumber: 26,
    question: "How do you handle stress or pressure?",
    extractionTargets: ['neuroticism', 'coping_mechanisms', 'resilience', 'emotional_regulation'],
    followUpHints: [
      "What helps you decompress?",
      "Have you always coped this way?"
    ]
  },
  {
    id: 'ch4_q6',
    chapter: 4,
    questionNumber: 27,
    question: "Are you someone who needs a lot of alone time to recharge, or do you get energy from being around people?",
    extractionTargets: ['extraversion', 'social_preference', 'self_awareness'],
    followUpHints: [
      "What happens if you don't get enough of that?",
      "Has that always been true for you?"
    ]
  },
  {
    id: 'ch4_q7',
    chapter: 4,
    questionNumber: 28,
    question: "What's something most people don't understand about how you think or process things?",
    extractionTargets: ['self_awareness', 'cognitive_style', 'uniqueness', 'communication_needs'],
    followUpHints: [
      "How do you explain that to others?",
      "When did you realize that about yourself?"
    ]
  },

  // =====================================================
  // CHAPTER 5: YOUR HEART (Questions 29-35)
  // =====================================================
  {
    id: 'ch5_q1',
    chapter: 5,
    questionNumber: 29,
    question: "What do you value most in life?",
    extractionTargets: ['core_values', 'values_hierarchy', 'priorities'],
    followUpHints: [
      "Why is that so important to you?",
      "How do you make sure you're honoring that?"
    ]
  },
  {
    id: 'ch5_q2',
    chapter: 5,
    questionNumber: 30,
    question: "What makes you feel most fulfilled or purposeful?",
    extractionTargets: ['life_vision', 'values', 'meaning', 'self_awareness'],
    followUpHints: [
      "When was the last time you felt that way?",
      "What gets in the way of feeling that more often?"
    ]
  },
  {
    id: 'ch5_q3',
    chapter: 5,
    questionNumber: 31,
    question: "If money and time weren't an issue, what would you spend your life doing?",
    extractionTargets: ['values', 'interests', 'life_vision', 'priorities'],
    followUpHints: [
      "What's stopping you from doing some version of that now?",
      "How does that align with where you are today?"
    ]
  },
  {
    id: 'ch5_q4',
    chapter: 5,
    questionNumber: 32,
    question: "What's something you're deeply passionate about?",
    extractionTargets: ['interests', 'values', 'emotional_intensity', 'openness'],
    followUpHints: [
      "What is it about that that moves you?",
      "How does that show up in your daily life?"
    ]
  },
  {
    id: 'ch5_q5',
    chapter: 5,
    questionNumber: 33,
    question: "How important is physical affection and intimacy to you in a relationship?",
    extractionTargets: ['love_languages', 'affection_style', 'intimacy_needs', 'attachment_style'],
    followUpHints: [
      "What does that look like for you?",
      "How do you communicate those needs?"
    ]
  },
  {
    id: 'ch5_q6',
    chapter: 5,
    questionNumber: 34,
    question: "What does emotional intimacy mean to you?",
    extractionTargets: ['emotional_intelligence', 'vulnerability', 'relationship_needs', 'attachment_style'],
    followUpHints: [
      "How do you create that with someone?",
      "What helps you feel safe opening up?"
    ]
  },
  {
    id: 'ch5_q7',
    chapter: 5,
    questionNumber: 35,
    question: "What's something that always makes you feel grateful or brings you joy?",
    extractionTargets: ['values', 'positive_psychology', 'emotional_patterns', 'appreciation'],
    followUpHints: [
      "When did you last experience that?",
      "What is it about that that touches you?"
    ]
  },

  // =====================================================
  // CHAPTER 6: YOUR FUTURE (Questions 36-42)
  // =====================================================
  {
    id: 'ch6_q1',
    chapter: 6,
    questionNumber: 36,
    question: "Where do you see yourself in 5 years?",
    extractionTargets: ['life_vision', 'career_trajectory', 'planning_orientation', 'conscientiousness'],
    followUpHints: [
      "What steps are you taking to get there?",
      "How set are you on that vision?"
    ]
  },
  {
    id: 'ch6_q2',
    chapter: 6,
    questionNumber: 37,
    question: "Do you want kids? If so, what kind of parent do you think you'd be?",
    extractionTargets: ['family_goals', 'wants_children', 'values', 'parenting_style'],
    followUpHints: [
      "What shaped that decision for you?",
      "How important is it that a partner feels the same way?"
    ]
  },
  {
    id: 'ch6_q3',
    chapter: 6,
    questionNumber: 38,
    question: "How do you think about money and financial security?",
    extractionTargets: ['financial_philosophy', 'risk_tolerance', 'conscientiousness', 'values'],
    followUpHints: [
      "Are you a saver or a spender?",
      "What role does money play in your sense of security?"
    ]
  },
  {
    id: 'ch6_q4',
    chapter: 6,
    questionNumber: 39,
    question: "What does your ideal living situation look like - city, suburbs, country, somewhere else?",
    extractionTargets: ['lifestyle_preferences', 'geographic_flexibility', 'values', 'future_plans'],
    followUpHints: [
      "What draws you to that?",
      "Is that where you are now, or a future goal?"
    ]
  },
  {
    id: 'ch6_q5',
    chapter: 6,
    questionNumber: 40,
    question: "What's something you want to accomplish before you die?",
    extractionTargets: ['life_vision', 'values', 'ambition', 'priorities'],
    followUpHints: [
      "What would it mean to you to do that?",
      "What's the first step toward making that happen?"
    ]
  },
  {
    id: 'ch6_q6',
    chapter: 6,
    questionNumber: 41,
    question: "How do you balance personal ambition with relationship priorities?",
    extractionTargets: ['values', 'relationship_priorities', 'independence_level', 'conscientiousness'],
    followUpHints: [
      "Has that always been easy for you?",
      "What happens when those conflict?"
    ]
  },
  {
    id: 'ch6_q7',
    chapter: 6,
    questionNumber: 42,
    question: "What's your dream relationship dynamic - equals, complementary, something else?",
    extractionTargets: ['relationship_vision', 'values', 'partnership_style', 'gender_roles'],
    followUpHints: [
      "What does that look like day-to-day?",
      "What's most important to you in that dynamic?"
    ]
  },

  // =====================================================
  // CHAPTER 7: THE DETAILS (Questions 43-49)
  // =====================================================
  {
    id: 'ch7_q1',
    chapter: 7,
    questionNumber: 43,
    question: "Are you a morning person or a night owl?",
    extractionTargets: ['chronotype', 'lifestyle_indicators', 'daily_rhythms'],
    followUpHints: [
      "When do you feel most productive?",
      "How does that affect your daily routine?"
    ]
  },
  {
    id: 'ch7_q2',
    chapter: 7,
    questionNumber: 44,
    question: "What's your relationship with food - adventurous eater, creature of habit, health-focused?",
    extractionTargets: ['openness', 'lifestyle_preferences', 'health_consciousness'],
    followUpHints: [
      "Do you enjoy cooking?",
      "What's your go-to comfort food?"
    ]
  },
  {
    id: 'ch7_q3',
    chapter: 7,
    questionNumber: 45,
    question: "How do you feel about travel? Essential, nice but not necessary, or not your thing?",
    extractionTargets: ['openness', 'interests', 'lifestyle_preferences', 'financial_priorities'],
    followUpHints: [
      "What's your favorite place you've been?",
      "Where's on your bucket list?"
    ]
  },
  {
    id: 'ch7_q4',
    chapter: 7,
    questionNumber: 46,
    question: "What's your ideal Friday night?",
    extractionTargets: ['social_preference', 'lifestyle_indicators', 'extraversion', 'interests'],
    followUpHints: [
      "How often do you actually get to do that?",
      "Has that changed as you've gotten older?"
    ]
  },
  {
    id: 'ch7_q5',
    chapter: 7,
    questionNumber: 47,
    question: "Are you religious or spiritual, and does that play a role in your life?",
    extractionTargets: ['spirituality', 'values', 'lifestyle_indicators', 'compatibility_factors'],
    followUpHints: [
      "How important is it that a partner shares those beliefs?",
      "How does that show up in your daily life?"
    ]
  },
  {
    id: 'ch7_q6',
    chapter: 7,
    questionNumber: 48,
    question: "What's your phone/social media usage like - constantly connected, mindful user, or minimal?",
    extractionTargets: ['lifestyle_indicators', 'conscientiousness', 'modern_relationship_dynamics'],
    followUpHints: [
      "How do you feel about that?",
      "Do you ever try to change it?"
    ]
  },
  {
    id: 'ch7_q7',
    chapter: 7,
    questionNumber: 49,
    question: "Last question - what's something about you that I should know but probably wouldn't think to ask?",
    extractionTargets: ['self_awareness', 'uniqueness', 'openness', 'what_matters_most'],
    followUpHints: [
      "That's fascinating - tell me more!",
      "How does that affect your daily life or relationships?"
    ]
  }
];

// Helper function to get question by number
export function getQuestionByNumber(questionNumber: number): ConversationQuestion | undefined {
  return QUESTION_BANK.find(q => q.questionNumber === questionNumber);
}

// Helper function to get questions by chapter
export function getQuestionsByChapter(chapter: number): ConversationQuestion[] {
  return QUESTION_BANK.filter(q => q.chapter === chapter);
}

// Helper function to get chapter info
export function getChapterInfo(chapter: number) {
  const chapters = [
    { number: 1, title: 'Your World', emoji: '🌍', description: "Let's start with where you are in life right now" },
    { number: 2, title: 'Your Story', emoji: '📖', description: 'Everyone has a unique journey' },
    { number: 3, title: 'Your Relationships', emoji: '💞', description: 'How you connect with others' },
    { number: 4, title: 'Your Mind', emoji: '🧠', description: 'How you think and process the world' },
    { number: 5, title: 'Your Heart', emoji: '❤️', description: 'What you feel and value' },
    { number: 6, title: 'Your Future', emoji: '🚀', description: "Where you're headed" },
    { number: 7, title: 'The Details', emoji: '✨', description: 'The little things that matter' }
  ];

  return chapters.find(c => c.number === chapter);
}

// Total question count
export const TOTAL_QUESTIONS = QUESTION_BANK.length; // 49
