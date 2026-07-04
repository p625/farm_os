import type { Scene } from '@babylonjs/core'
import { Color3, Mesh, StandardMaterial, VertexBuffer } from '@babylonjs/core'
import type { RoadControlPoint } from '@/types/road.ts'
import type { RoadKind } from '@/types/road.ts'
import { trimControlPointsForMesh } from '@/studio/road/RoadJunction.ts'
import { getRoadTypeDefinition } from '@/studio/road/RoadTypePalette.ts'
import { sampleRoadSpline } from '@/studio/road/RoadSpline.ts'

const ROAD_SURFACE_OFFSET = 0.08

export type TerrainHeightSampler = (worldX: number, worldZ: number) => number

export function createRoadRibbonMesh(
  scene: Scene,
  name: string,
  points: readonly RoadControlPoint[],
  roadKind: RoadKind,
  sampleHeight?: TerrainHeightSampler,
): Mesh | null {
  if (points.length < 2) {
    return null
  }

  const roadType = getRoadTypeDefinition(roadKind)
  const meshPoints = trimControlPointsForMesh(points, roadKind)
  let samples = sampleRoadSpline(meshPoints, 10)
  if (samples.length < 2) {
    return null
  }

  if (sampleHeight) {
    samples = samples.map((sample) => ({
      ...sample,
      y: sampleHeight(sample.x, sample.z) + ROAD_SURFACE_OFFSET,
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
  mesh.renderingGroupId = 1
  mesh.isPickable = true

  const [r, g, b] = roadType.color
  const material = new StandardMaterial(`mat_${name}`, scene)
  material.diffuseColor = new Color3(r, g, b)
  material.specularColor = new Color3(0.12, 0.12, 0.12)
  material.zOffset = -2
  mesh.material = material
  mesh.receiveShadows = true

  return mesh
}

export function snapRoadPointsToTerrain(
  points: readonly RoadControlPoint[],
  sampleHeight: TerrainHeightSampler,
): RoadControlPoint[] {
  return points.map((point) => ({
    ...point,
    x: point.x,
    y: sampleHeight(point.x, point.z) + ROAD_SURFACE_OFFSET,
    z: point.z,
  }))
}

export { ROAD_SURFACE_OFFSET }
