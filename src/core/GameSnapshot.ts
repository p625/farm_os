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
  type FieldContextMenuSnapshot,
  type SelectedEntitySnapshot,
} from '@/types/machine.ts'
import { TractorState, type TractorSnapshot } from '@/types/tractor.ts'

export interface GameSnapshot {
  money: number
  currentDay: number
  gameSpeed: number
  selectedFieldId: string | null
  selectedEntity: SelectedEntitySnapshot
  fieldContextMenu: FieldContextMenuSnapshot | null
  fields: readonly FieldSnapshot[]
  crops: readonly CropSnapshot[]
  inventory: readonly InventoryItemSnapshot[]
  processedInventory: readonly ProcessedInventorySnapshot[]
  marketPrices: readonly MarketPriceSnapshot[]
  processedMarketPrices: readonly ProcessedMarketPriceSnapshot[]
  mill: ProductionBuildingSnapshot
  shopUpgrades: readonly ShopUpgradeSnapshot[]
  tractor: TractorSnapshot
  eventLog: readonly GameLogEntry[]
  moneyGain: MoneyGainEffect | null
}

export const EMPTY_GAME_SNAPSHOT: GameSnapshot = {
  money: 0,
  currentDay: 1,
  gameSpeed: 1,
  selectedFieldId: null,
  selectedEntity: EMPTY_SELECTED_ENTITY,
  fieldContextMenu: null,
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
  tractor: {
    state: TractorState.Idle,
    activeJob: null,
    workProgress: 0,
    position: { x: 6, y: 0, z: 10 },
    rotationY: -Math.PI / 6,
  },
  eventLog: [],
  moneyGain: null,
}
