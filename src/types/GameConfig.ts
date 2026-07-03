export interface GameConfig {
  antialias?: boolean
  adaptToDeviceRatio?: boolean
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  antialias: true,
  adaptToDeviceRatio: true,
}
