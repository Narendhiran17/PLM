import { BomDiffItem } from '@universal-plm/domain-core';

export type EcoChangeType =
  | 'DESIGN_IMPROVEMENT'
  | 'COMPONENT_REPLACEMENT'
  | 'COST_REDUCTION'
  | 'CORRECTIVE_ACTION'
  | 'OBSOLESCENCE_PHASEOUT';

export type EcoStage =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'VALIDATED'
  | 'RELEASED'
  | 'CANCELLED';

export type ItemDisposition =
  | 'SCRAP'
  | 'REWORK'
  | 'USE_AS_IS'
  | 'RETURN_TO_VENDOR';

export interface EcoAffectedItem {
  id: string;
  ecoId: string;
  partId: string;
  partNumber: string;
  baselineRevisionId: string;
  proposedRevisionId: string;
  disposition: ItemDisposition;
  redlines?: BomDiffItem[];
  inventoryScrapValue?: number;
  openPoCount?: number;
}

export interface EngineeringChangeOrder {
  id: string;
  tenantId: string;
  ecoNumber: string;
  title: string;
  description: string;
  changeType: EcoChangeType;
  stage: EcoStage;
  priority: number; // 1 to 5 stars
  originatingEcrId?: string;
  responsibleId: string;
  responsibleName: string;
  effectiveDate: string; // ISO date
  affectedItems: EcoAffectedItem[];
  isReleased: boolean;
  releasedAt?: string;
  releasedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Converts an Approved ECR into an active Engineering Change Order (ECO)
 */
export function convertEcrToEco(
  ecr: import('./ecr.js').EngineeringChangeRequest,
  responsibleId: string,
  responsibleName: string,
  ecoNumber: string
): EngineeringChangeOrder {
  if (ecr.status !== 'APPROVED_FOR_ECO') {
    throw new Error(
      `Cannot convert ECR ${ecr.ecrNumber} to ECO: ECR status must be 'APPROVED_FOR_ECO' (current: '${ecr.status}')`
    );
  }

  const now = new Date().toISOString();

  const affectedItems: EcoAffectedItem[] = ecr.affectedPartIds.map((partId, idx) => ({
    id: `aff-${Date.now()}-${idx}`,
    ecoId: '', // populated below
    partId,
    partNumber: `PRT-${partId}`,
    baselineRevisionId: `rev-${partId}-active`,
    proposedRevisionId: `rev-${partId}-next`,
    disposition: 'USE_AS_IS',
  }));

  const ecoId = `eco-${Date.now()}`;
  affectedItems.forEach((item) => (item.ecoId = ecoId));

  return {
    id: ecoId,
    tenantId: ecr.tenantId,
    ecoNumber,
    title: ecr.title,
    description: ecr.description,
    changeType: ecr.reason === 'QUALITY_ISSUE' ? 'CORRECTIVE_ACTION' : 'DESIGN_IMPROVEMENT',
    stage: 'NEW',
    priority: ecr.priority === 'CRITICAL' ? 5 : ecr.priority === 'HIGH' ? 4 : 2,
    originatingEcrId: ecr.id,
    responsibleId,
    responsibleName,
    effectiveDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], // 14 days out
    affectedItems,
    isReleased: false,
    createdAt: now,
    updatedAt: now,
  };
}
