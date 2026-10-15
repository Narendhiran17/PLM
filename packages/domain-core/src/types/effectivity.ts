export type EffectivityType = 'DATE' | 'SERIAL' | 'LOT';

export interface DateEffectivity {
  type: 'DATE';
  validFrom: string; // ISO date string
  validTo?: string;  // ISO date string
}

export interface SerialEffectivity {
  type: 'SERIAL';
  startUnit: string;
  endUnit?: string;
}

export interface LotEffectivity {
  type: 'LOT';
  lotNumber: string;
  expirationDate?: string;
}

export type EffectivityRule = DateEffectivity | SerialEffectivity | LotEffectivity;

/**
 * Evaluates whether a given effectivity rule is active at a given target date / serial number.
 */
export function isEffectivityActive(
  rule: EffectivityRule,
  context: { date?: string; serialNumber?: string; lotNumber?: string }
): boolean {
  if (rule.type === 'DATE') {
    const targetDate = context.date ? new Date(context.date) : new Date();
    const from = new Date(rule.validFrom);
    if (targetDate < from) return false;
    if (rule.validTo && targetDate > new Date(rule.validTo)) return false;
    return true;
  }

  if (rule.type === 'SERIAL' && context.serialNumber) {
    if (context.serialNumber < rule.startUnit) return false;
    if (rule.endUnit && context.serialNumber > rule.endUnit) return false;
    return true;
  }

  if (rule.type === 'LOT' && context.lotNumber) {
    return rule.lotNumber === context.lotNumber;
  }

  return true;
}
