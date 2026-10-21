import type { FastifyPluginAsync } from 'fastify';
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
} from '@universal-plm/configuration-engine';
import type {
  CustomFieldDefinition,
  AutoNumberScheme,
  WorkflowLifecycle,
  DynamicApprovalRule,
  FieldSecurityPolicy,
  ImmutableRuleSnapshot,
} from '@universal-plm/configuration-engine';

// Configuration stores initialized empty for clean-slate testing
const customFieldsStore: CustomFieldDefinition[] = [];
const numberingSchemesStore: AutoNumberScheme[] = [];
const approvalRulesStore: DynamicApprovalRule[] = [];
const fieldSecurityPoliciesStore: FieldSecurityPolicy[] = [];
const ruleSnapshotsStore: ImmutableRuleSnapshot[] = [];

export const configurationRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Custom Fields List & Create
  fastify.get('/custom-fields', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const fields = customFieldsStore.filter((f) => f.tenantId === tenantId);
    return reply.send({ success: true, count: fields.length, fields });
  });

  fastify.post('/custom-fields', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as Partial<CustomFieldDefinition>;

    if (!body.name || !body.label || !body.type || !body.targetEntity) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required custom field properties (name, label, type, targetEntity).',
      });
    }

    const newField: CustomFieldDefinition = {
      id: `cf_${Date.now()}`,
      tenantId,
      targetEntity: body.targetEntity,
      name: body.name,
      label: body.label,
      type: body.type,
      required: Boolean(body.required),
      defaultValue: body.defaultValue,
      options: body.options,
      formula: body.formula,
      validationRule: body.validationRule,
      description: body.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    customFieldsStore.push(newField);
    return reply.status(201).send({ success: true, field: newField });
  });

  // 2. Validate custom field values against active definitions
  fastify.post('/custom-fields/validate', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as { targetEntity: string; values: Record<string, any> };
    const definitions = customFieldsStore.filter(
      (f) => f.tenantId === tenantId && f.targetEntity === (body.targetEntity || 'PART')
    );

    const result = validateCustomFields(definitions, body.values || {});
    return reply.send({ success: true, result });
  });

  // 3. Auto-Numbering Schemes
  fastify.get('/numbering-schemes', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const schemes = numberingSchemesStore.filter((s) => s.tenantId === tenantId);
    return reply.send({ success: true, schemes });
  });

  fastify.post('/numbering-schemes/generate', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as { entityType: 'PART' | 'ECO' | 'ECR' | 'DOC'; tokens?: Record<string, string> };

    const schemeIndex = numberingSchemesStore.findIndex(
      (s) => s.tenantId === tenantId && s.entityType === body.entityType
    );

    if (schemeIndex === -1) {
      return reply.status(404).send({
        success: false,
        error: `No auto-numbering scheme found for entityType "${body.entityType}".`,
      });
    }

    const scheme = numberingSchemesStore[schemeIndex];
    const gen = generateNextNumber(scheme, body.tokens);
    numberingSchemesStore[schemeIndex] = gen.updatedScheme;

    return reply.send({
      success: true,
      generatedNumber: gen.generatedNumber,
      currentValue: gen.updatedScheme.currentValue,
    });
  });

  // 4. Dynamic Approval Rules
  fastify.get('/approval-rules', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const rules = approvalRulesStore.filter((r) => r.tenantId === tenantId);
    return reply.send({ success: true, count: rules.length, rules });
  });

  fastify.post('/approval-rules/evaluate', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as { recordData: Record<string, any> };
    const rules = approvalRulesStore.filter((r) => r.tenantId === tenantId);
    const evaluation = evaluateApprovalRules(rules, body.recordData || {});
    return reply.send({ success: true, evaluation });
  });

  // 5. Field-Level Security
  fastify.get('/field-security', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const policies = fieldSecurityPoliciesStore.filter((p) => p.tenantId === tenantId);
    return reply.send({ success: true, policies });
  });

  // 6. Invariant INV-04: Rule Snapshots
  fastify.get('/snapshots', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const snapshots = ruleSnapshotsStore.filter((s) => s.tenantId === tenantId);
    return reply.send({ success: true, count: snapshots.length, snapshots });
  });

  fastify.post('/snapshots', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as {
      entityId: string;
      entityType: 'PART_REVISION' | 'ECO';
      releasedBy: string;
    };

    if (!body.entityId || !body.entityType) {
      return reply.status(400).send({
        success: false,
        error: 'Missing entityId or entityType for rule snapshotting (INV-04).',
      });
    }

    const fields = customFieldsStore.filter((f) => f.tenantId === tenantId);
    const approvalRules = approvalRulesStore.filter((r) => r.tenantId === tenantId);
    const scheme = numberingSchemesStore.find(
      (s) => s.tenantId === tenantId && s.entityType === (body.entityType === 'ECO' ? 'ECO' : 'PART')
    );

    const snapshot = createRuleSnapshot({
      tenantId,
      entityId: body.entityId,
      entityType: body.entityType,
      releasedBy: body.releasedBy || 'system_release_engine',
      fields,
      approvalRules,
      numberingScheme: scheme,
    });

    ruleSnapshotsStore.push(snapshot);
    return reply.status(201).send({ success: true, snapshot });
  });

  // 7. Bulk CSV Data Import & Pre-validation (F06)
  fastify.post('/bulk-import', async (request, reply) => {
    const tenantId = (request as any).tenantId || 'tenant_default';
    const body = request.body as {
      csvContent: string;
      entityType: 'PART' | 'BOM_LINE';
      useAutoNumber?: boolean;
    };

    if (!body.csvContent) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required csvContent payload.',
      });
    }

    const customFields = customFieldsStore.filter(
      (f) => f.tenantId === tenantId && f.targetEntity === (body.entityType || 'PART')
    );

    const scheme = body.useAutoNumber
      ? numberingSchemesStore.find((s) => s.tenantId === tenantId && s.entityType === 'PART')
      : undefined;

    const result = parseAndValidateCsv(body.csvContent, body.entityType || 'PART', customFields, {
      tenantId,
      autoNumberScheme: scheme,
    });

    return reply.send({ success: true, result });
  });
};
