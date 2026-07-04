import type { FieldBlockId } from '@/config/map-01-layout.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { ParcelToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { STUDIO_CROP_OPTIONS } from '@/studio/catalog/StudioPlacementCatalog.ts'
import { PARCEL_BLOCK_IDS } from '@/types/parcel.ts'
import { parseFieldParcelProperties } from '@/types/parcel.ts'
import {
  FIELD_TEST_PRESETS,
  FIELD_WORK_STATES,
  STUDIO_GROWTH_STAGES,
  STUDIO_SOIL_STATES,
  applyGrowthStage,
  applySoilState,
  growthStageFromTestState,
  soilStateFromTestState,
  type FieldTestState,
  FieldWorkState,
} from '@/types/field-test-state.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'

interface ParcelToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
}

const TOOLS: { id: ParcelToolMode; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'select', label: 'Select' },
]

function refreshFieldVisual(
  store: StudioStore,
  field: { id: string },
  onSceneRefresh: () => void,
): void {
  onSceneRefresh()
  const selected = store.getSnapshot().selectedObject
  if (selected?.id === field.id) {
    store.selectObject(selected)
  }
}

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
  const fieldState = selectedProps?.fieldTestState

  const updateFieldState = (patch: Partial<FieldTestState>) => {
    if (!selectedField || !fieldState) {
      return
    }
    const next: FieldTestState = { ...fieldState, ...patch }
    if (!next.cropEnabled) {
      next.cropId = null
    } else if (!next.cropId) {
      next.cropId = 'wheat'
    }
    if (
      store.updateFieldParcel(selectedField.id, { fieldTestState: next })
    ) {
      refreshFieldVisual(store, selectedField, onSceneRefresh)
    }
  }

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

      {parcelTool === 'select' && selectedField && fieldState ? (
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

          <h3 className="studio-panel__subtitle">Field State</h3>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">
              <input
                type="checkbox"
                checked={fieldState.cropEnabled}
                onChange={(event) =>
                  updateFieldState({ cropEnabled: event.target.checked })
                }
              />{' '}
              Crop enabled
            </span>
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Crop type</span>
            <select
              className="studio-input"
              value={fieldState.cropId ?? ''}
              disabled={!fieldState.cropEnabled}
              onChange={(event) =>
                updateFieldState({
                  cropId: event.target.value || null,
                })
              }
            >
              {STUDIO_CROP_OPTIONS.map((crop) => (
                <option key={crop.id || 'none'} value={crop.id}>
                  {crop.label}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Growth stage</span>
            <select
              className="studio-input"
              value={growthStageFromTestState(fieldState)}
              onChange={(event) => {
                const applied = applyGrowthStage(
                  event.target.value as (typeof STUDIO_GROWTH_STAGES)[number],
                  fieldState.cropId,
                )
                updateFieldState({
                  ...applied,
                  workState:
                    applied.lifecycleState === States.Harvestable
                      ? FieldWorkState.ReadyToHarvest
                      : fieldState.workState,
                })
              }}
            >
              {STUDIO_GROWTH_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Soil state</span>
            <select
              className="studio-input"
              value={soilStateFromTestState(fieldState)}
              onChange={(event) =>
                updateFieldState({
                  lifecycleState: applySoilState(
                    event.target.value as (typeof STUDIO_SOIL_STATES)[number],
                  ),
                })
              }
            >
              {STUDIO_SOIL_STATES.map((soil) => (
                <option key={soil} value={soil}>
                  {soil}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Work state</span>
            <select
              className="studio-input"
              value={fieldState.workState}
              onChange={(event) =>
                updateFieldState({
                  workState: event.target.value as FieldTestState['workState'],
                })
              }
            >
              {FIELD_WORK_STATES.map((workState) => (
                <option key={workState} value={workState}>
                  {workState}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Apply preset</span>
            <select
              className="studio-input"
              defaultValue=""
              onChange={(event) => {
                const preset = FIELD_TEST_PRESETS.find(
                  (entry) => entry.id === event.target.value,
                )
                if (preset) {
                  updateFieldState(preset.state)
                }
                event.currentTarget.value = ''
              }}
            >
              <option value="">Choose preset…</option>
              {FIELD_TEST_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
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
