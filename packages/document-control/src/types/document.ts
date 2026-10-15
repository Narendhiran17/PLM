export type DocumentCategory =
  | 'SPECIFICATION'
  | 'DRAWING_2D'
  | 'CAD_3D_MODEL'
  | 'QUALITY_PLAN'
  | 'TEST_REPORT'
  | 'MANUFACTURING_INSTRUCTION'
  | 'REGULATORY_FILE';

export type DocumentLifecycleState =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'RELEASED'
  | 'OBSOLETE';

export interface DocumentCheckOutLock {
  lockedByUserId: string;
  lockedByUserName: string;
  lockedAt: string;
  lockReason?: string;
  expiresAt: string;
}

export interface DocumentRevision {
  id: string;
  tenantId: string;
  documentId: string;
  revision: string; // e.g. "A", "B", "1.0", "1.1"
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storageBlobKey: string; // Catalyst Stratus blob storage key
  checksumSha256: string;
  changeSummary?: string;
  changeOrderId?: string;
  isBaselineLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ControlledDocument {
  id: string;
  tenantId: string;
  documentNumber: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  currentRevision: string;
  lifecycleState: DocumentLifecycleState;
  ownerId: string;
  tags: string[];
  checkOutLock?: DocumentCheckOutLock;
  createdAt: string;
  updatedAt: string;
}

export interface CadModelMetadata {
  documentId: string;
  nativeCadTool: 'SOLIDWORKS' | 'AUTODESK_INVENTOR' | 'PTC_CREO' | 'CATIA' | 'SIEMENS_NX' | 'OTHER';
  nativeExtension: string; // e.g. '.sldprt', '.ipt', '.step'
  cadAuthorVersion?: string;
  neutralStepBlobKey?: string;
  derivedPdfDrawingBlobKey?: string;
  boundingBoxMm?: { x: number; y: number; z: number };
  massKg?: number;
}

export type DocumentPartLinkType =
  | 'PRIMARY_SPECIFICATION'
  | 'MANUFACTURING_DRAWING'
  | 'ASSEMBLY_INSTRUCTION'
  | 'TEST_EVIDENCE'
  | 'COMPLIANCE_CERTIFICATE';

export interface DocumentPartLink {
  id: string;
  tenantId: string;
  documentId: string;
  partId: string;
  relationshipType: DocumentPartLinkType;
  createdAt: string;
}
