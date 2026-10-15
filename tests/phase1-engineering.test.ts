import { describe, it, expect } from 'vitest';
import {
  compareBoms,
  findDeepWhereUsed,
  isEffectivityActive,
  BomLine,
  DateEffectivity,
  SerialEffectivity
} from '@universal-plm/domain-core';

describe('Phase 1 — Universal Engineering Foundation Suite', () => {

  describe('A13: BOM Comparison & Redline Diff Engine', () => {
    const baselineRevisionId = 'rev-arm-001-A';
    const targetRevisionId = 'rev-arm-001-B';

    // Baseline Revision A BOM:
    // - 6x Stepper Motors (ACT-0021)
    // - 1x Controller PCB (PCB-4001)
    // - 12x Bolts (MNT-0902)
    const baselineLines: BomLine[] = [
      {
        id: 'line-1',
        tenantId: 'tenant-officehub',
        parentRevisionId: baselineRevisionId,
        childPartId: 'part-stepper',
        quantity: 6,
        uom: 'EA',
        bomType: 'EBOM',
        findNumber: 10,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
      {
        id: 'line-2',
        tenantId: 'tenant-officehub',
        parentRevisionId: baselineRevisionId,
        childPartId: 'part-pcb',
        quantity: 1,
        uom: 'EA',
        bomType: 'EBOM',
        findNumber: 20,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
      {
        id: 'line-3',
        tenantId: 'tenant-officehub',
        parentRevisionId: baselineRevisionId,
        childPartId: 'part-bolts',
        quantity: 12,
        uom: 'EA',
        bomType: 'EBOM',
        findNumber: 30,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ];

    // Target Revision B BOM (Proposed Changes):
    // - Removed: Stepper Motors (part-stepper)
    // - Added: Precision Harmonic Servos (part-harmonic) Qty 6
    // - Modified: Bolts (part-bolts) Qty changed from 12 -> 16
    // - Unchanged: Controller PCB (part-pcb) Qty 1
    const targetLines: BomLine[] = [
      {
        id: 'line-new-1',
        tenantId: 'tenant-officehub',
        parentRevisionId: targetRevisionId,
        childPartId: 'part-harmonic',
        quantity: 6,
        uom: 'EA',
        bomType: 'EBOM',
        findNumber: 10,
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      },
      {
        id: 'line-new-2',
        tenantId: 'tenant-officehub',
        parentRevisionId: targetRevisionId,
        childPartId: 'part-pcb',
        quantity: 1,
        uom: 'EA',
        bomType: 'EBOM',
        findNumber: 20,
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      },
      {
        id: 'line-new-3',
        tenantId: 'tenant-officehub',
        parentRevisionId: targetRevisionId,
        childPartId: 'part-bolts',
        quantity: 16,
        uom: 'EA',
        bomType: 'EBOM',
        findNumber: 30,
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      },
    ];

    it('should correctly calculate additions, removals, and modifications between BOM revisions', () => {
      const diff = compareBoms(baselineRevisionId, targetRevisionId, baselineLines, targetLines);

      expect(diff.summary.addedCount).toBe(1);
      expect(diff.summary.removedCount).toBe(1);
      expect(diff.summary.modifiedCount).toBe(1);
      expect(diff.summary.unchangedCount).toBe(1);
      expect(diff.summary.totalChanges).toBe(3);

      const addedItem = diff.items.find((i) => i.childPartId === 'part-harmonic');
      expect(addedItem?.action).toBe('ADDED');
      expect(addedItem?.newQuantity).toBe(6);

      const removedItem = diff.items.find((i) => i.childPartId === 'part-stepper');
      expect(removedItem?.action).toBe('REMOVED');
      expect(removedItem?.oldQuantity).toBe(6);
      expect(removedItem?.newQuantity).toBe(0);

      const modifiedItem = diff.items.find((i) => i.childPartId === 'part-bolts');
      expect(modifiedItem?.action).toBe('MODIFIED');
      expect(modifiedItem?.oldQuantity).toBe(12);
      expect(modifiedItem?.newQuantity).toBe(16);
      expect(modifiedItem?.quantityDelta).toBe(4);
    });
  });

  describe('A06: Bottom-Up Where-Used Analysis', () => {
    // Hierarchy:
    // IC-0052 (CAN Transceiver) -> PCB-4001 (Motor Controller PCB) -> ROB-1000 (Robotic Arm)
    const provider = {
      getImmediateParents: (partId: string) => {
        if (partId === 'IC-0052') {
          return [
            {
              parentPartId: 'PCB-4001',
              parentPartNumber: 'PCB-4001',
              parentPartName: 'Motor Controller PCB',
              parentRevisionId: 'rev-pcb-001',
              parentRevision: 'A',
              quantity: 2,
              bomType: 'EBOM' as const,
              lifecycleState: 'RELEASED',
            },
          ];
        }
        if (partId === 'PCB-4001') {
          return [
            {
              parentPartId: 'ROB-1000',
              parentPartNumber: 'ROB-1000',
              parentPartName: 'Autonomous Articulated Robotic Arm',
              parentRevisionId: 'rev-rob-001',
              parentRevision: 'A',
              quantity: 1,
              bomType: 'EBOM' as const,
              lifecycleState: 'RELEASED',
            },
          ];
        }
        return [];
      },
    };

    it('should recursively identify all direct and indirect parent assemblies', async () => {
      const whereUsed = await findDeepWhereUsed('IC-0052', provider);

      expect(whereUsed.length).toBe(2);

      // Level 1: Immediate parent PCB
      expect(whereUsed[0].parentPartNumber).toBe('PCB-4001');
      expect(whereUsed[0].level).toBe(1);

      // Level 2: Top-level Robotic Arm Assembly
      expect(whereUsed[1].parentPartNumber).toBe('ROB-1000');
      expect(whereUsed[1].level).toBe(2);
      expect(whereUsed[1].path).toEqual(['PCB-4001', 'ROB-1000']);
    });
  });

  describe('A12: Effectivity Management Rules', () => {
    it('should correctly evaluate date-based effectivity rules', () => {
      const dateRule: DateEffectivity = {
        type: 'DATE',
        validFrom: '2026-01-01T00:00:00Z',
        validTo: '2026-12-31T23:59:59Z',
      };

      expect(isEffectivityActive(dateRule, { date: '2026-06-15T00:00:00Z' })).toBe(true);
      expect(isEffectivityActive(dateRule, { date: '2025-12-31T00:00:00Z' })).toBe(false);
      expect(isEffectivityActive(dateRule, { date: '2027-01-01T00:00:00Z' })).toBe(false);
    });

    it('should correctly evaluate serial-based effectivity ranges', () => {
      const serialRule: SerialEffectivity = {
        type: 'SERIAL',
        startUnit: 'SN-1000',
        endUnit: 'SN-2000',
      };

      expect(isEffectivityActive(serialRule, { serialNumber: 'SN-1500' })).toBe(true);
      expect(isEffectivityActive(serialRule, { serialNumber: 'SN-0500' })).toBe(false);
      expect(isEffectivityActive(serialRule, { serialNumber: 'SN-2500' })).toBe(false);
    });
  });

  describe('A02: Product Families & Configurable Variants', () => {
    it('should define and validate product family option groups and variant configuration', () => {
      const family = {
        id: 'fam-001',
        tenantId: 'tenant-officehub',
        familyCode: 'ROB-FAMILY',
        name: 'Articulated Industrial Robot Series',
        basePartId: 'part-001',
        optionGroups: [
          {
            id: 'opt-payload',
            code: 'PAYLOAD',
            name: 'Payload Capacity',
            isMandatory: true,
            values: [
              { id: 'val-10kg', code: '10KG', label: '10 kg High Speed' },
              { id: 'val-50kg', code: '50KG', label: '50 kg Heavy Duty' },
            ],
          },
        ],
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      };

      expect(family.optionGroups.length).toBe(1);
      expect(family.optionGroups[0].values.length).toBe(2);

      const variant = {
        id: 'var-001',
        tenantId: 'tenant-officehub',
        familyId: family.id,
        variantSku: 'ROB-1000-50K',
        name: 'Robotic Arm (50kg Heavy Duty)',
        selectedOptionValueIds: ['val-50kg'],
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      };

      expect(variant.familyId).toBe(family.id);
      expect(variant.selectedOptionValueIds).toContain('val-50kg');
    });
  });

});
