import type { Scene } from '@babylonjs/core'
import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  VertexBuffer,
} from '@babylonjs/core'
import type { WaterControlPoint } from '@/types/water.ts'
import { sampleRoadSpline } from '@/studio/road/RoadSpline.ts'
import type { WaterTypeDefinition } from '@/studio/water/WaterTypePalette.ts'
import type { WaterEllipse } from '@/studio/water/WaterAreaMath.ts'

export type WaterHeightSampler = (worldX: number, worldZ: number) => number

const WATER_RENDERING_GROUP = 1

function waterMaterial(
  scene: Scene,
  name: string,
  definition: WaterTypeDefinition,
  preview = false,
): StandardMaterial {
  const [r, g, b] = definition.color
  const material = new StandardMaterial(name, scene)
  const color = new Color3(r, g, b)
  material.diffuseColor = color
  material.specularColor = new Color3(0.35, 0.4, 0.45)
  material.emissiveColor = color.scale(0.08)
  material.alpha = preview ? 0.55 : 0.92
  if (preview) {
    material.disableLighting = true
  }
  material.zOffset = -2
  return material
}

export function createWaterRibbonMesh(
  scene: Scene,
  name: string,
  points: readonly WaterControlPoint[],
  definition: WaterTypeDefinition,
  sampleHeight?: WaterHeightSampler,
  preview = false,
): Mesh | null {
  if (points.length < 2 || !definition.width) {
    return null
  }

  let samples = sampleRoadSpline(points, 10)
  if (samples.length < 2) {
    return null
  }

  if (sampleHeight) {
    samples = samples.map((sample) => ({
      ...sample,
      y: sampleHeight(sample.x, sample.z) - definition.depthOffset,
    }))
  }

  const halfWidth = definition.width * 0.5
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
    uvs.push(0, distanceAlong * 0.08, 1, distanceAlong * 0.08)

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
  mesh.renderingGroupId = WATER_RENDERING_GROUP
  mesh.isPickable = true
  mesh.material = waterMaterial(scene, `mat_${name}`, definition, preview)
  mesh.receiveShadows = true
  return mesh
}

export function createWaterAreaMesh(
  scene: Scene,
  name: string,
  ellipse: WaterEllipse,
  surfaceY: number,
  definition: WaterTypeDefinition,
  preview = false,
): Mesh {
  const mesh = MeshBuilder.CreateDisc(
    name,
    { radius: 1, tessellation: 40 },
    scene,
  )
  mesh.rotation.x = Math.PI * 0.5
  mesh.scaling = new Vector3(ellipse.radiusX, ellipse.radiusZ, 1)
  mesh.position = new Vector3(
    ellipse.centerX,
    surfaceY - definition.depthOffset,
    ellipse.centerZ,
  )
  mesh.renderingGroupId = WATER_RENDERING_GROUP
  mesh.isPickable = true
  mesh.material = waterMaterial(scene, `mat_${name}`, definition, preview)
  mesh.receiveShadows = true
  return mesh
}
