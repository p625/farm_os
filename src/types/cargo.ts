export interface CargoContainerSaveData {
  capacity: number
  quantity: number
  cropId: string | null
}

export interface CargoContainerSnapshot {
  capacity: number
  quantity: number
  cropId: string | null
  cropName: string | null
  fillPercent: number
  hasCargo: boolean
  isFull: boolean
}

export const CARGO_KIND_CROP = 'crop' as const

export const DEFAULT_TRAILER_CARGO_CAPACITY = 300
