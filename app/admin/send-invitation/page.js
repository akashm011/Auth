'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SendInvitation() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sentEmails, setSentEmails] = useState([]);

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send invitation');
        return;
      }

      setSuccess(`Invitation sent successfully to ${email}!`);
      setSentEmails([...sentEmails, email]);
      setEmail('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Send Invitation</h1>
          <Link
            href="/dashboard"
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Invite New User</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSendInvitation} className="space-y-4 mb-8">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                required
              />
              <p className="text-gray-500 text-sm mt-2">
                An invitation link will be sent to this email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>

          {sentEmails.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Invitations Sent ({sentEmails.length})
              </h3>
              <div className="space-y-2">
                {sentEmails.map((sentEmail, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white rounded p-3 border border-blue-100"
                  >
                    <span className="text-gray-800">{sentEmail}</span>
                    <span className="text-green-600 font-semibold">✓ Sent</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">How It Works</h3>
          <div className="space-y-4 text-gray-700">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-semibold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Send Invitation</h4>
                <p className="text-gray-600">Enter the user's email and send them an invitation.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-semibold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold">User Accepts</h4>
                <p className="text-gray-600">User clicks the invitation link in their email.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-semibold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Generate Credentials</h4>
                <p className="text-gray-600">System generates username & password automatically.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-semibold">
                  4
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Login</h4>
                <p className="text-gray-600">User can now login with credentials or social login.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
