export type ChangeStatus = 'DRAFT' | 'PENDING_REVIEW' | 'IN_APPROVAL' | 'APPROVED' | 'RELEASED' | 'REJECTED' | 'CANCELLED';
export type ChangeItemAction = 'ADD' | 'MODIFY' | 'DELETE' | 'OBSOLETE';
export interface EngineeringChangeRequest {
    id: string;
    tenantId: string;
    ecrNumber: string;
    title: string;
    description: string;
    reason: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: ChangeStatus;
    requestedBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface EngineeringChangeOrder {
    id: string;
    tenantId: string;
    ecoNumber: string;
    title: string;
    description: string;
    ecrId?: string;
    status: ChangeStatus;
    effectiveDate?: string;
    baselineRevisionIds: string[];
    releasedRevisionIds?: string[];
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ChangeItem {
    id: string;
    tenantId: string;
    changeOrderId: string;
    partId: string;
    action: ChangeItemAction;
    fromRevisionId?: string;
    toRevisionId?: string;
    notes?: string;
}
export interface ApprovalRecord {
    id: string;
    tenantId: string;
    changeOrderId: string;
    stageName: string;
    reviewerId: string;
    reviewerName: string;
    reviewerRole: string;
    decision: 'APPROVED' | 'REJECTED' | 'ABSTAINED';
    comment?: string;
    decidedAt: string;
}
export interface ImpactAnalysisResult {
    affectedAssemblyCount: number;
    openOrdersCount: number;
    scrapRiskCost: number;
    estimatedReworkHours: number;
    dependentDocumentsCount: number;
}
//# sourceMappingURL=change.d.ts.map