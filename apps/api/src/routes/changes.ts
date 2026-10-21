import { FastifyPluginAsync } from 'fastify';
import {
  EngineeringChangeRequest,
  EngineeringChangeOrder,
  ApprovalStage,
  transitionEcrStatus,
  convertEcrToEco,
  castReviewerVote,
  executeAtomicEcoRelease,
  BaselineConcurrencyCollisionError,
} from '@universal-plm/change-management';
import { assertPermission, Permissions } from '@universal-plm/authorization';

// Stores initialized empty for clean-slate testing
const ecrStore: EngineeringChangeRequest[] = [];
const ecoStore: EngineeringChangeOrder[] = [];
const approvalStagesStore: Record<string, ApprovalStage[]> = {};
const activeBaselines: Record<string, string> = {};

export const changeRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. List ECRs
  fastify.get('/ecrs', async (request) => {
    assertPermission(request.tenantContext, Permissions.ECO_CREATE);
    const ecrs = ecrStore.filter((e) => e.tenantId === request.tenantContext.tenantId);
    return { data: ecrs, total: ecrs.length };
  });

  // 2. Create ECR
  fastify.post('/ecrs', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.ECO_CREATE);
    const body = request.body as any;
    const now = new Date().toISOString();
    const newEcr: EngineeringChangeRequest = {
      id: `ecr-${Date.now()}`,
      tenantId: request.tenantContext.tenantId,
      ecrNumber: body.ecrNumber || `ECR-2026-${Date.now().toString().slice(-4)}`,
      title: body.title,
      description: body.description,
      reason: body.reason || 'DESIGN_IMPROVEMENT',
      priority: body.priority || 'MEDIUM',
      status: 'DRAFT',
      requestorId: request.tenantContext.userId,
      affectedPartIds: body.affectedPartIds || [],
      createdAt: now,
      updatedAt: now,
    };
    ecrStore.push(newEcr);
    return reply.status(201).send({ data: newEcr });
  });

  // 3. Transition ECR Status
  fastify.post('/ecrs/:id/transition', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.ECO_CREATE);
    const { id } = request.params as { id: string };
    const { targetStatus } = request.body as { targetStatus: any };

    const ecr = ecrStore.find((e) => e.id === id && e.tenantId === request.tenantContext.tenantId);
    if (!ecr) return reply.status(404).send({ error: 'ECR not found' });

    const updated = transitionEcrStatus(ecr, targetStatus);
    const idx = ecrStore.findIndex((e) => e.id === id);
    ecrStore[idx] = updated;

    return { data: updated };
  });

  // 4. Convert Approved ECR to ECO
  fastify.post('/ecrs/:id/convert', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.ECO_CREATE);
    const { id } = request.params as { id: string };
    const ecr = ecrStore.find((e) => e.id === id && e.tenantId === request.tenantContext.tenantId);
    if (!ecr) return reply.status(404).send({ error: 'ECR not found' });

    const ecoNumber = `ECO-2026-${Date.now().toString().slice(-4)}`;
    const eco = convertEcrToEco(
      ecr,
      request.tenantContext.userId,
      request.tenantContext.userId,
      ecoNumber
    );

    ecoStore.push(eco);
    ecr.convertedToEcoId = eco.id;

    // Create baseline approval stage
    approvalStagesStore[eco.id] = [
      {
        id: `stg-${Date.now()}`,
        ecoId: eco.id,
        sequenceOrder: 1,
        name: 'Technical Review',
        routingMode: 'PARALLEL',
        quorumRule: 'ALL_MUST_APPROVE',
        stageStatus: 'IN_REVIEW',
        reviewers: [
          {
            id: `vtr-${Date.now()}`,
            reviewerId: request.tenantContext.userId,
            reviewerName: 'Reviewer',
            reviewerRole: 'Engineering Lead',
            vote: 'PENDING',
          },
        ],
      },
    ];

    return reply.status(201).send({ data: eco });
  });

  // 5. List ECOs
  fastify.get('/ecos', async (request) => {
    assertPermission(request.tenantContext, Permissions.ECO_CREATE);
    const tenantEcos = ecoStore.filter((e) => e.tenantId === request.tenantContext.tenantId);
    return { data: tenantEcos, total: tenantEcos.length };
  });

  // 6. Get ECO Details with Approval Stages
  fastify.get('/ecos/:id', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.ECO_CREATE);
    const { id } = request.params as { id: string };
    const eco = ecoStore.find((e) => e.id === id && e.tenantId === request.tenantContext.tenantId);
    if (!eco) return reply.status(404).send({ error: 'ECO not found' });

    const stages = approvalStagesStore[id] || [];
    return { data: { ...eco, approvalStages: stages } };
  });

  // 7. Cast Approval Vote (21 CFR Part 11 Electronic Signature)
  fastify.post('/ecos/:id/vote', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.ECO_APPROVE);
    const { id } = request.params as { id: string };
    const body = request.body as {
      stageId: string;
      vote: 'APPROVE' | 'REJECT' | 'ABSTAIN';
      comments?: string;
    };

    const stages = approvalStagesStore[id];
    if (!stages) return reply.status(404).send({ error: 'No approval stages found for this ECO' });

    const stage = stages.find((s) => s.id === body.stageId);
    if (!stage) return reply.status(404).send({ error: 'Stage not found' });

    const updatedStage = castReviewerVote(
      stage,
      request.tenantContext.userId,
      body.vote,
      body.comments
    );

    const stageIdx = stages.findIndex((s) => s.id === body.stageId);
    stages[stageIdx] = updatedStage;

    return { data: updatedStage };
  });

  // 8. Atomic Release Command (INV-03, INV-05, INV-06)
  fastify.post('/ecos/:id/release', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.REVISION_RELEASE);
    const { id } = request.params as { id: string };

    const eco = ecoStore.find((e) => e.id === id && e.tenantId === request.tenantContext.tenantId);
    if (!eco) return reply.status(404).send({ error: 'ECO not found' });

    const stages = approvalStagesStore[id] || [];

    try {
      const releaseResult = await executeAtomicEcoRelease(
        eco,
        stages,
        request.tenantContext.userId,
        {
          getActiveRevisionId: (partId) => activeBaselines[partId] || 'rev-001-A',
        }
      );

      // Update in-memory state
      const ecoIdx = ecoStore.findIndex((e) => e.id === id);
      ecoStore[ecoIdx] = releaseResult.releasedEco;

      return { data: releaseResult };
    } catch (err: any) {
      if (err instanceof BaselineConcurrencyCollisionError) {
        return reply.status(409).send({
          error: 'CONCURRENCY_BASELINE_COLLISION',
          message: err.message,
          partId: err.partId,
        });
      }
      return reply.status(400).send({ error: err.message });
    }
  });
};
