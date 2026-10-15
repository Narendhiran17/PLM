export interface ProductOptionValue {
  id: string;
  code: string;
  label: string;
  description?: string;
  costDelta?: number;
}

export interface ProductOptionGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  isMandatory: boolean;
  values: ProductOptionValue[];
}

export interface ProductFamily {
  id: string;
  tenantId: string;
  familyCode: string;
  name: string;
  description?: string;
  basePartId: string; // The root configurable product assembly
  optionGroups: ProductOptionGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  tenantId: string;
  familyId: string;
  variantSku: string;
  name: string;
  selectedOptionValueIds: string[];
  resolvedPartId?: string;
  createdAt: string;
  updatedAt: string;
}
