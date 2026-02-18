'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">SecureAccess</h1>
          <Link
            href="/auth/signin"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Our Platform
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Secure access through invitation-based authentication
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/auth/signin"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Sign In
            </Link>
            <a
              href="#features"
              className="inline-block bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition duration-200"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition duration-200">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Invitations</h3>
            <p className="text-gray-600">
              Only invited users can access the platform. Each invitation is unique and expires after 24 hours.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition duration-200">
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Auto-Generated Credentials</h3>
            <p className="text-gray-600">
              One-time password and username generation. Credentials are saved locally for quick access.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition duration-200">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Social Login</h3>
            <p className="text-gray-600">
              Sign in with Google or GitHub for added convenience and security.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Get Invited</h4>
              <p className="text-gray-600 text-sm">
                Admin sends you an invitation link via email.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Accept Invite</h4>
              <p className="text-gray-600 text-sm">
                Click the link to accept your invitation.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Get Credentials</h4>
              <p className="text-gray-600 text-sm">
                Receive auto-generated username and password.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Start Using</h4>
              <p className="text-gray-600 text-sm">
                Sign in and access the platform immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">Security Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <span className="text-2xl">✓</span>
              <div>
                <h4 className="font-semibold mb-2">Invitation-Only Access</h4>
                <p>Only pre-invited users can create accounts.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-2xl">✓</span>
              <div>
                <h4 className="font-semibold mb-2">Secure Password Hashing</h4>
                <p>Passwords are hashed with bcrypt for maximum security.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-2xl">✓</span>
              <div>
                <h4 className="font-semibold mb-2">JWT Session Management</h4>
                <p>Secure JWT tokens for user sessions.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-2xl">✓</span>
              <div>
                <h4 className="font-semibold mb-2">OAuth Integration</h4>
                <p>OAuth 2.0 support for Google and GitHub.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Don't have an invitation? Contact your administrator.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
          >
            Go to Sign In
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p>© 2026 SecureAccess. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
