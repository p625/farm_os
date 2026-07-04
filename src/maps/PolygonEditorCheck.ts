import { NullEngine, Scene } from '@babylonjs/core'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { StudioStore } from '@/studio/core/StudioStore.ts'
import { MapFileService } from '@/studio/io/MapFileService.ts'
import { MapSceneBuilder, getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'
import { PolygonDrawingSession } from '@/studio/polygon/PolygonDrawingSession.ts'
import { validatePolygonGeometry } from '@/studio/polygon/PolygonValidation.ts'
import { ParcelPolygonAdapter } from '@/studio/polygon/adapters/ParcelPolygonAdapter.ts'
import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { TERRAIN_POLYGON_KIND } from '@/types/terrain-polygon.ts'
import { parseFieldParcelProperties } from '@/types/parcel.ts'
import { FIELD_TEST_PRESETS } from '@/types/field-test-state.ts'
import { getFieldPolygonPoints } from '@/studio/parcel/ParcelPolygon.ts'

export interface PolygonEditorCheckReport {
  passed: boolean
  failures: string[]
}

function buildPolygonTestMap(): WorldMapDocument {
  const terrain = ensureTerrainHeightfield({ width: 200, height: 200 })
  return {
    formatVersion: WORLD_MAP_FORMAT_VERSION,
    id: 'polygon_editor_test',
    name: 'Polygon Editor Test',
    meta: {
      author: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    terrain,
    objects: [
      {
        id: 'terrain_ground',
        layer: 'terrain',
        kind: 'ground',
        name: 'Ground',
        transform: { position: { x: 0, y: 0, z: 0 } },
        shape: { type: 'box', width: 200, height: 0.2, depth: 200 },
      },
    ],
  }
}

function previewShowsFill(pointCount: number, hasCursor: boolean): boolean {
  if (pointCount < 3) {
    return false
  }
  return hasCursor || pointCount >= 3
}

function runDrawingSessionChecks(failures: string[]): void {
  const session = new PolygonDrawingSession()

  session.addPoint(0, 0)
  if (session.pointCount !== 1) {
    failures.push('Drawing: first click should add exactly one vertex')
  }
  if (previewShowsFill(session.pointCount, session.getState().cursor !== null)) {
    failures.push('Drawing: one point must not show fill preview')
  }

  session.addPoint(10, 0)
  if (session.pointCount !== 2) {
    failures.push('Drawing: second click should add second vertex')
  }
  if (previewShowsFill(session.pointCount, true)) {
    failures.push('Drawing: two points must not show fill preview')
  }

  session.addPoint(10, 10)
  if (session.pointCount !== 3) {
    failures.push('Drawing: third click should add third vertex')
  }
  if (!previewShowsFill(session.pointCount, true)) {
    failures.push('Drawing: three points with cursor should allow fill preview')
  }

  const beforeMove = session.pointCount
  session.setCursor(5, 5)
  if (session.pointCount !== beforeMove) {
    failures.push('Drawing: mousemove must not add vertices')
  }

  if (!session.beginFinish()) {
    failures.push('Drawing: beginFinish should succeed on first call')
  }
  if (session.beginFinish()) {
    failures.push('Drawing: double finish guard must block second commit')
  }
  session.endFinish()
  session.clear()

  session.addPoint(0, 0)
  session.addPoint(10, 0)
  session.addPoint(10, 10)
  if (!session.removeLastPoint() || session.pointCount !== 2) {
    failures.push('Drawing: Backspace should remove last vertex')
  }

  session.clear()
  if (session.isActive) {
    failures.push('Drawing: Escape/clear should reset session and preview state')
  }
  if (session.pointCount !== 0) {
    failures.push('Drawing: clear should remove all committed vertices')
  }
}

function runValidationChecks(map: WorldMapDocument, failures: string[]): void {
  const tooFew = validatePolygonGeometry(map, [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
  ])
  if (tooFew.ok) {
    failures.push('Validation: fewer than 3 points must not pass')
  }

  const selfIntersect = validatePolygonGeometry(map, [
    { x: 0, z: 0 },
    { x: 20, z: 20 },
    { x: 20, z: 0 },
    { x: 0, z: 20 },
  ])
  if (selfIntersect.ok) {
    failures.push('Validation: self-intersecting polygon must not pass')
  }

  const duplicateAdjacent = validatePolygonGeometry(map, [
    { x: 0, z: 0 },
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 10 },
  ])
  if (duplicateAdjacent.ok) {
    failures.push('Validation: duplicate adjacent vertices must not pass')
  }
}

function runTerrainChecks(map: WorldMapDocument, failures: string[]): void {
  const store = new StudioStore(map)
  const points = [
    { x: -30, z: -30 },
    { x: 30, z: -30 },
    { x: 30, z: 30 },
    { x: -30, z: 30 },
  ]

  const terrain = store.createTerrainPolygon(points)
  if (!terrain || terrain.kind !== TERRAIN_POLYGON_KIND) {
    failures.push('Terrain: createTerrainPolygon failed')
    return
  }

  const edited = points.map((point, index) =>
    index === 1 ? { x: 35, z: -30 } : point,
  )
  if (!store.updateTerrainPolygon(terrain.id, edited)) {
    failures.push('Terrain: updateTerrainPolygon vertex edit failed')
  }

  const serialized = MapFileService.serialize(store.getMap())
  const loaded = MapFileService.parse(serialized)
  if (!loaded) {
    failures.push('Terrain: save/load parse failed')
  } else {
    const loadedTerrain = loaded.objects.find((object) => object.id === terrain.id)
    if (!loadedTerrain || loadedTerrain.kind !== TERRAIN_POLYGON_KIND) {
      failures.push('Terrain: terrain polygon missing after load')
    }
  }

  const engine = new NullEngine({
    renderWidth: 1,
    renderHeight: 1,
    textureSize: 1,
    deterministicLockstep: true,
    lockstepMaxSteps: 4,
  })
  const scene = new Scene(engine)
  const builder = new MapSceneBuilder()
  builder.build(scene, store.getMap())

  const studioMeshes = scene.meshes
    .map((mesh) => getStudioMetadata(mesh))
    .filter((metadata) => metadata !== null)

  const firstLayer = studioMeshes[0]?.layer
  if (firstLayer !== 'terrain') {
    failures.push(`Terrain: expected terrain as first rendered layer, got ${firstLayer ?? 'none'}`)
  }

  scene.dispose()
  engine.dispose()
}

function runParcelAdapterChecks(map: WorldMapDocument, failures: string[]): void {
  const store = new StudioStore(map)
  store.setParcelBlock('A')
  store.setParcelType('arable')

  const adapter = new ParcelPolygonAdapter(store)
  const points = [
    { x: -10, z: -10 },
    { x: 10, z: -10 },
    { x: 10, z: 10 },
    { x: -10, z: 10 },
  ]

  const created = adapter.createFromPolygon(points)
  if (!created) {
    failures.push('Parcels: adapter createFromPolygon failed')
    return
  }

  const props = parseFieldParcelProperties(created.properties)
  if (props?.parcelId !== 'A-01') {
    failures.push(`Parcels: expected A-01, got ${props?.parcelId ?? 'none'}`)
  }

  const readyPreset = FIELD_TEST_PRESETS.find((preset) => preset.id === 'ready_wheat')
  if (!readyPreset) {
    failures.push('Parcels: missing ready_wheat preset')
  } else if (!store.updateFieldParcel(created.id, { fieldTestState: readyPreset.state })) {
    failures.push('Parcels: failed to apply ready wheat harvest preset')
  }

  const polygon = getFieldPolygonPoints(created)
  if (!polygon) {
    failures.push('Parcels: missing polygon on created field')
  } else {
    const edited = polygon.map((point, index) =>
      index === 1 ? { x: 14, z: -10 } : point,
    )
    if (!adapter.updatePolygon(created.id, edited)) {
      failures.push('Parcels: vertex edit via adapter failed')
    }
  }

  const serialized = MapFileService.serialize(store.getMap())
  const loaded = MapFileService.parse(serialized)
  const loadedField = loaded?.objects.find((object) => object.id === created.id)
  if (!loadedField) {
    failures.push('Parcels: save/load roundtrip lost parcel')
  }

  const duplicate = adapter.duplicateObject(created.id)
  if (!duplicate) {
    failures.push('Parcels: duplicate failed')
  } else {
    const dupProps = parseFieldParcelProperties(duplicate.properties)
    if (!dupProps?.parcelId || dupProps.parcelId === 'A-01') {
      failures.push('Parcels: duplicate did not allocate unique parcel id')
    }
  }

  if (!adapter.deleteObject(created.id)) {
    failures.push('Parcels: delete failed')
  }
  if (store.findObject(created.id)) {
    failures.push('Parcels: delete did not remove parcel')
  }
}

export function runPolygonEditorCheck(): PolygonEditorCheckReport {
  const failures: string[] = []
  const map = buildPolygonTestMap()

  runDrawingSessionChecks(failures)
  runValidationChecks(map, failures)
  runTerrainChecks(map, failures)
  runParcelAdapterChecks(map, failures)

  return {
    passed: failures.length === 0,
    failures,
  }
}
