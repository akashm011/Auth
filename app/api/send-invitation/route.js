import { connectToDatabase } from '@/lib/mongodb';
import { sendInvitationEmail } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import crypto from 'crypto';

export async function POST(req) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.email === process.env.ADMIN_EMAIL) {
      return Response.json(
        { error: 'Unauthorized. Only admin can send invitations.' },
        { status: 403 }
      );
    }

    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return Response.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return Response.json(
        { error: 'User already invited or registered' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create invitation record
    await db.collection('invitations').insertOne({
      email,
      token: invitationToken,
      createdAt: new Date(),
      expiresAt,
      isUsed: false,
    });

    // Create user record with invitation pending
    await db.collection('users').insertOne({
      email,
      name: null,
      image: null,
      password: null,
      isInvitationAccepted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send invitation email
    await sendInvitationEmail(email, invitationToken);

    return Response.json(
      { message: 'Invitation sent successfully', email },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return Response.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
