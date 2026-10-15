import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractEbomFromCadAssembly,
  syncCadPropertiesToPlm,
  CadAssemblyNode,
  HighVolumeBomEngine,
  evaluateTenantQuotas,
  isFeatureEntitled,
  PLAN_TIERS,
  createTenantBackupArchive,
  validateBackupArchiveForRestore
} from '../packages/enterprise-scale/src/index.js';

describe('Phase 6: Enterprise Maturity, CAD SDK, High-Volume Caching & SaaS Scale', () => {
  describe('CAD Connector SDK & Bi-Directional Synchronization', () => {
    it('extracts multi-level EBOM structure from a native CAD assembly node tree', () => {
      const cadAssembly: CadAssemblyNode = {
        nodeId: 'cad-root',
        cadSystem: 'SOLIDWORKS',
        fileName: 'ROBOTIC_ARM_ASM.SLDASM',
        partNumber: 'ROB-1000',
        revision: '2.0',
        title: '6-Axis Articulated Robotic Arm Assembly',
        material: 'Aluminum 7075-T6',
        massKg: 42.5,
        quantity: 1,
        children: [
          {
            nodeId: 'cad-child-1',
            cadSystem: 'SOLIDWORKS',
            fileName: 'BASE_PEDESTAL.SLDPRT',
            partNumber: 'ROB-1001',
            revision: '1.2',
            title: 'Cast Iron Heavy Base Pedestal',
            material: 'Cast Iron Grade 65-45-12',
            massKg: 18.0,
            quantity: 1
          },
          {
            nodeId: 'cad-child-2',
            cadSystem: 'SOLIDWORKS',
            fileName: 'HARMONIC_DRIVE_J1.SLDASM',
            partNumber: 'ROB-1010',
            revision: '2.1',
            title: 'J1 Axis Harmonic Servo Actuator',
            material: 'Alloy Steel 4340',
            massKg: 6.4,
            quantity: 1,
            children: [
              {
                nodeId: 'cad-sub-1',
                cadSystem: 'SOLIDWORKS',
                fileName: 'WAVE_GENERATOR.SLDPRT',
                partNumber: 'ROB-1011',
                revision: 'A',
                title: 'Elliptical Wave Generator Cam',
                material: 'Tool Steel D2',
                massKg: 0.85,
                quantity: 1
              },
              {
                nodeId: 'cad-sub-2',
                cadSystem: 'SOLIDWORKS',
                fileName: 'FLEXSPLINE_CUP.SLDPRT',
                partNumber: 'ROB-1012',
                revision: 'B',
                title: 'Thin-Walled Flexspline Cup',
                material: 'Stainless Steel 17-4 PH',
                massKg: 1.15,
                quantity: 1
              }
            ]
          }
        ]
      };

      const extracted = extractEbomFromCadAssembly(cadAssembly);
      expect(extracted.rootPartId).toBe('PART-CAD-ROB-1000');
      expect(extracted.totalUniqueParts).toBe(5);
      expect(extracted.totalBomLines).toBe(4);

      // Verify root parts mapping
      const rootPart = extracted.parts.find((p) => p.partNumber === 'ROB-1000');
      expect(rootPart?.weightGrams).toBe(42500);
      expect(rootPart?.cadSystem).toBe('SOLIDWORKS');
      expect(rootPart?.cadSourceFile).toBe('ROBOTIC_ARM_ASM.SLDASM');

      // Verify parent-child lines
      const j1Lines = extracted.bomLines.filter((l) => l.parentPartId === 'PART-CAD-ROB-1010');
      expect(j1Lines.length).toBe(2);
      expect(j1Lines.map((l) => l.childPartId)).toContain('PART-CAD-ROB-1011');
      expect(j1Lines.map((l) => l.childPartId)).toContain('PART-CAD-ROB-1012');
    });

    it('detects changes when synchronizing updated CAD model properties to PLM records', () => {
      const cadPart: CadAssemblyNode = {
        nodeId: 'node-01',
        cadSystem: 'AUTODESK_INVENTOR',
        fileName: 'ROBOTIC_WRIST.IPT',
        partNumber: 'ROB-1050',
        revision: '3.0',
        title: 'High-Torque Articulated Wrist Casting',
        material: 'Titanium Ti-6Al-4V',
        massKg: 3.25,
        quantity: 1
      };

      const existingPlmPart = {
        name: 'Articulated Wrist Casting',
        revision: '2.0',
        customFields: {
          material: 'Aluminum 6061-T6',
          weightGrams: 2800
        }
      };

      const syncResult = syncCadPropertiesToPlm(cadPart, existingPlmPart);
      expect(syncResult.hasChanges).toBe(true);
      expect(syncResult.delta.name).toEqual({
        before: 'Articulated Wrist Casting',
        after: 'High-Torque Articulated Wrist Casting'
      });
      expect(syncResult.delta.material).toEqual({
        before: 'Aluminum 6061-T6',
        after: 'Titanium Ti-6Al-4V'
      });
      expect(syncResult.delta.weightGrams).toEqual({
        before: 2800,
        after: 3250
      });
    });
  });

  describe('TST-07: High-Volume BOM Explosion & Caching Performance', () => {
    let engine: HighVolumeBomEngine;

    beforeEach(() => {
      engine = new HighVolumeBomEngine();
    });

    it('traverses a multi-thousand-line BOM structure in sub-50ms', () => {
      // Generate a synthetic tree: depth 4, branching factor 8 -> ~4,680 lines
      engine.generateSyntheticBenchmarkTree('ROOT-TURBINE-ENG', 4, 8);

      const result = engine.explodeBom('ROOT-TURBINE-ENG');
      expect(result.totalLinesTraversed).toBeGreaterThan(4000);
      expect(result.totalMaterialCost).toBeGreaterThan(0);
      expect(result.maxCriticalLeadTimeDays).toBeGreaterThan(0);

      // Verify sub-50ms benchmark requirement (TST-07)
      expect(result.traversalDurationMs).toBeLessThan(50);
    });

    it('benefits from memoized sub-assembly caching on repeated or multi-use explosions', () => {
      engine.generateSyntheticBenchmarkTree('ROOT-AIRCRAFT-WING', 3, 6);

      // First run primes cache
      const run1 = engine.explodeBom('ROOT-AIRCRAFT-WING');
      expect(run1.totalLinesTraversed).toBeGreaterThan(200);

      // Second run benefits from memoized subassembly cache
      const run2 = engine.explodeBom('ROOT-AIRCRAFT-WING');
      expect(run2.totalLinesTraversed).toBe(run1.totalLinesTraversed);
      expect(run2.totalMaterialCost).toBe(run1.totalMaterialCost);
      expect(run2.cacheHitRatio).toBeGreaterThan(0);
    });

    it('detects cyclic loops and throws protective exception', () => {
      engine.loadLines([
        { parentPartId: 'PART-A', childPartId: 'PART-B', quantity: 1, unitCost: 10, leadTimeDays: 2 },
        { parentPartId: 'PART-B', childPartId: 'PART-C', quantity: 2, unitCost: 5, leadTimeDays: 3 },
        { parentPartId: 'PART-C', childPartId: 'PART-A', quantity: 1, unitCost: 20, leadTimeDays: 1 } // Cycle!
      ]);

      expect(() => engine.explodeBom('PART-A')).toThrowError(/cyclic dependency loop detected/);
    });
  });

  describe('Metered SaaS Billing & Entitlements (F08, COM-04)', () => {
    it('accurately evaluates usage against Starter, Pro, and Enterprise quotas', () => {
      // Starter plan test: exceeded parts and users
      const usageStarter = {
        tenantId: 'tenant_startup_01',
        activeUsers: 8, // limit is 5
        totalParts: 650, // limit is 500
        monthlyEcosIssued: 12, // limit is 20
        storageUsedGb: 3, // limit is 5
        apiRequestsThisHour: 450 // limit is 1000
      };

      const evalStarter = evaluateTenantQuotas(usageStarter, 'STARTER');
      expect(evalStarter.isWithinQuotas).toBe(false);
      expect(evalStarter.violations.length).toBe(2);
      expect(evalStarter.violations[0]).toContain('Active users count (8) exceeds plan limit (5)');
      expect(evalStarter.violations[1]).toContain('Total parts (650) exceeds plan limit (500)');

      // Pro plan test: perfectly within limits with warning on storage (85%)
      const usagePro = {
        tenantId: 'tenant_midmarket_01',
        activeUsers: 18, // limit is 25
        totalParts: 4500, // limit is 10000
        monthlyEcosIssued: 110, // limit is 250
        storageUsedGb: 85, // limit is 100 (85% warning)
        apiRequestsThisHour: 5000 // limit is 25000
      };

      const evalPro = evaluateTenantQuotas(usagePro, 'PROFESSIONAL');
      expect(evalPro.isWithinQuotas).toBe(true);
      expect(evalPro.violations.length).toBe(0);
      expect(evalPro.warnings).toContain('Document vault storage at 85% of quota');

      // Enterprise plan: unlimited users, parts, and ECOs
      const usageEnterprise = {
        tenantId: 'tenant_fortune500',
        activeUsers: 1200,
        totalParts: 850000,
        monthlyEcosIssued: 4500,
        storageUsedGb: 500,
        apiRequestsThisHour: 80000
      };

      const evalEnterprise = evaluateTenantQuotas(usageEnterprise, 'ENTERPRISE');
      expect(evalEnterprise.isWithinQuotas).toBe(true);
      expect(evalEnterprise.violations.length).toBe(0);
    });

    it('enforces feature gating per subscription tier', () => {
      expect(isFeatureEntitled('STARTER', 'PART_MASTER')).toBe(true);
      expect(isFeatureEntitled('STARTER', 'CAD_CONNECTOR_SDK')).toBe(false);
      expect(isFeatureEntitled('STARTER', 'INDUSTRY_PACKS_ALL')).toBe(false);

      expect(isFeatureEntitled('PROFESSIONAL', 'MBOM_ROUTINGS')).toBe(true);
      expect(isFeatureEntitled('PROFESSIONAL', 'CAD_CONNECTOR_SDK')).toBe(false);

      expect(isFeatureEntitled('ENTERPRISE', 'CAD_CONNECTOR_SDK')).toBe(true);
      expect(isFeatureEntitled('ENTERPRISE', 'HIGH_VOLUME_BOM_CACHE')).toBe(true);
      expect(isFeatureEntitled('ENTERPRISE', 'DISASTER_RECOVERY_EXPORTS')).toBe(true);
    });
  });

  describe('TST-08: Disaster Recovery & Cryptographic Backup Verification', () => {
    it('creates a point-in-time tenant backup archive with SHA-256 verification checksum', () => {
      const payload = {
        parts: [
          { id: 'PART-001', partNumber: 'PN-001', name: 'Main Chassis', revision: 'A' },
          { id: 'PART-002', partNumber: 'PN-002', name: 'Power Supply', revision: '1.0' }
        ],
        bomLines: [
          { parentPartId: 'PART-001', childPartId: 'PART-002', quantity: 1 }
        ],
        ecos: [
          { id: 'ECO-001', ecoNumber: 'ECO-2026-001', title: 'Initial Baseline Release', stage: 'effective' }
        ],
        documents: [
          { id: 'DOC-001', docNumber: 'DOC-SPEC-001', title: 'System Specs', file: 'spec.pdf' }
        ]
      };

      const archive = createTenantBackupArchive('tenant_corp_alpha', payload);
      expect(archive.archiveId).toContain('BKP-tenant_corp_alpha');
      expect(archive.sha256Checksum).toHaveLength(64);
      expect(archive.partsCount).toBe(2);
      expect(archive.bomLinesCount).toBe(1);

      // Verify legitimate restore passes validation
      const validation = validateBackupArchiveForRestore(archive, 'tenant_corp_alpha');
      expect(validation.valid).toBe(true);
      expect(validation.checksumMatches).toBe(true);
      expect(validation.brokenReferences.length).toBe(0);
    });

    it('detects tampering or corrupted payload via SHA-256 validation failure', () => {
      const payload = {
        parts: [{ id: 'PART-001', partNumber: 'PN-001', name: 'Chassis', revision: 'A' }],
        bomLines: [],
        ecos: [],
        documents: []
      };

      const archive = createTenantBackupArchive('tenant_tamper_test', payload);

      // Maliciously tamper with archive payload
      archive.payload.parts.push({
        id: 'PART-HACKED',
        partNumber: 'PN-EXPLOIT',
        name: 'Injected Component',
        revision: 'X'
      });

      const validation = validateBackupArchiveForRestore(archive, 'tenant_tamper_test');
      expect(validation.valid).toBe(false);
      expect(validation.checksumMatches).toBe(false);
      expect(validation.errors).toContain(
        'Integrity failure: Archive SHA-256 checksum mismatch (corrupted or tampered payload)'
      );
    });

    it('detects broken referential integrity on restore when BOM line references non-existent parts', () => {
      const payload = {
        parts: [{ id: 'PART-001', partNumber: 'PN-001', name: 'Chassis', revision: 'A' }],
        bomLines: [
          { parentPartId: 'PART-001', childPartId: 'PART-MISSING-GHOST', quantity: 2 } // Missing child!
        ],
        ecos: [],
        documents: []
      };

      const archive = createTenantBackupArchive('tenant_ref_test', payload);
      const validation = validateBackupArchiveForRestore(archive, 'tenant_ref_test');

      expect(validation.valid).toBe(false);
      expect(validation.checksumMatches).toBe(true);
      expect(validation.brokenReferences.length).toBe(1);
      expect(validation.brokenReferences[0]).toContain("BOM line references non-existent child part: 'PART-MISSING-GHOST'");
    });
  });
});
