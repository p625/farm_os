export const GameEventKind = {
  FieldPlowed: 'field_plowed',
  WheatSeeded: 'wheat_seeded',
  WheatReady: 'wheat_ready',
  HarvestSold: 'harvest_sold',
  GameSaved: 'game_saved',
  FarmReset: 'farm_reset',
} as const

export type GameEventKind =
  (typeof GameEventKind)[keyof typeof GameEventKind]

export interface GameLogEntry {
  id: number
  message: string
  day: number
  kind: GameEventKind
}

export interface MoneyGainEffect {
  amount: number
  id: number
}
