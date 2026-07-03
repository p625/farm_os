import { FIELD_CATALOG } from '@/config/field-catalog.ts'
import { Field } from '@entities/Field.ts'
import type { GameEventLog } from '@game/GameEventLog.ts'
import type { World } from '@game/World.ts'
import type { CropSystem } from './CropSystem.ts'
import type { InventorySystem } from './InventorySystem.ts'
import type { MarketSystem } from './MarketSystem.ts'
import type { OwnershipSystem } from './OwnershipSystem.ts'
import type { FieldLifecycleState } from '@/types/field.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import { GameSystem } from './GameSystem.ts'

const SECONDS_PER_DAY = 1

export class FieldSystem extends GameSystem {
  readonly name = 'FieldSystem'
  private readonly world: World
  private readonly fields = new Map<string, Field>()
  private ownershipSystem: OwnershipSystem | null = null
  private cropSystem: CropSystem | null = null
  private inventorySystem: InventorySystem | null = null
  private marketSystem: MarketSystem | null = null
  private selectedFieldId: string | null = null
  private dayTimer = 0
  private onChange: (() => void) | null = null
  private eventLog: GameEventLog | null = null

  constructor(world: World) {
    super()
    this.world = world
  }

  setOwnershipSystem(ownershipSystem: OwnershipSystem): void {
    this.ownershipSystem = ownershipSystem
  }

  setCropSystem(cropSystem: CropSystem): void {
    this.cropSystem = cropSystem
  }

  setInventorySystem(inventorySystem: InventorySystem): void {
    this.inventorySystem = inventorySystem
  }

  setMarketSystem(marketSystem: MarketSystem): void {
    this.marketSystem = marketSystem
  }

  setEventLog(eventLog: GameEventLog): void {
    this.eventLog = eventLog
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  initialize(): void {
    this.fields.clear()
    for (const definition of FIELD_CATALOG) {
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
      daysGrown?: number
    }[],
    selectedFieldId: string | null,
  ): void {
    for (const savedField of fields) {
      const field = this.fields.get(savedField.id)
      if (!field) {
        continue
      }

      const cropId = this.cropSystem?.normalizePlantedCropId(
        savedField.cropId,
        savedField.state,
      ) ?? savedField.cropId

      field.state = savedField.state
      field.cropId = cropId
      field.growthPercent = savedField.growthPercent

      if (typeof savedField.daysGrown === 'number') {
        field.daysGrown = savedField.daysGrown
      } else if (cropId && this.cropSystem) {
        field.daysGrown = this.cropSystem.estimateDaysGrown(
          cropId,
          savedField.growthPercent,
        )
      } else {
        field.daysGrown = 0
      }
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

  clearSelection(): void {
    this.selectedFieldId = null
    this.notifyChange()
  }

  isFieldUsable(fieldId: string): boolean {
    return this.ownershipSystem?.canUseField(fieldId) ?? false
  }

  selectField(id: string): boolean {
    if (!this.fields.has(id)) {
      return false
    }
    this.selectedFieldId = id
    this.notifyChange()
    return true
  }

  canPlow(fieldId: string): boolean {
    if (!this.isFieldUsable(fieldId)) {
      return false
    }
    const field = this.fields.get(fieldId)
    return field?.state === States.Grass
  }

  canSeed(fieldId: string, cropId: string): boolean {
    if (!this.isFieldUsable(fieldId) || !this.cropSystem) {
      return false
    }
    const field = this.fields.get(fieldId)
    if (!field) {
      return false
    }
    return this.cropSystem.canPlant(cropId, field.state, this.world.money)
  }

  canHarvest(fieldId: string): boolean {
    if (!this.isFieldUsable(fieldId)) {
      return false
    }
    const field = this.fields.get(fieldId)
    return field?.state === States.Harvestable
  }

  plowField(fieldId: string): boolean {
    if (!this.isFieldUsable(fieldId)) {
      return false
    }
    const field = this.fields.get(fieldId)
    if (!field || field.state !== States.Grass) {
      return false
    }
    field.state = States.Plowed
    field.growthPercent = 0
    field.cropId = null
    field.daysGrown = 0
    this.eventLog?.recordFieldPlowed(this.world.currentDay)
    this.notifyChange()
    return true
  }

  seedField(fieldId: string, cropId: string): boolean {
    if (!this.isFieldUsable(fieldId) || !this.cropSystem) {
      return false
    }
    const field = this.fields.get(fieldId)
    if (!field || !this.cropSystem.canPlant(cropId, field.state, this.world.money)) {
      return false
    }

    const crop = this.cropSystem.getCrop(cropId)
    if (!crop) {
      return false
    }

    if (!this.world.spendMoney(crop.seedCost)) {
      return false
    }

    field.state = States.Seeded
    field.growthPercent = 0
    field.daysGrown = 0
    field.cropId = crop.id
    this.eventLog?.recordCropPlanted(crop.name, this.world.currentDay)
    this.notifyChange()
    return true
  }

  harvestField(fieldId: string): boolean {
    if (!this.isFieldUsable(fieldId) || !this.cropSystem) {
      return false
    }
    const field = this.fields.get(fieldId)
    if (!field || field.state !== States.Harvestable) {
      return false
    }

    const cropId = this.cropSystem.normalizePlantedCropId(
      field.cropId,
      field.state,
    )
    if (!cropId) {
      return false
    }

    const yieldAmount = this.cropSystem.getYield(cropId)

    if (!this.inventorySystem?.addCrop(cropId, yieldAmount, this.world.currentDay)) {
      return false
    }

    field.state = States.Grass
    field.growthPercent = 0
    field.cropId = null
    field.daysGrown = 0
    this.notifyChange()
    return true
  }

  dispose(): void {
    this.fields.clear()
    this.onChange = null
    this.eventLog = null
    this.ownershipSystem = null
    this.cropSystem = null
    this.inventorySystem = null
    this.marketSystem = null
  }

  private advanceDay(): void {
    this.world.advanceDay()
    this.marketSystem?.advanceDay(this.world.currentDay)

    for (const field of this.fields.values()) {
      if (!this.isFieldUsable(field.id)) {
        continue
      }
      this.tickField(field)
    }

    this.notifyChange()
  }

  private tickField(field: Field): void {
    if (!this.cropSystem) {
      return
    }

    if (field.state === States.Seeded) {
      field.state = States.Growing
      field.daysGrown = 1
      field.growthPercent = this.cropSystem.computeGrowthPercent(
        field.cropId ?? this.cropSystem.getDefaultCropId(),
        field.daysGrown,
      )
      return
    }

    if (field.state !== States.Growing) {
      return
    }

    const cropId = this.cropSystem.normalizePlantedCropId(
      field.cropId,
      field.state,
    )
    if (!cropId) {
      return
    }

    field.daysGrown += 1
    field.growthPercent = this.cropSystem.computeGrowthPercent(
      cropId,
      field.daysGrown,
    )

    if (field.growthPercent >= 100) {
      field.state = States.Harvestable
      field.growthPercent = 100
      this.eventLog?.recordCropReady(
        this.cropSystem.getCropName(cropId),
        this.world.currentDay,
      )
    }
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}

export function formatFieldState(state: FieldLifecycleState): string {
  return state.charAt(0).toUpperCase() + state.slice(1)
}
