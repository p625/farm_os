import { useEffect, useRef, useState } from 'react'
import { StudioEngine } from '@/studio/core/StudioEngine.ts'
import { StudioStore } from '@/studio/core/StudioStore.ts'
import { MapFileService } from '@/studio/io/MapFileService.ts'
import { createLegacyPrototypeMap } from '@/studio/io/createLegacyPrototypeMap.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { StudioToolbar } from '@/studio/panels/StudioToolbar.tsx'
import { ProjectPanel } from '@/studio/panels/ProjectPanel.tsx'
import { LayersPanel } from '@/studio/panels/LayersPanel.tsx'
import { TerrainToolsPanel } from '@/studio/panels/TerrainToolsPanel.tsx'
import { RoadToolsPanel } from '@/studio/panels/RoadToolsPanel.tsx'
import { InspectorPanel } from '@/studio/panels/InspectorPanel.tsx'
import { LogPanel } from '@/studio/panels/LogPanel.tsx'
import './StudioShell.css'

interface StudioShellProps {
  onSwitchToGame: () => void
}

async function resolveInitialMap() {
  const fromFile = await MapFileService.tryFetch('/maps/default.farmos-map.json')
  return fromFile ?? createLegacyPrototypeMap()
}

export function StudioShell({ onSwitchToGame }: StudioShellProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<StudioEngine | null>(null)
  const [store, setStore] = useState<StudioStore | null>(null)
  const snapshot = useStudioStore(store)

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) {
      return
    }
    const preventContextMenu = (event: Event) => {
      event.preventDefault()
    }
    shell.addEventListener('contextmenu', preventContextMenu, { capture: true })
    return () => {
      shell.removeEventListener('contextmenu', preventContextMenu, {
        capture: true,
      })
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    let active = true
    let engine: StudioEngine | null = null

    const resizeEngine = () => {
      engineRef.current?.resize()
    }

    const viewport = viewportRef.current
    const resizeObserver =
      viewport && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            resizeEngine()
          })
        : null
    if (viewport) {
      resizeObserver?.observe(viewport)
    }

    void (async () => {
      const map = await resolveInitialMap()
      if (!active) {
        return
      }
      const studioStore = new StudioStore(map)
      engine = new StudioEngine(canvas, studioStore)
      engineRef.current = engine
      setStore(studioStore)
      await engine.start()
      resizeEngine()
    })()

    return () => {
      active = false
      resizeObserver?.disconnect()
      const running = engineRef.current
      engineRef.current = null
      running?.dispose()
      setStore(null)
    }
  }, [])

  useEffect(() => {
    engineRef.current?.applyLayerVisibility(snapshot.layerVisibility)
  }, [snapshot.layerVisibility])

  useEffect(() => {
    engineRef.current?.syncModules()
  }, [snapshot.activeModuleId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F10') {
        event.preventDefault()
        onSwitchToGame()
        return
      }

      const target = event.target
      const inTextField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement

      if (snapshot.activeModuleId === 'roads') {
        if (event.key === 'Escape' && snapshot.roadDraft) {
          event.preventDefault()
          store?.cancelRoadDraft()
          engineRef.current?.refreshMap()
          return
        }
        if (
          (event.key === 'Delete' || event.key === 'Backspace') &&
          !inTextField
        ) {
          event.preventDefault()
          engineRef.current?.deleteSelectedRoad()
        }
        return
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }

      if (snapshot.activeModuleId !== 'transform' || inTextField) {
        return
      }

      event.preventDefault()
      engineRef.current?.deleteSelectedObject()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onSwitchToGame, snapshot.activeModuleId, snapshot.roadDraft, snapshot.roadSelection, store])

  const refreshScene = () => {
    engineRef.current?.refreshMap()
  }

  const deleteSelected = () => {
    engineRef.current?.deleteSelectedObject()
  }

  return (
    <div ref={shellRef} className="studio-shell">
      {store ? (
        <StudioToolbar
          store={store}
          onPlayGame={onSwitchToGame}
          onMapLoaded={(map) => {
            engineRef.current?.loadMap(map)
          }}
        />
      ) : (
        <header className="studio-toolbar studio-toolbar--loading">
          <span className="studio-toolbar__logo">FarmOS Studio</span>
          <span className="studio-toolbar__badge">Loading…</span>
        </header>
      )}

      <div className="studio-workspace">
        <aside className="studio-workspace__left">
          {store ? (
            <>
              <ProjectPanel store={store} />
              <LayersPanel store={store} />
              <TerrainToolsPanel store={store} />
              <RoadToolsPanel store={store} onSceneRefresh={refreshScene} />
            </>
          ) : null}
        </aside>

        <main ref={viewportRef} className="studio-workspace__viewport">
          <canvas ref={canvasRef} className="studio-shell__canvas" />
          <div className="studio-viewport-hint">
            Transform: drag · Terrain: paint · Roads: draw paths · F10 Game
          </div>
        </main>

        <aside className="studio-workspace__right">
          {store ? (
            <InspectorPanel
              store={store}
              onSceneRefresh={refreshScene}
              onDeleteSelected={deleteSelected}
            />
          ) : null}
        </aside>
      </div>

      {store ? <LogPanel store={store} /> : null}
    </div>
  )
}
