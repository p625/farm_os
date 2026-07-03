import type { FieldSnapshot } from '@/types/field.ts'
import type { GameLogEntry, MoneyGainEffect } from '@/types/events.ts'
import { TractorState, type TractorSnapshot } from '@/types/tractor.ts'

export interface GameSnapshot {
  money: number
  currentDay: number
  gameSpeed: number
  selectedFieldId: string | null
  fields: readonly FieldSnapshot[]
  tractor: TractorSnapshot
  eventLog: readonly GameLogEntry[]
  moneyGain: MoneyGainEffect | null
}

export const EMPTY_GAME_SNAPSHOT: GameSnapshot = {
  money: 0,
  currentDay: 1,
  gameSpeed: 1,
  selectedFieldId: null,
  fields: [],
  tractor: {
    state: TractorState.Idle,
    activeJob: null,
    workProgress: 0,
  },
  eventLog: [],
  moneyGain: null,
}
