import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  analyzeChangeImpact,
  recommendAlternateParts,
  generateAuditComplianceDossier,
  createSyntheticDigitalTwinAssembly,
  computeExplodedAssemblyTransforms,
  evaluateCrossSectionSlicing,
  syncCrmDealToPlmProject,
  ingestCreatorQualityNcrToPlmEcr,
  formatPlmEcoNotificationForCrm,
  AffectedItemInput,
  InventoryItemInput,
  BomHierarchyLine,
  AlternateCandidate,
  Cad3dMeshNode,
  ZohoCrmDealInput,
  ZohoCreatorNcrInput
} from '@universal-plm/autonomous-operations';

export async function autonomousOperationsRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // 1. AI Copilot: ECO Change Impact & Scrap Exposure Analysis
  fastify.post('/copilot/analyze-impact', async (request, reply) => {
    const body = request.body as {
      eco: { id: string; ecoNumber: string; title: string; category?: string };
      affectedItems: AffectedItemInput[];
      inventory?: InventoryItemInput[];
      bomLines?: BomHierarchyLine[];
    };

    if (!body.eco || !body.affectedItems) {
      return reply.status(400).send({ success: false, error: 'eco and affectedItems are required' });
    }

    const inventory = body.inventory || [];
    const bomLines = body.bomLines || [];
    const result = analyzeChangeImpact(body.eco, body.affectedItems, inventory, bomLines);
    return reply.send({ success: true, result });
  });

  // 2. AI Copilot: Recommend Alternate / Substitute Components
  fastify.post('/copilot/recommend-alternates', async (request, reply) => {
    const body = request.body as {
      targetPart: { partNumber: string; unitCost: number; leadTimeDays: number; specifications?: Record<string, any> };
      candidates: AlternateCandidate[];
    };

    if (!body.targetPart || !body.candidates) {
      return reply.status(400).send({ success: false, error: 'targetPart and candidates are required' });
    }

    const result = recommendAlternateParts(body.targetPart, body.candidates);
    return reply.send({ success: true, result });
  });

  // 3. AI Copilot: Generate 21 CFR Part 11 / ISO 9001 Regulatory Audit Dossier
  fastify.post('/copilot/generate-audit-dossier', async (request, reply) => {
    const body = request.body as {
      eco: { ecoNumber: string; title: string; category?: string; snapshotHash?: string };
      signatures: Array<{ signerName: string; signerRole: string; signedAt: string; quorumResult: string }>;
      affectedItems: AffectedItemInput[];
    };

    if (!body.eco || !body.signatures || !body.affectedItems) {
      return reply.status(400).send({ success: false, error: 'eco, signatures, and affectedItems are required' });
    }

    const dossier = generateAuditComplianceDossier(body.eco, body.signatures, body.affectedItems);
    return reply.send({ success: true, dossier });
  });

  // 4. 3D CAD Digital Twin: Mesh Structure Generator
  fastify.post('/cad-viewer/mesh-data', async (request, reply) => {
    const body = request.body as { rootPartNumber?: string; rootName?: string };
    const rootPartNumber = body.rootPartNumber || 'ASM-1000-TURBINE';
    const rootName = body.rootName || 'Industrial High-Torque Power Inverter Assembly';

    const assembly = createSyntheticDigitalTwinAssembly(rootPartNumber, rootName);
    return reply.send({ success: true, assembly });
  });

  // 5. 3D CAD Digital Twin: Compute Exploded Assembly Transforms
  fastify.post('/cad-viewer/explode-transforms', async (request, reply) => {
    const body = request.body as {
      meshes: Cad3dMeshNode[];
      explodeFactor: number;
      maxDisplacement?: number;
    };

    if (!body.meshes || body.explodeFactor === undefined) {
      return reply.status(400).send({ success: false, error: 'meshes and explodeFactor are required' });
    }

    const transformedMeshes = computeExplodedAssemblyTransforms(
      body.meshes,
      body.explodeFactor,
      body.maxDisplacement
    );
    return reply.send({ success: true, transformedMeshes });
  });

  // 6. 3D CAD Digital Twin: Cross-Section Slicing Plane Evaluator
  fastify.post('/cad-viewer/cross-section', async (request, reply) => {
    const body = request.body as {
      meshes: Cad3dMeshNode[];
      axis: 'x' | 'y' | 'z';
      slicePosition: number;
    };

    if (!body.meshes || !body.axis || body.slicePosition === undefined) {
      return reply.status(400).send({ success: false, error: 'meshes, axis, and slicePosition are required' });
    }

    const slices = evaluateCrossSectionSlicing(body.meshes, body.axis, body.slicePosition);
    return reply.send({ success: true, slices });
  });

  // 7. Zoho Connector: Map CRM Deal to PLM Project
  fastify.post('/zoho/sync-crm-deal', async (request, reply) => {
    const body = request.body as { deal: ZohoCrmDealInput; tenantId?: string };
    if (!body.deal) {
      return reply.status(400).send({ success: false, error: 'deal payload is required' });
    }

    const tenantId = body.tenantId || 'tenant_default';
    const project = syncCrmDealToPlmProject(body.deal, tenantId);
    return reply.send({ success: true, project });
  });

  // 8. Zoho Connector: Ingest Creator Quality Inspection NCR to PLM ECR
  fastify.post('/zoho/ingest-creator-ncr', async (request, reply) => {
    const body = request.body as { ncr: ZohoCreatorNcrInput; tenantId?: string };
    if (!body.ncr) {
      return reply.status(400).send({ success: false, error: 'ncr payload is required' });
    }

    const tenantId = body.tenantId || 'tenant_default';
    const ecr = ingestCreatorQualityNcrToPlmEcr(body.ncr, tenantId);
    return reply.send({ success: true, ecr });
  });

  // 9. Zoho Connector: Dispatch PLM ECO Notification to CRM
  fastify.post('/zoho/notify-crm-release', async (request, reply) => {
    const body = request.body as {
      eco: { ecoNumber: string; title: string; releaseDate: string };
      crmDealId: string;
      accountName: string;
    };

    if (!body.eco || !body.crmDealId || !body.accountName) {
      return reply.status(400).send({ success: false, error: 'eco, crmDealId, and accountName are required' });
    }

    const notification = formatPlmEcoNotificationForCrm(body.eco, body.crmDealId, body.accountName);
    return reply.send({ success: true, notification });
  });
}
