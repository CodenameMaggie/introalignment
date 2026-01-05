'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  read_time_minutes: number;
  author_name: string;
  published_at: string;
  like_count: number;
  save_count: number;
  user_liked: boolean;
  user_saved: boolean;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  read_time_minutes: number;
  published_at: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const readIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedReadRef = useRef(false);

  useEffect(() => {
    loadArticle();

    // Start reading time tracking
    startTimeRef.current = Date.now();

    // Log "read" after 30 seconds
    const readTimer = setTimeout(() => {
      if (!hasLoggedReadRef.current) {
        logInteraction('read', 30);
        hasLoggedReadRef.current = true;
      }
    }, 30000);

    // Update reading time every 30 seconds after initial read
    readIntervalRef.current = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent >= 30) {
        logInteraction('read', timeSpent);
      }
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearTimeout(readTimer);
      if (readIntervalRef.current) {
        clearInterval(readIntervalRef.current);
      }
      // Final reading time update
      const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (finalTime >= 30) {
        logInteraction('read', finalTime);
      }
    };
  }, [slug]);

  async function loadArticle() {
    setLoading(true);
    try {
      const response = await fetch(`/api/content/articles/${slug}`);
      if (!response.ok) throw new Error('Article not found');

      const data = await response.json();
      setArticle(data.article);
      setRelatedArticles(data.related_articles || []);
      setLiked(data.article.user_liked);
      setSaved(data.article.user_saved);
      setLikeCount(data.article.like_count);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  }

  async function logInteraction(type: 'read' | 'like' | 'save', readingTime?: number) {
    try {
      await fetch(`/api/content/articles/${slug}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          readingTime
        })
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  async function toggleLike() {
    try {
      await logInteraction('like');
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  async function toggleSave() {
    try {
      await logInteraction('save');
      setSaved(!saved);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-navy mb-4">Article not found</h1>
          <Link href="/content" className="text-gold hover:underline">
            Back to articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/content"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-navy mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to articles
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-6 py-8">
        {/* Cover Image */}
        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-96 object-cover rounded-xl mb-8"
          />
        )}

        {/* Metadata */}
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-navy text-cream text-sm font-semibold rounded-full mb-4">
            {article.category}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-navy mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-gray-600 text-sm">
            <span>{article.author_name}</span>
            <span>•</span>
            <span>{formatDate(article.published_at)}</span>
            <span>•</span>
            <span>{article.read_time_minutes} min read</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              liked
                ? 'bg-gold text-white'
                : 'border border-gray-300 text-gray-700 hover:border-gold hover:text-gold'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {likeCount}
          </button>

          <button
            onClick={toggleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              saved
                ? 'bg-navy text-white'
                : 'border border-gray-300 text-gray-700 hover:border-navy hover:text-navy'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-serif prose-headings:text-navy
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-gold prose-a:no-underline hover:prose-a:underline
            prose-ul:text-gray-700 prose-ol:text-gray-700
            prose-strong:text-navy"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h2 className="font-serif text-3xl text-navy mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/content/${related.slug}`}
                  className="group block"
                >
                  <div className="bg-cream rounded-lg p-4 border border-gray-200 hover:border-blush transition-all">
                    <h3 className="font-serif text-lg text-navy mb-2 group-hover:text-gold transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {related.excerpt}
                    </p>
                    <span className="text-xs text-gray-500">
                      {related.read_time_minutes} min read
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
