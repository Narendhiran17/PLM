export type PartType =
  | 'MANUFACTURED'
  | 'PURCHASED'
  | 'ASSEMBLY'
  | 'RAW_MATERIAL'
  | 'SOFTWARE'
  | 'CUSTOM';

export type UnitOfMeasure =
  | 'EA'  // Each
  | 'M'   // Meters
  | 'MM'  // Millimeters
  | 'KG'  // Kilograms
  | 'G'   // Grams
  | 'L'   // Liters
  | 'ML'  // Milliliters
  | 'SET';

export interface PartClassification {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string; // Hierarchical classification tree
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
