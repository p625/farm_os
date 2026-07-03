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

export interface GameSaveData {
  version: number
  money: number
  currentDay: number
  gameSpeed: number
  selectedFieldId: string | null
  fields: FieldSaveData[]
  ownership: FieldOwnershipSaveData[]
  eventLog: GameLogEntry[]
  eventLogNextId: number
}
