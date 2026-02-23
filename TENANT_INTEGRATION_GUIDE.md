# Multi-Tenant Integration Guide

Complete guide for external websites and applications to integrate with the centralized authentication server (`auth-akash.com`).

## Overview

This guide explains how to integrate your external application (tenant) with the centralized authentication system. Once integrated, your users will be able to sign in using credentials issued by the auth server.

### Architecture

```
Your App (Tenant)
    ↓ (User clicks Sign In)
    ↓
/signin page
    ↓ (POST email + password + tenantId)
    ↓
auth-akash.com/api/auth/signin
    ↓ (Validates credentials & tenant access)
    ↓
Returns JWT token
    ↓
Your App stores token & redirects to /
    ↓ (Middleware validates token on protected routes)
    ↓
User access granted
```

## Prerequisites

Before integrating, ensure:

1. **Tenant Registration** - Your app must be registered as a tenant in the auth system
2. **Tenant ID** - You have a unique tenant slug (e.g., `myapp`, `dashboard`)
3. **Environment Variables** - Auth server URL and tenant configuration
4. **CORS Enabled** - Auth server must allow requests from your domain

## Step 1: Register Your Application as a Tenant

Contact the admin to register your application. You'll receive:

- **Tenant Slug** - Unique identifier (e.g., `myapp`)
- **Tenant Name** - Display name (e.g., "My App")
- **Auth Server URL** - Base URL of authentication server (e.g., `https://auth-akash.com`)

Add these to your `.env.local`:

```bash
# Auth Server Configuration
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth-akash.com
NEXT_PUBLIC_TENANT_ID=myapp
NEXT_PUBLIC_TENANT_NAME=My App

# Optional: For local development
# NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:3000
```

## Step 2: Create Authentication Utilities

### Create `lib/auth-client.js`

Utility functions for communicating with the auth server:

```javascript
// lib/auth-client.js

const AUTH_SERVER = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:3000'\;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'myapp';

export async function signin(email, password) {
  try {
    const response = await fetch(`${AUTH_SERVER}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        tenantId: TENANT_ID,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signin failed');
    }

    return data;
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
}

export async function verifyToken(token) {
  try {
    const response = await fetch(`${AUTH_SERVER}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        tenantId: TENANT_ID,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function logout() {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('accessible_tenants');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function getAccessibleTenants() {
  try {
    const tenants = localStorage.getItem('accessible_tenants');
    return tenants ? JSON.parse(tenants) : [];
  } catch {
    return [];
  }
}
```

## Step 3: Create Sign In Page

### Create `app/auth/signin/page.js`

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signin } from '@/lib/auth-client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await signin(email, password);

      // Save token to localStorage
      localStorage.setItem('auth_token', data.token);
      
      // Save user info
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      // Save accessible tenants
      localStorage.setItem('accessible_tenants', JSON.stringify(data.accessibleTenants));

      if (saveCredentials) {
        // Optionally save credentials for quick access (use with caution)
        localStorage.setItem('remembered_email', email);
      }

      // Redirect to dashboard
      router.push('/');
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="saveCredentials"
              checked={saveCredentials}
              onChange={(e) => setSaveCredentials(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="saveCredentials" className="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Need an invitation? Contact admin@yourapp.com
        </p>
      </div>
    </div>
  );
}
```

## Step 4: Create Authentication Middleware

### Create `middleware.js` at project root

```javascript
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const protectedRoutes = ['/dashboard', '/profile', '/settings'];
const publicRoutes = ['/auth/signin', '/auth/error'];

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Try to get from localStorage (client-side fallback)
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    try {
      // Verify token (basic validation)
      // Note: For proper verification, you should call the auth server
      // jwt.verify(token, process.env.NEXTAUTH_SECRET);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Step 5: Create Protected Dashboard

### Create `app/page.js`

```javascript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getStoredToken, logout, getAccessibleTenants } from '@/lib/auth-client';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();
    const accessibleTenants = getAccessibleTenants();

    if (!storedUser || !token) {
      router.push('/auth/signin');
      return;
    }

    setUser(storedUser);
    setTenants(accessibleTenants);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/signin');
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Username:</strong> {user?.username}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Accessible Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.length === 0 ? (
              <p className="text-gray-500">No accessible applications</p>
            ) : (
              tenants.map((tenant) => (
                <div key={tenant} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">{tenant}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    You have access to this application
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to tenant's dashboard
                      window.location.href = `//${tenant}.example.com/dashboard`;
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Access App
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
```

## Step 6: Setup Environment Configuration

### `.env.local` Example

```bash
# Auth Server Configuration
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_TENANT_ID=myapp
NEXT_PUBLIC_TENANT_NAME=My App

# For production
# NEXT_PUBLIC_AUTH_SERVER_URL=https://auth-akash.com
```

## Step 7: Handle Token in Client Components

### Create a Custom Hook - `hooks/useAuth.js`

```javascript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getStoredToken } from '@/lib/auth-client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    if (!storedToken) {
      router.push('/auth/signin');
      return;
    }

    setUser(storedUser);
    setToken(storedToken);
    setLoading(false);
  }, [router]);

  return { user, token, loading, isAuthenticated: cat > /home/akash/Projects/authentication-system/scripts/seed-tenants.js << 'EOF'
import { connectToDatabase } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function seedTenants() {
  try {
    const { db } = await connectToDatabase();

    // Get admin user
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Run seed:admin first');
    }

    // Default tenants from environment or hardcoded
    const defaultTenants = [
      {
        name: process.env.NEXT_PUBLIC_TENANT_NAME_1 || 'My App',
        slug: process.env.NEXT_PUBLIC_TENANT_ID_1 || 'myapp',
        domain: process.env.NEXT_PUBLIC_TENANT_URL_1 || 'http://localhost:3001',
        description: 'Primary application',
      },
      {
        name: process.env.NEXT_PUBLIC_TENANT_NAME_2 || 'Dashboard',
        slug: process.env.NEXT_PUBLIC_TENANT_ID_2 || 'dashboard',
        domain: process.env.NEXT_PUBLIC_TENANT_URL_2 || 'http://localhost:3002',
        description: 'Analytics and reporting dashboard',
      },
    ];

    let createdCount = 0;

    for (const tenantData of defaultTenants) {
      const existingTenant = await db.collection('tenants').findOne({ slug: tenantData.slug });

      if (!existingTenant) {
        await db.collection('tenants').insertOne({
          ...tenantData,
          isActive: true,
          createdBy: adminUser._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✓ Created tenant: ${tenantData.name} (${tenantData.slug})`);
        createdCount++;
      } else {
        console.log(`- Tenant already exists: ${tenantData.name} (${tenantData.slug})`);
      }
    }

    if (createdCount === 0) {
      console.log('✓ All default tenants already exist');
    } else {
      console.log(`\n✓ Seeded ${createdCount} tenant(s) successfully`);
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding tenants:', error.message);
    process.exit(1);
  }
}

seedTenants();
EOFtoken };
}
```

### Use in Protected Components

```javascript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function ProtectedComponent() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Welcome, {user?.name}!</div>;
}
```

## Step 8: API Integration Pattern

### Making Authenticated Requests

```javascript
// In your API routes or client components
const token = localStorage.getItem('auth_token');

const response = await fetch('/api/your-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## Step 9: Session Persistence

The authentication token is stored in localStorage. To add more security, also store it in an HTTP-only cookie:

### Create `lib/auth-cookie.js`

```javascript
export function setAuthCookie(token) {
  // This is typically done on the server-side after receiving the token
  document.cookie = `auth_token=${token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`;
}

export function removeAuthCookie() {
  document.cookie = 'auth_token=; Path=/; Max-Age=0';
}
```

## Error Handling

Common errors and how to handle them:

### 401 - Invalid Credentials

```javascript
catch (error) {
  if (error.message.includes('Invalid credentials')) {
    setError('Email or password is incorrect');
  }
}
```

### 403 - Access Denied to Tenant

```javascript
catch (error) {
  if (error.message.includes('do not have access')) {
    setError('You do not have access to this application. Ask admin to grant access.');
  }
}
```

### 403 - Invitation Not Accepted

```javascript
catch (error) {
  if (error.message.includes('accept the invitation')) {
    setError('Please accept the invitation email first');
  }
}
```

## Security Best Practices

1. **HTTPS Only** - Always use HTTPS in production
2. **Secure Cookies** - Store tokens in HTTP-only cookies
3. **CORS** - Configure proper CORS policies
4. **Token Refresh** - Implement token refresh logic
5. **Logout** - Clear all auth data on logout
6. **Validate on Server** - Always validate tokens on server-side routes
7. **Environment Variables** - Never expose auth URLs in client code directly (use `NEXT_PUBLIC_` prefix carefully)

## Token Structure

The JWT token returned contains:

```json
{
  "userId": "user-id-hash",
  "email": "user@example.com",
  "username": "username",
  "tenantId": "myapp",
  "iat": 1234567890,
  "exp": 1234567890
}
```

You can decode this (without verification) using:

```javascript
import jwtDecode from 'jwt-decode';

const decoded = jwtDecode(token);
console.log(decoded);
```

## Testing the Integration

### 1. Start Auth Server

```bash
cd /home/akash/Projects/authentication-system
npm run dev
# Runs on http://localhost:3000
```

### 2. Start Your Tenant App

```bash
cd your-tenant-app
npm run dev
# Runs on http://localhost:3001
```

### 3. Test Sign In

1. Visit `http://localhost:3001/auth/signin`
2. Enter credentials (user should be invited first)
3. Should redirect to dashboard on success
4. Check localStorage for `auth_token`

### 4. Test Protected Routes

1. Try accessing `/dashboard` without token
2. Should redirect to `/auth/signin`
3. Sign in again
4. Should have access

## Troubleshooting

### "CORS Error"

**Problem:** Cross-origin request blocked
**Solution:** Ensure auth server has CORS headers configured

```javascript
// In auth server headers
headers: {
  'Access-Control-Allow-Origin': 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

### Token Expires Immediately

**Problem:** Token expiration in JWT is in seconds
**Solution:** Check token claims, ensure expiration is set correctly

### Redirect Loop

**Problem:** Getting stuck between signin and dashboard
**Solution:** Check if localStorage is accessible, verify token validity

## Advanced Topics

### Single Sign-Out (SSO)

Implement logout across all tenant applications:

```javascript
export async function globalLogout() {
  const token = localStorage.getItem('auth_token');
  
  await fetch(`${AUTH_SERVER}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  logout();
}
```

### Multi-Tenant User Profile

```javascript
export async function getUserProfile(userId) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${AUTH_SERVER}/api/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}
```

## Support

For issues or questions:

1. Check auth server logs: `npm run dev`
2. Verify tenant is registered in auth system
3. Check environment variables are set correctly
4. Review browser console for errors
5. Contact: admin@auth-akash.com

---

**Last Updated:** February 23, 2026
**Version:** 1.0.0
