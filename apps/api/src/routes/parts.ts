import { FastifyPluginAsync } from 'fastify';
import { CreatePartInput, PartMaster, PartRevision } from '@universal-plm/domain-core';
import { assertPermission, Permissions } from '@universal-plm/authorization';

// Store initialized empty for clean-slate user testing
const partsStore: PartMaster[] = [];
const revisionsStore: PartRevision[] = [];

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
