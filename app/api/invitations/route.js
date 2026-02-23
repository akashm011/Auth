import { Invitation, User, AccessLog } from '@/lib/models';
import { generateSecureToken } from '@/lib/encryption';
import { sendInvitationEmail } from '@/lib/email';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {};

    if (searchParams.get('email')) filters.email = searchParams.get('email');
    if (searchParams.get('tenantId')) filters.tenantId = searchParams.get('tenantId');
    if (searchParams.get('isUsed')) filters.isUsed = searchParams.get('isUsed') === 'true';
    if (searchParams.get('isRevoked')) filters.isRevoked = searchParams.get('isRevoked') === 'true';

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    const { invitations, total } = await Invitation.getAll(filters, skip, limit);

    return Response.json({
      invitations,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get invitations error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, tenants, expiryDays = 30, expiryMonths = 0, expiryYears = 0 } = await request.json();

    if (!email || !tenants || !Array.isArray(tenants)) {
      return Response.json(
        { error: 'email and tenants array are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Generate username
      const baseUsername = email.split('@')[0];
      let username = baseUsername;
      let counter = 1;

      while (await User.findByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        email,
        username,
        name: email.split('@')[0],
      });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    expiryDate.setFullYear(expiryDate.getFullYear() + expiryYears);

    // Generate invitation token
    const token = generateSecureToken();

    const invitation = await Invitation.create({
      email,
      userId: user._id.toString(),
      token,
      tenants,
      expiresAt: expiryDate,
      createdBy: session.user.id,
    });

    // Send invitation email
    const acceptanceUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invitation?token=${token}`;
    await sendInvitationEmail({
      email,
      acceptanceUrl,
      tenants,
      expiresAt: expiryDate,
    });

    await AccessLog.create({
      userId: user._id.toString(),
      tenantId: tenants[0],
      action: 'invite',
      status: 'success',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return Response.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        tenants: invitation.tenants,
        expiresAt: invitation.expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Send invitation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
