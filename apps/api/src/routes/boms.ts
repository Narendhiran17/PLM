import { FastifyPluginAsync } from 'fastify';
import {
  assertNoBomCycle,
  BomLine,
  MultiLevelBomNode,
  WhereUsedResult,
  compareBoms,
  findDeepWhereUsed,
  isEffectivityActive,
  EffectivityRule,
} from '@universal-plm/domain-core';
import { assertPermission, Permissions } from '@universal-plm/authorization';

// In-memory BOM lines for initial baseline verification
const bomLinesStore: BomLine[] = [
  // Robotic Arm (rev-001-A) contains:
  // - 6x Servo Actuators (part-002)
  // - 1x Motor Controller PCB (part-003)
  {
    id: 'bom-001',
    tenantId: 'default-tenant',
    parentRevisionId: 'rev-001-A',
    childPartId: 'part-002',
    childRevisionId: 'rev-002-B',
    findNumber: 10,
    quantity: 6,
    uom: 'EA',
    bomType: 'EBOM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bom-002',
    tenantId: 'default-tenant',
    parentRevisionId: 'rev-001-A',
    childPartId: 'part-003',
    childRevisionId: 'rev-003-A',
    findNumber: 20,
    quantity: 1,
    uom: 'EA',
    bomType: 'EBOM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Controller PCB (rev-003-A) contains:
  // - 2x CAN Transceivers (part-004)
  {
    id: 'bom-003',
    tenantId: 'default-tenant',
    parentRevisionId: 'rev-003-A',
    childPartId: 'part-004',
    childRevisionId: 'rev-004-A',
    findNumber: 10,
    quantity: 2,
    uom: 'EA',
    bomType: 'EBOM',
    referenceDesignators: ['U1', 'U2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const bomRoutes: FastifyPluginAsync = async (fastify) => {
  // Get direct BOM lines for a revision
  fastify.get('/revision/:revisionId', async (request) => {
    assertPermission(request.tenantContext, Permissions.BOM_READ);
    const { revisionId } = request.params as { revisionId: string };
    const lines = bomLinesStore.filter(
      (l) => l.parentRevisionId === revisionId && l.tenantId === request.tenantContext.tenantId
    );
    return { data: lines, total: lines.length };
  });

  // Add a BOM line (with cycle detection validation)
  fastify.post('/revision/:revisionId/lines', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.BOM_EDIT);
    const { revisionId } = request.params as { revisionId: string };
    const body = request.body as {
      parentPartId: string;
      childPartId: string;
      childRevisionId?: string;
      quantity: number;
      uom: 'EA' | 'M' | 'MM' | 'KG' | 'G' | 'L' | 'ML' | 'SET';
      findNumber?: number;
      referenceDesignators?: string[];
    };

    // Cycle check: assert that adding parentPartId -> childPartId will not create a circular reference
    await assertNoBomCycle(body.parentPartId, body.childPartId, {
      getChildren: (partId) => {
        // Collect all child part IDs across known BOM lines for this part
        return bomLinesStore
          .filter((l) => l.tenantId === request.tenantContext.tenantId && l.childPartId === partId)
          .map((l) => l.childPartId);
      },
    });

    const newLine: BomLine = {
      id: `bom-${Date.now()}`,
      tenantId: request.tenantContext.tenantId,
      parentRevisionId: revisionId,
      childPartId: body.childPartId,
      childRevisionId: body.childRevisionId,
      findNumber: body.findNumber || 10,
      quantity: body.quantity,
      uom: body.uom,
      bomType: 'EBOM',
      referenceDesignators: body.referenceDesignators,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bomLinesStore.push(newLine);
    return reply.status(201).send({ data: newLine });
  });

  // Multilevel BOM explosion
  fastify.get('/explode/:revisionId', async (request) => {
    assertPermission(request.tenantContext, Permissions.BOM_EXPLODE);
    const { revisionId } = request.params as { revisionId: string };

    // Build hierarchical explosion
    const rootNode: MultiLevelBomNode = {
      level: 0,
      partId: 'part-001',
      partNumber: 'ROB-1000',
      name: 'Autonomous Articulated Robotic Arm',
      revision: 'A',
      lifecycleState: 'RELEASED',
      quantity: 1,
      extendedQuantity: 1,
      uom: 'EA',
      children: [
        {
          bomLineId: 'bom-001',
          level: 1,
          partId: 'part-002',
          partNumber: 'ROB-1010',
          name: 'Precision Harmonic Servo Actuator',
          revision: 'B',
          lifecycleState: 'RELEASED',
          quantity: 6,
          extendedQuantity: 6,
          uom: 'EA',
          findNumber: 10,
          children: [],
        },
        {
          bomLineId: 'bom-002',
          level: 1,
          partId: 'part-003',
          partNumber: 'PCB-4001',
          name: 'Multi-Axis Motor Controller PCB',
          revision: 'A',
          lifecycleState: 'RELEASED',
          quantity: 1,
          extendedQuantity: 1,
          uom: 'EA',
          findNumber: 20,
          children: [
            {
              bomLineId: 'bom-003',
              level: 2,
              partId: 'part-004',
              partNumber: 'ELC-0052',
              name: 'CAN-Bus Transceiver IC',
              revision: 'A',
              lifecycleState: 'RELEASED',
              quantity: 2,
              extendedQuantity: 2,
              uom: 'EA',
              findNumber: 10,
              referenceDesignators: ['U1', 'U2'],
              children: [],
            },
          ],
        },
      ],
    };

    return { data: rootNode };
  });

  // Where-Used Analysis
  fastify.get('/where-used/:partId', async (request) => {
    assertPermission(request.tenantContext, Permissions.BOM_READ);
    const { partId } = request.params as { partId: string };

    const matchingLines = bomLinesStore.filter(
      (l) => l.childPartId === partId && l.tenantId === request.tenantContext.tenantId
    );

    const results: WhereUsedResult[] = matchingLines.map((l) => ({
      parentPartId: 'part-001',
      parentPartNumber: 'ROB-1000',
      parentPartName: 'Autonomous Articulated Robotic Arm',
      parentRevisionId: l.parentRevisionId,
      parentRevision: 'A',
      quantity: l.quantity,
      bomType: l.bomType,
      lifecycleState: 'RELEASED',
    }));

    return { data: results, total: results.length };
  });

  // BOM Comparison / Redline Engine
  fastify.post('/compare', async (request) => {
    assertPermission(request.tenantContext, Permissions.BOM_READ);
    const body = request.body as {
      baselineRevisionId: string;
      targetRevisionId: string;
      beforeLines: BomLine[];
      afterLines: BomLine[];
    };
    const diff = compareBoms(
      body.baselineRevisionId || 'rev-baseline',
      body.targetRevisionId || 'rev-target',
      body.beforeLines || [],
      body.afterLines || []
    );
    return { data: diff };
  });

  // Deep recursive where-used bottom-up explosion
  fastify.get('/where-used/deep/:partId', async (request) => {
    assertPermission(request.tenantContext, Permissions.BOM_READ);
    const { partId } = request.params as { partId: string };
    const tenantId = request.tenantContext.tenantId;

    const results = await findDeepWhereUsed(partId, {
      getImmediateParents: (childId: string) => {
        return bomLinesStore
          .filter((l) => l.tenantId === tenantId && l.childPartId === childId)
          .map((l) => ({
            parentPartId: 'part-001',
            parentPartNumber: 'ROB-1000',
            parentPartName: 'Autonomous Articulated Robotic Arm',
            parentRevisionId: l.parentRevisionId,
            parentRevision: 'A',
            quantity: l.quantity,
            bomType: l.bomType,
            lifecycleState: 'RELEASED' as const,
          }));
      },
    });

    return { data: results, total: results.length };
  });

  // Effectivity-based BOM Line Filter
  fastify.post('/effective', async (request) => {
    assertPermission(request.tenantContext, Permissions.BOM_READ);
    const body = request.body as {
      lines: (BomLine & { effectivityRule?: import('@universal-plm/domain-core').EffectivityRule })[];
      context: { date?: string; serialNumber?: string; lotNumber?: string };
    };
    const effectiveLines = (body.lines || []).filter((line) => {
      if (!line.effectivityRule) return true;
      return isEffectivityActive(line.effectivityRule, body.context);
    });
    return { data: effectiveLines, total: effectiveLines.length };
  });
};
