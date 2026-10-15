/**
 * @universal-plm/industry-capabilities
 * Capability Registry Engine & Tenant Plugin Contracts
 */

export type IndustryPackId =
  | 'discrete-automotive'
  | 'electronics-pcb'
  | 'process-chemical'
  | 'medical-device'
  | 'configured-products';

export interface IndustryCapabilityManifest {
  id: IndustryPackId;
  name: string;
  version: string;
  description: string;
  industrySector: string;
  complianceStandards: string[];
  features: string[];
  requiredPartAttributes?: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'enum';
    required: boolean;
    options?: string[];
  }>;
}

export interface TenantCapabilitySubscription {
  tenantId: string;
  packId: IndustryPackId;
  enabled: boolean;
  installedVersion: string;
  installedAt: string;
  configuredSettings: Record<string, unknown>;
}

export class CapabilityRegistry {
  private static registeredPacks = new Map<IndustryPackId, IndustryCapabilityManifest>();
  private static tenantSubscriptions = new Map<string, Map<IndustryPackId, TenantCapabilitySubscription>>();

  /**
   * Register a new or updated industry capability package
   */
  public static registerPack(manifest: IndustryCapabilityManifest): void {
    this.registeredPacks.set(manifest.id, manifest);
  }

  /**
   * Get all registered industry capability manifests
   */
  public static getAvailablePacks(): IndustryCapabilityManifest[] {
    return Array.from(this.registeredPacks.values());
  }

  /**
   * Look up a specific capability pack
   */
  public static getPack(id: IndustryPackId): IndustryCapabilityManifest | undefined {
    return this.registeredPacks.get(id);
  }

  /**
   * Install an industry capability pack for a tenant
   */
  public static installPack(
    tenantId: string,
    packId: IndustryPackId,
    settings: Record<string, unknown> = {}
  ): TenantCapabilitySubscription {
    const pack = this.registeredPacks.get(packId);
    if (!pack) {
      throw new Error(`Capability pack '${packId}' is not registered on the platform`);
    }

    if (!this.tenantSubscriptions.has(tenantId)) {
      this.tenantSubscriptions.set(tenantId, new Map());
    }

    const tenantPacks = this.tenantSubscriptions.get(tenantId)!;
    const subscription: TenantCapabilitySubscription = {
      tenantId,
      packId,
      enabled: true,
      installedVersion: pack.version,
      installedAt: new Date().toISOString(),
      configuredSettings: settings
    };

    tenantPacks.set(packId, subscription);
    return subscription;
  }

  /**
   * Toggle enable / disable of an installed pack for a tenant
   */
  public static togglePack(
    tenantId: string,
    packId: IndustryPackId,
    enabled: boolean
  ): TenantCapabilitySubscription {
    const tenantPacks = this.tenantSubscriptions.get(tenantId);
    const sub = tenantPacks?.get(packId);
    if (!sub) {
      throw new Error(`Pack '${packId}' is not installed for tenant '${tenantId}'`);
    }

    sub.enabled = enabled;
    return sub;
  }

  /**
   * Upgrade an installed capability pack to a newer registered version
   */
  public static upgradePack(
    tenantId: string,
    packId: IndustryPackId,
    targetVersion?: string
  ): TenantCapabilitySubscription {
    const pack = this.registeredPacks.get(packId);
    if (!pack) {
      throw new Error(`Capability pack '${packId}' is not registered`);
    }

    const tenantPacks = this.tenantSubscriptions.get(tenantId);
    const sub = tenantPacks?.get(packId);
    if (!sub) {
      throw new Error(`Pack '${packId}' is not installed for tenant '${tenantId}'`);
    }

    const newVersion = targetVersion || pack.version;
    sub.installedVersion = newVersion;
    return sub;
  }

  /**
   * List all capability subscriptions for a tenant
   */
  public static getTenantSubscriptions(tenantId: string): TenantCapabilitySubscription[] {
    const tenantPacks = this.tenantSubscriptions.get(tenantId);
    if (!tenantPacks) return [];
    return Array.from(tenantPacks.values());
  }

  /**
   * Check if a specific pack is enabled for a tenant
   */
  public static isPackEnabled(tenantId: string, packId: IndustryPackId): boolean {
    const sub = this.tenantSubscriptions.get(tenantId)?.get(packId);
    return Boolean(sub && sub.enabled);
  }

  /**
   * Validate part metadata against all active industry capability packs installed for the tenant
   */
  public static validatePart(
    tenantId: string,
    partCustomFields: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const activeSubs = this.getTenantSubscriptions(tenantId).filter((s) => s.enabled);

    for (const sub of activeSubs) {
      const manifest = this.getPack(sub.packId);
      if (!manifest || !manifest.requiredPartAttributes) continue;

      for (const attr of manifest.requiredPartAttributes) {
        if (attr.required && (partCustomFields[attr.name] === undefined || partCustomFields[attr.name] === null || partCustomFields[attr.name] === '')) {
          errors.push(`[${manifest.name}] Missing required attribute: '${attr.label}' (${attr.name})`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear all registrations & subscriptions (used for clean testing)
   */
  public static reset(): void {
    this.registeredPacks.clear();
    this.tenantSubscriptions.clear();
  }
}
