import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantId: { label: 'TenantId', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ email: credentials.email });

        if (!user) {
          throw new Error('No user found with this email');
        }

        if (!user.password) {
          throw new Error('Please use social login or set a password first');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        if (!user.isInvitationAccepted) {
          throw new Error('You must accept the invitation first');
        }

        // Check multi-tenancy access if tenantId is provided
        if (credentials.tenantId) {
          const tenantAccess = user.accessibleTenants?.find(
            t => t.tenantId === credentials.tenantId && !t.revokedAt && new Date(t.expiresAt) > new Date()
          );

          if (!tenantAccess) {
            throw new Error('You do not have access to this application or your access has expired');
          }
        }

        // Update last login
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date() } }
        );

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          tenantId: credentials.tenantId || null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const { db } = await connectToDatabase();

      // For OAuth providers
      if (account?.provider === 'google' || account?.provider === 'github') {
        const existingUser = await db.collection('users').findOne({ email: user.email });

        if (!existingUser) {
          throw new Error('User not invited. Please check your email for an invitation link.');
        }

        if (!existingUser.isInvitationAccepted) {
          throw new Error('You must accept the invitation first');
        }

        // Update user with OAuth data
        await db.collection('users').updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name,
              image: user.image,
              [`${account.provider}Id`]: account.providerAccountId,
              lastLogin: new Date(),
            },
          }
        );

        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.tenantId = token.tenantId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
