import { BomLine } from '../types/bom.js';

export type BomDiffAction = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';

export interface BomDiffItem {
  childPartId: string;
  action: BomDiffAction;
  baselineLine?: BomLine;
  targetLine?: BomLine;
  oldQuantity: number;
  newQuantity: number;
  quantityDelta: number;
  oldFindNumber?: number;
  newFindNumber?: number;
  oldRefDes?: string[];
  newRefDes?: string[];
}

export interface BomComparisonResult {
  baselineRevisionId: string;
  targetRevisionId: string;
  items: BomDiffItem[];
  summary: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    unchangedCount: number;
    totalChanges: number;
  };
}

/**
 * Compares a baseline BOM revision with a proposed target BOM revision
 * to produce exact redline differences for engineering change orders.
 */
export function compareBoms(
  baselineRevisionId: string,
  targetRevisionId: string,
  baselineLines: BomLine[],
  targetLines: BomLine[]
): BomComparisonResult {
  const diffItems: BomDiffItem[] = [];

  const baselineMap = new Map<string, BomLine>();
  for (const line of baselineLines) {
    baselineMap.set(line.childPartId, line);
  }

  const targetMap = new Map<string, BomLine>();
  for (const line of targetLines) {
    targetMap.set(line.childPartId, line);
  }

  // 1. Process target lines (detect ADDED and MODIFIED / UNCHANGED)
  for (const targetLine of targetLines) {
    const baseLine = baselineMap.get(targetLine.childPartId);

    if (!baseLine) {
      diffItems.push({
        childPartId: targetLine.childPartId,
        action: 'ADDED',
        targetLine,
        oldQuantity: 0,
        newQuantity: targetLine.quantity,
        quantityDelta: targetLine.quantity,
        newFindNumber: targetLine.findNumber,
        newRefDes: targetLine.referenceDesignators,
      });
    } else {
      const isQuantityChanged = baseLine.quantity !== targetLine.quantity;
      const isFindNumberChanged = baseLine.findNumber !== targetLine.findNumber;
      const isRefDesChanged =
        JSON.stringify(baseLine.referenceDesignators || []) !==
        JSON.stringify(targetLine.referenceDesignators || []);

      const isModified = isQuantityChanged || isFindNumberChanged || isRefDesChanged;

      diffItems.push({
        childPartId: targetLine.childPartId,
        action: isModified ? 'MODIFIED' : 'UNCHANGED',
        baselineLine: baseLine,
        targetLine,
        oldQuantity: baseLine.quantity,
        newQuantity: targetLine.quantity,
        quantityDelta: targetLine.quantity - baseLine.quantity,
        oldFindNumber: baseLine.findNumber,
        newFindNumber: targetLine.findNumber,
        oldRefDes: baseLine.referenceDesignators,
        newRefDes: targetLine.referenceDesignators,
      });
    }
  }

  // 2. Process baseline lines that are missing in target (detect REMOVED)
  for (const baseLine of baselineLines) {
    if (!targetMap.has(baseLine.childPartId)) {
      diffItems.push({
        childPartId: baseLine.childPartId,
        action: 'REMOVED',
        baselineLine: baseLine,
        oldQuantity: baseLine.quantity,
        newQuantity: 0,
        quantityDelta: -baseLine.quantity,
        oldFindNumber: baseLine.findNumber,
        oldRefDes: baseLine.referenceDesignators,
      });
    }
  }

  const addedCount = diffItems.filter((i) => i.action === 'ADDED').length;
  const removedCount = diffItems.filter((i) => i.action === 'REMOVED').length;
  const modifiedCount = diffItems.filter((i) => i.action === 'MODIFIED').length;
  const unchangedCount = diffItems.filter((i) => i.action === 'UNCHANGED').length;

  return {
    baselineRevisionId,
    targetRevisionId,
    items: diffItems,
    summary: {
      addedCount,
      removedCount,
      modifiedCount,
      unchangedCount,
      totalChanges: addedCount + removedCount + modifiedCount,
    },
  };
}
