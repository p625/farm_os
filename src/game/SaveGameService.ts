import { CROP_CATALOG, DEFAULT_CROP_ID } from '@/config/crop-catalog.ts'
import { FIELD_CATALOG } from '@/config/field-catalog.ts'
import { SAVE_STORAGE_KEY, SAVE_VERSION } from '@/config/save.ts'
import { FieldOwnership } from '@/types/ownership.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import type { GameSaveData } from '@/types/save.ts'

type LegacySaveData = GameSaveData & { version?: number }

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
      return this.migrateFromV3(data)
    }
    if (!this.isValidSave(data)) {
      return null
    }
    return data
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
      version: SAVE_VERSION,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership: data.ownership,
      inventory: this.emptyInventory(),
      marketPrices: this.baseMarketPrices(),
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

  private isValidSave(data: GameSaveData): boolean {
    return (
      data.version === SAVE_VERSION &&
      typeof data.money === 'number' &&
      typeof data.currentDay === 'number' &&
      typeof data.gameSpeed === 'number' &&
      Array.isArray(data.fields) &&
      Array.isArray(data.ownership) &&
      Array.isArray(data.inventory) &&
      Array.isArray(data.marketPrices) &&
      Array.isArray(data.eventLog) &&
      typeof data.eventLogNextId === 'number'
    )
  }
}
