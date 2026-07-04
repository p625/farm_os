import type { FieldSnapshot } from '@/types/field.ts'
import type { CropSnapshot } from '@/types/crop.ts'
import type {
  InventoryItemSnapshot,
  MarketPriceSnapshot,
} from '@/types/market.ts'
import type {
  ProcessedInventorySnapshot,
  ProcessedMarketPriceSnapshot,
  ProductionBuildingSnapshot,
} from '@/types/production.ts'
import type { ShopUpgradeSnapshot } from '@/types/shop.ts'
import type { GameLogEntry, MoneyGainEffect } from '@/types/events.ts'
import {
  EMPTY_SELECTED_ENTITY,
  MachineId,
  type FieldContextMenuSnapshot,
  type FieldWorkModeMenuSnapshot,
  type MachineCapability as MachineCapabilityValue,
  type MachineContextMenuSnapshot,
  type MachineId as MachineIdValue,
  type SelectedEntitySnapshot,
} from '@/types/machine.ts'
import type {
  AttachmentContextMenuSnapshot,
  MachineAttachmentsSnapshot,
} from '@/types/attachment.ts'
import type { GrainBinSnapshot } from '@/types/grain-bin.ts'
import type { CargoContainerSnapshot } from '@/types/cargo.ts'
import type { FarmStoreSnapshot } from '@/types/farm-store.ts'
import type { InteractionContextMenuSnapshot } from '@/types/interaction-point.ts'
import type { FleetMachineSnapshot } from '@/types/machine-fleet.ts'
import { CommandOwner } from '@/types/machine-automation.ts'
import type { WorkOrderSnapshot } from '@/types/work-order.ts'
import { ProductCategory } from '@/types/product.ts'
import {
  TractorState,
  type TractorJobSnapshot,
  type TractorSnapshot,
} from '@/types/tractor.ts'

export interface SelectedMachineSnapshot {
  machineId: MachineIdValue
  machineName: string
  state: TractorState
  activeJob: TractorJobSnapshot | null
  activeLogisticsLabel: string | null
  workProgress: number
  workRemainingSeconds: number | null
  position: { x: number; y: number; z: number }
  rotationY: number
  grainBin: GrainBinSnapshot | null
  commandOwner: CommandOwner
}

export interface GameSnapshot {
  money: number
  currentDay: number
  gameSpeed: number
  timeOfDay: string
  seasonLabel: string
  isPaused: boolean
  selectedFieldId: string | null
  selectedFieldIds: readonly string[]
  selectedEntity: SelectedEntitySnapshot
  fieldContextMenu: FieldContextMenuSnapshot | null
  fieldWorkModeMenu: FieldWorkModeMenuSnapshot | null
  attachmentContextMenu: AttachmentContextMenuSnapshot | null
  machineContextMenu: MachineContextMenuSnapshot | null
  interactionContextMenu: InteractionContextMenuSnapshot | null
  fields: readonly FieldSnapshot[]
  crops: readonly CropSnapshot[]
  inventory: readonly InventoryItemSnapshot[]
  processedInventory: readonly ProcessedInventorySnapshot[]
  marketPrices: readonly MarketPriceSnapshot[]
  processedMarketPrices: readonly ProcessedMarketPriceSnapshot[]
  mill: ProductionBuildingSnapshot
  shopUpgrades: readonly ShopUpgradeSnapshot[]
  selectedMachine: SelectedMachineSnapshot
  machineAttachments: MachineAttachmentsSnapshot | null
  effectiveCapabilities: readonly MachineCapabilityValue[]
  headerSupportedCrops: readonly string[]
  harvestCompatibilityHint: string | null
  logisticsHint: string | null
  trailerCargo: CargoContainerSnapshot | null
  farmStore: FarmStoreSnapshot
  fleetPanelOpen: boolean
  fleet: readonly FleetMachineSnapshot[]
  activeWorkOrder: WorkOrderSnapshot | null
  eventLog: readonly GameLogEntry[]
  moneyGain: MoneyGainEffect | null
}

const DEFAULT_SELECTED_MACHINE: SelectedMachineSnapshot = {
  machineId: MachineId.Tractor1,
  machineName: 'Tractor',
  state: TractorState.Idle,
  activeJob: null,
  activeLogisticsLabel: null,
  workProgress: 0,
  workRemainingSeconds: null,
  position: { x: 6, y: 0, z: 10 },
  rotationY: -Math.PI / 6,
  grainBin: null,
  commandOwner: CommandOwner.Player,
}

export const EMPTY_GAME_SNAPSHOT: GameSnapshot = {
  money: 0,
  currentDay: 1,
  gameSpeed: 1,
  timeOfDay: '06:00',
  seasonLabel: '—',
  isPaused: false,
  selectedFieldId: null,
  selectedFieldIds: [],
  selectedEntity: EMPTY_SELECTED_ENTITY,
  fieldContextMenu: null,
  fieldWorkModeMenu: null,
  attachmentContextMenu: null,
  machineContextMenu: null,
  interactionContextMenu: null,
  fields: [],
  crops: [],
  inventory: [],
  processedInventory: [],
  marketPrices: [],
  processedMarketPrices: [],
  mill: {
    id: 'mill',
    name: 'Mill',
    state: 'idle',
    progress: 0,
    canStart: false,
    canCollect: false,
    inputCropName: 'Wheat',
    inputRequired: 10,
    outputProductName: 'Flour',
    outputAmount: 8,
    recipeLabel: '10 Wheat → 8 Flour',
  },
  shopUpgrades: [],
  selectedMachine: DEFAULT_SELECTED_MACHINE,
  machineAttachments: null,
  effectiveCapabilities: [],
  headerSupportedCrops: [],
  harvestCompatibilityHint: null,
  logisticsHint: null,
  trailerCargo: null,
  farmStore: {
    open: false,
    storeId: null,
    storeName: null,
    activeCategory: ProductCategory.Tractors,
    products: [],
  },
  fleetPanelOpen: false,
  fleet: [],
  activeWorkOrder: null,
  eventLog: [],
  moneyGain: null,
}

export function buildSelectedMachineSnapshot(
  machineId: MachineIdValue,
  machineName: string,
  operation: TractorSnapshot,
  grainBin: GrainBinSnapshot | null,
  commandOwner: CommandOwner = CommandOwner.Player,
): SelectedMachineSnapshot {
  return {
    machineId,
    machineName,
    state: operation.state,
    activeJob: operation.activeJob,
    activeLogisticsLabel: operation.activeLogisticsLabel,
    workProgress: operation.workProgress,
    workRemainingSeconds: operation.workRemainingSeconds,
    position: operation.position,
    rotationY: operation.rotationY,
    grainBin,
    commandOwner,
  }
}
