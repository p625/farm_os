import type { Mesh } from '@babylonjs/core'
import { Color3, MeshBuilder, StandardMaterial, VertexBuffer } from '@babylonjs/core'
import type { WorldMapTerrain } from '@/types/world-map.ts'
import {
  ensureTerrainHeightfield,
  type TerrainCellBounds,
  type TerrainHeightfield,
} from '@/studio/terrain/TerrainHeightmap.ts'
import { getTerrainSurfaceColor } from '@/studio/terrain/TerrainSurfacePalette.ts'

export interface SyncTerrainMeshOptions {
  /** Recompute mesh normals (skip during live paint for responsiveness). */
  normals?: boolean
  /** Limit position updates to brush-affected cells. */
  positionBounds?: TerrainCellBounds
}

export function createTerrainGroundMesh(
  scene: import('@babylonjs/core').Scene,
  name: string,
  width: number,
  depth: number,
  resolution: number,
): Mesh {
  const subdivisions = Math.max(1, resolution - 1)
  return MeshBuilder.CreateGround(
    name,
    { width, height: depth, subdivisions, updatable: true },
    scene,
  )
}

function writeSurfaceColors(
  colors: Float32Array,
  resolution: number,
  surfaces: readonly number[],
): void {
  for (let j = 0; j < resolution; j++) {
    for (let i = 0; i < resolution; i++) {
      const vertex = j * resolution + i
      const [r, g, b] = getTerrainSurfaceColor(surfaces[vertex])
      colors[vertex * 4] = r
      colors[vertex * 4 + 1] = g
      colors[vertex * 4 + 2] = b
      colors[vertex * 4 + 3] = 1
    }
  }
}

export function prepareTerrainMeshForLiveEdit(mesh: Mesh): void {
  tintTerrainMaterial(mesh)
  mesh.useVertexColors = true

  const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  if (positions) {
    mesh.setVerticesData(VertexBuffer.PositionKind, positions, true)
    mesh.markVerticesDataAsUpdatable(VertexBuffer.PositionKind)
  }
}

export function syncTerrainMesh(
  mesh: Mesh,
  terrain: WorldMapTerrain,
  baseY: number,
  options: SyncTerrainMeshOptions = {},
): void {
  syncTerrainMeshField(mesh, ensureTerrainHeightfield(terrain), baseY, options)
}

export function syncTerrainMeshField(
  mesh: Mesh,
  field: TerrainHeightfield,
  baseY: number,
  options: SyncTerrainMeshOptions = {},
): void {
  const { resolution, heights, surfaces } = field
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  if (!positions) {
    return
  }

  const vertexCount = resolution * resolution
  const positionBounds = options.positionBounds
  const updateAllPositions = !positionBounds

  const posMinI = positionBounds?.minI ?? 0
  const posMaxI = positionBounds?.maxI ?? resolution - 1
  const posMinJ = positionBounds?.minJ ?? 0
  const posMaxJ = positionBounds?.maxJ ?? resolution - 1

  let positionsDirty = false

  if (updateAllPositions) {
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const vertex = j * resolution + i
        positions[vertex * 3 + 1] = heights[vertex] - baseY
      }
    }
    positionsDirty = true
  } else if (positionBounds) {
    for (let j = posMinJ; j <= posMaxJ; j++) {
      for (let i = posMinI; i <= posMaxI; i++) {
        const vertex = j * resolution + i
        positions[vertex * 3 + 1] = heights[vertex] - baseY
      }
    }
    positionsDirty = true
  }

  const colors = new Float32Array(vertexCount * 4)
  writeSurfaceColors(colors, resolution, surfaces)

  if (positionsDirty) {
    mesh.setVerticesData(VertexBuffer.PositionKind, positions, true)
    mesh.markVerticesDataAsUpdatable(VertexBuffer.PositionKind)
  }

  mesh.setVerticesData(VertexBuffer.ColorKind, colors, true)
  mesh.markVerticesDataAsUpdatable(VertexBuffer.ColorKind)
  tintTerrainMaterial(mesh)
  mesh.useVertexColors = true

  const recomputeNormals = options.normals ?? positionsDirty
  if (recomputeNormals) {
    mesh.createNormals(true)
  }

  mesh.refreshBoundingInfo()
}

export function tintTerrainMaterial(mesh: Mesh): void {
  mesh.useVertexColors = true
  const material = mesh.material
  if (material instanceof StandardMaterial) {
    material.diffuseColor = new Color3(1, 1, 1)
    material.specularColor = new Color3(0.05, 0.05, 0.05)
    material.disableLighting = false
    material.markDirty()
  }
}

export function terrainPreviewTint(mesh: Mesh, active: boolean): void {
  const material = mesh.material
  if (!(material instanceof StandardMaterial)) {
    return
  }
  material.emissiveColor = active
    ? new Color3(0.04, 0.06, 0.03)
    : new Color3(0.02, 0.03, 0.01)
  material.markDirty()
}
