import type { TerrainBrushMode } from '@/studio/terrain/TerrainHeightmap.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { TerrainPolygonToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { TERRAIN_SURFACES } from '@/studio/terrain/TerrainSurfacePalette.ts'
import {
  TERRAIN_POLYGON_KIND,
} from '@/types/terrain-polygon.ts'

interface TerrainToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
  onFinishPolygon?: () => void
}

const PAINT_TOOLS: { id: TerrainBrushMode; label: string }[] = [
  { id: 'paint', label: 'Paint' },
]

const POLYGON_TOOLS: { id: TerrainPolygonToolMode; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'select', label: 'Select' },
  { id: 'edit', label: 'Edit' },
]

export function TerrainToolsPanel({ store, onSceneRefresh, onFinishPolygon }: TerrainToolsPanelProps) {
  const {
    terrainBrush,
    terrainToolMode,
    terrainPolygonTool,
    terrainBoundaryVisible,
    polygonDrawPointCount,
    activeModuleId,
    selectedObject,
  } = useStudioStore(store)

  if (activeModuleId !== 'terrain') {
    return null
  }

  const selectedTerrain =
    selectedObject?.kind === TERRAIN_POLYGON_KIND ? selectedObject : null

  return (
    <div className="studio-panel studio-panel--terrain">
      <h2 className="studio-panel__title">Terrain</h2>

      <h3 className="studio-panel__subtitle">Layers</h3>
      <p className="studio-hint">
        Terrain Surface is always visible. Terrain Boundary is editor wireframe only.
      </p>
      <label className="studio-field studio-field--wide">
        <span className="studio-field__label">Show terrain boundary</span>
        <input
          className="studio-input"
          type="checkbox"
          checked={terrainBoundaryVisible}
          onChange={(event) => {
            store.setTerrainBoundaryVisible(event.target.checked)
            onSceneRefresh()
          }}
        />
      </label>

      <h3 className="studio-panel__subtitle">Mode</h3>
      <div className="studio-tool-grid">
        <button
          type="button"
          className={`studio-btn studio-tool-grid__btn${
            terrainToolMode === 'paint' ? ' studio-tool-grid__btn--active' : ''
          }`}
          onClick={() => store.setTerrainToolMode('paint')}
        >
          Surface paint
        </button>
        <button
          type="button"
          className={`studio-btn studio-tool-grid__btn${
            terrainToolMode === 'polygon' ? ' studio-tool-grid__btn--active' : ''
          }`}
          onClick={() => store.setTerrainToolMode('polygon')}
        >
          Polygon
        </button>
      </div>

      {terrainToolMode === 'paint' ? (
        <>
          <p className="studio-hint">
            Click and drag on the ground to paint surface materials. This does not
            create polygons — switch to Polygon mode for terrain boundaries.
          </p>
          <h3 className="studio-panel__subtitle">Tool</h3>
          <div className="studio-tool-grid">
            {PAINT_TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`studio-btn studio-tool-grid__btn${
                  terrainBrush.mode === tool.id ? ' studio-tool-grid__btn--active' : ''
                }`}
                onClick={() => store.setTerrainBrush({ mode: tool.id })}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">
              Brush radius ({terrainBrush.radius.toFixed(1)} cells)
            </span>
            <input
              className="studio-input"
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={terrainBrush.radius}
              onChange={(event) => {
                store.setTerrainBrush({ radius: Number.parseFloat(event.target.value) })
              }}
            />
          </label>
          <h3 className="studio-panel__subtitle">Surface</h3>
          <div className="studio-surface-grid">
            {TERRAIN_SURFACES.map((surface) => (
              <button
                key={surface.id}
                type="button"
                className={`studio-surface-swatch${
                  terrainBrush.surfaceId === surface.id
                    ? ' studio-surface-swatch--active'
                    : ''
                }`}
                style={{
                  background: `rgb(${surface.color.map((c) => Math.round(c * 255)).join(',')})`,
                }}
                title={surface.name}
                onClick={() => store.setTerrainBrush({ surfaceId: surface.id })}
              >
                <span className="studio-surface-swatch__label">{surface.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="studio-hint">
            Draw terrain boundary polygons. Finish with Enter, double-click, first
            vertex, or Finish button — then edit vertices immediately.
          </p>
          <h3 className="studio-panel__subtitle">Tool</h3>
          <div className="studio-tool-grid">
            {POLYGON_TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`studio-btn studio-tool-grid__btn${
                  terrainPolygonTool === tool.id ? ' studio-tool-grid__btn--active' : ''
                }`}
                onClick={() => store.setTerrainPolygonTool(tool.id)}
              >
                {tool.label}
              </button>
            ))}
          </div>
          {terrainPolygonTool === 'draw' ? (
            <>
              {polygonDrawPointCount > 0 ? (
                <>
                  <p className="studio-hint">
                    Points: {polygonDrawPointCount}. Enter, double-click, or click the
                    first vertex to finish.
                  </p>
                  {polygonDrawPointCount >= 3 && onFinishPolygon ? (
                    <button
                      type="button"
                      className="studio-btn studio-btn--primary"
                      onClick={() => onFinishPolygon()}
                    >
                      Finish polygon
                    </button>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
          {selectedTerrain ? (
            <div className="studio-parcel-actions">
              <h3 className="studio-panel__subtitle">Selected boundary</h3>
              <button
                type="button"
                className="studio-btn"
                onClick={() => {
                  if (store.duplicateTerrainPolygon(selectedTerrain.id)) {
                    onSceneRefresh()
                  }
                }}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="studio-btn studio-btn--danger"
                onClick={() => {
                  if (store.deleteTerrainPolygon(selectedTerrain.id)) {
                    onSceneRefresh()
                  }
                }}
              >
                Delete boundary
              </button>
            </div>
          ) : terrainPolygonTool !== 'draw' ? (
            <p className="studio-hint">Click a terrain boundary in the scene to select.</p>
          ) : null}
        </>
      )}
    </div>
  )
}
