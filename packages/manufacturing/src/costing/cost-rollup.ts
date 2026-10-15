/**
 * Multi-Level Cost Rollups Engine
 * Universal PLM Platform - Section C: Manufacturing & Supply Chain (C09)
 */

import type { MbomLine } from '../types/mbom.js';
import type { ManufacturingRouting, WorkCenter } from '../types/routing.js';
import { calculateRoutingCost } from '../types/routing.js';
import type { OptimalSourcingDecision } from '../types/sourcing.js';

export interface ComponentCostLine {
  componentPartId: string;
  quantity: number;
  unitPrice: number;
  extendedCost: number;
  isManufacturingOnly: boolean;
  selectedMpn?: string;
  selectedSupplierId?: string;
}

export interface MultiLevelCostRollupResult {
  parentPartId: string;
  plantId: string;
  batchSize: number;
  totalMaterialCost: number;
  totalLaborMachiningCost: number;
  totalConsumableCost: number;
  totalUnitCost: number;
  targetCost?: number;
  costVariance?: number; // positive = over target, negative = under target
  variancePercentage?: number;
  componentCostBreakdown: ComponentCostLine[];
  routingLaborCostBreakdown?: any;
}

/**
 * Calculates complete multi-level rolled-up cost of an assembly combining
 * BOM component procurement (AVL), routing labor/machine hours, and consumables.
 */
export function calculateCostRollup(params: {
  parentPartId: string;
  plantId: string;
  mbomLines: MbomLine[];
  routing?: ManufacturingRouting;
  workCenters?: WorkCenter[];
  sourcingDecisions: Map<string, OptimalSourcingDecision>;
  targetCost?: number;
  batchSize?: number;
}): MultiLevelCostRollupResult {
  const batchSize = params.batchSize || 100;
  let totalMaterialCost = 0;
  let totalConsumableCost = 0;

  const componentCostBreakdown: ComponentCostLine[] = [];

  for (const line of params.mbomLines) {
    const sourcing = params.sourcingDecisions.get(line.componentPartId);
    const unitPrice = sourcing ? sourcing.unitPrice : 0;
    const extendedCost = Math.round(unitPrice * line.quantity * 100) / 100;

    if (line.isManufacturingOnly) {
      totalConsumableCost += extendedCost;
    } else {
      totalMaterialCost += extendedCost;
    }

    componentCostBreakdown.push({
      componentPartId: line.componentPartId,
      quantity: line.quantity,
      unitPrice,
      extendedCost,
      isManufacturingOnly: Boolean(line.isManufacturingOnly),
      selectedMpn: sourcing?.selectedMpn,
      selectedSupplierId: sourcing?.selectedSupplierId,
    });
  }

  let totalLaborMachiningCost = 0;
  let routingLaborCostBreakdown: any = null;

  if (params.routing && params.workCenters && params.workCenters.length > 0) {
    const routingCost = calculateRoutingCost(params.routing, params.workCenters, batchSize);
    totalLaborMachiningCost = routingCost.totalLaborCostPerUnit;
    routingLaborCostBreakdown = routingCost;
  }

  const totalUnitCost =
    Math.round((totalMaterialCost + totalConsumableCost + totalLaborMachiningCost) * 100) / 100;

  let costVariance: number | undefined;
  let variancePercentage: number | undefined;

  if (params.targetCost !== undefined && params.targetCost > 0) {
    costVariance = Math.round((totalUnitCost - params.targetCost) * 100) / 100;
    variancePercentage = Math.round((costVariance / params.targetCost) * 10000) / 100;
  }

  return {
    parentPartId: params.parentPartId,
    plantId: params.plantId,
    batchSize,
    totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
    totalLaborMachiningCost: Math.round(totalLaborMachiningCost * 100) / 100,
    totalConsumableCost: Math.round(totalConsumableCost * 100) / 100,
    totalUnitCost,
    targetCost: params.targetCost,
    costVariance,
    variancePercentage,
    componentCostBreakdown,
    routingLaborCostBreakdown,
  };
}
