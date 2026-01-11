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
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-cream/95 backdrop-blur-sm z-50 border-b border-navy/10 px-8 py-6 flex justify-between items-center">
        <Link href="/" className="font-serif text-2xl font-semibold text-navy">
          SovereigntyIntroAlignment
        </Link>
        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="#difference" className="text-navy hover:text-gold transition-colors">The Difference</a></li>
          <li><a href="#waitlist" className="text-navy hover:text-gold transition-colors">Join Waitlist</a></li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center text-center px-4 pt-32 pb-16">
        <div className="max-w-3xl">
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-navy mb-4">
            SovereigntyIntroAlignment
          </h1>
          <p className="font-serif text-xl md:text-2xl italic text-gold mb-8">
            How you legally architect your dynasty
          </p>
          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            A matchmaking service dedicated to helping you find the person who is truly aligned with your life and your purpose.
            <strong className="text-navy"> A partner and a friend.</strong> Not someone who is there for a season,
            but someone who is ready to share their life. We combine thoughtful conversation, comprehensive profiling, and expert curation to make meaningful introductions.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#waitlist" className="px-8 py-3 bg-navy text-white rounded-full font-medium hover:bg-navy-dark transition-all hover:shadow-lg">
              Join the Waitlist
            </a>
            <Link href="/signup" className="px-8 py-3 bg-transparent text-navy border-2 border-navy rounded-full font-medium hover:bg-navy hover:text-white transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Difference Section */}
      <section id="difference" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-serif text-4xl text-navy mb-4">A Different Kind of Introduction</h2>
            <p className="text-lg text-gray-600">We're not a dating app. We're not a matchmaking service in the traditional sense. We're something new.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blush-light p-8 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-navy mb-4">Conversation, Not Questionnaires</h3>
              <p className="text-gray-600">Instead of endless checkboxes and surveys, you'll have a natural conversation that helps us understand who you truly are. We learn through your stories, not your statistics, to make more thoughtful matches.</p>
            </div>

            <div className="bg-blush-light p-8 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-navy mb-4">Depth Over Volume</h3>
              <p className="text-gray-600">No endless swiping. No inbox full of strangers. We take the time to understand you deeply, then introduce you only to people who could truly fit your life.</p>
            </div>

            <div className="bg-blush-light p-8 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-navy mb-4">Introductions With Intention</h3>
              <p className="text-gray-600">Every introduction we make is thoughtful and purposeful. We believe in quality connections that have the potential to become lifelong partnerships.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="py-24 px-4 bg-gradient-to-br from-navy to-navy-dark">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-4xl text-white mb-6">Be Among the First</h2>
          <p className="text-xl text-white/90 mb-12">Join our waitlist to be notified when SovereigntyIntroAlignment opens for new members.</p>

          {!formSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  required
                  className="px-6 py-3 rounded-full border-0 focus:ring-2 focus:ring-gold outline-none"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  required
                  className="px-6 py-3 rounded-full border-0 focus:ring-2 focus:ring-gold outline-none"
                />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                className="w-full px-6 py-3 rounded-full border-0 focus:ring-2 focus:ring-gold outline-none"
              />
              <input
                type="text"
                name="location"
                placeholder="City, State/Country"
                className="w-full px-6 py-3 rounded-full border-0 focus:ring-2 focus:ring-gold outline-none"
              />
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gold text-white rounded-full font-semibold hover:bg-gold-dark transition-all hover:shadow-lg text-lg"
              >
                Join the Waitlist
              </button>
              <p className="text-white/70 text-sm mt-4">We respect your privacy. No spam, ever.</p>
            </form>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12">
              <h3 className="font-serif text-3xl text-white mb-4">You're on the list!</h3>
              <p className="text-white/90 text-lg">Thank you for joining SovereigntyIntroAlignment. We'll be in touch soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
