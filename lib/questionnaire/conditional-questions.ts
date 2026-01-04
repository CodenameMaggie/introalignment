// Conditional Questionnaire System
// Questions branch based on previous answers to get accurate personality data

export type QuestionType =
  | 'multiple_choice'
  | 'scale'
  | 'text'
  | 'yes_no'
  | 'ranking';

export type TraitMapping = {
  trait: string;
  framework: string;
  score: number; // How much this answer contributes to this trait
  confidence: number; // How confident we are in this mapping
};

export interface Answer {
  id: string;
  text: string;
  traitMappings: TraitMapping[];
  nextQuestionId?: string; // Conditional branching
  followUpQuestionId?: string; // Additional follow-up based on this answer
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  answers?: Answer[]; // For multiple choice
  scaleMin?: number; // For scale questions
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  category: string; // For organization
  extractionTargets: string[]; // What traits this question reveals
}

export interface QuestionnaireFlow {
  startQuestionId: string;
  questions: Question[];
}

// The main questionnaire with conditional branching
export const CONDITIONAL_QUESTIONNAIRE: QuestionnaireFlow = {
  startQuestionId: 'intro_energy',

  questions: [
    // CHAPTER 1: ENERGY & LIFESTYLE
    {
      id: 'intro_energy',
      text: 'How do you typically recharge after a long week?',
      type: 'multiple_choice',
      required: true,
      category: 'energy',
      extractionTargets: ['extraversion', 'openness'],
      answers: [
        {
          id: 'social_recharge',
          text: 'Going out with friends, socializing, being around people',
          traitMappings: [
            { trait: 'extraversion', framework: 'big_five', score: 75, confidence: 0.8 },
            { trait: 'social_skills', framework: 'eq', score: 70, confidence: 0.7 }
          ],
          nextQuestionId: 'social_size'
        },
        {
          id: 'quiet_recharge',
          text: 'Staying home, quiet time, solo activities',
          traitMappings: [
            { trait: 'extraversion', framework: 'big_five', score: 25, confidence: 0.8 },
            { trait: 'self_awareness', framework: 'eq', score: 65, confidence: 0.6 }
          ],
          nextQuestionId: 'alone_activities'
        },
        {
          id: 'mixed_recharge',
          text: 'A mix - some social time, some alone time',
          traitMappings: [
            { trait: 'extraversion', framework: 'big_five', score: 50, confidence: 0.6 }
          ],
          nextQuestionId: 'balance_preference'
        }
      ]
    },

    // FOLLOW-UP: For extroverts
    {
      id: 'social_size',
      text: 'When you socialize, do you prefer...',
      type: 'multiple_choice',
      required: true,
      category: 'energy',
      extractionTargets: ['extraversion', 'social_preferences'],
      answers: [
        {
          id: 'large_groups',
          text: 'Big groups, parties, lots of people',
          traitMappings: [
            { trait: 'extraversion', framework: 'big_five', score: 85, confidence: 0.9 },
            { trait: 'influence', framework: 'disc', score: 75, confidence: 0.7 }
          ],
          nextQuestionId: 'weekend_plans'
        },
        {
          id: 'small_groups',
          text: 'Small groups, intimate gatherings, close friends',
          traitMappings: [
            { trait: 'extraversion', framework: 'big_five', score: 60, confidence: 0.8 },
            { trait: 'agreeableness', framework: 'big_five', score: 70, confidence: 0.6 }
          ],
          nextQuestionId: 'weekend_plans'
        }
      ]
    },

    // FOLLOW-UP: For introverts
    {
      id: 'alone_activities',
      text: 'What do you enjoy doing in your alone time?',
      type: 'multiple_choice',
      required: true,
      category: 'interests',
      extractionTargets: ['openness', 'interests'],
      answers: [
        {
          id: 'creative_solo',
          text: 'Creative hobbies (art, music, writing, crafts)',
          traitMappings: [
            { trait: 'openness', framework: 'big_five', score: 80, confidence: 0.8 },
            { trait: 'type_4', framework: 'enneagram', score: 70, confidence: 0.6 }
          ],
          nextQuestionId: 'weekend_plans'
        },
        {
          id: 'learning_solo',
          text: 'Learning (reading, courses, documentaries)',
          traitMappings: [
            { trait: 'openness', framework: 'big_five', score: 85, confidence: 0.9 },
            { trait: 'type_5', framework: 'enneagram', score: 75, confidence: 0.7 }
          ],
          nextQuestionId: 'weekend_plans'
        },
        {
          id: 'relaxing_solo',
          text: 'Relaxing (TV, movies, games, rest)',
          traitMappings: [
            { trait: 'steadiness', framework: 'disc', score: 75, confidence: 0.7 },
            { trait: 'type_9', framework: 'enneagram', score: 65, confidence: 0.6 }
          ],
          nextQuestionId: 'weekend_plans'
        },
        {
          id: 'active_solo',
          text: 'Physical activity (gym, yoga, hiking, sports)',
          traitMappings: [
            { trait: 'conscientiousness', framework: 'big_five', score: 75, confidence: 0.7 },
            { trait: 'type_3', framework: 'enneagram', score: 65, confidence: 0.6 }
          ],
          nextQuestionId: 'weekend_plans'
        }
      ]
    },

    // FOLLOW-UP: For balanced types
    {
      id: 'balance_preference',
      text: 'Which do you tend to need more of to feel balanced?',
      type: 'multiple_choice',
      required: true,
      category: 'energy',
      extractionTargets: ['extraversion', 'self_awareness'],
      answers: [
        {
          id: 'need_more_social',
          text: 'I tend to need more social time',
          traitMappings: [
            { trait: 'extraversion', framework: 'big_five', score: 60, confidence: 0.7 }
          ],
          nextQuestionId: 'weekend_plans'
        },
        {
          id: 'need_more_alone',
          text: 'I tend to need more alone time',
          traitMappings: [
            { trait: 'extraversion', framework: 'big_five', score: 40, confidence: 0.7 }
          ],
          nextQuestionId: 'weekend_plans'
        },
        {
          id: 'truly_balanced',
          text: 'I genuinely need both equally',
          traitMappings: [
            { trait: 'extraversion', framework: 'big_five', score: 50, confidence: 0.8 },
            { trait: 'self_awareness', framework: 'eq', score: 75, confidence: 0.7 }
          ],
          nextQuestionId: 'weekend_plans'
        }
      ]
    },

    // COMMON FOLLOW-UP: Weekend planning
    {
      id: 'weekend_plans',
      text: 'When you have a free weekend, do you...',
      type: 'multiple_choice',
      required: true,
      category: 'planning',
      extractionTargets: ['conscientiousness', 'judging_perceiving'],
      answers: [
        {
          id: 'plan_ahead',
          text: 'Plan it out in advance - I like having a schedule',
          traitMappings: [
            { trait: 'conscientiousness', framework: 'big_five', score: 80, confidence: 0.9 },
            { trait: 'judging', framework: 'mbti', score: 80, confidence: 0.8 }
          ],
          nextQuestionId: 'home_environment'
        },
        {
          id: 'wing_it',
          text: 'See where the moment takes me - I prefer spontaneity',
          traitMappings: [
            { trait: 'conscientiousness', framework: 'big_five', score: 35, confidence: 0.8 },
            { trait: 'perceiving', framework: 'mbti', score: 80, confidence: 0.8 },
            { trait: 'openness', framework: 'big_five', score: 70, confidence: 0.6 }
          ],
          nextQuestionId: 'home_environment'
        },
        {
          id: 'loose_plan',
          text: 'Have a loose idea but stay flexible',
          traitMappings: [
            { trait: 'conscientiousness', framework: 'big_five', score: 60, confidence: 0.7 },
            { trait: 'openness', framework: 'big_five', score: 65, confidence: 0.6 }
          ],
          nextQuestionId: 'home_environment'
        }
      ]
    },

    // HOME & ENVIRONMENT
    {
      id: 'home_environment',
      text: 'How would you describe your ideal home environment?',
      type: 'multiple_choice',
      required: true,
      category: 'lifestyle',
      extractionTargets: ['conscientiousness', 'lifestyle'],
      answers: [
        {
          id: 'organized_minimal',
          text: 'Organized, minimalist, everything in its place',
          traitMappings: [
            { trait: 'conscientiousness', framework: 'big_five', score: 85, confidence: 0.9 },
            { trait: 'type_1', framework: 'enneagram', score: 70, confidence: 0.7 }
          ],
          nextQuestionId: 'relationship_history'
        },
        {
          id: 'cozy_lived_in',
          text: 'Cozy, lived-in, warm and welcoming',
          traitMappings: [
            { trait: 'agreeableness', framework: 'big_five', score: 75, confidence: 0.7 },
            { trait: 'type_2', framework: 'enneagram', score: 65, confidence: 0.6 }
          ],
          nextQuestionId: 'relationship_history'
        },
        {
          id: 'creative_expressive',
          text: 'Creative, expressive, reflects my personality',
          traitMappings: [
            { trait: 'openness', framework: 'big_five', score: 80, confidence: 0.8 },
            { trait: 'type_4', framework: 'enneagram', score: 70, confidence: 0.7 }
          ],
          nextQuestionId: 'relationship_history'
        },
        {
          id: 'functional_practical',
          text: 'Functional, practical, gets the job done',
          traitMappings: [
            { trait: 'sensing', framework: 'mbti', score: 75, confidence: 0.7 },
            { trait: 'conscientiousness', framework: 'disc', score: 70, confidence: 0.6 }
          ],
          nextQuestionId: 'relationship_history'
        }
      ]
    },

    // CHAPTER 2: RELATIONSHIPS & ATTACHMENT
    {
      id: 'relationship_history',
      text: 'Thinking about your past relationships, what pattern do you notice?',
      type: 'multiple_choice',
      required: true,
      category: 'relationships',
      extractionTargets: ['attachment', 'relationship_patterns'],
      answers: [
        {
          id: 'pattern_secure',
          text: 'Generally healthy - I can be close while maintaining independence',
          traitMappings: [
            { trait: 'attachment_secure', framework: 'attachment', score: 85, confidence: 0.8 },
            { trait: 'eq_overall', framework: 'eq', score: 75, confidence: 0.7 }
          ],
          nextQuestionId: 'conflict_style'
        },
        {
          id: 'pattern_anxious',
          text: 'I tend to worry about the relationship and need reassurance',
          traitMappings: [
            { trait: 'attachment_anxious', framework: 'attachment', score: 80, confidence: 0.85 },
            { trait: 'neuroticism', framework: 'big_five', score: 65, confidence: 0.7 }
          ],
          nextQuestionId: 'anxiety_followup'
        },
        {
          id: 'pattern_avoidant',
          text: 'I value my independence and can feel smothered easily',
          traitMappings: [
            { trait: 'attachment_avoidant', framework: 'attachment', score: 80, confidence: 0.85 },
            { trait: 'extraversion', framework: 'big_five', score: 35, confidence: 0.6 }
          ],
          nextQuestionId: 'avoidance_followup'
        },
        {
          id: 'pattern_learning',
          text: 'I\'m still learning what healthy looks like for me',
          traitMappings: [
            { trait: 'self_awareness', framework: 'eq', score: 75, confidence: 0.8 },
            { trait: 'openness', framework: 'big_five', score: 70, confidence: 0.6 }
          ],
          nextQuestionId: 'growth_question'
        }
      ]
    },

    // More questions would continue here...
    // I'll create the full set, but showing the structure

    // PLACEHOLDER for remaining questions
    {
      id: 'conflict_style',
      text: 'When there\'s a disagreement in a relationship, what\'s your typical approach?',
      type: 'multiple_choice',
      required: true,
      category: 'communication',
      extractionTargets: ['conflict_style', 'communication'],
      answers: [
        {
          id: 'direct_conflict',
          text: 'Address it directly and talk it through',
          traitMappings: [
            { trait: 'dominance', framework: 'disc', score: 75, confidence: 0.8 },
            { trait: 'attachment_secure', framework: 'attachment', score: 70, confidence: 0.7 }
          ],
          nextQuestionId: 'values_family'
        },
        {
          id: 'need_time',
          text: 'I need some time to process before discussing',
          traitMappings: [
            { trait: 'self_regulation', framework: 'eq', score: 75, confidence: 0.8 },
            { trait: 'introversion', framework: 'big_five', score: 65, confidence: 0.6 }
          ],
          nextQuestionId: 'values_family'
        },
        {
          id: 'avoid_conflict',
          text: 'I tend to avoid conflict when possible',
          traitMappings: [
            { trait: 'agreeableness', framework: 'big_five', score: 80, confidence: 0.7 },
            { trait: 'type_9', framework: 'enneagram', score: 75, confidence: 0.7 }
          ],
          nextQuestionId: 'conflict_avoidance_followup'
        }
      ]
    },

    // CHAPTER 3: VALUES & FUTURE
    {
      id: 'values_family',
      text: 'How important is family (biological or chosen) in your life?',
      type: 'scale',
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: {
        min: 'Not very important',
        max: 'Extremely important'
      },
      required: true,
      category: 'values',
      extractionTargets: ['values', 'family_orientation']
    },

    {
      id: 'children_desire',
      text: 'How do you feel about having children?',
      type: 'multiple_choice',
      required: true,
      category: 'life_vision',
      extractionTargets: ['family_goals', 'life_vision'],
      answers: [
        {
          id: 'definitely_want',
          text: 'I definitely want children',
          traitMappings: [
            { trait: 'wants_children', framework: 'life_vision', score: 100, confidence: 1.0 }
          ],
          nextQuestionId: 'children_timeline'
        },
        {
          id: 'probably_want',
          text: 'I probably want children',
          traitMappings: [
            { trait: 'wants_children', framework: 'life_vision', score: 75, confidence: 0.7 }
          ],
          nextQuestionId: 'life_priorities'
        },
        {
          id: 'unsure_children',
          text: 'I\'m unsure / open to it',
          traitMappings: [
            { trait: 'wants_children', framework: 'life_vision', score: 50, confidence: 0.5 }
          ],
          nextQuestionId: 'life_priorities'
        },
        {
          id: 'probably_not',
          text: 'I probably don\'t want children',
          traitMappings: [
            { trait: 'wants_children', framework: 'life_vision', score: 25, confidence: 0.7 }
          ],
          nextQuestionId: 'life_priorities'
        },
        {
          id: 'definitely_not',
          text: 'I definitely don\'t want children',
          traitMappings: [
            { trait: 'wants_children', framework: 'life_vision', score: 0, confidence: 1.0 }
          ],
          nextQuestionId: 'life_priorities'
        },
        {
          id: 'have_children',
          text: 'I already have children',
          traitMappings: [
            { trait: 'has_children', framework: 'demographics', score: 100, confidence: 1.0 }
          ],
          nextQuestionId: 'life_priorities'
        }
      ]
    },

    // Add demographics and wrap-up questions
    {
      id: 'life_priorities',
      text: 'What are your top life priorities right now? (Select up to 3)',
      type: 'multiple_choice',
      required: true,
      category: 'values',
      extractionTargets: ['values', 'life_priorities']
      // This would be a multi-select question
    },

    // Final questions would go here...
  ]
};

// Helper function to get next question based on answer
export function getNextQuestion(
  currentQuestionId: string,
  selectedAnswerId: string
): string | null {
  const currentQuestion = CONDITIONAL_QUESTIONNAIRE.questions.find(
    q => q.id === currentQuestionId
  );

  if (!currentQuestion || !currentQuestion.answers) {
    return null;
  }

  const selectedAnswer = currentQuestion.answers.find(
    a => a.id === selectedAnswerId
  );

  return selectedAnswer?.nextQuestionId || null;
}

// Calculate trait scores from all answers
export function calculateTraitsFromAnswers(
  answers: Map<string, string> // questionId -> answerId
): Record<string, { score: number; confidence: number }> {
  const traitScores: Record<string, { total: number; count: number; confidence: number }> = {};

  // Go through all answers and accumulate trait scores
  answers.forEach((answerId, questionId) => {
    const question = CONDITIONAL_QUESTIONNAIRE.questions.find(q => q.id === questionId);
    const answer = question?.answers?.find(a => a.id === answerId);

    if (answer?.traitMappings) {
      answer.traitMappings.forEach(mapping => {
        const key = `${mapping.framework}:${mapping.trait}`;

        if (!traitScores[key]) {
          traitScores[key] = { total: 0, count: 0, confidence: 0 };
        }

        traitScores[key].total += mapping.score;
        traitScores[key].count += 1;
        traitScores[key].confidence = Math.max(
          traitScores[key].confidence,
          mapping.confidence
        );
      });
    }
  });

  // Average the scores
  const finalScores: Record<string, { score: number; confidence: number }> = {};

  Object.entries(traitScores).forEach(([key, data]) => {
    finalScores[key] = {
      score: Math.round(data.total / data.count),
      confidence: data.confidence
    };
  });

  return finalScores;
}
