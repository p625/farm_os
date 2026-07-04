import type { MapObject } from '@/types/world-map.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { parseFieldParcelProperties } from '@/types/parcel.ts'
import { STUDIO_CROP_OPTIONS } from '@/studio/catalog/StudioPlacementCatalog.ts'
import {
  DEFAULT_FIELD_TEST_STATE,
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
import {
  OWNERSHIP_STAGES,
  PARCEL_TYPES,
} from '@/types/parcel.ts'

interface FieldStateInspectorProps {
  store: StudioStore
  field: MapObject
  onSceneRefresh: () => void
}

export function FieldStateInspector({
  store,
  field,
  onSceneRefresh,
}: FieldStateInspectorProps) {
  const props = parseFieldParcelProperties(field.properties)
  if (!props) {
    return null
  }
  const fieldState = props.fieldTestState ?? DEFAULT_FIELD_TEST_STATE

  const updateFieldState = (patch: Partial<FieldTestState>) => {
    const next: FieldTestState = { ...fieldState, ...patch }
    if (!next.cropEnabled) {
      next.cropId = null
    } else if (!next.cropId) {
      next.cropId = 'wheat'
    }
    if (store.updateFieldParcel(field.id, { fieldTestState: next })) {
      onSceneRefresh()
    }
  }

  return (
    <div className="studio-field-state">
      <h3 className="studio-panel__subtitle">Field State</h3>
      <p className="studio-hint studio-kv__mono">
        {props.parcelId ?? '—'} · block {props.parcelBlock} · {props.parcelType ?? 'arable'}
      </p>

      <label className="studio-field studio-field--wide">
        <span className="studio-field__label">Parcel ID</span>
        <input
          className="studio-input"
          type="text"
          value={props.parcelId ?? ''}
          onChange={(event) => {
            if (
              store.updateFieldParcel(field.id, {
                parcelId: event.target.value.trim(),
              })
            ) {
              onSceneRefresh()
            }
          }}
        />
      </label>

      <label className="studio-field studio-field--wide">
        <span className="studio-field__label">Parcel type</span>
        <select
          className="studio-input"
          value={props.parcelType ?? 'arable'}
          onChange={(event) => {
            if (
              store.updateFieldParcel(field.id, {
                parcelType: event.target.value as (typeof PARCEL_TYPES)[number],
              })
            ) {
              onSceneRefresh()
            }
          }}
        >
          {PARCEL_TYPES.map((parcelType) => (
            <option key={parcelType} value={parcelType}>
              {parcelType}
            </option>
          ))}
        </select>
      </label>

      <label className="studio-field studio-field--wide">
        <span className="studio-field__label">Ownership stage</span>
        <select
          className="studio-input"
          value={props.ownershipStage ?? 'start'}
          onChange={(event) => {
            if (
              store.updateFieldParcel(field.id, {
                ownershipStage: event.target.value as (typeof OWNERSHIP_STAGES)[number],
              })
            ) {
              onSceneRefresh()
            }
          }}
        >
          {OWNERSHIP_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>

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
    </div>
  )
}
