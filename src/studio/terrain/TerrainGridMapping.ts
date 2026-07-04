import type { TerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'

export function terrainGridSteps(field: TerrainHeightfield): {
  stepX: number
  stepZ: number
  subdivisions: number
} {
  const subdivisions = Math.max(1, field.resolution - 1)
  return {
    stepX: field.width / subdivisions,
    stepZ: field.height / subdivisions,
    subdivisions,
  }
}

/** Surface grid index (i = X, j = Z from minZ) → Babylon ground vertex index. */
export function surfaceIndexToMeshVertex(
  i: number,
  j: number,
  resolution: number,
): number {
  const jMesh = resolution - 1 - j
  return jMesh * resolution + i
}

/** Babylon ground vertex index → surface grid index. */
export function meshVertexToSurfaceIndex(
  meshVertex: number,
  resolution: number,
): { i: number; j: number } {
  const jMesh = Math.floor(meshVertex / resolution)
  const i = meshVertex % resolution
  const j = resolution - 1 - jMesh
  return { i, j }
}

export function terrainVertexWorldPosition(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  i: number,
  j: number,
): { x: number; z: number } {
  const { stepX, stepZ } = terrainGridSteps(field)
  const halfW = field.width * 0.5
  const halfH = field.height * 0.5
  return {
    x: originX - halfW + i * stepX,
    z: originZ - halfH + j * stepZ,
  }
}

export function worldToTerrainGridIndex(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  worldX: number,
  worldZ: number,
): { i: number; j: number } | null {
  const { stepX, stepZ } = terrainGridSteps(field)
  const halfW = field.width * 0.5
  const halfH = field.height * 0.5
  const localX = worldX - originX + halfW
  const localZ = worldZ - originZ + halfH

  if (localX < 0 || localZ < 0 || localX > field.width || localZ > field.height) {
    return null
  }

  const resolution = field.resolution
  const i = Math.min(resolution - 1, Math.max(0, Math.round(localX / stepX)))
  const j = Math.min(resolution - 1, Math.max(0, Math.round(localZ / stepZ)))
  return { i, j }
}
