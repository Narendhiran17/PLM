/**
 * Manufacturing Bill of Materials (MBOM) & Transformation Engine
 * Universal PLM Platform - Section C: Manufacturing & Supply Chain (C01, C07)
 */

import type { BomLine } from '@universal-plm/domain-core';

export type ReconciliationStatus = 'MATCHED' | 'QUANTITY_MISMATCH' | 'MFG_ONLY' | 'UNCONSUMED';

export interface MbomLine {
  id: string;
  tenantId: string;
  plantId: string; // Multi-facility plant code, e.g. "PLANT-DETROIT", "PLANT-CHENNAI"
  parentPartId: string;
  componentPartId: string;
  quantity: number;
  uom: string;
  findNumber: number;
  isPhantom?: boolean; // Phantom assembly (dissolved during manufacturing)
  isManufacturingOnly?: boolean; // Added in MBOM (packaging, lubricants, adhesives)
  operationSeq?: number; // Routing operation where item is consumed (e.g. OP 10, OP 20)
  ebomLineId?: string; // Cross-reference link to source EBOM line
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscrepancyItem {
  componentPartId: string;
  ebomQty: number;
  mbomQty: number;
  status: ReconciliationStatus;
  message: string;
}

export interface EbomMbomReconciliationReport {
  parentPartId: string;
  plantId: string;
  totalEbomItems: number;
  totalMbomItems: number;
  matchedCount: number;
  unconsumedEbomCount: number;
  mfgOnlyCount: number;
  isFullyReconciled: boolean;
  discrepancies: DiscrepancyItem[];
}

/**
 * Transforms an Engineering BOM (EBOM) into a base Manufacturing BOM (MBOM)
 * for a specific plant, mapping items to operations and adding default consumables.
 */
export function transformEbomToMbom(
  ebomLines: BomLine[],
  options: {
    tenantId: string;
    plantId: string;
    parentPartId: string;
    consumables?: Array<{
      componentPartId: string;
      quantity: number;
      uom: string;
      operationSeq: number;
      notes: string;
    }>;
  }
): MbomLine[] {
  const mbomLines: MbomLine[] = ebomLines.map((ebom, index) => ({
    id: `mbom_${options.plantId}_${index + 1}_${Date.now()}`,
    tenantId: options.tenantId,
    plantId: options.plantId,
    parentPartId: options.parentPartId || ebom.parentRevisionId,
    componentPartId: ebom.childPartId,
    quantity: ebom.quantity,
    uom: ebom.uom || 'EA',
    findNumber: ebom.findNumber || (index + 1) * 10,
    isPhantom: Boolean(ebom.isPhantom),
    isManufacturingOnly: false,
    operationSeq: 10 + (index % 3) * 10, // Default distribute across OP 10, 20, 30
    ebomLineId: ebom.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Append plant-specific manufacturing-only items (consumables, packaging, grease)
  if (options.consumables && options.consumables.length > 0) {
    options.consumables.forEach((item, idx) => {
      mbomLines.push({
        id: `mbom_mfg_${options.plantId}_${idx + 1}_${Date.now()}`,
        tenantId: options.tenantId,
        plantId: options.plantId,
        parentPartId: options.parentPartId,
        componentPartId: item.componentPartId,
        quantity: item.quantity,
        uom: item.uom,
        findNumber: 900 + idx * 10,
        isPhantom: false,
        isManufacturingOnly: true,
        operationSeq: item.operationSeq,
        notes: item.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  return mbomLines;
}

/**
 * Reconciles an EBOM against an MBOM to identify unconsumed engineering components,
 * quantity variances, and extra plant-specific materials.
 */
export function reconcileEbomMbom(
  ebomLines: BomLine[],
  mbomLines: MbomLine[],
  plantId: string,
  parentPartId: string
): EbomMbomReconciliationReport {
  const discrepancies: DiscrepancyItem[] = [];
  let matchedCount = 0;
  let unconsumedCount = 0;
  let mfgOnlyCount = 0;

  // Aggregate quantities by componentPartId
  const ebomQtyMap = new Map<string, number>();
  for (const el of ebomLines) {
    const current = ebomQtyMap.get(el.childPartId) || 0;
    ebomQtyMap.set(el.childPartId, current + el.quantity);
  }

  const mbomQtyMap = new Map<string, number>();
  for (const ml of mbomLines) {
    const current = mbomQtyMap.get(ml.componentPartId) || 0;
    mbomQtyMap.set(ml.componentPartId, current + ml.quantity);
  }

  // 1. Check each EBOM item in MBOM
  for (const [compPartId, ebomQty] of ebomQtyMap.entries()) {
    const mbomQty = mbomQtyMap.get(compPartId);

    if (mbomQty === undefined || mbomQty === 0) {
      unconsumedCount++;
      discrepancies.push({
        componentPartId: compPartId,
        ebomQty,
        mbomQty: 0,
        status: 'UNCONSUMED',
        message: `Engineering component "${compPartId}" is unconsumed in plant "${plantId}" MBOM.`,
      });
    } else if (mbomQty !== ebomQty) {
      discrepancies.push({
        componentPartId: compPartId,
        ebomQty,
        mbomQty,
        status: 'QUANTITY_MISMATCH',
        message: `Quantity discrepancy on "${compPartId}": EBOM requires ${ebomQty}, but MBOM consumes ${mbomQty}.`,
      });
    } else {
      matchedCount++;
    }
  }

  // 2. Check for manufacturing-only items in MBOM
  for (const [compPartId, mbomQty] of mbomQtyMap.entries()) {
    if (!ebomQtyMap.has(compPartId)) {
      mfgOnlyCount++;
      discrepancies.push({
        componentPartId: compPartId,
        ebomQty: 0,
        mbomQty,
        status: 'MFG_ONLY',
        message: `Plant consumable or packaging item "${compPartId}" (Qty: ${mbomQty}) added exclusively to MBOM.`,
      });
    }
  }

  const isFullyReconciled = unconsumedCount === 0 && discrepancies.filter((d) => d.status === 'QUANTITY_MISMATCH').length === 0;

  return {
    parentPartId,
    plantId,
    totalEbomItems: ebomLines.length,
    totalMbomItems: mbomLines.length,
    matchedCount,
    unconsumedEbomCount: unconsumedCount,
    mfgOnlyCount,
    isFullyReconciled,
    discrepancies,
  };
}
