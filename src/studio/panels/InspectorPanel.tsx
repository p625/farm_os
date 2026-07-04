import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import { parseSceneAnchorProperties } from '@/types/scene-anchor.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import {
  isGameplayParentObject,
  isSceneAnchorObject,
} from '@/studio/anchor/studioAnchorSync.ts'
import { FieldStateInspector } from '@/studio/panels/FieldStateInspector.tsx'
import { PolygonShapeInspector } from '@/studio/panels/PolygonShapeInspector.tsx'
import { TerrainBoundaryInspector } from '@/studio/panels/TerrainBoundaryInspector.tsx'
import { TerrainSurfaceInspector } from '@/studio/panels/TerrainSurfaceInspector.tsx'
import { isMapPolygonShape } from '@/types/world-map.ts'
import { TERRAIN_POLYGON_KIND } from '@/types/terrain-polygon.ts'

interface InspectorPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
  onDeleteSelected: () => void
  onDuplicateSelected: () => void
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function objectTypeLabel(
  selectedObject: NonNullable<ReturnType<StudioStore['getSnapshot']>['selectedObject']>,
): string {
  if (selectedObject.layer === 'buildings') {
    return parseBuildingProperties(selectedObject.properties)?.buildingType ?? selectedObject.kind
  }
  if (selectedObject.layer === 'vehicles') {
    const props = parseVehiclePlacementProperties(selectedObject.properties)
    return props?.placementCatalogId ?? props?.vehicleType ?? selectedObject.kind
  }
  if (isSceneAnchorObject(selectedObject)) {
    return parseSceneAnchorProperties(selectedObject.properties)?.anchorKind ?? 'anchor'
  }
  return selectedObject.kind
}

export function InspectorPanel({
  store,
  onSceneRefresh,
  onDeleteSelected,
  onDuplicateSelected,
}: InspectorPanelProps) {
  const { selectedObject, activeModuleId, canUndo, canRedo } = useStudioStore(store)

  const moduleHints: Record<string, { title: string; hint: string }> = {
    terrain: {
      title: 'Terrain module is active.',
      hint: 'Use Terrain tools on the left — paint on the ground.',
    },
    parcels: {
      title: 'Parcel module is active.',
      hint: 'Use Parcel tools on the left — draw or select fields.',
    },
    vegetation: {
      title: 'Vegetation module is active.',
      hint: 'Use Vegetation tools on the left — place or select trees and shrubs.',
    },
    water: {
      title: 'Water module is active.',
      hint: 'Use Water tools on the left — draw rivers/streams or drag ponds.',
    },
    validation: {
      title: 'Validation module is active.',
      hint: 'Run validation on the left — click findings to highlight issues in the scene.',
    },
    export: {
      title: 'Export module is active.',
      hint: 'Export the current map to appear in the New Game map list.',
    },
  }

  if (!selectedObject && moduleHints[activeModuleId]) {
    const copy = moduleHints[activeModuleId]
    return (
      <div className="studio-panel studio-panel--inspector">
        <h2 className="studio-panel__title">Inspector</h2>
        <p className="studio-empty">{copy.title}</p>
        <p className="studio-hint">{copy.hint}</p>
        <p className="studio-hint">
          Buildings / Vehicles: switch to Select tool, click entity in scene.
        </p>
      </div>
    )
  }

  if (!selectedObject) {
    return (
      <div className="studio-panel studio-panel--inspector">
        <h2 className="studio-panel__title">Inspector</h2>
        <p className="studio-empty">Click an object in the scene to inspect.</p>
        <p className="studio-hint">
          Drag to move · Shift+drag to rotate · Del delete · Ctrl+D duplicate
        </p>
        <p className="studio-hint">Undo Ctrl+Z · Redo Ctrl+Y</p>
        <div className="studio-inspector__actions">
          <button
            type="button"
            className="studio-btn"
            disabled={!canUndo}
            onClick={() => {
              if (store.undo()) {
                onSceneRefresh()
              }
            }}
          >
            Undo
          </button>
          <button
            type="button"
            className="studio-btn"
            disabled={!canRedo}
            onClick={() => {
              if (store.redo()) {
                onSceneRefresh()
              }
            }}
          >
            Redo
          </button>
        </div>
      </div>
    )
  }

  const { transform, shape } = selectedObject
  const isProtected = selectedObject.id === 'terrain_ground'
  const anchors =
    isGameplayParentObject(selectedObject)
      ? store.listAnchorsForParent(selectedObject.id)
      : []

  const applyTransform = (
    patch: Parameters<StudioStore['updateObject']>[1],
    options?: { checkpoint?: boolean },
  ) => {
    if (options?.checkpoint !== false) {
      store.checkpointHistory('edit')
    }
    if (isSceneAnchorObject(selectedObject)) {
      if (patch.transform?.position) {
        store.updateAnchor(selectedObject.id, {
          position: {
            x: patch.transform.position.x ?? selectedObject.transform.position.x,
            z: patch.transform.position.z ?? selectedObject.transform.position.z,
          },
        })
      }
      if (patch.transform?.rotationY !== undefined) {
        store.updateAnchor(selectedObject.id, {
          rotationY: patch.transform.rotationY,
        })
      }
      onSceneRefresh()
      return
    }
    if (isGameplayParentObject(selectedObject)) {
      if (patch.transform?.position) {
        store.moveObjectWithAnchors(selectedObject.id, {
          x: patch.transform.position.x ?? selectedObject.transform.position.x,
          z: patch.transform.position.z ?? selectedObject.transform.position.z,
        })
      }
      if (patch.transform?.rotationY !== undefined) {
        store.rotateObjectWithAnchors(
          selectedObject.id,
          patch.transform.rotationY,
        )
      }
      if (patch.name !== undefined) {
        store.updateObject(selectedObject.id, { name: patch.name })
      }
      onSceneRefresh()
      return
    }
    if (store.updateObject(selectedObject.id, patch)) {
      onSceneRefresh()
    }
  }

  return (
    <div className="studio-panel studio-panel--inspector">
      <h2 className="studio-panel__title">Inspector</h2>

      <div className="studio-inspector__actions">
        <button
          type="button"
          className="studio-btn studio-btn--danger"
          disabled={isProtected}
          onClick={onDeleteSelected}
          title={isProtected ? 'Ground cannot be deleted' : 'Delete object (Del)'}
        >
          Delete
        </button>
        <button
          type="button"
          className="studio-btn"
          disabled={isProtected}
          onClick={onDuplicateSelected}
          title="Duplicate (Ctrl+D)"
        >
          Duplicate
        </button>
        <button
          type="button"
          className="studio-btn"
          disabled={!canUndo}
          onClick={() => {
            if (store.undo()) {
              onSceneRefresh()
            }
          }}
        >
          Undo
        </button>
        <button
          type="button"
          className="studio-btn"
          disabled={!canRedo}
          onClick={() => {
            if (store.redo()) {
              onSceneRefresh()
            }
          }}
        >
          Redo
        </button>
      </div>

      <dl className="studio-kv">
        <dt>Name</dt>
        <dd>
          <input
            className="studio-input"
            type="text"
            value={selectedObject.name ?? ''}
            onChange={(event) => {
              applyTransform({ name: event.target.value })
            }}
          />
        </dd>
        <dt>ID</dt>
        <dd className="studio-kv__mono">{selectedObject.id}</dd>
        <dt>Layer</dt>
        <dd>{selectedObject.layer}</dd>
        <dt>Type</dt>
        <dd>{objectTypeLabel(selectedObject)}</dd>
      </dl>

      <h3 className="studio-panel__subtitle">Transform</h3>
      <div className="studio-field-grid">
        <label className="studio-field">
          <span className="studio-field__label">X</span>
          <input
            className="studio-input"
            type="number"
            step="0.1"
            value={transform.position.x}
            onChange={(event) => {
              applyTransform({
                transform: {
                  position: {
                    x: parseNumber(event.target.value, transform.position.x),
                  },
                },
              })
            }}
          />
        </label>
        <label className="studio-field">
          <span className="studio-field__label">Y</span>
          <input
            className="studio-input"
            type="number"
            step="0.01"
            value={transform.position.y}
            onChange={(event) => {
              applyTransform({
                transform: {
                  position: {
                    y: parseNumber(event.target.value, transform.position.y),
                  },
                },
              })
            }}
          />
        </label>
        <label className="studio-field">
          <span className="studio-field__label">Z</span>
          <input
            className="studio-input"
            type="number"
            step="0.1"
            value={transform.position.z}
            onChange={(event) => {
              applyTransform({
                transform: {
                  position: {
                    z: parseNumber(event.target.value, transform.position.z),
                  },
                },
              })
            }}
          />
        </label>
        <label className="studio-field studio-field--wide">
          <span className="studio-field__label">Rotation Y</span>
          <input
            className="studio-input"
            type="number"
            step="0.05"
            value={transform.rotationY ?? 0}
            onChange={(event) => {
              applyTransform({
                transform: {
                  rotationY: parseNumber(
                    event.target.value,
                    transform.rotationY ?? 0,
                  ),
                },
              })
            }}
          />
        </label>
      </div>

      {shape?.type === 'box' && !isSceneAnchorObject(selectedObject) ? (
        <>
          <h3 className="studio-panel__subtitle">Shape</h3>
          <div className="studio-field-grid">
            <label className="studio-field">
              <span className="studio-field__label">W</span>
              <input
                className="studio-input"
                type="number"
                min="0.1"
                step="0.1"
                value={shape.width}
                onChange={(event) => {
                  store.checkpointHistory('edit')
                  applyTransform(
                    {
                      shape: {
                        width: parseNumber(event.target.value, shape.width),
                      },
                    },
                    { checkpoint: false },
                  )
                }}
              />
            </label>
            <label className="studio-field">
              <span className="studio-field__label">H</span>
              <input
                className="studio-input"
                type="number"
                min="0.01"
                step="0.01"
                value={shape.height}
                onChange={(event) => {
                  store.checkpointHistory('edit')
                  applyTransform(
                    {
                      shape: {
                        height: parseNumber(event.target.value, shape.height),
                      },
                    },
                    { checkpoint: false },
                  )
                }}
              />
            </label>
            <label className="studio-field">
              <span className="studio-field__label">D</span>
              <input
                className="studio-input"
                type="number"
                min="0.1"
                step="0.1"
                value={shape.depth}
                onChange={(event) => {
                  store.checkpointHistory('edit')
                  applyTransform(
                    {
                      shape: {
                        depth: parseNumber(event.target.value, shape.depth),
                      },
                    },
                    { checkpoint: false },
                  )
                }}
              />
            </label>
          </div>
        </>
      ) : null}

      {anchors.length > 0 ? (
        <>
          <h3 className="studio-panel__subtitle">Anchors ({anchors.length})</h3>
          <ul className="studio-inspector__anchor-list">
            {anchors.map((anchor) => {
              const props = parseSceneAnchorProperties(anchor.properties)
              return (
                <li key={anchor.id}>
                  <button
                    type="button"
                    className="studio-btn studio-btn--link"
                    onClick={() => {
                      store.selectObject(anchor)
                      onSceneRefresh()
                    }}
                  >
                    {props?.label ?? anchor.name ?? anchor.id}
                  </button>
                  <span className="studio-kv__mono"> {props?.anchorKind}</span>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}

      {selectedObject.id === 'terrain_ground' ? (
        <TerrainSurfaceInspector store={store} />
      ) : null}

      {selectedObject.kind === TERRAIN_POLYGON_KIND ? (
        <TerrainBoundaryInspector object={selectedObject} />
      ) : null}

      {shape && isMapPolygonShape(shape) && selectedObject.kind !== TERRAIN_POLYGON_KIND ? (
        <PolygonShapeInspector object={selectedObject} />
      ) : null}

      {selectedObject.layer === 'fields' && selectedObject.kind === 'field' ? (
        <FieldStateInspector
          store={store}
          field={selectedObject}
          onSceneRefresh={onSceneRefresh}
        />
      ) : null}

      {selectedObject.properties &&
      Object.keys(selectedObject.properties).length > 0 ? (
        <>
          <h3 className="studio-panel__subtitle">Properties</h3>
          <pre className="studio-json">
            {JSON.stringify(selectedObject.properties, null, 2)}
          </pre>
        </>
      ) : null}
    </div>
  )
}
