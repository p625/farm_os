import { useEffect, useRef, useState } from 'react'
import { StudioEngine } from '@/studio/core/StudioEngine.ts'
import { StudioStore } from '@/studio/core/StudioStore.ts'
import { MapFileService } from '@/studio/io/MapFileService.ts'
import { loadMap01BlockoutDocument } from '@/maps/map-01-blockout/loadMap01BlockoutDocument.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { StudioToolbar } from '@/studio/panels/StudioToolbar.tsx'
import { ProjectPanel } from '@/studio/panels/ProjectPanel.tsx'
import { LayersPanel } from '@/studio/panels/LayersPanel.tsx'
import { TerrainToolsPanel } from '@/studio/panels/TerrainToolsPanel.tsx'
import { RoadToolsPanel } from '@/studio/panels/RoadToolsPanel.tsx'
import { ParcelToolsPanel } from '@/studio/panels/ParcelToolsPanel.tsx'
import { VegetationToolsPanel } from '@/studio/panels/VegetationToolsPanel.tsx'
import { BuildingToolsPanel } from '@/studio/panels/BuildingToolsPanel.tsx'
import { VehicleToolsPanel } from '@/studio/panels/VehicleToolsPanel.tsx'
import { WaterToolsPanel } from '@/studio/panels/WaterToolsPanel.tsx'
import { ValidationToolsPanel } from '@/studio/panels/ValidationToolsPanel.tsx'
import { ExportToolsPanel } from '@/studio/panels/ExportToolsPanel.tsx'
import { InspectorPanel } from '@/studio/panels/InspectorPanel.tsx'
import { LogPanel } from '@/studio/panels/LogPanel.tsx'
import './StudioShell.css'

interface StudioShellProps {
  onSwitchToGame: () => void
}

async function resolveInitialMap() {
  const map01 = await MapFileService.tryFetch(
    '/maps/Map_01_Central_Europe/Map_01_Central_Europe.farmos-map.json',
  )
  if (map01) {
    return map01
  }
  const fromFile = await MapFileService.tryFetch('/maps/default.farmos-map.json')
  return fromFile ?? loadMap01BlockoutDocument()
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
    let startFrame = 0

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

    startFrame = requestAnimationFrame(() => {
      if (!active || !canvasRef.current) {
        return
      }

      void (async () => {
        const map = await resolveInitialMap()
        if (!active || !canvasRef.current) {
          return
        }
        const studioStore = new StudioStore(map)
        engine = new StudioEngine(canvasRef.current, studioStore)
        engineRef.current = engine
        setStore(studioStore)
        await engine.start()
        if (!active) {
          engine.dispose()
          engineRef.current = null
          return
        }
        resizeEngine()
      })()
    })

    return () => {
      active = false
      cancelAnimationFrame(startFrame)
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
    engineRef.current?.refreshMapScene()
  }, [snapshot.gameplayDebugEnabled])

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

      if (!inTextField && (event.ctrlKey || event.metaKey)) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault()
          engineRef.current?.undo()
          return
        }
        if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault()
          engineRef.current?.redo()
          return
        }
        if (event.key === 'd') {
          event.preventDefault()
          engineRef.current?.duplicateSelectedObject()
          return
        }
      }

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

      if (snapshot.activeModuleId === 'terrain' && snapshot.terrainToolMode === 'polygon') {
        if (event.key === 'Escape' && engineRef.current?.isPolygonDrawingActive()) {
          event.preventDefault()
          engineRef.current.cancelActivePolygonDrawing()
          return
        }
        if (
          event.key === 'Enter' &&
          !inTextField &&
          snapshot.polygonDrawPointCount >= 3
        ) {
          event.preventDefault()
          engineRef.current?.finishActivePolygonDrawing()
          return
        }
        if (
          (event.key === 'Delete' || event.key === 'Backspace') &&
          !inTextField
        ) {
          event.preventDefault()
          if (
            snapshot.terrainPolygonTool === 'draw' &&
            engineRef.current?.isPolygonDrawingActive()
          ) {
            engineRef.current.removeLastPolygonPoint()
          } else {
            engineRef.current?.deleteSelectedTerrainPolygon()
          }
        }
        return
      }

      if (snapshot.activeModuleId === 'parcels') {
        if (event.key === 'Escape' && engineRef.current?.isPolygonDrawingActive()) {
          event.preventDefault()
          engineRef.current.cancelActivePolygonDrawing()
          return
        }
        if (
          event.key === 'Enter' &&
          !inTextField &&
          snapshot.polygonDrawPointCount >= 3
        ) {
          event.preventDefault()
          engineRef.current?.finishActivePolygonDrawing()
          return
        }
        if (
          (event.key === 'Delete' || event.key === 'Backspace') &&
          !inTextField
        ) {
          event.preventDefault()
          if (
            snapshot.parcelTool === 'draw' &&
            engineRef.current?.isPolygonDrawingActive()
          ) {
            engineRef.current.removeLastPolygonPoint()
          } else {
            engineRef.current?.deleteSelectedParcel()
          }
        }
        return
      }

      if (snapshot.activeModuleId === 'vegetation') {
        if (
          (event.key === 'Delete' || event.key === 'Backspace') &&
          !inTextField
        ) {
          event.preventDefault()
          engineRef.current?.deleteSelectedVegetation()
        }
        return
      }

      if (snapshot.activeModuleId === 'buildings') {
        if (
          (event.key === 'Delete' || event.key === 'Backspace') &&
          !inTextField
        ) {
          event.preventDefault()
          engineRef.current?.deleteSelectedGameplayObject()
        }
        return
      }

      if (snapshot.activeModuleId === 'vehicles') {
        if (
          (event.key === 'Delete' || event.key === 'Backspace') &&
          !inTextField
        ) {
          event.preventDefault()
          engineRef.current?.deleteSelectedGameplayObject()
        }
        return
      }

      if (snapshot.activeModuleId === 'water') {
        if (event.key === 'Escape' && snapshot.waterSplineDraft) {
          event.preventDefault()
          store?.cancelWaterSplineDraft()
          engineRef.current?.refreshMap()
          return
        }
        if (
          (event.key === 'Delete' || event.key === 'Backspace') &&
          !inTextField
        ) {
          event.preventDefault()
          engineRef.current?.deleteSelectedWater()
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
  }, [onSwitchToGame, snapshot.activeModuleId, snapshot.roadDraft, snapshot.roadSelection, snapshot.parcelTool, snapshot.terrainToolMode, snapshot.terrainPolygonTool, snapshot.polygonDrawPointCount, snapshot.waterSplineDraft, store])

  const refreshScene = () => {
    engineRef.current?.refreshMap()
  }

  const deleteSelected = () => {
    const engine = engineRef.current
    if (!engine) {
      return
    }
    if (!engine.deleteSelectedGameplayObject()) {
      engine.deleteSelectedObject()
    }
  }

  const duplicateSelected = () => {
    engineRef.current?.duplicateSelectedObject()
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
              <TerrainToolsPanel store={store} onSceneRefresh={refreshScene} />
              <RoadToolsPanel store={store} onSceneRefresh={refreshScene} />
              <ParcelToolsPanel store={store} onSceneRefresh={refreshScene} />
              <VegetationToolsPanel store={store} onSceneRefresh={refreshScene} />
              <BuildingToolsPanel store={store} onSceneRefresh={refreshScene} />
              <VehicleToolsPanel store={store} onSceneRefresh={refreshScene} />
              <WaterToolsPanel store={store} onSceneRefresh={refreshScene} />
              <ValidationToolsPanel store={store} onSceneRefresh={refreshScene} />
              <ExportToolsPanel store={store} />
            </>
          ) : null}
        </aside>

        <main ref={viewportRef} className="studio-workspace__viewport">
          <canvas ref={canvasRef} className="studio-shell__canvas" />
          <div className="studio-viewport-hint">
            Transform · Terrain · Roads · Parcels · Vegetation · Buildings · Vehicles · Water · Validation · Export · F10
          </div>
        </main>

        <aside className="studio-workspace__right">
          {store ? (
            <InspectorPanel
              store={store}
              onSceneRefresh={refreshScene}
              onDeleteSelected={deleteSelected}
              onDuplicateSelected={duplicateSelected}
            />
          ) : null}
        </aside>
      </div>

      {store ? <LogPanel store={store} /> : null}
    </div>
  )
}
