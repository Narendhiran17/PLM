import { FastifyPluginAsync } from 'fastify';
import { ProductFamily, ProductVariant } from '@universal-plm/domain-core';
import { assertPermission, Permissions } from '@universal-plm/authorization';

// Product families and variants initialized empty for clean-slate testing
const sampleFamilies: ProductFamily[] = [];
const sampleVariants: ProductVariant[] = [];

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
