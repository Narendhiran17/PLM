/**
 * @universal-plm/industry-capabilities
 * Pack: Configured & Project Products (IND-05)
 * Standards: ETO/CTO Modular BOM, Product Configuration Logic
 */

import { IndustryCapabilityManifest } from '../registry/capability-registry.js';

export type ConfigurationRuleType = 'REQUIRES' | 'EXCLUDES' | 'DEFAULT';

export interface ConfigurationOption {
  optionCode: string;
  name: string;
  priceDelta: number;
}

export interface ConfigurationFeature {
  featureCode: string;
  name: string;
  required: boolean;
  options: ConfigurationOption[];
}

export interface ConfigurationRule {
  id: string;
  ruleType: ConfigurationRuleType;
  ifSelectedOption: string; // e.g. "VOLT-480V"
  targetOption: string; // e.g. "MOTOR-10HP"
  errorMessage: string;
}

export interface ModularBomLine {
  id: string;
  componentPartId: string;
  componentName: string;
  quantity: number;
  assignedOptionCodes: string[]; // Option codes that trigger this BOM line
}

export interface ProductConfiguratorModel {
  basePartId: string;
  modelName: string;
  features: ConfigurationFeature[];
  rules: ConfigurationRule[];
  modularBom: ModularBomLine[];
}

export interface ResolvedConfigurationResult {
  valid: boolean;
  configCode: string;
  totalPriceDelta: number;
  ruleViolations: string[];
  resolvedBomLines: Array<{
    componentPartId: string;
    componentName: string;
    quantity: number;
    triggeredByOption: string;
  }>;
}

/**
 * Resolves customer configuration selections against a 150% Super BOM,
 * enforcing constraint rules (REQUIRES, EXCLUDES) and producing a 100% configured BOM.
 */
export function resolveConfiguredBom(
  model: ProductConfiguratorModel,
  selectedOptionCodes: string[]
): ResolvedConfigurationResult {
  const selectedSet = new Set(selectedOptionCodes);
  const ruleViolations: string[] = [];

  // 1. Evaluate constraint rules
  for (const rule of model.rules) {
    if (selectedSet.has(rule.ifSelectedOption)) {
      if (rule.ruleType === 'REQUIRES') {
        if (!selectedSet.has(rule.targetOption)) {
          ruleViolations.push(rule.errorMessage);
        }
      } else if (rule.ruleType === 'EXCLUDES') {
        if (selectedSet.has(rule.targetOption)) {
          ruleViolations.push(rule.errorMessage);
        }
      }
    }
  }

  // 2. Compute price delta
  let totalPriceDelta = 0;
  for (const feature of model.features) {
    for (const opt of feature.options) {
      if (selectedSet.has(opt.optionCode)) {
        totalPriceDelta += opt.priceDelta;
      }
    }
  }

  // 3. Resolve 100% BOM lines
  const resolvedBomLines: Array<{
    componentPartId: string;
    componentName: string;
    quantity: number;
    triggeredByOption: string;
  }> = [];

  for (const bomLine of model.modularBom) {
    const match = bomLine.assignedOptionCodes.find((opt) => selectedSet.has(opt));
    if (match) {
      resolvedBomLines.push({
        componentPartId: bomLine.componentPartId,
        componentName: bomLine.componentName,
        quantity: bomLine.quantity,
        triggeredByOption: match
      });
    }
  }

  const sortedOpts = [...selectedOptionCodes].sort();
  const configCode = `${model.basePartId}-[${sortedOpts.join('-')}]`;

  return {
    valid: ruleViolations.length === 0,
    configCode,
    totalPriceDelta,
    ruleViolations,
    resolvedBomLines
  };
}

export const CONFIGURED_PRODUCTS_MANIFEST: IndustryCapabilityManifest = {
  id: 'configured-products',
  name: 'Configured Products & Engineer-to-Order (ETO) Pack',
  version: '1.4.0',
  description: '150% modular Super-BOMs, constraint rule validation (Requires/Excludes), and automated dynamic configured BOM generation.',
  industrySector: 'Custom Machinery, Equipment & Modular Systems',
  complianceStandards: ['ETO / CTO Modular Architecture', 'ISO 9001 Product Realization'],
  features: [
    'Feature and option matrix definition with dynamic pricing',
    'Interactive constraint rule solver (Requires / Excludes)',
    '100% configured BOM generation from 150% modular BOM master',
    'Configured product SKU and nomenclature synthesizer'
  ],
  requiredPartAttributes: [
    { name: 'configModelType', label: 'Configuration Model Type', type: 'enum', required: false, options: ['Standard', 'Modular', 'Engineer-To-Order'] }
  ]
};
