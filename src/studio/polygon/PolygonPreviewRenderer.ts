import {
  Color3,
  Mesh,
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

export class PolygonPreviewRenderer {
  private root: TransformNode | null = null
  private pointMesh: Mesh | null = null
  private edgeMesh: Mesh | null = null
  private fillMesh: Mesh | null = null
  private pointMaterial: StandardMaterial | null = null
  private edgeMaterial: StandardMaterial | null = null
  private fillMaterial: StandardMaterial | null = null
  private lastValid = true

  attach(scene: Scene, parent: TransformNode): void {
    this.root = new TransformNode('polygon_preview_root', scene)
    this.root.parent = parent
    this.pointMesh = new Mesh('polygon_preview_point', scene)
    this.edgeMesh = new Mesh('polygon_preview_edge', scene)
    this.fillMesh = new Mesh('polygon_preview_fill', scene)
    this.pointMesh.parent = this.root
    this.edgeMesh.parent = this.root
    this.fillMesh.parent = this.root
    this.pointMesh.isPickable = false
    this.edgeMesh.isPickable = false
    this.fillMesh.isPickable = false
    this.pointMesh.renderingGroupId = 2
    this.edgeMesh.renderingGroupId = 2
    this.fillMesh.renderingGroupId = 2

    this.pointMaterial = this.createMaterial(scene, 'polygon_preview_point_mat')
    this.edgeMaterial = this.createMaterial(scene, 'polygon_preview_edge_mat')
    this.fillMaterial = this.createMaterial(scene, 'polygon_preview_fill_mat', 0.45)
    this.pointMesh.material = this.pointMaterial
    this.edgeMesh.material = this.edgeMaterial
    this.fillMesh.material = this.fillMaterial
    this.clear()
  }

  dispose(): void {
    this.pointMesh?.dispose(false, true)
    this.edgeMesh?.dispose(false, true)
    this.fillMesh?.dispose(false, true)
    this.pointMaterial?.dispose()
    this.edgeMaterial?.dispose()
    this.fillMaterial?.dispose()
    this.root?.dispose()
    this.pointMesh = null
    this.edgeMesh = null
    this.fillMesh = null
    this.pointMaterial = null
    this.edgeMaterial = null
    this.fillMaterial = null
    this.root = null
  }

  clear(): void {
    this.updateMesh(this.pointMesh, [], [])
    this.updateMesh(this.edgeMesh, [], [])
    this.updateMesh(this.fillMesh, [], [])
    this.pointMesh?.setEnabled(false)
    this.edgeMesh?.setEnabled(false)
    this.fillMesh?.setEnabled(false)
  }

  update(
    points: readonly MapPolygonPoint[],
    cursor: MapPolygonPoint | null,
    isValid: boolean,
    style: Partial<PolygonPreviewStyle> = {},
  ): void {
    const merged = { ...DEFAULT_STYLE, ...style }
    if (isValid !== this.lastValid) {
      this.applyColors(isValid ? merged.validColor : merged.invalidColor)
      this.lastValid = isValid
    }

    const y = merged.surfaceY

    if (points.length === 0) {
      this.clear()
      return
    }

    if (points.length === 1) {
      this.renderPoint(points[0], y, cursor)
      this.edgeMesh?.setEnabled(false)
      this.fillMesh?.setEnabled(false)
      return
    }

    const edgeOutline = cursor ? [...points, cursor] : [...points]
    this.renderEdge(edgeOutline, y, false)
    this.renderPoints(points, y)
    this.fillMesh?.setEnabled(false)

    if (points.length >= 3 && cursor) {
      this.renderFill([...points, cursor], y)
    } else if (points.length >= 3 && !cursor) {
      this.renderFill(points, y)
    }
  }

  private renderPoint(point: MapPolygonPoint, y: number, cursor: MapPolygonPoint | null): void {
    const positions = [point.x, y + 0.08, point.z]
    if (cursor) {
      positions.push(cursor.x, y + 0.08, cursor.z)
    }
    this.updateMesh(this.pointMesh, positions, cursor ? [0, 1] : [])
    this.pointMesh?.setEnabled(true)
  }

  private renderPoints(points: readonly MapPolygonPoint[], y: number): void {
    const positions: number[] = []
    const indices: number[] = []
    for (const point of points) {
      positions.push(point.x, y + 0.08, point.z)
    }
    for (let index = 0; index < points.length; index += 1) {
      indices.push(index, index)
    }
    this.updateMesh(this.pointMesh, positions, indices)
    this.pointMesh?.setEnabled(points.length > 0)
  }

  private renderEdge(outline: readonly MapPolygonPoint[], y: number, closed: boolean): void {
    if (outline.length < 2) {
      this.edgeMesh?.setEnabled(false)
      return
    }
    const positions: number[] = []
    const indices: number[] = []
    for (const point of outline) {
      positions.push(point.x, y + 0.05, point.z)
    }
    for (let index = 0; index < outline.length - 1; index += 1) {
      indices.push(index, index + 1)
    }
    if (closed && outline.length >= 3) {
      indices.push(outline.length - 1, 0)
    }
    this.updateMesh(this.edgeMesh, positions, indices)
    this.edgeMesh?.setEnabled(true)
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

  private createMaterial(
    scene: Scene,
    name: string,
    alpha = 0.9,
  ): StandardMaterial {
    const material = new StandardMaterial(name, scene)
    material.alpha = alpha
    material.disableLighting = true
    return material
  }

  private applyColors(color: Color3): void {
    for (const material of [this.pointMaterial, this.edgeMaterial, this.fillMaterial]) {
      if (!material) {
        continue
      }
      material.diffuseColor = color
      material.emissiveColor = color.scale(0.85)
    }
  }
}
