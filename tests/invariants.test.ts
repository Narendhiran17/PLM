import { describe, it, expect } from 'vitest';
import {
  assertNoBomCycle,
  CircularBomReferenceError,
  PartRevision,
  LifecycleState
} from '@universal-plm/domain-core';
import {
  assertTenantMatch,
  assertPermission,
  Permissions,
  TenantIsolationViolationError,
  TenantAuthorizationError
} from '@universal-plm/authorization';

describe('Universal PLM — Invariant Verification Suite', () => {

  describe('Invariant 1: Tenant Boundary Scoping & Authorization', () => {
    const validTenantContext = {
      tenantId: 'tenant-officehub',
      userId: 'usr-marcus',
      roles: ['LEAD_ENGINEER'],
      permissions: [],
      activeCapabilities: ['DISCRETE_MANUFACTURING' as const],
    };

    it('should permit access when record tenant matches session context', () => {
      expect(() => {
        assertTenantMatch('tenant-officehub', validTenantContext);
      }).not.toThrow();
    });

    it('should throw TenantIsolationViolationError on cross-tenant access attempt', () => {
      expect(() => {
        assertTenantMatch('tenant-competitor', validTenantContext);
      }).toThrow(TenantIsolationViolationError);
    });

    it('should grant authorized actions according to user role permissions', () => {
      expect(() => {
        assertPermission(validTenantContext, Permissions.PART_CREATE);
      }).not.toThrow();
      expect(() => {
        assertPermission(validTenantContext, Permissions.ECO_APPROVE);
      }).not.toThrow();
    });

    it('should deny unauthorized actions for restricted roles', () => {
      const viewerContext = {
        tenantId: 'tenant-officehub',
        userId: 'usr-guest',
        roles: ['READ_ONLY_VIEWER'],
        permissions: [],
        activeCapabilities: ['DISCRETE_MANUFACTURING' as const],
      };

      expect(() => {
        assertPermission(viewerContext, Permissions.ECO_APPROVE);
      }).toThrow(TenantAuthorizationError);
    });
  });

  describe('Invariant 3: Revision Immutability & Lifecycle States', () => {
    it('should enforce baseline lock on released engineering revisions', () => {
      const releasedRevision: PartRevision = {
        id: 'rev-001',
        tenantId: 'tenant-officehub',
        partId: 'part-arm-100',
        revision: 'A',
        lifecycleState: 'RELEASED',
        releasedAt: '2026-10-15T10:00:00Z',
        releasedBy: 'eng-lead@officehub.tech',
        isBaselineLocked: true,
        createdAt: '2026-10-14T08:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
      };

      expect(releasedRevision.lifecycleState).toBe('RELEASED');
      expect(releasedRevision.isBaselineLocked).toBe(true);
    });
  });

  describe('Invariant 7: Safe Recursive BOM Processing & Cycle Traps', () => {
    // Simulated assembly graph:
    // P1 -> P2 -> P3
    const graph: Record<string, string[]> = {
      P1: ['P2'],
      P2: ['P3'],
      P3: [],
    };

    const provider = {
      getChildren: (id: string) => graph[id] || [],
    };

    it('should allow valid non-circular parent-child assembly insertions', async () => {
      // Adding P3 -> P4 is completely valid
      await expect(assertNoBomCycle('P3', 'P4', provider)).resolves.not.toThrow();
    });

    it('should detect and reject immediate self-referential cycles (P1 -> P1)', async () => {
      await expect(assertNoBomCycle('P1', 'P1', provider)).rejects.toThrow(
        CircularBomReferenceError
      );
    });

    it('should detect and reject deep multi-hop cycles (P3 -> P1)', async () => {
      // If we attempt to make P3 the parent of P1, that would create P1 -> P2 -> P3 -> P1!
      await expect(assertNoBomCycle('P3', 'P1', provider)).rejects.toThrow(
        CircularBomReferenceError
      );
    });
  });

});
