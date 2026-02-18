# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Run Setup Script

```bash
bash setup.sh
```

This will:

- ✓ Check Node.js installation
- ✓ Install all dependencies
- ✓ Create .env.local template

### 2. Configure Environment Variables

Edit `.env.local` and add your credentials:

#### 2a. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy output to `NEXTAUTH_SECRET`

#### 2b. MongoDB Setup

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Paste into `MONGODB_URI`

#### 2c. Gmail Setup

1. Enable 2FA on Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Generate app password
4. Paste into `EMAIL_FROM` and `EMAIL_PASSWORD`

#### 2d. Google OAuth

1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect: `http://localhost:3000/api/auth/callback/google`
6. Copy ID & Secret

#### 2e. GitHub OAuth

1. Go to https://github.com/settings/developers
2. New OAuth App
3. Set redirect to: `http://localhost:3000/api/auth/callback/github`
4. Copy ID & Secret

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 🔄 User Flow Example

### Admin Perspective

1. Go to `/dashboard` (as admin)
2. Click "Send Invitation"
3. Enter user email: `user@example.com`
4. User receives email with link

### User Perspective

1. Click link in email
2. Click "Accept Invitation"
3. Get auto-generated credentials:
   - Email: `user@example.com`
   - Username: `user_abc123`
   - Password: `generated-secure-password`
4. Credentials auto-save to browser
5. Go to `/auth/signin`
6. Login with credentials or Google/GitHub

---

## 📁 Project Structure at a Glance

```
app/
├── page.js                 # Landing page (public)
├── layout.js              # Root with AuthProvider
├── providers.js           # NextAuth session wrapper
├── auth/
│   ├── signin/page.js                    # Login page
│   ├── accept-invitation/page.js         # Accept invite
│   └── error/page.js                     # Error page
├── dashboard/page.js      # Protected dashboard
├── admin/
│   └── send-invitation/page.js           # Admin panel
└── api/
    ├── auth/[...nextauth]/route.js       # NextAuth config
    ├── send-invitation/route.js          # Send invite API
    └── accept-invitation/route.js        # Accept invite API

lib/
├── mongodb.js             # DB connection
└── email.js              # Email service
```

---

## 🧪 Testing the System

### Test as Admin

1. Create admin user manually in MongoDB:

```javascript
db.users.insertOne({
  email: "admin@yourapp.com",
  name: "Admin User",
  isInvitationAccepted: true,
  createdAt: new Date(),
});
```

2. Go to `/auth/signin` and sign up with Google using admin email
3. Access dashboard → Send Invitation

### Test as Regular User

1. Admin sends invitation to `testuser@example.com`
2. Open email link
3. Accept invitation
4. Login with generated credentials
5. Should see dashboard

---

## 🔒 Security Checklist

✅ Passwords hashed with bcrypt
✅ Invitation tokens expire in 24 hours
✅ One-time use invitations only
✅ JWT session management
✅ OAuth 2.0 integration
✅ Only invited users can access
✅ Admin verification required
✅ CSRF protection enabled

---

## ⚙️ Environment Variables Needed

| Variable                  | Example                                          |
| ------------------------- | ------------------------------------------------ |
| `NEXTAUTH_URL`            | `http://localhost:3000`                          |
| `NEXTAUTH_SECRET`         | `base64-random-string`                           |
| `MONGODB_URI`             | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `EMAIL_FROM`              | `your@gmail.com`                                 |
| `EMAIL_PASSWORD`          | `16-char-app-password`                           |
| `EMAIL_HOST`              | `smtp.gmail.com`                                 |
| `EMAIL_PORT`              | `587`                                            |
| `GOOGLE_ID`               | `client-id-from-google`                          |
| `GOOGLE_SECRET`           | `client-secret-from-google`                      |
| `GITHUB_ID`               | `app-id-from-github`                             |
| `GITHUB_SECRET`           | `app-secret-from-github`                         |
| `ADMIN_EMAIL`             | `admin@yourapp.com`                              |
| `NEXT_PUBLIC_ADMIN_EMAIL` | `admin@yourapp.com`                              |

---

## 🐛 Common Issues

### "User not invited" Error

→ Admin must send invitation first

### Email not sending

→ Check Gmail app password is correct

### OAuth redirect error

→ Verify redirect URIs match exactly in provider settings

### MongoDB connection error

→ Check connection string and IP whitelist

---

## 📞 Need Help?

1. Check error message in browser console
2. Review `.env.local` settings
3. Check server logs from `npm run dev`
4. See full README.md for detailed instructions

---

**Good luck! 🚀**
