'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ManageTenantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    description: '',
  });

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

    fetchTenants();
  }, [session]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/tenants');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tenants');
      }

      setTenants(data.tenants || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant');
      }

      setSuccess('Tenant created successfully');
      setFormData({ name: '', slug: '', domain: '', description: '' });
      setShowForm(false);
      fetchTenants();
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Tenants</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Tenant'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tenant Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., My App"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., myapp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Domain (optional)</label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., myapp.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Brief description"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Create Tenant
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No tenants found. Create one to get started.
          </div>
        ) : (
          tenants.map((tenant) => (
            <div key={tenant._id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">{tenant.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{tenant.description || 'No description'}</p>
              <div className="space-y-2 text-sm mb-4">
                <p>
                  <span className="font-medium">Slug:</span> <code className="bg-gray-100 px-2 py-1 rounded">{tenant.slug}</code>
                </p>
                {tenant.domain && (
                  <p>
                    <span className="font-medium">Domain:</span> {tenant.domain}
                  </p>
                )}
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={tenant.isActive ? 'text-green-600' : 'text-red-600'}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => router.push(`/dashboard/manage-tenants/${tenant._id}`)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
