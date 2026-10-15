/**
 * Auto-Numbering Schemes Engine
 * Universal PLM Platform - Section E: Platform Configuration (E05)
 */

export interface AutoNumberScheme {
  id: string;
  tenantId: string;
  entityType: 'PART' | 'ECO' | 'ECR' | 'DOC' | 'CUSTOM';
  category?: string; // e.g. "ELECTRICAL", "MECHANICAL", "FIRMWARE"
  prefix: string; // e.g. "PRT", "ECO", "DOC"
  suffix?: string;
  counterDigits: number; // e.g. 5 => 00001
  currentValue: number;
  delimiter?: string; // e.g. "-"
  formatPattern?: string; // e.g. "{PREFIX}-{YEAR}-{SEQ}"
  createdAt: string;
  updatedAt: string;
}

export interface GenerationResult {
  generatedNumber: string;
  updatedScheme: AutoNumberScheme;
}

/**
 * Generates the next sequential number according to the tenant's scheme
 */
export function generateNextNumber(
  scheme: AutoNumberScheme,
  contextTokens: Record<string, string> = {}
): GenerationResult {
  const nextVal = scheme.currentValue + 1;
  const paddedSeq = String(nextVal).padStart(scheme.counterDigits, '0');
  const now = new Date();
  const yearStr = String(now.getFullYear());
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const delimiter = scheme.delimiter !== undefined ? scheme.delimiter : '-';

  let generated = '';
  if (scheme.formatPattern) {
    generated = scheme.formatPattern
      .replace('{PREFIX}', scheme.prefix)
      .replace('{SEQ}', paddedSeq)
      .replace('{YEAR}', yearStr)
      .replace('{MONTH}', monthStr)
      .replace('{CATEGORY}', scheme.category || contextTokens.category || 'GEN');

    // Replace any remaining user-provided context tokens
    for (const [token, val] of Object.entries(contextTokens)) {
      generated = generated.replace(`{${token}}`, val);
    }
  } else {
    // Default format: PREFIX-SEQ or PREFIX-CATEGORY-SEQ
    const parts = [scheme.prefix];
    if (scheme.category) {
      parts.push(scheme.category.substring(0, 4).toUpperCase());
    }
    parts.push(paddedSeq);
    if (scheme.suffix) {
      parts.push(scheme.suffix);
    }
    generated = parts.join(delimiter);
  }

  const updatedScheme: AutoNumberScheme = {
    ...scheme,
    currentValue: nextVal,
    updatedAt: new Date().toISOString(),
  };

  return {
    generatedNumber: generated,
    updatedScheme,
  };
}
