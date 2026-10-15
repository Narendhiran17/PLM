/**
 * @universal-plm/enterprise-scale
 * High-Volume BOM Traversal & Memoized Caching Engine
 * Target: Sub-50ms resolution of 10,000+ line BOM trees (TST-07)
 */

export interface CachedBomLine {
  parentPartId: string;
  childPartId: string;
  quantity: number;
  unitCost: number;
  leadTimeDays: number;
}

export interface ExplodedNode {
  partId: string;
  level: number;
  unitQuantity: number;
  cumulativeQuantity: number;
  extendedCost: number;
  maxLeadTimeDays: number;
}

export interface TraversalResult {
  rootPartId: string;
  totalLinesTraversed: number;
  totalComponentsResolved: number;
  totalMaterialCost: number;
  maxCriticalLeadTimeDays: number;
  traversalDurationMs: number;
  cacheHitRatio: number;
}

export class HighVolumeBomEngine {
  // Graph index: parentPartId -> CachedBomLine[]
  private adjacencyIndex = new Map<string, CachedBomLine[]>();
  // Subassembly memoization cache: partId -> pre-aggregated sub-tree stats
  private subassemblyCache = new Map<string, { totalLines: number; totalCost: number; maxLeadTime: number }>();
  private cacheHits = 0;
  private cacheLookups = 0;

  /**
   * Bulk loads adjacency graph lines
   */
  public loadLines(lines: CachedBomLine[]): void {
    for (const line of lines) {
      const existing = this.adjacencyIndex.get(line.parentPartId) || [];
      existing.push(line);
      this.adjacencyIndex.set(line.parentPartId, existing);
    }
  }

  /**
   * Clear or invalidate memoized sub-assembly cache on revision release or ECO
   */
  public invalidateCache(partId?: string): void {
    if (partId) {
      this.subassemblyCache.delete(partId);
    } else {
      this.subassemblyCache.clear();
    }
    this.cacheHits = 0;
    this.cacheLookups = 0;
  }

  /**
   * Explodes high-volume BOM with cycle detection and sub-assembly memoization
   */
  public explodeBom(rootPartId: string, maxDepth: number = 30): TraversalResult {
    const startTime = performance.now();
    const visitedInPath = new Set<string>();
    let totalLinesTraversed = 0;
    let totalComponentsResolved = 0;
    let totalMaterialCost = 0;
    let maxCriticalLeadTimeDays = 0;

    const traverse = (
      currentPartId: string,
      currentQty: number,
      depth: number,
      currentLeadTime: number
    ): { subtreeCost: number; subtreeLines: number; subtreeMaxLead: number } => {
      if (depth > maxDepth) {
        throw new Error(`Max BOM explosion depth ${maxDepth} exceeded at part ${currentPartId}`);
      }

      if (visitedInPath.has(currentPartId)) {
        throw new Error(`BOM cyclic dependency loop detected at ${currentPartId}`);
      }

      visitedInPath.add(currentPartId);

      const children = this.adjacencyIndex.get(currentPartId);
      if (children && children.length > 0) {
        this.cacheLookups++;
        const cached = this.subassemblyCache.get(currentPartId);
        if (cached && depth > 1) {
          this.cacheHits++;
          totalLinesTraversed += cached.totalLines;
          totalMaterialCost += cached.totalCost * currentQty;
          maxCriticalLeadTimeDays = Math.max(maxCriticalLeadTimeDays, currentLeadTime + cached.maxLeadTime);
          visitedInPath.delete(currentPartId);
          return {
            subtreeCost: cached.totalCost,
            subtreeLines: cached.totalLines,
            subtreeMaxLead: cached.maxLeadTime
          };
        }

        let subtreeCost = 0;
        let subtreeMaxLead = 0;
        let subtreeLines = 0;

        for (const child of children) {
          totalLinesTraversed++;
          subtreeLines++;
          const childCumulativeQty = currentQty * child.quantity;
          const directLineCost = child.quantity * child.unitCost;
          subtreeCost += directLineCost;
          subtreeMaxLead = Math.max(subtreeMaxLead, child.leadTimeDays);

          totalComponentsResolved += childCumulativeQty;
          totalMaterialCost += childCumulativeQty * child.unitCost;
          maxCriticalLeadTimeDays = Math.max(maxCriticalLeadTimeDays, currentLeadTime + child.leadTimeDays);

          const childSub = traverse(
            child.childPartId,
            childCumulativeQty,
            depth + 1,
            currentLeadTime + child.leadTimeDays
          );
          subtreeLines += childSub.subtreeLines;
          subtreeCost += childSub.subtreeCost * child.quantity;
          subtreeMaxLead = Math.max(subtreeMaxLead, child.leadTimeDays + childSub.subtreeMaxLead);
        }

        this.subassemblyCache.set(currentPartId, {
          totalLines: subtreeLines,
          totalCost: subtreeCost,
          maxLeadTime: subtreeMaxLead
        });

        visitedInPath.delete(currentPartId);
        return { subtreeCost, subtreeLines, subtreeMaxLead };
      }

      visitedInPath.delete(currentPartId);
      return { subtreeCost: 0, subtreeLines: 0, subtreeMaxLead: 0 };
    };

    traverse(rootPartId, 1, 1, 0);

    const endTime = performance.now();
    const traversalDurationMs = Number((endTime - startTime).toFixed(3));
    const cacheHitRatio = this.cacheLookups > 0 ? Number((this.cacheHits / this.cacheLookups).toFixed(3)) : 0;

    return {
      rootPartId,
      totalLinesTraversed,
      totalComponentsResolved,
      totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
      maxCriticalLeadTimeDays,
      traversalDurationMs,
      cacheHitRatio
    };
  }

  /**
   * Generates a synthetic deep benchmark tree with thousands of lines
   */
  public generateSyntheticBenchmarkTree(
    rootPartId: string,
    depth: number,
    branchingFactor: number
  ): CachedBomLine[] {
    const lines: CachedBomLine[] = [];
    let counter = 1;

    const createLevel = (parentId: string, currentDepth: number) => {
      if (currentDepth >= depth) return;

      for (let i = 0; i < branchingFactor; i++) {
        const childId = `SYNTH-PART-${counter++}`;
        const line: CachedBomLine = {
          parentPartId: parentId,
          childPartId: childId,
          quantity: (i % 3) + 1,
          unitCost: Number(((counter % 50) + 1.25).toFixed(2)),
          leadTimeDays: (counter % 14) + 1
        };
        lines.push(line);
        createLevel(childId, currentDepth + 1);
      }
    };

    createLevel(rootPartId, 0);
    this.loadLines(lines);
    return lines;
  }
}
