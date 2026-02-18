'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AcceptInvitation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
    }
  }, [token]);

  const handleAcceptInvitation = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation');
        return;
      }

      setCredentials(data);
      setSuccess(true);

      // Save credentials to localStorage
      localStorage.setItem(
        'user_credentials',
        JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Accept Invitation
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Complete your account setup
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!success ? (
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Click the button below to accept the invitation and generate your login credentials.
            </p>
            <button
              onClick={handleAcceptInvitation}
              disabled={loading || !token}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Processing...' : 'Accept Invitation'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              ✓ Invitation accepted successfully!
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="text-gray-600 text-sm font-semibold">Email</label>
                <div className="flex items-center mt-1">
                  <input
                    type="text"
                    value={credentials.email}
                    readOnly
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => handleCopyToClipboard(credentials.email)}
                    className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-600 text-sm font-semibold">Username</label>
                <div className="flex items-center mt-1">
                  <input
                    type="text"
                    value={credentials.username}
                    readOnly
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => handleCopyToClipboard(credentials.username)}
                    className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-600 text-sm font-semibold">Password</label>
                <div className="flex items-center mt-1">
                  <input
                    type="text"
                    value={credentials.password}
                    readOnly
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopyToClipboard(credentials.password)}
                    className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded">
              <p className="font-semibold mb-1">⚠️ Important</p>
              <p>Your credentials have been saved locally and also sent to your email. Keep them safe!</p>
            </div>

            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
