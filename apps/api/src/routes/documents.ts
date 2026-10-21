import { FastifyPluginAsync } from 'fastify';
import {
  ControlledDocument,
  DocumentRevision,
  checkOutDocument,
  checkInDocument,
  cancelCheckOut,
  DocumentLockError,
} from '@universal-plm/document-control';
import { assertPermission, Permissions } from '@universal-plm/authorization';

// Document vault stores initialized empty for clean-slate testing
const documentsStore: ControlledDocument[] = [];
const revisionsStore: Record<string, DocumentRevision[]> = {};

export const documentRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. List Documents
  fastify.get('/', async (request) => {
    assertPermission(request.tenantContext, Permissions.PART_READ);
    const docs = documentsStore.filter((d) => d.tenantId === request.tenantContext.tenantId);
    return { data: docs, total: docs.length };
  });

  // 2. Get Document Detail with Revision History
  fastify.get('/:id', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.PART_READ);
    const { id } = request.params as { id: string };
    const doc = documentsStore.find((d) => d.id === id && d.tenantId === request.tenantContext.tenantId);
    if (!doc) return reply.status(404).send({ error: 'Document not found' });

    const revs = revisionsStore[id] || [];
    return { data: { ...doc, revisions: revs } };
  });

  // 3. Check-Out Document (Acquire Exclusive Lock)
  fastify.post('/:id/checkout', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.PART_UPDATE);
    const { id } = request.params as { id: string };
    const body = request.body as { reason?: string };

    const doc = documentsStore.find((d) => d.id === id && d.tenantId === request.tenantContext.tenantId);
    if (!doc) return reply.status(404).send({ error: 'Document not found' });

    try {
      const lockedDoc = checkOutDocument(
        doc,
        request.tenantContext.userId,
        request.tenantContext.userId,
        body.reason
      );
      const idx = documentsStore.findIndex((d) => d.id === id);
      documentsStore[idx] = lockedDoc;
      return { data: lockedDoc };
    } catch (err: any) {
      if (err instanceof DocumentLockError) {
        return reply.status(423).send({ error: 'LOCKED', message: err.message });
      }
      return reply.status(400).send({ error: err.message });
    }
  });

  // 4. Check-In Document (Release Lock & Store New Revision)
  fastify.post('/:id/checkin', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.PART_UPDATE);
    const { id } = request.params as { id: string };
    const body = request.body as {
      revision: string;
      fileName: string;
      fileSizeBytes: number;
      mimeType: string;
      storageBlobKey: string;
      checksumSha256: string;
      changeSummary?: string;
    };

    const doc = documentsStore.find((d) => d.id === id && d.tenantId === request.tenantContext.tenantId);
    if (!doc) return reply.status(404).send({ error: 'Document not found' });

    try {
      const { updatedDocument, newRevision } = checkInDocument(
        doc,
        request.tenantContext.userId,
        body
      );

      const idx = documentsStore.findIndex((d) => d.id === id);
      documentsStore[idx] = updatedDocument;

      if (!revisionsStore[id]) revisionsStore[id] = [];
      revisionsStore[id].push(newRevision);

      return { data: { document: updatedDocument, revision: newRevision } };
    } catch (err: any) {
      if (err instanceof DocumentLockError) {
        return reply.status(403).send({ error: 'LOCK_VIOLATION', message: err.message });
      }
      return reply.status(400).send({ error: err.message });
    }
  });

  // 5. Cancel Check-Out
  fastify.post('/:id/cancel-checkout', async (request, reply) => {
    assertPermission(request.tenantContext, Permissions.PART_UPDATE);
    const { id } = request.params as { id: string };

    const doc = documentsStore.find((d) => d.id === id && d.tenantId === request.tenantContext.tenantId);
    if (!doc) return reply.status(404).send({ error: 'Document not found' });

    try {
      const unlockedDoc = cancelCheckOut(doc, request.tenantContext.userId);
      const idx = documentsStore.findIndex((d) => d.id === id);
      documentsStore[idx] = unlockedDoc;
      return { data: unlockedDoc };
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });
};
