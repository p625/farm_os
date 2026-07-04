import { FieldLifecycleState as States } from '@/types/field.ts'
import type { FieldData, FieldLifecycleState } from '@/types/field.ts'
import {
  emptyFieldCropCare,
  normalizeFieldCropCare,
  type FieldCropCare,
} from '@/types/crop-care.ts'

export class Field implements FieldData {
  readonly id: string
  readonly name: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null
  daysGrown: number
  cropCare: FieldCropCare

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.state = States.Grass
    this.growthPercent = 0
    this.cropId = null
    this.daysGrown = 0
    this.cropCare = emptyFieldCropCare()
  }

  toSnapshot(): FieldData {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      growthPercent: this.growthPercent,
      cropId: this.cropId,
      daysGrown: this.daysGrown,
      cropCare: { applied: [...this.cropCare.applied] },
    }
  }

  setCropCare(care: unknown): void {
    this.cropCare = normalizeFieldCropCare(care)
  }

  resetCropCare(): void {
    this.cropCare = emptyFieldCropCare()
  }
}
