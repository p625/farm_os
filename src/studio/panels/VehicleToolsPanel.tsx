import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { VehicleToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { VEHICLE_TYPES } from '@/studio/vehicle/VehicleTypePalette.ts'
import type { VehiclePlacementTypeId } from '@/types/vehicle-placement.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import { SCENE_ANCHOR_KINDS } from '@/types/scene-anchor.ts'
import { parseSceneAnchorProperties } from '@/types/scene-anchor.ts'

interface VehicleToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
}

const TOOLS: { id: VehicleToolMode; label: string }[] = [
  { id: 'place', label: 'Place' },
  { id: 'select', label: 'Select' },
  { id: 'anchors', label: 'Anchors' },
]

export function VehicleToolsPanel({ store, onSceneRefresh }: VehicleToolsPanelProps) {
  const {
    activeModuleId,
    vehicleTool,
    vehicleType,
    vehicleRotationY,
    anchorKind,
    selectedObject,
  } = useStudioStore(store)

  if (activeModuleId !== 'vehicles') {
    return null
  }

  const selectedVehicle =
    selectedObject?.layer === 'vehicles' ? selectedObject : null
  const selectedProps = selectedVehicle
    ? parseVehiclePlacementProperties(selectedVehicle.properties)
    : null
  const selectedAnchor =
    selectedObject?.layer === 'poi' && selectedObject.kind === 'anchor'
      ? selectedObject
      : null
  const anchorProps = selectedAnchor
    ? parseSceneAnchorProperties(selectedAnchor.properties)
    : null

  const parentAnchors = selectedVehicle
    ? store.listAnchorsForParent(selectedVehicle.id)
    : []

  return (
    <div className="studio-panel studio-panel--vehicles">
      <h2 className="studio-panel__title">Vehicles</h2>
      <p className="studio-hint">
        Umístění strojů a přívěsů s parkovacími a spawn kotvami. Place vytvoří
        výchozí Parking + Spawn anchor.
      </p>

      <h3 className="studio-panel__subtitle">Tool</h3>
      <div className="studio-tool-grid">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`studio-btn studio-tool-grid__btn${
              vehicleTool === tool.id ? ' studio-tool-grid__btn--active' : ''
            }`}
            onClick={() => store.setVehicleTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {vehicleTool === 'place' ? (
        <>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Rotace Y</span>
            <input
              className="studio-input"
              type="number"
              step="0.1"
              value={vehicleRotationY}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                if (Number.isFinite(parsed)) {
                  store.setVehicleRotationY(parsed)
                }
              }}
            />
          </label>
          <div className="studio-vegetation-type-list">
            {VEHICLE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                className={`studio-vegetation-type${
                  vehicleType === type.id ? ' studio-vegetation-type--active' : ''
                }`}
                onClick={() => store.setVehicleType(type.id as VehiclePlacementTypeId)}
              >
                <span className="studio-vegetation-type__label">{type.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {vehicleTool === 'anchors' ? (
        <>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Anchor kind</span>
            <select
              className="studio-input"
              value={anchorKind}
              onChange={(event) =>
                store.setAnchorKind(event.target.value as (typeof SCENE_ANCHOR_KINDS)[number])
              }
            >
              {SCENE_ANCHOR_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>
          <p className="studio-hint">
            Vyber vozidlo (Select), pak klikni na terén pro novou kotvu.
          </p>
        </>
      ) : null}

      {selectedVehicle && selectedProps ? (
        <div className="studio-vegetation-actions">
          <h3 className="studio-panel__subtitle">Selected vehicle</h3>
          <p className="studio-hint studio-kv__mono">{selectedVehicle.id}</p>
          <p className="studio-hint">Typ: {selectedProps.vehicleType}</p>
          <p className="studio-hint">Anchors: {parentAnchors.length}</p>
          <button
            type="button"
            className="studio-btn studio-btn--danger"
            onClick={() => {
              if (store.deleteVehicle(selectedVehicle.id)) {
                onSceneRefresh()
              }
            }}
          >
            Delete
          </button>
        </div>
      ) : null}

      {selectedAnchor && anchorProps ? (
        <div className="studio-vegetation-actions">
          <h3 className="studio-panel__subtitle">Selected anchor</h3>
          <p className="studio-hint">{anchorProps.label}</p>
          <button
            type="button"
            className="studio-btn studio-btn--danger"
            onClick={() => {
              if (store.deleteAnchor(selectedAnchor.id)) {
                onSceneRefresh()
              }
            }}
          >
            Delete anchor
          </button>
        </div>
      ) : null}
    </div>
  )
}
