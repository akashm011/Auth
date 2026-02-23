import { Invitation, AccessLog } from '@/lib/models';

export async function POST(request) {
  try {
    const { invitationId, expiryDays = 0, expiryMonths = 0, expiryYears = 0 } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-client-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!invitationId) {
      return Response.json({ error: 'invitationId is required' }, { status: 400 });
    }

    // Calculate new expiry date
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + expiryDays);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + expiryMonths);
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + expiryYears);

    // Update invitation
    const success = await Invitation.extendExpiry(invitationId, newExpiryDate);

    if (!success) {
      return Response.json({ error: 'Invitation not found or could not be updated' }, { status: 404 });
    }

    // Log the extension
    const invitation = await Invitation.findById(invitationId);
    if (invitation) {
      for (const tenant of invitation.tenants) {
        await AccessLog.create({
          userId: invitation.userId.toString(),
          tenantId: tenant,
          action: 'extend-access',
          status: 'success',
          ipAddress,
          userAgent,
        });
      }
    }

    return Response.json(
      {
        message: 'Access extended successfully',
        expiresAt: newExpiryDate.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Extend access error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
