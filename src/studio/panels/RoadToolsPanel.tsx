import type { RoadKind } from '@/types/road.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { RoadToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { ROAD_TYPES } from '@/studio/road/RoadTypePalette.ts'

interface RoadToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
}

const TOOLS: { id: RoadToolMode; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'select', label: 'Select' },
]

export function RoadToolsPanel({ store, onSceneRefresh }: RoadToolsPanelProps) {
  const { activeModuleId, roadTool, roadKind, roadDraft, roadSelection } =
    useStudioStore(store)

  if (activeModuleId !== 'roads') {
    return null
  }

  return (
    <div className="studio-panel studio-panel--roads">
      <h2 className="studio-panel__title">Roads</h2>
      <p className="studio-hint">
        Klikni na terén nebo na stávající cestu (napojení). Oranžový bod =
        spojení asfaltů, zelený = konec u kraje širší cesty.
      </p>

      <h3 className="studio-panel__subtitle">Tool</h3>
      <div className="studio-tool-grid">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`studio-btn studio-tool-grid__btn${
              roadTool === tool.id ? ' studio-tool-grid__btn--active' : ''
            }`}
            onClick={() => store.setRoadTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <h3 className="studio-panel__subtitle">Road type</h3>
      <div className="studio-road-type-list">
        {ROAD_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            className={`studio-road-type${
              roadKind === type.id ? ' studio-road-type--active' : ''
            }`}
            onClick={() => store.setRoadKind(type.id as RoadKind)}
          >
            <span
              className="studio-road-type__swatch"
              style={{
                background: `rgb(${type.color.map((c) => Math.round(c * 255)).join(',')})`,
              }}
            />
            <span className="studio-road-type__label">{type.label}</span>
            <span className="studio-road-type__width">{type.width} m</span>
          </button>
        ))}
      </div>

      {roadTool === 'draw' ? (
        <div className="studio-road-actions">
          <p className="studio-hint">
            Draft points: {roadDraft?.points.length ?? 0}
          </p>
          <button
            type="button"
            className="studio-btn studio-btn--primary"
            disabled={!roadDraft || roadDraft.points.length < 2}
            onClick={() => {
              if (store.commitRoadDraft()) {
                onSceneRefresh()
              }
            }}
          >
            Finish road
          </button>
          <button
            type="button"
            className="studio-btn"
            disabled={!roadDraft}
            onClick={() => {
              store.cancelRoadDraft()
              onSceneRefresh()
            }}
          >
            Cancel draft
          </button>
        </div>
      ) : null}

      {roadTool === 'select' && roadSelection ? (
        <div className="studio-road-actions">
          <p className="studio-hint">
            Selected point {roadSelection.pointIndex + 1} on {roadSelection.roadId}
          </p>
          <button
            type="button"
            className="studio-btn"
            onClick={() => {
              if (store.deleteRoad(roadSelection.roadId)) {
                onSceneRefresh()
              }
            }}
          >
            Delete road
          </button>
        </div>
      ) : null}
    </div>
  )
}
