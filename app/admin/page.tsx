'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    waitlist: 0,
    onboarding: 0,
    active: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);

      // Calculate stats
      const stats = {
        total: data.users?.length || 0,
        waitlist: data.users?.filter((u: User) => u.status === 'waitlist').length || 0,
        onboarding: data.users?.filter((u: User) => u.status === 'onboarding').length || 0,
        active: data.users?.filter((u: User) => u.status === 'active').length || 0
      };
      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-navy">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Admin Nav */}
      <nav className="bg-gold text-navy-dark">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <span className="font-serif text-2xl font-semibold">IntroAlignment Admin</span>
            <div className="flex gap-4">
              <Link href="/admin" className="hover:text-gold transition">
                Dashboard
              </Link>
              <Link href="/admin/matching" className="hover:text-gold transition">
                Matching
              </Link>
              <Link href="/admin/review" className="hover:text-gold transition">
                Safety Review
              </Link>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm hover:text-gold transition">
            Exit Admin →
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl font-bold text-navy mb-1">{stats.total}</div>
            <div className="text-sm text-navy-light">Total Users</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl font-bold text-gold mb-1">{stats.waitlist}</div>
            <div className="text-sm text-navy-light">Waitlist</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl font-bold text-medium-gray mb-1">{stats.onboarding}</div>
            <div className="text-sm text-navy-light">Onboarding</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl font-bold text-navy-light mb-1">{stats.active}</div>
            <div className="text-sm text-navy-light">Active</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b border-cream-dark flex justify-between items-center">
            <h2 className="font-serif text-2xl text-navy">All Users</h2>
            <input
              type="text"
              placeholder="Search users..."
              className="px-4 py-2 border-2 border-cream-dark rounded-lg focus:border-gold focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-cream transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-navy">{user.full_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-navy-light">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-gold-light text-white' :
                        user.status === 'onboarding' ? 'bg-gold text-white' :
                        'bg-cream-dark text-navy'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-navy-light text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-navy hover:text-navy-light"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-12 text-navy-light">
                No users yet. They'll appear here as people sign up.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
