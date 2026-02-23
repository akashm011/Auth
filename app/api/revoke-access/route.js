import { connectToDatabase } from '@/lib/mongodb';
import { Invitation, AccessLog } from '@/lib/models';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { userId, tenants, reason } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-client-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!userId || !tenants || !Array.isArray(tenants)) {
      return Response.json(
        { error: 'userId and tenants array are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find all invitations for this user
    const invitations = await db.collection('invitations').find({
      userId: new ObjectId(userId),
      isUsed: true,
      revokedAt: { $exists: false },
    }).toArray();

    let revokedCount = 0;

    for (const invitation of invitations) {
      // Check if any tenant matches
      const tenantsToRevoke = invitation.tenants.filter(t => tenants.includes(t));

      if (tenantsToRevoke.length > 0) {
        // If all tenants are being revoked, revoke the entire invitation
        if (tenantsToRevoke.length === invitation.tenants.length) {
          await Invitation.revoke(invitation._id.toString(), reason);
        } else {
          // Otherwise, remove specific tenants from the invitation
          const remainingTenants = invitation.tenants.filter(t => !tenantsToRevoke.includes(t));
          await db.collection('invitations').updateOne(
            { _id: invitation._id },
            {
              $set: {
                tenants: remainingTenants,
                updatedAt: new Date(),
              },
            }
          );
        }

        // Log revocation for each tenant
        for (const tenant of tenantsToRevoke) {
          await AccessLog.create({
            userId,
            tenantId: tenant,
            action: 'revoke',
            status: 'success',
            ipAddress,
            userAgent,
          });
        }

        revokedCount += tenantsToRevoke.length;
      }
    }

    return Response.json(
      {
        message: 'Access revoked successfully',
        revokedCount,
        revokedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revoke access error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
