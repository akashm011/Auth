import { connectToDatabase } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function seedTenants() {
  try {
    const { db } = await connectToDatabase();

    // Get admin user
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Run seed:admin first');
    }

    // Default tenants from environment or hardcoded
    const defaultTenants = [
      {
        name: process.env.NEXT_PUBLIC_TENANT_NAME_1 || 'My App',
        slug: process.env.NEXT_PUBLIC_TENANT_ID_1 || 'myapp',
        domain: process.env.NEXT_PUBLIC_TENANT_URL_1 || 'http://localhost:3001',
        description: 'Primary application',
      },
      {
        name: process.env.NEXT_PUBLIC_TENANT_NAME_2 || 'Dashboard',
        slug: process.env.NEXT_PUBLIC_TENANT_ID_2 || 'dashboard',
        domain: process.env.NEXT_PUBLIC_TENANT_URL_2 || 'http://localhost:3002',
        description: 'Analytics and reporting dashboard',
      },
    ];

    let createdCount = 0;

    for (const tenantData of defaultTenants) {
      const existingTenant = await db.collection('tenants').findOne({ slug: tenantData.slug });

      if (!existingTenant) {
        await db.collection('tenants').insertOne({
          ...tenantData,
          isActive: true,
          createdBy: adminUser._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✓ Created tenant: ${tenantData.name} (${tenantData.slug})`);
        createdCount++;
      } else {
        console.log(`- Tenant already exists: ${tenantData.name} (${tenantData.slug})`);
      }
    }

    if (createdCount === 0) {
      console.log('✓ All default tenants already exist');
    } else {
      console.log(`\n✓ Seeded ${createdCount} tenant(s) successfully`);
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding tenants:', error.message);
    process.exit(1);
  }
}

seedTenants();
