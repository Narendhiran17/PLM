export type EcrReason =
  | 'COST_REDUCTION'
  | 'QUALITY_ISSUE'
  | 'OBSOLESCENCE'
  | 'CUSTOMER_REQUEST'
  | 'REGULATORY'
  | 'DESIGN_IMPROVEMENT';

export type EcrPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EcrStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED_FOR_ECO'
  | 'REJECTED'
  | 'CANCELLED';

export interface EngineeringChangeRequest {
  id: string;
  tenantId: string;
  ecrNumber: string;
  title: string;
  description: string;
  reason: EcrReason;
  priority: EcrPriority;
  status: EcrStatus;
  requestorId: string;
  assignedReviewerId?: string;
  affectedPartIds: string[];
  estimatedCostImpact?: number;
  convertedToEcoId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEcrInput {
  tenantId: string;
  ecrNumber: string;
  title: string;
  description: string;
  reason: EcrReason;
  priority: EcrPriority;
  requestorId: string;
  affectedPartIds: string[];
  estimatedCostImpact?: number;
}

/**
 * Validates allowable ECR status transitions
 */
export function transitionEcrStatus(
  ecr: EngineeringChangeRequest,
  targetStatus: EcrStatus
): EngineeringChangeRequest {
  const allowedTransitions: Record<EcrStatus, EcrStatus[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['IN_REVIEW', 'CANCELLED'],
    IN_REVIEW: ['APPROVED_FOR_ECO', 'REJECTED', 'CANCELLED'],
    APPROVED_FOR_ECO: [], // terminal state leading to ECO creation
    REJECTED: ['DRAFT'],  // can be reopened for rework
    CANCELLED: [],
  };

  if (!allowedTransitions[ecr.status].includes(targetStatus)) {
    throw new Error(
      `Invalid ECR status transition from '${ecr.status}' to '${targetStatus}'. Allowed: [${allowedTransitions[ecr.status].join(', ')}]`
    );
  }

  return {
    ...ecr,
    status: targetStatus,
    updatedAt: new Date().toISOString(),
  };
}
