import { describe, it, expect, beforeEach } from 'vitest';
import {
  CapabilityRegistry,
  registerAllStandardIndustryPacks,
  DISCRETE_AUTOMOTIVE_MANIFEST,
  ELECTRONICS_PCB_MANIFEST,
  PROCESS_CHEMICAL_MANIFEST,
  MEDICAL_DEVICE_MANIFEST,
  CONFIGURED_PRODUCTS_MANIFEST,
  createDefaultPpapSubmission,
  evaluatePpapStatus,
  expandReferenceDesignators,
  validatePcbDesignators,
  scaleFormulationBatch,
  FormulationRecipe,
  validateDhfReadiness,
  DhfPackage,
  resolveConfiguredBom,
  ProductConfiguratorModel
} from '../packages/industry-capabilities/src/index.js';

describe('Phase 5: Industry Capability Framework (IND-01 to IND-05)', () => {
  beforeEach(() => {
    CapabilityRegistry.reset();
    registerAllStandardIndustryPacks();
  });

  describe('Capability Registry & Tenant Plugin Lifecycle', () => {
    it('registers all 5 standard industry packs with semver and manifests', () => {
      const packs = CapabilityRegistry.getAvailablePacks();
      expect(packs.length).toBe(5);

      const packIds = packs.map((p) => p.id);
      expect(packIds).toContain('discrete-automotive');
      expect(packIds).toContain('electronics-pcb');
      expect(packIds).toContain('process-chemical');
      expect(packIds).toContain('medical-device');
      expect(packIds).toContain('configured-products');
    });

    it('installs and activates an industry pack for a specific tenant without cross-tenant bleed', () => {
      const tenantA = 'tenant_medical_corp';
      const tenantB = 'tenant_automotive_inc';

      CapabilityRegistry.installPack(tenantA, 'medical-device');
      CapabilityRegistry.installPack(tenantB, 'discrete-automotive');

      expect(CapabilityRegistry.isPackEnabled(tenantA, 'medical-device')).toBe(true);
      expect(CapabilityRegistry.isPackEnabled(tenantA, 'discrete-automotive')).toBe(false);

      expect(CapabilityRegistry.isPackEnabled(tenantB, 'discrete-automotive')).toBe(true);
      expect(CapabilityRegistry.isPackEnabled(tenantB, 'medical-device')).toBe(false);
    });

    it('supports toggle enable/disable and version upgrades without schema drift', () => {
      const tenantId = 'tenant_aerospace';
      CapabilityRegistry.installPack(tenantId, 'electronics-pcb');

      const toggled = CapabilityRegistry.togglePack(tenantId, 'electronics-pcb', false);
      expect(toggled.enabled).toBe(false);
      expect(CapabilityRegistry.isPackEnabled(tenantId, 'electronics-pcb')).toBe(false);

      const upgraded = CapabilityRegistry.upgradePack(tenantId, 'electronics-pcb', '2.5.0');
      expect(upgraded.installedVersion).toBe('2.5.0');
    });

    it('enforces required part metadata fields specified by active capability packs', () => {
      const tenantId = 'tenant_medical_devices';
      CapabilityRegistry.installPack(tenantId, 'medical-device');

      // Missing required attributes 'deviceClass' and 'iso14971RiskCategory'
      const check1 = CapabilityRegistry.validatePart(tenantId, { description: 'Syringe pump' });
      expect(check1.valid).toBe(false);
      expect(check1.errors.length).toBe(2);

      // Supply required attributes
      const check2 = CapabilityRegistry.validatePart(tenantId, {
        description: 'Syringe pump',
        deviceClass: 'Class II',
        iso14971RiskCategory: 'Medium Risk - Non-Invasive Active'
      });
      expect(check2.valid).toBe(true);
      expect(check2.errors.length).toBe(0);
    });
  });

  describe('IND-01: Discrete Manufacturing & Automotive Pack (PPAP, Traceability)', () => {
    it('creates AIAG 18-element PPAP submission and accurately evaluates completion status', () => {
      const submission = createDefaultPpapSubmission(
        'tenant_auto',
        'PART-TRANSMISSION-01',
        'REV-A',
        'SUPPLIER-BOSCH',
        3
      );

      expect(submission.elements.length).toBe(18);
      expect(submission.level).toBe(3);

      const evalInitial = evaluatePpapStatus(submission);
      expect(evalInitial.isComplete).toBe(false);
      expect(evalInitial.completionPercentage).toBe(0);
      expect(evalInitial.canApprove).toBe(false);

      // Complete elements and sign PSW
      submission.elements.forEach((e) => {
        e.status = 'completed';
      });
      submission.pswSigned = true;
      submission.imdsMdsId = 'IMDS-MDS-9876543';

      const evalComplete = evaluatePpapStatus(submission);
      expect(evalComplete.isComplete).toBe(true);
      expect(evalComplete.completionPercentage).toBe(100);
      expect(evalComplete.canApprove).toBe(true);
    });
  });

  describe('IND-02: Electronics & PCB Pack (Ref Designators, Footprints)', () => {
    it('expands reference designator ranges correctly', () => {
      const raw = 'C1-C5, C8, R10-R12, U1, Q2';
      const expanded = expandReferenceDesignators(raw);

      expect(expanded).toEqual([
        'C1', 'C2', 'C3', 'C4', 'C5',
        'C8',
        'R10', 'R11', 'R12',
        'U1',
        'Q2'
      ]);
      expect(expanded.length).toBe(11);
    });

    it('detects quantity mismatches and duplicate designators across PCB BOM lines', () => {
      const lines = [
        {
          lineId: 'LINE-01',
          componentPartId: 'PART-CAP-10UF',
          quantity: 3,
          rawDesignators: 'C1-C2' // Qty is 3 but only 2 designators
        },
        {
          lineId: 'LINE-02',
          componentPartId: 'PART-RES-10K',
          quantity: 2,
          rawDesignators: 'R1, C2' // Duplicate C2 reused!
        }
      ];

      const validation = validatePcbDesignators(lines);
      expect(validation.valid).toBe(false);
      expect(validation.quantityMismatches.length).toBe(1);
      expect(validation.quantityMismatches[0].lineQty).toBe(3);
      expect(validation.quantityMismatches[0].designatorCount).toBe(2);

      expect(validation.duplicateDesignators.length).toBe(1);
      expect(validation.duplicateDesignators[0].designator).toBe('C2');
      expect(validation.duplicateDesignators[0].lineIds).toEqual(['LINE-01', 'LINE-02']);
    });
  });

  describe('IND-03: Process & Chemical Pack (Formulations, Potency, Yield)', () => {
    it('scales recipe batch and compensates active ingredient potency with excipient balance', () => {
      const recipe: FormulationRecipe = {
        id: 'RECIPE-IBUPROFEN-200MG',
        tenantId: 'tenant_pharma',
        recipeCode: 'RCP-IBU-200',
        productPartId: 'PART-IBU-TABLET',
        standardBatchSizeKg: 100,
        expectedLossPercentage: 2.0, // 2% loss
        ingredients: [
          {
            ingredientPartId: 'ING-API-IBU',
            ingredientName: 'Ibuprofen Micronized API',
            targetPercentage: 40, // 40%
            isApi: true,
            basePotencyPercent: 100,
            actualPotencyPercent: 95 // Tested lower potency
          },
          {
            ingredientPartId: 'ING-EXC-MCC',
            ingredientName: 'Microcrystalline Cellulose (Filler)',
            targetPercentage: 55, // 55%
            isApi: false,
            isCompensatingFiller: true
          },
          {
            ingredientPartId: 'ING-LUB-MAG',
            ingredientName: 'Magnesium Stearate',
            targetPercentage: 5, // 5%
            isApi: false
          }
        ]
      };

      const scaled = scaleFormulationBatch(recipe, 1000); // 1,000 kg batch
      expect(scaled.requestedBatchSizeKg).toBe(1000);
      expect(scaled.theoreticalYieldKg).toBe(1000);
      expect(scaled.expectedActualYieldKg).toBe(980); // 1000 - 2%
      expect(scaled.yieldEfficiencyPercent).toBe(98);

      // Raw API at 40% = 400kg. With 95% potency factor (100/95 = 1.05263):
      // Adjusted API should be ~421.05 kg
      const apiLine = scaled.lines.find((l) => l.ingredientPartId === 'ING-API-IBU');
      expect(apiLine?.adjustedWeightKg).toBeCloseTo(421.05, 1);

      // Filler was 550kg, minus delta ~21.05kg = ~528.95kg
      const fillerLine = scaled.lines.find((l) => l.ingredientPartId === 'ING-EXC-MCC');
      expect(fillerLine?.adjustedWeightKg).toBeCloseTo(528.95, 1);

      // Lubricant remains exactly 50kg
      const lubLine = scaled.lines.find((l) => l.ingredientPartId === 'ING-LUB-MAG');
      expect(lubLine?.adjustedWeightKg).toBe(50);
    });
  });

  describe('IND-04: Medical Device & Life Sciences Pack (DHF, DMR, Traceability)', () => {
    it('validates 21 CFR 820 Design History File completeness and traceability matrix', () => {
      const dhf: DhfPackage = {
        id: 'dhf-infusion-pump',
        tenantId: 'tenant_med',
        devicePartId: 'PART-INFUSION-PUMP-01',
        deviceRevisionId: 'REV-B',
        deviceClassification: 'Class II',
        iso14971RiskFileId: 'RISK-FILE-IP-001',
        dmrCompiled: false,
        items: [
          { id: '1', section: 'design_inputs', title: 'Flow Rate Spec', documentRefId: 'DOC-DI-01', revision: 'A', status: 'approved' },
          { id: '2', section: 'design_outputs', title: 'Motor Driver PCB Schematics', documentRefId: 'DOC-DO-01', revision: 'B', status: 'approved' },
          { id: '3', section: 'design_verification', title: 'Flow Accuracy Test Protocol', documentRefId: 'DOC-DV-01', revision: 'A', status: 'approved' },
          { id: '4', section: 'design_validation', title: 'Clinical Usability Validation Report', documentRefId: 'DOC-VAL-01', revision: 'A', status: 'approved' },
          { id: '5', section: 'risk_management', title: 'FMEA Risk Analysis', documentRefId: 'DOC-RM-01', revision: 'B', status: 'approved' },
          { id: '6', section: 'design_transfer', title: 'Manufacturing Transfer Checklist', documentRefId: 'DOC-DT-01', revision: 'A', status: 'approved' }
          // Missing 'design_reviews'
        ],
        traceabilityMatrix: [
          {
            userNeedId: 'UN-01',
            userNeedText: 'Accurate delivery of medication at low flow rates',
            designInputId: 'DI-01',
            designInputText: 'Flow rate must remain within ±2% between 0.1 and 100 mL/hr',
            designOutputPartId: 'PART-PERISTALTIC-PUMP-REV-B',
            verificationProtocolId: 'TP-FLOW-ACCURACY-001',
            testPassed: true
          }
        ]
      };

      const readiness1 = validateDhfReadiness(dhf);
      expect(readiness1.isCompliant).toBe(false);
      expect(readiness1.missingSections).toContain('design_reviews');

      // Supply design reviews and compile DMR
      dhf.items.push({
        id: '7',
        section: 'design_reviews',
        title: 'Phase Gate 5 Final Design Review',
        documentRefId: 'DOC-DR-05',
        revision: 'A',
        status: 'approved'
      });
      dhf.dmrCompiled = true;

      const readiness2 = validateDhfReadiness(dhf);
      expect(readiness2.isCompliant).toBe(true);
      expect(readiness2.missingSections.length).toBe(0);
      expect(readiness2.unverifiedInputs.length).toBe(0);
    });
  });

  describe('IND-05: Configured Products Pack (Modular BOM, Rules Solver)', () => {
    it('solves modular BOM rules, checks constraints, and generates configured BOM', () => {
      const model: ProductConfiguratorModel = {
        basePartId: 'MTR-PUMP-GEN3',
        modelName: 'Industrial Slurry Pump Gen 3',
        features: [
          {
            featureCode: 'POWER',
            name: 'Power Input',
            required: true,
            options: [
              { optionCode: 'PWR-120V', name: '120V 1-Phase', priceDelta: 0 },
              { optionCode: 'PWR-480V', name: '480V 3-Phase Industrial', priceDelta: 650 }
            ]
          },
          {
            featureCode: 'MOTOR',
            name: 'Motor Size',
            required: true,
            options: [
              { optionCode: 'MTR-5HP', name: '5 HP Standard Duty', priceDelta: 0 },
              { optionCode: 'MTR-15HP', name: '15 HP Severe Duty', priceDelta: 1200 }
            ]
          },
          {
            featureCode: 'ENCLOSURE',
            name: 'Wetted Materials & Enclosure',
            required: true,
            options: [
              { optionCode: 'ENC-CAST', name: 'Cast Iron Standard', priceDelta: 0 },
              { optionCode: 'ENC-SS316', name: '316L Stainless Steel Sanitary', priceDelta: 2400 }
            ]
          }
        ],
        rules: [
          {
            id: 'RULE-01',
            ruleType: 'REQUIRES',
            ifSelectedOption: 'PWR-480V',
            targetOption: 'MTR-15HP',
            errorMessage: '480V 3-Phase power option requires 15 HP Severe Duty motor.'
          },
          {
            id: 'RULE-02',
            ruleType: 'EXCLUDES',
            ifSelectedOption: 'ENC-SS316',
            targetOption: 'MTR-5HP',
            errorMessage: '316L Stainless Steel enclosure cannot be paired with 5 HP motor.'
          }
        ],
        modularBom: [
          { id: 'MBOM-1', componentPartId: 'PART-MTR-15HP-480V', componentName: '15HP Electric Motor', quantity: 1, assignedOptionCodes: ['MTR-15HP'] },
          { id: 'MBOM-2', componentPartId: 'PART-MTR-5HP-120V', componentName: '5HP Electric Motor', quantity: 1, assignedOptionCodes: ['MTR-5HP'] },
          { id: 'MBOM-3', componentPartId: 'PART-VOLUTE-SS316', componentName: '316L Stainless Pump Volute', quantity: 1, assignedOptionCodes: ['ENC-SS316'] },
          { id: 'MBOM-4', componentPartId: 'PART-VOLUTE-CAST', componentName: 'Cast Iron Pump Volute', quantity: 1, assignedOptionCodes: ['ENC-CAST'] }
        ]
      };

      // Test constraint violation: PWR-480V selected without MTR-15HP
      const invalidConfig = resolveConfiguredBom(model, ['PWR-480V', 'MTR-5HP', 'ENC-CAST']);
      expect(invalidConfig.valid).toBe(false);
      expect(invalidConfig.ruleViolations).toContain('480V 3-Phase power option requires 15 HP Severe Duty motor.');

      // Test valid configured product
      const validConfig = resolveConfiguredBom(model, ['PWR-480V', 'MTR-15HP', 'ENC-SS316']);
      expect(validConfig.valid).toBe(true);
      expect(validConfig.ruleViolations.length).toBe(0);
      expect(validConfig.totalPriceDelta).toBe(650 + 1200 + 2400); // 4250
      expect(validConfig.configCode).toBe('MTR-PUMP-GEN3-[ENC-SS316-MTR-15HP-PWR-480V]');
      expect(validConfig.resolvedBomLines.length).toBe(2);
      expect(validConfig.resolvedBomLines.map((b) => b.componentPartId)).toEqual([
        'PART-MTR-15HP-480V',
        'PART-VOLUTE-SS316'
      ]);
    });
  });
});
