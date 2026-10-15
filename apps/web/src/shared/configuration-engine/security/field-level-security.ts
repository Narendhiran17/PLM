/**
 * Role & Field-Level Permissions (FLS/RLS) Engine
 * Universal PLM Platform - Section E: Platform Configuration (E08)
 */

export type FieldAccessLevel = 'READ_WRITE' | 'READ_ONLY' | 'HIDDEN';

export interface FieldSecurityPolicy {
  id: string;
  tenantId: string;
  role: string; // e.g. "VIEWER", "ENGINEER", "SUPPLIER"
  targetEntity: string; // e.g. "PART", "ECO", "DOCUMENT"
  fieldPolicies: Record<string, FieldAccessLevel>; // fieldName -> access
}

export interface SecurityEnforcementResult<T> {
  sanitizedRecord: T;
  hiddenFields: string[];
  readOnlyFields: string[];
}

/**
 * Applies Field-Level Security projection based on the user's role.
 * Restricts or completely strips fields marked HIDDEN, and flags read-only fields.
 */
export function applyFieldSecurity<T extends Record<string, any>>(
  record: T,
  userRoles: string[],
  policies: FieldSecurityPolicy[],
  targetEntity: string
): SecurityEnforcementResult<T> {
  const hiddenFields = new Set<string>();
  const readOnlyFields = new Set<string>();

  // Collect all matching policies for the user's roles on this entity
  const relevantPolicies = policies.filter(
    (p) => userRoles.includes(p.role) && p.targetEntity === targetEntity
  );

  // If no restrictive policies apply, grant standard read-write
  if (relevantPolicies.length === 0) {
    return {
      sanitizedRecord: { ...record },
      hiddenFields: [],
      readOnlyFields: [],
    };
  }

  // Combine policies across user roles (most permissive wins: READ_WRITE > READ_ONLY > HIDDEN)
  const effectiveFieldAccess: Record<string, FieldAccessLevel> = {};

  for (const policy of relevantPolicies) {
    for (const [field, access] of Object.entries(policy.fieldPolicies)) {
      const current = effectiveFieldAccess[field];
      if (!current) {
        effectiveFieldAccess[field] = access;
      } else if (access === 'READ_WRITE') {
        effectiveFieldAccess[field] = 'READ_WRITE';
      } else if (access === 'READ_ONLY' && current === 'HIDDEN') {
        effectiveFieldAccess[field] = 'READ_ONLY';
      }
    }
  }

  const sanitized: Record<string, any> = { ...record };

  for (const [field, access] of Object.entries(effectiveFieldAccess)) {
    if (access === 'HIDDEN') {
      delete sanitized[field];
      hiddenFields.add(field);
    } else if (access === 'READ_ONLY') {
      readOnlyFields.add(field);
    }
  }

  return {
    sanitizedRecord: sanitized as T,
    hiddenFields: Array.from(hiddenFields),
    readOnlyFields: Array.from(readOnlyFields),
  };
}

/**
 * Validates whether an update payload attempts to modify fields marked READ_ONLY or HIDDEN
 */
export function validateFieldUpdatePermissions(
  updates: Record<string, any>,
  userRoles: string[],
  policies: FieldSecurityPolicy[],
  targetEntity: string
): { isAllowed: boolean; violatedFields: string[] } {
  const violatedFields: string[] = [];

  const relevantPolicies = policies.filter(
    (p) => userRoles.includes(p.role) && p.targetEntity === targetEntity
  );

  for (const field of Object.keys(updates)) {
    for (const policy of relevantPolicies) {
      const access = policy.fieldPolicies[field];
      if (access === 'READ_ONLY' || access === 'HIDDEN') {
        violatedFields.push(field);
        break;
      }
    }
  }

  return {
    isAllowed: violatedFields.length === 0,
    violatedFields,
  };
}
