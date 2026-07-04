import type { FieldBlockId } from '@/config/map-01-layout.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { ParcelToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { PARCEL_BLOCK_IDS } from '@/types/parcel.ts'
import { parseFieldParcelProperties } from '@/types/parcel.ts'

interface ParcelToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
}

const TOOLS: { id: ParcelToolMode; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'select', label: 'Select' },
]

export function ParcelToolsPanel({ store, onSceneRefresh }: ParcelToolsPanelProps) {
  const {
    activeModuleId,
    parcelTool,
    parcelBlock,
    parcelFertility,
    parcelDraft,
    selectedObject,
  } = useStudioStore(store)

  if (activeModuleId !== 'parcels') {
    return null
  }

  const selectedField =
    selectedObject?.layer === 'fields' && selectedObject.kind === 'field'
      ? selectedObject
      : null
  const selectedProps = selectedField
    ? parseFieldParcelProperties(selectedField.properties)
    : null

  return (
    <div className="studio-panel studio-panel--parcels">
      <h2 className="studio-panel__title">Parcels</h2>
      <p className="studio-hint">
        V režimu Draw táhni obdélník po terénu. Min. velikost 4×4 m, bez
        překryvu s jinými poli.
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
            onClick={() => store.setParcelTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

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
                onClick={() => store.setParcelBlock(block as FieldBlockId)}
              >
                Block {block}
              </button>
            ))}
          </div>
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
          {parcelDraft?.cornerB ? (
            <p className="studio-hint">Drawing parcel… release to place.</p>
          ) : null}
        </>
      ) : null}

      {parcelTool === 'select' && selectedField ? (
        <div className="studio-parcel-actions">
          <h3 className="studio-panel__subtitle">Selected field</h3>
          <p className="studio-hint studio-kv__mono">{selectedField.id}</p>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Name</span>
            <input
              className="studio-input"
              type="text"
              value={selectedField.name ?? ''}
              onChange={(event) => {
                if (
                  store.updateFieldParcel(selectedField.id, {
                    name: event.target.value,
                  })
                ) {
                  onSceneRefresh()
                }
              }}
            />
          </label>
          <div className="studio-tool-grid">
            {PARCEL_BLOCK_IDS.map((block) => (
              <button
                key={block}
                type="button"
                className={`studio-btn studio-tool-grid__btn${
                  selectedProps?.parcelBlock === block
                    ? ' studio-tool-grid__btn--active'
                    : ''
                }`}
                onClick={() => {
                  if (
                    store.updateFieldParcel(selectedField.id, {
                      parcelBlock: block as FieldBlockId,
                    })
                  ) {
                    onSceneRefresh()
                  }
                }}
              >
                Block {block}
              </button>
            ))}
          </div>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Fertility</span>
            <input
              className="studio-input"
              type="number"
              min={0}
              max={100}
              step={1}
              value={selectedProps?.fertility ?? 75}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10)
                if (!Number.isFinite(parsed)) {
                  return
                }
                if (
                  store.updateFieldParcel(selectedField.id, {
                    fertility: parsed,
                  })
                ) {
                  onSceneRefresh()
                }
              }}
            />
          </label>
          <button
            type="button"
            className="studio-btn studio-btn--danger"
            onClick={() => {
              if (store.deleteField(selectedField.id)) {
                onSceneRefresh()
              }
            }}
          >
            Delete field
          </button>
        </div>
      ) : parcelTool === 'select' ? (
        <p className="studio-hint">Klikni na pole ve scéně pro výběr.</p>
      ) : null}
    </div>
  )
}
