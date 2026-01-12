'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ImportProspectsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/partners/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Upload failed');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    window.location.href = '/api/partners/import';
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-obsidian text-cream py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-heading text-2xl font-bold text-gold">
            IntroAlignment
          </Link>
          <div className="flex gap-6 font-ui">
            <Link href="/admin" className="hover:text-gold transition-colors">
              Admin Home
            </Link>
            <Link href="/" className="hover:text-gold transition-colors">
              Back to Site
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="bg-white rounded-lg shadow-luxury p-10">
          <h1 className="font-heading text-4xl font-bold text-obsidian mb-2">
            Import Podcast Prospects
          </h1>
          <p className="font-body text-charcoal mb-8">
            Batch upload estate planning attorneys from CSV file
          </p>

          {/* Instructions */}
          <div className="bg-ivory p-6 rounded-lg border-l-4 border-gold mb-8">
            <h2 className="font-heading text-xl font-bold text-obsidian mb-4">
              CSV Format Instructions
            </h2>
            <div className="font-body text-charcoal space-y-2">
              <p><strong>Required Fields:</strong></p>
              <ul className="list-disc ml-6 mb-4">
                <li><code>full_name</code> - Attorney's full name</li>
                <li><code>email</code> - Primary email address</li>
              </ul>
              <p><strong>Optional Fields:</strong></p>
              <ul className="list-disc ml-6 mb-4">
                <li><code>professional_title</code> - e.g., "Estate Planning Attorney"</li>
                <li><code>firm_name</code> - Law firm name</li>
                <li><code>years_experience</code> - Number (e.g., 15)</li>
                <li><code>licensed_states</code> - Semicolon-separated (e.g., "California;Nevada;Delaware")</li>
                <li><code>specializations</code> - Semicolon-separated (e.g., "Dynasty Trusts;Asset Protection")</li>
                <li><code>practice_type</code> - solo, small_firm_founder, boutique_partner, biglaw</li>
                <li><code>multi_state_practice</code> - true/false</li>
                <li><code>practice_owner</code> - true/false</li>
                <li><code>asset_protection_specialist</code> - true/false</li>
                <li><code>dynasty_trust_specialist</code> - true/false</li>
                <li><code>actec_fellow</code> - true/false</li>
                <li><code>content_creator</code> - true/false (blogs, LinkedIn, YouTube)</li>
                <li><code>conference_speaker</code> - true/false</li>
                <li><code>estate_size_focus</code> - e.g., "10M-50M"</li>
                <li><code>website_url</code> - Firm website</li>
                <li><code>linkedin_url</code> - LinkedIn profile</li>
                <li><code>source</code> - Where you found them (e.g., "actec_directory", "linkedin")</li>
              </ul>
            </div>
          </div>

          {/* Download Template Button */}
          <button
            onClick={downloadTemplate}
            className="w-full bg-sage hover:bg-sage-dark text-white font-ui font-semibold px-8 py-3 rounded-lg transition-all mb-8"
          >
            📥 Download CSV Template
          </button>

          {/* File Upload */}
          <div className="space-y-6">
            <div>
              <label className="block font-ui font-medium text-charcoal mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border-2 border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
              />
              {file && (
                <p className="font-body text-sm text-charcoal mt-2">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-10 py-4 rounded-lg transition-all shadow-luxury text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload & Import Prospects'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded">
              <p className="font-body text-charcoal">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Success Display */}
          {result && (
            <div className="mt-6 p-6 bg-green-50 border-l-4 border-green-500 rounded">
              <h3 className="font-heading text-xl font-bold text-obsidian mb-4">
                ✅ Import Successful
              </h3>
              <div className="font-body text-charcoal space-y-2">
                <p><strong>Imported:</strong> {result.imported} prospects</p>
                <p><strong>Duplicates Skipped:</strong> {result.duplicates}</p>
                <p><strong>Total Processed:</strong> {result.total}</p>
              </div>

              {result.prospects && result.prospects.length > 0 && (
                <div className="mt-4">
                  <p className="font-ui font-semibold text-obsidian mb-2">Imported Prospects:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    {result.prospects.map((p: any) => (
                      <li key={p.id} className="font-body text-sm">
                        {p.full_name} ({p.email})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-green-200">
                <p className="font-body text-charcoal mb-4">
                  <strong>Next Steps:</strong>
                </p>
                <ol className="list-decimal ml-6 space-y-2 font-body text-charcoal">
                  <li>Review imported prospects in admin dashboard</li>
                  <li>Send podcast invitations via Henry bot</li>
                  <li>Track responses and schedule recordings</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="font-heading text-2xl font-bold text-obsidian mb-4">
            After Importing
          </h2>
          <div className="font-body text-charcoal space-y-3">
            <p>
              <strong>1. Review Prospects:</strong> All imported prospects are marked as "prospect" status and "not_contacted" podcast status.
            </p>
            <p>
              <strong>2. Send Invitations:</strong> Use Henry bot to send personalized podcast invitations:
            </p>
            <pre className="bg-charcoal text-cream p-4 rounded text-sm overflow-x-auto">
{`POST /api/bots/henry
{
  "partner_id": "prospect-uuid",
  "campaign_type": "podcast_invitation"
}`}
            </pre>
            <p>
              <strong>3. Track Pipeline:</strong> Monitor podcast_status: not_contacted → contacted → interested → scheduled → recorded → published
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-charcoal text-pearl py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-ui text-sm">
            © {new Date().getFullYear()} IntroAlignment Admin
          </p>
        </div>
      </footer>
    </div>
  );
}
