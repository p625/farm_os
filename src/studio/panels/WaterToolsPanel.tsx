import type { WaterTypeId } from '@/types/water.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { WaterToolMode } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import {
  getWaterTypeDefinition,
  WATER_TYPES,
  type WaterTypeDefinition,
} from '@/studio/water/WaterTypePalette.ts'
import { parseWaterProperties } from '@/types/water.ts'
import { isSplineWaterType } from '@/studio/water/WaterTypePalette.ts'

interface WaterToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
}

const TOOLS: { id: WaterToolMode; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'select', label: 'Select' },
]

function WaterTypeButton({
  type,
  active,
  onSelect,
}: {
  type: WaterTypeDefinition
  active: boolean
  onSelect: () => void
}) {
  const meta =
    type.placementKind === 'spline'
      ? `šířka ${type.width} m · klik body`
      : `elipsa · táhni obdélník`
  return (
    <button
      type="button"
      className={`studio-vegetation-type${
        active ? ' studio-vegetation-type--active' : ''
      }`}
      onClick={onSelect}
      title={meta}
    >
      <span
        className="studio-vegetation-type__swatch"
        style={{
          background: `rgb(${type.color.map((c) => Math.round(c * 255)).join(',')})`,
        }}
      />
      <span className="studio-vegetation-type__label">{type.label}</span>
      <span className="studio-vegetation-type__meta">{meta}</span>
    </button>
  )
}

export function WaterToolsPanel({ store, onSceneRefresh }: WaterToolsPanelProps) {
  const {
    activeModuleId,
    waterTool,
    waterType,
    waterSplineDraft,
    waterAreaDraft,
    selectedObject,
  } = useStudioStore(store)

  if (activeModuleId !== 'water') {
    return null
  }

  const splineTypes = WATER_TYPES.filter((t) => t.placementKind === 'spline')
  const areaTypes = WATER_TYPES.filter((t) => t.placementKind === 'area')
  const activeDefinition = getWaterTypeDefinition(waterType)
  const selectedWater =
    selectedObject?.layer === 'water' ? selectedObject : null
  const selectedProps = selectedWater
    ? parseWaterProperties(selectedWater.properties)
    : null

  return (
    <div className="studio-panel studio-panel--water">
      <h2 className="studio-panel__title">Water</h2>
      <p className="studio-hint">
        Řeka a potok: klikání bodů křivky, Finish. Tůně a rybníky: táhni elipsu
        po terénu.
      </p>

      <h3 className="studio-panel__subtitle">Tool</h3>
      <div className="studio-tool-grid">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`studio-btn studio-tool-grid__btn${
              waterTool === tool.id ? ' studio-tool-grid__btn--active' : ''
            }`}
            onClick={() => store.setWaterTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {waterTool === 'draw' ? (
        <>
          <h3 className="studio-panel__subtitle">Toky (spline)</h3>
          <div className="studio-vegetation-type-list">
            {splineTypes.map((type) => (
              <WaterTypeButton
                key={type.id}
                type={type}
                active={waterType === type.id}
                onSelect={() => store.setWaterType(type.id as WaterTypeId)}
              />
            ))}
          </div>

          <h3 className="studio-panel__subtitle">Nádrže (plocha)</h3>
          <div className="studio-vegetation-type-list">
            {areaTypes.map((type) => (
              <WaterTypeButton
                key={type.id}
                type={type}
                active={waterType === type.id}
                onSelect={() => store.setWaterType(type.id as WaterTypeId)}
              />
            ))}
          </div>

          {isSplineWaterType(waterType) ? (
            <div className="studio-road-actions">
              <p className="studio-hint">
                Draft points: {waterSplineDraft?.points.length ?? 0}
              </p>
              <button
                type="button"
                className="studio-btn studio-btn--primary"
                disabled={!waterSplineDraft || waterSplineDraft.points.length < 2}
                onClick={() => {
                  if (store.commitWaterSplineDraft()) {
                    onSceneRefresh()
                  }
                }}
              >
                Finish watercourse
              </button>
              <button
                type="button"
                className="studio-btn"
                disabled={!waterSplineDraft}
                onClick={() => {
                  store.cancelWaterSplineDraft()
                  onSceneRefresh()
                }}
              >
                Cancel draft
              </button>
            </div>
          ) : (
            <p className="studio-hint">
              Aktivní: <strong>{activeDefinition.label}</strong> — táhni po
              terénu pro velikost elipsy.
            </p>
          )}
        </>
      ) : null}

      {waterTool === 'select' && selectedWater ? (
        <div className="studio-vegetation-actions">
          <h3 className="studio-panel__subtitle">Selected</h3>
          <p className="studio-hint studio-kv__mono">{selectedWater.id}</p>
          <p className="studio-hint">
            {selectedWater.name ?? 'Water'} ·{' '}
            {selectedProps?.placementKind === 'spline'
              ? `${selectedProps.points.length} points`
              : selectedProps?.placementKind === 'area'
                ? `${selectedProps.radiusX.toFixed(1)}×${selectedProps.radiusZ.toFixed(1)} m`
                : '—'}
          </p>
          <button
            type="button"
            className="studio-btn studio-btn--danger"
            onClick={() => {
              if (store.deleteWater(selectedWater.id)) {
                onSceneRefresh()
              }
            }}
          >
            Delete
          </button>
        </div>
      ) : waterTool === 'select' ? (
        <p className="studio-hint">Klikni na vodní plochu ve scéně.</p>
      ) : null}

      {waterAreaDraft?.cornerB ? (
        <p className="studio-hint">Kreslíš nádrž… pusť tlačítko pro umístění.</p>
      ) : null}
    </div>
  )
}
