/**
 * @universal-plm/autonomous-operations
 * Phase 7: AI Copilot, 3D CAD Digital Twin & Zoho Ecosystem Test Suite
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeChangeImpact,
  recommendAlternateParts,
  generateAuditComplianceDossier,
  createSyntheticDigitalTwinAssembly,
  computeExplodedAssemblyTransforms,
  evaluateCrossSectionSlicing,
  syncCrmDealToPlmProject,
  ingestCreatorQualityNcrToPlmEcr,
  formatPlmEcoNotificationForCrm,
  AffectedItemInput,
  InventoryItemInput,
  BomHierarchyLine,
  AlternateCandidate,
  ZohoCrmDealInput,
  ZohoCreatorNcrInput
} from '@universal-plm/autonomous-operations';

describe('Phase 7: AI Copilot & Autonomous PLM Operations', () => {
  it('should accurately calculate scrap financial exposure and blast radius for high-risk ECO', () => {
    const eco = {
      id: 'ECO-2026-901',
      ecoNumber: 'ECO-901',
      title: 'Structural Revision to Main Inverter Chassis and Stator'
    };

    const affectedItems: AffectedItemInput[] = [
      {
        partId: 'PART-CHASSIS-01',
        partNumber: 'CHASSIS-01',
        name: 'Cast Aluminum Chassis Baseplate',
        currentRevision: 'B',
        newRevision: 'C',
        action: 'replace',
        costPerUnit: 145.0,
        leadTimeDays: 45
      },
      {
        partId: 'PART-HEATSINK-01',
        partNumber: 'HEATSINK-01',
        name: 'Extruded Copper Heatsink',
        currentRevision: 'A',
        newRevision: 'B',
        action: 'modify',
        costPerUnit: 62.0,
        leadTimeDays: 15
      }
    ];

    const inventory: InventoryItemInput[] = [
      {
        partId: 'PART-CHASSIS-01',
        onHandQty: 100, // $14,500 scrap
        wipQty: 50,     // 50 * 145 * 0.4 = $2,900 rework
        openPoQty: 200  // $29,000 open PO
      },
      {
        partId: 'PART-HEATSINK-01',
        onHandQty: 300,
        wipQty: 80,     // 80 * 62 * 0.25 = $1,240 rework
        openPoQty: 0
      }
    ];

    const bomLines: BomHierarchyLine[] = [
      {
        parentPartId: 'ASM-1000',
        parentPartNumber: 'ASM-1000-TURBINE',
        childPartId: 'PART-CHASSIS-01',
        childPartNumber: 'CHASSIS-01',
        quantity: 1
      },
      {
        parentPartId: 'ASM-2000',
        parentPartNumber: 'ASM-2000-GENERATOR',
        childPartId: 'PART-CHASSIS-01',
        childPartNumber: 'CHASSIS-01',
        quantity: 1
      }
    ];

    const impact = analyzeChangeImpact(eco, affectedItems, inventory, bomLines);

    expect(impact.ecoNumber).toBe('ECO-901');
    expect(impact.financialExposure.inventoryScrapCost).toBe(14500);
    expect(impact.financialExposure.wipReworkCost).toBe(4140);
    expect(impact.financialExposure.openPoLiability).toBe(29000);
    expect(impact.financialExposure.totalFinancialRisk).toBe(47640);
    expect(impact.blastRadius.impactedParentAssemblies).toContain('ASM-1000-TURBINE');
    expect(impact.blastRadius.impactedParentAssemblies).toContain('ASM-2000-GENERATOR');
    expect(impact.supplyChainBottlenecks.length).toBe(1);
    expect(impact.supplyChainBottlenecks[0].leadTimeDays).toBe(45);
    expect(impact.riskCategory).toBe('HIGH');
    expect(impact.aiRecommendations.length).toBeGreaterThan(0);
  });

  it('should rank alternate components by form-fit-function, cost savings, and supplier status', () => {
    const targetPart = {
      partNumber: 'RES-0402-10K',
      unitCost: 0.15,
      leadTimeDays: 28
    };

    const candidates: AlternateCandidate[] = [
      {
        partId: 'ALT-1',
        partNumber: 'YAGEO-0402-10K',
        name: 'SMD Thick Film Resistor 10k 1%',
        manufacturer: 'Yageo',
        unitCost: 0.11, // -26.7% cheaper
        leadTimeDays: 7, // 21 days faster
        qualificationStatus: 'preferred',
        specifications: { resistance: '10k', tolerance: '1%' }
      },
      {
        partId: 'ALT-2',
        partNumber: 'VISHAY-0402-10K',
        name: 'Precision Thin Film Resistor 10k 0.1%',
        manufacturer: 'Vishay',
        unitCost: 0.45, // +200% expensive
        leadTimeDays: 42,
        qualificationStatus: 'conditional',
        specifications: { resistance: '10k', tolerance: '0.1%' }
      }
    ];

    const result = recommendAlternateParts(targetPart, candidates);

    expect(result.targetPartNumber).toBe('RES-0402-10K');
    expect(result.recommendations.length).toBe(2);
    expect(result.recommendations[0].partNumber).toBe('YAGEO-0402-10K');
    expect(result.recommendations[0].costDeltaPct).toBeLessThan(0);
    expect(result.recommendations[0].suitabilityScore).toBeGreaterThan(result.recommendations[1].suitabilityScore);
    expect(result.recommendations[0].qualificationStatus).toBe('preferred');
  });

  it('should generate a 21 CFR Part 11 compliant audit dossier with electronic signatures', () => {
    const eco = {
      ecoNumber: 'ECO-905',
      title: 'Critical Medical Infusion Pump Valve Firmware and Seal Update',
      category: 'Design Verification & Regulatory Compliance',
      snapshotHash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    const signatures = [
      {
        signerName: 'Dr. Sarah Jenkins',
        signerRole: 'Quality Assurance Director',
        signedAt: '2026-10-15T10:30:00Z',
        quorumResult: 'APPROVED'
      },
      {
        signerName: 'Marcus Vance',
        signerRole: 'Chief Regulatory Officer',
        signedAt: '2026-10-15T11:15:00Z',
        quorumResult: 'APPROVED'
      }
    ];

    const affectedItems: AffectedItemInput[] = [
      {
        partId: 'VALVE-SEAL-01',
        partNumber: 'VALVE-SEAL-01',
        name: 'Silicone Diaphragm Gasket',
        currentRevision: 'A',
        newRevision: 'B',
        action: 'modify',
        costPerUnit: 12.5,
        leadTimeDays: 14
      }
    ];

    const dossier = generateAuditComplianceDossier(eco, signatures, affectedItems);

    expect(dossier.ecoNumber).toBe('ECO-905');
    expect(dossier.digitalSignaturesCount).toBe(2);
    expect(dossier.regulatoryStandard).toContain('21 CFR Part 11');
    expect(dossier.dossierMarkdown).toContain('Dr. Sarah Jenkins');
    expect(dossier.dossierMarkdown).toContain('Marcus Vance');
    expect(dossier.dossierMarkdown).toContain(eco.snapshotHash);
  });
});

describe('Phase 7: 3D CAD Digital Twin & WebGL Assembly Viewer', () => {
  it('should generate synthetic 3D CAD meshes with accurate bounding boxes', () => {
    const assembly = createSyntheticDigitalTwinAssembly('ASM-TURBINE', 'Industrial Wind Turbine Inverter');

    expect(assembly.assemblyId).toBe('DT-ASM-TURBINE');
    expect(assembly.meshes.length).toBe(7);
    expect(assembly.overallBounds.dimensions.x).toBeGreaterThan(0);
    expect(assembly.overallBounds.dimensions.y).toBeGreaterThan(0);
    expect(assembly.overallBounds.dimensions.z).toBeGreaterThan(0);

    const baseMesh = assembly.meshes.find((m) => m.partNumber === 'ASM-TURBINE-BASE');
    expect(baseMesh).toBeDefined();
    expect(baseMesh?.material).toBe('Aluminum 6061-T6');
  });

  it('should interpolate 3D exploded positions proportionally to explode factor', () => {
    const assembly = createSyntheticDigitalTwinAssembly('ASM-TURBINE', 'Industrial Wind Turbine Inverter');

    // Fully assembled (factor = 0)
    const assembled = computeExplodedAssemblyTransforms(assembly.meshes, 0.0);
    for (const mesh of assembled) {
      expect(mesh.currentPosition?.x).toBe(mesh.center.x);
      expect(mesh.currentPosition?.y).toBe(mesh.center.y);
      expect(mesh.currentPosition?.z).toBe(mesh.center.z);
    }

    // Fully exploded (factor = 1.0)
    const exploded = computeExplodedAssemblyTransforms(assembly.meshes, 1.0, 100);
    const coverMesh = exploded.find((m) => m.partNumber === 'ASM-TURBINE-COVER');
    expect(coverMesh).toBeDefined();
    // Explode direction for cover was y = 1.5, center y = 65 -> 65 + 1.5 * 100 = 215
    expect(coverMesh?.currentPosition?.y).toBe(215);
  });

  it('should evaluate cross-section slicing plane and calculate visible volume percentage', () => {
    const assembly = createSyntheticDigitalTwinAssembly('ASM-TURBINE', 'Industrial Wind Turbine Inverter');
    
    // Slice at Y = 0 (intersects baseplate and lower components)
    const slices = evaluateCrossSectionSlicing(assembly.meshes, 'y', 0);
    expect(slices.length).toBe(7);

    // Cover has min Y = 50, so slice at 0 leaves it 100% visible
    const coverSlice = slices.find((s) => s.partNumber === 'ASM-TURBINE-COVER');
    expect(coverSlice?.isSliced).toBe(false);
    expect(coverSlice?.visibleVolumePct).toBe(100);

    // Baseplate has min Y = -20 and max Y = 0, so slice at 0 has 0% remaining above 0
    const baseSlice = slices.find((s) => s.partNumber === 'ASM-TURBINE-BASE');
    expect(baseSlice?.visibleVolumePct).toBe(0);
  });
});

describe('Phase 7: Zoho Ecosystem Connectors (CRM & Creator)', () => {
  it('should synchronize Zoho CRM Deal into an active PLM Project', () => {
    const deal: ZohoCrmDealInput = {
      dealId: 'CRM-DEAL-849201',
      dealName: 'AeroSpace Tier-1 Cockpit Display Unit',
      accountName: 'Lockheed Martin Space Systems',
      amountUsd: 1450000,
      stage: 'Contract Signed / Closed Won',
      closingDate: '2027-03-31',
      customProductRequirements: ['DO-254 Level A Certification', 'MIL-STD-810H Ruggedization']
    };

    const project = syncCrmDealToPlmProject(deal, 'tenant_aerospace');

    expect(project.crmDealId).toBe('CRM-DEAL-849201');
    expect(project.crmAccountName).toBe('Lockheed Martin Space Systems');
    expect(project.commercialValueUsd).toBe(1450000);
    expect(project.status).toBe('production_ramp');
    expect(project.associatedProductRequirements).toContain('DO-254 Level A Certification');
    expect(project.tenantId).toBe('tenant_aerospace');
  });

  it('should escalate Zoho Creator Shop-Floor Quality NCR into a priority PLM ECR', () => {
    const ncr: ZohoCreatorNcrInput = {
      recordId: 'NCR-STN3-00481',
      inspectionStationId: 'INSP-SMT-LINE-02',
      inspectorName: 'Devon Patel',
      partNumber: 'PCBA-MCU-MAIN',
      lotNumber: 'LOT-202610-092',
      defectCategory: 'electrical',
      severity: 'critical',
      defectDescription: 'Short-circuit detected between 3.3V power rail and ground plane during automated flying probe test.',
      detectedQuantity: 14,
      timestamp: '2026-10-15T12:00:00Z'
    };

    const ecr = ingestCreatorQualityNcrToPlmEcr(ncr, 'tenant_electronics');

    expect(ecr.source).toBe('zoho_creator_quality_ncr');
    expect(ecr.sourceNcrId).toBe('NCR-STN3-00481');
    expect(ecr.affectedPartNumber).toBe('PCBA-MCU-MAIN');
    expect(ecr.lotNumber).toBe('LOT-202610-092');
    expect(ecr.priority).toBe('urgent');
    expect(ecr.reasonForChange).toContain('INSP-SMT-LINE-02');
    expect(ecr.reasonForChange).toContain('14 units non-conforming');
    expect(ecr.tenantId).toBe('tenant_electronics');
  });

  it('should format an outgoing release notification for Zoho CRM account stakeholders', () => {
    const notification = formatPlmEcoNotificationForCrm(
      {
        ecoNumber: 'ECO-840',
        title: 'Rev C Production Release for High-Torque Motor Assembly',
        releaseDate: '2026-10-15'
      },
      'CRM-DEAL-849201',
      'Lockheed Martin Space Systems'
    );

    expect(notification.event).toBe('PLM_ECO_RELEASED');
    expect(notification.dealId).toBe('CRM-DEAL-849201');
    expect(notification.summary).toContain('ECO-840');
    expect(notification.account).toBe('Lockheed Martin Space Systems');
  });
});
