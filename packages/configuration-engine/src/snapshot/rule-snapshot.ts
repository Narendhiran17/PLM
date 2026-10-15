/**
 * Rule Snapshotting Engine
 * Universal PLM Platform - Core Invariant INV-04
 * Releases capture the exact rules & schemas active at release time
 */

import { createHash } from 'crypto';
import type { CustomFieldDefinition } from '../types/custom-fields.js';
import type { AutoNumberScheme } from '../types/numbering-scheme.js';
import type { DynamicApprovalRule, WorkflowLifecycle } from '../workflows/workflow-engine.js';

export interface ImmutableRuleSnapshot {
  snapshotId: string;
  tenantId: string;
  entityId: string;
  entityType: 'PART_REVISION' | 'ECO';
  releasedAt: string;
  releasedBy: string;
  capturedFields: CustomFieldDefinition[];
  capturedApprovalRules: DynamicApprovalRule[];
  capturedLifecycle?: WorkflowLifecycle;
  capturedNumberingScheme?: AutoNumberScheme;
  rulesHash: string; // Cryptographic SHA-256 fingerprint of all active schemas & rules
}

/**
 * Creates an immutable snapshot of all configuration schemas, fields, and workflow rules
 * at the exact moment an engineering release occurs (INV-04).
 */
export function createRuleSnapshot(params: {
  tenantId: string;
  entityId: string;
  entityType: 'PART_REVISION' | 'ECO';
  releasedBy: string;
  fields: CustomFieldDefinition[];
  approvalRules: DynamicApprovalRule[];
  lifecycle?: WorkflowLifecycle;
  numberingScheme?: AutoNumberScheme;
}): ImmutableRuleSnapshot {
  const releasedAt = new Date().toISOString();

  // Canonical string representation for SHA-256 hashing
  const canonicalData = JSON.stringify({
    tenantId: params.tenantId,
    entityId: params.entityId,
    entityType: params.entityType,
    fields: params.fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required,
      validationRule: f.validationRule,
      options: f.options,
    })),
    approvalRules: params.approvalRules.map((r) => ({
      id: r.id,
      conditions: r.conditions,
      logic: r.logic,
      requiredRoles: r.requiredRoles,
      quorum: r.quorum,
    })),
    lifecycle: params.lifecycle
      ? {
          name: params.lifecycle.name,
          states: params.lifecycle.states.map((s) => ({
            id: s.id,
            allowedTransitions: s.allowedTransitions,
          })),
        }
      : null,
  });

  const rulesHash = createHash('sha256').update(canonicalData).digest('hex');
  const snapshotId = `SNAP-${Date.now()}-${rulesHash.substring(0, 8)}`;

  return {
    snapshotId,
    tenantId: params.tenantId,
    entityId: params.entityId,
    entityType: params.entityType,
    releasedAt,
    releasedBy: params.releasedBy,
    capturedFields: params.fields,
    capturedApprovalRules: params.approvalRules,
    capturedLifecycle: params.lifecycle,
    capturedNumberingScheme: params.numberingScheme,
    rulesHash,
  };
}
