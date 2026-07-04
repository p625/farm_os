export const ProductionBuildingId = {
  Mill: 'mill',
} as const

export type ProductionBuildingId =
  (typeof ProductionBuildingId)[keyof typeof ProductionBuildingId]

export const ProductionBuildingState = {
  Idle: 'idle',
  Processing: 'processing',
  Ready: 'ready',
} as const

export type ProductionBuildingState =
  (typeof ProductionBuildingState)[keyof typeof ProductionBuildingState]

export const ProcessedProductId = {
  Flour: 'flour',
} as const

export type ProcessedProductId =
  (typeof ProcessedProductId)[keyof typeof ProcessedProductId]

export interface ProcessedProductDefinition {
  id: ProcessedProductId
  name: string
  basePrice: number
  displayColor: string
}

export interface ProductionRecipe {
  buildingId: ProductionBuildingId
  inputCropId: string
  inputQuantity: number
  outputProductId: ProcessedProductId
  outputQuantity: number
  durationDays: number
}

export interface ProductionQueueItem {
  recipeId: string
  inputCropId: string
  inputQuantity: number
  outputProductId: ProcessedProductId
  outputQuantity: number
  progress: number
  durationDays: number
}

export interface ProductionBuilding {
  id: ProductionBuildingId
  name: string
  state: ProductionBuildingState
  queue: ProductionQueueItem | null
}

export interface ProductionBuildingSnapshot {
  id: ProductionBuildingId
  name: string
  state: ProductionBuildingState
  progress: number
  canStart: boolean
  canCollect: boolean
  inputCropName: string
  inputRequired: number
  outputProductName: string
  outputAmount: number
  recipeLabel: string
}

export interface ProcessedInventorySnapshot {
  productId: ProcessedProductId
  productName: string
  quantity: number
  displayColor: string
  unitPrice: number
  totalValue: number
}

export interface ProcessedMarketPriceSnapshot {
  productId: ProcessedProductId
  productName: string
  currentPrice: number
  basePrice: number
  displayColor: string
}
