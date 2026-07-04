import type { GameLogEntry } from '@/types/events.ts'
import type { FarmStoreSaveData } from '@/types/farm-store.ts'
import type { GrainBinSaveData } from '@/types/grain-bin.ts'
import type { FieldLifecycleState } from '@/types/field.ts'
import type { FieldCropCare } from '@/types/crop-care.ts'
import type { FieldOwnership } from '@/types/ownership.ts'

export interface FieldSaveData {
  id: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null
  daysGrown?: number
  cropCare?: FieldCropCare
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
  grainBin?: GrainBinSaveData
}

export interface AttachmentContainerSaveData {
  cargoKind: string
  itemId?: string
  quantity: number
}

export interface AttachmentSaveData {
  attachmentId: string
  attachmentType: string
  catalogId: string
  lifecycleState: string
  position: { x: number; y: number; z: number }
  rotationY: number
  workPosition: string
  mountedOn: { machineId: string; slotId: string } | null
  containers?: AttachmentContainerSaveData[]
}

export interface AttachmentsSaveData {
  items: AttachmentSaveData[]
}

export interface MachinesSaveData {
  [machineId: string]: MachineSaveData
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
  machines: MachinesSaveData
  attachments: AttachmentsSaveData
  farmStore: FarmStoreSaveData
  eventLog: GameLogEntry[]
  eventLogNextId: number
}
