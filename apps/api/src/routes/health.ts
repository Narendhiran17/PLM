import { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'UP',
      service: 'universal-plm-api',
      runtime: 'Catalyst AppSail',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      modules: {
        universalCore: 'ACTIVE',
        changeManagement: 'ACTIVE',
        documentVault: 'ACTIVE',
        capabilityRegistry: 'ACTIVE',
      },
    };
  });
};
