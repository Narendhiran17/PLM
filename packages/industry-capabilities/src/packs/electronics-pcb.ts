/**
 * @universal-plm/industry-capabilities
 * Pack: Electronics & PCB Engineering (IND-02)
 * Standards: IPC-7351B, IPC-A-610, RoHS 3, REACH, J-STD-020 (MSL)
 */

import { IndustryCapabilityManifest } from '../registry/capability-registry.js';

export type MoistureSensitivityLevel = 'MSL 1' | 'MSL 2' | 'MSL 2a' | 'MSL 3' | 'MSL 4' | 'MSL 5' | 'MSL 5a' | 'MSL 6';

export interface PcbComponentAttributes {
  footprint: string; // e.g. "0402", "0603", "QFP-64", "BGA-256"
  pinCount: number;
  tolerance?: string; // e.g. "±1%", "±5%"
  voltageRating?: string; // e.g. "50V", "3.3V"
  operatingTempMinC?: number; // e.g. -40
  operatingTempMaxC?: number; // e.g. 125
  mslRating?: MoistureSensitivityLevel;
  rohsCompliant: boolean;
  reachCompliant: boolean;
  ecadSymbolRef?: string;
}

export interface PcbBomLineExt {
  lineId: string;
  componentPartId: string;
  quantity: number;
  referenceDesignatorsRaw: string; // e.g. "C1-C4, C7, R10-R12"
  expandedDesignators: string[];
}

/**
 * Expands comma-separated and hyphenated reference designator strings
 * Examples: "C1-C4, C7" -> ["C1", "C2", "C3", "C4", "C7"]
 */
export function expandReferenceDesignators(raw: string): string[] {
  if (!raw || !raw.trim()) return [];

  const tokens = raw.split(',').map((t) => t.trim()).filter(Boolean);
  const result: string[] = [];

  for (const token of tokens) {
    // Check for range format like C1-C4 or R10-R15
    const rangeMatch = token.match(/^([A-Za-z]+)(\d+)\s*-\s*\1?(\d+)$/);
    if (rangeMatch) {
      const prefix = rangeMatch[1];
      const startNum = parseInt(rangeMatch[2], 10);
      const endNum = parseInt(rangeMatch[3], 10);

      const min = Math.min(startNum, endNum);
      const max = Math.max(startNum, endNum);

      for (let i = min; i <= max; i++) {
        result.push(`${prefix}${i}`);
      }
    } else {
      result.push(token);
    }
  }

  return result;
}

/**
 * Validates reference designators across a PCB BOM:
 * 1. Verifies that line quantity matches expanded designator count
 * 2. Detects duplicate reference designators assigned across different lines
 */
export function validatePcbDesignators(bomLines: Array<{ lineId: string; componentPartId: string; quantity: number; rawDesignators: string }>): {
  valid: boolean;
  quantityMismatches: Array<{ lineId: string; partId: string; lineQty: number; designatorCount: number }>;
  duplicateDesignators: Array<{ designator: string; lineIds: string[] }>;
} {
  const quantityMismatches: Array<{ lineId: string; partId: string; lineQty: number; designatorCount: number }> = [];
  const designatorToLines = new Map<string, string[]>();

  for (const line of bomLines) {
    const expanded = expandReferenceDesignators(line.rawDesignators);
    if (expanded.length > 0 && expanded.length !== line.quantity) {
      quantityMismatches.push({
        lineId: line.lineId,
        partId: line.componentPartId,
        lineQty: line.quantity,
        designatorCount: expanded.length
      });
    }

    for (const des of expanded) {
      const normalized = des.toUpperCase();
      const existing = designatorToLines.get(normalized) || [];
      existing.push(line.lineId);
      designatorToLines.set(normalized, existing);
    }
  }

  const duplicateDesignators: Array<{ designator: string; lineIds: string[] }> = [];
  for (const [des, lines] of designatorToLines.entries()) {
    if (lines.length > 1) {
      duplicateDesignators.push({ designator: des, lineIds: lines });
    }
  }

  return {
    valid: quantityMismatches.length === 0 && duplicateDesignators.length === 0,
    quantityMismatches,
    duplicateDesignators
  };
}

export const ELECTRONICS_PCB_MANIFEST: IndustryCapabilityManifest = {
  id: 'electronics-pcb',
  name: 'Electronics & High-Tech PCB Capability Pack',
  version: '2.1.0',
  description: 'Smart reference designator parsing, footprint/package attributes, MSL ratings, RoHS/REACH compliance, and ECAD synchronization.',
  industrySector: 'Electronics, Semiconductors & Hardware',
  complianceStandards: ['IPC-7351B', 'IPC-A-610', 'RoHS 3 (2015/863)', 'REACH SVHC', 'J-STD-020'],
  features: [
    'Automated reference designator range expansion (C1-C10)',
    'PCB BOM quantity vs. designator count parity checks',
    'Cross-line duplicate designator collision detection',
    'Component footprint, pin count, and MSL environmental profiling'
  ],
  requiredPartAttributes: [
    { name: 'footprint', label: 'Package / Footprint', type: 'string', required: true },
    { name: 'rohsCompliant', label: 'RoHS 3 Compliant', type: 'boolean', required: true }
  ]
};
