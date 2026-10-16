export type IndustryPack =
  | 'DISCRETE_MANUFACTURING'
  | 'ELECTRONICS_PCB'
  | 'PROCESS_FORMULATION'
  | 'REGULATED_MEDICAL'
  | 'CONFIGURED_PRODUCTS';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  primaryIndustry?: IndustryPack;
  customAttributes?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CapabilityConfig {
  id: string;
  tenantId: string;
  pack: IndustryPack;
  version: string;
  isEnabled: boolean;
  settings: Record<string, unknown>;
  activatedAt: string;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  roles: string[];
  permissions: string[];
  activeCapabilities: IndustryPack[];
}
