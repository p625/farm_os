import { SAVE_STORAGE_KEY, SAVE_VERSION } from '@/config/save.ts'
import type { GameSaveData } from '@/types/save.ts'

export class SaveGameService {
  save(data: GameSaveData): void {
    const payload: GameSaveData = {
      ...data,
      version: SAVE_VERSION,
    }
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload))
  }

  load(): GameSaveData | null {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as GameSaveData
      if (!this.isValidSave(parsed)) {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  clear(): void {
    localStorage.removeItem(SAVE_STORAGE_KEY)
  }

  private isValidSave(data: GameSaveData): boolean {
    return (
      data.version === SAVE_VERSION &&
      typeof data.money === 'number' &&
      typeof data.currentDay === 'number' &&
      typeof data.gameSpeed === 'number' &&
      Array.isArray(data.fields) &&
      Array.isArray(data.eventLog) &&
      typeof data.eventLogNextId === 'number'
    )
  }
}
