/**
 * Phase 4: Cross-Domain Capabilities (Manufacturing & Supply Chain)
 * Tests EBOM-to-MBOM transformation, reconciliations, routings & work centers,
 * AML/AVL sourcing, multi-level cost rollups, lead time critical path, and ERP sync.
 */

import { describe, it, expect } from 'vitest';
import type { BomLine } from '@universal-plm/domain-core';
import {
  transformEbomToMbom,
  reconcileEbomMbom,
  calculateRoutingCost,
  selectOptimalSupplier,
  calculateCostRollup,
  calculateCumulativeLeadTime,
  createErpSyncEvent,
} from '../packages/manufacturing/src/index.js';
import type {
  WorkCenter,
  ManufacturingRouting,
  AmlEntry,
  AvlEntry,
  ManufacturerPart,
  OptimalSourcingDecision,
} from '../packages/manufacturing/src/index.js';

describe('Phase 4: Manufacturing & Cross-Domain Capabilities', () => {
  const tenantId = 'tenant_aerospace_01';
  const plantId = 'PLANT-DETROIT-01';
  const parentPartId = 'ROB-1000';

  const mockEbomLines: BomLine[] = [
    {
      id: 'ebom-01',
      tenantId,
      parentRevisionId: 'REV-ROB-1000-A',
      childPartId: 'ROB-1010', // Precision Harmonic Servo Actuator
      quantity: 6,
      uom: 'EA',
      bomType: 'EBOM',
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
    },
    {
      id: 'ebom-02',
      tenantId,
      parentRevisionId: 'REV-ROB-1000-A',
      childPartId: 'PCB-4001', // Multi-Axis Motor Controller PCB
      quantity: 2,
      uom: 'EA',
      bomType: 'EBOM',
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
    },
    {
      id: 'ebom-03',
      tenantId,
      parentRevisionId: 'REV-ROB-1000-A',
      childPartId: 'STR-7001', // Carbon Fiber Linkage Arm
      quantity: 3,
      uom: 'EA',
      bomType: 'EBOM',
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
    },
  ];

  // 1. EBOM to MBOM Transformation (C01, C07)
  describe('C01 & C07: EBOM-to-MBOM Transformation & Multi-Facility Overrides', () => {
    it('transforms EBOM to MBOM and injects plant-specific consumables', () => {
      const mbom = transformEbomToMbom(mockEbomLines, {
        tenantId,
        plantId,
        parentPartId,
        consumables: [
          {
            componentPartId: 'CNS-GREASE-400',
            quantity: 0.5,
            uom: 'KG',
            operationSeq: 20,
            notes: 'High-temp synthetic gearbox grease',
          },
          {
            componentPartId: 'CNS-SHIPPING-BOX',
            quantity: 1,
            uom: 'EA',
            operationSeq: 40,
            notes: 'Reinforced pallet shipping crate',
          },
        ],
      });

      expect(mbom).toHaveLength(5);
      expect(mbom[0].componentPartId).toBe('ROB-1010');
      expect(mbom[0].plantId).toBe(plantId);
      expect(mbom[0].isManufacturingOnly).toBe(false);

      const greaseLine = mbom.find((m) => m.componentPartId === 'CNS-GREASE-400');
      expect(greaseLine).toBeDefined();
      expect(greaseLine?.isManufacturingOnly).toBe(true);
      expect(greaseLine?.operationSeq).toBe(20);
    });

    it('identifies unconsumed items and quantity mismatches during reconciliation', () => {
      // Create an incomplete MBOM missing STR-7001 and with modified qty on PCB-4001
      const incompleteMbom = [
        {
          id: 'm1',
          tenantId,
          plantId,
          parentPartId,
          componentPartId: 'ROB-1010',
          quantity: 6,
          uom: 'EA',
          findNumber: 10,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'm2',
          tenantId,
          plantId,
          parentPartId,
          componentPartId: 'PCB-4001',
          quantity: 1, // Discrepancy: EBOM requires 2
          uom: 'EA',
          findNumber: 20,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const report = reconcileEbomMbom(mockEbomLines, incompleteMbom, plantId, parentPartId);

      expect(report.isFullyReconciled).toBe(false);
      expect(report.unconsumedEbomCount).toBe(1); // STR-7001 is missing
      expect(report.discrepancies.some((d) => d.componentPartId === 'STR-7001' && d.status === 'UNCONSUMED')).toBe(true);
      expect(report.discrepancies.some((d) => d.componentPartId === 'PCB-4001' && d.status === 'QUANTITY_MISMATCH')).toBe(true);
    });
  });

  // 2. Manufacturing Routings, Operations & Work Centers (C02, C03)
  describe('C02 & C03: Manufacturing Routings & Work Centers Costing', () => {
    const workCenters: WorkCenter[] = [
      {
        id: 'wc-cnc',
        tenantId,
        plantId,
        code: 'WC-CNC-01',
        name: '5-Axis CNC Machining Cell',
        department: 'MACHINING',
        hourlyRate: 120.0,
        capacityHoursPerDay: 16.0,
        efficiencyFactor: 0.9,
        isActive: true,
      },
      {
        id: 'wc-assy',
        tenantId,
        plantId,
        code: 'WC-ASSY-01',
        name: 'Robotic Arm Electro-Mechanical Assembly',
        department: 'ASSEMBLY',
        hourlyRate: 75.0,
        capacityHoursPerDay: 8.0,
        efficiencyFactor: 0.95,
        isActive: true,
      },
    ];

    const routing: ManufacturingRouting = {
      id: 'rtg-rob-1000',
      tenantId,
      plantId,
      partId: 'ROB-1000',
      revisionId: 'REV-ROB-1000-A',
      name: 'Primary Robotic Arm Final Assembly & Test Routing',
      status: 'ACTIVE',
      version: '1.0',
      operations: [
        {
          id: 'op-10',
          routingId: 'rtg-rob-1000',
          operationNumber: 10,
          name: 'Precision Joint Base Machining',
          workCenterId: 'wc-cnc',
          setupTimeMinutes: 60,
          runTimePerUnitMinutes: 30,
          laborCount: 1,
        },
        {
          id: 'op-20',
          routingId: 'rtg-rob-1000',
          operationNumber: 20,
          name: 'Harmonic Drive & Motor Wiring Assembly',
          workCenterId: 'wc-assy',
          setupTimeMinutes: 30,
          runTimePerUnitMinutes: 45,
          laborCount: 2, // 2 operators
        },
      ],
      createdAt: '',
      updatedAt: '',
    };

    it('calculates total setup and run labor cost across routing operations', () => {
      const batchSize = 50;
      const result = calculateRoutingCost(routing, workCenters, batchSize);

      expect(result.totalSetupMinutes).toBe(90);
      expect(result.totalRunMinutesPerUnit).toBe(75);
      expect(result.totalSetupCost).toBeGreaterThan(0);
      expect(result.totalLaborCostPerUnit).toBeCloseTo(result.runCostPerUnit + result.setupCostPerUnit, 1);
      expect(result.operationBreakdown).toHaveLength(2);
      expect(result.operationBreakdown[0].workCenterCode).toBe('WC-CNC-01');
    });
  });

  // 3. Sourcing: AML & AVL (C04, C05, C06)
  describe('C05 & C06: Approved Manufacturer (AML) & Approved Vendor (AVL) Selection', () => {
    const mpnMap = new Map<string, ManufacturerPart>([
      [
        'mpn-ti-01',
        {
          id: 'mpn-ti-01',
          tenantId,
          manufacturerName: 'Texas Instruments',
          mpn: 'OPA2197IDR',
          description: 'Precision Op-Amp',
          rohsStatus: 'COMPLIANT',
          lifecycleStatus: 'ACTIVE',
        },
      ],
      [
        'mpn-adi-02',
        {
          id: 'mpn-adi-02',
          tenantId,
          manufacturerName: 'Analog Devices',
          mpn: 'ADA4077-2ARZ',
          description: 'Dual Low Noise Precision Amplifier',
          rohsStatus: 'COMPLIANT',
          lifecycleStatus: 'ACTIVE',
        },
      ],
    ]);

    const amlList: AmlEntry[] = [
      {
        id: 'aml-1',
        tenantId,
        internalPartId: 'ELC-0052',
        manufacturerPartId: 'mpn-ti-01',
        preference: 'PREFERRED',
        qualificationStatus: 'QUALIFIED',
      },
      {
        id: 'aml-2',
        tenantId,
        internalPartId: 'ELC-0052',
        manufacturerPartId: 'mpn-adi-02',
        preference: 'APPROVED',
        qualificationStatus: 'QUALIFIED',
      },
    ];

    const avlList: AvlEntry[] = [
      {
        id: 'avl-1',
        tenantId,
        internalPartId: 'ELC-0052',
        supplierId: 'SUP-DIGIKEY',
        manufacturerPartId: 'mpn-adi-02',
        vendorPartNumber: 'ADA4077-2ARZ-ND',
        unitPrice: 3.2,
        minimumOrderQty: 10,
        leadTimeDays: 7,
        preference: 'SECONDARY',
        isContractedPrice: false,
      },
      {
        id: 'avl-2',
        tenantId,
        internalPartId: 'ELC-0052',
        supplierId: 'SUP-ARROW',
        manufacturerPartId: 'mpn-ti-01',
        vendorPartNumber: 'OPA2197IDR-ARROW',
        unitPrice: 2.15,
        minimumOrderQty: 100,
        leadTimeDays: 14,
        preference: 'PRIMARY',
        isContractedPrice: true,
      },
    ];

    it('selects PRIMARY qualified supplier and lowest contracted unit price', () => {
      const decision = selectOptimalSupplier('ELC-0052', amlList, avlList, mpnMap);

      expect(decision).toBeDefined();
      expect(decision?.selectedSupplierId).toBe('SUP-ARROW');
      expect(decision?.selectedMpn).toBe('OPA2197IDR');
      expect(decision?.unitPrice).toBe(2.15);
      expect(decision?.preference).toBe('PRIMARY');
    });
  });

  // 4. Multi-Level Cost Rollups (C09)
  describe('C09: Multi-Level Cost Rollups with Variance Reporting', () => {
    it('aggregates material, labor, and consumables into total unit cost', () => {
      const mbomLines = transformEbomToMbom(mockEbomLines, {
        tenantId,
        plantId,
        parentPartId,
        consumables: [
          {
            componentPartId: 'CNS-GREASE-400',
            quantity: 1,
            uom: 'KG',
            operationSeq: 20,
            notes: 'Lubricant',
          },
        ],
      });

      const sourcingDecisions = new Map<string, OptimalSourcingDecision>([
        [
          'ROB-1010',
          {
            internalPartId: 'ROB-1010',
            selectedSupplierId: 'SUP-HARMONIC',
            selectedMpn: 'CSG-20-100',
            unitPrice: 850.0,
            leadTimeDays: 45,
            moq: 1,
            preference: 'PRIMARY',
            qualificationStatus: 'QUALIFIED',
          },
        ],
        [
          'PCB-4001',
          {
            internalPartId: 'PCB-4001',
            selectedSupplierId: 'SUP-SANMINA',
            selectedMpn: 'PCB-4001-ASSY',
            unitPrice: 180.0,
            leadTimeDays: 21,
            moq: 5,
            preference: 'PRIMARY',
            qualificationStatus: 'QUALIFIED',
          },
        ],
        [
          'STR-7001',
          {
            internalPartId: 'STR-7001',
            selectedSupplierId: 'SUP-TORAY',
            selectedMpn: 'CF-ARM-LINK-70',
            unitPrice: 220.0,
            leadTimeDays: 30,
            moq: 10,
            preference: 'PRIMARY',
            qualificationStatus: 'QUALIFIED',
          },
        ],
        [
          'CNS-GREASE-400',
          {
            internalPartId: 'CNS-GREASE-400',
            selectedSupplierId: 'SUP-MOBIL',
            selectedMpn: 'MOBILITH-SHC-460',
            unitPrice: 35.0,
            leadTimeDays: 3,
            moq: 1,
            preference: 'PRIMARY',
            qualificationStatus: 'QUALIFIED',
          },
        ],
      ]);

      const targetCost = 6500.0;
      const rollup = calculateCostRollup({
        parentPartId,
        plantId,
        mbomLines,
        sourcingDecisions,
        targetCost,
      });

      // Expected Material: 6 * 850 (5100) + 2 * 180 (360) + 3 * 220 (660) = 6120
      // Consumables: 1 * 35 = 35
      // Total = 6155
      expect(rollup.totalMaterialCost).toBe(6120);
      expect(rollup.totalConsumableCost).toBe(35);
      expect(rollup.totalUnitCost).toBe(6155);
      expect(rollup.targetCost).toBe(6500);
      expect(rollup.costVariance).toBe(-345); // Under target budget!
      expect(rollup.variancePercentage).toBe(-5.31);
    });
  });

  // 5. Cumulative Lead Time Analysis (C10)
  describe('C10: Cumulative Lead Time Analysis & Procurement Bottlenecks', () => {
    it('identifies critical path procurement bottleneck component', () => {
      const sourcingDecisions = new Map<string, OptimalSourcingDecision>([
        ['PCB-4001', { internalPartId: 'PCB-4001', selectedSupplierId: 'SUP-SANMINA', selectedMpn: 'PCB-ASSY', unitPrice: 180, leadTimeDays: 21, moq: 1, preference: 'PRIMARY', qualificationStatus: 'QUALIFIED' }],
        ['ROB-1010', { internalPartId: 'ROB-1010', selectedSupplierId: 'SUP-HARMONIC', selectedMpn: 'HARMONIC-ACT', unitPrice: 850, leadTimeDays: 60, moq: 1, preference: 'PRIMARY', qualificationStatus: 'QUALIFIED' }],
        ['STR-7001', { internalPartId: 'STR-7001', selectedSupplierId: 'SUP-TORAY', selectedMpn: 'CF-ARM', unitPrice: 220, leadTimeDays: 30, moq: 1, preference: 'PRIMARY', qualificationStatus: 'QUALIFIED' }],
      ]);

      const leadTime = calculateCumulativeLeadTime({
        parentPartId,
        sourcingDecisions,
      });

      expect(leadTime.longestProcurementLeadTimeDays).toBe(60);
      expect(leadTime.procurementBottleneckPartId).toBe('ROB-1010');
      expect(leadTime.procurementBottleneckMpn).toBe('HARMONIC-ACT');
      expect(leadTime.criticalPathItems[0].partId).toBe('ROB-1010');
    });
  });

  // 6. ERP/MRP Synchronization Outbox (C12)
  describe('C12: ERP/MRP Synchronization Outbox Event Creation', () => {
    it('creates deterministic, idempotent outbox sync event for external ERP', () => {
      const outboxEvent = createErpSyncEvent({
        tenantId,
        plantId,
        entityType: 'MBOM',
        entityId: 'MBOM-ROB-1000-DETROIT',
        eventType: 'RELEASED',
        targetSystem: 'SAP',
        payload: {
          materialNumber: 'ROB-1000',
          plant: '1001',
          bomUsage: '1',
          validFrom: '2026-10-15',
        },
      });

      expect(outboxEvent.id).toMatch(/^OUTBOX-\d+-[a-f0-9]{8}$/);
      expect(outboxEvent.status).toBe('PENDING');
      expect(outboxEvent.targetSystem).toBe('SAP');
      expect(outboxEvent.idempotencyKey).toBeDefined();
      expect(outboxEvent.idempotencyKey.length).toBe(64);
    });
  });
});
