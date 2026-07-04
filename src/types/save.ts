import type { GameLogEntry } from '@/types/events.ts'
import type { FieldLifecycleState } from '@/types/field.ts'
import type { FieldOwnership } from '@/types/ownership.ts'

export interface FieldSaveData {
  id: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null
  daysGrown?: number
}

export interface FieldOwnershipSaveData {
  id: string
  ownership: FieldOwnership
}

export interface InventorySaveData {
  cropId: string
  quantity: number
}

export interface MarketPriceSaveData {
  cropId: string
  price: number
}

export interface ProcessedMarketPriceSaveData {
  productId: string
  price: number
}

export interface ProductionBuildingSaveData {
  id: string
  state: string
  queue: {
    recipeId: string
    inputCropId: string
    inputQuantity: number
    outputProductId: string
    outputQuantity: number
    progress: number
    durationDays: number
  } | null
}

export interface ProcessedInventorySaveData {
  productId: string
  quantity: number
}

export interface ProductionSaveData {
  buildings: ProductionBuildingSaveData[]
  processedInventory: ProcessedInventorySaveData[]
}

export interface ShopUpgradeSaveData {
  id: string
  level: number
}

export interface MachineActiveWorkSaveData {
  type: string
  fieldId: string
  cropId?: string
}

export interface MachineSaveData {
  machineId: string
  position: { x: number; y: number; z: number }
  rotationY: number
  state: string
  activeCommand: {
    destination: {
      kind: string
      x?: number
      z?: number
      fieldId?: string
      zoneId?: string
      buildingId?: string
    }
    task: {
      kind: string
      cropId?: string
      targetBuildingId?: string
    }
  } | null
  activeWork: MachineActiveWorkSaveData | null
  workTimer: number
  workDuration: number
}

export interface GameSaveData {
  version: number
  money: number
  currentDay: number
  gameSpeed: number
  selectedFieldId: string | null
  fields: FieldSaveData[]
  ownership: FieldOwnershipSaveData[]
  inventory: InventorySaveData[]
  marketPrices: MarketPriceSaveData[]
  processedMarketPrices: ProcessedMarketPriceSaveData[]
  production: ProductionSaveData
  upgrades: ShopUpgradeSaveData[]
  machine: MachineSaveData
  eventLog: GameLogEntry[]
  eventLogNextId: number
}
