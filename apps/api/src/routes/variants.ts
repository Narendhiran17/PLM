import { FastifyPluginAsync } from 'fastify';
import { ProductFamily, ProductVariant } from '@universal-plm/domain-core';
import { assertPermission, Permissions } from '@universal-plm/authorization';

const sampleFamilies: ProductFamily[] = [
  {
    id: 'fam-001',
    tenantId: 'default-tenant',
    familyCode: 'ROB-FAMILY',
    name: 'Articulated Industrial Robot Series',
    description: 'High-payload articulated 6-axis industrial robots',
    basePartId: 'part-001',
    optionGroups: [
      {
        id: 'opt-payload',
        code: 'PAYLOAD',
        name: 'Payload Capacity',
        isMandatory: true,
        values: [
          { id: 'val-10kg', code: '10KG', label: '10 kg High Speed' },
          { id: 'val-20kg', code: '20KG', label: '20 kg Standard' },
          { id: 'val-50kg', code: '50KG', label: '50 kg Heavy Duty' },
        ],
      },
      {
        id: 'opt-ip',
        code: 'IP_RATING',
        name: 'Environmental Protection Rating',
        isMandatory: true,
        values: [
          { id: 'val-ip54', code: 'IP54', label: 'IP54 Standard Workshop' },
          { id: 'val-ip67', code: 'IP67', label: 'IP67 Cleanroom / Washdown' },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleVariants: ProductVariant[] = [
  {
    id: 'var-001',
    tenantId: 'default-tenant',
    familyId: 'fam-001',
    variantSku: 'ROB-1000-10K-IP54',
    name: 'Robotic Arm (10kg Payload, IP54)',
    selectedOptionValueIds: ['val-10kg', 'val-ip54'],
    resolvedPartId: 'part-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'var-002',
    tenantId: 'default-tenant',
    familyId: 'fam-001',
    variantSku: 'ROB-1000-50K-IP67',
    name: 'Robotic Arm (50kg Payload, IP67 Washdown)',
    selectedOptionValueIds: ['val-50kg', 'val-ip67'],
    resolvedPartId: 'part-001-H',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const variantRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/families', async (request) => {
    assertPermission(request.tenantContext, Permissions.PART_READ);
    const families = sampleFamilies.filter(
      (f) => f.tenantId === request.tenantContext.tenantId
    );
    return { data: families, total: families.length };
  });

  fastify.get('/families/:familyId/variants', async (request) => {
    assertPermission(request.tenantContext, Permissions.PART_READ);
    const { familyId } = request.params as { familyId: string };
    const variants = sampleVariants.filter(
      (v) => v.familyId === familyId && v.tenantId === request.tenantContext.tenantId
    );
    return { data: variants, total: variants.length };
  });
};
