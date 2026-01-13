export default function HomePage() {
  return (
    <>
      {/* Nav */}
      <nav style={{
        background: '#1C2833',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <a href="#" style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.4rem',
          color: '#B8935F',
          fontWeight: 500,
          textDecoration: 'none'
        }}>IntroAlignment</a>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <a href="#services" style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            color: '#f8f6f3',
            textDecoration: 'none',
            opacity: 0.8
          }}>Services</a>
          <a href="#process" style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            color: '#f8f6f3',
            textDecoration: 'none',
            opacity: 0.8
          }}>Process</a>
          <a href="#contact" style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            color: '#f8f6f3',
            textDecoration: 'none',
            opacity: 0.8
          }}>Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1C2833 0%, #2c3e50 100%)',
        color: '#f8f6f3',
        padding: '5rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          marginBottom: '1rem',
          fontWeight: 400,
          lineHeight: '1.3',
          letterSpacing: '-0.01em'
        }}>
          Legal Architecture for <span style={{ color: '#B8935F' }}>Sovereign Living</span>
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '1.1rem',
          fontWeight: 300,
          opacity: 0.9,
          marginBottom: '2rem',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.8'
        }}>
          Dynasty trusts, asset protection structures, and cross-border planning for families building generational wealth
        </p>
        <a href="#contact" style={{
          display: 'inline-block',
          background: '#B8935F',
          color: '#1C2833',
          padding: '0.9rem 2rem',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '0.85rem',
          textDecoration: 'none',
          borderRadius: '3px',
          letterSpacing: '0.5px'
        }}>Schedule Consultation</a>
      </section>

      {/* Services */}
      <section id="services" style={{
        background: '#f8f6f3',
        padding: '4rem 2rem'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            color: '#1C2833',
            marginBottom: '1rem',
            textAlign: 'center',
            fontWeight: 400,
            lineHeight: '1.3',
            letterSpacing: '-0.01em'
          }}>Our Services</h2>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.05rem',
            color: '#666666',
            textAlign: 'center',
            maxWidth: '700px',
            margin: '0 auto 3rem',
            lineHeight: '1.9'
          }}>
            High-net-worth families face a labyrinth of tax codes, estate laws, and asset protection requirements spanning multiple jurisdictions. We design sophisticated legal structures that preserve wealth across generations.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            <div style={{
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '4px',
              borderTop: '2px solid #B8935F',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.4rem',
                color: '#1C2833',
                marginBottom: '0.75rem',
                fontWeight: 500
              }}>Dynasty Trusts</h3>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                color: '#666666',
                lineHeight: '1.7'
              }}>Multi-generational wealth preservation structures designed to last centuries, not decades.</p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '4px',
              borderTop: '2px solid #B8935F',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.4rem',
                color: '#1C2833',
                marginBottom: '0.75rem',
                fontWeight: 500
              }}>Asset Protection</h3>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                color: '#666666',
                lineHeight: '1.7'
              }}>Fortress-level shielding against creditors, litigation, and unforeseen liabilities.</p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '4px',
              borderTop: '2px solid #B8935F',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.4rem',
                color: '#1C2833',
                marginBottom: '0.75rem',
                fontWeight: 500
              }}>Cross-Border Planning</h3>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                color: '#666666',
                lineHeight: '1.7'
              }}>International trust structures, offshore entities, and tax treaty optimization.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" style={{
        background: '#ffffff',
        padding: '4rem 2rem'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            color: '#1C2833',
            marginBottom: '3rem',
            textAlign: 'center',
            fontWeight: 400,
            lineHeight: '1.3',
            letterSpacing: '-0.01em'
          }}>Our Process</h2>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '2.5rem',
              fontWeight: 300,
              color: '#B8935F',
              lineHeight: '1',
              minWidth: '50px'
            }}>01</div>
            <div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.3rem',
                color: '#1C2833',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>Comprehensive Analysis</h3>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                color: '#666666',
                lineHeight: '1.7'
              }}>We map your entire financial landscape—assets, liabilities, tax exposure, succession goals, and jurisdictional considerations.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '2.5rem',
              fontWeight: 300,
              color: '#B8935F',
              lineHeight: '1',
              minWidth: '50px'
            }}>02</div>
            <div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.3rem',
                color: '#1C2833',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>Custom Architecture Design</h3>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                color: '#666666',
                lineHeight: '1.7'
              }}>Every structure is bespoke. We design trust and entity frameworks tailored to your family&apos;s unique needs and long-term vision.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '2.5rem',
              fontWeight: 300,
              color: '#B8935F',
              lineHeight: '1',
              minWidth: '50px'
            }}>03</div>
            <div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.3rem',
                color: '#1C2833',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>Implementation & Stewardship</h3>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                color: '#666666',
                lineHeight: '1.7'
              }}>Precision execution with meticulous documentation, plus continuous monitoring and proactive adjustments as laws evolve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{
        background: '#2c3e50',
        color: '#f8f6f3',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <h4 style={{
          fontFamily: 'Cormorant Garamond, serif',
          color: '#B8935F',
          fontSize: '1.5rem',
          fontWeight: 400,
          marginBottom: '0.5rem'
        }}>IntroAlignment</h4>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          opacity: 0.7
        }}>Professional legal network for estate planning</p>
      </footer>
    </>
  );
}
