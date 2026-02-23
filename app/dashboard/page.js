'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvitations: 0,
    totalTenants: 0,
    pendingInvitations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'superadmin') {
      setError('You do not have permission to view this page');
      return;
    }

    fetchStats();
  }, [session]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch stats from APIs
      const [usersRes, invitationsRes, tenantsRes] = await Promise.all([
        fetch('/api/users/count'),
        fetch('/api/invitations?limit=0'),
        fetch('/api/tenants'),
      ]);

      const usersData = await usersRes.json();
      const invitationsData = await invitationsRes.json();
      const tenantsData = await tenantsRes.json();

      setStats({
        totalUsers: usersData.count || 0,
        totalInvitations: invitationsData.pagination?.total || 0,
        totalTenants: tenantsData.tenants?.length || 0,
        pendingInvitations: invitationsData.invitations?.filter(inv => !inv.isUsed).length || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Stats are optional, don't show error
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session?.user?.name}!</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{session?.user?.email}</p>
              <p className="text-sm font-medium text-blue-600 capitalize">{session?.user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl text-blue-500">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Invitations</p>
                <p className="text-3xl font-bold">{stats.totalInvitations}</p>
              </div>
              <div className="text-4xl text-green-500">📧</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Invitations</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingInvitations}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Registered Tenants</p>
                <p className="text-3xl font-bold">{stats.totalTenants}</p>
              </div>
              <div className="text-4xl text-purple-500">🏢</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/send-invitation"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-6 text-center font-semibold transition"
            >
              📨 Send Invitation
            </Link>

            <Link
              href="/dashboard/invitations"
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow p-6 text-center font-semibold transition"
            >
              📋 Manage Invitations
            </Link>

            <Link
              href="/dashboard/manage-tenants"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow p-6 text-center font-semibold transition"
            >
              🏢 Manage Tenants
            </Link>

            <Link
              href="/dashboard/access-logs"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow p-6 text-center font-semibold transition"
            >
              �� View Access Logs
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">System Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Admin Name</p>
                <p className="text-lg font-semibold">{session?.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Admin Email</p>
                <p className="text-lg font-semibold">{session?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-lg font-semibold capitalize">{session?.user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Auth System</p>
                <p className="text-lg font-semibold">NextAuth v5</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
              <p className="text-sm text-blue-800">
                <strong>📌 Tip:</strong> Use the Quick Actions above to manage invitations, tenants, and view access logs.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
