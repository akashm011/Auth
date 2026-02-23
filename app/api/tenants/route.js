import { Tenant, AccessLog } from '@/lib/models';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenants = await Tenant.getAll(false);

    return Response.json({ tenants }, { status: 200 });
  } catch (error) {
    console.error('Get tenants error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['admin', 'superadmin'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, slug, domain, description } = await request.json();

    if (!name || !slug) {
      return Response.json({ error: 'name and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existingTenant = await Tenant.findBySlug(slug);
    if (existingTenant) {
      return Response.json({ error: 'Tenant with this slug already exists' }, { status: 409 });
    }

    const tenant = await Tenant.create(
      { name, slug, domain, description },
      session.user.id
    );

    return Response.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error('Create tenant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
