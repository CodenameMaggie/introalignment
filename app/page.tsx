import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-obsidian text-cream py-4 px-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="font-heading text-2xl font-bold text-gold">IntroAlignment</h1>
          <div className="flex gap-6 font-ui">
            <a href="#services" className="hover:text-gold transition-colors">Services</a>
            <a href="#structures" className="hover:text-gold transition-colors">Structures</a>
            <a href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">Podcast</a>
            <Link href="/partners" className="hover:text-gold transition-colors">Partner With Us</Link>
            <Link href="/login" className="hover:text-gold transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-obsidian-gradient text-cream py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Legal Architecture for <span className="text-gold-gradient">Sovereign Living</span>
          </h1>
          <p className="font-body text-2xl md:text-3xl mb-8 text-pearl max-w-3xl mx-auto leading-relaxed">
            Dynasty trusts, asset protection structures, and cross-border planning for families building generational wealth
          </p>
          <a
            href="#contact"
            className="inline-block bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-10 py-4 rounded-lg transition-all shadow-luxury text-lg"
          >
            Add Your Name for Inquiries
          </a>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-ivory">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 text-obsidian">
            The Challenge
          </h2>
          <p className="font-body text-xl md:text-2xl text-charcoal leading-relaxed mb-8">
            High-net-worth families face a labyrinth of tax codes, estate laws, and asset protection requirements
            that span multiple jurisdictions. A single misstep can cost millions in unnecessary taxes or expose
            assets to litigation.
          </p>
          <p className="font-body text-xl md:text-2xl text-charcoal leading-relaxed">
            You need sophisticated legal structures that preserve wealth across generations—not just a will or
            basic trust, but a comprehensive tax-optimized architecture.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-12 text-center text-obsidian">
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Dynasty Trusts',
                description: 'Multi-generational wealth preservation structures designed to last centuries, not decades.'
              },
              {
                title: 'Asset Protection',
                description: 'Fortress-level shielding against creditors, litigation, and unforeseen liabilities.'
              },
              {
                title: 'Entity Structures',
                description: 'C-corps, LLCs, and hybrid structures optimized for tax efficiency and operational flexibility.'
              },
              {
                title: 'Cross-Border Planning',
                description: 'International trust structures, offshore entities, and tax treaty optimization.'
              },
              {
                title: 'Succession Planning',
                description: 'Seamless wealth transfer strategies that minimize estate taxes and family conflict.'
              },
              {
                title: 'Legal Compliance',
                description: 'Continuous monitoring of IRS regulations, SEC filings, and state-specific requirements.'
              }
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-lg shadow-luxury border-t-4 border-gold hover:shadow-xl transition-shadow"
              >
                <h3 className="font-heading text-2xl font-bold mb-4 text-obsidian">
                  {service.title}
                </h3>
                <p className="font-body text-lg text-charcoal leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structures Section */}
      <section id="structures" className="py-20 px-6 bg-charcoal text-cream">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-12 text-center">
            Legal Structures We Create
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                category: 'Trusts',
                items: [
                  'Irrevocable Life Insurance Trusts (ILITs)',
                  'Grantor Retained Annuity Trusts (GRATs)',
                  'Charitable Remainder Trusts (CRTs)',
                  'Qualified Personal Residence Trusts (QPRTs)',
                  'Special Needs Trusts',
                  'Spendthrift Trusts'
                ]
              },
              {
                category: 'Entities',
                items: [
                  'Family Limited Partnerships (FLPs)',
                  'C-Corporations with optimal tax structures',
                  'Delaware Statutory Trusts (DSTs)',
                  'Private Trust Companies (PTCs)',
                  'Offshore LLCs and IBCs',
                  'Series LLCs for asset segmentation'
                ]
              }
            ].map((structure, index) => (
              <div key={index} className="bg-obsidian-light p-8 rounded-lg">
                <h3 className="font-heading text-3xl font-bold mb-6 text-gold">
                  {structure.category}
                </h3>
                <ul className="space-y-3">
                  {structure.items.map((item, i) => (
                    <li key={i} className="font-body text-lg flex items-start">
                      <span className="text-gold mr-3 text-xl">→</span>
                      <span className="text-pearl">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 px-6 bg-ivory">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-12 text-center text-obsidian">
            Our Process
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Comprehensive Analysis',
                description: 'We map your entire financial landscape—assets, liabilities, tax exposure, succession goals, and jurisdictional considerations.'
              },
              {
                step: '02',
                title: 'Custom Architecture Design',
                description: 'Every structure is bespoke. We design trust and entity frameworks tailored to your family\'s unique needs and long-term vision.'
              },
              {
                step: '03',
                title: 'Implementation & Documentation',
                description: 'Precision execution with meticulous documentation. All filings, transfers, and legal instruments handled with institutional rigor.'
              },
              {
                step: '04',
                title: 'Ongoing Stewardship',
                description: 'Tax laws evolve. We provide continuous monitoring, annual reviews, and proactive adjustments to keep your structures optimized.'
              }
            ].map((step, index) => (
              <div key={index} className="flex gap-6 items-start bg-white p-8 rounded-lg shadow-luxury">
                <div className="font-heading text-5xl font-bold text-gold flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-bold mb-3 text-obsidian">
                    {step.title}
                  </h3>
                  <p className="font-body text-lg text-charcoal leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-20 px-6 bg-cream">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-8 text-obsidian">
            Our Philosophy
          </h2>
          <p className="font-body text-xl md:text-2xl text-charcoal leading-relaxed mb-6">
            Wealth preservation is not about avoiding taxes—it&apos;s about intelligent design. We believe in
            leveraging every legal mechanism available to protect what you&apos;ve built and ensure it serves
            your family for generations.
          </p>
          <p className="font-body text-xl md:text-2xl text-charcoal leading-relaxed mb-6">
            Our approach is rooted in deep knowledge of IRS regulations, SEC requirements, state business laws,
            and international tax treaties. We don&apos;t take shortcuts. We build fortresses.
          </p>
          <div className="inline-block bg-gold-muted/20 border-l-4 border-gold px-8 py-6 mt-8">
            <p className="font-body text-xl italic text-obsidian">
              &ldquo;A legacy isn&apos;t what you leave for your heirs—it&apos;s what you leave in them.
              The right legal structures ensure both are protected.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Podcast Section */}
      <section className="py-20 px-6 bg-sage text-cream">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            sovereigndesign.it.com Podcast
          </h2>
          <p className="font-body text-xl md:text-2xl mb-8 text-pearl leading-relaxed">
            Join us for in-depth conversations on dynasty trusts, asset protection, and legal structures for generational wealth. We feature top attorneys, CPAs, and wealth strategists sharing their expertise. Recording sessions available on Wednesdays.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-10 py-4 rounded-lg transition-all shadow-luxury text-lg"
            >
              Schedule Podcast Discussion
            </a>
            <Link
              href="/partners"
              className="inline-block bg-transparent border-2 border-cream hover:bg-cream/10 text-cream font-ui font-semibold px-10 py-4 rounded-lg transition-all text-lg"
            >
              Apply as Guest
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-6 bg-obsidian-gradient text-cream">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            Interested in Legal Architecture Services?
          </h2>
          <p className="font-body text-xl md:text-2xl mb-10 text-pearl leading-relaxed">
            We&apos;re building our network of legal professionals. Add your name to receive updates when consultation services become available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-block bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-10 py-4 rounded-lg transition-all shadow-luxury text-lg"
            >
              Add Your Name for Inquiries
            </Link>
            <a
              href="#services"
              className="inline-block bg-transparent border-2 border-gold hover:bg-gold/10 text-gold font-ui font-semibold px-10 py-4 rounded-lg transition-all text-lg"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="bg-ivory py-12 px-6 border-t-4 border-gold">
        <div className="max-w-5xl mx-auto">
          <h3 className="font-heading text-2xl font-bold text-obsidian mb-6 text-center">Legal Disclaimer</h3>
          <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-sage">
            <div className="space-y-4 font-body text-sm text-charcoal leading-relaxed">
              <p>
                <strong>Not Legal Advice:</strong> The information provided on this website is for general informational and educational purposes only and does not constitute legal, tax, financial, or professional advice. IntroAlignment is a professional network platform connecting attorneys with clients and does not practice law or provide legal services directly.
              </p>
              <p>
                <strong>No Attorney-Client Relationship:</strong> Use of this website does not create an attorney-client relationship between you and IntroAlignment or any attorney in our network. An attorney-client relationship is formed only through a separate written engagement agreement with a specific attorney.
              </p>
              <p>
                <strong>State-Specific Requirements:</strong> Legal requirements vary significantly by jurisdiction. Estate planning, asset protection, and tax strategies must be tailored to your specific state laws, federal regulations, and individual circumstances. Always consult with a licensed attorney in your state before making legal decisions.
              </p>
              <p>
                <strong>No Guarantees:</strong> Past performance and case examples do not guarantee future results. Legal outcomes depend on numerous factors including changes in law, court interpretations, and specific facts of each case. We make no warranties or guarantees regarding legal strategies or outcomes.
              </p>
              <p>
                <strong>Professional Network Only:</strong> IntroAlignment operates as a professional networking platform. All legal services are provided independently by licensed attorneys in our network who maintain their own professional liability insurance and bar memberships. We do not supervise, direct, or control the legal services provided by network attorneys.
              </p>
              <p>
                <strong>Consult Qualified Professionals:</strong> Before implementing any estate planning, asset protection, or tax strategy, you should consult with qualified legal, tax, and financial professionals licensed in your jurisdiction who can evaluate your specific circumstances.
              </p>
              <p className="pt-4 border-t border-sage/30 text-xs text-medium-gray">
                <strong>Compliance Note:</strong> IntroAlignment operates in accordance with state bar rules regarding lawyer advertising and referral services. All attorneys in our network maintain active bar licenses and professional liability insurance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-pearl py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading text-2xl font-bold text-gold mb-4">IntroAlignment</h3>
            <p className="font-body text-sm leading-relaxed">
              Professional legal network connecting estate planning attorneys with high-net-worth clients. Dynasty trusts, asset protection, and generational wealth strategies.
            </p>
          </div>
          <div>
            <h4 className="font-ui font-semibold text-gold mb-4">Network Services</h4>
            <ul className="font-body text-sm space-y-2">
              <li><a href="#services" className="hover:text-gold transition-colors">Attorney Matching</a></li>
              <li><a href="#services" className="hover:text-gold transition-colors">Professional Referrals</a></li>
              <li><a href="#services" className="hover:text-gold transition-colors">Legal Network Access</a></li>
              <li><a href="#services" className="hover:text-gold transition-colors">Podcast Platform</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-ui font-semibold text-gold mb-4">Resources</h4>
            <ul className="font-body text-sm space-y-2">
              <li><a href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">sovereigndesign.it.com Podcast</a></li>
              <li><Link href="/partners" className="hover:text-gold transition-colors">Partner With Us</Link></li>
              <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-charcoal-light text-center">
          <p className="font-ui text-sm text-medium-gray">
            © {new Date().getFullYear()} IntroAlignment. All rights reserved. IntroAlignment is a professional networking platform and does not provide legal services.
          </p>
          <p className="font-ui text-xs text-medium-gray mt-2">
            This website does not constitute legal advice. Consult a licensed attorney for legal guidance.
          </p>
        </div>
      </footer>
    </div>
  );
}
