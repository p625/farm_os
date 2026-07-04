import type { CargoContainerSnapshot } from '@/types/cargo.ts'

export interface GrainBinSaveData {
  capacity: number
  quantity: number
  cropId: string | null
}

export type GrainBinSnapshot = CargoContainerSnapshot

export const DEFAULT_GRAIN_BIN_CAPACITY = 500

export const EMPTY_GRAIN_BIN_SNAPSHOT: GrainBinSnapshot = {
  capacity: DEFAULT_GRAIN_BIN_CAPACITY,
  quantity: 0,
  cropId: null,
  cropName: null,
  fillPercent: 0,
  hasCargo: false,
  isFull: false,
}
