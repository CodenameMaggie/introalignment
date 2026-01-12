'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PartnersPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    professional_title: '',
    firm_name: '',
    bar_number: '',
    licensed_states: '',
    years_experience: '',
    specializations: '',
    linkedin_url: '',
    website_url: '',
    bio: '',
    publications: '',
    speaking_engagements: '',
    podcast_interest: false,
    podcast_topics: '',
    partnership_interest: 'consultant', // consultant, advisor, featured_partner
    how_found: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert('There was an error submitting your application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-2xl bg-white p-12 rounded-lg shadow-luxury text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="font-heading text-4xl font-bold text-obsidian mb-4">
            Application Received
          </h1>
          <p className="font-body text-xl text-charcoal mb-8">
            Thank you for your interest in partnering with IntroAlignment. We'll review your application and be in touch within 3-5 business days.
          </p>
          <div className="space-y-6">
            {formData.podcast_interest && (
              <div className="bg-sage/10 p-8 rounded-lg border-l-4 border-gold">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🎙️</div>
                  <h2 className="font-heading text-2xl font-bold text-obsidian mb-2">
                    Let's Schedule Your Podcast Session!
                  </h2>
                  <p className="font-body text-charcoal">
                    We're excited to feature you on sovereigndesign.it.com. Sessions are recorded on Wednesdays.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg mb-4">
                  <h3 className="font-heading text-lg font-bold text-obsidian mb-3">What to Expect:</h3>
                  <ul className="space-y-2 font-body text-charcoal">
                    <li className="flex items-start">
                      <span className="text-gold mr-2">→</span>
                      <span>45-60 minute conversation about your area of expertise</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gold mr-2">→</span>
                      <span>Recorded via Zoom on Wednesdays (flexible scheduling)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gold mr-2">→</span>
                      <span>Published to our network of high-net-worth clients and professionals</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gold mr-2">→</span>
                      <span>Full promotional support across our channels</span>
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <a
                    href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-10 py-4 rounded-lg transition-all shadow-luxury text-lg"
                  >
                    Schedule Your Wednesday Session
                  </a>
                  <p className="font-body text-sm text-charcoal mt-3">
                    Or we'll send you a calendar invitation within 1-2 business days
                  </p>
                </div>
              </div>
            )}
            <div className="text-center">
              <Link
                href="/"
                className="inline-block bg-charcoal hover:bg-charcoal-light text-cream font-ui font-semibold px-8 py-3 rounded-lg transition-all"
              >
                Return Home
              </Link>
            </div>
          </div>
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
      <section className="bg-obsidian-gradient text-cream py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">
            Partner with <span className="text-gold-gradient">IntroAlignment</span>
          </h1>
          <p className="font-body text-xl md:text-2xl text-pearl leading-relaxed mb-8">
            Join our network of elite legal professionals helping families build generational wealth through sophisticated trust and estate planning.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-ivory">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl font-bold text-center text-obsidian mb-12">
            Partnership Benefits
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-luxury border-t-4 border-gold">
              <h3 className="font-heading text-2xl font-bold text-obsidian mb-4">Client Referrals</h3>
              <p className="font-body text-charcoal leading-relaxed">
                Access high-net-worth clients actively seeking sophisticated estate planning and asset protection services.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-luxury border-t-4 border-gold">
              <h3 className="font-heading text-2xl font-bold text-obsidian mb-4">Podcast Platform</h3>
              <p className="font-body text-charcoal leading-relaxed mb-4">
                Share your expertise on the sovereigndesign.it.com podcast and establish yourself as a thought leader in wealth preservation. We book legal professionals and attorneys on Wednesdays.
              </p>
              <a
                href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-gold hover:text-gold-dark font-ui font-semibold underline text-sm"
              >
                Schedule your Wednesday session →
              </a>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-luxury border-t-4 border-gold">
              <h3 className="font-heading text-2xl font-bold text-obsidian mb-4">Collaborative Network</h3>
              <p className="font-body text-charcoal leading-relaxed">
                Connect with other top-tier attorneys, CPAs, and financial advisors specializing in complex estate structures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 px-6 bg-cream">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-10 rounded-lg shadow-luxury">
            <h2 className="font-heading text-3xl font-bold text-obsidian mb-2">
              Partner Application
            </h2>
            <p className="font-body text-charcoal mb-8">
              Tell us about your experience and how you'd like to collaborate with IntroAlignment.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-heading text-xl font-bold text-obsidian mb-4 pb-2 border-b border-gold">
                  Basic Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="font-heading text-xl font-bold text-obsidian mb-4 pb-2 border-b border-gold">
                  Professional Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Professional Title *
                    </label>
                    <input
                      type="text"
                      name="professional_title"
                      required
                      value={formData.professional_title}
                      onChange={handleChange}
                      placeholder="e.g., Estate Planning Attorney"
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Firm Name
                    </label>
                    <input
                      type="text"
                      name="firm_name"
                      value={formData.firm_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Bar Number(s)
                    </label>
                    <input
                      type="text"
                      name="bar_number"
                      value={formData.bar_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      name="years_experience"
                      required
                      value={formData.years_experience}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Licensed States *
                    </label>
                    <input
                      type="text"
                      name="licensed_states"
                      required
                      value={formData.licensed_states}
                      onChange={handleChange}
                      placeholder="e.g., California, New York, Delaware"
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Specializations *
                    </label>
                    <input
                      type="text"
                      name="specializations"
                      required
                      value={formData.specializations}
                      onChange={handleChange}
                      placeholder="e.g., Dynasty Trusts, Asset Protection, International Tax"
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Bio */}
              <div>
                <h3 className="font-heading text-xl font-bold text-obsidian mb-4 pb-2 border-b border-gold">
                  Professional Background
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Professional Bio *
                    </label>
                    <textarea
                      name="bio"
                      required
                      value={formData.bio}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Tell us about your experience, notable cases, areas of expertise, and what makes your approach unique..."
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Publications & Media
                    </label>
                    <textarea
                      name="publications"
                      value={formData.publications}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Books, articles, papers, media appearances, speaking engagements..."
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                </div>
              </div>

              {/* Partnership Preferences */}
              <div>
                <h3 className="font-heading text-xl font-bold text-obsidian mb-4 pb-2 border-b border-gold">
                  Partnership Preferences
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      Partnership Interest *
                    </label>
                    <select
                      name="partnership_interest"
                      value={formData.partnership_interest}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    >
                      <option value="consultant">Consultant (Per-case basis)</option>
                      <option value="advisor">Advisory Role (Ongoing collaboration)</option>
                      <option value="featured_partner">Featured Partner (Full partnership)</option>
                      <option value="podcast_only">Podcast Guest Only</option>
                    </select>
                    {formData.partnership_interest === 'podcast_only' && (
                      <p className="font-body text-sm text-charcoal mt-2">
                        Perfect! We book legal professionals on Wednesdays. After submitting, you can schedule your session immediately.
                      </p>
                    )}
                  </div>

                  <div className="bg-sage/10 p-6 rounded-lg border-l-4 border-gold">
                    <div className="flex items-start mb-4">
                      <div className="text-3xl mr-4">🎙️</div>
                      <div>
                        <h4 className="font-heading text-lg font-bold text-obsidian mb-2">
                          sovereigndesign.it.com Podcast
                        </h4>
                        <p className="font-body text-charcoal text-sm mb-3">
                          Share your expertise on dynasty trusts, asset protection, and wealth preservation strategies. Recording sessions on Wednesdays.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        name="podcast_interest"
                        checked={formData.podcast_interest}
                        onChange={handleChange}
                        className="w-5 h-5 text-gold border-gold rounded focus:ring-gold mr-3"
                      />
                      <span className="font-ui font-medium text-obsidian">
                        Yes, I'm interested in being a podcast guest
                      </span>
                    </label>

                    {formData.podcast_interest && (
                      <div className="space-y-4">
                        <div>
                          <label className="block font-ui font-medium text-charcoal mb-2">
                            Topics you can speak about *
                          </label>
                          <textarea
                            name="podcast_topics"
                            value={formData.podcast_topics}
                            onChange={handleChange}
                            rows={3}
                            placeholder="e.g., Dynasty trust structures, offshore asset protection, C-corp tax optimization, estate tax planning..."
                            className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                          />
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <p className="font-body text-sm text-charcoal mb-3">
                            <strong>Prefer to schedule now?</strong> Book your Wednesday podcast session:
                          </p>
                          <a
                            href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-6 py-2 rounded-lg transition-all text-sm"
                          >
                            Schedule Wednesday Session →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-ui font-medium text-charcoal mb-2">
                      How did you hear about us?
                    </label>
                    <input
                      type="text"
                      name="how_found"
                      value={formData.how_found}
                      onChange={handleChange}
                      placeholder="e.g., LinkedIn, referral, conference..."
                      className="w-full px-4 py-3 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-10 py-4 rounded-lg transition-all shadow-luxury text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
                <p className="font-body text-sm text-charcoal mt-4 text-center">
                  We'll review your application and contact you within 3-5 business days.
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
        </div>
      </footer>
    </div>
  );
}
