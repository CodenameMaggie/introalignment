'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Redirect to onboarding
      router.push('/onboarding');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-semibold text-navy">
            IntroAlignment
          </Link>
          <p className="mt-2 font-serif italic text-medium-gray">
            Beyond compatibility. Into alignment.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="font-serif text-2xl text-navy mb-6 text-center">
            Begin Your Journey
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-light border border-rose rounded-lg text-navy text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-cream-dark rounded-full focus:border-gold focus:outline-none bg-cream transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-cream-dark rounded-full focus:border-gold focus:outline-none bg-cream transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border-2 border-cream-dark rounded-full focus:border-gold focus:outline-none bg-cream transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border-2 border-cream-dark rounded-full focus:border-gold focus:outline-none bg-cream transition"
              />
              <p className="text-xs text-navy-light mt-1">
                At least 8 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-navy-dark py-3 px-6 rounded-full font-medium hover:bg-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-navy-light mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-navy hover:text-navy-light font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-navy-light mt-6">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-navy">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-navy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
