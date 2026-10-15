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

// In-memory tenant manufacturing store
const workCentersStore: WorkCenter[] = [
  {
    id: 'wc-cnc-01',
    tenantId: 'tenant_default',
    plantId: 'PLANT-DETROIT',
    code: 'WC-CNC-01',
    name: '5-Axis Precision CNC Machining Cell',
    department: 'MACHINING',
    hourlyRate: 125.0,
    capacityHoursPerDay: 16.0,
    efficiencyFactor: 0.9,
    isActive: true,
  },
  {
    id: 'wc-assy-01',
    tenantId: 'tenant_default',
    plantId: 'PLANT-DETROIT',
    code: 'WC-ASSY-01',
    name: 'Robotic Arm Electro-Mechanical Assembly Cell',
    department: 'ASSEMBLY',
    hourlyRate: 75.0,
    capacityHoursPerDay: 16.0,
    efficiencyFactor: 0.95,
    isActive: true,
  },
  {
    id: 'wc-insp-01',
    tenantId: 'tenant_default',
    plantId: 'PLANT-DETROIT',
    code: 'WC-INSP-01',
    name: 'CMM Precision Metrology & QC Gate',
    department: 'QUALITY',
    hourlyRate: 90.0,
    capacityHoursPerDay: 8.0,
    efficiencyFactor: 0.98,
    isActive: true,
  },
];

const routingsStore: ManufacturingRouting[] = [
  {
    id: 'rtg-rob-1000',
    tenantId: 'tenant_default',
    plantId: 'PLANT-DETROIT',
    partId: 'ROB-1000',
    revisionId: 'REV-ROB-1000-A',
    name: 'Articulated Arm Primary Manufacturing & Assembly Routing',
    status: 'ACTIVE',
    version: '1.0',
    operations: [
      {
        id: 'op-10',
        routingId: 'rtg-rob-1000',
        operationNumber: 10,
        name: 'Cast Aluminum Joint Machining',
        description: 'CNC mill base joints and bearing pockets',
        workCenterId: 'wc-cnc-01',
        setupTimeMinutes: 45,
        runTimePerUnitMinutes: 25,
        laborCount: 1,
        workInstructionsUrl: 'https://docs.universal-plm.com/ops/OP-10-CNC.pdf',
      },
      {
        id: 'op-20',
        routingId: 'rtg-rob-1000',
        operationNumber: 20,
        name: 'Harmonic Drive & Motor Wiring Assembly',
        description: 'Install actuator gearboxes, torque bolts, route harnesses',
        workCenterId: 'wc-assy-01',
        setupTimeMinutes: 30,
        runTimePerUnitMinutes: 40,
        laborCount: 2,
        workInstructionsUrl: 'https://docs.universal-plm.com/ops/OP-20-HARMONIC.pdf',
      },
      {
        id: 'op-30',
        routingId: 'rtg-rob-1000',
        operationNumber: 30,
        name: 'Final CMM Calibration & Dynamic Load Run',
        description: 'Verify 0.05mm repeatability and full 6-axis articulation',
        workCenterId: 'wc-insp-01',
        setupTimeMinutes: 15,
        runTimePerUnitMinutes: 20,
        laborCount: 1,
        isQualityInspectionGate: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mpnStore = new Map<string, ManufacturerPart>([
  [
    'mpn-harmonic-01',
    {
      id: 'mpn-harmonic-01',
      tenantId: 'tenant_default',
      manufacturerName: 'Harmonic Drive LLC',
      mpn: 'CSG-20-100-2UH',
      description: 'Zero-backlash precision component set gearbox',
      rohsStatus: 'COMPLIANT',
      lifecycleStatus: 'ACTIVE',
    },
  ],
  [
    'mpn-sanmina-01',
    {
      id: 'mpn-sanmina-01',
      tenantId: 'tenant_default',
      manufacturerName: 'Sanmina Corporation',
      mpn: 'PCB-4001-ASSY',
      description: 'Multi-axis motor driver PCBA SMD assembly',
      rohsStatus: 'COMPLIANT',
      lifecycleStatus: 'ACTIVE',
    },
  ],
]);

const amlStore: AmlEntry[] = [
  {
    id: 'aml-01',
    tenantId: 'tenant_default',
    internalPartId: 'ROB-1010',
    manufacturerPartId: 'mpn-harmonic-01',
    preference: 'PREFERRED',
    qualificationStatus: 'QUALIFIED',
    approvedBy: 'Lead Mechanical Engineer',
  },
  {
    id: 'aml-02',
    tenantId: 'tenant_default',
    internalPartId: 'PCB-4001',
    manufacturerPartId: 'mpn-sanmina-01',
    preference: 'PREFERRED',
    qualificationStatus: 'QUALIFIED',
    approvedBy: 'Lead EE Engineer',
  },
];

const avlStore: AvlEntry[] = [
  {
    id: 'avl-01',
    tenantId: 'tenant_default',
    internalPartId: 'ROB-1010',
    supplierId: 'SUP-HARMONIC-DIRECT',
    manufacturerPartId: 'mpn-harmonic-01',
    vendorPartNumber: 'CSG-20-100-DIR',
    unitPrice: 850.0,
    minimumOrderQty: 1,
    leadTimeDays: 45,
    preference: 'PRIMARY',
    isContractedPrice: true,
  },
  {
    id: 'avl-02',
    tenantId: 'tenant_default',
    internalPartId: 'PCB-4001',
    supplierId: 'SUP-SANMINA-EMS',
    manufacturerPartId: 'mpn-sanmina-01',
    vendorPartNumber: 'SAN-4001-A',
    unitPrice: 180.0,
    minimumOrderQty: 5,
    leadTimeDays: 21,
    preference: 'PRIMARY',
    isContractedPrice: true,
  },
];

let mbomStore: MbomLine[] = [
  {
    id: 'mbom-01',
    tenantId: 'tenant_default',
    plantId: 'PLANT-DETROIT',
    parentPartId: 'ROB-1000',
    componentPartId: 'ROB-1010',
    quantity: 6,
    uom: 'EA',
    findNumber: 10,
    operationSeq: 20,
    isManufacturingOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mbom-02',
    tenantId: 'tenant_default',
    plantId: 'PLANT-DETROIT',
    parentPartId: 'ROB-1000',
    componentPartId: 'PCB-4001',
    quantity: 2,
    uom: 'EA',
    findNumber: 20,
    operationSeq: 20,
    isManufacturingOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mbom-03',
    tenantId: 'tenant_default',
    plantId: 'PLANT-DETROIT',
    parentPartId: 'ROB-1000',
    componentPartId: 'CNS-GREASE-400',
    quantity: 0.5,
    uom: 'KG',
    findNumber: 900,
    operationSeq: 20,
    isManufacturingOnly: true,
    notes: 'Synthetic gear lubricant',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
