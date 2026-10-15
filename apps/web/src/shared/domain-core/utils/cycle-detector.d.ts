export declare class CircularBomReferenceError extends Error {
    readonly cyclePath: string[];
    constructor(cyclePath: string[]);
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
export declare function assertNoBomCycle(parentPartId: string, candidateChildPartId: string, provider: AdjacencyProvider, maxDepth?: number): Promise<void>;
//# sourceMappingURL=cycle-detector.d.ts.map