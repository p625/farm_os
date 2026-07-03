import type { GameLogEntry } from '@/types/events.ts'
import type { FieldLifecycleState } from '@/types/field.ts'

export interface FieldSaveData {
  id: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null
}

export interface GameSaveData {
  version: number
  money: number
  currentDay: number
  gameSpeed: number
  selectedFieldId: string | null
  fields: FieldSaveData[]
  eventLog: GameLogEntry[]
  eventLogNextId: number
}
