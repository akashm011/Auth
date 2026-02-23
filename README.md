# Authentication System - Multi-Tenant SaaS Architecture

A secure, invitation-based, multi-tenant authentication system built with Next.js, Better-Auth, MongoDB, and Nodemailer.

## Features

✅ **Multi-Tenant Architecture** - Support multiple external applications (websites/tools)  
✅ **Invitation-Only Access** - Only pre-invited users can create accounts  
✅ **Time-Based Access Control** - Invitations with customizable expiry (days/months/years)  
✅ **Tenant-Aware Authentication** - Users can access only authorized tenants  
✅ **Immediate Access Revocation** - Admin can revoke user access instantly  
✅ **Email Invitations** - Admin sends unique invitation links with tenant information  
✅ **One-Time Credentials** - Auto-generated username & password on first acceptance  
✅ **Local Storage Caching** - Credentials saved locally for quick access  
✅ **Social Login** - Sign in with Google or GitHub (OAuth2)  
✅ **Password Hashing** - bcrypt for secure password storage  
✅ **JWT Sessions** - Secure token-based session management with Better-Auth  
✅ **Beautiful UI** - Tailwind CSS with gradient designs

## System Architecture

### High-Level Flow

```
External App (Tenant)
    ↓
    /signin page
    ↓
Request to auth-akash.com/api/auth
    ↓
Better-Auth validates user credentials
    ↓
Check user access for specific tenant
    ↓
Return JWT token + user data
    ↓
External App sets session/redirects to /
    ↓
Middleware protects routes, validates access
```

### User Journey

1. **Admin sends invitation** → User receives email with unique token
2. **User accepts invitation** → System generates username & password
3. **Credentials saved** → LocalStorage + Email backup
4. **User logs into tenant app** → Tenant app calls `auth-akash.com/api/auth/signin`
5. **Auth validation** → System validates credentials + checks tenant access
6. **Session created** → JWT token issued, user redirected to tenant app dashboard
7. **Access expires** → Auto-revoked when time period expires
8. **Admin revokes** → Immediate access removal (before expiry)

### Database Collections

**users** - User accounts with hashed passwords and OAuth IDs

- email
- username
- password (hashed)
- name
- image
- lastLogin
- createdAt
- updatedAt

**invitations** - Invitation tokens with expiry and tenant access tracking

- userId (ref to users)
- email
- token (encrypted)
- tenants[] (array of tenant IDs user can access)
- expiresAt (time-based access control)
- acceptedAt
- isUsed
- revokedAt
- createdBy (ref to admin user)

**tenants** - External applications/websites using this auth system

- name (e.g., "My App", "Dashboard")
- slug (e.g., "myapp", "dashboard")
- domain
- description
- isActive
- createdBy (ref to admin)
- createdAt

**accessLogs** - Audit trail for access control

- userId (ref to users)
- tenantId (ref to tenants)
- action (signin, revoke, accept-invitation)
- ipAddress
- userAgent
- timestamp

## Prerequisites

Before starting, you need:

- Node.js 18+ and npm
- MongoDB account (free tier at mongodb.com/cloud/atlas)
- Gmail account (for email sending)
- Google OAuth credentials
- GitHub OAuth credentials

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
cd /home/akash/Projects/authentication-system
npm install --legacy-peer-deps
```

### 2. Setup MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user (username & password)
5. Get your connection string
6. Copy the connection string to .env.local as MONGODB_URI

Example:

```
mongodb+srv://username:password@cluster0.abcde.mongodb.net/authentication-system?retryWrites=true&w=majority
```

### 3. Setup Email (Gmail)

1. Go to your [Google Account](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy the generated 16-character password
6. Add to .env.local:

```
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 4. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Secret to .env.local:

```
GOOGLE_ID=your-client-id
GOOGLE_SECRET=your-client-secret
```

### 5. Setup GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers) → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   - Application name: MyApp
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to .env.local:

```
GITHUB_ID=your-client-id
GITHUB_SECRET=your-client-secret
```

### 6. Generate Better-Auth Secret

```bash
openssl rand -base64 32
```

Copy the output to .env.local:

```
BETTER_AUTH_SECRET=your-generated-secret
```

### 7. Complete .env.local

```bash
# Core
NEXTAUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Database
MONGODB_URI=<your-mongodb-connection-string>

# Email
EMAIL_FROM=<your-gmail>
EMAIL_PASSWORD=<your-app-password>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# OAuth Providers
GOOGLE_ID=<your-google-id>
GOOGLE_SECRET=<your-google-secret>
GITHUB_ID=<your-github-id>
GITHUB_SECRET=<your-github-secret>

# Admin
ADMIN_EMAIL=admin@yourapp.com
ADMIN_PASSWORD=<strong-admin-password>
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourapp.com

# Multi-Tenant (add your external apps/tenants here)
NEXT_PUBLIC_TENANT_ID_1=myapp
NEXT_PUBLIC_TENANT_NAME_1=My App
NEXT_PUBLIC_TENANT_URL_1=http://localhost:3001

NEXT_PUBLIC_TENANT_ID_2=dashboard
NEXT_PUBLIC_TENANT_NAME_2=Dashboard
NEXT_PUBLIC_TENANT_URL_2=http://localhost:3002
```

### 8. Seed Admin User (One-Time)

```bash
npm run seed:admin
```

This command creates the admin user once using ADMIN_EMAIL and a bcrypt-hashed ADMIN_PASSWORD. If the admin already exists, it does nothing.

### 9. Seed Initial Tenants (One-Time)

```bash
npm run seed:tenants
```

This creates tenant entries in database for multi-tenant setup.

### 10. Run the Application

```bash
npm run dev
```

Visit http://localhost:3000

## Usage Guide

### For Admins

1. Run `npm run seed:admin` once
2. Login as admin with ADMIN_EMAIL and ADMIN_PASSWORD
3. Go to **Dashboard → Manage Tenants** to register external apps
4. Go to **Dashboard → Send Invitation**
5. Select user email and target tenants
6. Set access expiry (days/months/years)
7. Send invitation
8. User receives email with acceptance link and credential details

### Admin Features

- **List Invited Users** - View all invitations with tenant access and expiry dates
- **Revoke Access** - Immediately revoke user access to specific tenants
- **Extend Access** - Extend expiry date for active invitations
- **View Access Logs** - Audit trail of user actions and access changes
- **Manage Tenants** - Register/manage external applications

### For Users

1. Click invitation link in email
2. Click "Accept Invitation"
3. Get auto-generated credentials
4. Credentials auto-save to browser
5. Access permitted tenants via their signin pages
6. Each tenant app handles signin via `auth-akash.com` backend

### For External Apps (Tenants)

External applications should implement signin flow:

```javascript
// External App: /signin page
async function handleSignin(email, password) {
  const response = await fetch("https://auth-akash.com/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
    }),
  });

  const data = await response.json();
  if (response.ok) {
    // Save JWT token
    localStorage.setItem("auth_token", data.token);
    // Redirect to dashboard
    window.location.href = "/";
  }
}
```

## File Structure

```
app/
├── page.js                          # Landing page
├── layout.js                        # Root layout with AuthProvider
├── providers.js                     # Better-Auth SessionProvider
├── globals.css                      # Tailwind styles
├── auth/
│   ├── signin/page.js              # Login page
│   ├── accept-invitation/page.js   # Invitation acceptance
│   └── error/page.js               # Auth error page
├── dashboard/
│   ├── page.js                      # Admin dashboard
│   ├── invitations/page.js          # List invitations
│   ├── access-logs/page.js          # View access logs
│   ├── manage-tenants/page.js       # Manage external apps
│   └── [invitationId]/revoke/page.js # Revoke access
├── admin/
│   └── send-invitation/page.js     # Admin invitation panel
└── api/
    ├── auth/
    │   ├── route.js                 # Better-Auth route
    │   └── [...better-auth]/route.js # Better-Auth handler
    ├── send-invitation/route.js    # Send invitation API
    ├── accept-invitation/route.js  # Accept invitation API
    ├── revoke-access/route.js      # Revoke user access API
    ├── extend-access/route.js      # Extend access expiry API
    └── access-logs/route.js        # Get access logs API

lib/
├── mongodb.js                       # MongoDB connection
├── email.js                         # Nodemailer setup
├── auth.js                          # Better-Auth configuration
├── encryption.js                    # Token encryption/decryption
└── tenant.js                        # Tenant utilities

models/
├── User.js                          # User schema/model
├── Invitation.js                    # Invitation schema/model
├── Tenant.js                        # Tenant schema/model
└── AccessLog.js                     # Access log schema/model
```

## API Endpoints

### Authentication

#### POST /api/auth/signin

Signin user and validate tenant access

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password",
  "tenantId": "myapp"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "user_abc123",
    "name": "John Doe"
  },
  "accessibleTenants": ["myapp", "dashboard"]
}
```

### Invitations

#### POST /api/send-invitation

Send invitation to a new user (Admin only)

**Body:**

```json
{
  "email": "user@example.com",
  "tenants": ["myapp", "dashboard"],
  "expiryDays": 30,
  "expiryMonths": 0,
  "expiryYears": 0
}
```

**Response:**

```json
{
  "message": "Invitation sent successfully",
  "email": "user@example.com",
  "tenants": ["myapp", "dashboard"],
  "expiresAt": "2026-03-25T10:30:00Z"
}
```

#### POST /api/accept-invitation

Accept invitation and generate credentials

**Body:**

```json
{
  "token": "invitation-token-from-email"
}
```

**Response:**

```json
{
  "message": "Invitation accepted successfully",
  "email": "user@example.com",
  "username": "user_abc123",
  "password": "generated-secure-password",
  "tenants": ["myapp", "dashboard"]
}
```

### Access Control

#### POST /api/revoke-access

Revoke user access to specific tenants (Admin only)

**Body:**

```json
{
  "userId": "user-id",
  "tenants": ["myapp"],
  "reason": "Policy violation"
}
```

**Response:**

```json
{
  "message": "Access revoked successfully",
  "revokedAt": "2026-02-23T10:30:00Z"
}
```

#### POST /api/extend-access

Extend access expiry date (Admin only)

**Body:**

```json
{
  "invitationId": "invitation-id",
  "expiryDays": 30,
  "expiryMonths": 0,
  "expiryYears": 0
}
```

**Response:**

```json
{
  "message": "Access extended successfully",
  "expiresAt": "2026-03-25T10:30:00Z"
}
```

#### GET /api/access-logs?userId=xxx&tenantId=xxx

Get access logs (Admin only)

**Response:**

```json
{
  "logs": [
    {
      "id": "log-id",
      "userId": "user-id",
      "tenantId": "myapp",
      "action": "signin",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-02-23T10:30:00Z"
    }
  ]
}
```

## Database Schema (Detailed)

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String,
  username: String,
  password: String, // bcrypt hashed
  name: String,
  image: String,
  role: String, // 'user', 'admin', 'superadmin'
  isActive: Boolean,
  lastLogin: Date,
  googleId: String,
  githubId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Invitations Collection

```javascript
{
  _id: ObjectId,
  email: String,
  userId: ObjectId, // ref to users
  token: String, // encrypted unique token
  tenants: [String], // array of tenant IDs
  expiresAt: Date, // time-based access expiry
  acceptedAt: Date,
  isUsed: Boolean,
  revokedAt: Date,
  revokedReason: String,
  createdBy: ObjectId, // ref to admin user
  createdAt: Date,
  updatedAt: Date
}
```

### Tenants Collection

```javascript
{
  _id: ObjectId,
  name: String, // e.g., "My App"
  slug: String, // e.g., "myapp"
  domain: String, // e.g., "myapp.com"
  description: String,
  isActive: Boolean,
  createdBy: ObjectId, // ref to admin user
  createdAt: Date,
  updatedAt: Date
}
```

### AccessLogs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref to users
  tenantId: ObjectId, // ref to tenants
  action: String, // 'signin', 'revoke', 'accept-invitation', 'expire'
  ipAddress: String,
  userAgent: String,
  status: String, // 'success', 'failed'
  errorMessage: String,
  timestamp: Date
}
```

## Authentication Methods

### 1. Email & Password

- Generated automatically on invitation acceptance
- Credentials stored in localStorage by tenant app
- Password hashed with bcrypt (10 rounds)
- Validated against tenant access on each signin

### 2. Google OAuth

- Click "Google" on login page
- Must be invited first
- Profile auto-populated from Google
- Tenant access validated after OAuth

### 3. GitHub OAuth

- Click "GitHub" on login page
- Must be invited first
- Profile auto-populated from GitHub
- Tenant access validated after OAuth

## Security Features

✓ Invitation tokens encrypted and valid for limited time only  
✓ One-time use invitations (marked as used after acceptance)  
✓ Passwords hashed with bcrypt (10 rounds)  
✓ Time-based access control with automatic revocation  
✓ Immediate access revocation capability  
✓ JWT-based session management with Better-Auth  
✓ Secure HTTP-only cookies for session  
✓ Only invited users can access platform  
✓ Tenant-aware authorization checks  
✓ Admin verification for all sensitive operations  
✓ Comprehensive access audit logging  
✓ CORS protection for multi-tenant requests

## Troubleshooting

### "User not invited" Error

- Make sure admin sent you an invitation first
- Check spam folder for invitation email
- Verify invitation hasn't expired
- Ask admin to resend or extend invitation

### "Access denied for tenant" Error

- User is not invited to access this specific tenant
- Ask admin to add tenant to invitation
- Check if access was revoked

### "Access expired" Error

- Invitation time period has expired
- Ask admin to extend access or resend invitation

### Email not sending

- Check EMAIL_FROM and EMAIL_PASSWORD in .env.local
- Enable "Less secure app access" if using Gmail
- Try using App Password instead of Gmail password

### OAuth not working

- Verify redirect URIs match exactly
- Check Client ID and Secret are correct
- Make sure APIs are enabled (Google+, GitHub OAuth)

### MongoDB connection error

- Verify MONGODB_URI connection string
- Check IP address is whitelisted in MongoDB Atlas
- Ensure database user has correct permissions

## Environment Variables Reference

| Variable                   | Purpose                    | Required |
| -------------------------- | -------------------------- | -------- |
| NEXTAUTH_URL               | Application URL            | ✅       |
| BETTER_AUTH_SECRET         | Better-Auth encryption key | ✅       |
| BETTER_AUTH_URL            | Better-Auth API URL        | ✅       |
| MONGODB_URI                | MongoDB connection string  | ✅       |
| EMAIL_FROM                 | Sender email address       | ✅       |
| EMAIL_PASSWORD             | Email app password         | ✅       |
| EMAIL_HOST                 | SMTP host                  | ✅       |
| EMAIL_PORT                 | SMTP port                  | ✅       |
| GOOGLE_ID                  | Google OAuth Client ID     | ✅       |
| GOOGLE_SECRET              | Google OAuth Secret        | ✅       |
| GITHUB_ID                  | GitHub OAuth App ID        | ✅       |
| GITHUB_SECRET              | GitHub OAuth App Secret    | ✅       |
| ADMIN_EMAIL                | Admin email address        | ✅       |
| ADMIN_PASSWORD             | Admin login password       | ✅       |
| NEXT_PUBLIC_ADMIN_EMAIL    | Public admin email         | ✅       |
| NEXT*PUBLIC_TENANT_ID*\*   | External app tenant IDs    | ✅       |
| NEXT*PUBLIC_TENANT_NAME*\* | External app tenant names  | ✅       |
| NEXT*PUBLIC_TENANT_URL*\*  | External app URLs          | ✅       |

## Deployment

### Production Checklist

- [ ] Generate new BETTER_AUTH_SECRET
- [ ] Update BETTER_AUTH_URL to production domain
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Update MongoDB connection string
- [ ] Update OAuth redirect URIs
- [ ] Update email configuration for production
- [ ] Enable HTTPS only
- [ ] Set secure cookies in Better-Auth config
- [ ] Configure CORS for multi-tenant requests
- [ ] Review security best practices
- [ ] Setup backup strategy for MongoDB

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
5. Update OAuth redirect URIs with production domain

## Migration from NextAuth to Better-Auth

If migrating from the current NextAuth setup:

1. Install Better-Auth dependencies
2. Create Better-Auth configuration file
3. Update session provider in layout.js
4. Migrate OAuth provider configuration
5. Update API routes to use Better-Auth handlers
6. Test authentication flow on all tenants

## Support

For issues or questions:

1. Check troubleshooting section
2. Review error messages in browser console
3. Check server logs: `npm run dev`
4. Verify all environment variables are set
5. Check Better-Auth documentation: https://www.better-auth.com

## Architecture Diagrams

### Multi-Tenant Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│ External App 1 (myapp.com) - Tenant 1                      │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ /signin page                                             ││
│ │ User enters: email + password + tenantId                 ││
│ └──────────────────────┬───────────────────────────────────┘│
└────────────────────────┼──────────────────────────────────────┘
                         │ POST /api/auth/signin
                         │ { email, password, tenantId }
                         ▼
     ┌──────────────────────────────────────────────────────────┐
     │ Auth App (auth-akash.com)                               │
     │ ┌────────────────────────────────────────────────────────┤
     │ │ 1. Validate email + password (bcrypt)                 │
     │ │ 2. Check user invitation status                       │
     │ │ 3. Check user access to specific tenant              │
     │ │ 4. Check invitation not expired                      │
     │ │ 5. Check access not revoked                          │
     │ │ 6. Log access attempt                                │
     │ │ 7. Generate JWT token                                │
     │ └────────────────────────────────────────────────────────┤
     └──────────────────────┬───────────────────────────────────┘
                         │ Response: { token, user, tenants }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ External App 1 (myapp.com)                                 │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ localStorage.setItem('auth_token', token)                ││
│ │ Redirect to / (Protected by middleware)                  ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Access Control Logic

```
User Login Attempt
        │
        ├─→ Is user email in database? ──No──→ ❌ Fail
        │
        ├─→ Is password correct? ──No──→ ❌ Fail
        │
        ├─→ Has user accepted invitation? ──No──→ ❌ Fail
        │
        ├─→ Is tenant in user's accessible tenants? ──No──→ ❌ Fail
        │
        ├─→ Is invitation expired? ──Yes──→ ❌ Fail (auto-revoked)
        │
        ├─→ Has access been revoked? ──Yes──→ ❌ Fail
        │
        └─→ ✅ Generate JWT & Create Session
```

## License

MIT

---

````
</copilot-edited-file>```


The resulting document:
<copilot-edited-file>
```markdown
# Authentication System - Multi-Tenant SaaS Architecture

A secure, invitation-based, multi-tenant authentication system built with Next.js, Better-Auth, MongoDB, and Nodemailer.

## Features

✅ **Multi-Tenant Architecture** - Support multiple external applications (websites/tools)
✅ **Invitation-Only Access** - Only pre-invited users can create accounts
✅ **Time-Based Access Control** - Invitations with customizable expiry (days/months/years)
✅ **Tenant-Aware Authentication** - Users can access only authorized tenants
✅ **Immediate Access Revocation** - Admin can revoke user access instantly
✅ **Email Invitations** - Admin sends unique invitation links with tenant information
✅ **One-Time Credentials** - Auto-generated username & password on first acceptance
✅ **Local Storage Caching** - Credentials saved locally for quick access
✅ **Social Login** - Sign in with Google or GitHub (OAuth2)
✅ **Password Hashing** - bcrypt for secure password storage
✅ **JWT Sessions** - Secure token-based session management with Better-Auth
✅ **Beautiful UI** - Tailwind CSS with gradient designs

## System Architecture

### High-Level Flow

````

External App (Tenant)
↓
/signin page
↓
Request to auth-akash.com/api/auth
↓
Better-Auth validates user credentials
↓
Check user access for specific tenant
↓
Return JWT token + user data
↓
External App sets session/redirects to /
↓
Middleware protects routes, validates access

````

### User Journey

1. **Admin sends invitation** → User receives email with unique token
2. **User accepts invitation** → System generates username & password
3. **Credentials saved** → LocalStorage + Email backup
4. **User logs into tenant app** → Tenant app calls `auth-akash.com/api/auth/signin`
5. **Auth validation** → System validates credentials + checks tenant access
6. **Session created** → JWT token issued, user redirected to tenant app dashboard
7. **Access expires** → Auto-revoked when time period expires
8. **Admin revokes** → Immediate access removal (before expiry)

### Database Collections

**users** - User accounts with hashed passwords and OAuth IDs
- email
- username
- password (hashed)
- name
- image
- lastLogin
- createdAt
- updatedAt

**invitations** - Invitation tokens with expiry and tenant access tracking
- userId (ref to users)
- email
- token (encrypted)
- tenants[] (array of tenant IDs user can access)
- expiresAt (time-based access control)
- acceptedAt
- isUsed
- revokedAt
- createdBy (ref to admin user)

**tenants** - External applications/websites using this auth system
- name (e.g., "My App", "Dashboard")
- slug (e.g., "myapp", "dashboard")
- domain
- description
- isActive
- createdBy (ref to admin)
- createdAt

**accessLogs** - Audit trail for access control
- userId (ref to users)
- tenantId (ref to tenants)
- action (signin, revoke, accept-invitation)
- ipAddress
- userAgent
- timestamp

## Prerequisites

Before starting, you need:

- Node.js 18+ and npm
- MongoDB account (free tier at mongodb.com/cloud/atlas)
- Gmail account (for email sending)
- Google OAuth credentials
- GitHub OAuth credentials

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
cd /home/akash/Projects/authentication-system
npm install --legacy-peer-deps
````

### 2. Setup MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user (username & password)
5. Get your connection string
6. Copy the connection string to .env.local as MONGODB_URI

Example:

```
mongodb+srv://username:password@cluster0.abcde.mongodb.net/authentication-system?retryWrites=true&w=majority
```

### 3. Setup Email (Gmail)

1. Go to your [Google Account](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy the generated 16-character password
6. Add to .env.local:

```
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 4. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Secret to .env.local:

```
GOOGLE_ID=your-client-id
GOOGLE_SECRET=your-client-secret
```

### 5. Setup GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers) → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   - Application name: MyApp
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to .env.local:

```
GITHUB_ID=your-client-id
GITHUB_SECRET=your-client-secret
```

### 6. Generate Better-Auth Secret

```bash
openssl rand -base64 32
```

Copy the output to .env.local:

```
BETTER_AUTH_SECRET=your-generated-secret
```

### 7. Complete .env.local

```bash
# Core
NEXTAUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Database
MONGODB_URI=<your-mongodb-connection-string>

# Email
EMAIL_FROM=<your-gmail>
EMAIL_PASSWORD=<your-app-password>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# OAuth Providers
GOOGLE_ID=<your-google-id>
GOOGLE_SECRET=<your-google-secret>
GITHUB_ID=<your-github-id>
GITHUB_SECRET=<your-github-secret>

# Admin
ADMIN_EMAIL=admin@yourapp.com
ADMIN_PASSWORD=<strong-admin-password>
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourapp.com

# Multi-Tenant (add your external apps/tenants here)
NEXT_PUBLIC_TENANT_ID_1=myapp
NEXT_PUBLIC_TENANT_NAME_1=My App
NEXT_PUBLIC_TENANT_URL_1=http://localhost:3001

NEXT_PUBLIC_TENANT_ID_2=dashboard
NEXT_PUBLIC_TENANT_NAME_2=Dashboard
NEXT_PUBLIC_TENANT_URL_2=http://localhost:3002
```

### 8. Seed Admin User (One-Time)

```bash
npm run seed:admin
```

This command creates the admin user once using ADMIN_EMAIL and a bcrypt-hashed ADMIN_PASSWORD. If the admin already exists, it does nothing.

### 9. Seed Initial Tenants (One-Time)

```bash
npm run seed:tenants
```

This creates tenant entries in database for multi-tenant setup.

### 10. Run the Application

```bash
npm run dev
```

Visit http://localhost:3000

## Usage Guide

### For Admins

1. Run `npm run seed:admin` once
2. Login as admin with ADMIN_EMAIL and ADMIN_PASSWORD
3. Go to **Dashboard → Manage Tenants** to register external apps
4. Go to **Dashboard → Send Invitation**
5. Select user email and target tenants
6. Set access expiry (days/months/years)
7. Send invitation
8. User receives email with acceptance link and credential details

### Admin Features

- **List Invited Users** - View all invitations with tenant access and expiry dates
- **Revoke Access** - Immediately revoke user access to specific tenants
- **Extend Access** - Extend expiry date for active invitations
- **View Access Logs** - Audit trail of user actions and access changes
- **Manage Tenants** - Register/manage external applications

### For Users

1. Click invitation link in email
2. Click "Accept Invitation"
3. Get auto-generated credentials
4. Credentials auto-save to browser
5. Access permitted tenants via their signin pages
6. Each tenant app handles signin via `auth-akash.com` backend

### For External Apps (Tenants)

External applications should implement signin flow:

```javascript
// External App: /signin page
async function handleSignin(email, password) {
  const response = await fetch("https://auth-akash.com/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
    }),
  });

  const data = await response.json();
  if (response.ok) {
    // Save JWT token
    localStorage.setItem("auth_token", data.token);
    // Redirect to dashboard
    window.location.href = "/";
  }
}
```

## File Structure

```
app/
├── page.js                          # Landing page
├── layout.js                        # Root layout with AuthProvider
├── providers.js                     # Better-Auth SessionProvider
├── globals.css                      # Tailwind styles
├── auth/
│   ├── signin/page.js              # Login page
│   ├── accept-invitation/page.js   # Invitation acceptance
│   └── error/page.js               # Auth error page
├── dashboard/
│   ├── page.js                      # Admin dashboard
│   ├── invitations/page.js          # List invitations
│   ├── access-logs/page.js          # View access logs
│   ├── manage-tenants/page.js       # Manage external apps
│   └── [invitationId]/revoke/page.js # Revoke access
├── admin/
│   └── send-invitation/page.js     # Admin invitation panel
└── api/
    ├── auth/
    │   ├── route.js                 # Better-Auth route
    │   └── [...better-auth]/route.js # Better-Auth handler
    ├── send-invitation/route.js    # Send invitation API
    ├── accept-invitation/route.js  # Accept invitation API
    ├── revoke-access/route.js      # Revoke user access API
    ├── extend-access/route.js      # Extend access expiry API
    └── access-logs/route.js        # Get access logs API

lib/
├── mongodb.js                       # MongoDB connection
├── email.js                         # Nodemailer setup
├── auth.js                          # Better-Auth configuration
├── encryption.js                    # Token encryption/decryption
└── tenant.js                        # Tenant utilities

models/
├── User.js                          # User schema/model
├── Invitation.js                    # Invitation schema/model
├── Tenant.js                        # Tenant schema/model
└── AccessLog.js                     # Access log schema/model
```

## API Endpoints

### Authentication

#### POST /api/auth/signin

Signin user and validate tenant access

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password",
  "tenantId": "myapp"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "user_abc123",
    "name": "John Doe"
  },
  "accessibleTenants": ["myapp", "dashboard"]
}
```

### Invitations

#### POST /api/send-invitation

Send invitation to a new user (Admin only)

**Body:**

```json
{
  "email": "user@example.com",
  "tenants": ["myapp", "dashboard"],
  "expiryDays": 30,
  "expiryMonths": 0,
  "expiryYears": 0
}
```

**Response:**

```json
{
  "message": "Invitation sent successfully",
  "email": "user@example.com",
  "tenants": ["myapp", "dashboard"],
  "expiresAt": "2026-03-25T10:30:00Z"
}
```

#### POST /api/accept-invitation

Accept invitation and generate credentials

**Body:**

```json
{
  "token": "invitation-token-from-email"
}
```

**Response:**

```json
{
  "message": "Invitation accepted successfully",
  "email": "user@example.com",
  "username": "user_abc123",
  "password": "generated-secure-password",
  "tenants": ["myapp", "dashboard"]
}
```

### Access Control

#### POST /api/revoke-access

Revoke user access to specific tenants (Admin only)

**Body:**

```json
{
  "userId": "user-id",
  "tenants": ["myapp"],
  "reason": "Policy violation"
}
```

**Response:**

```json
{
  "message": "Access revoked successfully",
  "revokedAt": "2026-02-23T10:30:00Z"
}
```

#### POST /api/extend-access

Extend access expiry date (Admin only)

**Body:**

```json
{
  "invitationId": "invitation-id",
  "expiryDays": 30,
  "expiryMonths": 0,
  "expiryYears": 0
}
```

**Response:**

```json
{
  "message": "Access extended successfully",
  "expiresAt": "2026-03-25T10:30:00Z"
}
```

#### GET /api/access-logs?userId=xxx&tenantId=xxx

Get access logs (Admin only)

**Response:**

```json
{
  "logs": [
    {
      "id": "log-id",
      "userId": "user-id",
      "tenantId": "myapp",
      "action": "signin",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-02-23T10:30:00Z"
    }
  ]
}
```

## Database Schema (Detailed)

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String,
  username: String,
  password: String, // bcrypt hashed
  name: String,
  image: String,
  role: String, // 'user', 'admin', 'superadmin'
  isActive: Boolean,
  lastLogin: Date,
  googleId: String,
  githubId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Invitations Collection

```javascript
{
  _id: ObjectId,
  email: String,
  userId: ObjectId, // ref to users
  token: String, // encrypted unique token
  tenants: [String], // array of tenant IDs
  expiresAt: Date, // time-based access expiry
  acceptedAt: Date,
  isUsed: Boolean,
  revokedAt: Date,
  revokedReason: String,
  createdBy: ObjectId, // ref to admin user
  createdAt: Date,
  updatedAt: Date
}
```

### Tenants Collection

```javascript
{
  _id: ObjectId,
  name: String, // e.g., "My App"
  slug: String, // e.g., "myapp"
  domain: String, // e.g., "myapp.com"
  description: String,
  isActive: Boolean,
  createdBy: ObjectId, // ref to admin user
  createdAt: Date,
  updatedAt: Date
}
```

### AccessLogs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref to users
  tenantId: ObjectId, // ref to tenants
  action: String, // 'signin', 'revoke', 'accept-invitation', 'expire'
  ipAddress: String,
  userAgent: String,
  status: String, // 'success', 'failed'
  errorMessage: String,
  timestamp: Date
}
```

## Authentication Methods

### 1. Email & Password

- Generated automatically on invitation acceptance
- Credentials stored in localStorage by tenant app
- Password hashed with bcrypt (10 rounds)
- Validated against tenant access on each signin

### 2. Google OAuth

- Click "Google" on login page
- Must be invited first
- Profile auto-populated from Google
- Tenant access validated after OAuth

### 3. GitHub OAuth

- Click "GitHub" on login page
- Must be invited first
- Profile auto-populated from GitHub
- Tenant access validated after OAuth

## Security Features

✓ Invitation tokens encrypted and valid for limited time only  
✓ One-time use invitations (marked as used after acceptance)  
✓ Passwords hashed with bcrypt (10 rounds)  
✓ Time-based access control with automatic revocation  
✓ Immediate access revocation capability  
✓ JWT-based session management with Better-Auth  
✓ Secure HTTP-only cookies for session  
✓ Only invited users can access platform  
✓ Tenant-aware authorization checks  
✓ Admin verification for all sensitive operations  
✓ Comprehensive access audit logging  
✓ CORS protection for multi-tenant requests

## Troubleshooting

### "User not invited" Error

- Make sure admin sent you an invitation first
- Check spam folder for invitation email
- Verify invitation hasn't expired
- Ask admin to resend or extend invitation

### "Access denied for tenant" Error

- User is not invited to access this specific tenant
- Ask admin to add tenant to invitation
- Check if access was revoked

### "Access expired" Error

- Invitation time period has expired
- Ask admin to extend access or resend invitation

### Email not sending

- Check EMAIL_FROM and EMAIL_PASSWORD in .env.local
- Enable "Less secure app access" if using Gmail
- Try using App Password instead of Gmail password

### OAuth not working

- Verify redirect URIs match exactly
- Check Client ID and Secret are correct
- Make sure APIs are enabled (Google+, GitHub OAuth)

### MongoDB connection error

- Verify MONGODB_URI connection string
- Check IP address is whitelisted in MongoDB Atlas
- Ensure database user has correct permissions

## Environment Variables Reference

| Variable                   | Purpose                    | Required |
| -------------------------- | -------------------------- | -------- |
| NEXTAUTH_URL               | Application URL            | ✅       |
| BETTER_AUTH_SECRET         | Better-Auth encryption key | ✅       |
| BETTER_AUTH_URL            | Better-Auth API URL        | ✅       |
| MONGODB_URI                | MongoDB connection string  | ✅       |
| EMAIL_FROM                 | Sender email address       | ✅       |
| EMAIL_PASSWORD             | Email app password         | ✅       |
| EMAIL_HOST                 | SMTP host                  | ✅       |
| EMAIL_PORT                 | SMTP port                  | ✅       |
| GOOGLE_ID                  | Google OAuth Client ID     | ✅       |
| GOOGLE_SECRET              | Google OAuth Secret        | ✅       |
| GITHUB_ID                  | GitHub OAuth App ID        | ✅       |
| GITHUB_SECRET              | GitHub OAuth App Secret    | ✅       |
| ADMIN_EMAIL                | Admin email address        | ✅       |
| ADMIN_PASSWORD             | Admin login password       | ✅       |
| NEXT_PUBLIC_ADMIN_EMAIL    | Public admin email         | ✅       |
| NEXT*PUBLIC_TENANT_ID*\*   | External app tenant IDs    | ✅       |
| NEXT*PUBLIC_TENANT_NAME*\* | External app tenant names  | ✅       |
| NEXT*PUBLIC_TENANT_URL*\*  | External app URLs          | ✅       |

## Deployment

### Production Checklist

- [ ] Generate new BETTER_AUTH_SECRET
- [ ] Update BETTER_AUTH_URL to production domain
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Update MongoDB connection string
- [ ] Update OAuth redirect URIs
- [ ] Update email configuration for production
- [ ] Enable HTTPS only
- [ ] Set secure cookies in Better-Auth config
- [ ] Configure CORS for multi-tenant requests
- [ ] Review security best practices
- [ ] Setup backup strategy for MongoDB

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
5. Update OAuth redirect URIs with production domain

## Migration from NextAuth to Better-Auth

If migrating from the current NextAuth setup:

1. Install Better-Auth dependencies
2. Create Better-Auth configuration file
3. Update session provider in layout.js
4. Migrate OAuth provider configuration
5. Update API routes to use Better-Auth handlers
6. Test authentication flow on all tenants

## Support

For issues or questions:

1. Check troubleshooting section
2. Review error messages in browser console
3. Check server logs: `npm run dev`
4. Verify all environment variables are set
5. Check Better-Auth documentation: https://www.better-auth.com

## Architecture Diagrams

### Multi-Tenant Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│ External App 1 (myapp.com) - Tenant 1                      │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ /signin page                                             ││
│ │ User enters: email + password + tenantId                 ││
│ └──────────────────────┬───────────────────────────────────┘│
└────────────────────────┼──────────────────────────────────────┘
                         │ POST /api/auth/signin
                         │ { email, password, tenantId }
                         ▼
     ┌──────────────────────────────────────────────────────────┐
     │ Auth App (auth-akash.com)                               │
     │ ┌────────────────────────────────────────────────────────┤
     │ │ 1. Validate email + password (bcrypt)                 │
     │ │ 2. Check user invitation status                       │
     │ │ 3. Check user access to specific tenant              │
     │ │ 4. Check invitation not expired                      │
     │ │ 5. Check access not revoked                          │
     │ │ 6. Log access attempt                                │
     │ │ 7. Generate JWT token                                │
     │ └────────────────────────────────────────────────────────┤
     └──────────────────────┬───────────────────────────────────┘
                         │ Response: { token, user, tenants }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ External App 1 (myapp.com)                                 │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ localStorage.setItem('auth_token', token)                ││
│ │ Redirect to / (Protected by middleware)                  ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Access Control Logic

```
User Login Attempt
        │
        ├─→ Is user email in database? ──No──→ ❌ Fail
        │
        ├─→ Is password correct? ──No──→ ❌ Fail
        │
        ├─→ Has user accepted invitation? ──No──→ ❌ Fail
        │
        ├─→ Is tenant in user's accessible tenants? ──No──→ ❌ Fail
        │
        ├─→ Is invitation expired? ──Yes──→ ❌ Fail (auto-revoked)
        │
        ├─→ Has access been revoked? ──Yes──→ ❌ Fail
        │
        └─→ ✅ Generate JWT & Create Session
```

## License

MIT

---
