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
    <div className="min-h-screen bg-ivory flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-semibold text-burgundy">
            IntroAlignment
          </Link>
          <p className="mt-2 font-serif italic text-dusty-rose-dark">
            Beyond compatibility. Into alignment.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="font-serif text-2xl text-burgundy mb-6 text-center">
            Begin Your Journey
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-ivory-dark rounded-full focus:border-dusty-rose-dark focus:outline-none bg-ivory transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-ivory-dark rounded-full focus:border-dusty-rose-dark focus:outline-none bg-ivory transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border-2 border-ivory-dark rounded-full focus:border-dusty-rose-dark focus:outline-none bg-ivory transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border-2 border-ivory-dark rounded-full focus:border-dusty-rose-dark focus:outline-none bg-ivory transition"
              />
              <p className="text-xs text-charcoal-light mt-1">
                At least 8 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-burgundy text-white py-3 px-6 rounded-full font-medium hover:bg-burgundy-light transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal-light mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-burgundy hover:text-burgundy-light font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-charcoal-light mt-6">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-burgundy">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-burgundy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
