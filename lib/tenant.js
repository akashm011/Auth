import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export async function getTenantById(tenantId) {
  try {
    const { db } = await connectToDatabase();
    return await db.collection('tenants').findOne({
      _id: new ObjectId(tenantId),
      isActive: true,
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

export async function getTenantBySlug(slug) {
  try {
    const { db } = await connectToDatabase();
    return await db.collection('tenants').findOne({
      slug,
      isActive: true,
    });
  } catch (error) {
    console.error('Error fetching tenant by slug:', error);
    return null;
  }
}

export async function getAllTenants(includeInactive = false) {
  try {
    const { db } = await connectToDatabase();
    const query = includeInactive ? {} : { isActive: true };
    return await db.collection('tenants').find(query).toArray();
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
}

export async function createTenant(tenantData, adminId) {
  try {
    const { db } = await connectToDatabase();

    const newTenant = {
      ...tenantData,
      createdBy: new ObjectId(adminId),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('tenants').insertOne(newTenant);
    return { ...newTenant, _id: result.insertedId };
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
}

export async function validateUserTenantAccess(userId, tenantId) {
  try {
    const { db } = await connectToDatabase();

    const invitation = await db.collection('invitations').findOne({
      userId: new ObjectId(userId),
      tenants: tenantId,
      isUsed: true,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    return !!invitation;
  } catch (error) {
    console.error('Error validating tenant access:', error);
    return false;
  }
}

export async function getUserAccessibleTenants(userId) {
  try {
    const { db } = await connectToDatabase();

    const invitations = await db.collection('invitations').find({
      userId: new ObjectId(userId),
      isUsed: true,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).toArray();

    const tenantIds = [];
    invitations.forEach(inv => {
      tenantIds.push(...inv.tenants);
    });

    const uniqueTenantIds = [...new Set(tenantIds)];

    const tenants = await db.collection('tenants')
      .find({ slug: { $in: uniqueTenantIds }, isActive: true })
      .toArray();

    return tenants;
  } catch (error) {
    console.error('Error fetching user accessible tenants:', error);
    return [];
  }
}

export async function logAccessAttempt(userId, tenantId, action, status, ipAddress, userAgent, errorMessage = null) {
  try {
    const { db } = await connectToDatabase();

    const log = {
      userId: userId ? new ObjectId(userId) : null,
      tenantId,
      action,
      status,
      ipAddress,
      userAgent,
      errorMessage,
      timestamp: new Date(),
    };

    await db.collection('accessLogs').insertOne(log);
  } catch (error) {
    console.error('Error logging access attempt:', error);
  }
}

export async function getAccessLogs(filters = {}, limit = 100, skip = 0) {
  try {
    const { db } = await connectToDatabase();

    const query = {};
    if (filters.userId) query.userId = new ObjectId(filters.userId);
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.action) query.action = filters.action;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await db.collection('accessLogs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    const total = await db.collection('accessLogs').countDocuments(query);

    return { logs, total };
  } catch (error) {
    console.error('Error fetching access logs:', error);
    return { logs: [], total: 0 };
  }
}
