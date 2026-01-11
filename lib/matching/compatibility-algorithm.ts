// SovereigntyIntroAlignment Compatibility Matching Algorithm
// Combines psychological, intellectual, values, and astrological compatibility

import { Profile, AstroProfile } from '@/types/database';
import { calculateBaZiCompatibility, BaZiChart } from '../astrology/bazi';
import { calculateNineStarKiCompatibility, NineStarKiChart } from '../astrology/nine-star-ki';
import { calculateVedicCompatibility, VedicChart } from '../astrology/vedic';

// Compatibility weights (must sum to 100)
const WEIGHTS = {
  psychological: 30,    // Big Five, Attachment, Enneagram, DISC
  intellectual: 15,     // Cognitive complexity, Communication style
  values_vision: 25,    // Core values, Life vision, Family goals
  astrological: 15,     // BaZi, Vedic, Nine Star Ki
  practical: 15         // Location, Age, Lifestyle, Deal-breakers
} as const;

export interface CompatibilityScore {
  overall: number; // 0-100
  breakdown: {
    psychological: number;
    intellectual: number;
    values_vision: number;
    astrological: number;
    practical: number;
  };
  details: {
    strengths: string[];
    considerations: string[];
    dealBreakers: string[];
  };
  confidence: number; // 0-1, based on data completeness
}

/**
 * Calculate psychological compatibility
 * Based on Big Five, Attachment Style, EQ, Enneagram, DISC, MBTI
 */
function calculatePsychologicalCompatibility(
  profile1: Profile,
  profile2: Profile
): { score: number; strengths: string[]; considerations: string[] } {
  let score = 50; // Base score
  const strengths: string[] = [];
  const considerations: string[] = [];

  // 1. Big Five Compatibility
  if (profile1.openness_score !== null && profile2.openness_score !== null) {
    // Conscientiousness and Agreeableness: similar is better
    const conscDiff = Math.abs((profile1.conscientiousness_score || 50) - (profile2.conscientiousness_score || 50));
    const agreeDiff = Math.abs((profile1.agreeableness_score || 50) - (profile2.agreeableness_score || 50));

    score += (50 - conscDiff) / 10; // More similar = higher score
    score += (50 - agreeDiff) / 10;

    if (conscDiff < 15 && agreeDiff < 15) {
      strengths.push('Similar personality traits suggest natural compatibility');
    }

    // Neuroticism: lower is generally better, especially if both are low
    const neuroAvg = ((profile1.neuroticism_score || 50) + (profile2.neuroticism_score || 50)) / 2;
    if (neuroAvg < 40) {
      score += 5;
      strengths.push('Both show emotional stability');
    }

    // Extraversion: doesn't need to match, but extreme differences can be challenging
    const extraDiff = Math.abs((profile1.extraversion_score || 50) - (profile2.extraversion_score || 50));
    if (extraDiff > 40) {
      score -= 5;
      considerations.push('Different energy levels may require accommodation');
    }
  }

  // 2. Attachment Style Compatibility
  if (profile1.attachment_style && profile2.attachment_style) {
    const attachment1 = profile1.attachment_style.toLowerCase();
    const attachment2 = profile2.attachment_style.toLowerCase();

    if (attachment1 === 'secure' && attachment2 === 'secure') {
      score += 15;
      strengths.push('Both have secure attachment - strong foundation for relationship');
    } else if (attachment1 === 'secure' || attachment2 === 'secure') {
      score += 10;
      strengths.push('One secure attachment can help stabilize the relationship');
    } else if (attachment1 === 'anxious' && attachment2 === 'avoidant') {
      score -= 10;
      considerations.push('Anxious-avoidant pairing requires awareness and effort');
    } else if (attachment1 === attachment2) {
      score += 5;
      considerations.push('Similar attachment styles - understand each other but may reinforce patterns');
    }
  }

  // 3. Emotional Intelligence Compatibility
  if (profile1.eq_overall !== null && profile2.eq_overall !== null) {
    const eqDiff = Math.abs(profile1.eq_overall - profile2.eq_overall);

    if (eqDiff < 15) {
      score += 10;
      strengths.push('Similar emotional intelligence levels');
    } else if (eqDiff > 30) {
      score -= 5;
      considerations.push('Different levels of emotional awareness');
    }

    // Both high EQ is a strong positive
    if (profile1.eq_overall > 70 && profile2.eq_overall > 70) {
      score += 5;
      strengths.push('Both demonstrate high emotional intelligence');
    }
  }

  // 4. Enneagram Compatibility
  if (profile1.enneagram_type !== null && profile2.enneagram_type !== null) {
    const type1 = profile1.enneagram_type;
    const type2 = profile2.enneagram_type;

    // Simplified Enneagram compatibility matrix
    const compatiblePairs = [
      [1, 7], [2, 8], [3, 6], [4, 9], [5, 9], [6, 9]
    ];

    const isCompatiblePair = compatiblePairs.some(
      pair => (pair[0] === type1 && pair[1] === type2) || (pair[0] === type2 && pair[1] === type1)
    );

    if (isCompatiblePair) {
      score += 5;
      strengths.push('Enneagram types complement each other well');
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    considerations
  };
}

/**
 * Calculate intellectual compatibility
 * Based on cognitive complexity, communication style, interests
 */
function calculateIntellectualCompatibility(
  profile1: Profile,
  profile2: Profile
): { score: number; strengths: string[]; considerations: string[] } {
  let score = 50;
  const strengths: string[] = [];
  const considerations: string[] = [];

  // 1. Cognitive Complexity Match
  if (profile1.cognitive_complexity !== null && profile2.cognitive_complexity !== null) {
    const cogDiff = Math.abs(profile1.cognitive_complexity - profile2.cognitive_complexity);

    if (cogDiff < 15) {
      score += 20;
      strengths.push('Similar intellectual depth and complexity');
    } else if (cogDiff < 25) {
      score += 10;
    } else {
      score -= 5;
      considerations.push('Different levels of cognitive complexity');
    }
  }

  // 2. Vocabulary Level Match
  if (profile1.vocabulary_level !== null && profile2.vocabulary_level !== null) {
    const vocabDiff = Math.abs(profile1.vocabulary_level - profile2.vocabulary_level);

    if (vocabDiff < 15) {
      score += 15;
      strengths.push('Similar communication styles and vocabulary');
    } else if (vocabDiff > 30) {
      score -= 5;
      considerations.push('Different communication complexity levels');
    }
  }

  // 3. Abstract Reasoning
  if (profile1.abstract_reasoning !== null && profile2.abstract_reasoning !== null) {
    const abstractDiff = Math.abs(profile1.abstract_reasoning - profile2.abstract_reasoning);

    if (abstractDiff < 20) {
      score += 15;
    } else {
      score -= 5;
      considerations.push('Different thinking styles - one more abstract, one more concrete');
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    considerations
  };
}

/**
 * Calculate values and life vision compatibility
 * Most important for long-term relationship success
 */
function calculateValuesVisionCompatibility(
  profile1: Profile,
  profile2: Profile
): { score: number; strengths: string[]; considerations: string[]; dealBreakers: string[] } {
  let score = 50;
  const strengths: string[] = [];
  const considerations: string[] = [];
  const dealBreakers: string[] = [];

  // 1. Core Values Alignment (CRITICAL)
  if (profile1.core_values && profile2.core_values) {
    const values1 = profile1.core_values as string[];
    const values2 = profile2.core_values as string[];

    const sharedValues = values1.filter(v => values2.includes(v));

    if (sharedValues.length >= 4) {
      score += 25;
      strengths.push(`${sharedValues.length} shared core values: ${sharedValues.slice(0, 3).join(', ')}`);
    } else if (sharedValues.length >= 2) {
      score += 15;
      strengths.push(`Shared values: ${sharedValues.join(', ')}`);
    } else if (sharedValues.length === 0) {
      score -= 10;
      considerations.push('No overlapping core values - explore whether this matters in practice');
    }
  }

  // 2. Children Compatibility (DEAL-BREAKER)
  if (profile1.wants_children && profile2.wants_children) {
    const wants1 = profile1.wants_children.toLowerCase();
    const wants2 = profile2.wants_children.toLowerCase();

    if ((wants1 === 'yes' && wants2 === 'no') || (wants1 === 'no' && wants2 === 'yes')) {
      score -= 30;
      dealBreakers.push('Fundamental disagreement about having children');
    } else if (wants1 === wants2) {
      score += 15;
      strengths.push('Aligned on family planning');
    }
  }

  // 3. Life Vision Alignment
  if (profile1.life_vision_summary && profile2.life_vision_summary) {
    // This would use NLP to compare life visions
    // For now, simplified check
    score += 10;
  }

  // 4. Geographic Flexibility
  if (profile1.geographic_flexibility && profile2.geographic_flexibility) {
    const geo1 = profile1.geographic_flexibility.toLowerCase();
    const geo2 = profile2.geographic_flexibility.toLowerCase();

    if (geo1.includes('flexible') || geo2.includes('flexible')) {
      score += 5;
      strengths.push('Geographic flexibility for relationship');
    }
  }

  // 5. Deal-breakers Check
  if (profile1.deal_breakers && profile2.deal_breakers) {
    // Check if either person's traits match the other's deal-breakers
    // This would require more sophisticated matching in production
    // For now, just note that we have deal-breaker data
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    considerations,
    dealBreakers
  };
}

/**
 * Calculate astrological compatibility
 * Combines BaZi, Vedic, and Nine Star Ki
 */
function calculateAstrologicalCompatibility(
  astro1: {
    bazi?: BaZiChart;
    vedic?: VedicChart;
    nineStarKi?: NineStarKiChart;
  },
  astro2: {
    bazi?: BaZiChart;
    vedic?: VedicChart;
    nineStarKi?: NineStarKiChart;
  }
): { score: number; strengths: string[]; considerations: string[] } {
  let score = 50;
  const strengths: string[] = [];
  const considerations: string[] = [];
  let systemsCount = 0;

  // 1. BaZi Compatibility
  if (astro1.bazi && astro2.bazi) {
    const baziScore = calculateBaZiCompatibility(astro1.bazi, astro2.bazi);
    score += (baziScore - 50) * 0.4; // Weight BaZi at 40%
    systemsCount++;

    if (baziScore >= 75) {
      strengths.push('Strong BaZi (Chinese astrology) harmony');
    } else if (baziScore < 40) {
      considerations.push('BaZi suggests some challenges to navigate');
    }
  }

  // 2. Vedic Compatibility
  if (astro1.vedic && astro2.vedic) {
    const vedicScore = calculateVedicCompatibility(astro1.vedic, astro2.vedic);
    score += (vedicScore - 50) * 0.35; // Weight Vedic at 35%
    systemsCount++;

    if (vedicScore >= 75) {
      strengths.push('Excellent Vedic astrology compatibility');
    } else if (vedicScore < 40) {
      considerations.push('Vedic astrology shows lower compatibility');
    }
  }

  // 3. Nine Star Ki Compatibility
  if (astro1.nineStarKi && astro2.nineStarKi) {
    const nskScore = calculateNineStarKiCompatibility(astro1.nineStarKi, astro2.nineStarKi);
    score += (nskScore - 50) * 0.25; // Weight Nine Star Ki at 25%
    systemsCount++;

    if (nskScore >= 80) {
      strengths.push('Nine Star Ki indicates natural harmony');
    }
  }

  // If no astrological data, return neutral score
  if (systemsCount === 0) {
    return {
      score: 50,
      strengths: [],
      considerations: ['Astrological compatibility not calculated (missing birth data)']
    };
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    considerations
  };
}

/**
 * Calculate practical compatibility
 * Location, age, lifestyle, logistical factors
 */
function calculatePracticalCompatibility(
  profile1: Profile,
  profile2: Profile
): { score: number; strengths: string[]; considerations: string[]; dealBreakers: string[] } {
  let score = 50;
  const strengths: string[] = [];
  const considerations: string[] = [];
  const dealBreakers: string[] = [];

  // 1. Age Compatibility
  if (profile1.age !== null && profile2.age !== null) {
    const ageDiff = Math.abs(profile1.age - profile2.age);

    if (ageDiff <= 5) {
      score += 20;
      strengths.push('Similar life stages');
    } else if (ageDiff <= 10) {
      score += 10;
    } else if (ageDiff <= 15) {
      score += 5;
    } else {
      considerations.push(`${ageDiff} year age difference`);
    }
  }

  // 2. Location Compatibility
  if (profile1.location_city && profile2.location_city) {
    if (profile1.location_city === profile2.location_city) {
      score += 15;
      strengths.push('Same city - easy to meet');
    } else if (profile1.location_country === profile2.location_country) {
      score += 5;
      considerations.push('Different cities, same country');
    } else {
      considerations.push('Long-distance relationship');
    }
  }

  // 3. Children Status Compatibility
  if (profile1.has_children !== null && profile2.has_children !== null) {
    if (profile1.has_children === profile2.has_children) {
      score += 10;
      if (profile1.has_children) {
        strengths.push('Both have children - understand that lifestyle');
      }
    }
  }

  // 4. Lifestyle Compatibility
  // This would compare lifestyle preferences from the JSON field
  score += 5; // Placeholder

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    considerations,
    dealBreakers
  };
}

/**
 * Main compatibility calculation function
 * Combines all dimensions with weighted scoring
 */
export async function calculateCompatibility(
  profile1: Profile,
  profile2: Profile,
  astro1?: AstroProfile,
  astro2?: AstroProfile
): Promise<CompatibilityScore> {
  // Calculate each dimension
  const psych = calculatePsychologicalCompatibility(profile1, profile2);
  const intel = calculateIntellectualCompatibility(profile1, profile2);
  const values = calculateValuesVisionCompatibility(profile1, profile2);
  const practical = calculatePracticalCompatibility(profile1, profile2);

  // Astrological compatibility (if data available)
  const astro = calculateAstrologicalCompatibility(
    {
      // These would be converted from AstroProfile to the specific chart types
      // Placeholder for now
    },
    {}
  );

  // Calculate weighted overall score
  const overall = Math.round(
    (psych.score * WEIGHTS.psychological / 100) +
    (intel.score * WEIGHTS.intellectual / 100) +
    (values.score * WEIGHTS.values_vision / 100) +
    (astro.score * WEIGHTS.astrological / 100) +
    (practical.score * WEIGHTS.practical / 100)
  );

  // Combine all strengths, considerations, and deal-breakers
  const allStrengths = [
    ...psych.strengths,
    ...intel.strengths,
    ...values.strengths,
    ...astro.strengths,
    ...practical.strengths
  ];

  const allConsiderations = [
    ...psych.considerations,
    ...intel.considerations,
    ...values.considerations,
    ...astro.considerations,
    ...practical.considerations
  ];

  const allDealBreakers = [
    ...values.dealBreakers,
    ...practical.dealBreakers
  ];

  // Calculate confidence based on data completeness
  let confidence = 0.5;
  let dataPoints = 0;
  let totalPoints = 0;

  // Check what data we have
  if (profile1.big_five_confidence !== null) {
    confidence += (profile1.big_five_confidence + (profile2.big_five_confidence || 0)) / 4;
    dataPoints++;
  }
  if (profile1.eq_confidence !== null) {
    confidence += (profile1.eq_confidence + (profile2.eq_confidence || 0)) / 4;
    dataPoints++;
  }
  if (profile1.core_values) dataPoints++;
  if (profile1.life_vision_summary) dataPoints++;

  totalPoints = 4;
  confidence = dataPoints / totalPoints;

  return {
    overall,
    breakdown: {
      psychological: psych.score,
      intellectual: intel.score,
      values_vision: values.score,
      astrological: astro.score,
      practical: practical.score
    },
    details: {
      strengths: allStrengths,
      considerations: allConsiderations,
      dealBreakers: allDealBreakers
    },
    confidence
  };
}

/**
 * Find potential matches for a user
 * Returns user IDs sorted by compatibility score
 */
export async function findPotentialMatches(
  userId: string,
  userProfile: Profile,
  userAstro: AstroProfile | null,
  candidateProfiles: Profile[],
  candidateAstros: Map<string, AstroProfile>
): Promise<Array<{ userId: string; score: CompatibilityScore }>> {
  const matches: Array<{ userId: string; score: CompatibilityScore }> = [];

  for (const candidate of candidateProfiles) {
    const candidateAstro = candidateAstros.get(candidate.user_id);

    const score = await calculateCompatibility(
      userProfile,
      candidate,
      userAstro || undefined,
      candidateAstro
    );

    // Only include if no deal-breakers and overall score is above threshold
    if (score.details.dealBreakers.length === 0 && score.overall >= 60) {
      matches.push({
        userId: candidate.user_id,
        score
      });
    }
  }

  // Sort by overall score descending
  matches.sort((a, b) => b.score.overall - a.score.overall);

  return matches;
}
