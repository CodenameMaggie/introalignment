/**
 * Report Generator Service
 * Generates beautiful, personalized introduction reports for matches using Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAdminClient } from '@/lib/db/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface IntroductionReport {
  executiveSummary: string;
  compatibilityNarrative: string;
  growthOpportunities: string;
  conversationStarters: Array<{
    topic: string;
    why: string;
  }>;
  potentialChallenges: string;
  astrologicalInsights: string;
}

/**
 * Generate an introduction report for a match
 */
export async function generateIntroductionReport(
  matchId: string
): Promise<IntroductionReport> {
  const supabase = getAdminClient();

  // Get the match with all relevant user data
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(`
      *,
      user_a:users!matches_user_a_id_fkey (
        id,
        full_name,
        profiles (*),
        astro_profiles (*),
        profile_extractions (*)
      ),
      user_b:users!matches_user_b_id_fkey (
        id,
        full_name,
        profiles (*),
        astro_profiles (*),
        profile_extractions (*)
      )
    `)
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    throw new Error(`Failed to load match: ${matchError?.message}`);
  }

  const userA = match.user_a;
  const userB = match.user_b;

  // Prepare data for Claude
  const promptData = {
    userA: {
      firstName: userA.full_name?.split(' ')[0] || 'Person A',
      demographics: {
        age: userA.profiles?.[0]?.age,
        location: `${userA.profiles?.[0]?.location_city}, ${userA.profiles?.[0]?.location_country}`,
        relationshipStatus: userA.profiles?.[0]?.relationship_status,
        hasChildren: userA.profiles?.[0]?.has_children,
        wantsChildren: userA.profiles?.[0]?.wants_children
      },
      personality: {
        bigFive: {
          openness: userA.profile_extractions?.[0]?.openness,
          conscientiousness: userA.profile_extractions?.[0]?.conscientiousness,
          extraversion: userA.profile_extractions?.[0]?.extraversion,
          agreeableness: userA.profile_extractions?.[0]?.agreeableness,
          neuroticism: userA.profile_extractions?.[0]?.neuroticism
        },
        attachment: {
          secure: userA.profile_extractions?.[0]?.attachment_secure,
          anxious: userA.profile_extractions?.[0]?.attachment_anxious,
          avoidant: userA.profile_extractions?.[0]?.attachment_avoidant
        }
      },
      values: userA.profile_extractions?.[0]?.values_hierarchy || [],
      interests: userA.profile_extractions?.[0]?.interests || {},
      lifestyle: userA.profile_extractions?.[0]?.lifestyle_indicators || {},
      astrology: {
        bazi: userA.astro_profiles?.[0] ? {
          dayMaster: userA.astro_profiles[0].bazi_day_master,
          element: userA.astro_profiles[0].nine_star_element
        } : null,
        vedic: userA.astro_profiles?.[0] ? {
          moonSign: userA.astro_profiles[0].vedic_moon_sign,
          nakshatra: userA.astro_profiles[0].vedic_nakshatra
        } : null
      }
    },
    userB: {
      firstName: userB.full_name?.split(' ')[0] || 'Person B',
      demographics: {
        age: userB.profiles?.[0]?.age,
        location: `${userB.profiles?.[0]?.location_city}, ${userB.profiles?.[0]?.location_country}`,
        relationshipStatus: userB.profiles?.[0]?.relationship_status,
        hasChildren: userB.profiles?.[0]?.has_children,
        wantsChildren: userB.profiles?.[0]?.wants_children
      },
      personality: {
        bigFive: {
          openness: userB.profile_extractions?.[0]?.openness,
          conscientiousness: userB.profile_extractions?.[0]?.conscientiousness,
          extraversion: userB.profile_extractions?.[0]?.extraversion,
          agreeableness: userB.profile_extractions?.[0]?.agreeableness,
          neuroticism: userB.profile_extractions?.[0]?.neuroticism
        },
        attachment: {
          secure: userB.profile_extractions?.[0]?.attachment_secure,
          anxious: userB.profile_extractions?.[0]?.attachment_anxious,
          avoidant: userB.profile_extractions?.[0]?.attachment_avoidant
        }
      },
      values: userB.profile_extractions?.[0]?.values_hierarchy || [],
      interests: userB.profile_extractions?.[0]?.interests || {},
      lifestyle: userB.profile_extractions?.[0]?.lifestyle_indicators || {},
      astrology: {
        bazi: userB.astro_profiles?.[0] ? {
          dayMaster: userB.astro_profiles[0].bazi_day_master,
          element: userB.astro_profiles[0].nine_star_element
        } : null,
        vedic: userB.astro_profiles?.[0] ? {
          moonSign: userB.astro_profiles[0].vedic_moon_sign,
          nakshatra: userB.astro_profiles[0].vedic_nakshatra
        } : null
      }
    },
    compatibilityScores: {
      overall: match.overall_score,
      psychological: match.psychological_score,
      intellectual: match.intellectual_score,
      communication: match.communication_score,
      lifeAlignment: match.life_alignment_score,
      astrological: match.astrological_score
    },
    scoreDetails: match.score_details
  };

  const prompt = `You are a professional matchmaker crafting a beautiful, thoughtful introduction between two people who have been matched based on deep compatibility analysis.

# Match Data

${JSON.stringify(promptData, null, 2)}

# Your Task

Write a warm, insightful introduction report that helps these two people understand why they're a great match. Your writing should be:

1. **Authentic**: Speak to the real humans, not generic profiles
2. **Hopeful**: Highlight the genuine potential without overselling
3. **Balanced**: Celebrate strengths while being honest about areas to navigate
4. **Personal**: Use their actual values, interests, and personality traits
5. **Actionable**: Give them real conversation starters and insights

# Output Format (JSON)

{
  "executiveSummary": "2-3 paragraphs about why this match is special. Paint a picture of their potential together.",

  "compatibilityNarrative": "Deep dive into their compatibility across all dimensions:
    - Psychological (personality fit, emotional intelligence)
    - Intellectual (communication styles, curiosity, growth mindset)
    - Values & Vision (life goals, family, career, lifestyle)
    - Lifestyle (daily rhythms, social needs, adventure vs. stability)
    Use specific examples from their data.",

  "growthOpportunities": "How can they help each other grow? What complementary strengths do they bring? Be specific about the mutual benefits.",

  "conversationStarters": [
    {
      "topic": "A specific shared interest or value",
      "why": "Why this would be a great conversation for THEM specifically"
    },
    // 3-5 conversation starters total
  ],

  "potentialChallenges": "Be honest about areas that might need attention or communication. Frame these as opportunities for growth, not dealbreakers. Use their actual personality traits and values to identify realistic friction points.",

  "astrologicalInsights": "If astrological data is available, provide insights from BaZi (element harmony, day master compatibility), Vedic (moon sign and nakshatra compatibility), or Nine Star Ki. Keep this mystical but grounded. If no data, say: 'Astrological data not yet available.'"
}

# Important Guidelines

- NEVER make up information. If data is missing, acknowledge it gracefully.
- NEVER use names in the report (just "you" and "they")
- Keep the tone warm, professional, and hopeful
- Be specific with examples from their actual data
- Avoid clichés and generic dating advice
- Make it feel like a personal letter from a wise friend

Output ONLY valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const report: IntroductionReport = JSON.parse(content.text);

    // Save the report to the database
    const { error: insertError } = await supabase
      .from('introduction_reports')
      .insert({
        match_id: matchId,
        executive_summary: report.executiveSummary,
        compatibility_narrative: report.compatibilityNarrative,
        growth_opportunities: report.growthOpportunities,
        conversation_starters: report.conversationStarters,
        potential_challenges: report.potentialChallenges,
        astrological_insights: report.astrologicalInsights,
        generated_by: 'claude-sonnet-4',
        generation_tokens: response.usage.input_tokens + response.usage.output_tokens
      });

    if (insertError) {
      throw new Error(`Failed to save report: ${insertError.message}`);
    }

    return report;
  } catch (error: any) {
    console.error('Error generating introduction report:', error);
    throw new Error(`Failed to generate report: ${error.message}`);
  }
}

/**
 * Generate reports for all matches that don't have them yet
 */
export async function generateReportsBatch(): Promise<{
  reportsGenerated: number;
  errors: Array<{ matchId: string; error: string }>;
}> {
  const supabase = getAdminClient();

  // Get all matches without reports
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id')
    .eq('introduction_report_generated', false)
    .eq('status', 'pending');

  if (matchesError || !matches) {
    throw new Error(`Failed to load matches: ${matchesError?.message}`);
  }

  let reportsGenerated = 0;
  const errors: Array<{ matchId: string; error: string }> = [];

  for (const match of matches) {
    try {
      await generateIntroductionReport(match.id);
      reportsGenerated++;

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      errors.push({
        matchId: match.id,
        error: error.message || 'Unknown error'
      });
    }
  }

  return {
    reportsGenerated,
    errors
  };
}
