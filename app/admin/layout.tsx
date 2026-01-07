'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      // Get session from localStorage
      const session = localStorage.getItem('session');

      if (!session) {
        console.warn('No session found - redirecting to login');
        router.push('/login?redirect=/admin');
        return;
      }

      // Check admin access via API
      const response = await fetch('/api/admin/check-access', {
        headers: {
          'Authorization': `Bearer ${session}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.isAdmin) {
        console.warn('Admin access denied');
        alert('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      console.error('Admin access check failed:', error);
      alert('Error verifying admin access. Please try again.');
      router.push('/');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { href: '/admin', label: 'Overview', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/red-flags', label: 'Red Flags', icon: '🚩', alert: true },
    { href: '/admin/matches', label: 'Matches', icon: '💕' },
    { href: '/admin/revenue', label: 'Revenue', icon: '💰' },
    { href: '/admin/extractions', label: 'Extractions', icon: '🧠' },
    { href: '/admin/leads', label: 'Leads', icon: '🎯' },
    { href: '/admin/system', label: 'System Health', icon: '⚙️' },
    { href: '/admin/migrations', label: 'SQL Migrations', icon: '🗄️' }
  ];

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <div className="w-64 bg-navy text-white flex-shrink-0">
        <div className="p-6">
          <h1 className="font-serif text-2xl font-semibold mb-2">IntroAlignment</h1>
          <p className="text-sm text-white/70">Admin Dashboard</p>
        </div>

        <nav className="px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                  isActive
                    ? 'bg-gold text-white'
                    : 'text-white/80 hover:bg-navy-light hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.alert && (
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>Back to Site</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
