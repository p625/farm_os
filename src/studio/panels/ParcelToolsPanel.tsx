import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { ParcelToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { PARCEL_BLOCK_IDS, PARCEL_TYPES } from '@/types/parcel.ts'

interface ParcelToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
  onFinishPolygon?: () => void
}

const TOOLS: { id: ParcelToolMode; label: string; hint: string }[] = [
  { id: 'draw', label: 'Draw', hint: 'Click to place vertices. Finish with Enter, double-click, first vertex, or Finish button.' },
  { id: 'select', label: 'Select', hint: 'Select parcel and drag to move.' },
  { id: 'edit', label: 'Edit', hint: 'Drag polygon vertices.' },
]

export function ParcelToolsPanel({ store, onSceneRefresh, onFinishPolygon }: ParcelToolsPanelProps) {
  const {
    activeModuleId,
    parcelTool,
    parcelBlock,
    parcelType,
    parcelFertility,
    polygonDrawPointCount,
    selectedObject,
  } = useStudioStore(store)

  if (activeModuleId !== 'parcels') {
    return null
  }

  const selectedField =
    selectedObject?.layer === 'fields' && selectedObject.kind === 'field'
      ? selectedObject
      : null

  return (
    <div className="studio-panel studio-panel--parcels">
      <h2 className="studio-panel__title">Parcel Tool</h2>
      <p className="studio-hint">
        Kresli polygon klikáním bodů. Min. 3 body, bez samoprůsečnosti, uvnitř
        mapy.
      </p>

      <h3 className="studio-panel__subtitle">Tool</h3>
      <div className="studio-tool-grid">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`studio-btn studio-tool-grid__btn${
              parcelTool === tool.id ? ' studio-tool-grid__btn--active' : ''
            }`}
            title={tool.hint}
            onClick={() => store.setParcelTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>
      <p className="studio-hint">
        {TOOLS.find((tool) => tool.id === parcelTool)?.hint}
      </p>

      {parcelTool === 'draw' ? (
        <>
          <h3 className="studio-panel__subtitle">New parcel</h3>
          <div className="studio-tool-grid">
            {PARCEL_BLOCK_IDS.map((block) => (
              <button
                key={block}
                type="button"
                className={`studio-btn studio-tool-grid__btn${
                  parcelBlock === block ? ' studio-tool-grid__btn--active' : ''
                }`}
                onClick={() => store.setParcelBlock(block)}
              >
                Block {block}
              </button>
            ))}
          </div>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Parcel type</span>
            <select
              className="studio-input"
              value={parcelType}
              onChange={(event) => {
                store.setParcelType(
                  event.target.value as (typeof PARCEL_TYPES)[number],
                )
              }}
            >
              {PARCEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Fertility</span>
            <input
              className="studio-input"
              type="number"
              min={0}
              max={100}
              step={1}
              value={parcelFertility}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10)
                if (Number.isFinite(parsed)) {
                  store.setParcelFertility(parsed)
                }
              }}
            />
          </label>
          {polygonDrawPointCount > 0 ? (
            <>
              <p className="studio-hint">
                Points: {polygonDrawPointCount}. Enter, double-click, or click the first
                vertex to finish. Escape cancels.
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

      {selectedField ? (
        <div className="studio-parcel-actions">
          <h3 className="studio-panel__subtitle">Selected parcel</h3>
          <p className="studio-hint">
            Field State, crop presets and metadata are in the Inspector panel.
          </p>
          <button
            type="button"
            className="studio-btn"
            onClick={() => {
              if (store.duplicateField(selectedField.id)) {
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
              if (store.deleteField(selectedField.id)) {
                onSceneRefresh()
              }
            }}
          >
            Delete parcel
          </button>
        </div>
      ) : parcelTool !== 'draw' ? (
        <p className="studio-hint">Klikni na parcelu ve scéně pro výběr.</p>
      ) : null}
    </div>
  )
}
