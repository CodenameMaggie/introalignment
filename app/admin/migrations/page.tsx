'use client';

import { useEffect, useState } from 'react';

interface Migration {
  filename: string;
  content: string;
  size: number;
  modified: string;
}

export default function MigrationsPage() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMigration, setExpandedMigration] = useState<string | null>(null);
  const [copiedMigration, setCopiedMigration] = useState<string | null>(null);

  useEffect(() => {
    loadMigrations();
  }, []);

  async function loadMigrations() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/migrations');
      const data = await response.json();
      setMigrations(data.migrations || []);
    } catch (error) {
      console.error('Error loading migrations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(content: string, filename: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMigration(filename);
      setTimeout(() => setCopiedMigration(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-navy mb-2">SQL Migrations</h1>
        <p className="text-gray-600">
          Database migration files - {migrations.length} total
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-navy mb-2">How to Run Migrations</h2>
        <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
          <li>Click on a migration file below to expand and view its contents</li>
          <li>Click "Copy SQL" to copy the migration to your clipboard</li>
          <li>Open your Supabase SQL Editor: <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Dashboard → SQL Editor</a></li>
          <li>Paste the SQL and click "Run" to execute the migration</li>
        </ol>
      </div>

      {/* Migrations List */}
      <div className="space-y-4">
        {migrations.map((migration) => {
          const isExpanded = expandedMigration === migration.filename;
          const isCopied = copiedMigration === migration.filename;

          return (
            <div
              key={migration.filename}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedMigration(isExpanded ? null : migration.filename)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-navy text-lg">
                      {migration.filename}
                    </h3>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      <span>Size: {formatFileSize(migration.size)}</span>
                      <span>Modified: {formatDate(migration.modified)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(migration.content, migration.filename);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isCopied
                          ? 'bg-green-500 text-white'
                          : 'bg-gold text-white hover:bg-gold/90'
                      }`}
                    >
                      {isCopied ? '✓ Copied!' : 'Copy SQL'}
                    </button>
                    <div className="text-2xl text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SQL Content */}
              {isExpanded && (
                <div className="border-t border-gray-200">
                  <pre className="p-6 bg-gray-900 text-gray-100 overflow-x-auto text-sm leading-relaxed">
                    <code>{migration.content}</code>
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {migrations.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="text-6xl mb-4">📂</div>
          <p className="text-xl font-semibold text-navy mb-2">No migrations found</p>
          <p className="text-gray-600">Migration files will appear here</p>
        </div>
      )}
    </div>
  );
}
