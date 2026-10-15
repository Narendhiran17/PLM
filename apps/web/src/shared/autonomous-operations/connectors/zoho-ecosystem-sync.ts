/**
 * @universal-plm/autonomous-operations
 * Zoho Ecosystem Connectors: CRM Deals & Creator Shop-Floor Quality NCR Sync Engine
 */

export interface ZohoCrmDealInput {
  dealId: string;
  dealName: string;
  accountName: string;
  amountUsd: number;
  stage: string;
  closingDate: string;
  customProductRequirements?: string[];
}

export interface PlmProjectRecord {
  projectId: string;
  projectName: string;
  tenantId: string;
  crmDealId: string;
  crmAccountName: string;
  commercialValueUsd: number;
  status: 'planning' | 'in_development' | 'validation' | 'production_ramp';
  targetReleaseDate: string;
  associatedProductRequirements: string[];
  syncTimestamp: string;
}

export interface ZohoCreatorNcrInput {
  recordId: string;
  inspectionStationId: string;
  inspectorName: string;
  partNumber: string;
  lotNumber: string;
  defectCategory: 'dimensional' | 'electrical' | 'cosmetic' | 'material_flaw';
  severity: 'minor' | 'major' | 'critical';
  defectDescription: string;
  detectedQuantity: number;
  timestamp: string;
}

export interface PlmEcrRecord {
  ecrId: string;
  ecrNumber: string;
  tenantId: string;
  title: string;
  source: 'zoho_creator_quality_ncr';
  sourceNcrId: string;
  affectedPartNumber: string;
  lotNumber: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reasonForChange: string;
  status: 'open';
  createdAt: string;
}

/**
 * Maps a Zoho CRM Deal to a high-precision PLM Project
 */
export function syncCrmDealToPlmProject(
  deal: ZohoCrmDealInput,
  tenantId: string
): PlmProjectRecord {
  const projectId = `PRJ-${deal.dealId.slice(-6).toUpperCase()}`;
  const syncTimestamp = new Date().toISOString();

  let status: PlmProjectRecord['status'] = 'planning';
  const stageLower = deal.stage.toLowerCase();
  if (stageLower.includes('production') || stageLower.includes('delivery') || stageLower.includes('closed won')) {
    status = 'production_ramp';
  } else if (stageLower.includes('won') || stageLower.includes('contract')) {
    status = 'in_development';
  }

  return {
    projectId,
    projectName: `NPI: ${deal.dealName}`,
    tenantId,
    crmDealId: deal.dealId,
    crmAccountName: deal.accountName,
    commercialValueUsd: deal.amountUsd,
    status,
    targetReleaseDate: deal.closingDate,
    associatedProductRequirements: deal.customProductRequirements || [
      'Customer Contractual Specifications',
      'Production Ramp Milestones'
    ],
    syncTimestamp
  };
}

/**
 * Transforms a Zoho Creator Shop-Floor Quality NCR into a formal PLM ECR
 */
export function ingestCreatorQualityNcrToPlmEcr(
  ncr: ZohoCreatorNcrInput,
  tenantId: string
): PlmEcrRecord {
  const ecrId = `ECR-NCR-${ncr.recordId}`;
  const ecrNumber = `ECR-Q-${Date.now().toString().slice(-5)}`;
  const createdAt = new Date().toISOString();

  let priority: PlmEcrRecord['priority'] = 'medium';
  if (ncr.severity === 'critical') {
    priority = 'urgent';
  } else if (ncr.severity === 'major') {
    priority = 'high';
  } else if (ncr.severity === 'minor') {
    priority = 'low';
  }

  const reasonForChange = `Automated escalation from Zoho Creator Quality Inspection Station (${ncr.inspectionStationId}) by ${ncr.inspectorName}: ${ncr.defectDescription} [Lot #${ncr.lotNumber}, ${ncr.detectedQuantity} units non-conforming, Category: ${ncr.defectCategory.toUpperCase()}].`;

  return {
    ecrId,
    ecrNumber,
    tenantId,
    title: `[Shop-Floor NCR] ${ncr.defectCategory.toUpperCase()} defect on ${ncr.partNumber}`,
    source: 'zoho_creator_quality_ncr',
    sourceNcrId: ncr.recordId,
    affectedPartNumber: ncr.partNumber,
    lotNumber: ncr.lotNumber,
    priority,
    reasonForChange,
    status: 'open',
    createdAt
  };
}

/**
 * Prepares an outgoing event notification payload from a released PLM ECO to Zoho CRM stakeholders
 */
export function formatPlmEcoNotificationForCrm(
  eco: { ecoNumber: string; title: string; releaseDate: string },
  crmDealId: string,
  accountName: string
): { event: string; dealId: string; account: string; summary: string; timestamp: string } {
  return {
    event: 'PLM_ECO_RELEASED',
    dealId: crmDealId,
    account: accountName,
    summary: `Engineering Change Order ${eco.ecoNumber} ("${eco.title}") has achieved released status on ${eco.releaseDate}. Downstream manufacturing configuration is updated.`,
    timestamp: new Date().toISOString()
  };
}
