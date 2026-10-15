export type LifecycleState = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'RELEASED' | 'OBSOLETE';
export type RevisionSchemeType = 'ALPHABETIC' | 'NUMERIC' | 'SEMVER';
export interface PartRevision {
    id: string;
    tenantId: string;
    partId: string;
    revision: string;
    lifecycleState: LifecycleState;
    changeOrderId?: string;
    releasedAt?: string;
    releasedBy?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    isBaselineLocked: boolean;
    revisionNotes?: string;
    customAttributes?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
export interface TransitionStateInput {
    targetState: LifecycleState;
    changeOrderId?: string;
    transitionReason?: string;
    userSignature?: string;
}
//# sourceMappingURL=revision.d.ts.map