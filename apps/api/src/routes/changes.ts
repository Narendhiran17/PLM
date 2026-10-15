import { FastifyPluginAsync } from 'fastify';
import {
  ApprovalRecord,
  EngineeringChangeOrder,
  EngineeringChangeRequest,
  ImpactAnalysisResult,
} from '@universal-plm/domain-core';
import { assertPermission, Permissions } from '@universal-plm/authorization';

const ecrStore: EngineeringChangeRequest[] = [
  {
    id: 'ecr-001',
    tenantId: 'default-tenant',
    ecrNumber: 'ECR-2026-001',
    title: 'Replace CAN transceiver with AEC-Q100 automotive grade equivalent',
    description: 'Current component has thermal drift under high ambient operating temps.',
    reason: 'Obsolescence and thermal reliability enhancement',
    severity: 'HIGH',
    status: 'APPROVED',
    requestedBy: 'elec-eng@plm.io',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ecoStore: EngineeringChangeOrder[] = [
  {
    id: 'eco-001',
    tenantId: 'default-tenant',
    ecoNumber: 'ECO-2026-0042',
    title: 'Release Robotic Arm Revision B with upgraded Harmonic Actuators',
    description: 'Implements precision servo upgrade across joints 1 and 2.',
    ecrId: 'ecr-001',
    status: 'IN_APPROVAL',
    baselineRevisionIds: ['rev-001-A', 'rev-002-A'],
    assignedTo: 'lead-engineer@plm.io',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const approvalsStore: ApprovalRecord[] = [
  {
    id: 'appr-001',
    tenantId: 'default-tenant',
    changeOrderId: 'eco-001',
    stageName: 'Engineering Lead Review',
    reviewerId: 'user-001',
    reviewerName: 'Marcus Vance',
    reviewerRole: 'LEAD_ENGINEER',
    decision: 'APPROVED',
    comment: 'Stress testing and dynamic load models verified.',
    decidedAt: new Date().toISOString(),
  },
];

export const changeRoutes: FastifyPluginAsync = async (fastify) => {
  // List ECOs
  fastify.get('/ecos', async (request) => {
    assertPermission(request.tenantContext, Permissions.ECO_CREATE);
    const tenantEcos = ecoStore.filter((e) => e.tenantId === request.tenantContext.tenantId);
    return { data: tenantEcos, total: tenantEcos.length };
  });

  // Get ECO details with Impact Analysis
  fastify.get('/ecos/:id', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.ECO_CREATE);
    const { id } = request.params as { id: string };
    const eco = ecoStore.find((e) => e.id === id && e.tenantId === request.tenantContext.tenantId);
    if (!eco) {
      return reply.status(404).send({ error: 'Engineering Change Order not found' });
    }

    const approvals = approvalsStore.filter((a) => a.changeOrderId === id);

    const impact: ImpactAnalysisResult = {
      affectedAssemblyCount: 1,
      openOrdersCount: 4,
      scrapRiskCost: 1250.0,
      estimatedReworkHours: 8.5,
      dependentDocumentsCount: 3,
    };

    return { data: { ...eco, approvals, impact } };
  });

  // Submit ECO Approval Vote
  fastify.post('/ecos/:id/approve', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.ECO_APPROVE);
    const { id } = request.params as { id: string };
    const body = request.body as { decision: 'APPROVED' | 'REJECTED'; comment?: string };

    const newApproval: ApprovalRecord = {
      id: `appr-${Date.now()}`,
      tenantId: request.tenantContext.tenantId,
      changeOrderId: id,
      stageName: 'Quality & Release Authority',
      reviewerId: request.tenantContext.userId,
      reviewerName: request.tenantContext.userId,
      reviewerRole: request.tenantContext.roles[0] || 'LEAD_ENGINEER',
      decision: body.decision,
      comment: body.comment || 'Verified baseline criteria.',
      decidedAt: new Date().toISOString(),
    };

    approvalsStore.push(newApproval);
    return reply.status(201).send({ data: newApproval });
  });

  // List ECRs
  fastify.get('/ecrs', async (request) => {
    const tenantEcrs = ecrStore.filter((e) => e.tenantId === request.tenantContext.tenantId);
    return { data: tenantEcrs, total: tenantEcrs.length };
  });
};
