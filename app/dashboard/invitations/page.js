'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function InvitationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ email: '', tenantId: '', isUsed: '' });
  const [pagination, setPagination] = useState({ skip: 0, limit: 20 });

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

    fetchInvitations();
  }, [session, filters, pagination]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({
        skip: pagination.skip.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.email) queryParams.append('email', filters.email);
      if (filters.tenantId) queryParams.append('tenantId', filters.tenantId);
      if (filters.isUsed) queryParams.append('isUsed', filters.isUsed);

      const response = await fetch(`/api/invitations?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invitations');
      }

      setInvitations(data.invitations || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (invitationId) => {
    if (!window.confirm('Are you sure you want to revoke this access?')) return;

    try {
      const response = await fetch(`/api/invitations/${invitationId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke access');
      }

      fetchInvitations();
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Invitations</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="email"
            placeholder="Filter by email"
            value={filters.email}
            onChange={(e) => {
              setFilters({ ...filters, email: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Filter by tenant ID"
            value={filters.tenantId}
            onChange={(e) => {
              setFilters({ ...filters, tenantId: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          />
          <select
            value={filters.isUsed}
            onChange={(e) => {
              setFilters({ ...filters, isUsed: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="true">Accepted</option>
            <option value="false">Pending</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Tenants</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Expires At</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No invitations found
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv._id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{inv.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {inv.tenants.join(', ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        inv.isUsed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {inv.isUsed ? 'Accepted' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => router.push(`/dashboard/invitations/${inv._id}`)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edit
                    </button>
                    {!inv.revokedAt && (
                      <button
                        onClick={() => handleRevokeAccess(inv._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPagination({ ...pagination, skip: Math.max(0, pagination.skip - pagination.limit) })}
          disabled={pagination.skip === 0}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {Math.floor(pagination.skip / pagination.limit) + 1}
        </span>
        <button
          onClick={() => setPagination({ ...pagination, skip: pagination.skip + pagination.limit })}
          disabled={!pagination.hasMore}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
