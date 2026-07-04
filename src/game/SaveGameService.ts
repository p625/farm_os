import { CROP_CATALOG, DEFAULT_CROP_ID } from '@/config/crop-catalog.ts'
import { FIELD_CATALOG } from '@/config/field-catalog.ts'
import {
  TRACTOR_HOME,
  TRACTOR_HOME_ROTATION_Y,
} from '@/config/farm-layout.ts'
import { MachineId } from '@/types/machine.ts'
import { PROCESSED_CATALOG } from '@/config/production-catalog.ts'
import { SHOP_CATALOG } from '@/config/shop-catalog.ts'
import { SAVE_STORAGE_KEY, SAVE_VERSION } from '@/config/save.ts'
import { FieldOwnership } from '@/types/ownership.ts'
import { ProductionBuildingId, ProductionBuildingState } from '@/types/production.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import { TractorState } from '@/types/tractor.ts'
import type { GameSaveData, MachineSaveData, ProductionSaveData } from '@/types/save.ts'

type LegacySaveData = Omit<GameSaveData, 'machine'> & {
  version?: number
  machine?: MachineSaveData
}

export class SaveGameService {
  save(data: GameSaveData): void {
    const payload: GameSaveData = {
      ...data,
      version: SAVE_VERSION,
    }
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload))
  }

  load(): GameSaveData | null {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as LegacySaveData
      return this.normalizeSave(parsed)
    } catch {
      return null
    }
  }

  clear(): void {
    localStorage.removeItem(SAVE_STORAGE_KEY)
  }

  private normalizeSave(data: LegacySaveData): GameSaveData | null {
    if (data.version === 1) {
      const migrated = this.migrateFromV1(data)
      return migrated ? this.normalizeSave(migrated) : null
    }
    if (data.version === 2) {
      const migrated = this.migrateFromV2(data)
      return migrated ? this.normalizeSave(migrated) : null
    }
    if (data.version === 3) {
      const migrated = this.migrateFromV3(data)
      return migrated ? this.normalizeSave(migrated) : null
    }
    if (data.version === 4) {
      const migrated = this.migrateFromV4(data)
      return migrated ? this.normalizeSave(migrated) : null
    }
    if (data.version === 5) {
      const migrated = this.migrateFromV5(data)
      return migrated ? this.repairSave(migrated) : null
    }
    if (data.version === 6) {
      if (!this.isValidCoreSave(data)) {
        return null
      }
      return this.repairSave(data as GameSaveData)
    }
    if (!this.isValidCoreSave(data)) {
      return null
    }
    return this.repairSave(data as GameSaveData)
  }

  normalizeMachineSave(machine: unknown): MachineSaveData {
    const defaults = this.emptyMachine()

    if (!machine || typeof machine !== 'object') {
      return defaults
    }

    const saved = machine as Partial<MachineSaveData>
    const position =
      saved.position &&
      typeof saved.position.x === 'number' &&
      typeof saved.position.y === 'number' &&
      typeof saved.position.z === 'number'
        ? saved.position
        : defaults.position

    const state =
      saved.state === TractorState.Idle ||
      saved.state === TractorState.Moving ||
      saved.state === TractorState.Working
        ? saved.state
        : defaults.state

    const rotationY =
      typeof saved.rotationY === 'number' ? saved.rotationY : defaults.rotationY

    let activeCommand = defaults.activeCommand
    let activeWork = defaults.activeWork
    let workTimer = defaults.workTimer
    let workDuration = defaults.workDuration

    if (saved.activeCommand && typeof saved.activeCommand === 'object') {
      activeCommand = saved.activeCommand
      activeWork =
        saved.activeWork && typeof saved.activeWork === 'object'
          ? saved.activeWork
          : null
      workTimer =
        typeof saved.workTimer === 'number' && saved.workTimer >= 0
          ? saved.workTimer
          : 0
      workDuration =
        typeof saved.workDuration === 'number' && saved.workDuration > 0
          ? saved.workDuration
          : defaults.workDuration

      if (
        state === TractorState.Working &&
        (!activeWork || typeof activeWork.fieldId !== 'string')
      ) {
        return defaults
      }
    } else if (state !== TractorState.Idle) {
      return defaults
    }

    return {
      machineId: MachineId.Tractor1,
      position,
      rotationY,
      state,
      activeCommand,
      activeWork,
      workTimer,
      workDuration,
    }
  }

  normalizeProductionSave(production: unknown): ProductionSaveData {
    const defaults = this.emptyProduction()

    if (!production || typeof production !== 'object') {
      return defaults
    }

    const saved = production as Partial<ProductionSaveData>
    if (
      !Array.isArray(saved.buildings) ||
      !Array.isArray(saved.processedInventory)
    ) {
      return defaults
    }

    const savedMill = saved.buildings.find(
      (building) => building?.id === ProductionBuildingId.Mill,
    )

    const buildings = savedMill
      ? [
          {
            id: ProductionBuildingId.Mill,
            state: this.normalizeBuildingState(savedMill.state),
            queue: this.normalizeQueue(savedMill.queue),
          },
        ]
      : defaults.buildings

    const processedInventory = defaults.processedInventory.map((defaultItem) => {
      const savedItem = saved.processedInventory!.find(
        (item) => item?.productId === defaultItem.productId,
      )
      const quantity =
        typeof savedItem?.quantity === 'number' && savedItem.quantity >= 0
          ? savedItem.quantity
          : 0

      return {
        productId: defaultItem.productId,
        quantity,
      }
    })

    return {
      buildings,
      processedInventory,
    }
  }

  private repairSave(data: LegacySaveData): GameSaveData {
    return {
      ...data,
      version: SAVE_VERSION,
      processedMarketPrices: Array.isArray(data.processedMarketPrices)
        ? data.processedMarketPrices
        : this.baseProcessedMarketPrices(),
      production: this.normalizeProductionSave(data.production),
      machine: this.normalizeMachineSave(data.machine),
    } as GameSaveData
  }

  private normalizeBuildingState(state: unknown): string {
    if (
      state === ProductionBuildingState.Idle ||
      state === ProductionBuildingState.Processing ||
      state === ProductionBuildingState.Ready
    ) {
      return state
    }
    return ProductionBuildingState.Idle
  }

  private normalizeQueue(
    queue: ProductionSaveData['buildings'][number]['queue'],
  ): ProductionSaveData['buildings'][number]['queue'] {
    if (!queue || typeof queue !== 'object') {
      return null
    }

    const progress =
      typeof queue.progress === 'number' && Number.isFinite(queue.progress)
        ? Math.min(1, Math.max(0, queue.progress))
        : 0

    if (
      typeof queue.recipeId !== 'string' ||
      typeof queue.inputCropId !== 'string' ||
      typeof queue.inputQuantity !== 'number' ||
      typeof queue.outputProductId !== 'string' ||
      typeof queue.outputQuantity !== 'number' ||
      typeof queue.durationDays !== 'number' ||
      queue.durationDays <= 0
    ) {
      return null
    }

    return {
      recipeId: queue.recipeId,
      inputCropId: queue.inputCropId,
      inputQuantity: queue.inputQuantity,
      outputProductId: queue.outputProductId,
      outputQuantity: queue.outputQuantity,
      progress,
      durationDays: queue.durationDays,
    }
  }

  private migrateFromV1(data: LegacySaveData): GameSaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    const ownership = FIELD_CATALOG.map((entry) => {
      const savedField = data.fields.find((field) => field.id === entry.id)
      if (savedField) {
        return { id: entry.id, ownership: FieldOwnership.Owned }
      }
      return { id: entry.id, ownership: entry.initialOwnership }
    })

    return {
      version: 2,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership,
      inventory: [],
      marketPrices: [],
      processedMarketPrices: [],
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private migrateFromV2(data: LegacySaveData): GameSaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.ownership) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    const fields = data.fields.map((field) => {
      const needsCrop =
        field.cropId === null &&
        (field.state === States.Seeded ||
          field.state === States.Growing ||
          field.state === States.Harvestable)

      return {
        ...field,
        cropId: needsCrop ? DEFAULT_CROP_ID : field.cropId,
      }
    })

    return {
      version: 3,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields,
      ownership: data.ownership,
      inventory: [],
      marketPrices: [],
      processedMarketPrices: [],
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private migrateFromV3(data: LegacySaveData): GameSaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.ownership) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    return {
      version: 4,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership: data.ownership,
      inventory: this.emptyInventory(),
      marketPrices: this.baseMarketPrices(),
      processedMarketPrices: this.baseProcessedMarketPrices(),
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private migrateFromV4(data: LegacySaveData): GameSaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.ownership) ||
      !Array.isArray(data.inventory) ||
      !Array.isArray(data.marketPrices) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    return {
      version: 5,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership: data.ownership,
      inventory: data.inventory,
      marketPrices: data.marketPrices,
      processedMarketPrices: this.baseProcessedMarketPrices(),
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private migrateFromV5(data: LegacySaveData): GameSaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.ownership) ||
      !Array.isArray(data.inventory) ||
      !Array.isArray(data.marketPrices) ||
      !Array.isArray(data.upgrades) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    return {
      version: SAVE_VERSION,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership: data.ownership,
      inventory: data.inventory,
      marketPrices: data.marketPrices,
      processedMarketPrices: this.baseProcessedMarketPrices(),
      production: this.emptyProduction(),
      upgrades: data.upgrades,
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private emptyInventory() {
    return CROP_CATALOG.map((crop) => ({ cropId: crop.id, quantity: 0 }))
  }

  private baseMarketPrices() {
    return CROP_CATALOG.map((crop) => ({
      cropId: crop.id,
      price: crop.sellingPrice,
    }))
  }

  private baseProcessedMarketPrices() {
    return PROCESSED_CATALOG.map((product) => ({
      productId: product.id,
      price: product.basePrice,
    }))
  }

  private emptyProduction() {
    return {
      buildings: [
        {
          id: ProductionBuildingId.Mill,
          state: ProductionBuildingState.Idle,
          queue: null,
        },
      ],
      processedInventory: PROCESSED_CATALOG.map((product) => ({
        productId: product.id,
        quantity: 0,
      })),
    }
  }

  private emptyMachine(): MachineSaveData {
    return {
      machineId: MachineId.Tractor1,
      position: { ...TRACTOR_HOME },
      rotationY: TRACTOR_HOME_ROTATION_Y,
      state: TractorState.Idle,
      activeCommand: null,
      activeWork: null,
      workTimer: 0,
      workDuration: 1.5,
    }
  }

  private emptyUpgrades() {
    return SHOP_CATALOG.map((upgrade) => ({ id: upgrade.id, level: 0 }))
  }

  private isValidCoreSave(data: LegacySaveData): boolean {
    return (
      typeof data.version === 'number' &&
      data.version >= 6 &&
      typeof data.money === 'number' &&
      typeof data.currentDay === 'number' &&
      typeof data.gameSpeed === 'number' &&
      Array.isArray(data.fields) &&
      Array.isArray(data.ownership) &&
      Array.isArray(data.inventory) &&
      Array.isArray(data.marketPrices) &&
      Array.isArray(data.upgrades) &&
      Array.isArray(data.eventLog) &&
      typeof data.eventLogNextId === 'number'
    )
  }
}
