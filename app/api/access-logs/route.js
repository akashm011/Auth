import { AccessLog } from '@/lib/models';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {};
    if (searchParams.get('userId')) filters.userId = searchParams.get('userId');
    if (searchParams.get('tenantId')) filters.tenantId = searchParams.get('tenantId');
    if (searchParams.get('action')) filters.action = searchParams.get('action');
    if (searchParams.get('status')) filters.status = searchParams.get('status');
    if (searchParams.get('startDate')) filters.startDate = searchParams.get('startDate');
    if (searchParams.get('endDate')) filters.endDate = searchParams.get('endDate');

    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const skip = parseInt(searchParams.get('skip') || '0');

    const { logs, total } = await AccessLog.getAll(filters, limit, skip);

    return Response.json({
      logs,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get access logs error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
