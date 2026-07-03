import { FieldLifecycleState as States } from '@/types/field.ts'
import type { FieldData, FieldLifecycleState } from '@/types/field.ts'

export class Field implements FieldData {
  readonly id: string
  readonly name: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.state = States.Grass
    this.growthPercent = 0
    this.cropId = null
  }

  toSnapshot(): FieldData {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      growthPercent: this.growthPercent,
      cropId: this.cropId,
    }
  }
}
