import { createClient } from '@supabase/supabase-js';

interface ScoreBreakdown {
  relationship_intent: number; // 0-25
  age_fit: number; // 0-20
  location_fit: number; // 0-15
  engagement_quality: number; // 0-20
  profile_completeness: number; // 0-10
  recency: number; // 0-10
}

export class LeadScorer {
  private getSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Target profile for ideal lead
  private idealProfile = {
    relationship_goals: ['serious'],
    age_ranges: ['25-34', '35-44', '45-54', '50-60', '30-39', '40-49', '55-64'],
    locations: [] as string[], // Can be configured for geo-targeting
    engagement_signals: ['long post', 'thoughtful', 'specific details']
  };

  async scoreLead(leadId: string): Promise<number> {
    const supabase = this.getSupabase();
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return 0;

    const breakdown: ScoreBreakdown = {
      relationship_intent: this.scoreRelationshipIntent(lead),
      age_fit: this.scoreAgeFit(lead),
      location_fit: this.scoreLocationFit(lead),
      engagement_quality: this.scoreEngagementQuality(lead),
      profile_completeness: this.scoreProfileCompleteness(lead),
      recency: this.scoreRecency(lead)
    };

    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

    // Determine priority
    let priority = 'medium';
    if (totalScore >= 75) priority = 'high';
    else if (totalScore < 40) priority = 'low';

    // Update lead
    await supabase
      .from('leads')
      .update({
        fit_score: totalScore,
        fit_score_breakdown: breakdown,
        priority
      })
      .eq('id', leadId);

    return totalScore;
  }

  private scoreRelationshipIntent(lead: any): number {
    // Max 25 points
    let score = 0;

    const content = (lead.trigger_content || '').toLowerCase();

    // **QUALITY CHECK: Disqualify spam/low-quality**
    const negativeKeywords = [
      'onlyfans',
      'cashapp',
      'venmo',
      'paypal',
      'kik',
      'snapchat premium',
      'selling',
      'telegram',
      'whatsapp me',
      'dm for',
      'sugar daddy',
      'sugar baby',
      'findom',
      'feet pics',
      'send $',
      'cashapp',
      'quick hookup',
      'one night',
      'nsa',
      'fwb',
      'hookup only',
      'dtf'
    ];

    for (const negative of negativeKeywords) {
      if (content.includes(negative)) {
        return 0; // INSTANT DISQUALIFICATION for spam/transactional
      }
    }

    if (lead.relationship_goal === 'serious') {
      score += 20;
    } else if (lead.relationship_goal === 'unknown') {
      score += 10;
    } else if (lead.relationship_goal === 'casual') {
      return 0; // Disqualify casual seekers
    }

    // Bonus for explicit intent keywords
    const intentKeywords = [
      'marriage',
      'long-term',
      'settle down',
      'life partner',
      'serious relationship',
      'forever',
      'committed',
      'looking for something real',
      'tired of games',
      'genuine connection',
      'soulmate'
    ];

    for (const keyword of intentKeywords) {
      if (content.includes(keyword)) {
        score += 1;
        if (score >= 25) break;
      }
    }

    return Math.min(25, score);
  }

  private scoreAgeFit(lead: any): number {
    // Max 20 points
    if (!lead.estimated_age_range) return 10; // Unknown = neutral

    const targetRanges = ['25-34', '35-44', '45-54', '50-60', '30-39', '40-49', '55-64'];

    // Extract age from range (e.g., "28-33" -> 28)
    const ageMatch = lead.estimated_age_range.match(/(\d+)/);
    if (!ageMatch) return 10;

    const age = parseInt(ageMatch[1]);

    // Check if in target ranges
    for (const range of targetRanges) {
      const [min, max] = range.split('-').map(Number);
      if (age >= min && age <= max) {
        return 20;
      }
    }

    // Slightly outside target (22-24 or 61-65)
    if (age >= 22 && age <= 65) {
      return 15;
    }

    // Too young or too old
    if (age < 22 || age > 65) {
      return 5;
    }

    return 10;
  }

  private scoreLocationFit(lead: any): number {
    // Max 15 points
    if (!lead.location_mentioned) return 7; // Unknown = neutral

    // If we have target locations configured
    if (this.idealProfile.locations.length > 0) {
      const location = lead.location_mentioned.toLowerCase();
      if (this.idealProfile.locations.some((l: string) => location.includes(l.toLowerCase()))) {
        return 15;
      }
      return 5;
    }

    // Any location mentioned is good (shows they're real/specific)
    return 12;
  }

  private scoreEngagementQuality(lead: any): number {
    // Max 20 points
    let score = 0;

    const content = lead.trigger_content || '';

    // **QUALITY CHECK: Minimum content requirement**
    if (content.length < 50) {
      return 0; // Too short = low quality/spam
    }

    // **QUALITY CHECK: Bot/spam patterns**
    const spamPatterns = [
      /(.)\1{4,}/, // Repeated characters (hiiiii, heyyyy)
      /\b\w{20,}\b/, // Super long words (gibberish)
      /http|www\.|\.com|\.net/, // URLs
      /\d{10,}/, // Long number strings (phone spammers)
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        return 0; // Spam detected
      }
    }

    // Length indicates effort (stricter thresholds)
    if (content.length > 500) score += 8;
    else if (content.length > 300) score += 6;
    else if (content.length > 150) score += 4;
    else if (content.length > 75) score += 2;
    else score += 1;

    // Specific details (personal pronouns indicate authenticity)
    const personalPronouns = content.match(/\b(I am|I'm|I've|I want|I'm looking|my|me|myself)\b/gi);
    if (personalPronouns && personalPronouns.length > 3) {
      score += 5;
    } else if (personalPronouns && personalPronouns.length > 1) {
      score += 3;
    }

    // Thoughtfulness indicators
    const thoughtfulWords = ['because', 'reason', 'feel', 'think', 'believe', 'realize', 'understand'];
    const hasThoughtfulness = thoughtfulWords.some(word => content.toLowerCase().includes(word));
    if (hasThoughtfulness) {
      score += 4;
    }

    // Questions indicate engagement
    const questionCount = (content.match(/\?/g) || []).length;
    if (questionCount >= 2) score += 3;
    else if (questionCount === 1) score += 2;

    return Math.min(20, score);
  }

  private scoreProfileCompleteness(lead: any): number {
    // Max 10 points
    let score = 0;

    if (lead.email) score += 4;
    if (lead.estimated_age_range) score += 2;
    if (lead.estimated_gender) score += 1;
    if (lead.location_mentioned) score += 2;
    if (lead.full_name) score += 1;

    return Math.min(10, score);
  }

  private scoreRecency(lead: any): number {
    // Max 10 points
    const created = new Date(lead.created_at);
    const now = new Date();
    const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince < 1) return 10;
    if (daysSince < 3) return 8;
    if (daysSince < 7) return 6;
    if (daysSince < 14) return 4;
    if (daysSince < 30) return 2;
    return 0;
  }
}

// Batch scoring for efficiency
export async function scoreLeadsBatch(leadIds: string[]): Promise<void> {
  const scorer = new LeadScorer();

  for (const leadId of leadIds) {
    try {
      await scorer.scoreLead(leadId);
    } catch (error) {
      console.error(`Error scoring lead ${leadId}:`, error);
    }
  }
}
