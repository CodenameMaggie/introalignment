import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import {
  CONDITIONAL_QUESTIONNAIRE,
  getNextQuestion,
  calculateTraitsFromAnswers
} from '@/lib/questionnaire/conditional-questions';

// POST /api/questionnaire - Submit answer and get next question
export async function POST(request: NextRequest) {
  try {
    const { userId, questionId, answerId, allAnswers } = await request.json() as {
      userId: string;
      questionId: string;
      answerId: string;
      allAnswers: Record<string, string>;
    };

    if (!userId || !questionId || !answerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Save the answer
    const answerMap = new Map(Object.entries(allAnswers || {} as Record<string, string>));
    answerMap.set(questionId, answerId);

    // Get or create conversation record
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          status: 'in_progress'
        })
        .select()
        .single();

      conversation = newConv;
    }

    // Save this answer as a message
    await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: answerId,
        metadata: {
          questionId,
          answerId,
          questionType: 'conditional_questionnaire'
        }
      });

    // Get next question
    const nextQuestionId = getNextQuestion(questionId, answerId);

    // If no more questions, calculate final profile
    if (!nextQuestionId) {
      // Calculate all trait scores
      const traitScores = calculateTraitsFromAnswers(answerMap);

      // Convert to profile format
      const profileData = convertTraitsToProfile(traitScores, userId);

      // Save profile
      await supabase
        .from('profiles')
        .upsert(profileData);

      // Mark conversation as complete
      await supabase
        .from('conversations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      // Update user status
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId);

      return NextResponse.json({
        completed: true,
        message: 'Profile complete! We\'ll be in touch when we find your match.'
      });
    }

    // Get the next question details
    const nextQuestion = CONDITIONAL_QUESTIONNAIRE.questions.find(
      q => q.id === nextQuestionId
    );

    return NextResponse.json({
      completed: false,
      nextQuestion: nextQuestion
    });

  } catch (error) {
    console.error('Questionnaire API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/questionnaire - Get first question
export async function GET(request: NextRequest) {
  const firstQuestion = CONDITIONAL_QUESTIONNAIRE.questions.find(
    q => q.id === CONDITIONAL_QUESTIONNAIRE.startQuestionId
  );

  return NextResponse.json({
    question: firstQuestion
  });
}

// Helper: Convert trait scores to profile format
function convertTraitsToProfile(
  traitScores: Record<string, { score: number; confidence: number }>,
  userId: string
): any {
  const profile: any = {
    user_id: userId,
    raw_extractions: { questionnaire_scores: traitScores }
  };

  // Map trait scores to profile fields
  Object.entries(traitScores).forEach(([key, data]) => {
    const [framework, trait] = key.split(':');

    switch (framework) {
      case 'big_five':
        if (trait === 'extraversion') profile.extraversion_score = data.score;
        if (trait === 'openness') profile.openness_score = data.score;
        if (trait === 'conscientiousness') profile.conscientiousness_score = data.score;
        if (trait === 'agreeableness') profile.agreeableness_score = data.score;
        if (trait === 'neuroticism') profile.neuroticism_score = data.score;
        profile.big_five_confidence = data.confidence;
        break;

      case 'attachment':
        if (trait.includes('secure')) profile.attachment_style = 'secure';
        if (trait.includes('anxious')) profile.attachment_style = 'anxious';
        if (trait.includes('avoidant')) profile.attachment_style = 'avoidant';
        profile.attachment_confidence = data.confidence;
        break;

      case 'eq':
        if (trait === 'self_awareness') profile.eq_self_awareness = data.score;
        if (trait === 'self_regulation') profile.eq_self_regulation = data.score;
        if (trait === 'empathy') profile.eq_empathy = data.score;
        if (trait === 'social_skills') profile.eq_social_skills = data.score;
        if (trait === 'eq_overall') profile.eq_overall = data.score;
        profile.eq_confidence = data.confidence;
        break;

      case 'enneagram':
        const typeMatch = trait.match(/type_(\d)/);
        if (typeMatch) {
          profile.enneagram_type = parseInt(typeMatch[1]);
          profile.enneagram_confidence = data.confidence;
        }
        break;

      case 'disc':
        if (trait === 'dominance') profile.disc_d = data.score;
        if (trait === 'influence') profile.disc_i = data.score;
        if (trait === 'steadiness') profile.disc_s = data.score;
        if (trait === 'conscientiousness') profile.disc_c = data.score;
        profile.disc_confidence = data.confidence;
        break;

      case 'life_vision':
        if (trait === 'wants_children') {
          if (data.score >= 75) profile.wants_children = 'yes';
          else if (data.score <= 25) profile.wants_children = 'no';
          else profile.wants_children = 'open';
        }
        break;

      case 'demographics':
        if (trait === 'has_children') profile.has_children = data.score > 50;
        break;
    }
  });

  return profile;
}
