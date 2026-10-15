/**
 * @universal-plm/autonomous-operations
 * 3D CAD Digital Twin & WebGL/Canvas Assembly Model Engine
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox3D {
  min: Vector3D;
  max: Vector3D;
  dimensions: Vector3D; // width, height, depth
}

export interface Cad3dMeshNode {
  id: string;
  partNumber: string;
  name: string;
  material: string;
  colorHex: string;
  center: Vector3D;
  bounds: BoundingBox3D;
  explodeDirection: Vector3D;
  currentPosition?: Vector3D;
  parentPartId?: string;
  isSubassembly?: boolean;
}

export interface DigitalTwinAssembly {
  assemblyId: string;
  assemblyName: string;
  overallBounds: BoundingBox3D;
  partsCount: number;
  meshes: Cad3dMeshNode[];
}

/**
 * Creates a synthetic high-fidelity 3D CAD Digital Twin model from assembly parameters
 */
export function createSyntheticDigitalTwinAssembly(
  rootPartNumber: string,
  rootName: string
): DigitalTwinAssembly {
  const meshes: Cad3dMeshNode[] = [
    {
      id: 'MESH-01',
      partNumber: `${rootPartNumber}-BASE`,
      name: 'Cast Aluminum Chassis Baseplate',
      material: 'Aluminum 6061-T6',
      colorHex: '#334155',
      center: { x: 0, y: 0, z: 0 },
      bounds: {
        min: { x: -120, y: -20, z: -80 },
        max: { x: 120, y: 0, z: 80 },
        dimensions: { x: 240, y: 20, z: 160 }
      },
      explodeDirection: { x: 0, y: -1, z: 0 }
    },
    {
      id: 'MESH-02',
      partNumber: `${rootPartNumber}-PCB`,
      name: 'Main Processing Motherboard Assembly',
      material: 'FR4 Multi-Layer',
      colorHex: '#059669',
      center: { x: 0, y: 15, z: 0 },
      bounds: {
        min: { x: -90, y: 10, z: -60 },
        max: { x: 90, y: 20, z: 60 },
        dimensions: { x: 180, y: 10, z: 120 }
      },
      explodeDirection: { x: 0, y: 0.5, z: 0 }
    },
    {
      id: 'MESH-03',
      partNumber: `${rootPartNumber}-HEAT`,
      name: 'Extruded Copper Heatsink & Heatpipes',
      material: 'Oxygen-Free Copper C101',
      colorHex: '#d97706',
      center: { x: -20, y: 35, z: 0 },
      bounds: {
        min: { x: -60, y: 20, z: -40 },
        max: { x: 20, y: 50, z: 40 },
        dimensions: { x: 80, y: 30, z: 80 }
      },
      explodeDirection: { x: -0.8, y: 0.8, z: 0 }
    },
    {
      id: 'MESH-04',
      partNumber: `${rootPartNumber}-FAN`,
      name: 'Dual Brushless 80mm Cooling Blower',
      material: 'PBT Thermoplastic',
      colorHex: '#1e293b',
      center: { x: 50, y: 35, z: 0 },
      bounds: {
        min: { x: 20, y: 20, z: -40 },
        max: { x: 80, y: 50, z: 40 },
        dimensions: { x: 60, y: 30, z: 80 }
      },
      explodeDirection: { x: 0.8, y: 0.8, z: 0 }
    },
    {
      id: 'MESH-05',
      partNumber: `${rootPartNumber}-COVER`,
      name: 'Anodized Top Enclosure Shell',
      material: 'Aluminum 5052',
      colorHex: '#64748b',
      center: { x: 0, y: 65, z: 0 },
      bounds: {
        min: { x: -125, y: 50, z: -85 },
        max: { x: 125, y: 80, z: 85 },
        dimensions: { x: 250, y: 30, z: 170 }
      },
      explodeDirection: { x: 0, y: 1.5, z: 0 }
    },
    {
      id: 'MESH-06',
      partNumber: `${rootPartNumber}-FSTN-L`,
      name: 'M4x16 Socket Head Cap Screws (Left Quad)',
      material: 'Stainless Steel 316',
      colorHex: '#94a3b8',
      center: { x: -110, y: 75, z: 70 },
      bounds: {
        min: { x: -115, y: 65, z: 65 },
        max: { x: -105, y: 85, z: 75 },
        dimensions: { x: 10, y: 20, z: 10 }
      },
      explodeDirection: { x: -0.6, y: 1.8, z: 0.6 }
    },
    {
      id: 'MESH-07',
      partNumber: `${rootPartNumber}-FSTN-R`,
      name: 'M4x16 Socket Head Cap Screws (Right Quad)',
      material: 'Stainless Steel 316',
      colorHex: '#94a3b8',
      center: { x: 110, y: 75, z: 70 },
      bounds: {
        min: { x: 105, y: 65, z: 65 },
        max: { x: 115, y: 85, z: 75 },
        dimensions: { x: 10, y: 20, z: 10 }
      },
      explodeDirection: { x: 0.6, y: 1.8, z: 0.6 }
    }
  ];

  return {
    assemblyId: `DT-${rootPartNumber}`,
    assemblyName: rootName,
    overallBounds: {
      min: { x: -125, y: -20, z: -85 },
      max: { x: 125, y: 85, z: 85 },
      dimensions: { x: 250, y: 105, z: 170 }
    },
    partsCount: meshes.length,
    meshes
  };
}

/**
 * Calculates translated 3D positions for all assembly meshes based on an explosion factor (0.0 to 1.0)
 */
export function computeExplodedAssemblyTransforms(
  meshes: Cad3dMeshNode[],
  explodeFactor: number, // 0.0 (assembled) to 1.0 (fully exploded)
  maxDisplacement: number = 100
): Cad3dMeshNode[] {
  const factor = Math.max(0, Math.min(1.0, explodeFactor));

  return meshes.map((mesh) => {
    const currentPosition: Vector3D = {
      x: mesh.center.x + mesh.explodeDirection.x * maxDisplacement * factor,
      y: mesh.center.y + mesh.explodeDirection.y * maxDisplacement * factor,
      z: mesh.center.z + mesh.explodeDirection.z * maxDisplacement * factor
    };

    return {
      ...mesh,
      currentPosition
    };
  });
}

/**
 * Evaluates whether parts are intersected or clipped by a cross-section plane
 */
export function evaluateCrossSectionSlicing(
  meshes: Cad3dMeshNode[],
  axis: 'x' | 'y' | 'z',
  slicePosition: number
): Array<{ partNumber: string; isSliced: boolean; visibleVolumePct: number }> {
  return meshes.map((mesh) => {
    const minCoord = mesh.bounds.min[axis];
    const maxCoord = mesh.bounds.max[axis];

    if (slicePosition <= minCoord) {
      return { partNumber: mesh.partNumber, isSliced: false, visibleVolumePct: 100 };
    }
    if (slicePosition >= maxCoord) {
      return { partNumber: mesh.partNumber, isSliced: false, visibleVolumePct: 0 };
    }

    const totalSpan = maxCoord - minCoord;
    const remainingSpan = maxCoord - slicePosition;
    const visibleVolumePct = Math.round((remainingSpan / totalSpan) * 100);

    return {
      partNumber: mesh.partNumber,
      isSliced: true,
      visibleVolumePct
    };
  });
}
