export class CircularBomReferenceError extends Error {
  constructor(public readonly cyclePath: string[]) {
    super(`Circular BOM reference detected along path: ${cyclePath.join(' -> ')}`);
    this.name = 'CircularBomReferenceError';
  }
}

export interface AdjacencyProvider {
  /**
   * Given a parent part ID, returns the array of direct child part IDs.
   */
  getChildren(partId: string): Promise<string[]> | string[];
}

/**
 * Asserts that adding an edge `parentPartId -> childPartId` does not create a circular dependency.
 * Throws `CircularBomReferenceError` if a cycle is found.
 */
export async function assertNoBomCycle(
  parentPartId: string,
  candidateChildPartId: string,
  provider: AdjacencyProvider,
  maxDepth = 25
): Promise<void> {
  // If parent directly equals child, it's an immediate self-loop
  if (parentPartId === candidateChildPartId) {
    throw new CircularBomReferenceError([parentPartId, candidateChildPartId]);
  }

  // Perform Depth-First Search (DFS) starting from candidateChildPartId to see if we can reach parentPartId
  const visited = new Set<string>();
  const path: string[] = [parentPartId, candidateChildPartId];

  async function dfs(currentId: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      throw new Error(`BOM hierarchy traversal exceeded maximum safe depth of ${maxDepth}`);
    }

    if (currentId === parentPartId) {
      throw new CircularBomReferenceError([...path]);
    }

    if (visited.has(currentId)) {
      return;
    }
    visited.add(currentId);

    const children = await provider.getChildren(currentId);
    for (const childId of children) {
      path.push(childId);
      await dfs(childId, depth + 1);
      path.pop();
    }
  }

  await dfs(candidateChildPartId, 1);
}
