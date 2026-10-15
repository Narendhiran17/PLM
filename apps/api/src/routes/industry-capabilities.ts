import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  CapabilityRegistry,
  registerAllStandardIndustryPacks,
  IndustryPackId,
  createDefaultPpapSubmission,
  evaluatePpapStatus,
  PpapSubmission,
  expandReferenceDesignators,
  validatePcbDesignators,
  scaleFormulationBatch,
  FormulationRecipe,
  validateDhfReadiness,
  DhfPackage,
  resolveConfiguredBom,
  ProductConfiguratorModel
} from '@universal-plm/industry-capabilities';

// Initialize platform packs
registerAllStandardIndustryPacks();

export async function industryCapabilityRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // 1. Get all registered capability manifests
  fastify.get('/packs', async (_request, reply) => {
    const packs = CapabilityRegistry.getAvailablePacks();
    return reply.send({ success: true, count: packs.length, packs });
  });

  // 2. Get tenant subscriptions
  fastify.get('/tenant/:tenantId/subscriptions', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const subscriptions = CapabilityRegistry.getTenantSubscriptions(tenantId);
    return reply.send({ success: true, tenantId, count: subscriptions.length, subscriptions });
  });

  // 3. Install pack for tenant
  fastify.post('/tenant/:tenantId/install', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { packId: IndustryPackId; settings?: Record<string, unknown> };

    try {
      const subscription = CapabilityRegistry.installPack(tenantId, body.packId, body.settings);
      return reply.send({ success: true, subscription });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // 4. Toggle pack enable/disable
  fastify.patch('/tenant/:tenantId/toggle', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { packId: IndustryPackId; enabled: boolean };

    try {
      const subscription = CapabilityRegistry.togglePack(tenantId, body.packId, body.enabled);
      return reply.send({ success: true, subscription });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // 5. Automotive & Discrete: PPAP evaluation (IND-01)
  fastify.post('/automotive/ppap/evaluate', async (request, reply) => {
    const body = request.body as { submission: PpapSubmission };
    if (!body.submission) {
      return reply.status(400).send({ success: false, error: 'submission payload is required' });
    }

    const evaluation = evaluatePpapStatus(body.submission);
    return reply.send({ success: true, evaluation });
  });

  // 6. Electronics & PCB: Reference Designator validation (IND-02)
  fastify.post('/electronics/validate-designators', async (request, reply) => {
    const body = request.body as {
      bomLines: Array<{ lineId: string; componentPartId: string; quantity: number; rawDesignators: string }>;
    };

    if (!body.bomLines) {
      return reply.status(400).send({ success: false, error: 'bomLines array is required' });
    }

    const validation = validatePcbDesignators(body.bomLines);
    return reply.send({ success: true, validation });
  });

  // 7. Process & Chemical: Formulation batch scaling & potency compensation (IND-03)
  fastify.post('/process/scale-batch', async (request, reply) => {
    const body = request.body as { recipe: FormulationRecipe; targetBatchSizeKg: number };
    if (!body.recipe || !body.targetBatchSizeKg) {
      return reply.status(400).send({ success: false, error: 'recipe and targetBatchSizeKg are required' });
    }

    try {
      const result = scaleFormulationBatch(body.recipe, body.targetBatchSizeKg);
      return reply.send({ success: true, result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // 8. Regulated Medical Device: DHF Readiness & Traceability (IND-04)
  fastify.post('/medical/validate-dhf', async (request, reply) => {
    const body = request.body as { dhf: DhfPackage };
    if (!body.dhf) {
      return reply.status(400).send({ success: false, error: 'dhf payload is required' });
    }

    const result = validateDhfReadiness(body.dhf);
    return reply.send({ success: true, result });
  });

  // 9. Configured Products: Modular BOM solver & constraint evaluation (IND-05)
  fastify.post('/configured/solve', async (request, reply) => {
    const body = request.body as { model: ProductConfiguratorModel; selectedOptionCodes: string[] };
    if (!body.model || !body.selectedOptionCodes) {
      return reply.status(400).send({ success: false, error: 'model and selectedOptionCodes are required' });
    }

    const result = resolveConfiguredBom(body.model, body.selectedOptionCodes);
    return reply.send({ success: true, result });
  });
}
