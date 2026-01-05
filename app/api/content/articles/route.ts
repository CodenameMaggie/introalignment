import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/content/articles
 * Returns published articles with interaction counts and user status
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const supabase = await createClient();

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Build query for articles
    let query = supabase
      .from('content_articles')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: articles, error } = await query;

    if (error) throw error;

    // For each article, get like count, save count, and user's interaction status
    const articlesWithInteractions = await Promise.all(
      (articles || []).map(async (article) => {
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

        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          category: article.category,
          tags: article.tags,
          cover_image_url: article.cover_image_url,
          read_time_minutes: article.read_time_minutes,
          author_name: article.author_name,
          published_at: article.published_at,
          like_count: likeCount || 0,
          save_count: saveCount || 0,
          user_liked: userLiked,
          user_saved: userSaved
        };
      })
    );

    return NextResponse.json({
      articles: articlesWithInteractions,
      total: articlesWithInteractions.length
    });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
