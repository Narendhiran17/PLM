/**
 * Workflow Lifecycle & Dynamic Approval Rule Builder Engine
 * Universal PLM Platform - Section E: Platform Configuration (E03, E04, E06)
 */

export interface WorkflowState {
  id: string;
  name: string;
  label: string;
  isInitial?: boolean;
  isTerminal?: boolean;
  allowEdit?: boolean;
  allowedTransitions: string[]; // List of target state IDs
}

export interface WorkflowLifecycle {
  id: string;
  tenantId: string;
  name: string;
  targetEntity: 'PART_REVISION' | 'ECO' | 'ECR' | 'DOCUMENT';
  states: WorkflowState[];
  initialStateId: string;
  createdAt: string;
  updatedAt: string;
}

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'CONTAINS';

export interface ApprovalCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface DynamicApprovalRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  targetEntity: 'ECO' | 'ECR' | 'PART_REVISION';
  conditions: ApprovalCondition[];
  logic: 'ALL' | 'ANY';
  requiredRoles: string[];
  quorum: 'ALL_MUST_APPROVE' | 'MAJORITY' | 'AT_LEAST_ONE';
  priority?: number;
  isActive: boolean;
}

/**
 * Validates whether a state transition is allowed in the configured lifecycle
 */
export function validateLifecycleTransition(
  lifecycle: WorkflowLifecycle,
  fromStateId: string,
  toStateId: string
): { isAllowed: boolean; error?: string } {
  const currentState = lifecycle.states.find((s) => s.id === fromStateId);
  if (!currentState) {
    return {
      isAllowed: false,
      error: `Current state "${fromStateId}" is not defined in lifecycle "${lifecycle.name}".`,
    };
  }

  const targetState = lifecycle.states.find((s) => s.id === toStateId);
  if (!targetState) {
    return {
      isAllowed: false,
      error: `Target state "${toStateId}" is not defined in lifecycle "${lifecycle.name}".`,
    };
  }

  if (currentState.isTerminal) {
    return {
      isAllowed: false,
      error: `State "${currentState.label}" is a terminal state; no transitions are permitted.`,
    };
  }

  if (!currentState.allowedTransitions.includes(toStateId)) {
    return {
      isAllowed: false,
      error: `Transition from "${currentState.label}" to "${targetState.label}" is not permitted by lifecycle rules.`,
    };
  }

  return { isAllowed: true };
}

/**
 * Evaluates dynamic approval rules against record attributes (e.g. cost, risk level, category)
 * to determine the exact required approval roles and quorums.
 */
export function evaluateApprovalRules(
  rules: DynamicApprovalRule[],
  recordData: Record<string, any>
): {
  matchedRules: DynamicApprovalRule[];
  aggregatedRoles: string[];
  requiredQuorums: Record<string, 'ALL_MUST_APPROVE' | 'MAJORITY' | 'AT_LEAST_ONE'>;
} {
  const matchedRules: DynamicApprovalRule[] = [];
  const rolesSet = new Set<string>();
  const requiredQuorums: Record<string, 'ALL_MUST_APPROVE' | 'MAJORITY' | 'AT_LEAST_ONE'> = {};

  const activeRules = rules
    .filter((r) => r.isActive)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of activeRules) {
    let matches = false;

    if (rule.conditions.length === 0) {
      matches = true;
    } else {
      const conditionResults = rule.conditions.map((cond) => {
        const recordVal = recordData[cond.field];
        switch (cond.operator) {
          case 'EQUALS':
            return recordVal === cond.value;
          case 'NOT_EQUALS':
            return recordVal !== cond.value;
          case 'GREATER_THAN':
            return Number(recordVal) > Number(cond.value);
          case 'LESS_THAN':
            return Number(recordVal) < Number(cond.value);
          case 'IN':
            return Array.isArray(cond.value) && cond.value.includes(recordVal);
          case 'CONTAINS':
            return typeof recordVal === 'string' && recordVal.includes(String(cond.value));
          default:
            return false;
        }
      });

      matches =
        rule.logic === 'ALL'
          ? conditionResults.every(Boolean)
          : conditionResults.some(Boolean);
    }

    if (matches) {
      matchedRules.push(rule);
      for (const role of rule.requiredRoles) {
        rolesSet.add(role);
        requiredQuorums[role] = rule.quorum;
      }
    }
  }

  return {
    matchedRules,
    aggregatedRoles: Array.from(rolesSet),
    requiredQuorums,
  };
}
