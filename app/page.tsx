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

      {/* Footer */}
      <footer className="bg-charcoal text-pearl py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading text-2xl font-bold text-gold mb-4">IntroAlignment</h3>
            <p className="font-body text-sm leading-relaxed">
              Legal Architecture for Sovereign Living. Dynasty trusts, asset protection, and generational wealth strategies.
            </p>
          </div>
          <div>
            <h4 className="font-ui font-semibold text-gold mb-4">Services</h4>
            <ul className="font-body text-sm space-y-2">
              <li><a href="#services" className="hover:text-gold transition-colors">Dynasty Trusts</a></li>
              <li><a href="#services" className="hover:text-gold transition-colors">Asset Protection</a></li>
              <li><a href="#services" className="hover:text-gold transition-colors">Entity Structures</a></li>
              <li><a href="#services" className="hover:text-gold transition-colors">Cross-Border Planning</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-ui font-semibold text-gold mb-4">Resources</h4>
            <ul className="font-body text-sm space-y-2">
              <li><a href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">sovereigndesign.it.com Podcast</a></li>
              <li><Link href="/partners" className="hover:text-gold transition-colors">Partner With Us</Link></li>
              <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link></li>
              <li><Link href="/admin" className="hover:text-gold transition-colors">Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-charcoal-light text-center">
          <p className="font-ui text-sm text-medium-gray">
            © {new Date().getFullYear()} IntroAlignment. All rights reserved. This site provides general information only and does not constitute legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
