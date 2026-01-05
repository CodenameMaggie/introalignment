import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { puzzleId, response, timeSpentSeconds } = body;

    // Get puzzle details
    const { data: puzzle } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', puzzleId)
      .single();

    if (!puzzle) {
      return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
    }

    // Save attempt to puzzle_attempts
    const { data: attempt } = await supabase
      .from('puzzle_attempts')
      .insert({
        user_id: user.id,
        puzzle_id: puzzleId,
        response_text: response,
        time_spent_seconds: timeSpentSeconds || 0
      })
      .select()
      .single();

    // Generate insight using AI
    let insight = 'Thank you for your thoughtful response!';
    let extracted: any = null;

    if (puzzle.puzzle_type === 'scenario') {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `You are analyzing a user's response to a relationship/values puzzle.

Puzzle: ${puzzle.title}
Scenario: ${puzzle.puzzle_data.scenario || ''}
Question: ${puzzle.puzzle_data.question || ''}

User's Response: ${response}

Please provide:
1. A brief, encouraging insight about their response (2-3 sentences)
2. What values this response suggests (e.g., fairness, loyalty, independence)
3. What personality traits this reveals (e.g., thoughtful, direct, empathetic)

Format your response as JSON:
{
  "insight": "Brief encouraging insight here",
  "values": ["value1", "value2"],
  "traits": ["trait1", "trait2"]
}`
          }]
        });

        const content = message.content[0];
        if (content.type === 'text') {
          const analysis = JSON.parse(content.text);
          insight = analysis.insight;
          extracted = {
            values: analysis.values,
            personality: analysis.traits
          };

          // Store extraction in profile_extractions
          const { data: existingExtraction } = await supabase
            .from('profile_extractions')
            .select('id, values_from_puzzles, personality_from_puzzles')
            .eq('user_id', user.id)
            .single();

          if (existingExtraction) {
            // Merge new values and traits
            const updatedValues = {
              ...(existingExtraction.values_from_puzzles || {}),
              [puzzle.id]: analysis.values
            };
            const updatedPersonality = {
              ...(existingExtraction.personality_from_puzzles || {}),
              [puzzle.id]: analysis.traits
            };

            await supabase
              .from('profile_extractions')
              .update({
                values_from_puzzles: updatedValues,
                personality_from_puzzles: updatedPersonality
              })
              .eq('id', existingExtraction.id);
          } else {
            // Create new extraction record
            await supabase
              .from('profile_extractions')
              .insert({
                user_id: user.id,
                values_from_puzzles: { [puzzle.id]: analysis.values },
                personality_from_puzzles: { [puzzle.id]: analysis.traits }
              });
          }
        }
      } catch (aiError) {
        console.error('AI extraction error:', aiError);
        // Continue without AI insights if it fails
      }
    }

    // Award points to user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', user.id)
      .single();

    const newTotalPoints = (profile?.total_points || 0) + puzzle.points_value;

    await supabase
      .from('profiles')
      .update({ total_points: newTotalPoints })
      .eq('id', user.id);

    // Update engagement session
    const today = new Date().toISOString().split('T')[0];
    const { data: session } = await supabase
      .from('engagement_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .single();

    if (session) {
      await supabase
        .from('engagement_sessions')
        .update({
          daily_puzzle_completed: true,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', session.id);
    } else {
      await supabase
        .from('engagement_sessions')
        .insert({
          user_id: user.id,
          daily_puzzle_completed: true,
          last_activity_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      insight,
      points: puzzle.points_value,
      extracted
    });
  } catch (error) {
    console.error('Error submitting puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to submit puzzle' },
      { status: 500 }
    );
  }
}
