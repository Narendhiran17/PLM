import {
  ControlledDocument,
  DocumentRevision,
} from '../types/document.js';

export class DocumentLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentLockError';
  }
}

export interface CheckInRevisionInput {
  revision: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storageBlobKey: string;
  checksumSha256: string;
  changeSummary?: string;
  changeOrderId?: string;
}

/**
 * Checks out a document, acquiring an exclusive lock to prevent conflicting overwrites (B05)
 */
export function checkOutDocument(
  doc: ControlledDocument,
  userId: string,
  userName: string,
  lockReason?: string,
  expiresInHours = 24
): ControlledDocument {
  const now = new Date();

  // Check if already locked by someone else
  if (doc.checkOutLock) {
    const expiresAt = new Date(doc.checkOutLock.expiresAt);
    if (expiresAt > now && doc.checkOutLock.lockedByUserId !== userId) {
      throw new DocumentLockError(
        `Document '${doc.documentNumber}' is currently locked by ${doc.checkOutLock.lockedByUserName} (until ${doc.checkOutLock.expiresAt}). Simultaneous checkout is prevented.`
      );
    }
  }

  const expiresAt = new Date(now.getTime() + expiresInHours * 3600000).toISOString();

  return {
    ...doc,
    checkOutLock: {
      lockedByUserId: userId,
      lockedByUserName: userName,
      lockedAt: now.toISOString(),
      lockReason,
      expiresAt,
    },
    updatedAt: now.toISOString(),
  };
}

/**
 * Checks in a newly modified document revision and releases the checkout lock (B01, B02, B05)
 */
export function checkInDocument(
  doc: ControlledDocument,
  userId: string,
  input: CheckInRevisionInput
): { updatedDocument: ControlledDocument; newRevision: DocumentRevision } {
  const now = new Date();

  if (!doc.checkOutLock) {
    throw new DocumentLockError(
      `Cannot check in document '${doc.documentNumber}': Document is not currently checked out.`
    );
  }

  // Ensure caller is the lock owner
  if (doc.checkOutLock.lockedByUserId !== userId) {
    throw new DocumentLockError(
      `Cannot check in document '${doc.documentNumber}': Locked by user '${doc.checkOutLock.lockedByUserName}', not caller '${userId}'.`
    );
  }

  const newRev: DocumentRevision = {
    id: `drev-${Date.now()}`,
    tenantId: doc.tenantId,
    documentId: doc.id,
    revision: input.revision,
    fileName: input.fileName,
    fileSizeBytes: input.fileSizeBytes,
    mimeType: input.mimeType,
    storageBlobKey: input.storageBlobKey,
    checksumSha256: input.checksumSha256,
    changeSummary: input.changeSummary,
    changeOrderId: input.changeOrderId,
    isBaselineLocked: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const updatedDocument: ControlledDocument = {
    ...doc,
    currentRevision: input.revision,
    checkOutLock: undefined, // release exclusive lock
    updatedAt: now.toISOString(),
  };

  return {
    updatedDocument,
    newRevision: newRev,
  };
}

/**
 * Cancels a checkout lock without modifying or creating new revisions
 */
export function cancelCheckOut(
  doc: ControlledDocument,
  userId: string,
  isAdmin = false
): ControlledDocument {
  if (!doc.checkOutLock) {
    return doc;
  }

  if (doc.checkOutLock.lockedByUserId !== userId && !isAdmin) {
    throw new DocumentLockError(
      `Cannot cancel checkout on document '${doc.documentNumber}': Locked by another user and caller is not administrator.`
    );
  }

  return {
    ...doc,
    checkOutLock: undefined,
    updatedAt: new Date().toISOString(),
  };
}
