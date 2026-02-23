import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// User Model
export const User = {
  async create(userData) {
    const { db } = await connectToDatabase();
    
    const user = {
      email: userData.email,
      username: userData.username,
      password: userData.password ? await bcrypt.hash(userData.password, 10) : null,
      name: userData.name || '',
      image: userData.image || null,
      role: userData.role || 'user',
      isActive: true,
      isInvitationAccepted: false,
      lastLogin: null,
      googleId: null,
      githubId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(user);
    return { ...user, _id: result.insertedId };
  },

  async findByEmail(email) {
    const { db } = await connectToDatabase();
    return await db.collection('users').findOne({ email });
  },

  async findByUsername(username) {
    const { db } = await connectToDatabase();
    return await db.collection('users').findOne({ username });
  },

  async findById(id) {
    const { db } = await connectToDatabase();
    return await db.collection('users').findOne({ _id: new ObjectId(id) });
  },

  async updatePassword(userId, newPassword) {
    const { db } = await connectToDatabase();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  },

  async updateLastLogin(userId) {
    const { db } = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLogin: new Date() } }
    );
  },

  async acceptInvitation(userId) {
    const { db } = await connectToDatabase();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isInvitationAccepted: true,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  },

  async addOAuthProvider(userId, provider, providerId) {
    const { db } = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          [`${provider}Id`]: providerId,
          updatedAt: new Date(),
        },
      }
    );
  },

  async deactivate(userId) {
    const { db } = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );
  },
};

// Invitation Model
export const Invitation = {
  async create(invitationData) {
    const { db } = await connectToDatabase();
    
    const invitation = {
      email: invitationData.email,
      userId: invitationData.userId ? new ObjectId(invitationData.userId) : null,
      token: invitationData.token,
      tenants: invitationData.tenants || [],
      expiresAt: invitationData.expiresAt,
      acceptedAt: null,
      isUsed: false,
      revokedAt: null,
      revokedReason: null,
      createdBy: new ObjectId(invitationData.createdBy),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('invitations').insertOne(invitation);
    return { ...invitation, _id: result.insertedId };
  },

  async findByToken(token) {
    const { db } = await connectToDatabase();
    return await db.collection('invitations').findOne({ token });
  },

  async findByEmail(email) {
    const { db } = await connectToDatabase();
    return await db.collection('invitations').find({ email }).toArray();
  },

  async findById(id) {
    const { db } = await connectToDatabase();
    return await db.collection('invitations').findOne({ _id: new ObjectId(id) });
  },

  async accept(invitationId, userId) {
    const { db } = await connectToDatabase();
    
    const result = await db.collection('invitations').updateOne(
      { _id: new ObjectId(invitationId) },
      {
        $set: {
          userId: new ObjectId(userId),
          acceptedAt: new Date(),
          isUsed: true,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  },

  async revoke(invitationId, reason = null) {
    const { db } = await connectToDatabase();
    
    const result = await db.collection('invitations').updateOne(
      { _id: new ObjectId(invitationId) },
      {
        $set: {
          revokedAt: new Date(),
          revokedReason: reason,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  },

  async extendExpiry(invitationId, newExpiryDate) {
    const { db } = await connectToDatabase();
    
    const result = await db.collection('invitations').updateOne(
      { _id: new ObjectId(invitationId) },
      {
        $set: {
          expiresAt: newExpiryDate,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  },

  async getAllForUser(userId) {
    const { db } = await connectToDatabase();
    return await db.collection('invitations')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  },

  async getAll(filters = {}, skip = 0, limit = 20) {
    const { db } = await connectToDatabase();
    
    const query = {};
    if (filters.email) query.email = new RegExp(filters.email, 'i');
    if (filters.tenantId) query.tenants = filters.tenantId;
    if (filters.isUsed !== undefined) query.isUsed = filters.isUsed;
    if (filters.isRevoked) {
      query.revokedAt = { $exists: true };
    } else {
      query.revokedAt = { $exists: false };
    }

    const invitations = await db.collection('invitations')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('invitations').countDocuments(query);

    return { invitations, total };
  },
};

// Tenant Model
export const Tenant = {
  async create(tenantData, adminId) {
    const { db } = await connectToDatabase();
    
    const tenant = {
      name: tenantData.name,
      slug: tenantData.slug,
      domain: tenantData.domain || null,
      description: tenantData.description || null,
      isActive: true,
      createdBy: new ObjectId(adminId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('tenants').insertOne(tenant);
    return { ...tenant, _id: result.insertedId };
  },

  async findById(id) {
    const { db } = await connectToDatabase();
    return await db.collection('tenants').findOne({ _id: new ObjectId(id) });
  },

  async findBySlug(slug) {
    const { db } = await connectToDatabase();
    return await db.collection('tenants').findOne({ slug, isActive: true });
  },

  async getAll(includeInactive = false) {
    const { db } = await connectToDatabase();
    const query = includeInactive ? {} : { isActive: true };
    return await db.collection('tenants').find(query).sort({ name: 1 }).toArray();
  },

  async update(tenantId, updateData) {
    const { db } = await connectToDatabase();
    
    const result = await db.collection('tenants').updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  },

  async deactivate(tenantId) {
    const { db } = await connectToDatabase();
    
    const result = await db.collection('tenants').updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  },
};

// AccessLog Model
export const AccessLog = {
  async create(logData) {
    const { db } = await connectToDatabase();
    
    const log = {
      userId: logData.userId ? new ObjectId(logData.userId) : null,
      tenantId: logData.tenantId,
      action: logData.action,
      status: logData.status || 'pending',
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
      errorMessage: logData.errorMessage || null,
      timestamp: new Date(),
    };

    const result = await db.collection('accessLogs').insertOne(log);
    return { ...log, _id: result.insertedId };
  },

  async getByUserId(userId, limit = 50, skip = 0) {
    const { db } = await connectToDatabase();
    
    const logs = await db.collection('accessLogs')
      .find({ userId: new ObjectId(userId) })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('accessLogs')
      .countDocuments({ userId: new ObjectId(userId) });

    return { logs, total };
  },

  async getByTenantId(tenantId, limit = 50, skip = 0) {
    const { db } = await connectToDatabase();
    
    const logs = await db.collection('accessLogs')
      .find({ tenantId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('accessLogs')
      .countDocuments({ tenantId });

    return { logs, total };
  },

  async getAll(filters = {}, limit = 100, skip = 0) {
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
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('accessLogs').countDocuments(query);

    return { logs, total };
  },
};
