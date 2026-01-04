// IntroAlignment ENHANCED Compatibility Algorithm
// Pulls from ALL data sources: questionnaire, games, content, community, dealbreakers

import { Profile, AstroProfile } from '@/types/database';
import { getAdminClient } from '@/lib/db/supabase';

// Enhanced weights reflecting ALL data sources
const WEIGHTS = {
  psychological: 25,      // Big Five from BOTH profiles & profile_extractions
  behavioral: 15,         // From games (decision speed, consistency, response patterns)
  values_vision: 20,      // Core values from questionnaire + validated by games/discussions
  interests: 10,          // From content interactions + profile_extractions
  lifestyle: 10,          // From questionnaire + profile_extractions + games
  dealbreakers: 15,       // From deal breaker swipes - HARD FILTERS
  astrological: 5         // BaZi, Vedic, Nine Star Ki (if available)
} as const;

interface ProfileExtraction {
  // Big Five (validated from games)
  openness: number;
  openness_confidence: number;
  conscientiousness: number;
  conscientiousness_confidence: number;
  extraversion: number;
  extraversion_confidence: number;
  agreeableness: number;
  agreeableness_confidence: number;
  neuroticism: number;
  neuroticism_confidence: number;

  // Attachment
  attachment_secure: number;
  attachment_anxious: number;
  attachment_avoidant: number;
  attachment_confidence: number;

  // Cognitive
  vocabulary_level: string | null;
  analytical_thinking: number;
  creativity_score: number;
  persistence_score: number;
  decision_speed: string | null;

  // Lifestyle & Values
  values_hierarchy: string[];
  interests: Record<string, number>; // {"travel": 0.9, "cooking": 0.6}
  lifestyle_indicators: Record<string, any>;
  relationship_indicators: Record<string, any>;
  risk_tolerance: number;

  // Engagement metrics (shows seriousness)
  total_games_played: number;
  total_discussions_joined: number;
  profile_completeness: number;
}

interface EnhancedCompatibilityScore {
  overall: number;
  breakdown: {
    psychological: number;
    behavioral: number;
    values_vision: number;
    interests: number;
    lifestyle: number;
    dealbreakers: number;
    astrological: number;
  };
  details: {
    strengths: string[];
    considerations: string[];
    dealBreakers: string[];
    sharedInterests: string[];
  };
  confidence: number;
  dataCompleteness: {
    user1: number; // 0-1
    user2: number; // 0-1
  };
}

/**
 * Calculate psychological compatibility using BOTH questionnaire AND games data
 */
async function calculatePsychologicalCompatibility(
  profile1: Profile,
  profile2: Profile,
  extraction1: ProfileExtraction | null,
  extraction2: ProfileExtraction | null
): Promise<{ score: number; strengths: string[]; considerations: string[] }> {
  let score = 50;
  const strengths: string[] = [];
  const considerations: string[] = [];

  // Use GAMES data if confidence is high, otherwise fall back to questionnaire
  const getBigFiveValue = (
    profileValue: number | null,
    extractionValue: number | null,
    extractionConfidence: number | null
  ): number => {
    if (extractionConfidence && extractionConfidence > 0.5) {
      return extractionValue || profileValue || 50;
    }
    return profileValue || extractionValue || 50;
  };

  // Big Five Compatibility (using best available data)
  const openness1 = getBigFiveValue(
    profile1.openness_score,
    extraction1?.openness || null,
    extraction1?.openness_confidence || null
  );
  const openness2 = getBigFiveValue(
    profile2.openness_score,
    extraction2?.openness || null,
    extraction2?.openness_confidence || null
  );

  const consc1 = getBigFiveValue(
    profile1.conscientiousness_score,
    extraction1?.conscientiousness || null,
    extraction1?.conscientiousness_confidence || null
  );
  const consc2 = getBigFiveValue(
    profile2.conscientiousness_score,
    extraction2?.conscientiousness || null,
    extraction2?.conscientiousness_confidence || null
  );

  const extra1 = getBigFiveValue(
    profile1.extraversion_score,
    extraction1?.extraversion || null,
    extraction1?.extraversion_confidence || null
  );
  const extra2 = getBigFiveValue(
    profile2.extraversion_score,
    extraction2?.extraversion || null,
    extraction2?.extraversion_confidence || null
  );

  const agree1 = getBigFiveValue(
    profile1.agreeableness_score,
    extraction1?.agreeableness || null,
    extraction1?.agreeableness_confidence || null
  );
  const agree2 = getBigFiveValue(
    profile2.agreeableness_score,
    extraction2?.agreeableness || null,
    extraction2?.agreeableness_confidence || null
  );

  const neuro1 = getBigFiveValue(
    profile1.neuroticism_score,
    extraction1?.neuroticism || null,
    extraction1?.neuroticism_confidence || null
  );
  const neuro2 = getBigFiveValue(
    profile2.neuroticism_score,
    extraction2?.neuroticism || null,
    extraction2?.neuroticism_confidence || null
  );

  // Similarity in Conscientiousness and Agreeableness (important for compatibility)
  const conscDiff = Math.abs(consc1 - consc2);
  const agreeDiff = Math.abs(agree1 - agree2);

  if (conscDiff < 15 && agreeDiff < 15) {
    score += 20;
    strengths.push('Highly compatible personality traits');
  } else if (conscDiff < 25 && agreeDiff < 25) {
    score += 10;
  }

  // Emotional stability (low neuroticism is good)
  const neuroAvg = (neuro1 + neuro2) / 2;
  if (neuroAvg < 0.4) {
    score += 10;
    strengths.push('Both emotionally stable');
  }

  // Openness compatibility (some difference is okay, enriching)
  const openDiff = Math.abs(openness1 - openness2);
  if (openDiff < 20) {
    score += 5;
  }

  // Extraversion doesn't need to match perfectly
  const extraDiff = Math.abs(extra1 - extra2);
  if (extraDiff > 40) {
    considerations.push('Different social energy levels');
  }

  // ATTACHMENT STYLE (from games if available, otherwise questionnaire)
  const attachment1 = (extraction1?.attachment_secure || 0) > 0.6 ? 'secure' :
                      (extraction1?.attachment_anxious || 0) > 0.6 ? 'anxious' :
                      (extraction1?.attachment_avoidant || 0) > 0.6 ? 'avoidant' :
                      profile1.attachment_style?.toLowerCase();

  const attachment2 = (extraction2?.attachment_secure || 0) > 0.6 ? 'secure' :
                      (extraction2?.attachment_anxious || 0) > 0.6 ? 'anxious' :
                      (extraction2?.attachment_avoidant || 0) > 0.6 ? 'avoidant' :
                      profile2.attachment_style?.toLowerCase();

  if (attachment1 === 'secure' && attachment2 === 'secure') {
    score += 15;
    strengths.push('Both have secure attachment style');
  } else if (attachment1 === 'secure' || attachment2 === 'secure') {
    score += 8;
    strengths.push('One secure attachment provides stability');
  } else if (attachment1 === 'anxious' && attachment2 === 'avoidant') {
    score -= 10;
    considerations.push('Anxious-avoidant dynamic requires awareness');
  }

  return { score: Math.max(0, Math.min(100, score)), strengths, considerations };
}

/**
 * Calculate behavioral compatibility from games data
 * Decision speed, persistence, consistency
 */
function calculateBehavioralCompatibility(
  extraction1: ProfileExtraction | null,
  extraction2: ProfileExtraction | null
): { score: number; strengths: string[]; considerations: string[] } {
  let score = 50;
  const strengths: string[] = [];
  const considerations: string[] = [];

  if (!extraction1 || !extraction2) {
    return { score: 50, strengths: [], considerations: ['Limited behavioral data'] };
  }

  // Decision Speed Compatibility
  if (extraction1.decision_speed && extraction2.decision_speed) {
    if (extraction1.decision_speed === extraction2.decision_speed) {
      score += 15;
      strengths.push(`Both ${extraction1.decision_speed} decision makers`);
    } else {
      const speed1 = extraction1.decision_speed;
      const speed2 = extraction2.decision_speed;
      if ((speed1 === 'impulsive' && speed2 === 'slow') ||
          (speed1 === 'slow' && speed2 === 'impulsive')) {
        score -= 5;
        considerations.push('Different decision-making paces');
      }
    }
  }

  // Risk Tolerance
  const riskDiff = Math.abs(extraction1.risk_tolerance - extraction2.risk_tolerance);
  if (riskDiff < 0.2) {
    score += 15;
    strengths.push('Similar risk tolerance');
  } else if (riskDiff > 0.5) {
    score -= 5;
    considerations.push('Different comfort levels with risk');
  }

  // Persistence (from puzzle data)
  if (extraction1.persistence_score && extraction2.persistence_score) {
    const persistDiff = Math.abs(extraction1.persistence_score - extraction2.persistence_score);
    if (persistDiff < 0.2) {
      score += 10;
    }
  }

  // Creativity Compatibility
  if (extraction1.creativity_score && extraction2.creativity_score) {
    const creativityDiff = Math.abs(extraction1.creativity_score - extraction2.creativity_score);
    if (creativityDiff < 0.2) {
      score += 10;
      strengths.push('Similar creative expression');
    }
  }

  return { score: Math.max(0, Math.min(100, score)), strengths, considerations };
}

/**
 * Calculate values compatibility from questionnaire + games + discussions
 */
async function calculateValuesCompatibility(
  userId1: string,
  userId2: string,
  profile1: Profile,
  profile2: Profile,
  extraction1: ProfileExtraction | null,
  extraction2: ProfileExtraction | null
): Promise<{ score: number; strengths: string[]; considerations: string[]; dealBreakers: string[] }> {
  let score = 50;
  const strengths: string[] = [];
  const considerations: string[] = [];
  const dealBreakers: string[] = [];

  const supabase = getAdminClient();

  // Core Values from questionnaire
  if (profile1.core_values && profile2.core_values) {
    const values1 = profile1.core_values as string[];
    const values2 = profile2.core_values as string[];
    const sharedValues = values1.filter(v => values2.includes(v));

    if (sharedValues.length >= 3) {
      score += 25;
      strengths.push(`${sharedValues.length} shared values: ${sharedValues.join(', ')}`);
    } else if (sharedValues.length >= 1) {
      score += 10;
      strengths.push(`Shared values: ${sharedValues.join(', ')}`);
    }
  }

  // Values from games (profile_extractions)
  if (extraction1?.values_hierarchy && extraction2?.values_hierarchy) {
    const gameValues1 = extraction1.values_hierarchy;
    const gameValues2 = extraction2.values_hierarchy;
    const sharedGameValues = gameValues1.filter(v => gameValues2.includes(v));

    if (sharedGameValues.length >= 2) {
      score += 15;
      strengths.push('Games confirm shared value priorities');
    }
  }

  // Children (CRITICAL DEAL-BREAKER)
  if (profile1.wants_children && profile2.wants_children) {
    const wants1 = profile1.wants_children.toLowerCase();
    const wants2 = profile2.wants_children.toLowerCase();

    if ((wants1 === 'yes' && wants2 === 'no') || (wants1 === 'no' && wants2 === 'yes')) {
      score -= 40;
      dealBreakers.push('Fundamental disagreement about children');
    } else if (wants1 === wants2) {
      score += 20;
      strengths.push('Aligned on family planning');
    }
  }

  // Check poll votes for values alignment
  const { data: polls1 } = await supabase
    .from('poll_votes')
    .select('poll_id, selected_options')
    .eq('user_id', userId1);

  const { data: polls2 } = await supabase
    .from('poll_votes')
    .select('poll_id, selected_options')
    .eq('user_id', userId2);

  if (polls1 && polls2) {
    const commonPolls = polls1.filter(p1 =>
      polls2.some(p2 => p2.poll_id === p1.poll_id)
    );

    let agreementCount = 0;
    for (const poll1 of commonPolls) {
      const poll2 = polls2.find(p => p.poll_id === poll1.poll_id);
      if (poll2) {
        const options1 = poll1.selected_options as string[];
        const options2 = poll2.selected_options as string[];
        if (options1.some(o => options2.includes(o))) {
          agreementCount++;
        }
      }
    }

    if (commonPolls.length > 0) {
      const agreementRate = agreementCount / commonPolls.length;
      if (agreementRate > 0.7) {
        score += 10;
        strengths.push('Strong agreement on values polls');
      } else if (agreementRate < 0.3) {
        score -= 5;
        considerations.push('Different perspectives on key issues');
      }
    }
  }

  return { score: Math.max(0, Math.min(100, score)), strengths, considerations, dealBreakers };
}

/**
 * Calculate interests compatibility from content interactions + profile_extractions
 */
async function calculateInterestsCompatibility(
  userId1: string,
  userId2: string,
  extraction1: ProfileExtraction | null,
  extraction2: ProfileExtraction | null
): Promise<{ score: number; strengths: string[]; sharedInterests: string[] }> {
  let score = 50;
  const strengths: string[] = [];
  const sharedInterests: string[] = [];

  const supabase = getAdminClient();

  // Interests from games (profile_extractions)
  if (extraction1?.interests && extraction2?.interests) {
    const interests1 = extraction1.interests;
    const interests2 = extraction2.interests;

    for (const [interest, strength1] of Object.entries(interests1)) {
      if (interests2[interest]) {
        const strength2 = interests2[interest];
        const avgStrength = (strength1 + strength2) / 2;

        if (avgStrength > 0.6) {
          score += 10;
          sharedInterests.push(interest);
        }
      }
    }

    if (sharedInterests.length >= 3) {
      strengths.push(`${sharedInterests.length} strong shared interests`);
    }
  }

  // Content interaction overlap
  const { data: articles1 } = await supabase
    .from('content_interactions')
    .select('article_id')
    .eq('user_id', userId1)
    .eq('read_completed', true);

  const { data: articles2 } = await supabase
    .from('content_interactions')
    .select('article_id')
    .eq('user_id', userId2)
    .eq('read_completed', true);

  if (articles1 && articles2) {
    const commonArticles = articles1.filter(a1 =>
      articles2.some(a2 => a2.article_id === a1.article_id)
    );

    if (commonArticles.length > 0) {
      score += Math.min(20, commonArticles.length * 5);
      strengths.push('Read similar content - intellectual overlap');
    }
  }

  return { score: Math.max(0, Math.min(100, score)), strengths, sharedInterests };
}

/**
 * Calculate lifestyle compatibility from ALL sources
 */
function calculateLifestyleCompatibility(
  profile1: Profile,
  profile2: Profile,
  extraction1: ProfileExtraction | null,
  extraction2: ProfileExtraction | null
): { score: number; strengths: string[]; considerations: string[] } {
  let score = 50;
  const strengths: string[] = [];
  const considerations: string[] = [];

  // Lifestyle from games (profile_extractions)
  if (extraction1?.lifestyle_indicators && extraction2?.lifestyle_indicators) {
    const lifestyle1 = extraction1.lifestyle_indicators;
    const lifestyle2 = extraction2.lifestyle_indicators;

    // Social preference
    if (lifestyle1.social_preference === lifestyle2.social_preference) {
      score += 15;
      strengths.push(`Both prefer ${lifestyle1.social_preference}`);
    }

    // Activity level
    if (lifestyle1.activity_level === lifestyle2.activity_level) {
      score += 10;
      strengths.push('Compatible activity levels');
    }

    // Home vs out
    if (lifestyle1.home_vs_out === lifestyle2.home_vs_out) {
      score += 10;
    }

    // Planning style
    if (lifestyle1.planning_style && lifestyle2.planning_style) {
      if (lifestyle1.planning_style === lifestyle2.planning_style) {
        score += 10;
        strengths.push(`Both ${lifestyle1.planning_style}`);
      } else {
        considerations.push('Different planning approaches');
      }
    }
  }

  // Relationship indicators from games
  if (extraction1?.relationship_indicators && extraction2?.relationship_indicators) {
    const rel1 = extraction1.relationship_indicators;
    const rel2 = extraction2.relationship_indicators;

    // Communication preference
    if (rel1.communication_preference === rel2.communication_preference) {
      score += 15;
      strengths.push('Compatible communication styles');
    }

    // Conflict style
    if (rel1.conflict_style && rel2.conflict_style) {
      if (rel1.conflict_style === 'collaborative' && rel2.conflict_style === 'collaborative') {
        score += 10;
        strengths.push('Both use collaborative conflict resolution');
      }
    }
  }

  // Geographic compatibility
  if (profile1.location_city === profile2.location_city) {
    score += 10;
    strengths.push('Same city');
  } else if (profile1.location_country === profile2.location_country) {
    score += 5;
  } else {
    considerations.push('Long-distance relationship');
  }

  return { score: Math.max(0, Math.min(100, score)), strengths, considerations };
}

/**
 * Check deal breakers - HARD FILTER
 */
async function checkDealBreakers(
  userId1: string,
  userId2: string
): Promise<{ score: number; dealBreakers: string[] }> {
  const supabase = getAdminClient();

  let score = 100; // Start perfect, subtract for violations
  const dealBreakers: string[] = [];

  // Get user 1's dealbreakers
  const { data: dealbreakers1 } = await supabase
    .from('dealbreaker_responses')
    .select('item_text, response')
    .eq('user_id', userId1)
    .eq('response', 'dealbreaker');

  // Get user 2's dealbreakers
  const { data: dealbreakers2 } = await supabase
    .from('dealbreaker_responses')
    .select('item_text, response')
    .eq('user_id', userId2)
    .eq('response', 'dealbreaker');

  // Get user 2's "must have" responses to check against user 1's dealbreakers
  const { data: traits2 } = await supabase
    .from('dealbreaker_responses')
    .select('item_text, response')
    .eq('user_id', userId2);

  const { data: traits1 } = await supabase
    .from('dealbreaker_responses')
    .select('item_text, response')
    .eq('user_id', userId1);

  // Check if user 2 has any of user 1's dealbreakers
  if (dealbreakers1 && traits2) {
    for (const db of dealbreakers1) {
      const user2Has = traits2.find(
        t => t.item_text === db.item_text &&
        (t.response === 'must_have' || t.response === 'nice_to_have')
      );
      if (user2Has) {
        score -= 50;
        dealBreakers.push(`User 1 deal-breaker: ${db.item_text}`);
      }
    }
  }

  // Check if user 1 has any of user 2's dealbreakers
  if (dealbreakers2 && traits1) {
    for (const db of dealbreakers2) {
      const user1Has = traits1.find(
        t => t.item_text === db.item_text &&
        (t.response === 'must_have' || t.response === 'nice_to_have')
      );
      if (user1Has) {
        score -= 50;
        dealBreakers.push(`User 2 deal-breaker: ${db.item_text}`);
      }
    }
  }

  return { score: Math.max(0, score), dealBreakers };
}

/**
 * MAIN ENHANCED COMPATIBILITY CALCULATION
 * Pulls from ALL data sources
 */
export async function calculateEnhancedCompatibility(
  userId1: string,
  userId2: string
): Promise<EnhancedCompatibilityScore> {
  const supabase = getAdminClient();

  // Fetch ALL data for both users
  const { data: profile1 } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId1)
    .single();

  const { data: profile2 } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId2)
    .single();

  const { data: extraction1 } = await supabase
    .from('profile_extractions')
    .select('*')
    .eq('user_id', userId1)
    .single();

  const { data: extraction2 } = await supabase
    .from('profile_extractions')
    .select('*')
    .eq('user_id', userId2)
    .single();

  if (!profile1 || !profile2) {
    throw new Error('Missing profile data');
  }

  // Calculate all dimensions
  const psych = await calculatePsychologicalCompatibility(
    profile1,
    profile2,
    extraction1,
    extraction2
  );

  const behavioral = calculateBehavioralCompatibility(extraction1, extraction2);

  const values = await calculateValuesCompatibility(
    userId1,
    userId2,
    profile1,
    profile2,
    extraction1,
    extraction2
  );

  const interests = await calculateInterestsCompatibility(
    userId1,
    userId2,
    extraction1,
    extraction2
  );

  const lifestyle = calculateLifestyleCompatibility(
    profile1,
    profile2,
    extraction1,
    extraction2
  );

  const dealbreakers = await checkDealBreakers(userId1, userId2);

  // Calculate weighted overall score
  const overall = Math.round(
    (psych.score * WEIGHTS.psychological / 100) +
    (behavioral.score * WEIGHTS.behavioral / 100) +
    (values.score * WEIGHTS.values_vision / 100) +
    (interests.score * WEIGHTS.interests / 100) +
    (lifestyle.score * WEIGHTS.lifestyle / 100) +
    (dealbreakers.score * WEIGHTS.dealbreakers / 100) +
    (50 * WEIGHTS.astrological / 100) // Placeholder for astro
  );

  // Calculate confidence based on data completeness
  const completeness1 = extraction1?.profile_completeness || 0;
  const completeness2 = extraction2?.profile_completeness || 0;
  const confidence = (completeness1 + completeness2) / 2;

  return {
    overall,
    breakdown: {
      psychological: psych.score,
      behavioral: behavioral.score,
      values_vision: values.score,
      interests: interests.score,
      lifestyle: lifestyle.score,
      dealbreakers: dealbreakers.score,
      astrological: 50
    },
    details: {
      strengths: [
        ...psych.strengths,
        ...behavioral.strengths,
        ...values.strengths,
        ...interests.strengths,
        ...lifestyle.strengths
      ],
      considerations: [
        ...psych.considerations,
        ...behavioral.considerations,
        ...values.considerations,
        ...lifestyle.considerations
      ],
      dealBreakers: [...values.dealBreakers, ...dealbreakers.dealBreakers],
      sharedInterests: interests.sharedInterests
    },
    confidence,
    dataCompleteness: {
      user1: completeness1,
      user2: completeness2
    }
  };
}
