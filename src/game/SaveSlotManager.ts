import { formatSimulationTimeOfDay } from '@game/SimulationClock.ts'
import { SaveGameService } from '@game/SaveGameService.ts'
import { defaultMapPackageRegistry } from '@/maps/MapPackageLoader.ts'
import { SAVE_VERSION } from '@/config/save.ts'
import type { GameSaveData } from '@/types/save.ts'
import {
  EMPTY_SAVE_SLOT_INDEX,
  LEGACY_SAVE_STORAGE_KEY,
  SAVE_INDEX_KEY,
  SAVE_SLOT_COUNT,
  defaultSlotId,
  getSaveSlotStorageKey,
  type SaveSlotIndex,
  type SaveSlotMetadata,
} from '@/types/save-slot.ts'

const SEASON_PLACEHOLDER = '—'

export class SaveSlotManager {
  private readonly saveGameService = new SaveGameService()

  loadIndex(): SaveSlotIndex {
    try {
      const raw = localStorage.getItem(SAVE_INDEX_KEY)
      if (!raw) {
        return this.migrateLegacySaveIfNeeded()
      }
      const parsed = JSON.parse(raw) as SaveSlotIndex
      return {
        slots: Array.isArray(parsed.slots) ? parsed.slots : [],
        lastPlayedSlotId: parsed.lastPlayedSlotId ?? null,
      }
    } catch {
      return this.migrateLegacySaveIfNeeded()
    }
  }

  private saveIndex(index: SaveSlotIndex): void {
    localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index))
  }

  listSlots(): SaveSlotMetadata[] {
    const index = this.loadIndex()
    const byId = new Map(index.slots.map((slot) => [slot.slotId, slot]))
    const slots: SaveSlotMetadata[] = []

    for (let i = 1; i <= SAVE_SLOT_COUNT; i += 1) {
      const slotId = defaultSlotId(i)
      const existing = byId.get(slotId)
      if (existing) {
        slots.push(existing)
      } else {
        slots.push({
          slotId,
          farmName: 'Empty Slot',
          mapId: '',
          mapName: '',
          money: 0,
          currentDay: 0,
          timeOfDay: '00:00',
          seasonLabel: SEASON_PLACEHOLDER,
          playTimeSeconds: 0,
          lastPlayedAt: '',
          saveVersion: 0,
        })
      }
    }

    return slots
  }

  getLastPlayedSlotId(): string | null {
    return this.loadIndex().lastPlayedSlotId
  }

  setLastPlayedSlotId(slotId: string): void {
    const index = this.loadIndex()
    this.saveIndex({ ...index, lastPlayedSlotId: slotId })
  }

  loadSlot(slotId: string): GameSaveData | null {
    const raw = localStorage.getItem(getSaveSlotStorageKey(slotId))
    if (!raw) {
      return null
    }

    try {
      return this.saveGameService.normalizeSaveData(JSON.parse(raw))
    } catch {
      return null
    }
  }

  saveSlot(slotId: string, data: GameSaveData, metadata?: Partial<SaveSlotMetadata>): void {
    const payload: GameSaveData = {
      ...data,
      version: SAVE_VERSION,
    }
    localStorage.setItem(getSaveSlotStorageKey(slotId), JSON.stringify(payload))

    const mapName =
      metadata?.mapName ??
      defaultMapPackageRegistry.getSummary(payload.mapId)?.name ??
      payload.mapId

    const slotMetadata: SaveSlotMetadata = {
      slotId,
      farmName: payload.farmName,
      mapId: payload.mapId,
      mapName,
      money: payload.money,
      currentDay: payload.currentDay,
      timeOfDay: metadata?.timeOfDay ?? formatSimulationTimeOfDay(payload.dayFraction),
      seasonLabel: SEASON_PLACEHOLDER,
      playTimeSeconds: payload.playTimeSeconds,
      lastPlayedAt: new Date().toISOString(),
      saveVersion: payload.version,
    }

    const index = this.loadIndex()
    const slots = index.slots.filter((slot) => slot.slotId !== slotId)
    slots.push(slotMetadata)
    this.saveIndex({
      slots,
      lastPlayedSlotId: slotId,
    })
  }

  deleteSlot(slotId: string): void {
    localStorage.removeItem(getSaveSlotStorageKey(slotId))
    const index = this.loadIndex()
    this.saveIndex({
      slots: index.slots.filter((slot) => slot.slotId !== slotId),
      lastPlayedSlotId:
        index.lastPlayedSlotId === slotId ? null : index.lastPlayedSlotId,
    })
  }

  slotOccupied(slotId: string): boolean {
    return localStorage.getItem(getSaveSlotStorageKey(slotId)) !== null
  }

  createNewGameSave(mapId: string, farmName: string): GameSaveData {
    return this.saveGameService.createDefaultSave(mapId, farmName)
  }

  migrateLegacySaveIfNeeded(): SaveSlotIndex {
    const legacyRaw = localStorage.getItem(LEGACY_SAVE_STORAGE_KEY)
    if (!legacyRaw) {
      return { ...EMPTY_SAVE_SLOT_INDEX }
    }

    try {
      const parsed = this.saveGameService.normalizeSaveData(JSON.parse(legacyRaw))
      if (!parsed) {
        localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY)
        return { ...EMPTY_SAVE_SLOT_INDEX }
      }

      const slotId = defaultSlotId(1)
      this.saveSlot(slotId, parsed, {
        farmName: parsed.farmName,
        mapName:
          defaultMapPackageRegistry.getSummary(parsed.mapId)?.name ?? parsed.mapId,
      })
      localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY)
      return this.loadIndex()
    } catch {
      localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY)
      return { ...EMPTY_SAVE_SLOT_INDEX }
    }
  }
}
