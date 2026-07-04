import type { Mesh } from '@babylonjs/core'
import { VertexBuffer } from '@babylonjs/core'
import type { WorldMapTerrain } from '@/types/world-map.ts'
import {
  ensureTerrainHeightfield,
  type TerrainCellBounds,
  type TerrainHeightfield,
} from '@/studio/terrain/TerrainHeightmap.ts'
import {
  applyTerrainPipelineMaterial,
  prepareTerrainMeshForPipeline,
  setTerrainMeshPreviewTint,
  syncTerrainMeshPipeline,
  createTerrainGroundMesh as createPipelineTerrainMesh,
} from '@/rendering/terrain/TerrainRenderPipeline.ts'

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
  return createPipelineTerrainMesh(scene, name, {
    width,
    depth,
    resolution,
    updatable: true,
  })
}

export function prepareTerrainMeshForLiveEdit(mesh: Mesh): void {
  prepareTerrainMeshForPipeline(mesh)
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
  if (!mesh.material) {
    applyTerrainPipelineMaterial(mesh, mesh.getScene())
  }
  syncTerrainMeshPipeline(mesh, field, baseY, options)
}

/** @deprecated Use pipeline material via syncTerrainMeshField. */
export function tintTerrainMaterial(mesh: Mesh): void {
  mesh.useVertexColors = true
  if (!mesh.material) {
    applyTerrainPipelineMaterial(mesh, mesh.getScene())
  }
}

export function terrainPreviewTint(mesh: Mesh, active: boolean): void {
  setTerrainMeshPreviewTint(mesh, active)
}

export function markTerrainMeshUpdatable(mesh: Mesh): void {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  if (positions) {
    mesh.setVerticesData(VertexBuffer.PositionKind, positions, true)
    mesh.markVerticesDataAsUpdatable(VertexBuffer.PositionKind)
  }
}
