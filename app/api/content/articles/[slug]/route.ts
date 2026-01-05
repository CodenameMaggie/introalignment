import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/content/articles/[slug]
 * Returns single article with full content and logs view interaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await createClient();

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Get article
    const { data: article, error: articleError } = await supabase
      .from('content_articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Log view interaction if user is authenticated
    if (userId) {
      // Check if view already exists
      const { data: existingView } = await supabase
        .from('content_interactions')
        .select('id')
        .eq('user_id', userId)
        .eq('article_id', article.id)
        .eq('interaction_type', 'view')
        .single();

      // Only create view if it doesn't exist
      if (!existingView) {
        await supabase
          .from('content_interactions')
          .insert({
            user_id: userId,
            article_id: article.id,
            interaction_type: 'view',
            reading_time_seconds: 0
          });
      }
    }

    // Get like count
    const { count: likeCount } = await supabase
      .from('content_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', article.id)
      .eq('interaction_type', 'like');

    // Get save count
    const { count: saveCount } = await supabase
      .from('content_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', article.id)
      .eq('interaction_type', 'save');

    // Get user's interactions if authenticated
    let userLiked = false;
    let userSaved = false;

    if (userId) {
      const { data: userInteractions } = await supabase
        .from('content_interactions')
        .select('interaction_type')
        .eq('article_id', article.id)
        .eq('user_id', userId)
        .in('interaction_type', ['like', 'save']);

      userLiked = userInteractions?.some(i => i.interaction_type === 'like') || false;
      userSaved = userInteractions?.some(i => i.interaction_type === 'save') || false;
    }

    // Get related articles (same category, excluding current)
    const { data: relatedArticles } = await supabase
      .from('content_articles')
      .select('id, title, slug, excerpt, cover_image_url, read_time_minutes, published_at')
      .eq('category', article.category)
      .eq('is_published', true)
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(3);

    return NextResponse.json({
      article: {
        ...article,
        like_count: likeCount || 0,
        save_count: saveCount || 0,
        user_liked: userLiked,
        user_saved: userSaved
      },
      related_articles: relatedArticles || []
    });
  } catch (error: any) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
