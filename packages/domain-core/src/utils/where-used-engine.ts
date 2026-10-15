import { WhereUsedResult } from '../types/bom.js';

export interface ParentLink {
  parentPartId: string;
  parentPartNumber: string;
  parentPartName: string;
  parentRevisionId: string;
  parentRevision: string;
  quantity: number;
  bomType: 'EBOM' | 'MBOM';
  lifecycleState: string;
}

export interface ParentLookupProvider {
  /**
   * Returns immediate direct parents that consume this partId.
   */
  getImmediateParents(partId: string): Promise<ParentLink[]> | ParentLink[];
}

export interface DeepWhereUsedNode extends WhereUsedResult {
  path: string[];
  level: number;
  parents?: DeepWhereUsedNode[];
}

/**
 * Recursively explodes parents of a part to find every higher-level assembly that uses it.
 */
export async function findDeepWhereUsed(
  targetPartId: string,
  provider: ParentLookupProvider,
  maxLevels = 10
): Promise<DeepWhereUsedNode[]> {
  const results: DeepWhereUsedNode[] = [];
  const visited = new Set<string>();

  async function traverse(currentPartId: string, currentLevel: number, currentPath: string[]): Promise<void> {
    if (currentLevel > maxLevels) return;

    const parents = await provider.getImmediateParents(currentPartId);
    for (const parent of parents) {
      const nodeKey = `${parent.parentPartId}:${parent.parentRevisionId}`;
      const newPath = [...currentPath, parent.parentPartNumber];

      const node: DeepWhereUsedNode = {
        ...parent,
        level: currentLevel,
        path: newPath,
      };

      results.push(node);

      if (!visited.has(nodeKey)) {
        visited.add(nodeKey);
        await traverse(parent.parentPartId, currentLevel + 1, newPath);
      }
    }
  }

  await traverse(targetPartId, 1, []);
  return results;
}
