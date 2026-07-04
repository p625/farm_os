import type { TerrainBrushMode } from '@/studio/terrain/TerrainHeightmap.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { TERRAIN_SURFACES } from '@/studio/terrain/TerrainSurfacePalette.ts'

interface TerrainToolsPanelProps {
  store: StudioStore
}

const ACTIVE_TOOLS: { id: TerrainBrushMode; label: string }[] = [
  { id: 'paint', label: 'Paint' },
]

export function TerrainToolsPanel({ store }: TerrainToolsPanelProps) {
  const { terrainBrush, activeModuleId } = useStudioStore(store)

  if (activeModuleId !== 'terrain') {
    return null
  }

  return (
    <div className="studio-panel studio-panel--terrain">
      <h2 className="studio-panel__title">Terrain</h2>
      <p className="studio-hint">
        Paint surfaces on the ground plane. Raise / lower sculpting comes later.
      </p>

      <h3 className="studio-panel__subtitle">Tool</h3>
      <div className="studio-tool-grid">
        {ACTIVE_TOOLS.map((tool) => (
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
    </div>
  )
}
