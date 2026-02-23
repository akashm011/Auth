import { connectToDatabase } from '../lib/mongodb.js';
import { User } from '../lib/models.js';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    const { db } = await connectToDatabase();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    }

    // Check if admin already exists
    const existingAdmin = await User.findByEmail(adminEmail);
    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await db.collection('users').insertOne({
      email: adminEmail,
      username: 'admin',
      password: hashedPassword,
      name: 'Admin',
      image: null,
      role: 'admin',
      isActive: true,
      isInvitationAccepted: true,
      lastLogin: null,
      googleId: null,
      githubId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✓ Admin user created successfully');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Role: admin`);
    console.log(`  ID: ${adminUser.insertedId}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating admin user:', error.message);
    process.exit(1);
  }
}

seedAdmin();
