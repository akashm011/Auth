'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AccessLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userId: '',
    tenantId: '',
    action: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({ skip: 0, limit: 50 });

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

    fetchLogs();
  }, [session, filters, pagination]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({
        skip: pagination.skip.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.tenantId) queryParams.append('tenantId', filters.tenantId);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`/api/access-logs?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      setLogs(data.logs || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Access Logs</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Filter by User ID"
            value={filters.userId}
            onChange={(e) => {
              setFilters({ ...filters, userId: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Filter by Tenant ID"
            value={filters.tenantId}
            onChange={(e) => {
              setFilters({ ...filters, tenantId: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          />
          <select
            value={filters.action}
            onChange={(e) => {
              setFilters({ ...filters, action: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          >
            <option value="">All Actions</option>
            <option value="signin">Sign In</option>
            <option value="revoke">Revoke</option>
            <option value="accept-invitation">Accept Invitation</option>
            <option value="extend-access">Extend Access</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              setFilters({ ...filters, startDate: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              setFilters({ ...filters, endDate: e.target.value });
              setPagination({ ...pagination, skip: 0 });
            }}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Timestamp</th>
              <th className="px-4 py-3 text-left">User ID</th>
              <th className="px-4 py-3 text-left">Tenant ID</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-4">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">
                    {log.userId ? log.userId.substring(0, 8) + '...' : '-'}
                  </td>
                  <td className="px-4 py-4">{log.tenantId}</td>
                  <td className="px-4 py-4">{log.action}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">{log.ipAddress}</td>
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
