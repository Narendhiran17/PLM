/**
 * @universal-plm/industry-capabilities
 * Unified Industry Capability Framework
 */

export * from './registry/capability-registry.js';
export * from './packs/discrete-automotive.js';
export * from './packs/electronics-pcb.js';
export * from './packs/process-chemical.js';
export * from './packs/medical-device.js';
export * from './packs/configured-products.js';

import { CapabilityRegistry } from './registry/capability-registry.js';
import { DISCRETE_AUTOMOTIVE_MANIFEST } from './packs/discrete-automotive.js';
import { ELECTRONICS_PCB_MANIFEST } from './packs/electronics-pcb.js';
import { PROCESS_CHEMICAL_MANIFEST } from './packs/process-chemical.js';
import { MEDICAL_DEVICE_MANIFEST } from './packs/medical-device.js';
import { CONFIGURED_PRODUCTS_MANIFEST } from './packs/configured-products.js';

/**
 * Bootstrap the platform with all five built-in industry capability packages
 */
export function registerAllStandardIndustryPacks(): void {
  CapabilityRegistry.registerPack(DISCRETE_AUTOMOTIVE_MANIFEST);
  CapabilityRegistry.registerPack(ELECTRONICS_PCB_MANIFEST);
  CapabilityRegistry.registerPack(PROCESS_CHEMICAL_MANIFEST);
  CapabilityRegistry.registerPack(MEDICAL_DEVICE_MANIFEST);
  CapabilityRegistry.registerPack(CONFIGURED_PRODUCTS_MANIFEST);
}
