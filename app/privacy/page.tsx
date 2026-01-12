import Link from 'next/link';

export default function PrivacyPolicyPage() {
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-heading text-5xl text-obsidian mb-4">Privacy Policy</h1>
        <p className="font-body text-charcoal mb-8">Last updated: January 12, 2026</p>

        <div className="bg-white rounded-lg shadow-luxury p-8 space-y-8">
          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">1. Introduction</h2>
            <p className="font-body text-charcoal mb-4">
              IntroAlignment ("we," "our," or "us") operates a professional network connecting legal professionals, attorneys, and estate planning experts with high-net-worth clients seeking sophisticated legal services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
            </p>
            <p className="font-body text-charcoal">
              By using IntroAlignment, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">2. Information We Collect</h2>

            <h3 className="font-heading text-xl text-obsidian mb-3 mt-4">2.1 Information You Provide Directly</h3>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li><strong>Account Information:</strong> Name, email address, password</li>
              <li><strong>Professional Information:</strong> Bar number, professional title, firm name, years of experience, licensed states</li>
              <li><strong>Specializations:</strong> Practice areas, certifications, expertise (e.g., Dynasty Trusts, Asset Protection, Tax Law)</li>
              <li><strong>Professional Credentials:</strong> Publications, speaking engagements, media appearances, notable cases</li>
              <li><strong>Partnership Preferences:</strong> Partnership tier interest, podcast topics, availability</li>
              <li><strong>Communications:</strong> Email correspondence, application responses, support requests</li>
            </ul>

            <h3 className="font-heading text-xl text-obsidian mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on site</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">3. How We Use Your Information</h2>
            <p className="font-body text-charcoal mb-3">We use collected information for:</p>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li><strong>Partnership Matching:</strong> Connecting legal professionals with appropriate clients and opportunities</li>
              <li><strong>Podcast Production:</strong> Scheduling guests for sovereigndesign.it.com podcast, recording, and distribution</li>
              <li><strong>Professional Outreach:</strong> Sending partnership opportunities, podcast invitations, and network updates</li>
              <li><strong>Service Improvement:</strong> Analyzing usage patterns to enhance our platform</li>
              <li><strong>Communication:</strong> Responding to inquiries, providing support, sending administrative notices</li>
              <li><strong>Legal Compliance:</strong> Meeting legal obligations, protecting rights, preventing fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">4. Information Sharing and Disclosure</h2>

            <h3 className="font-heading text-xl text-obsidian mb-3 mt-4">4.1 We May Share Information With:</h3>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li><strong>Clients:</strong> Professional profiles shared with potential clients seeking legal services</li>
              <li><strong>Podcast Audience:</strong> Guest information, interviews, and expertise shared publicly via sovereigndesign.it.com</li>
              <li><strong>Service Providers:</strong> Third-party vendors (hosting, email, analytics) under confidentiality agreements</li>
              <li><strong>Legal Requirements:</strong> Law enforcement, regulators, courts when legally required</li>
              <li><strong>Business Transfers:</strong> In connection with merger, acquisition, or sale of assets</li>
            </ul>

            <h3 className="font-heading text-xl text-obsidian mb-3 mt-6">4.2 We Do NOT:</h3>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li>Sell your personal information to third parties</li>
              <li>Share bar numbers or confidential credentials publicly</li>
              <li>Disclose private communications without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">5. Your Rights and Choices</h2>

            <h3 className="font-heading text-xl text-obsidian mb-3 mt-4">5.1 All Users:</h3>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Unsubscribe:</strong> Opt out of marketing emails via unsubscribe link</li>
              <li><strong>Podcast Opt-Out:</strong> Request removal from podcast guest consideration</li>
            </ul>

            <h3 className="font-heading text-xl text-obsidian mb-3 mt-6">5.2 California Residents (CCPA):</h3>
            <p className="font-body text-charcoal mb-3">California residents have additional rights:</p>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li>Right to know what personal information is collected, used, shared</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of sale of personal information (we do not sell)</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>

            <h3 className="font-heading text-xl text-obsidian mb-3 mt-6">5.3 European Residents (GDPR):</h3>
            <p className="font-body text-charcoal mb-3">If you are in the European Economic Area, you have rights under GDPR:</p>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">6. Data Retention</h2>
            <p className="font-body text-charcoal mb-3">We retain information as follows:</p>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li><strong>Active Partners:</strong> Retained while partnership is active</li>
              <li><strong>Inactive Partners:</strong> Retained for 2 years after last activity, then deleted</li>
              <li><strong>Podcast Content:</strong> Retained indefinitely as published media</li>
              <li><strong>Application Data:</strong> Retained for 1 year if not approved</li>
              <li><strong>Communications:</strong> Retained for 3 years for legal compliance</li>
            </ul>
            <p className="font-body text-charcoal mt-3">
              You may request earlier deletion by contacting us at privacy@introalignment.com
            </p>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">7. Data Security</h2>
            <p className="font-body text-charcoal mb-3">We implement security measures including:</p>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Encrypted database storage</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits</li>
              <li>Employee confidentiality agreements</li>
            </ul>
            <p className="font-body text-charcoal mt-3">
              However, no system is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">8. Cookies and Tracking</h2>
            <p className="font-body text-charcoal mb-3">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside space-y-2 font-body text-charcoal ml-4">
              <li><strong>Essential Cookies:</strong> Authentication, security, basic functionality</li>
              <li><strong>Analytics Cookies:</strong> Understanding usage patterns (you can opt-out)</li>
              <li><strong>Preference Cookies:</strong> Remembering your settings</li>
            </ul>
            <p className="font-body text-charcoal mt-3">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">9. Professional Information Considerations</h2>
            <p className="font-body text-charcoal mb-3">
              <strong>Bar Numbers and Credentials:</strong> We verify professional credentials but keep bar numbers and sensitive licensing information confidential. Public profiles display only verified status, not specific credentials.
            </p>
            <p className="font-body text-charcoal mb-3">
              <strong>State Bar Compliance:</strong> We maintain records in compliance with state bar advertising and professional responsibility rules.
            </p>
            <p className="font-body text-charcoal">
              <strong>Client Referrals:</strong> When referring clients to partners, we share only information necessary for the legal engagement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">10. Children's Privacy</h2>
            <p className="font-body text-charcoal">
              IntroAlignment is intended for professional use by licensed attorneys and legal professionals. We do not knowingly collect information from individuals under 18 years of age.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">11. International Data Transfers</h2>
            <p className="font-body text-charcoal">
              Your information may be transferred to and processed in the United States. By using our services, you consent to such transfers. We implement appropriate safeguards for international transfers as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">12. Changes to This Policy</h2>
            <p className="font-body text-charcoal">
              We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last updated" date. Material changes will be communicated via email to active partners.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-3xl text-obsidian mb-4">13. Contact Us</h2>
            <p className="font-body text-charcoal mb-3">
              For privacy questions, requests, or concerns:
            </p>
            <div className="font-body text-charcoal ml-4">
              <p><strong>Email:</strong> privacy@introalignment.com</p>
              <p><strong>Website:</strong> <a href="https://introalignment.com" className="text-gold hover:text-gold-dark underline">introalignment.com</a></p>
              <p className="mt-3"><strong>Data Protection Officer:</strong> Available upon request for GDPR inquiries</p>
            </div>
          </section>

          <div className="mt-8 p-6 bg-gold-muted/20 rounded-lg border-l-4 border-gold">
            <p className="font-body text-charcoal">
              <strong className="font-heading text-obsidian">Important:</strong> This website is for informational purposes only and does not constitute legal advice. Consult with a licensed attorney for advice specific to your situation.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-charcoal text-pearl py-12 px-6 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-ui text-sm">
            © {new Date().getFullYear()} IntroAlignment. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
