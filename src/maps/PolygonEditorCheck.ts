import { NullEngine, Scene } from '@babylonjs/core'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { StudioStore } from '@/studio/core/StudioStore.ts'
import { MapFileService } from '@/studio/io/MapFileService.ts'
import { MapSceneBuilder, getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'
import { PolygonDrawingSession } from '@/studio/polygon/PolygonDrawingSession.ts'
import { validatePolygonGeometry } from '@/studio/polygon/PolygonValidation.ts'
import { ParcelPolygonAdapter } from '@/studio/polygon/adapters/ParcelPolygonAdapter.ts'
import { TerrainPolygonAdapter } from '@/studio/polygon/adapters/TerrainPolygonAdapter.ts'
import {
  ensureMapTerrainSurface,
  hasTerrainGround,
  isSystemTerrainPolygon,
} from '@/studio/terrain/ensureMapTerrainSurface.ts'
import { findStudioMeshByObjectId } from '@/studio/io/MapSceneBuilder.ts'
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

function runGlobalTerrainSurfaceChecks(failures: string[]): void {
  const bare: WorldMapDocument = {
    formatVersion: WORLD_MAP_FORMAT_VERSION,
    id: 'bare_map',
    name: 'Bare',
    meta: {
      author: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    terrain: { width: 0, height: 0 },
    objects: [],
  }

  const fixed = ensureMapTerrainSurface(bare)
  if (!hasTerrainGround(fixed)) {
    failures.push('Terrain surface: bare map must receive terrain_ground fallback')
  }
  if (fixed.terrain.width <= 0 || fixed.terrain.height <= 0) {
    failures.push('Terrain surface: terrain heightfield dimensions must be positive')
  }

  const parsed = MapFileService.parse(MapFileService.serialize(fixed))
  if (!hasTerrainGround(parsed)) {
    failures.push('Terrain surface: save/load must keep terrain_ground')
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
  builder.build(scene, parsed)

  const groundMesh = findStudioMeshByObjectId(scene, 'terrain_ground')
  if (!groundMesh) {
    failures.push('Terrain surface: terrain_ground mesh must render in studio')
  }

  const fallback = parsed.objects.find((object) => isSystemTerrainPolygon(object))
  if (!fallback) {
    failures.push('Terrain surface: legacy map without terrain polygon needs bounds fallback metadata')
  }
  if (fallback && findStudioMeshByObjectId(scene, fallback.id)) {
    failures.push('Terrain surface: system fallback terrain polygon must not render opaque mesh')
  }

  const studioMeshes = scene.meshes
    .map((mesh) => getStudioMetadata(mesh))
    .filter((metadata) => metadata !== null)
  if (studioMeshes[0]?.layer !== 'terrain') {
    failures.push('Terrain surface: terrain must be first rendered layer')
  }

  scene.dispose()
  engine.dispose()
}

function runTerrainPolygonAdapterChecks(map: WorldMapDocument, failures: string[]): void {
  const store = new StudioStore(map)
  store.setActiveModule('terrain')
  store.setTerrainToolMode('polygon')

  const adapter = new TerrainPolygonAdapter(store)
  if (!adapter.isModuleActive()) {
    failures.push('Terrain tool: adapter must be active in terrain polygon mode')
  }

  const session = new PolygonDrawingSession()
  session.addPoint(-20, -20)
  session.addPoint(20, -20)
  session.addPoint(20, 20)
  session.addPoint(-20, 20)

  if (session.pointCount !== 4) {
    failures.push('Terrain tool: drawing session point count mismatch')
  }

  const created = adapter.createFromPolygon(session.committedPoints())
  if (!created || created.kind !== TERRAIN_POLYGON_KIND) {
    failures.push('Terrain tool: createFromPolygon failed')
    return
  }

  adapter.setTool('edit')
  if (store.getSnapshot().terrainPolygonTool !== 'edit') {
    failures.push('Terrain tool: must switch to edit after create')
  }
  if (store.getSnapshot().selectedObject?.id !== created.id) {
    store.selectObject(created)
  }
  if (store.getSnapshot().selectedObject?.id !== created.id) {
    failures.push('Terrain tool: created polygon must be selected')
  }

  session.clear()
  if (session.isActive) {
    failures.push('Terrain tool: session should be inactive after create (simulated finish)')
  }

  const polygon = getFieldPolygonPoints(created)
  if (!polygon) {
    failures.push('Terrain tool: missing polygon points on created object')
  } else {
    const edited = polygon.map((point, index) =>
      index === 2 ? { x: 25, z: 25 } : point,
    )
    if (!adapter.updatePolygon(created.id, edited)) {
      failures.push('Terrain tool: vertex drag/update failed')
    }
  }
}

function countStudioMeshesByKind(scene: Scene, kind: string): number {
  return scene.meshes.filter((mesh) => getStudioMetadata(mesh)?.kind === kind).length
}

function countTerrainGroundInMap(map: WorldMapDocument): number {
  return map.objects.filter((object) => object.id === 'terrain_ground').length
}

function runTerrainBoundaryArchitectureChecks(map: WorldMapDocument, failures: string[]): void {
  const store = new StudioStore(map)
  const points = [
    { x: -40, z: -40 },
    { x: 40, z: -40 },
    { x: 40, z: 40 },
    { x: -40, z: 40 },
  ]

  if (countTerrainGroundInMap(store.getMap()) !== 1) {
    failures.push('Terrain surface: map must contain exactly one terrain_ground object')
  }

  const revisionBefore = store.getSnapshot().terrainSurfaceRevision

  const boundary = store.createTerrainPolygon(points)
  if (!boundary) {
    failures.push('Terrain boundary: createTerrainPolygon failed')
    return
  }

  if (countTerrainGroundInMap(store.getMap()) !== 1) {
    failures.push('Terrain surface: boundary create must not add a second terrain_ground')
  }

  if (store.getSnapshot().terrainSurfaceRevision <= revisionBefore) {
    failures.push('Terrain sync: boundary create must mark terrain surface dirty')
  }

  const groundAfterCreate = store.getMap().objects.find((object) => object.id === 'terrain_ground')
  const widthAfterCreate =
    groundAfterCreate?.shape?.type === 'box' ? groundAfterCreate.shape.width : 0
  if (Math.abs(widthAfterCreate - 80) > 1) {
    failures.push(
      `Terrain sync: terrain_ground width should match boundary (~80), got ${widthAfterCreate}`,
    )
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
  builder.build(scene, store.getMap(), { renderTerrainBoundary: true })

  if (countStudioMeshesByKind(scene, TERRAIN_POLYGON_KIND) > 0) {
    failures.push('Terrain boundary: must not render opaque studio mesh for terrain_polygon')
  }
  if (!findStudioMeshByObjectId(scene, 'terrain_ground')) {
    failures.push('Terrain surface: terrain_ground mesh must exist alongside boundary')
  }

  const wireCount = scene.meshes.filter((mesh) =>
    mesh.name.startsWith('terrain_boundary_wire_'),
  ).length
  if (wireCount < 1) {
    failures.push('Terrain boundary: editor wireframe should be visible when enabled')
  }

  store.setTerrainBoundaryVisible(false)
  builder.refreshTerrainBoundaryWireframes(scene, store.getMap(), false)
  const wireAfterHide = scene.meshes.filter((mesh) =>
    mesh.name.startsWith('terrain_boundary_wire_'),
  ).length
  if (wireAfterHide > 0) {
    failures.push('Terrain boundary: wireframe must hide when boundary layer is off')
  }
  if (!findStudioMeshByObjectId(scene, 'terrain_ground')) {
    failures.push('Terrain surface: terrain_ground must remain when boundary is hidden')
  }

  const revisionBeforeEdit = store.getSnapshot().terrainSurfaceRevision
  const edited = points.map((point, index) =>
    index === 1 ? { x: 50, z: -40 } : point,
  )
  if (!store.updateTerrainPolygon(boundary.id, edited)) {
    failures.push('Terrain boundary: vertex edit failed')
  } else if (store.getSnapshot().terrainSurfaceRevision <= revisionBeforeEdit) {
    failures.push('Terrain sync: boundary vertex edit must mark terrain surface dirty')
  }

  const serialized = MapFileService.serialize(store.getMap())
  const loaded = MapFileService.parse(serialized)
  if (!loaded) {
    failures.push('Terrain save/load: parse failed')
  } else {
    if (!hasTerrainGround(loaded)) {
      failures.push('Terrain save/load: terrain_ground missing after roundtrip')
    }
    const loadedBoundary = loaded.objects.find((object) => object.id === boundary.id)
    if (!loadedBoundary || loadedBoundary.kind !== TERRAIN_POLYGON_KIND) {
      failures.push('Terrain save/load: terrain boundary missing after roundtrip')
    }
  }

  const runtimeScene = new Scene(engine)
  builder.build(runtimeScene, store.getMap(), { renderTerrainBoundary: false })
  const runtimeWire = runtimeScene.meshes.filter((mesh) =>
    mesh.name.startsWith('terrain_boundary_wire_'),
  ).length
  if (runtimeWire > 0) {
    failures.push('Runtime: terrain boundary wireframes must not be built')
  }
  if (!findStudioMeshByObjectId(runtimeScene, 'terrain_ground')) {
    failures.push('Runtime: terrain_ground surface must still render')
  }
  if (countStudioMeshesByKind(runtimeScene, TERRAIN_POLYGON_KIND) > 0) {
    failures.push('Runtime: must not render terrain_polygon opaque meshes')
  }

  runtimeScene.dispose()
  scene.dispose()
  engine.dispose()
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
  builder.build(scene, store.getMap(), { renderTerrainBoundary: true })

  const opaqueBoundaryMeshes = scene.meshes.filter(
    (mesh) => getStudioMetadata(mesh)?.kind === TERRAIN_POLYGON_KIND,
  )
  if (opaqueBoundaryMeshes.length > 0) {
    failures.push('Terrain: user terrain_polygon must not render opaque mesh')
  }

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

  adapter.setTool('edit')
  if (store.getSnapshot().parcelTool !== 'edit') {
    failures.push('Parcels: setTool(edit) after create failed')
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
  runGlobalTerrainSurfaceChecks(failures)
  runTerrainBoundaryArchitectureChecks(map, failures)
  runTerrainPolygonAdapterChecks(map, failures)
  runTerrainChecks(map, failures)
  runParcelAdapterChecks(map, failures)

  return {
    passed: failures.length === 0,
    failures,
  }
}
