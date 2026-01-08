import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MatchScore {
  userId: string;
  overallScore: number;
  psychologicalScore: number;
  intellectualScore: number;
  communicationScore: number;
  lifeAlignmentScore: number;
  astrologicalScore: number;
  compatibilityBreakdown: any;
}

export class AutoMatcher {
  /**
   * Find potential matches for a user who just completed onboarding
   */
  async findMatches(userId: string, limit: number = 10): Promise<MatchScore[]> {
    // Get user's profile and conversation data
    const { data: user } = await supabase
      .from('users')
      .select(`
        *,
        profiles(*),
        conversations(*),
        profile_extractions(*)
      `)
      .eq('id', userId)
      .single();

    if (!user || !user.profiles?.[0]) {
      throw new Error('User profile not found');
    }

    const userProfile = user.profiles[0];

    // Get pool of potential matches (exclude self, already matched, blocked)
    const { data: potentialMatches } = await supabase
      .from('users')
      .select(`
        *,
        profiles(*),
        conversations(*),
        profile_extractions(*)
      `)
      .neq('id', userId)
      .eq('status', 'active')
      .eq('conversations.is_complete', true)
      .not('id', 'in', await this.getExcludedUserIds(userId));

    if (!potentialMatches || potentialMatches.length === 0) {
      return [];
    }

    // Score each potential match
    const scores: MatchScore[] = [];

    for (const candidate of potentialMatches) {
      if (!candidate.profiles?.[0]) continue;

      const score = await this.calculateMatchScore(user, candidate);
      if (score.overallScore >= 60) { // Minimum threshold
        scores.push({
          userId: candidate.id,
          ...score
        });
      }
    }

    // Sort by overall score descending
    scores.sort((a, b) => b.overallScore - a.overallScore);

    return scores.slice(0, limit);
  }

  /**
   * Calculate compatibility score between two users
   */
  private async calculateMatchScore(userA: any, userB: any): Promise<Omit<MatchScore, 'userId'>> {
    const profileA = userA.profiles[0];
    const profileB = userB.profiles[0];

    // 1. Dealbreakers check (immediate disqualification)
    if (this.hasDealbreakerConflict(profileA, profileB)) {
      return this.zeroScore();
    }

    // 2. Calculate individual dimensions
    const psychological = this.scorePsychological(profileA, profileB);
    const intellectual = this.scoreIntellectual(profileA, profileB);
    const communication = this.scoreCommunication(profileA, profileB);
    const lifeAlignment = this.scoreLifeAlignment(profileA, profileB);
    const astrological = this.scoreAstrological(profileA, profileB);

    // 3. Weighted average
    const overall = Math.round(
      psychological * 0.30 +
      intellectual * 0.25 +
      communication * 0.20 +
      lifeAlignment * 0.20 +
      astrological * 0.05
    );

    return {
      overallScore: overall,
      psychologicalScore: psychological,
      intellectualScore: intellectual,
      communicationScore: communication,
      lifeAlignmentScore: lifeAlignment,
      astrologicalScore: astrological,
      compatibilityBreakdown: {
        strengths: this.identifyStrengths(psychological, intellectual, communication, lifeAlignment),
        challenges: this.identifyChallenges(psychological, intellectual, communication, lifeAlignment),
        summary: this.generateSummary(overall)
      }
    };
  }

  /**
   * Check for dealbreaker conflicts
   */
  private hasDealbreakerConflict(profileA: any, profileB: any): boolean {
    // Children dealbreaker
    if (profileA.wants_children === true && profileB.wants_children === false) return true;
    if (profileA.wants_children === false && profileB.wants_children === true) return true;

    // Location dealbreaker (if neither willing to relocate and not in same area)
    if (
      profileA.geographic_flexibility === 'must_stay_local' &&
      profileB.geographic_flexibility === 'must_stay_local' &&
      profileA.location_city !== profileB.location_city
    ) {
      return true;
    }

    // Religious dealbreaker
    if (profileA.religion_importance === 'essential' && profileB.religion_importance === 'essential') {
      if (profileA.religion !== profileB.religion) return true;
    }

    // Age preference dealbreaker
    if (profileA.age_preference_min && profileB.age < profileA.age_preference_min) return true;
    if (profileA.age_preference_max && profileB.age > profileA.age_preference_max) return true;
    if (profileB.age_preference_min && profileA.age < profileB.age_preference_min) return true;
    if (profileB.age_preference_max && profileA.age > profileB.age_preference_max) return true;

    return false;
  }

  /**
   * Score psychological compatibility (Big Five, Attachment)
   */
  private scorePsychological(profileA: any, profileB: any): number {
    let score = 0;

    // Big Five compatibility (0-50 points)
    if (profileA.big_five && profileB.big_five) {
      const bigFiveA = profileA.big_five;
      const bigFiveB = profileB.big_five;

      // Openness: Similar is good
      score += this.similarityScore(bigFiveA.openness, bigFiveB.openness, 10);

      // Conscientiousness: Similar is good
      score += this.similarityScore(bigFiveA.conscientiousness, bigFiveB.conscientiousness, 10);

      // Extraversion: Doesn't need to match perfectly (5 points)
      score += this.complementaryScore(bigFiveA.extraversion, bigFiveB.extraversion, 5);

      // Agreeableness: Higher is better for both (10 points)
      score += ((bigFiveA.agreeableness + bigFiveB.agreeableness) / 200) * 10;

      // Neuroticism: Lower is better for both (complementary is ok)
      const avgNeuroticism = (bigFiveA.neuroticism + bigFiveB.neuroticism) / 2;
      score += (1 - avgNeuroticism / 100) * 15;
    } else {
      score += 25; // Neutral score if missing data
    }

    // Attachment style compatibility (0-50 points)
    const attachmentScore = this.scoreAttachment(
      profileA.attachment_style,
      profileB.attachment_style
    );
    score += attachmentScore;

    return Math.min(100, Math.round(score));
  }

  /**
   * Score intellectual compatibility
   */
  private scoreIntellectual(profileA: any, profileB: any): number {
    let score = 50; // Start neutral

    // Similar intellectual interests
    if (profileA.interests && profileB.interests) {
      const commonInterests = this.countCommonItems(profileA.interests, profileB.interests);
      score += commonInterests * 5; // +5 per shared interest (up to 30)
    }

    // Similar curiosity/openness to learning
    if (profileA.curiosity_score && profileB.curiosity_score) {
      score += this.similarityScore(profileA.curiosity_score, profileB.curiosity_score, 20);
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Score communication compatibility
   */
  private scoreCommunication(profileA: any, profileB: any): number {
    let score = 50;

    // Communication style match
    if (profileA.communication_style && profileB.communication_style) {
      if (profileA.communication_style === profileB.communication_style) {
        score += 25;
      } else {
        score += 10; // Different but not a problem
      }
    }

    // Conflict resolution compatibility
    if (profileA.conflict_style && profileB.conflict_style) {
      const conflictScore = this.scoreConflictStyle(
        profileA.conflict_style,
        profileB.conflict_style
      );
      score += conflictScore;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Score life alignment (goals, lifestyle, values)
   */
  private scoreLifeAlignment(profileA: any, profileB: any): number {
    let score = 0;

    // Values alignment (0-40 points)
    if (profileA.core_values && profileB.core_values) {
      const sharedValues = this.countCommonItems(profileA.core_values, profileB.core_values);
      score += sharedValues * 8; // Up to 40 points
    } else {
      score += 20; // Neutral if missing
    }

    // Life goals alignment (0-30 points)
    if (profileA.life_vision && profileB.life_vision) {
      score += this.compareLifeVisions(profileA.life_vision, profileB.life_vision);
    } else {
      score += 15; // Neutral if missing
    }

    // Lifestyle compatibility (0-30 points)
    score += this.scoreLifestyle(profileA, profileB);

    return Math.min(100, Math.round(score));
  }

  /**
   * Score astrological compatibility (optional/fun)
   */
  private scoreAstrological(profileA: any, profileB: any): number {
    if (!profileA.sun_sign || !profileB.sun_sign) return 50; // Neutral if missing

    // Simple compatibility matrix (this would be more complex in reality)
    const compatibility: Record<string, string[]> = {
      'Aries': ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
      'Taurus': ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
      'Gemini': ['Libra', 'Aquarius', 'Aries', 'Leo'],
      'Cancer': ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
      'Leo': ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
      'Virgo': ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
      'Libra': ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
      'Scorpio': ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
      'Sagittarius': ['Aries', 'Leo', 'Libra', 'Aquarius'],
      'Capricorn': ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
      'Aquarius': ['Gemini', 'Libra', 'Sagittarius', 'Aries'],
      'Pisces': ['Cancer', 'Scorpio', 'Taurus', 'Capricorn']
    };

    const signA = profileA.sun_sign;
    const signB = profileB.sun_sign;

    if (compatibility[signA]?.includes(signB)) {
      return 80; // Good match
    } else if (signA === signB) {
      return 60; // Same sign (can go either way)
    } else {
      return 40; // Not traditionally compatible
    }
  }

  // ==================== HELPER METHODS ====================

  private async getExcludedUserIds(userId: string): Promise<string[]> {
    const excluded: string[] = [];

    // Already matched
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user_a_id, user_b_id')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (existingMatches) {
      existingMatches.forEach(match => {
        if (match.user_a_id !== userId) excluded.push(match.user_a_id);
        if (match.user_b_id !== userId) excluded.push(match.user_b_id);
      });
    }

    // Blocked users
    const { data: blocks } = await supabase
      .from('user_blocks')
      .select('blocked_user_id')
      .eq('blocking_user_id', userId);

    if (blocks) {
      blocks.forEach(block => excluded.push(block.blocked_user_id));
    }

    return excluded;
  }

  private similarityScore(valueA: number, valueB: number, maxPoints: number): number {
    const diff = Math.abs(valueA - valueB);
    const similarity = 1 - (diff / 100); // 0-1
    return similarity * maxPoints;
  }

  private complementaryScore(valueA: number, valueB: number, maxPoints: number): number {
    // For traits where different can be good (e.g., introvert + extravert)
    return maxPoints * 0.8; // Usually get most points regardless
  }

  private scoreAttachment(styleA: string, styleB: string): number {
    // Secure + Secure = best
    if (styleA === 'secure' && styleB === 'secure') return 50;

    // Secure + any other = good
    if (styleA === 'secure' || styleB === 'secure') return 40;

    // Anxious + Avoidant = problematic
    if (
      (styleA === 'anxious' && styleB === 'avoidant') ||
      (styleA === 'avoidant' && styleB === 'anxious')
    ) {
      return 15;
    }

    // Two insecure but same type = medium
    if (styleA === styleB) return 25;

    return 20; // Default
  }

  private scoreConflictStyle(styleA: string, styleB: string): number {
    // Direct + Direct = good
    if (styleA === 'direct' && styleB === 'direct') return 25;

    // Avoidant + Avoidant = problematic
    if (styleA === 'avoidant' && styleB === 'avoidant') return 10;

    // Direct + Avoidant = challenging
    if (
      (styleA === 'direct' && styleB === 'avoidant') ||
      (styleA === 'avoidant' && styleB === 'direct')
    ) {
      return 15;
    }

    return 20; // Default
  }

  private countCommonItems(arrA: any[], arrB: any[]): number {
    if (!arrA || !arrB) return 0;
    const setB = new Set(arrB);
    return arrA.filter(item => setB.has(item)).length;
  }

  private compareLifeVisions(visionA: any, visionB: any): number {
    let score = 0;

    // Career ambition alignment
    if (visionA.career_importance === visionB.career_importance) score += 10;

    // Family priority alignment
    if (visionA.family_priority === visionB.family_priority) score += 10;

    // Adventure vs stability
    if (Math.abs(visionA.adventure_score - visionB.adventure_score) < 30) score += 10;

    return score;
  }

  private scoreLifestyle(profileA: any, profileB: any): number {
    let score = 0;

    // Similar activity level
    if (profileA.activity_level && profileB.activity_level) {
      if (profileA.activity_level === profileB.activity_level) score += 10;
      else score += 5;
    }

    // Similar social preference
    if (profileA.social_preference && profileB.social_preference) {
      if (profileA.social_preference === profileB.social_preference) score += 10;
      else score += 5;
    }

    // Similar schedule (morning/night person)
    if (profileA.chronotype && profileB.chronotype) {
      if (profileA.chronotype === profileB.chronotype) score += 10;
      else score += 5;
    }

    return score;
  }

  private identifyStrengths(psych: number, intel: number, comm: number, life: number): string[] {
    const strengths: string[] = [];
    if (psych >= 80) strengths.push('Strong psychological compatibility');
    if (intel >= 80) strengths.push('Aligned intellectual interests');
    if (comm >= 80) strengths.push('Excellent communication match');
    if (life >= 80) strengths.push('Shared life vision and values');
    return strengths;
  }

  private identifyChallenges(psych: number, intel: number, comm: number, life: number): string[] {
    const challenges: string[] = [];
    if (psych < 60) challenges.push('Different personality dynamics to navigate');
    if (intel < 60) challenges.push('Different intellectual approaches');
    if (comm < 60) challenges.push('Communication styles may need adjustment');
    if (life < 60) challenges.push('Some lifestyle differences to work through');
    return challenges;
  }

  private generateSummary(overall: number): string {
    if (overall >= 85) return 'Exceptional compatibility across all dimensions';
    if (overall >= 75) return 'Strong potential for a deeply fulfilling relationship';
    if (overall >= 65) return 'Good compatibility with room for growth together';
    if (overall >= 60) return 'Moderate compatibility worth exploring';
    return 'Limited compatibility based on current data';
  }

  private zeroScore(): Omit<MatchScore, 'userId'> {
    return {
      overallScore: 0,
      psychologicalScore: 0,
      intellectualScore: 0,
      communicationScore: 0,
      lifeAlignmentScore: 0,
      astrologicalScore: 0,
      compatibilityBreakdown: {
        strengths: [],
        challenges: ['Fundamental dealbreaker conflict'],
        summary: 'Not compatible due to dealbreaker mismatch'
      }
    };
  }
}

/**
 * Create matches for a user
 */
export async function createMatchesForUser(userId: string): Promise<number> {
  const matcher = new AutoMatcher();

  // Find top matches
  const potentialMatches = await matcher.findMatches(userId, 10);

  if (potentialMatches.length === 0) {
    return 0;
  }

  let created = 0;

  // Create match records
  for (const match of potentialMatches) {
    try {
      const { error } = await supabase.from('matches').insert({
        user_a_id: userId,
        user_b_id: match.userId,
        overall_score: match.overallScore,
        psychological_score: match.psychologicalScore,
        intellectual_score: match.intellectualScore,
        communication_score: match.communicationScore,
        life_alignment_score: match.lifeAlignmentScore,
        astrological_score: match.astrologicalScore,
        compatibility_breakdown: match.compatibilityBreakdown,
        status: 'pending', // Admin can review before introducing
        algorithm_version: '1.0'
      });

      if (!error) created++;
    } catch (error) {
      console.error(`Error creating match for ${match.userId}:`, error);
    }
  }

  return created;
}
