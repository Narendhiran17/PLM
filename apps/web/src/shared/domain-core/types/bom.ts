import { UnitOfMeasure } from './part.js';

export type BomType = 'EBOM' | 'MBOM';

export interface BomLine {
  id: string;
  tenantId: string;
  parentRevisionId: string; // The assembly revision owning this line
  childPartId: string;      // The component part master
  childRevisionId?: string; // Specific locked revision or dynamic policy
  findNumber?: number;      // Position on engineering drawing (e.g. 10, 20, 30)
  quantity: number;
  uom: UnitOfMeasure;
  bomType: BomType;
  referenceDesignators?: string[]; // e.g., ["R1", "R2", "C12"] for electronics
  isPhantom?: boolean;            // Transient assembly for manufacturing
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
  priority: number; // 1 = Primary alternate, 2 = Secondary
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
  extendedQuantity: number; // Cumulative multiplier down the tree
  uom: UnitOfMeasure;
  findNumber?: number;
  referenceDesignators?: string[];
  children?: MultiLevelBomNode[];
}

export interface BomExplosionOptions {
  maxDepth?: number;          // Guard against unbounded recursion (default: 20)
  effectiveDate?: string;     // ISO timestamp for date effectivity
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
