# Quick Start Guide for Tenant Applications

A fast-track setup guide to integrate your Next.js application with the centralized auth-akash.com authentication system.

## 5-Minute Setup

### 1. Install Dependencies

```bash
# No additional packages needed if using Next.js 13+
npm install jsonwebtoken
```

### 2. Create Auth Utilities (`lib/auth-client.js`)

```javascript
const AUTH_SERVER = process.env.NEXT_PUBLIC_AUTH_SERVER_URL;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;

export async function signin(email, password) {
  const res = await fetch(`${AUTH_SERVER}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tenantId: TENANT_ID }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }

  const data = await res.json();
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function getUser() {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}
```

### 3. Create Sign In Page (`app/auth/signin/page.js`)

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signin } from '@/lib/auth-client';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signin(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-96">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 mb-4 rounded"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-3 py-2 mb-4 rounded"
          required
        />
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
```

### 4. Create Protected Dashboard (`app/page.js`)

```javascript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getToken, logout } from '@/lib/auth-client';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/signin');
      return;
    }
    setUser(getUser());
  }, [router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
          <button
            onClick={() => {
              logout();
              router.push('/auth/signin');
            }}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>ID:</strong> {user.id}</p>
        </div>
      </main>
    </div>
  );
}
```

### 5. Setup Middleware (`middleware.js`)

```javascript
import { NextResponse } from 'next/server';

const protectedRoutes = ['/', '/dashboard', '/profile'];

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    const token = request.cookies.get('auth_token');
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 6. Configure Environment (`.env.local`)

```bash
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_TENANT_ID=myapp
NEXT_PUBLIC_TENANT_NAME=My App
```

For production:
```bash
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth-akash.com
NEXT_PUBLIC_TENANT_ID=myapp
NEXT_PUBLIC_TENANT_NAME=My App
```

## Testing

### Step 1: Start Auth Server
```bash
cd /home/akash/Projects/authentication-system
npm run dev
# http://localhost:3000
```

### Step 2: Start Your Tenant App
```bash
cd your-tenant-app
npm run dev
# http://localhost:3001
```

### Step 3: Test Sign In
1. Visit `http://localhost:3001/auth/signin`
2. Enter credentials (you need to be invited first from auth server)
3. Should redirect to dashboard
4. Check browser localStorage for `auth_token`

### Step 4: Test Protected Routes
1. Open DevTools → Application → Cookies
2. Delete `auth_token` cookie
3. Refresh page
4. Should redirect to signin

## API Reference

### Sign In
**POST** `{AUTH_SERVER}/api/auth/signin`

```json
{
  "email": "user@example.com",
  "password": "password",
  "tenantId": "myapp"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "id": "...", "email": "...", "username": "..." },
  "accessibleTenants": ["myapp"]
}
```

### Verify Token
**POST** `{AUTH_SERVER}/api/auth/verify`

Header: `Authorization: Bearer {token}`

Response:
```json
{
  "valid": true,
  "user": { ... },
  "decodedToken": { ... }
}
```

## Making API Calls with Token

```javascript
const token = localStorage.getItem('auth_token');

const response = await fetch('https://your-api.com/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## Common Issues

### "Redirect Loop"
- Check if auth server is running
- Verify `NEXT_PUBLIC_AUTH_SERVER_URL` is correct
- Clear browser localStorage and cookies

### "CORS Error"
- Ensure auth server allows your domain
- Check browser console for exact error
- Verify tenant is registered in auth system

### "Token Not Saving"
- Check if localStorage is enabled
- Verify sign in was successful
- Check browser privacy settings

## Next Steps

1. ✅ Set up basic authentication
2. 📚 Read full integration guide: `TENANT_INTEGRATION_GUIDE.md`
3. 🔐 Implement token refresh logic
4. 🛡️ Add CORS configuration
5. 📱 Setup cookie-based sessions

## Directory Structure

```
your-tenant-app/
├── app/
│   ├── auth/
│   │   └── signin/
│   │       └── page.js
│   └── page.js (dashboard)
├── lib/
│   └── auth-client.js
├── middleware.js
├── .env.local
└── package.json
```

## Support

- **Auth Server Issues:** Check `/home/akash/Projects/authentication-system`
- **Docs:** See `TENANT_INTEGRATION_GUIDE.md`
- **Admin Contact:** admin@auth-akash.com

---

**Version:** 1.0.0 | **Date:** Feb 23, 2026
