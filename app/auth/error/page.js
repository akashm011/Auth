'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode) => {
    const messages = {
      AccessDenied: 'Access denied. You may not have been invited to this platform.',
      Callback: 'There was an error during the authentication callback.',
      OAuthSignin: 'Error connecting to the OAuth provider.',
      OAuthCallback: 'Error in the OAuth callback.',
      OAuthCreateAccount: 'Could not create account with OAuth provider.',
      EmailCreateAccount: 'Could not create account with email.',
      CredentialsSignin: 'Sign in failed. Check your credentials.',
      default: 'An authentication error occurred.',
    };
    return messages[errorCode] || messages.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          {getErrorMessage(error)}
        </p>

        {error && (
          <div className="bg-gray-50 rounded p-3 mb-6 text-left">
            <p className="text-xs text-gray-500 font-mono break-words">
              Error: {error}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-gray-500 text-xs mt-6">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
