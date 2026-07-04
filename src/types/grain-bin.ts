export interface GrainBinSaveData {
  capacity: number
  quantity: number
  cropId: string | null
}

export interface GrainBinSnapshot {
  capacity: number
  quantity: number
  cropId: string | null
  cropName: string | null
  fillPercent: number
}

export const DEFAULT_GRAIN_BIN_CAPACITY = 500

export const EMPTY_GRAIN_BIN_SNAPSHOT: GrainBinSnapshot = {
  capacity: DEFAULT_GRAIN_BIN_CAPACITY,
  quantity: 0,
  cropId: null,
  cropName: null,
  fillPercent: 0,
}
