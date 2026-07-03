export const GameEventKind = {
  FieldPlowed: 'field_plowed',
  CropPlanted: 'crop_planted',
  CropReady: 'crop_ready',
  HarvestStored: 'harvest_stored',
  CropSold: 'crop_sold',
  PriceChanged: 'price_changed',
  FieldPurchased: 'field_purchased',
  FieldLeased: 'field_leased',
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
