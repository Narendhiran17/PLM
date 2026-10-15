import crypto from 'node:crypto';

export type RoutingMode = 'PARALLEL' | 'SEQUENTIAL';
export type QuorumRule = 'ALL_MUST_APPROVE' | 'MAJORITY' | 'AT_LEAST_ONE';
export type VoteChoice = 'PENDING' | 'APPROVE' | 'REJECT' | 'ABSTAIN';
export type StageStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ApprovalVoteRecord {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string; // e.g. "Lead Mechanical Engineer", "Quality Manager", "Operations VP"
  vote: VoteChoice;
  voteTimestamp?: string;
  comments?: string;
  signatureHash?: string; // 21 CFR Part 11 compliant electronic signature record
}

export interface ApprovalStage {
  id: string;
  ecoId: string;
  sequenceOrder: number;
  name: string;
  routingMode: RoutingMode;
  quorumRule: QuorumRule;
  reviewers: ApprovalVoteRecord[];
  stageStatus: StageStatus;
  completedAt?: string;
}

/**
 * Calculates cryptographic electronic signature hash for 21 CFR Part 11 attestation
 */
export function generateElectronicSignature(
  ecoId: string,
  reviewerId: string,
  reviewerRole: string,
  vote: VoteChoice,
  timestamp: string,
  secretKey = 'universal-plm-sign-key'
): string {
  const payload = `${ecoId}:${reviewerId}:${reviewerRole}:${vote}:${timestamp}`;
  return crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
}

/**
 * Evaluates whether an approval stage has reached consensus, approval, or rejection
 */
export function evaluateStageStatus(stage: ApprovalStage): StageStatus {
  const totalReviewers = stage.reviewers.length;
  if (totalReviewers === 0) return 'APPROVED';

  const approveCount = stage.reviewers.filter((r) => r.vote === 'APPROVE').length;
  const rejectCount = stage.reviewers.filter((r) => r.vote === 'REJECT').length;
  const abstainCount = stage.reviewers.filter((r) => r.vote === 'ABSTAIN').length;
  const pendingCount = stage.reviewers.filter((r) => r.vote === 'PENDING').length;

  if (stage.quorumRule === 'AT_LEAST_ONE') {
    if (approveCount >= 1) return 'APPROVED';
    if (pendingCount === 0 && rejectCount === totalReviewers) return 'REJECTED';
    return pendingCount > 0 ? 'IN_REVIEW' : 'REJECTED';
  }

  if (stage.quorumRule === 'ALL_MUST_APPROVE') {
    if (rejectCount > 0) return 'REJECTED';
    // All non-abstaining reviewers must approve
    const eligibleCount = totalReviewers - abstainCount;
    if (approveCount === eligibleCount && eligibleCount > 0) return 'APPROVED';
    return 'IN_REVIEW';
  }

  if (stage.quorumRule === 'MAJORITY') {
    const votingReviewers = totalReviewers - abstainCount;
    const majorityThreshold = Math.floor(votingReviewers / 2) + 1;
    if (approveCount >= majorityThreshold) return 'APPROVED';
    if (rejectCount >= majorityThreshold) return 'REJECTED';
    if (pendingCount === 0) return approveCount > rejectCount ? 'APPROVED' : 'REJECTED';
    return 'IN_REVIEW';
  }

  return 'IN_REVIEW';
}

/**
 * Submits an official reviewer vote with electronic signature record
 */
export function castReviewerVote(
  stage: ApprovalStage,
  reviewerId: string,
  vote: 'APPROVE' | 'REJECT' | 'ABSTAIN',
  comments?: string
): ApprovalStage {
  const now = new Date().toISOString();
  let found = false;

  const updatedReviewers = stage.reviewers.map((rev) => {
    if (rev.reviewerId === reviewerId) {
      found = true;
      const signatureHash = generateElectronicSignature(
        stage.ecoId,
        rev.reviewerId,
        rev.reviewerRole,
        vote,
        now
      );

      return {
        ...rev,
        vote,
        voteTimestamp: now,
        comments,
        signatureHash,
      };
    }
    return rev;
  });

  if (!found) {
    throw new Error(`Reviewer '${reviewerId}' is not authorized on approval stage '${stage.name}'`);
  }

  const updatedStage: ApprovalStage = {
    ...stage,
    reviewers: updatedReviewers,
    stageStatus: 'IN_REVIEW',
  };

  const newStatus = evaluateStageStatus(updatedStage);
  updatedStage.stageStatus = newStatus;
  if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
    updatedStage.completedAt = now;
  }

  return updatedStage;
}
