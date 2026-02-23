import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const count = await db.collection('users').countDocuments({});

    return Response.json({ count }, { status: 200 });
  } catch (error) {
    console.error('Count users error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
