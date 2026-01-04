import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

// GET /api/profile/extractions - Get user's extracted profile data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get profile extractions
    const { data: profile, error: profileError } = await supabase
      .from('profile_extractions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // If no profile exists yet, return default
    if (!profile) {
      return NextResponse.json({
        profile: {
          user_id: userId,
          profile_completeness: 0,
          total_games_played: 0,
          total_puzzles_solved: 0,
          total_articles_read: 0,
          total_discussions_joined: 0,
          big_five: {
            openness: { value: 0.5, confidence: 0, data_points: 0 },
            conscientiousness: { value: 0.5, confidence: 0, data_points: 0 },
            extraversion: { value: 0.5, confidence: 0, data_points: 0 },
            agreeableness: { value: 0.5, confidence: 0, data_points: 0 },
            neuroticism: { value: 0.5, confidence: 0, data_points: 0 }
          },
          attachment: {
            secure: 0.5,
            anxious: 0.5,
            avoidant: 0.5,
            confidence: 0
          },
          cognitive: {
            vocabulary_level: null,
            analytical_thinking: 0.5,
            creativity_score: 0.5,
            persistence_score: 0.5,
            decision_speed: null
          },
          lifestyle_indicators: {},
          relationship_indicators: {},
          values_hierarchy: [],
          interests: {},
          risk_tolerance: 0.5
        }
      });
    }

    // Format profile for frontend
    const formattedProfile = {
      user_id: profile.user_id,
      profile_completeness: profile.profile_completeness || 0,
      total_games_played: profile.total_games_played || 0,
      total_puzzles_solved: profile.total_puzzles_solved || 0,
      total_articles_read: profile.total_articles_read || 0,
      total_discussions_joined: profile.total_discussions_joined || 0,

      big_five: {
        openness: {
          value: profile.openness || 0.5,
          confidence: profile.openness_confidence || 0,
          data_points: profile.openness_data_points || 0
        },
        conscientiousness: {
          value: profile.conscientiousness || 0.5,
          confidence: profile.conscientiousness_confidence || 0,
          data_points: profile.conscientiousness_data_points || 0
        },
        extraversion: {
          value: profile.extraversion || 0.5,
          confidence: profile.extraversion_confidence || 0,
          data_points: profile.extraversion_data_points || 0
        },
        agreeableness: {
          value: profile.agreeableness || 0.5,
          confidence: profile.agreeableness_confidence || 0,
          data_points: profile.agreeableness_data_points || 0
        },
        neuroticism: {
          value: profile.neuroticism || 0.5,
          confidence: profile.neuroticism_confidence || 0,
          data_points: profile.neuroticism_data_points || 0
        }
      },

      attachment: {
        secure: profile.attachment_secure || 0.5,
        anxious: profile.attachment_anxious || 0.5,
        avoidant: profile.attachment_avoidant || 0.5,
        confidence: profile.attachment_confidence || 0
      },

      cognitive: {
        vocabulary_level: profile.vocabulary_level,
        analytical_thinking: profile.analytical_thinking || 0.5,
        creativity_score: profile.creativity_score || 0.5,
        persistence_score: profile.persistence_score || 0.5,
        decision_speed: profile.decision_speed
      },

      lifestyle_indicators: profile.lifestyle_indicators || {},
      relationship_indicators: profile.relationship_indicators || {},
      values_hierarchy: profile.values_hierarchy || [],
      interests: profile.interests || {},
      risk_tolerance: profile.risk_tolerance || 0.5,

      last_updated_at: profile.last_updated_at
    };

    return NextResponse.json({
      profile: formattedProfile
    });

  } catch (error) {
    console.error('Profile extractions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
