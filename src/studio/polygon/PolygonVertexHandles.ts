import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  type Scene,
} from '@babylonjs/core'
import type { AbstractMesh } from '@babylonjs/core'
import type { MapPolygonPoint } from '@/types/world-map.ts'

export const POLYGON_VERTEX_HANDLE_KEY = 'farmosPolygonVertex'

export interface PolygonVertexHandleMetadata {
  objectId: string
  vertexIndex: number
}

export class PolygonVertexHandles {
  private root: TransformNode | null = null
  private readonly handles: Mesh[] = []
  private attached = false

  attach(scene: Scene, parent: TransformNode): void {
    if (this.attached) {
      return
    }
    this.root = new TransformNode('polygon_vertex_root', scene)
    this.root.parent = parent
    this.attached = true
  }

  dispose(): void {
    for (const handle of this.handles) {
      handle.dispose(false, true)
    }
    this.handles.length = 0
    this.root?.dispose()
    this.root = null
    this.attached = false
  }

  clear(): void {
    for (const handle of this.handles) {
      handle.setEnabled(false)
    }
  }

  update(
    scene: Scene,
    objectId: string,
    points: readonly MapPolygonPoint[],
    surfaceY: number,
    visible: boolean,
  ): void {
    if (!this.root || !visible || points.length < 3) {
      this.clear()
      return
    }

    while (this.handles.length < points.length) {
      const index = this.handles.length
      const handle = MeshBuilder.CreateSphere(
        `polygon_vertex_${index}`,
        { diameter: 1.3, segments: 10 },
        scene,
      )
      handle.parent = this.root
      handle.isPickable = true
      handle.renderingGroupId = 3
      const material = new StandardMaterial(`polygon_vertex_mat_${index}`, scene)
      material.diffuseColor = new Color3(0.95, 0.85, 0.35)
      material.emissiveColor = new Color3(0.45, 0.38, 0.1)
      material.disableLighting = true
      handle.material = material
      this.handles.push(handle)
    }

    while (this.handles.length > points.length) {
      const excess = this.handles.pop()
      excess?.dispose(false, true)
    }

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index]
      const handle = this.handles[index]
      handle.position.set(point.x, surfaceY + 0.12, point.z)
      handle.setEnabled(true)
      handle.metadata = {
        [POLYGON_VERTEX_HANDLE_KEY]: {
          objectId,
          vertexIndex: index,
        } satisfies PolygonVertexHandleMetadata,
      }
    }
  }
}

export function pickPolygonVertexHandle(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): PolygonVertexHandleMetadata | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) => {
    const metadata = (mesh as AbstractMesh).metadata?.[POLYGON_VERTEX_HANDLE_KEY]
    return (
      metadata &&
      typeof metadata === 'object' &&
      typeof (metadata as PolygonVertexHandleMetadata).vertexIndex === 'number'
    )
  })
  const metadata = pick?.pickedMesh?.metadata?.[POLYGON_VERTEX_HANDLE_KEY] as
    | PolygonVertexHandleMetadata
    | undefined
  return metadata ?? null
}

export function isPolygonVertexHandleMesh(mesh: AbstractMesh): boolean {
  return mesh.metadata?.[POLYGON_VERTEX_HANDLE_KEY] !== undefined
}
