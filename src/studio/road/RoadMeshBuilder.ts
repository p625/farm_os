import type { Scene } from '@babylonjs/core'
import { Color3, Mesh, StandardMaterial, VertexBuffer } from '@babylonjs/core'
import type { RoadControlPoint } from '@/types/road.ts'
import type { RoadKind } from '@/types/road.ts'
import {
  adjustControlPointsForJunctionMesh,
  isAsphaltKind,
  type JunctionMeshContext,
} from '@/studio/road/RoadJunction.ts'
import { getRoadTypeDefinition } from '@/studio/road/RoadTypePalette.ts'
import { sampleRoadSpline } from '@/studio/road/RoadSpline.ts'

const TERRAIN_SURFACE_OFFSET = 0.08

function roadSurfaceOffset(roadKind: RoadKind): number {
  if (isAsphaltKind(roadKind)) {
    return TERRAIN_SURFACE_OFFSET + 0.012
  }
  return TERRAIN_SURFACE_OFFSET - 0.018
}

function roadMaterialZOffset(roadKind: RoadKind): number {
  if (isAsphaltKind(roadKind)) {
    return -1
  }
  return -4
}

function roadRenderingGroup(roadKind: RoadKind): number {
  return isAsphaltKind(roadKind) ? 2 : 1
}

export type TerrainHeightSampler = (worldX: number, worldZ: number) => number

export function createRoadRibbonMesh(
  scene: Scene,
  name: string,
  points: readonly RoadControlPoint[],
  roadKind: RoadKind,
  sampleHeight?: TerrainHeightSampler,
  junctionContext?: JunctionMeshContext,
): Mesh | null {
  if (points.length < 2) {
    return null
  }

  const roadType = getRoadTypeDefinition(roadKind)
  const surfaceOffset = roadSurfaceOffset(roadKind)
  const meshPoints = adjustControlPointsForJunctionMesh(points, roadKind, junctionContext)
  let samples = sampleRoadSpline(meshPoints, 10)
  if (samples.length < 2) {
    return null
  }

  if (sampleHeight) {
    samples = samples.map((sample) => ({
      ...sample,
      y: sampleHeight(sample.x, sample.z) + surfaceOffset,
    }))
  }

  const halfWidth = roadType.width * 0.5
  const positions: number[] = []
  const indices: number[] = []
  const uvs: number[] = []

  let distanceAlong = 0

  for (let i = 0; i < samples.length; i++) {
    const current = samples[i]
    const prev = samples[Math.max(0, i - 1)]
    const next = samples[Math.min(samples.length - 1, i + 1)]
    const tangentX = next.x - prev.x
    const tangentZ = next.z - prev.z
    const length = Math.hypot(tangentX, tangentZ) || 1
    const perpX = -tangentZ / length
    const perpZ = tangentX / length

    if (i > 0) {
      distanceAlong += Math.hypot(current.x - prev.x, current.z - prev.z)
    }

    positions.push(
      current.x + perpX * halfWidth,
      current.y,
      current.z + perpZ * halfWidth,
      current.x - perpX * halfWidth,
      current.y,
      current.z - perpZ * halfWidth,
    )
    uvs.push(0, distanceAlong * 0.1, 1, distanceAlong * 0.1)

    if (i < samples.length - 1) {
      const base = i * 2
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2)
    }
  }

  const mesh = new Mesh(name, scene)
  mesh.setVerticesData(VertexBuffer.PositionKind, new Float32Array(positions), true)
  mesh.setVerticesData(VertexBuffer.UVKind, new Float32Array(uvs), true)
  mesh.setIndices(indices)
  mesh.createNormals(true)
  mesh.refreshBoundingInfo()
  mesh.renderingGroupId = roadRenderingGroup(roadKind)
  mesh.isPickable = true

  const [r, g, b] = roadType.color
  const material = new StandardMaterial(`mat_${name}`, scene)
  material.diffuseColor = new Color3(r, g, b)
  material.specularColor = new Color3(0.12, 0.12, 0.12)
  material.zOffset = roadMaterialZOffset(roadKind)
  mesh.material = material
  mesh.receiveShadows = true

  return mesh
}

export function snapRoadPointsToTerrain(
  points: readonly RoadControlPoint[],
  sampleHeight: TerrainHeightSampler,
  roadKind: RoadKind = 'field_path',
): RoadControlPoint[] {
  const surfaceOffset = roadSurfaceOffset(roadKind)
  return points.map((point) => ({
    ...point,
    x: point.x,
    y: sampleHeight(point.x, point.z) + surfaceOffset,
    z: point.z,
  }))
}

export { TERRAIN_SURFACE_OFFSET as ROAD_SURFACE_OFFSET }
