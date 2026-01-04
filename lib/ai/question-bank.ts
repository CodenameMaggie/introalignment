// Question Bank with Extraction Mappings for IntroAlignment

export interface ExtractionTarget {
  framework: string; // 'big_five', 'attachment', 'eq', 'enneagram', etc.
  trait: string; // specific trait or dimension
  indicators: string[]; // what to look for in the response
}

export interface Question {
  id: string;
  chapter: number;
  text: string;
  follow_ups?: string[]; // conditional follow-up questions
  extracts: ExtractionTarget[];
  required: boolean; // must be answered before moving on
}

export const QUESTION_BANK: Question[] = [
  // CHAPTER 1: YOUR WORLD
  {
    id: 'world_good_day',
    chapter: 1,
    text: "Let's start with something simple. Tell me about a really good day for you. What does it look like from morning to night?",
    extracts: [
      {
        framework: 'big_five',
        trait: 'extraversion',
        indicators: ['social activities', 'alone time', 'people interactions', 'solitude preference']
      },
      {
        framework: 'big_five',
        trait: 'openness',
        indicators: ['variety', 'routine', 'novelty', 'familiar activities']
      },
      {
        framework: 'lifestyle',
        trait: 'preferences',
        indicators: ['activities', 'pace', 'environment', 'energy patterns']
      }
    ],
    required: true
  },
  {
    id: 'world_free_weekend',
    chapter: 1,
    text: "When you have a completely free weekend with no obligations, what do you find yourself doing?",
    extracts: [
      {
        framework: 'big_five',
        trait: 'extraversion',
        indicators: ['social plans', 'solo activities', 'energy recharge methods']
      },
      {
        framework: 'big_five',
        trait: 'openness',
        indicators: ['spontaneity', 'adventure', 'comfort zone']
      },
      {
        framework: 'values',
        trait: 'priorities',
        indicators: ['how time is spent', 'what brings joy']
      }
    ],
    required: true
  },
  {
    id: 'world_home_space',
    chapter: 1,
    text: "What does your home look like? How do you like your space to feel?",
    extracts: [
      {
        framework: 'big_five',
        trait: 'conscientiousness',
        indicators: ['organization', 'cleanliness', 'structure', 'minimalism vs maximalism']
      },
      {
        framework: 'personality',
        trait: 'expression',
        indicators: ['aesthetic choices', 'comfort priorities', 'personal expression']
      }
    ],
    required: false
  },
  {
    id: 'world_planner_spontaneous',
    chapter: 1,
    text: "Are you more of a planner or do you prefer to see where the day takes you?",
    extracts: [
      {
        framework: 'mbti',
        trait: 'judging_perceiving',
        indicators: ['structure preference', 'flexibility', 'planning habits']
      },
      {
        framework: 'big_five',
        trait: 'conscientiousness',
        indicators: ['organization', 'spontaneity', 'control needs']
      }
    ],
    required: true
  },

  // CHAPTER 2: YOUR STORY
  {
    id: 'story_family_background',
    chapter: 2,
    text: "Tell me a bit about where you grew up. What was your family like?",
    extracts: [
      {
        framework: 'attachment',
        trait: 'origins',
        indicators: ['family dynamics', 'emotional atmosphere', 'stability', 'support systems']
      },
      {
        framework: 'values',
        trait: 'formation',
        indicators: ['cultural background', 'family values', 'formative experiences']
      }
    ],
    required: true
  },
  {
    id: 'story_biggest_influence',
    chapter: 2,
    text: "Who had the biggest influence on who you've become?",
    extracts: [
      {
        framework: 'values',
        trait: 'core_values',
        indicators: ['role models', 'admired qualities', 'learned values']
      },
      {
        framework: 'attachment',
        trait: 'figures',
        indicators: ['attachment relationships', 'trust formation', 'support figures']
      }
    ],
    required: true
  },
  {
    id: 'story_parents_right_different',
    chapter: 2,
    text: "What's something your parents got right? And something you'd do differently?",
    extracts: [
      {
        framework: 'eq',
        trait: 'self_awareness',
        indicators: ['reflection depth', 'insight', 'nuanced thinking']
      },
      {
        framework: 'values',
        trait: 'parenting_philosophy',
        indicators: ['what to preserve', 'what to change', 'parenting values']
      },
      {
        framework: 'cognitive',
        trait: 'complexity',
        indicators: ['ability to hold complexity', 'both-and thinking']
      }
    ],
    required: false
  },
  {
    id: 'story_family_conflict',
    chapter: 2,
    text: "How did the people in your family handle disagreements?",
    extracts: [
      {
        framework: 'attachment',
        trait: 'conflict_patterns',
        indicators: ['conflict avoidance', 'healthy conflict', 'emotional regulation']
      },
      {
        framework: 'communication',
        trait: 'style',
        indicators: ['directness', 'passive-aggressive patterns', 'resolution methods']
      }
    ],
    required: true
  },

  // CHAPTER 3: YOUR RELATIONSHIPS
  {
    id: 'relationships_closest_friendship',
    chapter: 3,
    text: "Tell me about your closest friendship. How did it develop?",
    extracts: [
      {
        framework: 'attachment',
        trait: 'style',
        indicators: ['trust formation', 'vulnerability', 'depth of connection']
      },
      {
        framework: 'eq',
        trait: 'social_skills',
        indicators: ['relationship building', 'maintenance', 'reciprocity']
      }
    ],
    required: true
  },
  {
    id: 'relationships_difficulty_reaching_out',
    chapter: 3,
    text: "When you're going through something difficult, do you tend to reach out to people or need some space first?",
    extracts: [
      {
        framework: 'attachment',
        trait: 'style',
        indicators: ['anxious (reaching out)', 'avoidant (space)', 'secure (balanced)']
      },
      {
        framework: 'eq',
        trait: 'self_regulation',
        indicators: ['coping mechanisms', 'emotional processing', 'support seeking']
      }
    ],
    required: true
  },
  {
    id: 'relationships_past_lesson',
    chapter: 3,
    text: "What's something a past relationship taught you about yourself?",
    extracts: [
      {
        framework: 'eq',
        trait: 'self_awareness',
        indicators: ['insight depth', 'growth orientation', 'self-reflection']
      },
      {
        framework: 'attachment',
        trait: 'patterns',
        indicators: ['relationship patterns', 'growth areas', 'awareness of needs']
      },
      {
        framework: 'safety',
        trait: 'blame_patterns',
        indicators: ['responsibility taking', 'blame externalization', 'victim mentality']
      }
    ],
    required: true
  },
  {
    id: 'relationships_trust',
    chapter: 3,
    text: "What does trust look like to you? How does someone earn it?",
    extracts: [
      {
        framework: 'attachment',
        trait: 'security',
        indicators: ['trust formation speed', 'requirements', 'boundaries']
      },
      {
        framework: 'values',
        trait: 'core_values',
        indicators: ['integrity markers', 'reliability expectations', 'trust components']
      }
    ],
    required: true
  },

  // CHAPTER 4: YOUR MIND
  {
    id: 'mind_changed_mind',
    chapter: 4,
    text: "What's something you've changed your mind about in recent years?",
    extracts: [
      {
        framework: 'big_five',
        trait: 'openness',
        indicators: ['intellectual flexibility', 'growth mindset', 'willingness to evolve']
      },
      {
        framework: 'cognitive',
        trait: 'complexity',
        indicators: ['depth of reasoning', 'nuanced thinking', 'intellectual curiosity']
      }
    ],
    required: true
  },
  {
    id: 'mind_decision_making',
    chapter: 4,
    text: "When you're trying to make a big decision, how do you typically work through it?",
    extracts: [
      {
        framework: 'mbti',
        trait: 'thinking_feeling',
        indicators: ['logic vs emotion', 'analytical vs values-based', 'head vs heart']
      },
      {
        framework: 'cognitive',
        trait: 'approach',
        indicators: ['systematic vs intuitive', 'data gathering', 'decision confidence']
      }
    ],
    required: true
  },
  {
    id: 'mind_conversations',
    chapter: 4,
    text: "What kind of conversations energize you?",
    extracts: [
      {
        framework: 'cognitive',
        trait: 'interests',
        indicators: ['intellectual depth', 'topics of interest', 'engagement level']
      },
      {
        framework: 'big_five',
        trait: 'openness',
        indicators: ['abstract vs concrete', 'philosophical vs practical', 'depth preference']
      },
      {
        framework: 'communication',
        trait: 'style',
        indicators: ['conversation preferences', 'intellectual compatibility markers']
      }
    ],
    required: true
  },
  {
    id: 'mind_learning',
    chapter: 4,
    text: "Is there something you're curious about or learning right now?",
    extracts: [
      {
        framework: 'big_five',
        trait: 'openness',
        indicators: ['curiosity', 'learning orientation', 'intellectual engagement']
      },
      {
        framework: 'cognitive',
        trait: 'interests',
        indicators: ['specific interests', 'learning style', 'intellectual depth']
      }
    ],
    required: false
  },

  // CHAPTER 5: YOUR HEART
  {
    id: 'heart_proud_of',
    chapter: 5,
    text: "What's something you're really proud of, even if you don't talk about it much?",
    extracts: [
      {
        framework: 'values',
        trait: 'core_values',
        indicators: ['what matters', 'source of pride', 'humility vs grandiosity']
      },
      {
        framework: 'eq',
        trait: 'self_awareness',
        indicators: ['self-concept', 'achievement orientation', 'internal values']
      },
      {
        framework: 'safety',
        trait: 'narcissism',
        indicators: ['credit-taking', 'grandiosity markers', 'humility']
      }
    ],
    required: true
  },
  {
    id: 'heart_working_on',
    chapter: 5,
    text: "What's something you're still working on about yourself?",
    extracts: [
      {
        framework: 'eq',
        trait: 'self_awareness',
        indicators: ['insight depth', 'growth orientation', 'authenticity']
      },
      {
        framework: 'attachment',
        trait: 'growth_areas',
        indicators: ['vulnerability', 'self-reflection', 'personal development']
      },
      {
        framework: 'safety',
        trait: 'defensiveness',
        indicators: ['defensiveness', 'openness to growth', 'self-honesty']
      }
    ],
    required: true
  },
  {
    id: 'heart_show_up',
    chapter: 5,
    text: "When someone you care about is hurting, how do you tend to show up for them?",
    extracts: [
      {
        framework: 'eq',
        trait: 'empathy',
        indicators: ['empathy depth', 'emotional attunement', 'support style']
      },
      {
        framework: 'love_languages',
        trait: 'expression',
        indicators: ['acts of service', 'words', 'presence', 'practical help']
      },
      {
        framework: 'attachment',
        trait: 'caregiving',
        indicators: ['emotional availability', 'support patterns', 'attunement']
      }
    ],
    required: true
  },
  {
    id: 'heart_feel_loved',
    chapter: 5,
    text: "What makes you feel most loved and appreciated?",
    extracts: [
      {
        framework: 'love_languages',
        trait: 'primary',
        indicators: ['words', 'acts', 'gifts', 'time', 'touch']
      },
      {
        framework: 'attachment',
        trait: 'needs',
        indicators: ['emotional needs', 'appreciation style', 'connection needs']
      }
    ],
    required: true
  },
  {
    id: 'heart_hard_in_relationships',
    chapter: 5,
    text: "What's something that's hard for you in relationships?",
    extracts: [
      {
        framework: 'eq',
        trait: 'self_awareness',
        indicators: ['vulnerability', 'self-knowledge', 'honesty']
      },
      {
        framework: 'attachment',
        trait: 'challenges',
        indicators: ['attachment wounds', 'growth edges', 'patterns']
      },
      {
        framework: 'safety',
        trait: 'authenticity',
        indicators: ['genuine vs deflection', 'depth of insight', 'defensiveness']
      }
    ],
    required: true
  },

  // CHAPTER 6: YOUR FUTURE
  {
    id: 'future_five_years',
    chapter: 6,
    text: "If you imagine your life five years from now and it's going really well, what does that look like?",
    extracts: [
      {
        framework: 'life_vision',
        trait: 'goals',
        indicators: ['career', 'family', 'lifestyle', 'location', 'values in action']
      },
      {
        framework: 'values',
        trait: 'priorities',
        indicators: ['what success means', 'life priorities', 'vision clarity']
      }
    ],
    required: true
  },
  {
    id: 'future_partner_role',
    chapter: 6,
    text: "What role does a partner play in that vision?",
    extracts: [
      {
        framework: 'attachment',
        trait: 'partnership_model',
        indicators: ['interdependence', 'independence', 'partnership expectations']
      },
      {
        framework: 'life_vision',
        trait: 'partnership',
        indicators: ['partner role', 'shared goals', 'relationship expectations']
      }
    ],
    required: true
  },
  {
    id: 'future_children',
    chapter: 6,
    text: "How do you feel about children?",
    extracts: [
      {
        framework: 'life_vision',
        trait: 'family_goals',
        indicators: ['wants children', 'has children', 'timeline', 'family priorities']
      }
    ],
    required: true
  },
  {
    id: 'future_dealbreakers',
    chapter: 6,
    text: "Is there anything that would be a true deal-breaker for you in a partner?",
    extracts: [
      {
        framework: 'values',
        trait: 'non_negotiables',
        indicators: ['boundaries', 'core values', 'requirements']
      },
      {
        framework: 'matching',
        trait: 'filters',
        indicators: ['hard filters', 'compatibility requirements']
      }
    ],
    required: true
  },
  {
    id: 'future_hoping_to_find',
    chapter: 6,
    text: "What are you hoping to find here?",
    extracts: [
      {
        framework: 'intentions',
        trait: 'readiness',
        indicators: ['relationship readiness', 'expectations', 'seriousness']
      },
      {
        framework: 'safety',
        trait: 'red_flags',
        indicators: ['inappropriate expectations', 'unrealistic standards', 'commitment level']
      }
    ],
    required: true
  },

  // CHAPTER 7: THE DETAILS
  {
    id: 'details_location',
    chapter: 7,
    text: "Where are you based?",
    extracts: [
      {
        framework: 'demographics',
        trait: 'location',
        indicators: ['city', 'country', 'region']
      }
    ],
    required: true
  },
  {
    id: 'details_geographic_flexibility',
    chapter: 7,
    text: "Are you open to meeting someone in another city, or looking for someone nearby?",
    extracts: [
      {
        framework: 'matching',
        trait: 'geographic_flexibility',
        indicators: ['distance openness', 'relocation willingness', 'local preference']
      }
    ],
    required: true
  },
  {
    id: 'details_birth_info',
    chapter: 7,
    text: "Do you know your birthday - and your birth time, if you happen to know it?",
    extracts: [
      {
        framework: 'demographics',
        trait: 'birth_data',
        indicators: ['birth date', 'birth time', 'birth location']
      }
    ],
    required: true
  },
  {
    id: 'details_age_preference',
    chapter: 7,
    text: "What's your age range preference for a partner?",
    extracts: [
      {
        framework: 'matching',
        trait: 'preferences',
        indicators: ['age range', 'flexibility', 'preferences']
      }
    ],
    required: true
  }
];

// Chapter metadata
export const CHAPTERS = [
  {
    number: 1,
    title: "Your World",
    description: "Understanding your daily life and preferences"
  },
  {
    number: 2,
    title: "Your Story",
    description: "Exploring your background and influences"
  },
  {
    number: 3,
    title: "Your Relationships",
    description: "Learning about how you connect with others"
  },
  {
    number: 4,
    title: "Your Mind",
    description: "Understanding how you think and decide"
  },
  {
    number: 5,
    title: "Your Heart",
    description: "Discovering your emotional world"
  },
  {
    number: 6,
    title: "Your Future",
    description: "Envisioning what you're building toward"
  },
  {
    number: 7,
    title: "The Details",
    description: "Gathering practical information"
  }
];

// Get questions by chapter
export function getQuestionsByChapter(chapter: number): Question[] {
  return QUESTION_BANK.filter(q => q.chapter === chapter);
}

// Get next unanswered question
export function getNextQuestion(answeredQuestionIds: string[]): Question | null {
  return QUESTION_BANK.find(q => !answeredQuestionIds.includes(q.id)) || null;
}

// Check if conversation is complete
export function isConversationComplete(answeredQuestionIds: string[]): boolean {
  const requiredQuestions = QUESTION_BANK.filter(q => q.required);
  return requiredQuestions.every(q => answeredQuestionIds.includes(q.id));
}
