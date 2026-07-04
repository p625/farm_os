import { useRef } from 'react'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { MapFileService } from '@/studio/io/MapFileService.ts'
import { createLegacyPrototypeMap } from '@/studio/io/createLegacyPrototypeMap.ts'

import { ModuleSwitcher } from '@/studio/panels/ModuleSwitcher.tsx'

interface StudioToolbarProps {
  store: StudioStore
  onPlayGame: () => void
  onMapLoaded: (map: ReturnType<typeof createLegacyPrototypeMap>) => void
}

export function StudioToolbar({
  store,
  onPlayGame,
  onMapLoaded,
}: StudioToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="studio-toolbar">
      <div className="studio-toolbar__brand">
        <span className="studio-toolbar__logo">FarmOS Studio</span>
        <span className="studio-toolbar__badge">v0.3</span>
      </div>

      <ModuleSwitcher store={store} />

      <div className="studio-toolbar__actions">
        <button
          type="button"
          className="studio-btn"
          onClick={() => {
            const map = createLegacyPrototypeMap()
            store.setMap(map)
            onMapLoaded(map)
            store.log('info', 'New map from prototype template')
          }}
        >
          New
        </button>
        <button
          type="button"
          className="studio-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          Open
        </button>
        <button
          type="button"
          className="studio-btn studio-btn--primary"
          onClick={() => {
            MapFileService.download(store.getMap())
            store.markSaved()
            store.log('success', 'Map saved to file')
          }}
        >
          Save
        </button>
      </div>

      <div className="studio-toolbar__mode">
        <button
          type="button"
          className="studio-btn studio-btn--accent"
          onClick={onPlayGame}
          title="Switch to Game Mode (F10)"
        >
          ▶ Game
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="studio-toolbar__file-input"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) {
            return
          }
          try {
            const map = await MapFileService.loadFromFile(file)
            store.setMap(map)
            onMapLoaded(map)
            store.log('success', `Opened ${file.name}`)
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to open map'
            store.log('error', message)
          }
        }}
      />
    </header>
  )
}
