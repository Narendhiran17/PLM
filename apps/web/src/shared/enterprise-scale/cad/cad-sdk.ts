/**
 * @universal-plm/enterprise-scale
 * CAD Connector SDK & Bi-Directional Assembly Sync Engine
 * Supported Systems: SolidWorks, Autodesk Inventor, PTC Creo, ISO 10303 STEP
 */

export type CadSystemType = 'SOLIDWORKS' | 'AUTODESK_INVENTOR' | 'PTC_CREO' | 'STEP_ISO_10303';

export interface CadAssemblyNode {
  nodeId: string;
  cadSystem: CadSystemType;
  fileName: string;
  partNumber: string;
  revision: string;
  title: string;
  material?: string;
  massKg?: number;
  quantity: number;
  customProperties?: Record<string, string | number | boolean>;
  children?: CadAssemblyNode[];
}

export interface ExtractedEbomPart {
  partId: string;
  partNumber: string;
  name: string;
  revision: string;
  material?: string;
  weightGrams?: number;
  cadSourceFile: string;
  cadSystem: CadSystemType;
}

export interface ExtractedEbomLine {
  parentPartId: string;
  childPartId: string;
  quantity: number;
  findNumber: number;
}

export interface CadExtractionResult {
  rootPartId: string;
  totalUniqueParts: number;
  totalBomLines: number;
  parts: ExtractedEbomPart[];
  bomLines: ExtractedEbomLine[];
}

/**
 * Traverses a CAD native assembly structure and transforms it into normalized PLM EBOM entities
 */
export function extractEbomFromCadAssembly(rootNode: CadAssemblyNode): CadExtractionResult {
  const partsMap = new Map<string, ExtractedEbomPart>();
  const bomLines: ExtractedEbomLine[] = [];

  function traverse(node: CadAssemblyNode, parentId?: string, findNum: number = 10) {
    const partId = `PART-CAD-${node.partNumber.toUpperCase()}`;

    if (!partsMap.has(partId)) {
      partsMap.set(partId, {
        partId,
        partNumber: node.partNumber,
        name: node.title || node.fileName,
        revision: node.revision || '1.0',
        material: node.material,
        weightGrams: node.massKg ? Math.round(node.massKg * 1000) : undefined,
        cadSourceFile: node.fileName,
        cadSystem: node.cadSystem
      });
    }

    if (parentId) {
      bomLines.push({
        parentPartId: parentId,
        childPartId: partId,
        quantity: node.quantity || 1,
        findNumber: findNum
      });
    }

    if (node.children && node.children.length > 0) {
      let childFind = 10;
      for (const child of node.children) {
        traverse(child, partId, childFind);
        childFind += 10;
      }
    }
  }

  traverse(rootNode);

  return {
    rootPartId: `PART-CAD-${rootNode.partNumber.toUpperCase()}`,
    totalUniqueParts: partsMap.size,
    totalBomLines: bomLines.length,
    parts: Array.from(partsMap.values()),
    bomLines
  };
}

/**
 * Propagates CAD property changes back into PLM records, detecting field modifications
 */
export function syncCadPropertiesToPlm(
  cadNode: CadAssemblyNode,
  plmPart: { name: string; revision: string; customFields?: Record<string, any> }
): { hasChanges: boolean; delta: Record<string, any> } {
  const delta: Record<string, any> = {};

  if (cadNode.title && cadNode.title !== plmPart.name) {
    delta.name = { before: plmPart.name, after: cadNode.title };
  }

  if (cadNode.material && cadNode.material !== plmPart.customFields?.material) {
    delta.material = { before: plmPart.customFields?.material, after: cadNode.material };
  }

  if (cadNode.massKg !== undefined) {
    const grams = Math.round(cadNode.massKg * 1000);
    if (grams !== plmPart.customFields?.weightGrams) {
      delta.weightGrams = { before: plmPart.customFields?.weightGrams, after: grams };
    }
  }

  return {
    hasChanges: Object.keys(delta).length > 0,
    delta
  };
}
