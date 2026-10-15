/**
 * @universal-plm/industry-capabilities
 * Pack: Process & Chemical Formulations (IND-03)
 * Standards: OSHA GHS (HazCom 2012), 21 CFR Part 211 (cGMP), REACH SDS
 */

import { IndustryCapabilityManifest } from '../registry/capability-registry.js';

export type GhsPictogram =
  | 'GHS01_Explosive'
  | 'GHS02_Flammable'
  | 'GHS03_Oxidizing'
  | 'GHS04_GasUnderPressure'
  | 'GHS05_Corrosive'
  | 'GHS06_AcuteToxic'
  | 'GHS07_Harmful'
  | 'GHS08_HealthHazard'
  | 'GHS09_Environmental';

export interface FormulationIngredient {
  ingredientPartId: string;
  ingredientName: string;
  casNumber?: string;
  targetPercentage: number; // percentage w/w (0 - 100)
  isApi: boolean; // Active Pharmaceutical Ingredient or active chemical agent
  basePotencyPercent?: number; // e.g. 100%
  actualPotencyPercent?: number; // e.g. 95%
  isCompensatingFiller?: boolean; // Excipient/filler adjusted to balance batch (e.g. Microcrystalline Cellulose or Purified Water)
  ghsPictograms?: GhsPictogram[];
}

export interface FormulationRecipe {
  id: string;
  tenantId: string;
  recipeCode: string;
  productPartId: string;
  standardBatchSizeKg: number;
  expectedLossPercentage: number; // e.g. 1.5% evaporation/filter loss
  ingredients: FormulationIngredient[];
}

export interface ScaledBatchLine {
  ingredientPartId: string;
  ingredientName: string;
  casNumber?: string;
  targetWeightKg: number;
  adjustedWeightKg: number; // adjusted for actual potency
  percentageOfBatch: number;
  isApi: boolean;
}

export interface ScaledBatchResult {
  recipeCode: string;
  requestedBatchSizeKg: number;
  theoreticalYieldKg: number;
  expectedActualYieldKg: number;
  yieldEfficiencyPercent: number;
  lines: ScaledBatchLine[];
  totalIngredientsWeightKg: number;
}

/**
 * Scales a formulation recipe to any target batch size, applying dynamic potency
 * compensation for active ingredients and balancing with designated filler.
 */
export function scaleFormulationBatch(
  recipe: FormulationRecipe,
  targetBatchSizeKg: number
): ScaledBatchResult {
  if (targetBatchSizeKg <= 0) {
    throw new Error('Target batch size must be greater than zero');
  }

  // 1. Calculate raw target weight for each ingredient
  const rawLines = recipe.ingredients.map((ing) => {
    const rawWeight = (targetBatchSizeKg * ing.targetPercentage) / 100;
    return {
      ingredient: ing,
      rawWeight,
      adjustedWeight: rawWeight
    };
  });

  // 2. Adjust API for active potency if specified
  let totalDeltaKg = 0;
  for (const line of rawLines) {
    if (line.ingredient.isApi && line.ingredient.actualPotencyPercent) {
      const basePotency = line.ingredient.basePotencyPercent || 100;
      // If actual is 95% and base is 100%, required weight = rawWeight * (100 / 95)
      const potencyFactor = basePotency / line.ingredient.actualPotencyPercent;
      const compensatedWeight = line.rawWeight * potencyFactor;
      totalDeltaKg += (compensatedWeight - line.rawWeight);
      line.adjustedWeight = compensatedWeight;
    }
  }

  // 3. Compensate filler/excipient if delta occurred
  if (totalDeltaKg !== 0) {
    const filler = rawLines.find((l) => l.ingredient.isCompensatingFiller);
    if (filler) {
      filler.adjustedWeight = Math.max(0, filler.adjustedWeight - totalDeltaKg);
    }
  }

  const lines: ScaledBatchLine[] = rawLines.map((l) => ({
    ingredientPartId: l.ingredient.ingredientPartId,
    ingredientName: l.ingredient.ingredientName,
    casNumber: l.ingredient.casNumber,
    targetWeightKg: Number(l.rawWeight.toFixed(4)),
    adjustedWeightKg: Number(l.adjustedWeight.toFixed(4)),
    percentageOfBatch: Number(((l.adjustedWeight / targetBatchSizeKg) * 100).toFixed(3)),
    isApi: l.ingredient.isApi
  }));

  const totalIngredientsWeightKg = lines.reduce((sum, l) => sum + l.adjustedWeightKg, 0);
  const expectedLoss = (targetBatchSizeKg * recipe.expectedLossPercentage) / 100;
  const expectedActualYieldKg = targetBatchSizeKg - expectedLoss;
  const yieldEfficiencyPercent = Number(((expectedActualYieldKg / targetBatchSizeKg) * 100).toFixed(2));

  return {
    recipeCode: recipe.recipeCode,
    requestedBatchSizeKg: targetBatchSizeKg,
    theoreticalYieldKg: targetBatchSizeKg,
    expectedActualYieldKg: Number(expectedActualYieldKg.toFixed(3)),
    yieldEfficiencyPercent,
    lines,
    totalIngredientsWeightKg: Number(totalIngredientsWeightKg.toFixed(4))
  };
}

export const PROCESS_CHEMICAL_MANIFEST: IndustryCapabilityManifest = {
  id: 'process-chemical',
  name: 'Process, Chemical & Formulation Capability Pack',
  version: '1.5.0',
  description: 'Recipe scaling, potency-compensated API adjustments, theoretical vs. actual batch yields, and GHS chemical hazard tracking.',
  industrySector: 'Chemicals, Pharmaceuticals, Food & Beverage',
  complianceStandards: ['OSHA HazCom GHS', '21 CFR Part 211 (cGMP)', 'REACH Safety Data Sheets (SDS)'],
  features: [
    'Dynamic recipe scaling from lab grams to metric tons',
    'Potency-compensated active ingredient adjustments with excipient balancing',
    'Vessel and reaction yield efficiency calculators',
    'GHS hazard pictograms and CAS registry metadata'
  ],
  requiredPartAttributes: [
    { name: 'casNumber', label: 'CAS Registry Number', type: 'string', required: false },
    { name: 'ghsClassification', label: 'GHS Hazard Class', type: 'string', required: false }
  ]
};
