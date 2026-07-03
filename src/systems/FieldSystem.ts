import { WHEAT_CROP } from '@/config/wheat.ts'
import { FIELD_DEFINITIONS } from '@/config/farm-layout.ts'
import { Field } from '@entities/Field.ts'
import type { GameEventLog } from '@game/GameEventLog.ts'
import type { World } from '@game/World.ts'
import type { FieldLifecycleState } from '@/types/field.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import { GameSystem } from './GameSystem.ts'

const SECONDS_PER_DAY = 1

export class FieldSystem extends GameSystem {
  readonly name = 'FieldSystem'
  private readonly world: World
  private readonly fields = new Map<string, Field>()
  private selectedFieldId: string | null = null
  private dayTimer = 0
  private onChange: (() => void) | null = null
  private eventLog: GameEventLog | null = null

  constructor(world: World) {
    super()
    this.world = world
  }

  setEventLog(eventLog: GameEventLog): void {
    this.eventLog = eventLog
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  initialize(): void {
    this.fields.clear()
    for (const definition of FIELD_DEFINITIONS) {
      this.fields.set(definition.id, new Field(definition.id, definition.name))
    }
    this.selectedFieldId = 'field_1'
    this.dayTimer = 0
    this.notifyChange()
  }

  applySave(
    fields: readonly {
      id: string
      state: Field['state']
      growthPercent: number
      cropId: string | null
    }[],
    selectedFieldId: string | null,
  ): void {
    for (const savedField of fields) {
      const field = this.fields.get(savedField.id)
      if (!field) {
        continue
      }
      field.state = savedField.state
      field.growthPercent = savedField.growthPercent
      field.cropId = savedField.cropId
    }

    if (selectedFieldId && this.fields.has(selectedFieldId)) {
      this.selectedFieldId = selectedFieldId
    }

    this.dayTimer = 0
    this.notifyChange()
  }

  toSaveFields(): ReturnType<Field['toSnapshot']>[] {
    return this.getFields().map((field) => field.toSnapshot())
  }

  update(deltaTime: number): void {
    if (this.world.gameSpeed <= 0) {
      return
    }

    this.dayTimer += deltaTime * this.world.gameSpeed

    while (this.dayTimer >= SECONDS_PER_DAY) {
      this.dayTimer -= SECONDS_PER_DAY
      this.advanceDay()
    }
  }

  getFields(): readonly Field[] {
    return [...this.fields.values()]
  }

  getField(id: string): Field | undefined {
    return this.fields.get(id)
  }

  getSelectedFieldId(): string | null {
    return this.selectedFieldId
  }

  getSelectedField(): Field | undefined {
    if (!this.selectedFieldId) {
      return undefined
    }
    return this.fields.get(this.selectedFieldId)
  }

  selectField(id: string): boolean {
    if (!this.fields.has(id)) {
      return false
    }
    this.selectedFieldId = id
    this.notifyChange()
    return true
  }

  plowSelected(): boolean {
    const field = this.getSelectedField()
    if (!field) {
      return false
    }
    return this.plowField(field.id)
  }

  seedSelected(): boolean {
    const field = this.getSelectedField()
    if (!field) {
      return false
    }
    return this.seedField(field.id)
  }

  harvestSelected(): boolean {
    const field = this.getSelectedField()
    if (!field) {
      return false
    }
    return this.harvestField(field.id)
  }

  canPlow(fieldId: string): boolean {
    const field = this.fields.get(fieldId)
    return field?.state === States.Grass
  }

  canSeed(fieldId: string): boolean {
    const field = this.fields.get(fieldId)
    return field?.state === States.Plowed
  }

  canHarvest(fieldId: string): boolean {
    const field = this.fields.get(fieldId)
    return field?.state === States.Harvestable
  }

  plowField(fieldId: string): boolean {
    const field = this.fields.get(fieldId)
    if (!field || field.state !== States.Grass) {
      return false
    }
    field.state = States.Plowed
    field.growthPercent = 0
    field.cropId = null
    this.eventLog?.recordFieldPlowed(this.world.currentDay)
    this.notifyChange()
    return true
  }

  seedField(fieldId: string): boolean {
    const field = this.fields.get(fieldId)
    if (!field || field.state !== States.Plowed) {
      return false
    }
    field.state = States.Seeded
    field.growthPercent = 0
    field.cropId = WHEAT_CROP.id
    this.eventLog?.recordWheatSeeded(this.world.currentDay)
    this.notifyChange()
    return true
  }

  harvestField(fieldId: string): boolean {
    const field = this.fields.get(fieldId)
    if (!field || field.state !== States.Harvestable) {
      return false
    }

    this.world.addMoney(WHEAT_CROP.harvestReward)
    field.state = States.Grass
    field.growthPercent = 0
    field.cropId = null
    this.eventLog?.recordHarvestSold(this.world.currentDay)
    this.notifyChange()
    return true
  }

  dispose(): void {
    this.fields.clear()
    this.onChange = null
    this.eventLog = null
  }

  private advanceDay(): void {
    this.world.advanceDay()

    for (const field of this.fields.values()) {
      this.tickField(field)
    }

    this.notifyChange()
  }

  private tickField(field: Field): void {
    if (field.state === States.Seeded) {
      field.state = States.Growing
      return
    }

    if (field.state !== States.Growing) {
      return
    }

    field.growthPercent = Math.min(
      100,
      field.growthPercent + WHEAT_CROP.growthPerDay,
    )

    if (field.growthPercent >= 100 && field.state === States.Growing) {
      field.state = States.Harvestable
      field.growthPercent = 100
      this.eventLog?.recordWheatReady(this.world.currentDay)
    }
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}

export function formatFieldState(state: FieldLifecycleState): string {
  return state.charAt(0).toUpperCase() + state.slice(1)
}
