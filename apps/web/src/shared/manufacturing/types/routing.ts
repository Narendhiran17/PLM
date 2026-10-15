/**
 * Manufacturing Routings, Operations & Work Centers
 * Universal PLM Platform - Section C: Manufacturing & Supply Chain (C02, C03, C11)
 */

export interface WorkCenter {
  id: string;
  tenantId: string;
  plantId: string;
  code: string; // e.g. "WC-CNC-01", "WC-ASSY-02", "WC-INSP-01"
  name: string;
  department: string;
  hourlyRate: number; // Combined labor and machine overhead per hour ($)
  capacityHoursPerDay: number; // e.g. 16.0 hrs (two shifts)
  efficiencyFactor: number; // e.g. 0.90 for 90% OEE
  isActive: boolean;
}

export interface RoutingOperation {
  id: string;
  routingId: string;
  operationNumber: number; // 10, 20, 30, 40...
  name: string;
  description?: string;
  workCenterId: string;
  setupTimeMinutes: number; // Machine setup / changeover time
  runTimePerUnitMinutes: number; // Cycle time per unit
  laborCount: number; // Number of operators required
  workInstructionsUrl?: string; // Digital work instruction (C11)
  isQualityInspectionGate?: boolean; // Quality checkpoint
}

export interface ManufacturingRouting {
  id: string;
  tenantId: string;
  plantId: string;
  partId: string;
  revisionId: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  version: string;
  operations: RoutingOperation[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutingCostCalculationResult {
  batchSize: number;
  totalSetupMinutes: number;
  totalRunMinutesPerUnit: number;
  totalSetupCost: number;
  runCostPerUnit: number;
  setupCostPerUnit: number;
  totalLaborCostPerUnit: number;
  operationBreakdown: Array<{
    opNumber: number;
    opName: string;
    workCenterCode: string;
    laborCostPerUnit: number;
    cycleTimeMinutes: number;
  }>;
}

/**
 * Computes exact labor and workstation costs for a manufacturing routing based on batch size
 */
export function calculateRoutingCost(
  routing: ManufacturingRouting,
  workCenters: WorkCenter[],
  batchSize: number = 100
): RoutingCostCalculationResult {
  const safeBatch = Math.max(1, batchSize);
  const wcMap = new Map<string, WorkCenter>(workCenters.map((wc) => [wc.id, wc]));

  let totalSetupMinutes = 0;
  let totalRunMinutesPerUnit = 0;
  let totalSetupCost = 0;
  let runCostPerUnit = 0;

  const operationBreakdown: Array<{
    opNumber: number;
    opName: string;
    workCenterCode: string;
    laborCostPerUnit: number;
    cycleTimeMinutes: number;
  }> = [];

  for (const op of routing.operations) {
    const wc = wcMap.get(op.workCenterId);
    const hourlyRate = wc ? wc.hourlyRate / (wc.efficiencyFactor || 1.0) : 65.0; // fallback $65/hr
    const ratePerMinute = hourlyRate / 60;

    totalSetupMinutes += op.setupTimeMinutes;
    totalRunMinutesPerUnit += op.runTimePerUnitMinutes;

    const opSetupCost = op.setupTimeMinutes * ratePerMinute * Math.max(1, op.laborCount);
    totalSetupCost += opSetupCost;

    const opRunCostPerUnit = op.runTimePerUnitMinutes * ratePerMinute * Math.max(1, op.laborCount);
    runCostPerUnit += opRunCostPerUnit;

    operationBreakdown.push({
      opNumber: op.operationNumber,
      opName: op.name,
      workCenterCode: wc ? wc.code : 'UNKNOWN',
      laborCostPerUnit: Math.round(opRunCostPerUnit * 100) / 100,
      cycleTimeMinutes: op.runTimePerUnitMinutes,
    });
  }

  const setupCostPerUnit = totalSetupCost / safeBatch;
  const totalLaborCostPerUnit = runCostPerUnit + setupCostPerUnit;

  return {
    batchSize: safeBatch,
    totalSetupMinutes,
    totalRunMinutesPerUnit,
    totalSetupCost: Math.round(totalSetupCost * 100) / 100,
    runCostPerUnit: Math.round(runCostPerUnit * 100) / 100,
    setupCostPerUnit: Math.round(setupCostPerUnit * 100) / 100,
    totalLaborCostPerUnit: Math.round(totalLaborCostPerUnit * 100) / 100,
    operationBreakdown,
  };
}
