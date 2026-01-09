import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | IntroAlignment',
  description: 'Privacy Policy for IntroAlignment dating and matchmaking service',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="text-sm text-gray-600 mb-8">
          <p><strong>Effective Date:</strong> January 9, 2026</p>
          <p><strong>Last Updated:</strong> January 9, 2026</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-700">
              IntroAlignment ("we," "our," or "us") operates the website <a href="https://introalignment.com" className="text-blue-600 hover:underline">introalignment.com</a> and provides matchmaking and dating services. We are committed to protecting your privacy and ensuring the security of your personal information.
            </p>
            <p className="text-gray-700">
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Information:</strong> Name, email address, password, date of birth, gender, location</li>
              <li><strong>Profile Information:</strong> Photos, bio, interests, relationship goals, lifestyle preferences</li>
              <li><strong>Personality Data:</strong> Responses to personality assessments, games, and questionnaires</li>
              <li><strong>Communication Data:</strong> Messages, feedback, support requests</li>
              <li><strong>Payment Information:</strong> Billing details processed through Stripe (we do not store credit card numbers)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2 Information We Collect Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, interactions</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Cookies and Tracking:</strong> Session cookies, authentication tokens, analytics data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.3 Information from Public Sources</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Public Social Media:</strong> We may collect publicly available information from platforms like Reddit to identify potential users interested in dating services</li>
              <li><strong>Aggregated Data:</strong> Publicly posted content, usernames, interests, relationship goals mentioned in public forums</li>
              <li><strong>Lead Generation:</strong> Email addresses generated from publicly available usernames using standard patterns</li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>

            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Matchmaking Services:</strong> Generate compatible matches based on personality, preferences, and dealbreakers</li>
              <li><strong>Platform Operations:</strong> Provide, maintain, and improve our services</li>
              <li><strong>Communication:</strong> Send service updates, match notifications, marketing emails (with opt-out option)</li>
              <li><strong>Personalization:</strong> Customize your experience, recommend content and features</li>
              <li><strong>Analytics:</strong> Analyze usage patterns, improve algorithms, measure engagement</li>
              <li><strong>Legal Compliance:</strong> Comply with legal obligations, prevent fraud, enforce our Terms of Service</li>
              <li><strong>Lead Outreach:</strong> Contact potential users who have expressed interest in dating services on public platforms</li>
            </ul>
          </section>

          {/* 3. Matching Algorithm */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Matching Algorithm</h2>

            <p className="text-gray-700">
              Our matching system uses <strong>100% algorithmic logic</strong> based on:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)</li>
              <li>Values alignment scores</li>
              <li>Dealbreaker compatibility</li>
              <li>Lifestyle preferences and goals</li>
              <li>Mathematical compatibility scoring</li>
            </ul>
            <p className="text-gray-700 mt-4">
              <strong>We do NOT use AI for matching.</strong> Matches are generated using pure mathematical algorithms without artificial intelligence.
            </p>
          </section>

          {/* 4. Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Information Sharing and Disclosure</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">We share your information with:</h3>

            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Matched Users:</strong> Your profile information is shared with users we match you with</li>
              <li><strong>Service Providers:</strong>
                <ul className="list-circle pl-6 mt-2 space-y-1">
                  <li>Supabase (database hosting and authentication)</li>
                  <li>Stripe (payment processing)</li>
                  <li>Forbes Command Center (email delivery)</li>
                  <li>Vercel/Railway (hosting infrastructure)</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Business Transfers:</strong> In connection with merger, acquisition, or sale of assets</li>
            </ul>

            <p className="text-gray-700 mt-4">
              <strong>We do NOT sell your personal information to third parties.</strong>
            </p>
          </section>

          {/* 5. Email Communications */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Email Communications</h2>

            <p className="text-gray-700">
              We may send you emails for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Service Emails:</strong> Account verification, password resets, security alerts (cannot opt-out)</li>
              <li><strong>Match Notifications:</strong> New match alerts, introduction reports</li>
              <li><strong>Marketing Emails:</strong> Product updates, tips, promotional offers</li>
              <li><strong>Lead Outreach:</strong> Invitations to join IntroAlignment based on public expressions of interest in dating</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-gray-800">
                <strong>Opt-Out Rights:</strong> You can unsubscribe from marketing emails at any time by clicking the "unsubscribe" link in any email or contacting us at <a href="mailto:henry@introalignment.com" className="text-blue-600 hover:underline">henry@introalignment.com</a>.
              </p>
            </div>
          </section>

          {/* 6. Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Data Security</h2>

            <p className="text-gray-700">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure authentication via Supabase Auth</li>
              <li>Password hashing and encryption</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and data segregation</li>
              <li>PCI-compliant payment processing via Stripe</li>
            </ul>

            <p className="text-gray-700 mt-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Data Retention</h2>

            <p className="text-gray-700">
              We retain your information for as long as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Your account is active</li>
              <li>Needed to provide you services</li>
              <li>Required to comply with legal obligations</li>
              <li>Necessary for legitimate business purposes</li>
            </ul>

            <p className="text-gray-700 mt-4">
              When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it by law.
            </p>
          </section>

          {/* 8. Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Your Rights and Choices</h2>

            <p className="text-gray-700">
              Depending on your location, you may have the following rights:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">All Users</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Update:</strong> Correct or update your profile information</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">California Residents (CCPA)</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information (we do not sell data)</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">European Residents (GDPR)</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to access, rectification, erasure, and data portability</li>
              <li>Right to restrict or object to processing</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-gray-800">
                <strong>To exercise your rights, contact us at:</strong><br />
                Email: <a href="mailto:henry@introalignment.com" className="text-blue-600 hover:underline">henry@introalignment.com</a>
              </p>
            </div>
          </section>

          {/* 9. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>

            <p className="text-gray-700">
              IntroAlignment is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If we discover that we have collected information from a child under 18, we will delete it immediately.
            </p>
          </section>

          {/* 10. International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. International Data Transfers</h2>

            <p className="text-gray-700">
              Your information may be transferred to and processed in the United States or other countries where our service providers operate. By using our services, you consent to the transfer of your information to countries outside your country of residence.
            </p>
          </section>

          {/* 11. Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Cookies and Tracking Technologies</h2>

            <p className="text-gray-700">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Essential Cookies:</strong> Authentication, security, session management</li>
              <li><strong>Analytics Cookies:</strong> Usage statistics, performance monitoring</li>
              <li><strong>Preference Cookies:</strong> Save your settings and preferences</li>
            </ul>

            <p className="text-gray-700 mt-4">
              You can control cookies through your browser settings. Disabling cookies may limit some functionality of our services.
            </p>
          </section>

          {/* 12. Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Third-Party Links</h2>

            <p className="text-gray-700">
              Our services may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          {/* 13. Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Changes to This Privacy Policy</h2>

            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Posting the updated policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>

            <p className="text-gray-700 mt-4">
              Your continued use of our services after changes are posted constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* 14. Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Contact Information</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-800 mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
              </p>

              <div className="space-y-2 text-gray-800">
                <p><strong>IntroAlignment</strong></p>
                <p>Email: <a href="mailto:henry@introalignment.com" className="text-blue-600 hover:underline">henry@introalignment.com</a></p>
                <p>Website: <a href="https://introalignment.com" className="text-blue-600 hover:underline">introalignment.com</a></p>
              </div>
            </div>
          </section>

          {/* Consent */}
          <section className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Consent</h2>
            <p className="text-gray-800">
              By using IntroAlignment, you acknowledge that you have read, understood, and agree to this Privacy Policy. If you do not agree with this policy, please do not use our services.
            </p>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
