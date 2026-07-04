import type { AbstractMesh, Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import type { MapObject } from '@/types/world-map.ts'
import {
  type BoxCorner,
  canResizeObject,
  getBoxCornerWorld,
} from '@/studio/core/StudioBoxMath.ts'

export const STUDIO_HANDLE_KEY = 'farmosStudioHandle'

export interface StudioHandleMetadata {
  type: 'resize_handle'
  corner: BoxCorner
  objectId: string
}

const HANDLE_SIZE = 0.45
const HANDLE_Y_OFFSET = 0.12
const CORNERS: readonly BoxCorner[] = ['nw', 'ne', 'sw', 'se']

export class StudioTransformHandles {
  private root: TransformNode | null = null
  private readonly handleMeshes = new Map<BoxCorner, AbstractMesh>()

  sync(scene: Scene, object: MapObject | null): void {
    if (!object || !canResizeObject(object)) {
      this.clear()
      return
    }

    this.ensureRoot(scene)

    for (const corner of CORNERS) {
      const mesh = this.ensureHandle(scene, corner, object.id)
      const world = getBoxCornerWorld(object, corner)
      if (!world) {
        continue
      }
      mesh.position = new Vector3(world.x, world.y + HANDLE_Y_OFFSET, world.z)
      mesh.setEnabled(true)
    }
  }

  clear(): void {
    for (const mesh of this.handleMeshes.values()) {
      mesh.setEnabled(false)
    }
  }

  dispose(): void {
    for (const mesh of this.handleMeshes.values()) {
      mesh.dispose(false, true)
    }
    this.handleMeshes.clear()
    this.root?.dispose(false, true)
    this.root = null
  }

  pickHandle(scene: Scene, x: number, y: number): StudioHandleMetadata | null {
    const pick = scene.pick(x, y, (mesh) => {
      return isStudioHandle(mesh as AbstractMesh)
    })

    if (!pick?.hit || !pick.pickedMesh) {
      return null
    }

    return getStudioHandleMetadata(pick.pickedMesh as AbstractMesh)
  }

  private ensureRoot(scene: Scene): void {
    if (this.root && !this.root.isDisposed()) {
      return
    }
    this.root = new TransformNode('studio_handles_root', scene)
  }

  private ensureHandle(
    scene: Scene,
    corner: BoxCorner,
    objectId: string,
  ): AbstractMesh {
    const existing = this.handleMeshes.get(corner)
    if (existing && !existing.isDisposed()) {
      const metadata = getStudioHandleMetadata(existing)
      if (metadata?.objectId === objectId) {
        return existing
      }
      existing.dispose(false, true)
    }

    const mesh = MeshBuilder.CreateBox(
      `studio_handle_${corner}`,
      {
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        depth: HANDLE_SIZE,
      },
      scene,
    )
    mesh.parent = this.root
    mesh.isPickable = true
    mesh.renderingGroupId = 2

    const material = new StandardMaterial(`studio_handle_mat_${corner}`, scene)
    material.diffuseColor = new Color3(0.95, 0.85, 0.35)
    material.emissiveColor = new Color3(0.45, 0.38, 0.1)
    material.specularColor = new Color3(0.1, 0.1, 0.08)
    mesh.material = material

    const metadata: StudioHandleMetadata = {
      type: 'resize_handle',
      corner,
      objectId,
    }
    mesh.metadata = { [STUDIO_HANDLE_KEY]: metadata }
    this.handleMeshes.set(corner, mesh)
    return mesh
  }
}

export function isStudioHandle(mesh: AbstractMesh): boolean {
  return mesh.metadata?.[STUDIO_HANDLE_KEY] !== undefined
}

export function getStudioHandleMetadata(
  mesh: AbstractMesh,
): StudioHandleMetadata | null {
  const raw = mesh.metadata?.[STUDIO_HANDLE_KEY] as
    | StudioHandleMetadata
    | undefined
  return raw ?? null
}
