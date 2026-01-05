/**
 * Match Generator Service
 * Generates high-quality matches for users based on comprehensive compatibility
 */

import { getAdminClient } from '@/lib/db/supabase';
import { calculateEnhancedCompatibility } from './enhanced-compatibility-algorithm';

interface MatchGeneratorConfig {
  minOverallScore?: number; // Minimum compatibility score (default: 70)
  maxMatchesPerUser?: number; // Max matches to generate per user (default: 3)
  respectUserPreferences?: boolean; // Honor user preferences (default: true)
  excludeExistingMatches?: boolean; // Don't re-match existing pairs (default: true)
}

interface MatchResult {
  userAId: string;
  userBId: string;
  overallScore: number;
  psychologicalScore: number;
  intellectualScore: number;
  astrologicalScore: number;
  communicationScore: number;
  lifeAlignmentScore: number;
  scoreDetails: any;
}

/**
 * Generate matches for a specific user
 */
export async function generateMatchesForUser(
  userId: string,
  config: MatchGeneratorConfig = {}
): Promise<MatchResult[]> {
  const {
    minOverallScore = 70,
    maxMatchesPerUser = 3,
    respectUserPreferences = true,
    excludeExistingMatches = true
  } = config;

  const supabase = getAdminClient();

  // Get user's profile, astro profile, and extraction data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(`
      *,
      profiles (*),
      astro_profiles (*),
      profile_extractions (*),
      user_match_preferences (*)
    `)
    .eq('id', userId)
    .eq('status', 'active')
    .single();

  if (userError || !user) {
    throw new Error(`Failed to load user: ${userError?.message}`);
  }

  // Get potential matches (active users who aren't this user)
  let query = supabase
    .from('users')
    .select(`
      *,
      profiles (*),
      astro_profiles (*),
      profile_extractions (*)
    `)
    .eq('status', 'active')
    .neq('id', userId);

  // Apply user preferences if enabled
  if (respectUserPreferences && user.user_match_preferences?.[0]) {
    const prefs = user.user_match_preferences[0];

    // Age preferences
    if (prefs.min_age_preference && prefs.max_age_preference) {
      query = query
        .gte('profiles.age', prefs.min_age_preference)
        .lte('profiles.age', prefs.max_age_preference);
    }

    // Location preferences
    if (prefs.require_same_city) {
      query = query.eq('profiles.location_city', user.profiles?.[0]?.location_city);
    }
    if (prefs.require_same_country) {
      query = query.eq('profiles.location_country', user.profiles?.[0]?.location_country);
    }
  }

  const { data: potentialMatches, error: matchesError } = await query;

  if (matchesError || !potentialMatches) {
    throw new Error(`Failed to load potential matches: ${matchesError?.message}`);
  }

  // Get existing matches if we're excluding them
  let existingMatchIds: string[] = [];
  if (excludeExistingMatches) {
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user_a_id, user_b_id')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (existingMatches) {
      existingMatchIds = existingMatches.map((m) =>
        m.user_a_id === userId ? m.user_b_id : m.user_a_id
      );
    }
  }

  // Calculate compatibility scores for all potential matches
  const scoredMatches: MatchResult[] = [];

  for (const potentialMatch of potentialMatches) {
    // Skip if already matched
    if (existingMatchIds.includes(potentialMatch.id)) {
      continue;
    }

    try {
      const compatibility = await calculateEnhancedCompatibility(
        userId,
        potentialMatch.id
      );

      // Check if score meets minimum threshold
      if (compatibility.overall >= minOverallScore) {
        // Check for dealbreakers
        if (compatibility.details.dealBreakers.length === 0) {
          scoredMatches.push({
            userAId: userId,
            userBId: potentialMatch.id,
            overallScore: compatibility.overall,
            psychologicalScore: compatibility.breakdown.psychological,
            intellectualScore: Math.round(
              (compatibility.breakdown.behavioral + compatibility.breakdown.interests) / 2
            ),
            astrologicalScore: compatibility.breakdown.astrological,
            communicationScore: Math.round(
              (compatibility.breakdown.psychological + compatibility.breakdown.behavioral) / 2
            ),
            lifeAlignmentScore: Math.round(
              (compatibility.breakdown.values_vision + compatibility.breakdown.lifestyle) / 2
            ),
            scoreDetails: {
              breakdown: compatibility.breakdown,
              strengths: compatibility.details.strengths,
              considerations: compatibility.details.considerations,
              sharedInterests: compatibility.details.sharedInterests,
              confidence: compatibility.confidence,
              dataCompleteness: compatibility.dataCompleteness
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error calculating compatibility with ${potentialMatch.id}:`, error);
      // Continue to next potential match
    }
  }

  // Sort by overall score (highest first) and limit to maxMatchesPerUser
  const topMatches = scoredMatches
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, maxMatchesPerUser);

  return topMatches;
}

/**
 * Generate matches for all active users in batch
 */
export async function generateMatchesBatch(
  config: MatchGeneratorConfig = {}
): Promise<{
  runId: string;
  usersEvaluated: number;
  matchesGenerated: number;
  errors: Array<{ userId: string; error: string }>;
}> {
  const supabase = getAdminClient();

  // Create a match generation run record
  const { data: run, error: runError } = await supabase
    .from('match_generation_runs')
    .insert({
      initiated_by: 'cron',
      status: 'running'
    })
    .select()
    .single();

  if (runError || !run) {
    throw new Error(`Failed to create match generation run: ${runError?.message}`);
  }

  const runId = run.id;
  let usersEvaluated = 0;
  let matchesGenerated = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  try {
    // Get all active users who need matches
    const { data: activeUsers, error: usersError } = await supabase
      .from('users')
      .select('id, user_match_preferences (max_matches_per_week)')
      .eq('status', 'active');

    if (usersError || !activeUsers) {
      throw new Error(`Failed to load active users: ${usersError?.message}`);
    }

    // Generate matches for each user
    for (const user of activeUsers) {
      try {
        usersEvaluated++;

        // Check how many matches they already have this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: recentMatches } = await supabase
          .from('matches')
          .select('id')
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
          .gte('created_at', weekAgo.toISOString());

        const maxMatchesPerWeek = user.user_match_preferences?.[0]?.max_matches_per_week || 2;
        const currentMatches = recentMatches?.length || 0;

        if (currentMatches >= maxMatchesPerWeek) {
          // User already has enough matches this week
          continue;
        }

        // Generate matches for this user
        const remainingSlots = maxMatchesPerWeek - currentMatches;
        const newMatches = await generateMatchesForUser(user.id, {
          ...config,
          maxMatchesPerUser: remainingSlots
        });

        // Insert matches into database
        for (const match of newMatches) {
          const { error: insertError } = await supabase.from('matches').insert({
            user_a_id: match.userAId,
            user_b_id: match.userBId,
            overall_score: match.overallScore,
            psychological_score: match.psychologicalScore,
            intellectual_score: match.intellectualScore,
            astrological_score: match.astrologicalScore,
            communication_score: match.communicationScore,
            life_alignment_score: match.lifeAlignmentScore,
            score_details: match.scoreDetails,
            status: 'pending',
            generation_run_id: runId
          });

          if (!insertError) {
            matchesGenerated++;
          } else {
            errors.push({
              userId: user.id,
              error: `Failed to insert match: ${insertError.message}`
            });
          }
        }
      } catch (error: any) {
        errors.push({
          userId: user.id,
          error: error.message || 'Unknown error'
        });
      }
    }

    // Update run status
    await supabase
      .from('match_generation_runs')
      .update({
        status: errors.length === 0 ? 'completed' : 'partial',
        completed_at: new Date().toISOString(),
        users_evaluated: usersEvaluated,
        matches_generated: matchesGenerated,
        errors: errors.length > 0 ? errors : null
      })
      .eq('id', runId);

    return {
      runId,
      usersEvaluated,
      matchesGenerated,
      errors
    };
  } catch (error: any) {
    // Update run status to failed
    await supabase
      .from('match_generation_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        users_evaluated: usersEvaluated,
        matches_generated: matchesGenerated,
        errors: [{ userId: 'system', error: error.message }]
      })
      .eq('id', runId);

    throw error;
  }
}
