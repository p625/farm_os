import type { Mesh } from '@babylonjs/core'
import { Color3, MeshBuilder, StandardMaterial, VertexBuffer } from '@babylonjs/core'
import type { WorldMapTerrain } from '@/types/world-map.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { getTerrainSurfaceColor } from '@/studio/terrain/TerrainSurfacePalette.ts'

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
    { width, height: depth, subdivisions },
    scene,
  )
}

export function syncTerrainMesh(
  mesh: Mesh,
  terrain: WorldMapTerrain,
  baseY: number,
): void {
  const field = ensureTerrainHeightfield(terrain)
  const { resolution, heights, surfaces } = field
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  if (!positions) {
    return
  }

  const vertexCount = resolution * resolution
  const colors = new Float32Array(vertexCount * 4)

  for (let j = 0; j < resolution; j++) {
    for (let i = 0; i < resolution; i++) {
      const vertex = j * resolution + i
      const cell = j * resolution + i
      positions[vertex * 3 + 1] = heights[cell] - baseY

      const surface = getTerrainSurfaceColor(surfaces[cell])
      colors[vertex * 4] = surface[0]
      colors[vertex * 4 + 1] = surface[1]
      colors[vertex * 4 + 2] = surface[2]
      colors[vertex * 4 + 3] = 1
    }
  }

  mesh.updateVerticesData(VertexBuffer.PositionKind, positions)
  mesh.updateVerticesData(VertexBuffer.ColorKind, colors)
  mesh.createNormals(true)
  mesh.refreshBoundingInfo()
}

export function tintTerrainMaterial(mesh: Mesh): void {
  mesh.useVertexColors = true
  const material = mesh.material
  if (material instanceof StandardMaterial) {
    material.diffuseColor = new Color3(1, 1, 1)
    material.specularColor = new Color3(0.05, 0.05, 0.05)
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
}
