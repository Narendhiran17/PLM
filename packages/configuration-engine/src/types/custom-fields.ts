/**
 * Dynamic Custom Field & Validation Types
 * Universal PLM Platform - Section E: Platform Configuration
 */

export type CustomFieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DROPDOWN'
  | 'DATE'
  | 'BOOLEAN'
  | 'FORMULA'
  | 'JSON';

export type TargetEntity = 'PART' | 'BOM_LINE' | 'CHANGE_ORDER' | 'DOCUMENT';

export interface CustomFieldValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: string[];
  customValidatorName?: string;
}

export interface CustomFieldDefinition {
  id: string;
  tenantId: string;
  targetEntity: TargetEntity;
  name: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  defaultValue?: any;
  options?: string[]; // for DROPDOWN
  formula?: string; // for FORMULA, e.g. "unitCost * 1.15" or "weightKg * 2.20462"
  validationRule?: CustomFieldValidationRule;
  displayOrder?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomFieldValues = Record<string, any>;

export interface ValidationError {
  fieldName: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates dynamic custom field values against tenant definitions
 */
export function validateCustomFields(
  definitions: CustomFieldDefinition[],
  values: CustomFieldValues = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const def of definitions) {
    const val = values[def.name];

    // 1. Required check
    if (def.required && (val === undefined || val === null || val === '')) {
      errors.push({
        fieldName: def.name,
        message: `Field "${def.label}" (${def.name}) is required.`,
      });
      continue;
    }

    if (val === undefined || val === null || val === '') {
      continue; // Skip further type checks if empty and not required
    }

    // 2. Type checks
    switch (def.type) {
      case 'NUMBER': {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push({
            fieldName: def.name,
            message: `Field "${def.label}" must be a valid number.`,
          });
        } else if (def.validationRule) {
          if (def.validationRule.min !== undefined && num < def.validationRule.min) {
            errors.push({
              fieldName: def.name,
              message: `Field "${def.label}" must be at least ${def.validationRule.min}.`,
            });
          }
          if (def.validationRule.max !== undefined && num > def.validationRule.max) {
            errors.push({
              fieldName: def.name,
              message: `Field "${def.label}" cannot exceed ${def.validationRule.max}.`,
            });
          }
        }
        break;
      }

      case 'DROPDOWN': {
        const allowed = def.options || def.validationRule?.allowedValues || [];
        if (allowed.length > 0 && !allowed.includes(String(val))) {
          errors.push({
            fieldName: def.name,
            message: `Field "${def.label}" must be one of: ${allowed.join(', ')}. Received: "${val}".`,
          });
        }
        break;
      }

      case 'DATE': {
        const d = new Date(val);
        if (isNaN(d.getTime())) {
          errors.push({
            fieldName: def.name,
            message: `Field "${def.label}" must be a valid ISO date string.`,
          });
        }
        break;
      }

      case 'BOOLEAN': {
        if (typeof val !== 'boolean' && val !== 'true' && val !== 'false') {
          errors.push({
            fieldName: def.name,
            message: `Field "${def.label}" must be a boolean.`,
          });
        }
        break;
      }

      case 'TEXT': {
        if (typeof val !== 'string') {
          errors.push({
            fieldName: def.name,
            message: `Field "${def.label}" must be a string.`,
          });
        } else if (def.validationRule?.pattern) {
          try {
            const regex = new RegExp(def.validationRule.pattern);
            if (!regex.test(val)) {
              errors.push({
                fieldName: def.name,
                message: `Field "${def.label}" does not match required format (${def.validationRule.pattern}).`,
              });
            }
          } catch {
            // invalid regex in definition
          }
        }
        break;
      }

      case 'JSON': {
        if (typeof val === 'string') {
          try {
            JSON.parse(val);
          } catch {
            errors.push({
              fieldName: def.name,
              message: `Field "${def.label}" must be a valid JSON string or object.`,
            });
          }
        } else if (typeof val !== 'object') {
          errors.push({
            fieldName: def.name,
            message: `Field "${def.label}" must be a valid JSON object.`,
          });
        }
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates basic mathematical and string formulas safely without eval()
 * Example formula: "unitCost * 1.15" or "weight * 2.2"
 */
export function evaluateFormula(formula: string, context: Record<string, any>): number | string | null {
  try {
    let resolved = formula;
    // Replace variable identifiers with values from context
    for (const [key, val] of Object.entries(context)) {
      if (typeof val === 'number') {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        resolved = resolved.replace(regex, String(val));
      }
    }

    // Safety check: ensure formula only contains numbers and basic math operators
    if (/^[\d\s+\-*/().]+$/.test(resolved)) {
      // Safe arithmetic evaluator
      const fn = new Function(`return (${resolved});`);
      const res = fn();
      return typeof res === 'number' && !isNaN(res) ? Math.round(res * 10000) / 10000 : null;
    }

    return null;
  } catch {
    return null;
  }
}
