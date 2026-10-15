export type StandardRole =
  | 'PLATFORM_ADMIN'
  | 'TENANT_ADMIN'
  | 'LEAD_ENGINEER'
  | 'DESIGN_ENGINEER'
  | 'MANUFACTURING_ENGINEER'
  | 'QUALITY_INSPECTOR'
  | 'AUDITOR'
  | 'READ_ONLY_VIEWER';

export const Permissions = {
  // Part Master
  PART_CREATE: 'part:create',
  PART_READ: 'part:read',
  PART_UPDATE: 'part:update',
  PART_DELETE: 'part:delete',

  // BOM Management
  BOM_READ: 'bom:read',
  BOM_EDIT: 'bom:edit',
  BOM_EXPLODE: 'bom:explode',

  // Revision & Change Management
  REVISION_CREATE: 'revision:create',
  REVISION_RELEASE: 'revision:release',
  ECO_CREATE: 'eco:create',
  ECO_APPROVE: 'eco:approve',
  ECO_REJECT: 'eco:reject',

  // Configuration
  CONFIG_MANAGE: 'config:manage',
  TENANT_MANAGE: 'tenant:manage',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const RolePermissionMatrix: Record<StandardRole, Permission[]> = {
  PLATFORM_ADMIN: Object.values(Permissions),
  TENANT_ADMIN: Object.values(Permissions),
  LEAD_ENGINEER: [
    Permissions.PART_CREATE,
    Permissions.PART_READ,
    Permissions.PART_UPDATE,
    Permissions.BOM_READ,
    Permissions.BOM_EDIT,
    Permissions.BOM_EXPLODE,
    Permissions.REVISION_CREATE,
    Permissions.REVISION_RELEASE,
    Permissions.ECO_CREATE,
    Permissions.ECO_APPROVE,
    Permissions.ECO_REJECT,
  ],
  DESIGN_ENGINEER: [
    Permissions.PART_CREATE,
    Permissions.PART_READ,
    Permissions.PART_UPDATE,
    Permissions.BOM_READ,
    Permissions.BOM_EDIT,
    Permissions.BOM_EXPLODE,
    Permissions.REVISION_CREATE,
    Permissions.ECO_CREATE,
  ],
  MANUFACTURING_ENGINEER: [
    Permissions.PART_READ,
    Permissions.BOM_READ,
    Permissions.BOM_EXPLODE,
    Permissions.ECO_CREATE,
    Permissions.ECO_APPROVE,
  ],
  QUALITY_INSPECTOR: [
    Permissions.PART_READ,
    Permissions.BOM_READ,
    Permissions.ECO_APPROVE,
  ],
  AUDITOR: [
    Permissions.PART_READ,
    Permissions.BOM_READ,
    Permissions.BOM_EXPLODE,
  ],
  READ_ONLY_VIEWER: [
    Permissions.PART_READ,
    Permissions.BOM_READ,
  ],
};
