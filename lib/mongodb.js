import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('authentication-system');

  // Create indexes for better query performance
  await createIndexes(db);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

async function createIndexes(db) {
  try {
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { sparse: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    await db.collection('users').createIndex({ createdAt: 1 });

    // Invitations indexes
    await db.collection('invitations').createIndex({ token: 1 }, { unique: true });
    await db.collection('invitations').createIndex({ email: 1 });
    await db.collection('invitations').createIndex({ userId: 1 });
    await db.collection('invitations').createIndex({ tenants: 1 });
    await db.collection('invitations').createIndex({ expiresAt: 1 });
    await db.collection('invitations').createIndex({ isUsed: 1 });
    await db.collection('invitations').createIndex({ revokedAt: 1 });
    await db.collection('invitations').createIndex({ createdAt: 1 });

    // Tenants indexes
    await db.collection('tenants').createIndex({ slug: 1 }, { unique: true });
    await db.collection('tenants').createIndex({ domain: 1 }, { sparse: true });
    await db.collection('tenants').createIndex({ isActive: 1 });
    await db.collection('tenants').createIndex({ createdAt: 1 });

    // Access logs indexes
    await db.collection('accessLogs').createIndex({ userId: 1 });
    await db.collection('accessLogs').createIndex({ tenantId: 1 });
    await db.collection('accessLogs').createIndex({ action: 1 });
    await db.collection('accessLogs').createIndex({ status: 1 });
    await db.collection('accessLogs').createIndex({ timestamp: 1 });
    await db.collection('accessLogs').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('accessLogs').createIndex({ tenantId: 1, timestamp: -1 });

  } catch (error) {
    console.warn('Index creation warning:', error.message);
    // Don't throw - indexes might already exist
  }
}
