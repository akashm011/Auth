# Authentication System - Complete Setup Guide

A secure, invitation-based authentication system built with Next.js, NextAuth, MongoDB, and Nodemailer.

## Features

✅ **Invitation-Only Access** - Only pre-invited users can create accounts  
✅ **Email Invitations** - Admin sends unique invitation links (valid for 24 hours)  
✅ **One-Time Credentials** - Auto-generated username & password on first acceptance  
✅ **Local Storage Caching** - Credentials saved locally for quick access  
✅ **Social Login** - Sign in with Google or GitHub  
✅ **Password Hashing** - bcrypt for secure password storage  
✅ **JWT Sessions** - Secure token-based session management  
✅ **Beautiful UI** - Tailwind CSS with gradient designs

## System Architecture

### User Flow

1. **Admin sends invitation** → User receives email with unique token
2. **User accepts invitation** → System generates username & password
3. **Credentials saved** → LocalStorage + Email backup
4. **User logs in** → Can use credentials or social login (Google/GitHub)
5. **Protected dashboard** → Access to user dashboard

### Database Collections

- **users** - User accounts with hashed passwords and OAuth IDs
- **invitations** - Invitation tokens with expiry tracking

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
6. Copy the connection string to `.env.local` as `MONGODB_URI`

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
6. Add to `.env.local`:

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
7. Copy Client ID and Secret to `.env.local`:

```
GOOGLE_ID=your-client-id
GOOGLE_SECRET=your-client-secret
```

### 5. Setup GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers) → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   - Application name: `MyApp`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`:

```
GITHUB_ID=your-client-id
GITHUB_SECRET=your-client-secret
```

### 6. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `.env.local`:

```
NEXTAUTH_SECRET=your-generated-secret
```

### 7. Complete .env.local

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>
MONGODB_URI=<your-mongodb-connection-string>
EMAIL_FROM=<your-gmail>
EMAIL_PASSWORD=<your-app-password>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
GOOGLE_ID=<your-google-id>
GOOGLE_SECRET=<your-google-secret>
GITHUB_ID=<your-github-id>
GITHUB_SECRET=<your-github-secret>
ADMIN_EMAIL=admin@yourapp.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourapp.com
```

### 8. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## Usage Guide

### For Admins

1. Login as admin (use your ADMIN_EMAIL for first-time setup)
2. Go to Dashboard → Send Invitation
3. Enter user email and send invitation
4. User receives email with acceptance link

### For Users

1. Click invitation link in email
2. Click "Accept Invitation"
3. Get auto-generated credentials
4. Credentials auto-save to browser
5. Go to Sign In page
6. Login with credentials or Google/GitHub

## File Structure

```
app/
├── page.js                          # Landing page
├── layout.js                        # Root layout with AuthProvider
├── providers.js                     # NextAuth SessionProvider
├── globals.css                      # Tailwind styles
├── auth/
│   ├── signin/page.js              # Login page
│   ├── accept-invitation/page.js   # Invitation acceptance
│   └── error/page.js               # Auth error page
├── dashboard/page.js                # Protected dashboard
├── admin/
│   └── send-invitation/page.js     # Admin invitation panel
└── api/
    ├── auth/[...nextauth]/route.js # NextAuth configuration
    ├── send-invitation/route.js    # Send invitation API
    └── accept-invitation/route.js  # Accept invitation API

lib/
├── mongodb.js                       # MongoDB connection
└── email.js                         # Nodemailer setup
```

## API Endpoints

### POST /api/send-invitation

Send invitation to a new user (Admin only)

**Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Invitation sent successfully",
  "email": "user@example.com"
}
```

### POST /api/accept-invitation

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
  "password": "generated-secure-password"
}
```

## Authentication Methods

### 1. Email & Password

- Generated automatically on invitation acceptance
- Credentials stored in localStorage
- Password hashed with bcrypt

### 2. Google OAuth

- Click "Google" on login page
- Must be invited first
- Profile auto-populated from Google

### 3. GitHub OAuth

- Click "GitHub" on login page
- Must be invited first
- Profile auto-populated from GitHub

## Security Features

✓ Invitation tokens valid for 24 hours only  
✓ One-time use invitations (marked as used after acceptance)  
✓ Passwords hashed with bcrypt (10 rounds)  
✓ JWT-based session management  
✓ Secure HTTP-only cookies for session  
✓ Only invited users can access platform  
✓ Admin verification for sending invitations  
✓ CSRF protection from NextAuth

## Troubleshooting

### "User not invited" Error

- Make sure admin sent you an invitation first
- Check spam folder for invitation email
- Ask admin to resend invitation

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

| Variable                | Purpose                   | Required |
| ----------------------- | ------------------------- | -------- |
| NEXTAUTH_URL            | Application URL           | ✅       |
| NEXTAUTH_SECRET         | NextAuth encryption key   | ✅       |
| MONGODB_URI             | MongoDB connection string | ✅       |
| EMAIL_FROM              | Sender email address      | ✅       |
| EMAIL_PASSWORD          | Email app password        | ✅       |
| EMAIL_HOST              | SMTP host                 | ✅       |
| EMAIL_PORT              | SMTP port                 | ✅       |
| GOOGLE_ID               | Google OAuth Client ID    | ✅       |
| GOOGLE_SECRET           | Google OAuth Secret       | ✅       |
| GITHUB_ID               | GitHub OAuth App ID       | ✅       |
| GITHUB_SECRET           | GitHub OAuth App Secret   | ✅       |
| ADMIN_EMAIL             | Admin email address       | ✅       |
| NEXT_PUBLIC_ADMIN_EMAIL | Public admin email        | ✅       |

## Deployment

### Production Checklist

- [ ] Generate new NEXTAUTH_SECRET
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Update MongoDB connection string
- [ ] Update OAuth redirect URIs
- [ ] Update email configuration for production
- [ ] Enable HTTPS only
- [ ] Set secure cookies in NextAuth config
- [ ] Review security best practices

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Support

For issues or questions:

1. Check troubleshooting section
2. Review error messages in browser console
3. Check server logs: `npm run dev`
4. Verify all environment variables are set

## License

MIT

---

**Happy Authenticating! 🔐**
