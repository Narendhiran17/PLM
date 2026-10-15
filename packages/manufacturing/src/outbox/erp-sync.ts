/**
 * ERP/MRP Synchronization & Transactional Outbox Engine
 * Universal PLM Platform - Section C: Manufacturing & Supply Chain (C12)
 */

import { createHash } from 'crypto';

export type ErpSyncTarget = 'SAP' | 'NETSUITE' | 'ODOO_ERP' | 'DYNAMICS_365';

export interface ErpSyncOutboxEvent {
  id: string;
  tenantId: string;
  plantId: string;
  entityType: 'ITEM_MASTER' | 'MBOM' | 'ROUTING';
  entityId: string;
  eventType: 'RELEASED' | 'REVISED' | 'OBSOLETED';
  targetSystem: ErpSyncTarget;
  payload: Record<string, any>;
  idempotencyKey: string;
  status: 'PENDING' | 'DISPATCHED' | 'FAILED';
  retryCount: number;
  lastAttemptAt?: string;
  error?: string;
  createdAt: string;
}

/**
 * Creates an immutable transactional outbox event for ERP/MRP synchronization (C12)
 */
export function createErpSyncEvent(params: {
  tenantId: string;
  plantId: string;
  entityType: 'ITEM_MASTER' | 'MBOM' | 'ROUTING';
  entityId: string;
  eventType: 'RELEASED' | 'REVISED' | 'OBSOLETED';
  targetSystem: ErpSyncTarget;
  payload: Record<string, any>;
}): ErpSyncOutboxEvent {
  const canonicalString = JSON.stringify({
    tenantId: params.tenantId,
    plantId: params.plantId,
    entityType: params.entityType,
    entityId: params.entityId,
    eventType: params.eventType,
    targetSystem: params.targetSystem,
  });

  const idempotencyKey = createHash('sha256').update(canonicalString).digest('hex');
  const eventId = `OUTBOX-${Date.now()}-${idempotencyKey.substring(0, 8)}`;

  return {
    id: eventId,
    tenantId: params.tenantId,
    plantId: params.plantId,
    entityType: params.entityType,
    entityId: params.entityId,
    eventType: params.eventType,
    targetSystem: params.targetSystem,
    payload: params.payload,
    idempotencyKey,
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };
}
