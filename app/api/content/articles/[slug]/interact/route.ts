import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/content/articles/[slug]/interact
 * Handle article interactions: read, like, save
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, readingTime } = body;

    if (!type || !['read', 'like', 'save'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }

    // Get article
    const { data: article, error: articleError } = await supabase
      .from('content_articles')
      .select('id, category')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Handle different interaction types
    if (type === 'read') {
      // Upsert read interaction with reading time
      const { error: readError } = await supabase
        .from('content_interactions')
        .upsert(
          {
            user_id: user.id,
            article_id: article.id,
            interaction_type: 'read',
            reading_time_seconds: readingTime || 0
          },
          {
            onConflict: 'user_id,article_id,interaction_type'
          }
        );

      if (readError) throw readError;

      // If reading time > 60 seconds, update interest mapping in profile_extractions
      if (readingTime && readingTime >= 60) {
        await updateInterestMapping(supabase, user.id, article.category);
      }

    } else if (type === 'like' || type === 'save') {
      // Check if interaction exists
      const { data: existing } = await supabase
        .from('content_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', article.id)
        .eq('interaction_type', type)
        .single();

      if (existing) {
        // Toggle off - delete interaction
        await supabase
          .from('content_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', article.id)
          .eq('interaction_type', type);

      } else {
        // Toggle on - create interaction
        await supabase
          .from('content_interactions')
          .insert({
            user_id: user.id,
            article_id: article.id,
            interaction_type: type,
            reading_time_seconds: 0
          });

        // Update interest mapping for significant engagement
        await updateInterestMapping(supabase, user.id, article.category);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error handling interaction:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}

/**
 * Update interest mapping in profile_extractions
 * Increments category engagement count
 */
async function updateInterestMapping(
  supabase: any,
  userId: string,
  category: string
) {
  try {
    // Get current profile extraction
    const { data: profile } = await supabase
      .from('profile_extractions')
      .select('interests_from_content')
      .eq('user_id', userId)
      .single();

    if (profile) {
      // Get current interests or initialize empty object
      const currentInterests = profile.interests_from_content || {};

      // Increment category count
      const newInterests = {
        ...currentInterests,
        [category]: (currentInterests[category] || 0) + 1
      };

      // Update profile
      await supabase
        .from('profile_extractions')
        .update({ interests_from_content: newInterests })
        .eq('user_id', userId);
    } else {
      // Create profile extraction if it doesn't exist
      await supabase
        .from('profile_extractions')
        .insert({
          user_id: userId,
          interests_from_content: { [category]: 1 }
        });
    }
  } catch (error) {
    console.error('Error updating interest mapping:', error);
    // Don't throw - interest mapping is nice-to-have, not critical
  }
}
