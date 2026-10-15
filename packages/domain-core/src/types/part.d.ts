export type PartType = 'MANUFACTURED' | 'PURCHASED' | 'ASSEMBLY' | 'RAW_MATERIAL' | 'SOFTWARE' | 'CUSTOM';
export type UnitOfMeasure = 'EA' | 'M' | 'MM' | 'KG' | 'G' | 'L' | 'ML' | 'SET';
export interface PartClassification {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    description?: string;
    parentId?: string;
}
export interface PartMaster {
    id: string;
    tenantId: string;
    partNumber: string;
    name: string;
    description?: string;
    type: PartType;
    classificationId?: string;
    defaultUom: UnitOfMeasure;
    currentRevisionId?: string;
    latestReleasedRevisionId?: string;
    isConfigurable?: boolean;
    isObsolete?: boolean;
    customAttributes?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
export interface CreatePartInput {
    partNumber?: string;
    name: string;
    description?: string;
    type: PartType;
    classificationId?: string;
    defaultUom: UnitOfMeasure;
    customAttributes?: Record<string, unknown>;
}
//# sourceMappingURL=part.d.ts.map