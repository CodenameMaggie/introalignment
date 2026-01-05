import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/content/saved
 * Returns user's saved articles
 */
export async function GET(request: NextRequest) {
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

    // Get saved article IDs
    const { data: savedInteractions, error: savedError } = await supabase
      .from('content_interactions')
      .select('article_id, created_at')
      .eq('user_id', user.id)
      .eq('interaction_type', 'save')
      .order('created_at', { ascending: false });

    if (savedError) throw savedError;

    if (!savedInteractions || savedInteractions.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    // Get article details
    const articleIds = savedInteractions.map(i => i.article_id);

    const { data: articles, error: articlesError } = await supabase
      .from('content_articles')
      .select('*')
      .in('id', articleIds)
      .eq('is_published', true);

    if (articlesError) throw articlesError;

    // Add interaction counts to each article
    const articlesWithInteractions = await Promise.all(
      (articles || []).map(async (article) => {
        // Get like count
        const { count: likeCount } = await supabase
          .from('content_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', article.id)
          .eq('interaction_type', 'like');

        // Check if user liked this article
        const { data: userLike } = await supabase
          .from('content_interactions')
          .select('id')
          .eq('article_id', article.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like')
          .single();

        // Get saved_at timestamp from savedInteractions
        const savedInteraction = savedInteractions.find(i => i.article_id === article.id);

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
          user_liked: !!userLike,
          user_saved: true,
          saved_at: savedInteraction?.created_at
        };
      })
    );

    // Sort by saved_at (most recent first)
    articlesWithInteractions.sort((a, b) => {
      return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
    });

    return NextResponse.json({ articles: articlesWithInteractions });
  } catch (error: any) {
    console.error('Error fetching saved articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved articles' },
      { status: 500 }
    );
  }
}
