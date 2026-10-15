/**
 * Cumulative Lead Time Analysis Engine
 * Universal PLM Platform - Section C: Manufacturing & Supply Chain (C10)
 */

import type { OptimalSourcingDecision } from '../types/sourcing.js';
import type { ManufacturingRouting } from '../types/routing.js';

export interface LeadTimeAnalysisResult {
  parentPartId: string;
  longestProcurementLeadTimeDays: number;
  procurementBottleneckPartId?: string;
  procurementBottleneckMpn?: string;
  manufacturingLeadTimeDays: number;
  totalCumulativeLeadTimeDays: number;
  criticalPathItems: Array<{
    partId: string;
    mpn?: string;
    leadTimeDays: number;
    supplierId?: string;
  }>;
}

/**
 * Computes cumulative manufacturing & procurement lead time and flags bottleneck components
 */
export function calculateCumulativeLeadTime(params: {
  parentPartId: string;
  sourcingDecisions: Map<string, OptimalSourcingDecision>;
  routing?: ManufacturingRouting;
  workHoursPerDay?: number;
}): LeadTimeAnalysisResult {
  const workHoursPerDay = params.workHoursPerDay || 8.0;

  // 1. Critical path across procurement sourcing
  let longestProcurementLeadTimeDays = 0;
  let procurementBottleneckPartId: string | undefined;
  let procurementBottleneckMpn: string | undefined;

  const criticalPathItems: Array<{
    partId: string;
    mpn?: string;
    leadTimeDays: number;
    supplierId?: string;
  }> = [];

  for (const [partId, decision] of params.sourcingDecisions.entries()) {
    criticalPathItems.push({
      partId,
      mpn: decision.selectedMpn,
      leadTimeDays: decision.leadTimeDays,
      supplierId: decision.selectedSupplierId,
    });

    if (decision.leadTimeDays > longestProcurementLeadTimeDays) {
      longestProcurementLeadTimeDays = decision.leadTimeDays;
      procurementBottleneckPartId = partId;
      procurementBottleneckMpn = decision.selectedMpn;
    }
  }

  // Sort critical path items descending by lead time
  criticalPathItems.sort((a, b) => b.leadTimeDays - a.leadTimeDays);

  // 2. Manufacturing run lead time in days from routing cycle times
  let totalMfgMinutes = 0;
  if (params.routing) {
    for (const op of params.routing.operations) {
      totalMfgMinutes += op.setupTimeMinutes + op.runTimePerUnitMinutes;
    }
  }

  // Convert minutes to manufacturing days (e.g. 480 mins = 1 day)
  const manufacturingLeadTimeDays = Math.ceil(totalMfgMinutes / (workHoursPerDay * 60));
  const totalCumulativeLeadTimeDays = longestProcurementLeadTimeDays + manufacturingLeadTimeDays;

  return {
    parentPartId: params.parentPartId,
    longestProcurementLeadTimeDays,
    procurementBottleneckPartId,
    procurementBottleneckMpn,
    manufacturingLeadTimeDays,
    totalCumulativeLeadTimeDays,
    criticalPathItems: criticalPathItems.slice(0, 5), // top 5 critical path items
  };
}
