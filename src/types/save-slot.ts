export const SAVE_SLOT_COUNT = 5

export const SAVE_INDEX_KEY = 'farmos-save-index'

export const LEGACY_SAVE_STORAGE_KEY = 'farmos-save'

export function getSaveSlotStorageKey(slotId: string): string {
  return `farmos-save-slot-${slotId}`
}

export function defaultSlotId(index: number): string {
  return `slot_${index}`
}

export interface SaveSlotMetadata {
  slotId: string
  farmName: string
  mapId: string
  mapName: string
  money: number
  currentDay: number
  timeOfDay: string
  seasonLabel: string
  playTimeSeconds: number
  lastPlayedAt: string
  previewImage?: string
  saveVersion: number
}

export interface SaveSlotIndex {
  slots: SaveSlotMetadata[]
  lastPlayedSlotId: string | null
}

export const EMPTY_SAVE_SLOT_INDEX: SaveSlotIndex = {
  slots: [],
  lastPlayedSlotId: null,
}
