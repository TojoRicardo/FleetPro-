import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

async function resolveSanctumToken(bearerToken) {
  if (!bearerToken.includes('|')) {
    return null;
  }

  const [id, token] = bearerToken.split('|', 2);
  const accessToken = await prisma.personalAccessToken.findFirst({
    where: {
      id: Number(id),
      tokenableType: 'App\\Models\\User',
    },
  });

  if (!accessToken) {
    return null;
  }

  const hash = createHash('sha256').update(token).digest('hex');
  if (hash !== accessToken.token) {
    return null;
  }

  if (accessToken.expiresAt && accessToken.expiresAt < new Date()) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: accessToken.tokenableId },
    select: { id: true, tenantId: true, email: true, role: true, status: true },
  });

  if (!user || user.status !== 'active' || !user.tenantId) {
    return null;
  }

  return {
    userId: user.id,
    companyId: user.tenantId,
    email: user.email,
    role: user.role,
    authType: 'sanctum',
  };
}

function resolveJwtToken(bearerToken) {
  try {
    const payload = jwt.verify(bearerToken, env.jwtSecret);
    if (!payload.companyId) {
      return null;
    }
    return {
      userId: payload.userId,
      companyId: payload.companyId,
      email: payload.email,
      role: payload.role,
      authType: 'jwt',
    };
  } catch {
    return null;
  }
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const token = header.slice(7).trim();
    const user =
      resolveJwtToken(token) ?? (await resolveSanctumToken(token));

    if (!user) {
      throw new AppError('Invalid or expired token.', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }
    if (req.user.role === 'super_admin' || roles.includes(req.user.role)) {
      return next();
    }
    return next(new AppError('Insufficient permissions.', 403, 'FORBIDDEN'));
  };
}
