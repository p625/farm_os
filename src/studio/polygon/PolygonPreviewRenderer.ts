import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  VertexBuffer,
  VertexData,
  type Scene,
} from '@babylonjs/core'
import type { MapPolygonPoint } from '@/types/world-map.ts'
import { buildFieldPolygonVertexData } from '@/studio/parcel/fieldPolygonMesh.ts'

export interface PolygonPreviewStyle {
  validColor: Color3
  invalidColor: Color3
  surfaceY: number
}

const DEFAULT_STYLE: PolygonPreviewStyle = {
  validColor: new Color3(0.35, 0.82, 0.35),
  invalidColor: new Color3(0.9, 0.3, 0.25),
  surfaceY: 0.05,
}

const CLOSE_VERTEX_COLOR = new Color3(0.98, 0.92, 0.2)
const VERTEX_COLOR = new Color3(0.98, 0.98, 1)
const VERTEX_DIAMETER = 1.1

export class PolygonPreviewRenderer {
  private scene: Scene | null = null
  private root: TransformNode | null = null
  private edgeMesh: Mesh | null = null
  private fillMesh: Mesh | null = null
  private readonly vertexMeshes: Mesh[] = []
  private edgeMaterial: StandardMaterial | null = null
  private fillMaterial: StandardMaterial | null = null
  private lastValid = true

  attach(scene: Scene, parent: TransformNode): void {
    this.scene = scene
    this.root = new TransformNode('polygon_preview_root', scene)
    this.root.parent = parent
    this.edgeMesh = new Mesh('polygon_preview_edge', scene)
    this.fillMesh = new Mesh('polygon_preview_fill', scene)
    this.edgeMesh.parent = this.root
    this.fillMesh.parent = this.root
    this.edgeMesh.isPickable = false
    this.fillMesh.isPickable = false
    this.edgeMesh.renderingGroupId = 2
    this.fillMesh.renderingGroupId = 1

    this.edgeMaterial = this.createMaterial(scene, 'polygon_preview_edge_mat', 1)
    this.fillMaterial = this.createMaterial(scene, 'polygon_preview_fill_mat', 0.42)
    this.edgeMesh.material = this.edgeMaterial
    this.fillMesh.material = this.fillMaterial
    this.clear()
  }

  dispose(): void {
    for (const mesh of this.vertexMeshes) {
      mesh.dispose(false, true)
    }
    this.vertexMeshes.length = 0
    this.edgeMesh?.dispose(false, true)
    this.fillMesh?.dispose(false, true)
    this.edgeMaterial?.dispose()
    this.fillMaterial?.dispose()
    this.root?.dispose()
    this.edgeMesh = null
    this.fillMesh = null
    this.edgeMaterial = null
    this.fillMaterial = null
    this.root = null
    this.scene = null
  }

  clear(): void {
    this.updateMesh(this.edgeMesh, [], [])
    this.updateMesh(this.fillMesh, [], [])
    this.edgeMesh?.setEnabled(false)
    this.fillMesh?.setEnabled(false)
    for (const mesh of this.vertexMeshes) {
      mesh.setEnabled(false)
    }
  }

  update(
    points: readonly MapPolygonPoint[],
    cursor: MapPolygonPoint | null,
    isValid: boolean,
    style: Partial<PolygonPreviewStyle> = {},
  ): void {
    const merged = { ...DEFAULT_STYLE, ...style }
    if (isValid !== this.lastValid) {
      this.applyLineColors(isValid ? merged.validColor : merged.invalidColor)
      this.lastValid = isValid
    }

    const y = merged.surfaceY
    const scene = this.scene

    if (points.length === 0 || !scene) {
      this.clear()
      return
    }

    const canClose = points.length >= 3
    this.renderVertexHandles(scene, points, y, canClose)

    if (points.length === 1) {
      this.renderEdge(cursor ? [points[0], cursor] : [points[0]], y, false)
      this.fillMesh?.setEnabled(false)
      return
    }

    const edgeOutline = cursor ? [...points, cursor] : [...points]
    this.renderEdge(edgeOutline, y, false)
    this.fillMesh?.setEnabled(false)

    if (points.length >= 3 && cursor) {
      this.renderFill([...points, cursor], y)
    } else if (points.length >= 3 && !cursor) {
      this.renderFill(points, y)
    }
  }

  private renderVertexHandles(
    scene: Scene,
    points: readonly MapPolygonPoint[],
    y: number,
    canClose: boolean,
  ): void {
    while (this.vertexMeshes.length < points.length) {
      const index = this.vertexMeshes.length
      const mesh = MeshBuilder.CreateSphere(
        `polygon_preview_vertex_${index}`,
        { diameter: VERTEX_DIAMETER, segments: 12 },
        scene,
      )
      mesh.parent = this.root
      mesh.isPickable = false
      mesh.renderingGroupId = 3
      const material = new StandardMaterial(`polygon_preview_vertex_mat_${index}`, scene)
      material.disableLighting = true
      mesh.material = material
      this.vertexMeshes.push(mesh)
    }

    while (this.vertexMeshes.length > points.length) {
      const excess = this.vertexMeshes.pop()
      excess?.dispose(false, true)
    }

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index]
      const mesh = this.vertexMeshes[index]
      const material = mesh.material as StandardMaterial
      const color = canClose && index === 0 ? CLOSE_VERTEX_COLOR : VERTEX_COLOR
      material.diffuseColor = color
      material.emissiveColor = color.scale(0.9)
      mesh.position.set(point.x, y + 0.14, point.z)
      mesh.setEnabled(true)
    }
  }

  private renderEdge(outline: readonly MapPolygonPoint[], y: number, closed: boolean): void {
    if (!this.edgeMesh || outline.length < 2) {
      this.edgeMesh?.setEnabled(false)
      return
    }
    const positions: number[] = []
    const indices: number[] = []
    for (const point of outline) {
      positions.push(point.x, y + 0.06, point.z)
    }
    for (let index = 0; index < outline.length - 1; index += 1) {
      indices.push(index, index + 1)
    }
    if (closed && outline.length >= 3) {
      indices.push(outline.length - 1, 0)
    }
    this.updateMesh(this.edgeMesh, positions, indices)
    this.edgeMesh.setEnabled(true)
  }

  private renderFill(points: readonly MapPolygonPoint[], y: number): void {
    if (!this.fillMesh || points.length < 3) {
      this.fillMesh?.setEnabled(false)
      return
    }
    const vertexData = buildFieldPolygonVertexData(points, 0.02)
    vertexData.applyToMesh(this.fillMesh, true)
    this.fillMesh.position.y = y
    this.fillMesh.setEnabled(true)
  }

  private updateMesh(mesh: Mesh | null, positions: number[], indices: number[]): void {
    if (!mesh) {
      return
    }
    if (positions.length === 0) {
      mesh.setVerticesData(VertexBuffer.PositionKind, [], true)
      mesh.setIndices([])
      return
    }
    const vertexData = new VertexData()
    vertexData.positions = positions
    if (indices.length > 0) {
      vertexData.indices = indices
    }
    vertexData.applyToMesh(mesh, true)
  }

  private createMaterial(scene: Scene, name: string, alpha = 0.9): StandardMaterial {
    const material = new StandardMaterial(name, scene)
    material.alpha = alpha
    material.disableLighting = true
    return material
  }

  private applyLineColors(color: Color3): void {
    for (const material of [this.edgeMaterial, this.fillMaterial]) {
      if (!material) {
        continue
      }
      material.diffuseColor = color
      material.emissiveColor = color.scale(0.85)
    }
  }
}
