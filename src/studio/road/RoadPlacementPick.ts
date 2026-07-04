import type { Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  type AbstractMesh,
  type Mesh,
} from '@babylonjs/core'
import type { StudioLayerId } from '@/types/world-map.ts'
import { getStudioMetadata, STUDIO_METADATA_KEY } from '@/studio/io/MapSceneBuilder.ts'

export function isRoadPlacementMesh(mesh: AbstractMesh): boolean {
  const metadata = getStudioMetadata(mesh)
  if (!metadata) {
    return false
  }
  return metadata.objectId === 'terrain_ground' || metadata.layer === 'roads'
}

export function pickRoadPlacementPoint(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): Vector3 | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) =>
    isRoadPlacementMesh(mesh as AbstractMesh),
  )
  return pick?.pickedPoint ?? null
}

export function pickRoadLayerMesh(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): { point: Vector3; layer: StudioLayerId; objectId: string } | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) => {
    const metadata = getStudioMetadata(mesh as AbstractMesh)
    return metadata?.layer === 'roads'
  })
  if (!pick?.pickedPoint) {
    return null
  }
  const metadata = getStudioMetadata(pick.pickedMesh as AbstractMesh)
  if (!metadata) {
    return null
  }
  return {
    point: pick.pickedPoint,
    layer: metadata.layer,
    objectId: metadata.objectId,
  }
}

const PREVIEW_RADIUS = 0.55

export class RoadSnapPreview {
  private mesh: Mesh | null = null
  private join: 'merge' | 'edge' | null = null

  dispose(): void {
    this.mesh?.dispose(false, true)
    this.mesh = null
    this.join = null
  }

  update(
    scene: Scene,
    position: { x: number; y: number; z: number } | null,
    join: 'merge' | 'edge' | null,
  ): void {
    if (!position || !join) {
      this.dispose()
      return
    }

    if (!this.mesh || this.mesh.isDisposed()) {
      this.mesh = MeshBuilder.CreateTorus(
        'road_snap_preview',
        { diameter: PREVIEW_RADIUS * 2, thickness: 0.1, tessellation: 24 },
        scene,
      )
      this.mesh.isPickable = false
      this.mesh.renderingGroupId = 3
    }

    if (this.join !== join && this.mesh.material instanceof StandardMaterial) {
      const material = this.mesh.material
      if (join === 'merge') {
        material.diffuseColor = new Color3(0.95, 0.62, 0.22)
        material.emissiveColor = new Color3(0.45, 0.22, 0.04)
      } else {
        material.diffuseColor = new Color3(0.32, 0.88, 0.52)
        material.emissiveColor = new Color3(0.08, 0.28, 0.12)
      }
      this.join = join
    }

    if (!(this.mesh.material instanceof StandardMaterial)) {
      const material = new StandardMaterial('road_snap_preview_mat', scene)
      material.diffuseColor =
        join === 'merge'
          ? new Color3(0.95, 0.62, 0.22)
          : new Color3(0.32, 0.88, 0.52)
      material.emissiveColor = material.diffuseColor.scale(0.45)
      material.disableLighting = true
      this.mesh.material = material
      this.join = join
    }

    this.mesh.position = new Vector3(position.x, position.y + 0.2, position.z)
    this.mesh.setEnabled(true)
  }

  hide(): void {
    this.mesh?.setEnabled(false)
  }
}

export function createJunctionHandleMesh(
  scene: Scene,
  key: string,
  join: 'merge' | 'edge',
): Mesh {
  const mesh = MeshBuilder.CreateTorus(
    `road_junction_${key}`,
    { diameter: 0.9, thickness: 0.12, tessellation: 20 },
    scene,
  )
  mesh.isPickable = true
  mesh.renderingGroupId = 3
  const material = new StandardMaterial(`road_junction_mat_${key}`, scene)
  if (join === 'merge') {
    material.diffuseColor = new Color3(0.95, 0.62, 0.22)
    material.emissiveColor = new Color3(0.5, 0.28, 0.05)
  } else {
    material.diffuseColor = new Color3(0.32, 0.88, 0.52)
    material.emissiveColor = new Color3(0.1, 0.32, 0.14)
  }
  material.disableLighting = true
  mesh.material = material
  mesh.metadata = { [STUDIO_METADATA_KEY]: { junctionHandle: true } }
  return mesh
}
