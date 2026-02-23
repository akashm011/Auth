import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logAccessAttempt } from '@/lib/tenant';

export async function POST(request) {
  try {
    const { email, password, tenantId } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-client-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!email || !password) {
      await logAccessAttempt(null, tenantId, 'signin', 'failed', ipAddress, userAgent, 'Missing email or password');
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      await logAccessAttempt(null, tenantId, 'signin', 'failed', ipAddress, userAgent, 'User not found');
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    if (!user.password) {
      await logAccessAttempt(user._id.toString(), tenantId, 'signin', 'failed', ipAddress, userAgent, 'User has no password set');
      return Response.json({ error: 'Please use social login' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await logAccessAttempt(user._id.toString(), tenantId, 'signin', 'failed', ipAddress, userAgent, 'Invalid password');
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if invitation accepted
    if (!user.isInvitationAccepted) {
      await logAccessAttempt(user._id.toString(), tenantId, 'signin', 'failed', ipAddress, userAgent, 'Invitation not accepted');
      return Response.json({ error: 'You must accept the invitation first' }, { status: 403 });
    }

    // Check tenant access if tenantId provided
    if (tenantId) {
      const { db } = await connectToDatabase();
      const invitation = await db.collection('invitations').findOne({
        userId: user._id,
        tenants: tenantId,
        isUsed: true,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      });

      if (!invitation) {
        await logAccessAttempt(user._id.toString(), tenantId, 'signin', 'failed', ipAddress, userAgent, 'No access to tenant');
        return Response.json({ error: 'You do not have access to this application or your access has expired' }, { status: 403 });
      }
    }

    // Update last login
    await User.updateLastLogin(user._id.toString());

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        tenantId: tenantId || null,
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '30d' }
    );

    // Get accessible tenants
    const { db } = await connectToDatabase();
    const invitations = await db.collection('invitations').find({
      userId: user._id,
      isUsed: true,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).toArray();

    const accessibleTenants = [...new Set(invitations.flatMap(inv => inv.tenants))];

    await logAccessAttempt(user._id.toString(), tenantId, 'signin', 'success', ipAddress, userAgent);

    return Response.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        image: user.image,
      },
      accessibleTenants,
    }, { status: 200 });
  } catch (error) {
    console.error('Signin error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
