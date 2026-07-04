import type { VegetationTypeId } from '@/types/vegetation.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { VegetationToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import {
  getVegetationTypeDefinition,
  getVegetationTypesByKind,
  type VegetationTypeDefinition,
} from '@/studio/vegetation/VegetationTypePalette.ts'
import { parseVegetationProperties } from '@/types/vegetation.ts'

interface VegetationToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
}

const TOOLS: { id: VegetationToolMode; label: string }[] = [
  { id: 'place', label: 'Place' },
  { id: 'paint', label: 'Paint' },
  { id: 'select', label: 'Select' },
]

function typeMetaLabel(type: VegetationTypeDefinition): string {
  if (type.kind === 'grass') {
    return `${type.height} m · záplat ${type.canopyWidth} m`
  }
  return `${type.height} m · koruna ${type.canopyWidth} m`
}

function VegetationTypeButton({
  type,
  active,
  onSelect,
}: {
  type: VegetationTypeDefinition
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
      title={`${typeMetaLabel(type)} · paint ${type.paintSpacing} m`}
    >
      <span
        className="studio-vegetation-type__swatch"
        style={{
          background: `rgb(${type.foliageColor.map((c) => Math.round(c * 255)).join(',')})`,
        }}
      />
      <span className="studio-vegetation-type__label">{type.label}</span>
      <span className="studio-vegetation-type__meta">{typeMetaLabel(type)}</span>
    </button>
  )
}

export function VegetationToolsPanel({
  store,
  onSceneRefresh,
}: VegetationToolsPanelProps) {
  const {
    activeModuleId,
    vegetationTool,
    vegetationType,
    vegetationRandomRotation,
    selectedObject,
  } = useStudioStore(store)

  if (activeModuleId !== 'vegetation') {
    return null
  }

  const shrubs = getVegetationTypesByKind('shrub')
  const trees = getVegetationTypesByKind('tree')
  const grasses = getVegetationTypesByKind('grass')
  const activeType = getVegetationTypeDefinition(vegetationType)
  const selectedVegetation =
    selectedObject?.layer === 'vegetation' ? selectedObject : null
  const selectedProps = selectedVegetation
    ? parseVegetationProperties(selectedVegetation.properties)
    : null

  const renderTypeGroup = (
    title: string,
    types: readonly VegetationTypeDefinition[],
  ) => (
    <>
      <h3 className="studio-panel__subtitle">{title}</h3>
      <div className="studio-vegetation-type-list">
        {types.map((type) => (
          <VegetationTypeButton
            key={type.id}
            type={type}
            active={vegetationType === type.id}
            onSelect={() => store.setVegetationType(type.id as VegetationTypeId)}
          />
        ))}
      </div>
    </>
  )

  const placementTools = vegetationTool === 'place' || vegetationTool === 'paint'

  return (
    <div className="studio-panel studio-panel--vegetation">
      <h2 className="studio-panel__title">Vegetation</h2>
      <p className="studio-hint">
        Place = jeden kus. Paint = táhni štětec po terénu (stromy, keře, tráva).
        Rozestup štětce závisí na typu.
      </p>

      <h3 className="studio-panel__subtitle">Tool</h3>
      <div className="studio-tool-grid">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`studio-btn studio-tool-grid__btn${
              vegetationTool === tool.id ? ' studio-tool-grid__btn--active' : ''
            }`}
            onClick={() => store.setVegetationTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {placementTools ? (
        <>
          <p className="studio-hint">
            Rozestup paint: <strong>{activeType.paintSpacing} m</strong> (
            {activeType.label})
          </p>
          <label className="studio-field studio-field--wide studio-field--checkbox">
            <input
              type="checkbox"
              checked={vegetationRandomRotation}
              onChange={(event) => {
                store.setVegetationRandomRotation(event.target.checked)
              }}
            />
            <span className="studio-field__label">Náhodná rotace při umístění</span>
          </label>
          {renderTypeGroup('Tráva', grasses)}
          {renderTypeGroup('Keře', shrubs)}
          {renderTypeGroup('Stromy', trees)}
        </>
      ) : null}

      {vegetationTool === 'select' && selectedVegetation ? (
        <div className="studio-vegetation-actions">
          <h3 className="studio-panel__subtitle">Selected</h3>
          <p className="studio-hint studio-kv__mono">{selectedVegetation.id}</p>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Name</span>
            <input
              className="studio-input"
              type="text"
              value={selectedVegetation.name ?? ''}
              onChange={(event) => {
                if (
                  store.updateVegetation(selectedVegetation.id, {
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
              value={selectedVegetation.transform.rotationY ?? 0}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                if (!Number.isFinite(parsed)) {
                  return
                }
                if (
                  store.updateVegetation(selectedVegetation.id, {
                    rotationY: parsed,
                  })
                ) {
                  onSceneRefresh()
                }
              }}
            />
          </label>
          <p className="studio-hint">
            Typ: {selectedProps?.vegetationType ?? '—'} · výška{' '}
            {selectedProps?.heightClass ?? '—'} · šířka{' '}
            {selectedProps?.spreadClass ?? '—'}
          </p>
          <div className="studio-vegetation-type-list">
            {[...grasses, ...shrubs, ...trees].map((type) => (
              <VegetationTypeButton
                key={type.id}
                type={type}
                active={selectedProps?.vegetationType === type.id}
                onSelect={() => {
                  if (
                    store.updateVegetation(selectedVegetation.id, {
                      vegetationType: type.id as VegetationTypeId,
                    })
                  ) {
                    onSceneRefresh()
                  }
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="studio-btn studio-btn--danger"
            onClick={() => {
              if (store.deleteVegetation(selectedVegetation.id)) {
                onSceneRefresh()
              }
            }}
          >
            Delete
          </button>
        </div>
      ) : vegetationTool === 'select' ? (
        <p className="studio-hint">Klikni na vegetaci ve scéně.</p>
      ) : null}
    </div>
  )
}
