import { describe, it, expect } from 'vitest';
import {
  EngineeringChangeRequest,
  transitionEcrStatus,
  convertEcrToEco,
  ApprovalStage,
  castReviewerVote,
  evaluateStageStatus,
  executeAtomicEcoRelease,
  assertNoBaselineCollision,
  BaselineConcurrencyCollisionError,
} from '@universal-plm/change-management';
import {
  ControlledDocument,
  checkOutDocument,
  checkInDocument,
  cancelCheckOut,
  DocumentLockError,
} from '@universal-plm/document-control';

describe('Phase 2 — Change & Document Control Suite', () => {

  describe('A08: Engineering Change Requests (ECR) & Conversion', () => {
    const sampleEcr: EngineeringChangeRequest = {
      id: 'ecr-101',
      tenantId: 'tenant-officehub',
      ecrNumber: 'ECR-2026-0012',
      title: 'Upgrade Motor Controller to High-Torque Driver',
      description: 'Thermal throttling observed during sustained 15A acceleration trials',
      reason: 'DESIGN_IMPROVEMENT',
      priority: 'HIGH',
      status: 'DRAFT',
      requestorId: 'usr-eng-01',
      affectedPartIds: ['part-rob-1000', 'part-pcb-4001'],
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
    };

    it('should transition ECR through lifecycle and disallow invalid skips', () => {
      // DRAFT -> SUBMITTED -> IN_REVIEW -> APPROVED_FOR_ECO
      const submitted = transitionEcrStatus(sampleEcr, 'SUBMITTED');
      expect(submitted.status).toBe('SUBMITTED');

      const inReview = transitionEcrStatus(submitted, 'IN_REVIEW');
      expect(inReview.status).toBe('IN_REVIEW');

      const approved = transitionEcrStatus(inReview, 'APPROVED_FOR_ECO');
      expect(approved.status).toBe('APPROVED_FOR_ECO');

      // Attempting invalid skip from DRAFT directly to APPROVED_FOR_ECO must throw
      expect(() => transitionEcrStatus(sampleEcr, 'APPROVED_FOR_ECO')).toThrow();
    });

    it('should convert approved ECR into an active ECO with affected items', () => {
      const approvedEcr: EngineeringChangeRequest = {
        ...sampleEcr,
        status: 'APPROVED_FOR_ECO',
      };

      const eco = convertEcrToEco(approvedEcr, 'usr-lead-02', 'Elena Rostova', 'ECO-2026-0088');

      expect(eco.ecoNumber).toBe('ECO-2026-0088');
      expect(eco.originatingEcrId).toBe(approvedEcr.id);
      expect(eco.stage).toBe('NEW');
      expect(eco.affectedItems.length).toBe(2);
      expect(eco.affectedItems[0].partId).toBe('part-rob-1000');
      expect(eco.affectedItems[1].partId).toBe('part-pcb-4001');
    });
  });

  describe('A10: Configurable Multi-Stage Approval Engine & 21 CFR Part 11 Signatures', () => {
    it('should evaluate quorum under ALL_MUST_APPROVE and generate signatures', () => {
      const initialStage: ApprovalStage = {
        id: 'stg-01',
        ecoId: 'eco-001',
        sequenceOrder: 1,
        name: 'Technical & Quality Sign-Off',
        routingMode: 'PARALLEL',
        quorumRule: 'ALL_MUST_APPROVE',
        stageStatus: 'PENDING',
        reviewers: [
          {
            id: 'rev-1',
            reviewerId: 'usr-lead-eng',
            reviewerName: 'Marcus Vance',
            reviewerRole: 'Chief Mechanical Architect',
            vote: 'PENDING',
          },
          {
            id: 'rev-2',
            reviewerId: 'usr-quality-mgr',
            reviewerName: 'Diana Prince',
            reviewerRole: 'Quality Director',
            vote: 'PENDING',
          },
        ],
      };

      // Reviewer 1 approves
      const stageAfterVote1 = castReviewerVote(initialStage, 'usr-lead-eng', 'APPROVE', 'Tolerances match FEA specs');
      expect(stageAfterVote1.stageStatus).toBe('IN_REVIEW');
      expect(stageAfterVote1.reviewers[0].signatureHash).toBeDefined();

      // Reviewer 2 approves -> stage becomes APPROVED
      const stageAfterVote2 = castReviewerVote(stageAfterVote1, 'usr-quality-mgr', 'APPROVE', 'ISO 9001 compliance validated');
      expect(stageAfterVote2.stageStatus).toBe('APPROVED');
      expect(stageAfterVote2.completedAt).toBeDefined();
    });

    it('should transition to REJECTED if any required reviewer rejects under ALL_MUST_APPROVE', () => {
      const stage: ApprovalStage = {
        id: 'stg-02',
        ecoId: 'eco-002',
        sequenceOrder: 1,
        name: 'Safety Review',
        routingMode: 'PARALLEL',
        quorumRule: 'ALL_MUST_APPROVE',
        stageStatus: 'IN_REVIEW',
        reviewers: [
          {
            id: 'rev-1',
            reviewerId: 'usr-safety',
            reviewerName: 'Arthur Dent',
            reviewerRole: 'Safety Inspector',
            vote: 'PENDING',
          },
        ],
      };

      const result = castReviewerVote(stage, 'usr-safety', 'REJECT', 'Pinch point risk on joint 3');
      expect(result.stageStatus).toBe('REJECTED');
    });

    it('should evaluate MAJORITY quorum rule correctly', () => {
      const stage: ApprovalStage = {
        id: 'stg-03',
        ecoId: 'eco-003',
        sequenceOrder: 1,
        name: 'Operations Review',
        routingMode: 'PARALLEL',
        quorumRule: 'MAJORITY',
        stageStatus: 'IN_REVIEW',
        reviewers: [
          { id: 'r1', reviewerId: 'u1', reviewerName: 'U1', reviewerRole: 'Tooling', vote: 'APPROVE' },
          { id: 'r2', reviewerId: 'u2', reviewerName: 'U2', reviewerRole: 'Supply', vote: 'APPROVE' },
          { id: 'r3', reviewerId: 'u3', reviewerName: 'U3', reviewerRole: 'Plant', vote: 'PENDING' },
        ],
      };

      // 2 out of 3 votes are APPROVE -> majority (2 >= 2) reached
      expect(evaluateStageStatus(stage)).toBe('APPROVED');
    });
  });

  describe('INV-06 & A09: Baseline Concurrency Detection & Atomic Release', () => {
    const mockEco = {
      id: 'eco-001',
      tenantId: 'tenant-officehub',
      ecoNumber: 'ECO-2026-0042',
      title: 'Robotic Arm Revision B Release',
      description: 'Actuator torque upgrade',
      changeType: 'DESIGN_IMPROVEMENT' as const,
      stage: 'VALIDATED' as const,
      priority: 3,
      responsibleId: 'usr-marcus',
      responsibleName: 'Marcus Vance',
      effectiveDate: '2026-11-01',
      affectedItems: [
        {
          id: 'aff-1',
          ecoId: 'eco-001',
          partId: 'part-rob-1000',
          partNumber: 'ROB-1000',
          baselineRevisionId: 'rev-rob-1000-A',
          proposedRevisionId: 'rev-rob-1000-B',
          disposition: 'USE_AS_IS' as const,
        },
      ],
      isReleased: false,
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
    };

    const approvedStages: ApprovalStage[] = [
      {
        id: 'stg-01',
        ecoId: 'eco-001',
        sequenceOrder: 1,
        name: 'Final Sign-off',
        routingMode: 'PARALLEL',
        quorumRule: 'ALL_MUST_APPROVE',
        stageStatus: 'APPROVED',
        reviewers: [],
      },
    ];

    it('should detect baseline collisions (INV-06) if a part was revised by another ECO', async () => {
      // Simulate that in the database, part-rob-1000 was already revised to rev-rob-1000-A1 by another ECO
      const staleProvider = {
        getActiveRevisionId: () => 'rev-rob-1000-A1',
      };

      await expect(assertNoBaselineCollision(mockEco, staleProvider)).rejects.toThrow(
        BaselineConcurrencyCollisionError
      );
    });

    it('should successfully execute atomic release when baselines match and approvals pass', async () => {
      const validProvider = {
        getActiveRevisionId: () => 'rev-rob-1000-A', // matches baselineRevisionId exactly
      };

      const result = await executeAtomicEcoRelease(
        mockEco,
        approvedStages,
        'usr-marcus',
        validProvider
      );

      expect(result.releasedEco.stage).toBe('RELEASED');
      expect(result.releasedEco.isReleased).toBe(true);
      expect(result.releasedEco.releasedBy).toBe('usr-marcus');
      expect(result.releasedRevisions.length).toBe(1);
      expect(result.releasedRevisions[0].isBaselineLocked).toBe(true);
      expect(result.auditRecord.eventType).toBe('ECO_RELEASE_COMMAND');
    });

    it('should refuse atomic release if any approval stage is unapproved', async () => {
      const pendingStages: ApprovalStage[] = [
        {
          id: 'stg-pending',
          ecoId: 'eco-001',
          sequenceOrder: 1,
          name: 'Executive Sign-off',
          routingMode: 'PARALLEL',
          quorumRule: 'ALL_MUST_APPROVE',
          stageStatus: 'IN_REVIEW',
          reviewers: [],
        },
      ];

      const validProvider = { getActiveRevisionId: () => 'rev-rob-1000-A' };

      await expect(
        executeAtomicEcoRelease(mockEco, pendingStages, 'usr-marcus', validProvider)
      ).rejects.toThrow(/not approved/);
    });
  });

  describe('B01, B02, B05: Controlled Document Vault & Check-Out Locking', () => {
    const sampleDoc: ControlledDocument = {
      id: 'doc-001',
      tenantId: 'tenant-officehub',
      documentNumber: 'DOC-SPEC-1000',
      title: 'Robotic Arm Engineering Specification',
      category: 'SPECIFICATION',
      currentRevision: '1.0',
      lifecycleState: 'RELEASED',
      ownerId: 'usr-eng-01',
      tags: ['Robotics', 'Harmonic Drive'],
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    it('should checkout document and acquire exclusive lock preventing simultaneous edits', () => {
      const checkedOut = checkOutDocument(sampleDoc, 'usr-marcus', 'Marcus Vance', 'Updating motor torque curves');

      expect(checkedOut.checkOutLock).toBeDefined();
      expect(checkedOut.checkOutLock?.lockedByUserId).toBe('usr-marcus');

      // Another user trying to check out simultaneously must be rejected with DocumentLockError
      expect(() => {
        checkOutDocument(checkedOut, 'usr-elena', 'Elena Rostova', 'Competing edit');
      }).toThrow(DocumentLockError);
    });

    it('should allow lock owner to check in a new revision, releasing the lock', () => {
      const checkedOut = checkOutDocument(sampleDoc, 'usr-marcus', 'Marcus Vance');

      const { updatedDocument, newRevision } = checkInDocument(checkedOut, 'usr-marcus', {
        revision: '1.1',
        fileName: 'ROB-1000-SPEC-v1.1.pdf',
        fileSizeBytes: 2450800,
        mimeType: 'application/pdf',
        storageBlobKey: 'stratus/docs/ROB-1000-SPEC-v1.1.pdf',
        checksumSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
        changeSummary: 'Updated joint torque limits from 25Nm to 65Nm',
      });

      expect(updatedDocument.currentRevision).toBe('1.1');
      expect(updatedDocument.checkOutLock).toBeUndefined(); // Lock is released
      expect(newRevision.revision).toBe('1.1');
    });

    it('should allow cancelling checkout without incrementing revisions', () => {
      const checkedOut = checkOutDocument(sampleDoc, 'usr-marcus', 'Marcus Vance');
      const cancelled = cancelCheckOut(checkedOut, 'usr-marcus');

      expect(cancelled.checkOutLock).toBeUndefined();
      expect(cancelled.currentRevision).toBe('1.0');
    });
  });

});
