'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      location: formData.get('location')
    };

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setFormSubmitted(true);
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Nunito:wght@300;400;500;600&display=swap');

        body {
          margin: 0;
          font-family: 'Nunito', sans-serif;
          background: #FFFEF9;
          color: #3A3A3A;
        }

        nav {
          position: fixed;
          top: 0;
          width: 100%;
          background: rgba(255, 254, 249, 0.95);
          backdrop-filter: blur(10px);
          z-index: 100;
          border-bottom: 1px solid rgba(114, 47, 55, 0.1);
          padding: 1.5rem 5%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 600;
          color: #722F37;
          text-decoration: none;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-links a {
          color: #3A3A3A;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
        }

        .nav-links a:hover {
          color: #722F37;
        }

        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 6rem 2rem 4rem;
          position: relative;
        }

        .hero-content {
          max-width: 800px;
        }

        .hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem;
          font-weight: 600;
          color: #722F37;
          margin: 0 0 1rem;
        }

        .tagline {
          font-size: 1.5rem;
          font-weight: 300;
          color: #B87333;
          margin-bottom: 2rem;
          font-style: italic;
        }

        .hero-text {
          font-size: 1.2rem;
          line-height: 1.8;
          color: #666;
          margin-bottom: 3rem;
        }

        .cta-button {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: #722F37;
          color: white;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 500;
          transition: all 0.3s;
          margin: 0 0.5rem;
        }

        .cta-button:hover {
          background: #5a2329;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(114, 47, 55, 0.2);
        }

        .cta-secondary {
          background: transparent;
          color: #722F37;
          border: 2px solid #722F37;
        }

        .cta-secondary:hover {
          background: #722F37;
          color: white;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 30px;
          color: #B87333;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }

        .difference {
          padding: 6rem 5%;
          background: white;
        }

        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 4rem;
        }

        .section-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          color: #722F37;
          margin-bottom: 1rem;
        }

        .section-header p {
          font-size: 1.2rem;
          color: #666;
          line-height: 1.8;
        }

        .difference-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 3rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .difference-card {
          padding: 2rem;
          background: #FFFEF9;
          border-radius: 20px;
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        .difference-card:hover {
          border-color: #B87333;
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(114, 47, 55, 0.1);
        }

        .difference-icon {
          width: 60px;
          height: 60px;
          margin-bottom: 1.5rem;
          color: #B87333;
        }

        .difference-card h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          color: #722F37;
          margin-bottom: 1rem;
        }

        .difference-card p {
          color: #666;
          line-height: 1.8;
        }

        .waitlist {
          padding: 6rem 5%;
          background: linear-gradient(135deg, #722F37 0%, #5a2329 100%);
        }

        .waitlist-box {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
          color: white;
        }

        .waitlist-box h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .waitlist-box p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .waitlist-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .waitlist-form input {
          padding: 1rem;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-family: 'Nunito', sans-serif;
        }

        .waitlist-form button {
          padding: 1rem;
          background: #B87333;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Nunito', sans-serif;
        }

        .waitlist-form button:hover {
          background: #9d5f28;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(184, 115, 51, 0.3);
        }

        .form-note {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-top: 0.5rem;
        }

        .success-message {
          display: none;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }

        .success-message.show {
          display: block;
        }

        .success-message h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .mobile-menu {
          display: none;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .mobile-menu {
            display: flex;
            flex-direction: column;
            gap: 5px;
            cursor: pointer;
          }

          .mobile-menu span {
            width: 25px;
            height: 3px;
            background: #722F37;
            border-radius: 3px;
          }

          .hero h1 {
            font-size: 2.5rem;
          }

          .tagline {
            font-size: 1.2rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <nav>
        <a href="#" className="logo">IntroAlignment</a>
        <ul className="nav-links">
          <li><a href="#difference">The Difference</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#philosophy">Philosophy</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="#waitlist">Join Waitlist</a></li>
        </ul>
        <div className="mobile-menu">
          <span></span><span></span><span></span>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>IntroAlignment</h1>
          <p className="tagline">Beyond compatibility. Into alignment.</p>
          <p className="hero-text">
            We help you find the person who is truly aligned with your life and your purpose.
            <strong> A partner and a friend.</strong> Not someone who is there for a season,
            but someone who is ready to share their life.
          </p>
          <div>
            <a href="#waitlist" className="cta-button">Join the Waitlist</a>
            <Link href="/signup" className="cta-button cta-secondary">Get Started</Link>
          </div>
        </div>
        <div className="scroll-indicator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      <section className="difference" id="difference">
        <div className="section-header">
          <h2>A Different Kind of Introduction</h2>
          <p>We're not a dating app. We're not a matchmaking service in the traditional sense. We're something new.</p>
        </div>
        <div className="difference-grid">
          <div className="difference-card">
            <div className="difference-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3>Conversation, Not Questionnaires</h3>
            <p>Instead of endless checkboxes and surveys, you'll have a natural conversation with our AI. We learn who you truly are through your stories, not your statistics.</p>
          </div>
          <div className="difference-card">
            <div className="difference-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h3>Depth Over Volume</h3>
            <p>No endless swiping. No inbox full of strangers. We take the time to understand you deeply, then introduce you only to people who could truly fit your life.</p>
          </div>
          <div className="difference-card">
            <div className="difference-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <h3>Introductions With Intention</h3>
            <p>Every introduction we make is thoughtful and purposeful. We believe in quality connections that have the potential to become lifelong partnerships.</p>
          </div>
        </div>
      </section>

      <section className="waitlist" id="waitlist">
        <div className="waitlist-box">
          <h2>Be Among the First</h2>
          <p>Join our waitlist to be notified when IntroAlignment opens for new members.</p>

          {!formSubmitted ? (
            <form className="waitlist-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input type="text" name="firstName" placeholder="First Name" required />
                <input type="text" name="lastName" placeholder="Last Name" required />
              </div>
              <input type="email" name="email" placeholder="Your Email" required />
              <input type="text" name="location" placeholder="City, State/Country" />
              <button type="submit">Join the Waitlist</button>
              <p className="form-note">We respect your privacy. No spam, ever.</p>
            </form>
          ) : (
            <div className="success-message show">
              <h3>You're on the list!</h3>
              <p>Thank you for joining IntroAlignment. We'll be in touch soon!</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
