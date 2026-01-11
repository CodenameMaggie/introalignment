import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-white border-b border-cream-dark">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="font-serif text-2xl font-semibold text-navy">
            SovereigntyIntroAlignment
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl text-navy mb-4">Terms of Service</h1>
        <p className="text-navy-light mb-8">Last updated: January 7, 2026</p>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">1. Acceptance of Terms</h2>
            <p className="text-navy-light mb-4">
              Welcome to SovereigntyIntroAlignment. By accessing or using our matchmaking service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our service.
            </p>
            <p className="text-navy-light">
              SovereigntyIntroAlignment is a premium matchmaking service that uses comprehensive data analysis, including conversational AI, psychometric profiling, and compatibility algorithms, to facilitate meaningful introductions between members seeking long-term relationships.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">2. Eligibility</h2>
            <p className="text-navy-light mb-4">
              You must be at least 18 years of age to use SovereigntyIntroAlignment. By creating an account, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>You are legally able to enter into a binding contract</li>
              <li>You are not prohibited from using the service under applicable law</li>
              <li>You will provide accurate, current, and complete information</li>
              <li>You are genuinely seeking a long-term romantic relationship</li>
              <li>You are legally single or otherwise able to pursue a romantic relationship</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">3. Account Registration and Security</h2>
            <p className="text-navy-light mb-4">
              To use SovereigntyIntroAlignment, you must create an account by providing accurate and complete information. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your profile information remains accurate and up-to-date</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">4. Service Description</h2>
            <p className="text-navy-light mb-4">
              SovereigntyIntroAlignment provides a curated matchmaking service that includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Conversational onboarding to understand your personality, values, and goals</li>
              <li>Psychometric analysis and compatibility assessment</li>
              <li>Thoughtful introductions to compatible individuals</li>
              <li>Access to engagement features and content</li>
              <li>Messaging capabilities with your matches</li>
            </ul>
            <p className="text-navy-light mt-4">
              We do not guarantee that you will find a romantic partner. The quality of matches depends on the accuracy of information you provide and the availability of compatible members.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">5. Subscription and Payments</h2>
            <p className="text-navy-light mb-4">
              SovereigntyIntroAlignment offers subscription-based access to our service. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Pay all fees associated with your chosen subscription plan</li>
              <li>Automatic renewal unless you cancel before the renewal date</li>
              <li>Our right to change pricing with 30 days advance notice</li>
              <li>No refunds for partial subscription periods</li>
            </ul>
            <p className="text-navy-light mt-4">
              All payments are processed securely through Stripe. We do not store your payment information on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">6. User Conduct</h2>
            <p className="text-navy-light mb-4">
              You agree not to use SovereigntyIntroAlignment to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Harass, abuse, or harm another person</li>
              <li>Provide false or misleading information</li>
              <li>Impersonate any person or entity</li>
              <li>Solicit money from other members</li>
              <li>Use the service for commercial purposes</li>
              <li>Share or use another member's personal information without consent</li>
              <li>Engage in any illegal or fraudulent activity</li>
              <li>Interfere with or disrupt the service</li>
            </ul>
            <p className="text-navy-light mt-4">
              We reserve the right to suspend or terminate your account for violating these conduct rules.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">7. Content and Intellectual Property</h2>
            <p className="text-navy-light mb-4">
              You retain ownership of any content you submit to SovereigntyIntroAlignment. However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content solely for the purpose of operating and improving our service.
            </p>
            <p className="text-navy-light">
              All SovereigntyIntroAlignment branding, design, algorithms, and technology are our intellectual property and may not be used without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">8. Privacy and Data Usage</h2>
            <p className="text-navy-light mb-4">
              Your privacy is important to us. Our collection and use of personal information is governed by our{' '}
              <Link href="/privacy" className="text-gold hover:text-gold-dark font-medium">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference.
            </p>
            <p className="text-navy-light">
              By using SovereigntyIntroAlignment, you consent to our use of your data for matchmaking purposes, including psychometric analysis and compatibility scoring.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">9. Safety and Background Checks</h2>
            <p className="text-navy-light mb-4">
              While we implement safety screening measures, we do not conduct criminal background checks on our members. You are solely responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Your own safety when meeting matches in person</li>
              <li>Vetting individuals you choose to meet</li>
              <li>Reporting any suspicious or dangerous behavior to us and authorities</li>
            </ul>
            <p className="text-navy-light mt-4">
              We strongly recommend meeting in public places and informing friends or family of your plans.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">10. Disclaimers and Limitation of Liability</h2>
            <p className="text-navy-light mb-4">
              SovereigntyIntroAlignment is provided "as is" without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>That you will find a compatible match</li>
              <li>The accuracy of compatibility scores or assessments</li>
              <li>The truthfulness of information provided by other members</li>
              <li>Uninterrupted or error-free service</li>
            </ul>
            <p className="text-navy-light mt-4">
              To the maximum extent permitted by law, SovereigntyIntroAlignment and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">11. Termination</h2>
            <p className="text-navy-light mb-4">
              You may cancel your account at any time through your account settings. We reserve the right to suspend or terminate your account if you:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Violate these Terms of Service</li>
              <li>Engage in fraudulent activity</li>
              <li>Pose a safety risk to other members</li>
              <li>Fail to pay subscription fees</li>
            </ul>
            <p className="text-navy-light mt-4">
              Upon termination, your access to the service will cease, but these Terms will continue to apply to your prior use.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">12. Dispute Resolution</h2>
            <p className="text-navy-light mb-4">
              Any disputes arising from these Terms or your use of SovereigntyIntroAlignment shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive your right to participate in class action lawsuits.
            </p>
            <p className="text-navy-light">
              These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">13. Changes to Terms</h2>
            <p className="text-navy-light">
              We may update these Terms from time to time. We will notify you of material changes via email or through the service. Your continued use of SovereigntyIntroAlignment after such notice constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">14. Contact Us</h2>
            <p className="text-navy-light mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <p className="text-navy-light">
              Email: legal@sovereigntyintroalignment.com<br />
              SovereigntyIntroAlignment, Inc.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-gold hover:text-gold-dark font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
