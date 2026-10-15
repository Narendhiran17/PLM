/**
 * @universal-plm/industry-capabilities
 * Pack: Discrete Manufacturing & Automotive (IND-01)
 * Standards: AIAG PPAP, IATF 16949, IMDS, ISO 26262
 */

import { IndustryCapabilityManifest } from '../registry/capability-registry.js';

export type PpapLevel = 1 | 2 | 3 | 4 | 5;

export type PpapElementStatus = 'not_started' | 'in_progress' | 'completed' | 'not_applicable';

export interface PpapElement {
  elementNumber: number;
  name: string;
  status: PpapElementStatus;
  documentRefId?: string;
  signoffDate?: string;
  verifiedBy?: string;
}

export interface PpapSubmission {
  id: string;
  tenantId: string;
  partId: string;
  partRevisionId: string;
  supplierId: string;
  level: PpapLevel;
  status: 'draft' | 'submitted' | 'interim_approved' | 'approved' | 'rejected';
  imdsMdsId?: string;
  elements: PpapElement[];
  pswSigned: boolean;
  notes?: string;
}

export interface SerialTraceabilityRecord {
  tenantId: string;
  assemblySerialNumber: string;
  componentPartId: string;
  componentSerialNumber: string;
  lotNumber?: string;
  installationTimestamp: string;
  workCenterId: string;
  operatorId: string;
}

export const AIAG_PPAP_18_ELEMENTS = [
  'Design Records',
  'Authorized Engineering Change Documents',
  'Customer Engineering Approval',
  'Design Failure Mode and Effects Analysis (DFMEA)',
  'Process Flow Diagram',
  'Process Failure Mode and Effects Analysis (PFMEA)',
  'Control Plan',
  'Measurement System Analysis Studies (MSA)',
  'Dimensional Results',
  'Records of Material / Performance Test Results',
  'Initial Process Studies (Cp, Cpk)',
  'Qualified Laboratory Documentation',
  'Appearance Approval Report (AAR)',
  'Sample Production Parts',
  'Master Sample',
  'Checking Aids',
  'Customer-Specific Requirements Records',
  'Part Submission Warrant (PSW)'
];

export function createDefaultPpapSubmission(
  tenantId: string,
  partId: string,
  partRevisionId: string,
  supplierId: string,
  level: PpapLevel = 3
): PpapSubmission {
  const elements: PpapElement[] = AIAG_PPAP_18_ELEMENTS.map((name, index) => ({
    elementNumber: index + 1,
    name,
    status: 'not_started'
  }));

  return {
    id: `ppap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    partId,
    partRevisionId,
    supplierId,
    level,
    status: 'draft',
    elements,
    pswSigned: false
  };
}

export function evaluatePpapStatus(submission: PpapSubmission): {
  isComplete: boolean;
  completionPercentage: number;
  missingElements: string[];
  canApprove: boolean;
} {
  const activeElements = submission.elements.filter((e) => e.status !== 'not_applicable');
  const completed = activeElements.filter((e) => e.status === 'completed');
  const missing = activeElements
    .filter((e) => e.status !== 'completed')
    .map((e) => `#${e.elementNumber}: ${e.name}`);

  const completionPercentage = activeElements.length > 0
    ? Math.round((completed.length / activeElements.length) * 100)
    : 0;

  const isComplete = missing.length === 0 && submission.pswSigned;
  const canApprove = isComplete && Boolean(submission.imdsMdsId);

  return {
    isComplete,
    completionPercentage,
    missingElements: missing,
    canApprove
  };
}

export const DISCRETE_AUTOMOTIVE_MANIFEST: IndustryCapabilityManifest = {
  id: 'discrete-automotive',
  name: 'Discrete Manufacturing & Automotive Capability Pack',
  version: '1.2.0',
  description: 'AIAG PPAP 18-element checklists, serial/lot traceability, IMDS automotive compliance, and IATF 16949 quality controls.',
  industrySector: 'Automotive & Industrial Machinery',
  complianceStandards: ['AIAG PPAP Level 1-5', 'IATF 16949', 'IMDS', 'ISO 26262 ASIL'],
  features: [
    'Automated 18-element AIAG PPAP submission tracker',
    'Part Submission Warrant (PSW) digital signoff',
    'Bidirectional parent-child serial and lot traceability',
    'IMDS Material Data Sheet tracking and validation'
  ],
  requiredPartAttributes: [
    { name: 'imdsNumber', label: 'IMDS MDS Number', type: 'string', required: false },
    { name: 'automotiveSafetyLevel', label: 'ASIL Rating', type: 'enum', required: false, options: ['QM', 'ASIL-A', 'ASIL-B', 'ASIL-C', 'ASIL-D'] }
  ]
};
