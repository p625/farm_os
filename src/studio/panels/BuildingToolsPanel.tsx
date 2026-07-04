import type { BuildingCategory } from '@/types/building.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { BuildingToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import {
  getBuildingTypesByCategory,
  type BuildingTypeDefinition,
} from '@/studio/building/BuildingTypePalette.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import { SCENE_ANCHOR_KINDS } from '@/types/scene-anchor.ts'
import { parseSceneAnchorProperties } from '@/types/scene-anchor.ts'

interface BuildingToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
}

const TOOLS: { id: BuildingToolMode; label: string }[] = [
  { id: 'place', label: 'Place' },
  { id: 'select', label: 'Select' },
  { id: 'anchors', label: 'Anchors' },
]

const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  house: 'Rodinné domy',
  civic: 'Občanská vybavenost',
  commercial: 'Obchody a služby',
  farm: 'Hospodářské stavby',
}

function sizeLabel(type: BuildingTypeDefinition): string {
  const total = type.wallHeight + type.roofHeight
  return `${type.width}×${type.depth} m · ${total.toFixed(1)} m`
}

function BuildingTypeButton({
  type,
  active,
  onSelect,
}: {
  type: BuildingTypeDefinition
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`studio-vegetation-type${
        active ? ' studio-vegetation-type--active' : ''
      }`}
      onClick={onSelect}
      title={sizeLabel(type)}
    >
      <span
        className="studio-vegetation-type__swatch"
        style={{
          background: `rgb(${type.wallColor.map((c) => Math.round(c * 255)).join(',')})`,
        }}
      />
      <span className="studio-vegetation-type__label">{type.label}</span>
      <span className="studio-vegetation-type__meta">{sizeLabel(type)}</span>
    </button>
  )
}

export function BuildingToolsPanel({
  store,
  onSceneRefresh,
}: BuildingToolsPanelProps) {
  const {
    activeModuleId,
    buildingTool,
    buildingType,
    buildingRotationY,
    buildingSnapRotation,
    anchorKind,
    selectedObject,
  } = useStudioStore(store)

  if (activeModuleId !== 'buildings') {
    return null
  }

  const selectedBuilding =
    selectedObject?.layer === 'buildings' ? selectedObject : null
  const selectedProps = selectedBuilding
    ? parseBuildingProperties(selectedBuilding.properties)
    : null
  const buildingAnchors = selectedBuilding
    ? store.listAnchorsForParent(selectedBuilding.id)
    : []
  const selectedAnchor =
    selectedObject?.layer === 'poi' && selectedObject.kind === 'anchor'
      ? selectedObject
      : null
  const anchorProps = selectedAnchor
    ? parseSceneAnchorProperties(selectedAnchor.properties)
    : null

  const categories: BuildingCategory[] = [
    'house',
    'civic',
    'commercial',
    'farm',
  ]

  return (
    <div className="studio-panel studio-panel--buildings">
      <h2 className="studio-panel__title">Buildings</h2>
      <p className="studio-hint">
        Středoevropská vesnice a okolí farmy. Place vytvoří budovu s výchozími
        Entry / Service / Loading kotvami (Scene Anchors).
      </p>

      <h3 className="studio-panel__subtitle">Tool</h3>
      <div className="studio-tool-grid">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`studio-btn studio-tool-grid__btn${
              buildingTool === tool.id ? ' studio-tool-grid__btn--active' : ''
            }`}
            onClick={() => store.setBuildingTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {buildingTool === 'place' ? (
        <>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Rotace Y (nové stavby)</span>
            <input
              className="studio-input"
              type="number"
              step="0.1"
              value={buildingRotationY}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                if (Number.isFinite(parsed)) {
                  store.setBuildingRotationY(parsed)
                }
              }}
            />
          </label>
          <label className="studio-field studio-field--wide studio-field--checkbox">
            <input
              type="checkbox"
              checked={buildingSnapRotation}
              onChange={(event) => {
                store.setBuildingSnapRotation(event.target.checked)
              }}
            />
            <span className="studio-field__label">Snap na 90° (ulice / parcely)</span>
          </label>
          {categories.map((category) => (
            <div key={category}>
              <h3 className="studio-panel__subtitle">{CATEGORY_LABELS[category]}</h3>
              <div className="studio-vegetation-type-list">
                {getBuildingTypesByCategory(category).map((type) => (
                  <BuildingTypeButton
                    key={type.id}
                    type={type}
                    active={buildingType === type.id}
                    onSelect={() =>
                      store.setBuildingType(type.id as BuildingTypeId)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      ) : null}

      {buildingTool === 'anchors' ? (
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
            Vyber budovu v Select, pak klikni na terén pro novou kotvu.
          </p>
        </>
      ) : null}

      {buildingTool === 'select' && selectedBuilding && selectedProps ? (
        <div className="studio-vegetation-actions">
          <h3 className="studio-panel__subtitle">Selected</h3>
          <p className="studio-hint studio-kv__mono">{selectedBuilding.id}</p>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Name</span>
            <input
              className="studio-input"
              type="text"
              value={selectedBuilding.name ?? ''}
              onChange={(event) => {
                if (
                  store.updateBuilding(selectedBuilding.id, {
                    name: event.target.value,
                  })
                ) {
                  onSceneRefresh()
                }
              }}
            />
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Rotation Y</span>
            <input
              className="studio-input"
              type="number"
              step="0.1"
              value={selectedBuilding.transform.rotationY ?? 0}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                if (!Number.isFinite(parsed)) {
                  return
                }
                if (
                  store.updateBuilding(selectedBuilding.id, {
                    rotationY: parsed,
                  })
                ) {
                  onSceneRefresh()
                }
              }}
            />
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Owner</span>
            <input
              className="studio-input"
              type="text"
              value={selectedProps.owner ?? 'farm'}
              onChange={(event) => {
                if (
                  store.updateBuilding(selectedBuilding.id, {
                    owner: event.target.value,
                  })
                ) {
                  onSceneRefresh()
                }
              }}
            />
          </label>
          <label className="studio-field studio-field--wide studio-field--checkbox">
            <input
              type="checkbox"
              checked={selectedProps.active !== false}
              onChange={(event) => {
                if (
                  store.updateBuilding(selectedBuilding.id, {
                    active: event.target.checked,
                  })
                ) {
                  onSceneRefresh()
                }
              }}
            />
            <span className="studio-field__label">Active</span>
          </label>
          <p className="studio-hint">Anchors: {buildingAnchors.length}</p>
          <p className="studio-hint">Typ: {selectedProps.buildingType}</p>
          <div className="studio-vegetation-type-list">
            {categories.flatMap((category) =>
              getBuildingTypesByCategory(category).map((type) => (
                <BuildingTypeButton
                  key={type.id}
                  type={type}
                  active={selectedProps.buildingType === type.id}
                  onSelect={() => {
                    if (
                      store.updateBuilding(selectedBuilding.id, {
                        buildingType: type.id as BuildingTypeId,
                      })
                    ) {
                      onSceneRefresh()
                    }
                  }}
                />
              )),
            )}
          </div>
          <button
            type="button"
            className="studio-btn studio-btn--danger"
            onClick={() => {
              if (store.deleteBuilding(selectedBuilding.id)) {
                onSceneRefresh()
              }
            }}
          >
            Delete
          </button>
        </div>
      ) : buildingTool === 'select' && selectedBuilding ? (
        <div className="studio-vegetation-actions">
          <p className="studio-hint">
            Legacy building „{selectedBuilding.name ?? selectedBuilding.id}“ —
            bez buildingType. Smaž v Transform modulu nebo nech jako je.
          </p>
          <button
            type="button"
            className="studio-btn studio-btn--danger"
            onClick={() => {
              if (store.deleteBuilding(selectedBuilding.id)) {
                onSceneRefresh()
              }
            }}
          >
            Delete
          </button>
        </div>
      ) : buildingTool === 'select' ? (
        <p className="studio-hint">Klikni na budovu ve scéně.</p>
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
