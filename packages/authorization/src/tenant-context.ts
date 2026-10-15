import { TenantContext } from '@universal-plm/domain-core';
import { Permission, RolePermissionMatrix, StandardRole } from './roles.js';

export class TenantAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantAuthorizationError';
  }
}

export class TenantIsolationViolationError extends Error {
  constructor(attemptedTenantId: string, authorizedTenantId: string) {
    super(
      `Tenant Isolation Violation: Attempted access to tenant '${attemptedTenantId}' from authorized session '${authorizedTenantId}'`
    );
    this.name = 'TenantIsolationViolationError';
  }
}

/**
 * Asserts that a record's tenant matches the currently authorized session tenant.
 */
export function assertTenantMatch(
  recordTenantId: string,
  context: TenantContext
): void {
  if (!context.tenantId) {
    throw new TenantAuthorizationError('Unauthenticated: Missing tenant context in active session.');
  }
  if (recordTenantId !== context.tenantId) {
    throw new TenantIsolationViolationError(recordTenantId, context.tenantId);
  }
}

/**
 * Checks if the caller in the given TenantContext possesses the required permission.
 */
export function hasPermission(
  context: TenantContext,
  requiredPermission: Permission
): boolean {
  // If user permissions explicitly include it
  if (context.permissions.includes(requiredPermission)) {
    return true;
  }

  // Check roles assigned to user
  for (const role of context.roles) {
    const rolePerms = RolePermissionMatrix[role as StandardRole];
    if (rolePerms && rolePerms.includes(requiredPermission)) {
      return true;
    }
  }

  return false;
}

/**
 * Asserts that the caller has the required permission, throwing an error if unauthorized.
 */
export function assertPermission(
  context: TenantContext,
  requiredPermission: Permission
): void {
  if (!hasPermission(context, requiredPermission)) {
    throw new TenantAuthorizationError(
      `Forbidden: User '${context.userId}' in tenant '${context.tenantId}' lacks permission '${requiredPermission}'`
    );
  }
}
