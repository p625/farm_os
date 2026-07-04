import type { AbstractMesh, Scene } from '@babylonjs/core'
import { Color3, StandardMaterial } from '@babylonjs/core'
import type { MapObject } from '@/types/world-map.ts'
import {
  getStudioMetadata,
  type StudioMeshMetadata,
} from '@/studio/io/MapSceneBuilder.ts'

const HIGHLIGHT_EMISSIVE = new Color3(0.35, 0.55, 0.25)
export class StudioSelection {
  private selectedMesh: AbstractMesh | null = null
  private previousEmissive: Color3 | null = null

  pick(scene: Scene, x: number, y: number): MapObject | null {
    const pick = scene.pick(x, y, (mesh) => {
      return getStudioMetadata(mesh as AbstractMesh) !== null
    })

    if (!pick?.hit || !pick.pickedMesh) {
      this.clearHighlight()
      return null
    }

    const metadata = getStudioMetadata(pick.pickedMesh as AbstractMesh)
    if (!metadata) {
      this.clearHighlight()
      return null
    }

    this.applyHighlight(pick.pickedMesh as AbstractMesh)
    return metadata.mapObject
  }

  clear(): MapObject | null {
    this.clearHighlight()
    return null
  }

  private applyHighlight(mesh: AbstractMesh): void {
    if (this.selectedMesh === mesh) {
      return
    }
    this.clearHighlight()
    this.selectedMesh = mesh
    const material = mesh.material
    if (material instanceof StandardMaterial) {
      this.previousEmissive = material.emissiveColor.clone()
      material.emissiveColor = HIGHLIGHT_EMISSIVE
    }
  }

  private clearHighlight(): void {
    if (!this.selectedMesh) {
      return
    }
    const material = this.selectedMesh.material
    if (
      material instanceof StandardMaterial &&
      this.previousEmissive
    ) {
      material.emissiveColor = this.previousEmissive
    }
    this.selectedMesh = null
    this.previousEmissive = null
  }

  dispose(): void {
    this.clearHighlight()
  }
}

export type { StudioMeshMetadata }
