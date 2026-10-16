import { FastifyPluginAsync } from 'fastify';
import { CreatePartInput, PartMaster, PartRevision } from '@universal-plm/domain-core';
import { assertPermission, Permissions } from '@universal-plm/authorization';

// In-memory demo store for rapid baseline development before Catalyst ZCQL database syncing
const partsStore: PartMaster[] = [
  {
    id: 'part-001',
    tenantId: 'default-tenant',
    partNumber: 'ROB-1000',
    name: 'Autonomous Articulated Robotic Arm',
    description: '6-Axis Industrial Robotic Manipulator Assembly',
    type: 'ASSEMBLY',
    defaultUom: 'EA',
    currentRevisionId: 'rev-001-A',
    latestReleasedRevisionId: 'rev-001-A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'part-002',
    tenantId: 'default-tenant',
    partNumber: 'ROB-1010',
    name: 'Precision Harmonic Servo Actuator',
    description: 'High-torque brushless servo motor module',
    type: 'MANUFACTURED',
    defaultUom: 'EA',
    currentRevisionId: 'rev-002-B',
    latestReleasedRevisionId: 'rev-002-B',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'part-003',
    tenantId: 'default-tenant',
    partNumber: 'PCB-4001',
    name: 'Multi-Axis Motor Controller PCB',
    description: '4-layer embedded microcontroller drive board',
    type: 'ASSEMBLY',
    defaultUom: 'EA',
    currentRevisionId: 'rev-003-A',
    latestReleasedRevisionId: 'rev-003-A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'part-004',
    tenantId: 'default-tenant',
    partNumber: 'ELC-0052',
    name: 'CAN-Bus Transceiver IC',
    description: 'Automotive-grade high speed differential transceiver',
    type: 'PURCHASED',
    defaultUom: 'EA',
    currentRevisionId: 'rev-004-A',
    latestReleasedRevisionId: 'rev-004-A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const revisionsStore: PartRevision[] = [
  {
    id: 'rev-001-A',
    tenantId: 'default-tenant',
    partId: 'part-001',
    revision: 'A',
    lifecycleState: 'RELEASED',
    releasedAt: new Date().toISOString(),
    releasedBy: 'eng-lead@plm.io',
    isBaselineLocked: true,
    revisionNotes: 'Initial production baseline',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rev-002-B',
    tenantId: 'default-tenant',
    partId: 'part-002',
    revision: 'B',
    lifecycleState: 'RELEASED',
    releasedAt: new Date().toISOString(),
    releasedBy: 'eng-lead@plm.io',
    isBaselineLocked: true,
    revisionNotes: 'Upgraded bearing tolerance for higher duty cycle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const partRoutes: FastifyPluginAsync = async (fastify) => {
  // List Parts (Tenant scoped)
  fastify.get('/', async (request) => {
    assertPermission(request.tenantContext, Permissions.PART_READ);
    const tenantParts = partsStore.filter((p) => p.tenantId === request.tenantContext.tenantId);
    return { data: tenantParts, total: tenantParts.length };
  });

  // Get Part by ID
  fastify.get('/:id', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.PART_READ);
    const { id } = request.params as { id: string };
    const part = partsStore.find(
      (p) => p.id === id && p.tenantId === request.tenantContext.tenantId
    );
    if (!part) {
      return reply.status(404).send({ error: 'Part not found' });
    }
    const revisions = revisionsStore.filter((r) => r.partId === id);
    return { data: { ...part, revisions } };
  });

  // Create Part
  fastify.post('/', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.PART_CREATE);
    const body = request.body as CreatePartInput;

    const newPart: PartMaster = {
      id: `part-${Date.now()}`,
      tenantId: request.tenantContext.tenantId,
      partNumber: body.partNumber || `PRT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: body.name,
      description: body.description,
      type: body.type,
      classificationId: body.classificationId,
      defaultUom: body.defaultUom,
      customAttributes: body.customAttributes || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-create initial Revision 'A' in DRAFT state
    const initialRev: PartRevision = {
      id: `rev-${newPart.id}-A`,
      tenantId: request.tenantContext.tenantId,
      partId: newPart.id,
      revision: 'A',
      lifecycleState: 'DRAFT',
      isBaselineLocked: false,
      revisionNotes: 'Initial working revision draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newPart.currentRevisionId = initialRev.id;

    partsStore.unshift(newPart);
    revisionsStore.push(initialRev);

    return reply.status(201).send({ data: newPart, initialRevision: initialRev });
  });
};
