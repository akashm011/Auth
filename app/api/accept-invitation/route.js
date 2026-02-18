import { connectToDatabase } from '@/lib/mongodb';
import { sendCredentialsEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find and validate invitation
    const invitation = await db.collection('invitations').findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return Response.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.collection('users').findOne({ email: invitation.email });
    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate random username and password (one-time only)
    const username = `user_${crypto.randomBytes(4).toString('hex')}`;
    const rawPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Update user
    await db.collection('users').updateOne(
      { email: invitation.email },
      {
        $set: {
          username,
          password: hashedPassword,
          isInvitationAccepted: true,
          acceptedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Mark invitation as used
    await db.collection('invitations').updateOne(
      { token },
      {
        $set: {
          isUsed: true,
          usedAt: new Date(),
        },
      }
    );

    // Send credentials email
    await sendCredentialsEmail(invitation.email, username, rawPassword);

    return Response.json(
      {
        message: 'Invitation accepted successfully',
        email: invitation.email,
        username,
        password: rawPassword, // Return in response too for immediate use
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return Response.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
