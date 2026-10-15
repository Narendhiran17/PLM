/**
 * Phase 3: Platform Configurability & Automation Suite
 * Tests dynamic custom fields, auto-numbering, approval rule builder,
 * lifecycle state flow, Field-Level Security (FLS), Rule Snapshotting (INV-04),
 * and Bulk Data Importer.
 */

import { describe, it, expect } from 'vitest';
import {
  validateCustomFields,
  evaluateFormula,
  generateNextNumber,
  validateLifecycleTransition,
  evaluateApprovalRules,
  applyFieldSecurity,
  validateFieldUpdatePermissions,
  createRuleSnapshot,
  parseAndValidateCsv,
} from '../packages/configuration-engine/src/index.js';
import type {
  CustomFieldDefinition,
  AutoNumberScheme,
  WorkflowLifecycle,
  DynamicApprovalRule,
  FieldSecurityPolicy,
} from '../packages/configuration-engine/src/index.js';

describe('Phase 3: Configuration & Automation Engine', () => {
  const tenantId = 'tenant_aerospace_01';

  // 1. Dynamic Custom Fields & Validation
  describe('E01 & E07: Dynamic Custom Fields and Validation Engine', () => {
    const definitions: CustomFieldDefinition[] = [
      {
        id: 'cf_mat',
        tenantId,
        targetEntity: 'PART',
        name: 'materialGrade',
        label: 'Material Grade',
        type: 'DROPDOWN',
        required: true,
        options: ['ALUMINUM_7075', 'TITANIUM_TI6AL4V', 'STAINLESS_316L'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cf_weight',
        tenantId,
        targetEntity: 'PART',
        name: 'weightGrams',
        label: 'Weight (g)',
        type: 'NUMBER',
        required: false,
        validationRule: { min: 1, max: 50000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cf_serial_pattern',
        tenantId,
        targetEntity: 'PART',
        name: 'supplierCode',
        label: 'Supplier Code',
        type: 'TEXT',
        required: false,
        validationRule: { pattern: '^[A-Z]{3}-\\d{4}$' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('passes valid custom fields', () => {
      const res = validateCustomFields(definitions, {
        materialGrade: 'TITANIUM_TI6AL4V',
        weightGrams: 250,
        supplierCode: 'ABC-1234',
      });
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('rejects missing required field', () => {
      const res = validateCustomFields(definitions, {
        weightGrams: 100,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0].fieldName).toBe('materialGrade');
      expect(res.errors[0].message).toContain('required');
    });

    it('enforces dropdown options and number bounds', () => {
      const res = validateCustomFields(definitions, {
        materialGrade: 'CHEAP_PLASTIC',
        weightGrams: 999999,
        supplierCode: 'invalid-pattern',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors).toHaveLength(3);
      expect(res.errors.some((e) => e.fieldName === 'materialGrade')).toBe(true);
      expect(res.errors.some((e) => e.fieldName === 'weightGrams')).toBe(true);
      expect(res.errors.some((e) => e.fieldName === 'supplierCode')).toBe(true);
    });

    it('evaluates dynamic formula correctly', () => {
      const formula = 'unitCost * markupFactor + packagingFee';
      const context = { unitCost: 100, markupFactor: 1.25, packagingFee: 15 };
      const result = evaluateFormula(formula, context);
      expect(result).toBe(140);
    });
  });

  // 2. Auto-Numbering Schemes
  describe('E05: Auto-Numbering Schemes Engine', () => {
    it('generates sequential numbers with zero-padding and dynamic tokens', () => {
      const scheme: AutoNumberScheme = {
        id: 'scheme_prt',
        tenantId,
        entityType: 'PART',
        category: 'AERO',
        prefix: 'PRT',
        counterDigits: 5,
        currentValue: 42,
        formatPattern: '{PREFIX}-{CATEGORY}-{YEAR}-{SEQ}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = generateNextNumber(scheme);
      const currentYear = new Date().getFullYear();
      expect(result.generatedNumber).toBe(`PRT-AERO-${currentYear}-00043`);
      expect(result.updatedScheme.currentValue).toBe(43);
    });
  });

  // 3. Workflow Lifecycle Transitions
  describe('E03 & E06: Lifecycle Configuration & Workflow Transitions', () => {
    const lifecycle: WorkflowLifecycle = {
      id: 'lc_eco_standard',
      tenantId,
      name: 'Standard ECO Lifecycle',
      targetEntity: 'ECO',
      initialStateId: 'DRAFT',
      states: [
        {
          id: 'DRAFT',
          name: 'Draft',
          label: 'Draft',
          allowedTransitions: ['IN_REVIEW', 'CANCELLED'],
        },
        {
          id: 'IN_REVIEW',
          name: 'In Review',
          label: 'In Review',
          allowedTransitions: ['APPROVED', 'REJECTED'],
        },
        {
          id: 'APPROVED',
          name: 'Approved',
          label: 'Approved',
          allowedTransitions: ['RELEASED'],
        },
        {
          id: 'RELEASED',
          name: 'Released',
          label: 'Released',
          isTerminal: true,
          allowedTransitions: [],
        },
        {
          id: 'CANCELLED',
          name: 'Cancelled',
          label: 'Cancelled',
          isTerminal: true,
          allowedTransitions: [],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('allows valid state progression', () => {
      const res = validateLifecycleTransition(lifecycle, 'DRAFT', 'IN_REVIEW');
      expect(res.isAllowed).toBe(true);
    });

    it('rejects invalid jumps bypassing intermediate states', () => {
      const res = validateLifecycleTransition(lifecycle, 'DRAFT', 'RELEASED');
      expect(res.isAllowed).toBe(false);
      expect(res.error).toContain('not permitted');
    });

    it('prohibits transitions from terminal states', () => {
      const res = validateLifecycleTransition(lifecycle, 'RELEASED', 'DRAFT');
      expect(res.isAllowed).toBe(false);
      expect(res.error).toContain('terminal state');
    });
  });

  // 4. Dynamic Approval Rule Builder
  describe('E04: Multi-Condition Approval Rule Builder', () => {
    const rules: DynamicApprovalRule[] = [
      {
        id: 'rule_high_cost',
        tenantId,
        name: 'High Cost ECO Routing',
        targetEntity: 'ECO',
        isActive: true,
        priority: 10,
        conditions: [
          { field: 'estimatedCost', operator: 'GREATER_THAN', value: 10000 },
        ],
        logic: 'ALL',
        requiredRoles: ['CFO', 'VP_ENGINEERING'],
        quorum: 'ALL_MUST_APPROVE',
      },
      {
        id: 'rule_aero_class',
        tenantId,
        name: 'Flight-Critical Safety Routing',
        targetEntity: 'ECO',
        isActive: true,
        priority: 20,
        conditions: [
          { field: 'criticality', operator: 'EQUALS', value: 'FLIGHT_CRITICAL' },
        ],
        logic: 'ALL',
        requiredRoles: ['CHIEF_SAFETY_OFFICER'],
        quorum: 'ALL_MUST_APPROVE',
      },
    ];

    it('aggregates required approval roles when multiple rules match', () => {
      const evaluation = evaluateApprovalRules(rules, {
        estimatedCost: 25000,
        criticality: 'FLIGHT_CRITICAL',
      });

      expect(evaluation.matchedRules).toHaveLength(2);
      expect(evaluation.aggregatedRoles).toContain('CFO');
      expect(evaluation.aggregatedRoles).toContain('VP_ENGINEERING');
      expect(evaluation.aggregatedRoles).toContain('CHIEF_SAFETY_OFFICER');
      expect(evaluation.requiredQuorums['CHIEF_SAFETY_OFFICER']).toBe('ALL_MUST_APPROVE');
    });

    it('evaluates only matched conditions', () => {
      const evaluation = evaluateApprovalRules(rules, {
        estimatedCost: 500, // < 10000
        criticality: 'STANDARD',
      });

      expect(evaluation.matchedRules).toHaveLength(0);
      expect(evaluation.aggregatedRoles).toHaveLength(0);
    });
  });

  // 5. Role- and Field-Level Security (FLS)
  describe('E08: Role & Field-Level Permissions (FLS)', () => {
    const policies: FieldSecurityPolicy[] = [
      {
        id: 'policy_supplier',
        tenantId,
        role: 'SUPPLIER_PORTAL',
        targetEntity: 'PART',
        fieldPolicies: {
          partNumber: 'READ_ONLY',
          name: 'READ_ONLY',
          standardCost: 'HIDDEN',
          internalNotes: 'HIDDEN',
          targetPrice: 'HIDDEN',
        },
      },
    ];

    it('sanitizes and strips HIDDEN fields for restricted roles', () => {
      const partRecord = {
        partNumber: 'PRT-1001',
        name: 'Turbine Blade High Temp',
        standardCost: 1420.5,
        internalNotes: 'Confidential proprietary alloy spec',
        targetPrice: 2000.0,
        publicDescription: 'Heat resistant turbine blade',
      };

      const result = applyFieldSecurity(partRecord, ['SUPPLIER_PORTAL'], policies, 'PART');
      expect(result.sanitizedRecord.partNumber).toBe('PRT-1001');
      expect((result.sanitizedRecord as any).standardCost).toBeUndefined();
      expect((result.sanitizedRecord as any).internalNotes).toBeUndefined();
      expect(result.hiddenFields).toContain('standardCost');
      expect(result.readOnlyFields).toContain('partNumber');
    });

    it('prevents update mutations to READ_ONLY and HIDDEN fields', () => {
      const updateAttempt = {
        name: 'Attempted Renamed Blade',
        standardCost: 500.0,
      };

      const check = validateFieldUpdatePermissions(updateAttempt, ['SUPPLIER_PORTAL'], policies, 'PART');
      expect(check.isAllowed).toBe(false);
      expect(check.violatedFields).toContain('name');
      expect(check.violatedFields).toContain('standardCost');
    });
  });

  // 6. Invariant INV-04: Rule Snapshotting
  describe('INV-04: Rule Snapshotting on Release', () => {
    it('creates immutable cryptographic snapshot of all active schemas and rules', () => {
      const snapshot = createRuleSnapshot({
        tenantId,
        entityId: 'REV-PRT-9000-B',
        entityType: 'PART_REVISION',
        releasedBy: 'lead_engineer@universal-plm.com',
        fields: [
          {
            id: 'f1',
            tenantId,
            targetEntity: 'PART',
            name: 'density',
            label: 'Density',
            type: 'NUMBER',
            createdAt: '2026-10-15T00:00:00Z',
            updatedAt: '2026-10-15T00:00:00Z',
          },
        ],
        approvalRules: [],
      });

      expect(snapshot.snapshotId).toMatch(/^SNAP-\d+-[a-f0-9]{8}$/);
      expect(snapshot.rulesHash).toBeDefined();
      expect(snapshot.rulesHash.length).toBe(64); // SHA-256 length
      expect(snapshot.capturedFields).toHaveLength(1);
      expect(snapshot.entityId).toBe('REV-PRT-9000-B');
    });
  });

  // 7. Bulk CSV Importer Engine
  describe('F06: High-Performance Bulk Data Import Engine', () => {
    it('parses valid CSV data and applies custom field validation', () => {
      const csv = [
        'partNumber,name,type,uom,materialGrade',
        'PRT-001,Main Frame,ASSEMBLY,EA,ALUMINUM_7075',
        'PRT-002,Fastener Bolt,COMPONENT,EA,STAINLESS_316L',
      ].join('\n');

      const customFields: CustomFieldDefinition[] = [
        {
          id: 'cf_mat',
          tenantId,
          targetEntity: 'PART',
          name: 'materialGrade',
          label: 'Material Grade',
          type: 'DROPDOWN',
          options: ['ALUMINUM_7075', 'STAINLESS_316L'],
          createdAt: '',
          updatedAt: '',
        },
      ];

      const result = parseAndValidateCsv(csv, 'PART', customFields);
      expect(result.totalRows).toBe(2);
      expect(result.successfulRows).toBe(2);
      expect(result.failedRows).toBe(0);
      expect(result.validRecords[0].partNumber).toBe('PRT-001');
      expect(result.validRecords[0].customFields.materialGrade).toBe('ALUMINUM_7075');
    });

    it('auto-numbers rows when partNumber is omitted using scheme', () => {
      const csv = [
        'name,type,uom',
        'Bracket Left,COMPONENT,EA',
        'Bracket Right,COMPONENT,EA',
      ].join('\n');

      const scheme: AutoNumberScheme = {
        id: 'sch_gen',
        tenantId,
        entityType: 'PART',
        prefix: 'AUTO',
        counterDigits: 4,
        currentValue: 10,
        createdAt: '',
        updatedAt: '',
      };

      const result = parseAndValidateCsv(csv, 'PART', [], { autoNumberScheme: scheme });
      expect(result.successfulRows).toBe(2);
      expect(result.validRecords[0].partNumber).toBe('AUTO-0011');
      expect(result.validRecords[1].partNumber).toBe('AUTO-0012');
    });

    it('reports row-by-row validation errors with line numbers', () => {
      const csv = [
        'partNumber,name,quantity',
        'PRT-100,,5', // missing name
        'PRT-200,Valid Part Name,invalid-qty', // invalid number
      ].join('\n');

      const result = parseAndValidateCsv(csv, 'PART');
      expect(result.successfulRows).toBe(1);
      expect(result.failedRows).toBe(1);
      expect(result.errors[0].rowNumber).toBe(2);
      expect(result.errors[0].column).toBe('name');
    });
  });
});
