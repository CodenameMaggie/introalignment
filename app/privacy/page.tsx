import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-white border-b border-cream-dark">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="font-serif text-2xl font-semibold text-navy">
            IntroAlignment
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl text-navy mb-4">Privacy Policy</h1>
        <p className="text-navy-light mb-8">Last updated: January 7, 2026</p>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">1. Introduction</h2>
            <p className="text-navy-light mb-4">
              IntroAlignment ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our matchmaking service.
            </p>
            <p className="text-navy-light">
              By using IntroAlignment, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">2. Information We Collect</h2>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">2.1 Information You Provide Directly</h3>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li><strong>Account Information:</strong> Name, email address, password, date of birth</li>
              <li><strong>Profile Information:</strong> Location, occupation, education, photos, preferences</li>
              <li><strong>Conversation Data:</strong> Responses during our conversational onboarding process</li>
              <li><strong>Preferences:</strong> Relationship goals, values, lifestyle preferences, deal-breakers</li>
              <li><strong>Payment Information:</strong> Billing details (processed securely by Stripe)</li>
              <li><strong>Communications:</strong> Messages with matches, support requests, feedback</li>
            </ul>

            <h3 className="font-serif text-xl text-navy mb-3 mt-6">2.2 Information We Derive</h3>
            <p className="text-navy-light mb-3">
              Through our matchmaking process, we analyze your responses to derive:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li><strong>Psychometric Profiles:</strong> Big Five personality traits, Enneagram type, DISC profile</li>
              <li><strong>Attachment Style:</strong> Secure, anxious, avoidant, or disorganized patterns</li>
              <li><strong>Emotional Intelligence:</strong> Self-awareness, empathy, social skills</li>
              <li><strong>Cognitive Indicators:</strong> Communication style, vocabulary, thinking complexity</li>
              <li><strong>Values & Vision:</strong> Core values, life goals, family planning preferences</li>
              <li><strong>Astrological Data:</strong> Birth chart information if you provide birth date, time, and location</li>
            </ul>

            <h3 className="font-serif text-xl text-navy mb-3 mt-6">2.3 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on service</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
              <li><strong>Engagement Metrics:</strong> Response to matches, message activity, game participation</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">3. How We Use Your Information</h2>
            <p className="text-navy-light mb-4">
              We use the information we collect to:
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">3.1 Provide and Improve Our Service</h3>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Create and maintain your account</li>
              <li>Generate compatibility scores and match recommendations</li>
              <li>Facilitate introductions between compatible members</li>
              <li>Provide personalized content and features</li>
              <li>Improve our matching algorithms and service quality</li>
              <li>Conduct research and analysis to enhance user experience</li>
            </ul>

            <h3 className="font-serif text-xl text-navy mb-3 mt-6">3.2 Communication</h3>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Send you match introductions and notifications</li>
              <li>Provide customer support</li>
              <li>Send service updates and important announcements</li>
              <li>Request feedback and reviews (you may opt out)</li>
              <li>Send marketing communications (you may opt out)</li>
            </ul>

            <h3 className="font-serif text-xl text-navy mb-3 mt-6">3.3 Safety and Security</h3>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Detect and prevent fraud, abuse, and safety issues</li>
              <li>Screen for concerning behavioral patterns</li>
              <li>Investigate violations of our Terms of Service</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h3 className="font-serif text-xl text-navy mb-3 mt-6">3.4 Legal Compliance</h3>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Respond to legal requests and prevent harm</li>
              <li>Enforce our agreements and policies</li>
              <li>Protect our rights and property</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">4. How We Share Your Information</h2>
            <p className="text-navy-light mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">4.1 With Your Matches</h3>
            <p className="text-navy-light mb-3">
              When we introduce you to a match, we share profile information including your name, photos, compatibility summary, and conversation highlights. You control what additional information to share through messaging.
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">4.2 Service Providers</h3>
            <p className="text-navy-light mb-3">
              We work with trusted third-party service providers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Anthropic:</strong> AI conversation processing</li>
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Vercel:</strong> Hosting and infrastructure</li>
              <li><strong>SMTP Mail Server:</strong> Email delivery (self-hosted)</li>
            </ul>
            <p className="text-navy-light mt-3">
              These providers are contractually obligated to protect your data and use it only for the services they provide to us.
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">4.3 Legal Requirements</h3>
            <p className="text-navy-light mb-3">
              We may disclose your information if required by law or if we believe in good faith that such disclosure is necessary to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Comply with legal obligations or court orders</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or abuse</li>
              <li>Protect the safety of users or the public</li>
            </ul>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">4.4 Business Transfers</h3>
            <p className="text-navy-light mb-3">
              If IntroAlignment is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your information becomes subject to a different privacy policy.
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">4.5 Aggregated Data</h3>
            <p className="text-navy-light mb-3">
              We may share aggregated, anonymized data that cannot identify you for research, analytics, or marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">5. Data Security</h2>
            <p className="text-navy-light mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Row-level security policies in our database</li>
              <li>Regular security audits and updates</li>
              <li>Limited employee access to personal data</li>
              <li>Secure payment processing through PCI-compliant providers</li>
            </ul>
            <p className="text-navy-light mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">6. Your Privacy Rights</h2>
            <p className="text-navy-light mb-4">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">6.1 Access and Portability</h3>
            <p className="text-navy-light mb-3">
              You can request a copy of your personal data in a machine-readable format.
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">6.2 Correction</h3>
            <p className="text-navy-light mb-3">
              You can update most of your information directly through your account settings.
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">6.3 Deletion</h3>
            <p className="text-navy-light mb-3">
              You can request deletion of your account and personal data. We will retain some information as required by law or for legitimate business purposes (e.g., fraud prevention).
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">6.4 Opt-Out of Marketing</h3>
            <p className="text-navy-light mb-3">
              You can unsubscribe from marketing emails using the link in any marketing message or through your account settings.
            </p>

            <h3 className="font-serif text-xl text-navy mb-3 mt-4">6.5 Object to Processing</h3>
            <p className="text-navy-light mb-3">
              You may object to certain types of data processing. Note that this may limit your ability to use our service.
            </p>

            <p className="text-navy-light mt-4">
              To exercise these rights, please contact us at privacy@introalignment.com.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">7. Data Retention</h2>
            <p className="text-navy-light mb-4">
              We retain your information for as long as your account is active or as needed to provide our services. When you delete your account:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Your profile becomes inactive and is not shown to other users</li>
              <li>Most personal data is deleted within 30 days</li>
              <li>Some data may be retained for legal compliance, fraud prevention, or analytics (in anonymized form)</li>
              <li>Backup copies may persist for up to 90 days</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">8. Children's Privacy</h2>
            <p className="text-navy-light">
              IntroAlignment is not intended for individuals under 18 years of age. We do not knowingly collect information from children. If we learn that we have collected information from a child under 18, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">9. International Data Transfers</h2>
            <p className="text-navy-light">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure that such transfers are protected by appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">10. California Privacy Rights (CCPA)</h2>
            <p className="text-navy-light mb-4">
              California residents have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Right to know what personal information we collect, use, and share</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the "sale" of personal information (we do not sell your data)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
            <p className="text-navy-light mt-4">
              To exercise these rights, contact us at privacy@introalignment.com.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">11. European Privacy Rights (GDPR)</h2>
            <p className="text-navy-light mb-4">
              If you are in the European Economic Area, you have rights under the General Data Protection Regulation (GDPR), including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">12. Cookies and Tracking</h2>
            <p className="text-navy-light mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-navy-light ml-4">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns</li>
              <li>Improve our service</li>
            </ul>
            <p className="text-navy-light mt-4">
              You can control cookies through your browser settings, but this may limit functionality of our service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-navy-light">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through prominent notice on our service. Your continued use after such notice constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy mb-4">14. Contact Us</h2>
            <p className="text-navy-light mb-4">
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <p className="text-navy-light">
              Email: privacy@introalignment.com<br />
              Subject: Privacy Inquiry<br />
              IntroAlignment, Inc.
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
