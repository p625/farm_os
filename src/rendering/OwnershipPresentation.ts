import { Color3, StandardMaterial, type Scene } from '@babylonjs/core'
import { FIELD_IDS } from '@/config/field-catalog.ts'
import type { FieldSystem } from '@systems/FieldSystem.ts'
import type { OwnershipSystem } from '@systems/OwnershipSystem.ts'
import { FieldOwnership } from '@/types/ownership.ts'

const AVAILABLE_TINT = new Color3(0.45, 0.55, 0.75)
const LEASED_TINT = new Color3(0.72, 0.52, 0.32)
const AVAILABLE_BLEND = 0.25
const LEASED_BLEND = 0.22

export class OwnershipPresentation {
  private scene: Scene | null = null
  private fieldSystem: FieldSystem | null = null
  private ownershipSystem: OwnershipSystem | null = null

  attach(
    scene: Scene,
    fieldSystem: FieldSystem,
    ownershipSystem: OwnershipSystem,
  ): void {
    this.scene = scene
    this.fieldSystem = fieldSystem
    this.ownershipSystem = ownershipSystem
    this.syncVisuals()
  }

  syncVisuals(): void {
    if (!this.scene || !this.fieldSystem || !this.ownershipSystem) {
      return
    }

    for (const fieldId of FIELD_IDS) {
      const mesh = this.scene.getMeshByName(fieldId)
      const field = this.fieldSystem.getField(fieldId)
      if (!mesh?.material || !field) {
        continue
      }

      const material = mesh.material as StandardMaterial
      const ownership = this.ownershipSystem.getOwnership(fieldId)

      let diffuse = material.diffuseColor.clone()
      if (ownership === FieldOwnership.Available) {
        diffuse = Color3.Lerp(diffuse, AVAILABLE_TINT, AVAILABLE_BLEND)
      } else if (ownership === FieldOwnership.Leased) {
        diffuse = Color3.Lerp(diffuse, LEASED_TINT, LEASED_BLEND)
      }

      material.diffuseColor = diffuse
    }
  }

  detach(): void {
    this.scene = null
    this.fieldSystem = null
    this.ownershipSystem = null
  }
}
