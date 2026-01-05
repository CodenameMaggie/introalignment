'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
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

const categories = [
  'All',
  'Communication',
  'Attachment',
  'Dating',
  'Growth',
  'Lifestyle',
  'Wellness',
  'Career',
  'Family'
];

export default function ContentFeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  async function loadArticles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/content/articles?${params}`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCategoryGradient(category: string): string {
    const gradients: Record<string, string> = {
      Communication: 'from-blue-100 to-blue-50',
      Attachment: 'from-purple-100 to-purple-50',
      Dating: 'from-pink-100 to-pink-50',
      Growth: 'from-green-100 to-green-50',
      Lifestyle: 'from-yellow-100 to-yellow-50',
      Wellness: 'from-teal-100 to-teal-50',
      Career: 'from-indigo-100 to-indigo-50',
      Family: 'from-rose-100 to-rose-50'
    };
    return gradients[category] || 'from-gray-100 to-gray-50';
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="font-serif text-4xl text-navy mb-2">Insights</h1>
          <p className="text-gray-600">
            Thoughtful articles on relationships, growth, and intentional living
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">No articles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/content/${article.slug}`}
                className="group"
              >
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blush hover:shadow-md transition-all h-full flex flex-col">
                  {/* Cover Image or Gradient */}
                  {article.cover_image_url ? (
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-48 bg-gradient-to-br ${getCategoryGradient(
                        article.category
                      )}`}
                    />
                  )}

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Category Tag */}
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-navy text-cream text-xs font-semibold rounded-full">
                        {article.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-serif text-xl text-navy mb-2 group-hover:text-gold transition-colors line-clamp-2">
                      {article.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                      {article.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                      <span>{article.read_time_minutes} min read</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill={article.user_liked ? 'currentColor' : 'none'}
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
                          {article.like_count}
                        </span>
                        {article.user_saved && (
                          <svg
                            className="w-4 h-4 text-gold"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
