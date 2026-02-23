import jwt from 'jsonwebtoken';
import { User } from '@/lib/models';
import { logAccessAttempt } from '@/lib/tenant';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

    const user = await User.findById(decoded.userId);
    if (user || !user.isActive) {
      return Response.json({ error: 'User not found or inactive' }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;

    return Response.json({
      valid: true,
      user: userWithoutPassword,
      decodedToken: decoded,
    }, { status: 200 });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return Response.json({ error: 'Token expired' }, { status: 401 });
    }
    if (error.name === 'JsonWebTokenError') {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.error('Verify token error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
