'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    if (session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      setIsAdmin(true);
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {session.user?.name || session.user?.email}!
          </h2>
          <p className="text-gray-600">You have successfully logged in.</p>
        </div>

        {/* User Info Card */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-600 text-sm">Email</label>
                <p className="text-gray-800 font-medium">{session.user?.email}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm">Name</label>
                <p className="text-gray-800 font-medium">{session.user?.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm">Account Status</label>
                <p className="text-green-600 font-medium">✓ Active</p>
              </div>
            </div>
          </div>

          {/* Saved Credentials Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Saved Credentials</h3>
            <p className="text-gray-600 text-sm mb-4">
              Your credentials are saved locally in your browser for quick access.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('user_credentials');
                alert('Credentials cleared from local storage');
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Clear Local Credentials
            </button>
          </div>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6">
              <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                Admin Panel
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Send Invitations</h3>
            <p className="text-gray-600 mb-6">
              As an admin, you can send invitations to new users.
            </p>
            <Link
              href="/admin/send-invitation"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Send Invitation
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
