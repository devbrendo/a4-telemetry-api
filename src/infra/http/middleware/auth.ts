import type { FastifyRequest } from 'fastify';
import type { AuthUser } from '../types';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
}

export async function authMiddleware(request: FastifyRequest) {
  const raw = request.headers['x-tenant-id'];
  const tenantId = typeof raw === 'string' ? raw : raw?.[0];

  if (!tenantId) {
    throw Object.assign(new Error('Missing x-tenant-id header'), { statusCode: 401 });
  }

  request.user = { tenantId };
}
