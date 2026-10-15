/**
 * @universal-plm/enterprise-scale
 * Metered SaaS Billing & Subscription Entitlement Engine
 * Supports Self-Service Onboarding, Usage Tracking, and Resource Quotas
 */

export type SubscriptionPlanTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface PlanEntitlements {
  tier: SubscriptionPlanTier;
  monthlyPriceUsd: number;
  maxUsers: number; // -1 for unlimited
  maxParts: number;
  maxMonthlyEcos: number;
  maxStorageGb: number;
  maxApiRequestsPerHour: number;
  allowedFeatures: string[];
}

export const PLAN_TIERS: Record<SubscriptionPlanTier, PlanEntitlements> = {
  STARTER: {
    tier: 'STARTER',
    monthlyPriceUsd: 299,
    maxUsers: 5,
    maxParts: 500,
    maxMonthlyEcos: 20,
    maxStorageGb: 5,
    maxApiRequestsPerHour: 1000,
    allowedFeatures: [
      'PART_MASTER',
      'EBOM_MANAGEMENT',
      'BASIC_ECO_WORKFLOW',
      'DOCUMENT_VAULT'
    ]
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    monthlyPriceUsd: 999,
    maxUsers: 25,
    maxParts: 10000,
    maxMonthlyEcos: 250,
    maxStorageGb: 100,
    maxApiRequestsPerHour: 25000,
    allowedFeatures: [
      'PART_MASTER',
      'EBOM_MANAGEMENT',
      'BASIC_ECO_WORKFLOW',
      'DOCUMENT_VAULT',
      'MBOM_ROUTINGS',
      'WORK_CENTERS',
      'AML_AVL_SOURCING',
      'DYNAMIC_CUSTOM_FIELDS',
      'FIELD_LEVEL_SECURITY',
      'BULK_CSV_IMPORTER'
    ]
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    monthlyPriceUsd: 2999,
    maxUsers: -1, // Unlimited
    maxParts: -1, // Unlimited
    maxMonthlyEcos: -1, // Unlimited
    maxStorageGb: 2000,
    maxApiRequestsPerHour: 500000,
    allowedFeatures: [
      'PART_MASTER',
      'EBOM_MANAGEMENT',
      'BASIC_ECO_WORKFLOW',
      'DOCUMENT_VAULT',
      'MBOM_ROUTINGS',
      'WORK_CENTERS',
      'AML_AVL_SOURCING',
      'DYNAMIC_CUSTOM_FIELDS',
      'FIELD_LEVEL_SECURITY',
      'BULK_CSV_IMPORTER',
      'INDUSTRY_PACKS_ALL',
      'CAD_CONNECTOR_SDK',
      'HIGH_VOLUME_BOM_CACHE',
      'DISASTER_RECOVERY_EXPORTS',
      'DEDICATED_APP_SAIL'
    ]
  }
};

export interface TenantUsageMetrics {
  tenantId: string;
  activeUsers: number;
  totalParts: number;
  monthlyEcosIssued: number;
  storageUsedGb: number;
  apiRequestsThisHour: number;
}

export interface QuotaEvaluationResult {
  tenantId: string;
  tier: SubscriptionPlanTier;
  isWithinQuotas: boolean;
  violations: string[];
  warnings: string[];
  utilizationPercentages: {
    users: number;
    parts: number;
    ecos: number;
    storage: number;
    api: number;
  };
}

/**
 * Evaluates tenant real-time resource usage against their subscription plan limits
 */
export function evaluateTenantQuotas(
  usage: TenantUsageMetrics,
  tier: SubscriptionPlanTier
): QuotaEvaluationResult {
  const plan = PLAN_TIERS[tier];
  const violations: string[] = [];
  const warnings: string[] = [];

  const calcUtil = (current: number, max: number): number => {
    if (max <= 0) return 0; // unlimited
    return Math.round((current / max) * 100);
  };

  const userUtil = calcUtil(usage.activeUsers, plan.maxUsers);
  const partsUtil = calcUtil(usage.totalParts, plan.maxParts);
  const ecosUtil = calcUtil(usage.monthlyEcosIssued, plan.maxMonthlyEcos);
  const storageUtil = calcUtil(usage.storageUsedGb, plan.maxStorageGb);
  const apiUtil = calcUtil(usage.apiRequestsThisHour, plan.maxApiRequestsPerHour);

  // Check violations & warnings
  if (plan.maxUsers > 0 && usage.activeUsers > plan.maxUsers) {
    violations.push(`Active users count (${usage.activeUsers}) exceeds plan limit (${plan.maxUsers})`);
  } else if (userUtil >= 80) {
    warnings.push(`Active users at ${userUtil}% of quota`);
  }

  if (plan.maxParts > 0 && usage.totalParts > plan.maxParts) {
    violations.push(`Total parts (${usage.totalParts}) exceeds plan limit (${plan.maxParts})`);
  } else if (partsUtil >= 80) {
    warnings.push(`Parts storage at ${partsUtil}% of quota`);
  }

  if (plan.maxMonthlyEcos > 0 && usage.monthlyEcosIssued > plan.maxMonthlyEcos) {
    violations.push(`Monthly ECO velocity (${usage.monthlyEcosIssued}) exceeds plan limit (${plan.maxMonthlyEcos})`);
  }

  if (usage.storageUsedGb > plan.maxStorageGb) {
    violations.push(`Document vault storage (${usage.storageUsedGb} GB) exceeds plan limit (${plan.maxStorageGb} GB)`);
  } else if (storageUtil >= 80) {
    warnings.push(`Document vault storage at ${storageUtil}% of quota`);
  }

  if (usage.apiRequestsThisHour > plan.maxApiRequestsPerHour) {
    violations.push(`API rate limit exceeded (${usage.apiRequestsThisHour} req/hr > ${plan.maxApiRequestsPerHour} req/hr)`);
  }

  return {
    tenantId: usage.tenantId,
    tier,
    isWithinQuotas: violations.length === 0,
    violations,
    warnings,
    utilizationPercentages: {
      users: userUtil,
      parts: partsUtil,
      ecos: ecosUtil,
      storage: storageUtil,
      api: apiUtil
    }
  };
}

/**
 * Checks if a specific platform capability feature is entitled under the tenant plan
 */
export function isFeatureEntitled(tier: SubscriptionPlanTier, featureCode: string): boolean {
  const plan = PLAN_TIERS[tier];
  return plan.allowedFeatures.includes(featureCode) || plan.allowedFeatures.includes('INDUSTRY_PACKS_ALL');
}
