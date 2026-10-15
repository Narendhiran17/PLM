/**
 * @universal-plm/industry-capabilities
 * Pack: Regulated Medical Device & Life Sciences (IND-04)
 * Standards: FDA 21 CFR Part 820 (QMSR), ISO 13485:2016, ISO 14971, EU MDR 2017/745
 */

import { IndustryCapabilityManifest } from '../registry/capability-registry.js';

export type DhfSectionType =
  | 'design_inputs'
  | 'design_outputs'
  | 'design_verification'
  | 'design_validation'
  | 'risk_management'
  | 'design_transfer'
  | 'design_reviews';

export interface DhfItem {
  id: string;
  section: DhfSectionType;
  title: string;
  documentRefId: string;
  revision: string;
  status: 'draft' | 'approved' | 'superseded';
  approvedBy?: string;
  approvedAt?: string;
}

export interface TraceabilityLink {
  userNeedId: string;
  userNeedText: string;
  designInputId: string;
  designInputText: string;
  designOutputPartId: string;
  verificationProtocolId: string;
  testPassed: boolean;
}

export interface DhfPackage {
  id: string;
  tenantId: string;
  devicePartId: string;
  deviceRevisionId: string;
  deviceClassification: 'Class I' | 'Class II' | 'Class III' | 'Class IIa' | 'Class IIb';
  iso14971RiskFileId: string;
  items: DhfItem[];
  traceabilityMatrix: TraceabilityLink[];
  dmrCompiled: boolean;
}

/**
 * Validates whether the Design History File (DHF) meets FDA 21 CFR 820.30
 * requirements for design transfer and commercial release.
 */
export function validateDhfReadiness(dhf: DhfPackage): {
  isCompliant: boolean;
  unverifiedInputs: string[];
  failedTests: string[];
  missingSections: DhfSectionType[];
} {
  const presentSections = new Set<DhfSectionType>(dhf.items.map((i) => i.section));
  const requiredSections: DhfSectionType[] = [
    'design_inputs',
    'design_outputs',
    'design_verification',
    'design_validation',
    'risk_management',
    'design_transfer',
    'design_reviews'
  ];

  const missingSections = requiredSections.filter((s) => !presentSections.has(s));
  const unverifiedInputs: string[] = [];
  const failedTests: string[] = [];

  for (const trace of dhf.traceabilityMatrix) {
    if (!trace.designOutputPartId || !trace.verificationProtocolId) {
      unverifiedInputs.push(`${trace.designInputId}: ${trace.designInputText}`);
    }
    if (!trace.testPassed) {
      failedTests.push(`${trace.verificationProtocolId} for input ${trace.designInputId}`);
    }
  }

  const isCompliant =
    missingSections.length === 0 &&
    unverifiedInputs.length === 0 &&
    failedTests.length === 0 &&
    dhf.dmrCompiled;

  return {
    isCompliant,
    unverifiedInputs,
    failedTests,
    missingSections
  };
}

export const MEDICAL_DEVICE_MANIFEST: IndustryCapabilityManifest = {
  id: 'medical-device',
  name: 'Regulated Medical Device & Life Sciences Pack',
  version: '3.0.0',
  description: 'Design History File (DHF) compilation, Device Master Record (DMR), 21 CFR Part 820 design controls, and ISO 14971 risk management.',
  industrySector: 'Medical Devices, IVD & Biopharma',
  complianceStandards: ['FDA 21 CFR Part 820', 'ISO 13485:2016', 'ISO 14971:2019', 'EU MDR 2017/745'],
  features: [
    'Complete 7-section Design History File (DHF) navigator',
    'Closed-loop User Need to Verification Test Traceability Matrix',
    'Automated Device Master Record (DMR) package compilation',
    '21 CFR Part 11 compliant digital change audit trail'
  ],
  requiredPartAttributes: [
    { name: 'deviceClass', label: 'Device Classification', type: 'enum', required: true, options: ['Class I', 'Class II', 'Class III'] },
    { name: 'iso14971RiskCategory', label: 'ISO 14971 Risk Category', type: 'string', required: true }
  ]
};
