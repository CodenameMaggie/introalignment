'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    estate_size: '',
    primary_residence: '',
    legal_needs: [] as string[],
    urgency: 'next_3_months',
    how_found: '',
    additional_info: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/clients/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Submission failed');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleLegalNeedsChange = (need: string) => {
    setFormData(prev => ({
      ...prev,
      legal_needs: prev.legal_needs.includes(need)
        ? prev.legal_needs.filter(n => n !== need)
        : [...prev.legal_needs, need]
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-2xl bg-white p-12 rounded-lg shadow-luxury text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="font-heading text-4xl font-bold text-obsidian mb-4">
            Inquiry Received
          </h1>
          <p className="font-body text-xl text-charcoal mb-8">
            Thank you for your interest in IntroAlignment. Based on your needs, we'll connect you with qualified estate planning attorneys in your area. Expect to hear from us within 1-2 business days.
          </p>
          <Link
            href="/"
            className="inline-block bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-8 py-3 rounded-lg transition-all shadow-luxury"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-obsidian text-cream py-4 px-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-heading text-2xl font-bold text-gold">
            IntroAlignment
          </Link>
          <Link href="/" className="font-ui hover:text-gold transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-obsidian-gradient text-cream py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">
            Connect with <span className="text-gold-gradient">Elite Legal Counsel</span>
          </h1>
          <p className="font-body text-xl md:text-2xl text-pearl leading-relaxed">
            Tell us about your estate planning needs and we'll match you with qualified attorneys specializing in dynasty trusts, asset protection, and generational wealth strategies.
          </p>
        </div>
      </section>

      {/* Client Intake Form */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-10 rounded-lg shadow-luxury">
            <h2 className="font-heading text-3xl font-bold text-obsidian mb-2">
              Client Inquiry Form
            </h2>
            <p className="font-body text-charcoal mb-8">
              Please provide information about your estate planning needs. All information is confidential and will only be shared with attorneys matched to your requirements.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-charcoal">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div>
                <h3 className="font-heading text-xl font-bold text-obsidian mb-4 pb-2 border-b border-gold">
                  Contact Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Primary Residence (State) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.primary_residence}
                      onChange={(e) => setFormData({ ...formData, primary_residence: e.target.value })}
                      placeholder="e.g., California"
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                </div>
              </div>

              {/* Estate Information */}
              <div>
                <h3 className="font-heading text-xl font-bold text-obsidian mb-4 pb-2 border-b border-gold">
                  Estate Information
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Estimated Estate Size *
                    </label>
                    <select
                      required
                      value={formData.estate_size}
                      onChange={(e) => setFormData({ ...formData, estate_size: e.target.value })}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    >
                      <option value="">Select estate size...</option>
                      <option value="1M-5M">$1M - $5M</option>
                      <option value="5M-10M">$5M - $10M</option>
                      <option value="10M-25M">$10M - $25M</option>
                      <option value="25M-50M">$25M - $50M</option>
                      <option value="50M-100M">$50M - $100M</option>
                      <option value="100M+">$100M+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-4">
                      Legal Needs (Select all that apply) *
                    </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        'Dynasty Trusts',
                        'Asset Protection',
                        'Estate Planning',
                        'Tax Optimization',
                        'Business Succession',
                        'International Tax',
                        'Charitable Planning',
                        'Family Office Setup'
                      ].map((need) => (
                        <label key={need} className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-ivory transition">
                          <input
                            type="checkbox"
                            checked={formData.legal_needs.includes(need)}
                            onChange={() => handleLegalNeedsChange(need)}
                            className="w-4 h-4 text-gold border-gold rounded focus:ring-gold mr-3"
                          />
                          <span className="font-body text-charcoal">{need}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Timeline *
                    </label>
                    <select
                      required
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    >
                      <option value="immediate">Immediate (within 2 weeks)</option>
                      <option value="next_month">Next 30 days</option>
                      <option value="next_3_months">Next 3 months</option>
                      <option value="exploratory">Exploratory / No rush</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="font-heading text-xl font-bold text-obsidian mb-4 pb-2 border-b border-gold">
                  Additional Information
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Tell us more about your situation
                    </label>
                    <textarea
                      value={formData.additional_info}
                      onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                      rows={4}
                      placeholder="Describe your estate planning goals, specific challenges, or questions you'd like addressed..."
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>

                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      How did you hear about us?
                    </label>
                    <input
                      type="text"
                      value={formData.how_found}
                      onChange={(e) => setFormData({ ...formData, how_found: e.target.value })}
                      placeholder="e.g., Google search, referral, podcast..."
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-ivory p-6 rounded-lg border-l-4 border-sage">
                <p className="font-body text-sm text-charcoal leading-relaxed">
                  <strong>Confidentiality:</strong> All information submitted is confidential. IntroAlignment operates as a professional networking platform connecting clients with licensed attorneys. Submitting this form does not create an attorney-client relationship. An attorney-client relationship is only formed through a separate written engagement agreement with a specific attorney.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading || formData.legal_needs.length === 0}
                  className="w-full bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-10 py-4 rounded-lg transition-all shadow-luxury text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Inquiry'}
                </button>
                <p className="font-body text-sm text-charcoal mt-4 text-center">
                  We'll review your inquiry and connect you with qualified attorneys within 1-2 business days.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-pearl py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-ui text-sm">
            © {new Date().getFullYear()} IntroAlignment. All rights reserved.
          </p>
          <p className="font-ui text-xs text-medium-gray mt-2">
            IntroAlignment is a professional networking platform and does not provide legal services.
          </p>
        </div>
      </footer>
    </div>
  );
}
