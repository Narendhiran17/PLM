import Fastify from 'fastify';
import cors from '@fastify/cors';
import { tenantPlugin } from './plugins/tenant-plugin.js';
import { healthRoutes } from './routes/health.js';
import { partRoutes } from './routes/parts.js';
import { bomRoutes } from './routes/boms.js';
import { changeRoutes } from './routes/changes.js';
import { variantRoutes } from './routes/variants.js';
import { documentRoutes } from './routes/documents.js';
import { configurationRoutes } from './routes/configurations.js';
import { manufacturingRoutes } from './routes/manufacturing.js';
import { industryCapabilityRoutes } from './routes/industry-capabilities.js';

export async function buildServer() {
  const server = Fastify({
    logger: true,
  });

  // Enable CORS for Catalyst Slate and local development frontends
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-user-id', 'x-user-roles'],
  });

  // Multi-tenant resolution middleware
  await server.register(tenantPlugin);

  // Health and System telemetry
  await server.register(healthRoutes);

  // Core PLM Domain Endpoints
  await server.register(partRoutes, { prefix: '/api/v1/parts' });
  await server.register(bomRoutes, { prefix: '/api/v1/boms' });
  await server.register(changeRoutes, { prefix: '/api/v1/changes' });
  await server.register(variantRoutes, { prefix: '/api/v1/variants' });
  await server.register(documentRoutes, { prefix: '/api/v1/documents' });
  await server.register(configurationRoutes, { prefix: '/api/v1/configurations' });
  await server.register(manufacturingRoutes, { prefix: '/api/v1/manufacturing' });
  await server.register(industryCapabilityRoutes, { prefix: '/api/v1/industry-capabilities' });

  return server;
}

// Start server listening on the AppSail assigned port
async function start() {
  const server = await buildServer();
  const port = Number(process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3001);
  const host = '0.0.0.0';

  try {
    await server.listen({ port, host });
    server.log.info(`🚀 Universal PLM Engine running on Catalyst AppSail at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Execute start if invoked directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  start();
}
