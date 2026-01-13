export default function HomePage() {
  return (
    <div style={{ margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --primary: #1C2833;
            --gold: #B8935F;
            --gold-light: #D4B896;
            --cream: #f8f6f3;
            --charcoal: #2c3e50;
            --white: #ffffff;
            --text-light: #666666;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.8;
            color: var(--primary);
            background: var(--cream);
        }

        h1, h2, h3, h4 {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 400;
            line-height: 1.3;
            letter-spacing: -0.01em;
        }

        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, var(--primary) 0%, var(--charcoal) 100%);
            color: var(--cream);
            padding: 5rem 2rem;
            text-align: center;
        }

        .hero h1 {
            font-size: clamp(2.2rem, 5vw, 3.5rem);
            margin-bottom: 1rem;
            font-weight: 400;
        }

        .hero .gold-text {
            color: var(--gold);
        }

        .hero p {
            font-family: 'Inter', sans-serif;
            font-size: 1.1rem;
            font-weight: 300;
            opacity: 0.9;
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        .btn-gold {
            display: inline-block;
            background: var(--gold);
            color: var(--primary);
            padding: 0.9rem 2rem;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            font-size: 0.85rem;
            text-decoration: none;
            border-radius: 3px;
            letter-spacing: 0.5px;
            transition: background 0.2s ease;
        }

        .btn-gold:hover {
            background: var(--gold-light);
        }

        /* Content Section */
        .content {
            background: var(--cream);
            padding: 4rem 2rem;
            max-width: 1100px;
            margin: 0 auto;
        }

        .content h2 {
            font-size: clamp(1.8rem, 4vw, 2.5rem);
            color: var(--primary);
            margin-bottom: 1rem;
            text-align: center;
        }

        .content > p {
            font-size: 1.05rem;
            color: var(--text-light);
            text-align: center;
            max-width: 700px;
            margin: 0 auto 3rem;
            line-height: 1.9;
        }

        /* Cards */
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .card {
            background: var(--white);
            padding: 2rem;
            border-radius: 4px;
            border-top: 2px solid var(--gold);
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .card h3 {
            font-size: 1.4rem;
            color: var(--primary);
            margin-bottom: 0.75rem;
            font-weight: 500;
        }

        .card p {
            font-size: 0.95rem;
            color: var(--text-light);
            line-height: 1.7;
        }

        /* Process Section */
        .process {
            background: var(--white);
            padding: 4rem 2rem;
        }

        .process-inner {
            max-width: 900px;
            margin: 0 auto;
        }

        .process h2 {
            font-size: clamp(1.8rem, 4vw, 2.5rem);
            color: var(--primary);
            margin-bottom: 3rem;
            text-align: center;
        }

        .step {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 2rem;
            align-items: flex-start;
        }

        .step-number {
            font-family: 'Cormorant Garamond', serif;
            font-size: 2.5rem;
            font-weight: 300;
            color: var(--gold);
            line-height: 1;
            min-width: 50px;
        }

        .step-content h3 {
            font-size: 1.3rem;
            color: var(--primary);
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        .step-content p {
            font-size: 0.95rem;
            color: var(--text-light);
            line-height: 1.7;
        }

        /* Footer */
        .footer {
            background: var(--charcoal);
            color: var(--cream);
            padding: 3rem 2rem;
            text-align: center;
        }

        .footer h4 {
            font-family: 'Cormorant Garamond', serif;
            color: var(--gold);
            font-size: 1.5rem;
            font-weight: 400;
            margin-bottom: 0.5rem;
        }

        .footer p {
            font-size: 0.9rem;
            opacity: 0.7;
        }

        /* Nav */
        .nav {
            background: var(--primary);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .nav-logo {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.4rem;
            color: var(--gold);
            font-weight: 500;
            text-decoration: none;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
        }

        .nav-links a {
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            color: var(--cream);
            text-decoration: none;
            opacity: 0.8;
            transition: opacity 0.2s;
        }

        .nav-links a:hover {
            opacity: 1;
            color: var(--gold);
        }
      `}</style>

      {/* Font imports */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav className="nav">
        <a href="#" className="nav-logo">IntroAlignment</a>
        <div className="nav-links">
          <a href="#services">Services</a>
          <a href="#process">Process</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <h1>Legal Architecture for <span className="gold-text">Sovereign Living</span></h1>
        <p>Dynasty trusts, asset protection structures, and cross-border planning for families building generational wealth</p>
        <a href="#contact" className="btn-gold">Schedule Consultation</a>
      </section>

      {/* Services */}
      <section className="content" id="services">
        <h2>Our Services</h2>
        <p>High-net-worth families face a labyrinth of tax codes, estate laws, and asset protection requirements spanning multiple jurisdictions. We design sophisticated legal structures that preserve wealth across generations.</p>

        <div className="cards">
          <div className="card">
            <h3>Dynasty Trusts</h3>
            <p>Multi-generational wealth preservation structures designed to last centuries, not decades.</p>
          </div>
          <div className="card">
            <h3>Asset Protection</h3>
            <p>Fortress-level shielding against creditors, litigation, and unforeseen liabilities.</p>
          </div>
          <div className="card">
            <h3>Cross-Border Planning</h3>
            <p>International trust structures, offshore entities, and tax treaty optimization.</p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="process" id="process">
        <div className="process-inner">
          <h2>Our Process</h2>

          <div className="step">
            <div className="step-number">01</div>
            <div className="step-content">
              <h3>Comprehensive Analysis</h3>
              <p>We map your entire financial landscape—assets, liabilities, tax exposure, succession goals, and jurisdictional considerations.</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <div className="step-content">
              <h3>Custom Architecture Design</h3>
              <p>Every structure is bespoke. We design trust and entity frameworks tailored to your family&apos;s unique needs and long-term vision.</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <div className="step-content">
              <h3>Implementation & Stewardship</h3>
              <p>Precision execution with meticulous documentation, plus continuous monitoring and proactive adjustments as laws evolve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact">
        <h4>IntroAlignment</h4>
        <p>Professional legal network for estate planning</p>
      </footer>
    </div>
  );
}
