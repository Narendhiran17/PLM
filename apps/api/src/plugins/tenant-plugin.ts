import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { TenantContext } from '@universal-plm/domain-core';

declare module 'fastify' {
  interface FastifyRequest {
    tenantContext: TenantContext;
  }
}

export const tenantPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('tenantContext');

  fastify.addHook('preHandler', async (request: FastifyRequest, reply) => {
    // Skip tenant verification for public health endpoints
    if (request.url === '/health' || request.url === '/') {
      return;
    }

    const tenantId = (request.headers['x-tenant-id'] as string) || 'default-tenant';
    const userId = (request.headers['x-user-id'] as string) || 'anonymous-engineer';
    const rolesHeader = (request.headers['x-user-roles'] as string) || 'LEAD_ENGINEER';

    const roles = rolesHeader.split(',').map((r) => r.trim());

    request.tenantContext = {
      tenantId,
      userId,
      roles,
      permissions: [],
      activeCapabilities: ['DISCRETE_MANUFACTURING', 'ELECTRONICS_PCB'],
    };
  });
};
