export interface InventoryItemSnapshot {
  cropId: string
  cropName: string
  quantity: number
  displayColor: string
}

export interface MarketPriceSnapshot {
  cropId: string
  cropName: string
  currentPrice: number
  basePrice: number
  displayColor: string
}
