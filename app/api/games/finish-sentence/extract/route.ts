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
    const { questionId, questionText, response } = body;

    // Use AI to analyze the response
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are analyzing a user's response to a "Finish the Sentence" prompt for a dating/relationship app.

Prompt: "${questionText}"
User's Response: "${response}"

Please analyze this response and extract:
1. Core values revealed (e.g., honesty, loyalty, growth, independence, connection)
2. Communication style (choose one: direct, reflective, playful, formal, emotional, analytical)
3. Emotional depth (rate 1-10, where 1 is surface-level and 10 is deeply introspective)
4. Vocabulary level (choose one: casual, conversational, articulate, sophisticated)
5. Key personality traits (e.g., thoughtful, adventurous, cautious, optimistic)

Format your response as JSON:
{
  "values": ["value1", "value2", "value3"],
  "communication_style": "style",
  "emotional_depth": 7,
  "vocabulary_level": "level",
  "personality_traits": ["trait1", "trait2"]
}`
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from AI');
    }

    const extraction = JSON.parse(content.text);

    // Store or update extraction in profile_extractions
    const { data: existingExtraction } = await supabase
      .from('profile_extractions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingExtraction) {
      // Merge new extraction data
      const updatedValues = {
        ...(existingExtraction.values_from_games || {}),
        [questionId]: extraction.values
      };
      const updatedCommunication = {
        ...(existingExtraction.communication_from_games || {}),
        [questionId]: {
          style: extraction.communication_style,
          emotional_depth: extraction.emotional_depth,
          vocabulary_level: extraction.vocabulary_level
        }
      };
      const updatedPersonality = {
        ...(existingExtraction.personality_from_games || {}),
        [questionId]: extraction.personality_traits
      };

      await supabase
        .from('profile_extractions')
        .update({
          values_from_games: updatedValues,
          communication_from_games: updatedCommunication,
          personality_from_games: updatedPersonality
        })
        .eq('id', existingExtraction.id);
    } else {
      // Create new extraction record
      await supabase
        .from('profile_extractions')
        .insert({
          user_id: user.id,
          values_from_games: { [questionId]: extraction.values },
          communication_from_games: {
            [questionId]: {
              style: extraction.communication_style,
              emotional_depth: extraction.emotional_depth,
              vocabulary_level: extraction.vocabulary_level
            }
          },
          personality_from_games: { [questionId]: extraction.personality_traits }
        });
    }

    return NextResponse.json({
      success: true,
      extraction: {
        values: extraction.values,
        communication_style: extraction.communication_style,
        emotional_depth: extraction.emotional_depth,
        vocabulary_level: extraction.vocabulary_level,
        personality_traits: extraction.personality_traits
      }
    });
  } catch (error) {
    console.error('Error extracting data:', error);
    return NextResponse.json(
      { error: 'Failed to extract data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
