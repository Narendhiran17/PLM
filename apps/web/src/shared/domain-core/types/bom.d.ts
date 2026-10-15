import { UnitOfMeasure } from './part.js';
export type BomType = 'EBOM' | 'MBOM';
export interface BomLine {
    id: string;
    tenantId: string;
    parentRevisionId: string;
    childPartId: string;
    childRevisionId?: string;
    findNumber?: number;
    quantity: number;
    uom: UnitOfMeasure;
    bomType: BomType;
    referenceDesignators?: string[];
    isPhantom?: boolean;
    notes?: string;
    customAttributes?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
export interface BomAlternate {
    id: string;
    tenantId: string;
    bomLineId: string;
    alternatePartId: string;
    priority: number;
    description?: string;
}
export interface MultiLevelBomNode {
    bomLineId?: string;
    level: number;
    partId: string;
    partNumber: string;
    name: string;
    revision: string;
    lifecycleState: string;
    quantity: number;
    extendedQuantity: number;
    uom: UnitOfMeasure;
    findNumber?: number;
    referenceDesignators?: string[];
    children?: MultiLevelBomNode[];
}
export interface BomExplosionOptions {
    maxDepth?: number;
    effectiveDate?: string;
    includePhantoms?: boolean;
}
export interface WhereUsedResult {
    parentPartId: string;
    parentPartNumber: string;
    parentPartName: string;
    parentRevisionId: string;
    parentRevision: string;
    quantity: number;
    bomType: BomType;
    lifecycleState: string;
}
//# sourceMappingURL=bom.d.ts.map