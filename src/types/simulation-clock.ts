export const SIMULATION_SECONDS_PER_DAY = 86_400

export const TIME_SCALE_OPTIONS = [0, 1, 2, 4] as const

export type TimeScale = (typeof TIME_SCALE_OPTIONS)[number]

export const DAY_LENGTH_OPTIONS = [15, 30, 45, 60, 90] as const

export type RealMinutesPerGameDay = (typeof DAY_LENGTH_OPTIONS)[number]

export const DEFAULT_REAL_MINUTES_PER_GAME_DAY: RealMinutesPerGameDay = 45
