import type { FastifyPluginAsync } from 'fastify';
import {
  transformEbomToMbom,
  reconcileEbomMbom,
  calculateRoutingCost,
  selectOptimalSupplier,
  calculateCostRollup,
  calculateCumulativeLeadTime,
  createErpSyncEvent,
} from '@universal-plm/manufacturing';
import type {
  MbomLine,
  WorkCenter,
  ManufacturingRouting,
  AmlEntry,
  AvlEntry,
  ManufacturerPart,
  OptimalSourcingDecision,
  ErpSyncOutboxEvent,
} from '@universal-plm/manufacturing';
import type { BomLine } from '@universal-plm/domain-core';

// Manufacturing tenant stores initialized empty for clean-slate testing
const workCentersStore: WorkCenter[] = [];
const routingsStore: ManufacturingRouting[] = [];
const mpnStore = new Map<string, ManufacturerPart>();
const amlStore: AmlEntry[] = [];
const avlStore: AvlEntry[] = [];
let mbomStore: MbomLine[] = [];
const outboxEventsStore: ErpSyncOutboxEvent[] = [];

export const manufacturingRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Get MBOM lines
  fastify.get('/mbom', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const query = request.query as { plantId?: string; parentPartId?: string };
    const lines = mbomStore.filter(
      (m) =>
        m.tenantId === tenantId &&
        (!query.plantId || m.plantId === query.plantId) &&
        (!query.parentPartId || m.parentPartId === query.parentPartId)
    );
    return reply.send({ success: true, count: lines.length, mbomLines: lines });
  });

  // 2. Transform EBOM to MBOM
  fastify.post('/mbom/transform', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as {
      plantId: string;
      parentPartId: string;
      ebomLines: BomLine[];
      consumables?: any[];
    };

    const newMbom = transformEbomToMbom(body.ebomLines || [], {
      tenantId,
      plantId: body.plantId || 'PLANT-DETROIT',
      parentPartId: body.parentPartId,
      consumables: body.consumables,
    });

    // Replace in store for this parent + plant
    mbomStore = [
      ...mbomStore.filter(
        (m) => !(m.tenantId === tenantId && m.plantId === body.plantId && m.parentPartId === body.parentPartId)
      ),
      ...newMbom,
    ];

    return reply.status(201).send({ success: true, count: newMbom.length, mbomLines: newMbom });
  });

  // 3. Reconcile EBOM against MBOM
  fastify.post('/mbom/reconcile', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as {
      plantId: string;
      parentPartId: string;
      ebomLines: BomLine[];
    };

    const plantMbom = mbomStore.filter(
      (m) => m.tenantId === tenantId && m.plantId === body.plantId && m.parentPartId === body.parentPartId
    );

    const report = reconcileEbomMbom(body.ebomLines || [], plantMbom, body.plantId, body.parentPartId);
    return reply.send({ success: true, report });
  });

  // 4. Work Centers & Routings
  fastify.get('/work-centers', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const centers = workCentersStore.filter((wc) => wc.tenantId === tenantId);
    return reply.send({ success: true, count: centers.length, workCenters: centers });
  });

  fastify.get('/routings', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const routings = routingsStore.filter((r) => r.tenantId === tenantId);
    return reply.send({ success: true, count: routings.length, routings });
  });

  fastify.post('/routings/cost', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as { routingId: string; batchSize?: number };

    const routing = routingsStore.find((r) => r.tenantId === tenantId && r.id === body.routingId);
    if (!routing) {
      return reply.status(404).send({ success: false, error: 'Routing not found.' });
    }

    const workCenters = workCentersStore.filter((wc) => wc.tenantId === tenantId);
    const cost = calculateRoutingCost(routing, workCenters, body.batchSize || 100);
    return reply.send({ success: true, cost });
  });

  // 5. AML & AVL Sourcing
  fastify.get('/sourcing/aml', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const aml = amlStore.filter((a) => a.tenantId === tenantId);
    return reply.send({ success: true, count: aml.length, aml });
  });

  fastify.get('/sourcing/avl', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const avl = avlStore.filter((a) => a.tenantId === tenantId);
    return reply.send({ success: true, count: avl.length, avl });
  });

  // 6. Multi-Level Cost Rollup (C09)
  fastify.post('/cost-rollup', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as {
      parentPartId: string;
      plantId: string;
      targetCost?: number;
      batchSize?: number;
    };

    const plantMbom = mbomStore.filter(
      (m) => m.tenantId === tenantId && m.plantId === body.plantId && m.parentPartId === body.parentPartId
    );

    const routing = routingsStore.find(
      (r) => r.tenantId === tenantId && r.partId === body.parentPartId && r.plantId === body.plantId
    );
    const workCenters = workCentersStore.filter((wc) => wc.tenantId === tenantId);

    // Build sourcing decisions map
    const sourcingDecisions = new Map<string, OptimalSourcingDecision>();
    for (const line of plantMbom) {
      const opt = selectOptimalSupplier(line.componentPartId, amlStore, avlStore, mpnStore);
      if (opt) {
        sourcingDecisions.set(line.componentPartId, opt);
      } else {
        // Fallback default estimation for unlinked parts
        sourcingDecisions.set(line.componentPartId, {
          internalPartId: line.componentPartId,
          selectedSupplierId: 'SUP-LOCAL',
          selectedMpn: `${line.componentPartId}-STD`,
          unitPrice: line.isManufacturingOnly ? 25.0 : 150.0,
          leadTimeDays: 14,
          moq: 1,
          preference: 'PRIMARY',
          qualificationStatus: 'QUALIFIED',
        });
      }
    }

    const rollup = calculateCostRollup({
      parentPartId: body.parentPartId,
      plantId: body.plantId,
      mbomLines: plantMbom,
      routing,
      workCenters,
      sourcingDecisions,
      targetCost: body.targetCost || 6500.0,
      batchSize: body.batchSize || 100,
    });

    return reply.send({ success: true, rollup });
  });

  // 7. Cumulative Lead Time Analysis (C10)
  fastify.post('/lead-time', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as { parentPartId: string; plantId: string };

    const plantMbom = mbomStore.filter(
      (m) => m.tenantId === tenantId && m.plantId === body.plantId && m.parentPartId === body.parentPartId
    );
    const routing = routingsStore.find(
      (r) => r.tenantId === tenantId && r.partId === body.parentPartId && r.plantId === body.plantId
    );

    const sourcingDecisions = new Map<string, OptimalSourcingDecision>();
    for (const line of plantMbom) {
      const opt = selectOptimalSupplier(line.componentPartId, amlStore, avlStore, mpnStore);
      if (opt) {
        sourcingDecisions.set(line.componentPartId, opt);
      } else {
        sourcingDecisions.set(line.componentPartId, {
          internalPartId: line.componentPartId,
          selectedSupplierId: 'SUP-LOCAL',
          selectedMpn: `${line.componentPartId}-STD`,
          unitPrice: 50.0,
          leadTimeDays: 14,
          moq: 1,
          preference: 'PRIMARY',
          qualificationStatus: 'QUALIFIED',
        });
      }
    }

    const leadTime = calculateCumulativeLeadTime({
      parentPartId: body.parentPartId,
      sourcingDecisions,
      routing,
    });

    return reply.send({ success: true, leadTime });
  });

  // 8. ERP/MRP Sync Outbox (C12)
  fastify.post('/erp-sync', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as {
      plantId: string;
      entityType: 'ITEM_MASTER' | 'MBOM' | 'ROUTING';
      entityId: string;
      targetSystem?: 'SAP' | 'NETSUITE' | 'ODOO_ERP' | 'DYNAMICS_365';
    };

    const outboxEvent = createErpSyncEvent({
      tenantId,
      plantId: body.plantId || 'PLANT-DETROIT',
      entityType: body.entityType || 'MBOM',
      entityId: body.entityId,
      eventType: 'RELEASED',
      targetSystem: body.targetSystem || 'SAP',
      payload: {
        timestamp: new Date().toISOString(),
        syncedBy: 'PLM_MANUFACTURING_INTEGRATION_AGENT',
      },
    });

    // Mark as dispatched for instant simulation feedback
    outboxEvent.status = 'DISPATCHED';
    outboxEventsStore.push(outboxEvent);

    return reply.status(201).send({ success: true, outboxEvent });
  });
};
