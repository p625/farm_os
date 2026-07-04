import { useMemo, useState, useEffect, useCallback } from 'react'
import { SaveSlotManager } from '@game/SaveSlotManager.ts'
import { defaultMapPackageRegistry } from '@/maps/MapPackageLoader.ts'
import { loadExportedMapsIntoRegistry } from '@/maps/ExportedMapStorage.ts'
import { FARMOS_EXPORTS_CHANGED_EVENT } from '@/maps/exportEvents.ts'
import { defaultSlotId } from '@/types/save-slot.ts'
import type { GameSessionConfig } from '@game/GameSession.ts'
import type { SaveSlotMetadata } from '@/types/save-slot.ts'
import './MainMenu.css'

type MenuView = 'main' | 'new-game' | 'load-game'

interface MainMenuScreenProps {
  onStartGame: (session: GameSessionConfig) => void
  onOpenStudio?: () => void
}

function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatLastPlayed(iso: string): string {
  if (!iso) {
    return '—'
  }
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function MainMenuScreen({ onStartGame, onOpenStudio }: MainMenuScreenProps) {
  const saveSlotManager = useMemo(() => new SaveSlotManager(), [])
  const [view, setView] = useState<MenuView>('main')
  const [slots, setSlots] = useState<SaveSlotMetadata[]>(() => saveSlotManager.listSlots())
  const [selectedMapId, setSelectedMapId] = useState('map_01_central_europe')
  const [farmName, setFarmName] = useState('My Farm')
  const [newGameSlotId, setNewGameSlotId] = useState(defaultSlotId(1))
  const [pendingDeleteSlotId, setPendingDeleteSlotId] = useState<string | null>(null)
  const [pendingOverwriteSlotId, setPendingOverwriteSlotId] = useState<string | null>(null)

  const [maps, setMaps] = useState(() => {
    loadExportedMapsIntoRegistry(defaultMapPackageRegistry)
    return defaultMapPackageRegistry.getSummaries()
  })
  const lastPlayedSlotId = saveSlotManager.getLastPlayedSlotId()
  const canContinue =
    lastPlayedSlotId !== null && saveSlotManager.slotOccupied(lastPlayedSlotId)

  const refreshSlots = () => {
    setSlots(saveSlotManager.listSlots())
  }

  const refreshMaps = useCallback(() => {
    loadExportedMapsIntoRegistry(defaultMapPackageRegistry)
    const nextMaps = defaultMapPackageRegistry.getSummaries()
    setMaps(nextMaps)
    setSelectedMapId((current) =>
      nextMaps.some((entry) => entry.id === current) ? current : nextMaps[0]?.id ?? 'map_01',
    )
  }, [])

  useEffect(() => {
    const onExportsChanged = () => {
      refreshMaps()
    }
    const onWindowFocus = () => {
      refreshMaps()
    }
    window.addEventListener(FARMOS_EXPORTS_CHANGED_EVENT, onExportsChanged)
    window.addEventListener('focus', onWindowFocus)
    return () => {
      window.removeEventListener(FARMOS_EXPORTS_CHANGED_EVENT, onExportsChanged)
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [refreshMaps])

  const startSession = (session: GameSessionConfig) => {
    onStartGame(session)
  }

  const handleContinue = () => {
    if (!lastPlayedSlotId || !saveSlotManager.slotOccupied(lastPlayedSlotId)) {
      return
    }
    const save = saveSlotManager.loadSlot(lastPlayedSlotId)
    if (!save) {
      return
    }
    startSession({
      slotId: lastPlayedSlotId,
      mapId: save.mapId,
      farmName: save.farmName,
      difficultyId: 'standard',
      isNewGame: false,
    })
  }

  const confirmNewGame = () => {
    const trimmedName = farmName.trim() || 'My Farm'
    if (saveSlotManager.slotOccupied(newGameSlotId)) {
      setPendingOverwriteSlotId(newGameSlotId)
      return
    }
    startSession({
      slotId: newGameSlotId,
      mapId: selectedMapId,
      farmName: trimmedName,
      difficultyId: 'standard',
      isNewGame: true,
    })
  }

  const handleOverwriteNewGame = () => {
    if (!pendingOverwriteSlotId) {
      return
    }
    const trimmedName = farmName.trim() || 'My Farm'
    startSession({
      slotId: pendingOverwriteSlotId,
      mapId: selectedMapId,
      farmName: trimmedName,
      difficultyId: 'standard',
      isNewGame: true,
    })
    setPendingOverwriteSlotId(null)
  }

  const handleLoadSlot = (slot: SaveSlotMetadata) => {
    if (!saveSlotManager.slotOccupied(slot.slotId)) {
      return
    }
    const save = saveSlotManager.loadSlot(slot.slotId)
    if (!save) {
      return
    }
    startSession({
      slotId: slot.slotId,
      mapId: save.mapId,
      farmName: save.farmName,
      difficultyId: 'standard',
      isNewGame: false,
    })
  }

  const handleDeleteSlot = (slotId: string) => {
    saveSlotManager.deleteSlot(slotId)
    setPendingDeleteSlotId(null)
    refreshSlots()
  }

  if (view === 'new-game') {
    return (
      <div className="main-menu">
        <div className="main-menu__card">
          <h1 className="main-menu__title">New Game</h1>
          <label className="main-menu__field">
            <span>Farm name</span>
            <input
              type="text"
              value={farmName}
              maxLength={40}
              onChange={(event) => setFarmName(event.target.value)}
            />
          </label>
          <label className="main-menu__field">
            <span>Map</span>
            <select
              value={selectedMapId}
              onChange={(event) => setSelectedMapId(event.target.value)}
            >
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                  {map.source === 'community' ? ' (Studio)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="main-menu__field">
            <span>Save slot</span>
            <select
              value={newGameSlotId}
              onChange={(event) => setNewGameSlotId(event.target.value)}
            >
              {slots.map((slot) => (
                <option key={slot.slotId} value={slot.slotId}>
                  Slot {slot.slotId.replace('slot_', '')}
                  {saveSlotManager.slotOccupied(slot.slotId) ? ' (used)' : ''}
                </option>
              ))}
            </select>
          </label>
          {pendingOverwriteSlotId ? (
            <div className="main-menu__confirm">
              <p>Overwrite existing save in this slot?</p>
              <div className="main-menu__actions">
                <button type="button" onClick={handleOverwriteNewGame}>
                  Overwrite
                </button>
                <button
                  type="button"
                  className="main-menu__button--secondary"
                  onClick={() => setPendingOverwriteSlotId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="main-menu__actions">
              <button type="button" onClick={confirmNewGame}>
                Start
              </button>
              <button
                type="button"
                className="main-menu__button--secondary"
                onClick={() => setView('main')}
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (view === 'load-game') {
    return (
      <div className="main-menu">
        <div className="main-menu__card main-menu__card--wide">
          <h1 className="main-menu__title">Load Game</h1>
          <ul className="main-menu__slot-list">
            {slots.map((slot) => {
              const occupied = saveSlotManager.slotOccupied(slot.slotId)
              return (
                <li key={slot.slotId} className="main-menu__slot">
                  <div className="main-menu__slot-header">
                    <strong>
                      Slot {slot.slotId.replace('slot_', '')}
                      {occupied ? `: ${slot.farmName}` : ''}
                    </strong>
                    {occupied ? (
                      <span className="main-menu__slot-meta">
                        Day {slot.currentDay} · {slot.timeOfDay} · ₡
                        {slot.money.toLocaleString()}
                      </span>
                    ) : (
                      <span className="main-menu__slot-meta">Empty</span>
                    )}
                  </div>
                  {occupied ? (
                    <>
                      <p className="main-menu__slot-details">
                        {slot.mapName} · Season {slot.seasonLabel} · Played{' '}
                        {formatPlayTime(slot.playTimeSeconds)} · Last{' '}
                        {formatLastPlayed(slot.lastPlayedAt)}
                      </p>
                      <div className="main-menu__slot-actions">
                        <button type="button" onClick={() => handleLoadSlot(slot)}>
                          Load
                        </button>
                        {pendingDeleteSlotId === slot.slotId ? (
                          <>
                            <button
                              type="button"
                              className="main-menu__button--danger"
                              onClick={() => handleDeleteSlot(slot.slotId)}
                            >
                              Confirm delete
                            </button>
                            <button
                              type="button"
                              className="main-menu__button--secondary"
                              onClick={() => setPendingDeleteSlotId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="main-menu__button--secondary"
                            onClick={() => setPendingDeleteSlotId(slot.slotId)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  ) : null}
                </li>
              )
            })}
          </ul>
          <div className="main-menu__actions">
            <button
              type="button"
              className="main-menu__button--secondary"
              onClick={() => {
                setPendingDeleteSlotId(null)
                setView('main')
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-menu">
      <div className="main-menu__card">
        <h1 className="main-menu__title">FarmOS</h1>
        <p className="main-menu__subtitle">Phase 17 — Game Framework</p>
        <div className="main-menu__actions main-menu__actions--stack">
          <button type="button" disabled={!canContinue} onClick={handleContinue}>
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              refreshMaps()
              setView('new-game')
            }}
          >
            New Game
          </button>
          <button
            type="button"
            onClick={() => {
              refreshSlots()
              setView('load-game')
            }}
          >
            Load Game
          </button>
          {onOpenStudio ? (
            <button
              type="button"
              className="main-menu__button--secondary"
              onClick={onOpenStudio}
            >
              Studio (F10)
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
