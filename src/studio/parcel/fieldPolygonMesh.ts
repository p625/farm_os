import {
  Color3,
  Mesh,
  StandardMaterial,
  VertexData,
  type Scene,
} from '@babylonjs/core'
import type { MapPolygonPoint } from '@/types/world-map.ts'
import { FIELD_SURFACE_THICKNESS } from '@/studio/parcel/parcelObject.ts'

export function buildFieldPolygonVertexData(
  points: readonly MapPolygonPoint[],
  thickness: number,
): VertexData {
  const vertexData = new VertexData()
  if (points.length < 3) {
    return vertexData
  }

  const topPositions: number[] = []
  const bottomPositions: number[] = []
  const indices: number[] = []

  for (const point of points) {
    topPositions.push(point.x, thickness, point.z)
    bottomPositions.push(point.x, 0, point.z)
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    indices.push(0, index, index + 1)
  }

  const sideOffset = points.length
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length
    const topA = index
    const topB = next
    const bottomA = sideOffset + index
    const bottomB = sideOffset + next
    indices.push(topA, bottomB, topB)
    indices.push(topA, bottomA, bottomB)
  }

  const positions = [...topPositions, ...bottomPositions]
  vertexData.positions = positions
  vertexData.indices = indices
  vertexData.normals = []
  VertexData.ComputeNormals(positions, indices, vertexData.normals)
  return vertexData
}

export function createFieldPolygonMesh(
  scene: Scene,
  name: string,
  points: readonly MapPolygonPoint[],
  surfaceY: number,
  thickness = FIELD_SURFACE_THICKNESS,
): Mesh {
  const mesh = new Mesh(name, scene)
  const vertexData = buildFieldPolygonVertexData(points, thickness)
  vertexData.applyToMesh(mesh)
  mesh.position.y = surfaceY
  mesh.receiveShadows = true
  return mesh
}

export function createParcelDraftLineMesh(
  scene: Scene,
  name: string,
  points: readonly MapPolygonPoint[],
  cursor: MapPolygonPoint | null,
  surfaceY: number,
  isValid: boolean,
): Mesh {
  const outline = cursor ? [...points, cursor] : [...points]
  const mesh = new Mesh(name, scene)
  if (outline.length < 2) {
    return mesh
  }

  const positions: number[] = []
  const indices: number[] = []
  for (const point of outline) {
    positions.push(point.x, surfaceY + 0.05, point.z)
  }
  for (let index = 0; index < outline.length - 1; index += 1) {
    indices.push(index, index + 1)
  }
  if (points.length >= 3 && !cursor) {
    indices.push(outline.length - 1, 0)
  }

  const vertexData = new VertexData()
  vertexData.positions = positions
  vertexData.indices = indices
  vertexData.applyToMesh(mesh)

  const material = new StandardMaterial(`${name}_mat`, scene)
  const color = isValid
    ? new Color3(0.35, 0.82, 0.35)
    : new Color3(0.9, 0.3, 0.25)
  material.emissiveColor = color
  material.diffuseColor = color
  material.alpha = 0.85
  material.disableLighting = true
  mesh.material = material
  mesh.renderingGroupId = 2
  return mesh
}
