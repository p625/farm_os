import type { RealMinutesPerGameDay } from '@/types/simulation-clock.ts'
import { DEFAULT_REAL_MINUTES_PER_GAME_DAY } from '@/types/simulation-clock.ts'

const PREFERENCES_KEY = 'farmos-preferences'

export interface GamePreferences {
  realMinutesPerGameDay: RealMinutesPerGameDay
  lastPlayedSlotId: string | null
}

const DEFAULT_PREFERENCES: GamePreferences = {
  realMinutesPerGameDay: DEFAULT_REAL_MINUTES_PER_GAME_DAY,
  lastPlayedSlotId: null,
}

export function loadGamePreferences(): GamePreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY)
    if (!raw) {
      return { ...DEFAULT_PREFERENCES }
    }
    const parsed = JSON.parse(raw) as Partial<GamePreferences>
    return {
      realMinutesPerGameDay:
        parsed.realMinutesPerGameDay ?? DEFAULT_REAL_MINUTES_PER_GAME_DAY,
      lastPlayedSlotId: parsed.lastPlayedSlotId ?? null,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function saveGamePreferences(preferences: GamePreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
}
