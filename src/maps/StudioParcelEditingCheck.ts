import { NullEngine, Scene, StandardMaterial } from '@babylonjs/core'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { StudioStore } from '@/studio/core/StudioStore.ts'
import { MapFileService } from '@/studio/io/MapFileService.ts'
import { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import { validateWorldMap } from '@/studio/validation/validateMap.ts'
import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { parseFieldParcelProperties } from '@/types/parcel.ts'
import { FIELD_TEST_PRESETS } from '@/types/field-test-state.ts'
import { getFieldVisualStyle } from '@rendering/appearance/FieldAppearance.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import { findStudioMeshByObjectId } from '@/studio/io/MapSceneBuilder.ts'

export interface StudioParcelEditingReport {
  passed: boolean
  failures: string[]
}

function buildParcelTestMap(): WorldMapDocument {
  const terrain = ensureTerrainHeightfield({ width: 200, height: 200 })
  return {
    formatVersion: WORLD_MAP_FORMAT_VERSION,
    id: 'parcel_edit_test',
    name: 'Parcel Edit Test',
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
      {
        id: 'road_1',
        layer: 'roads',
        kind: 'road',
        name: 'Access road',
        transform: { position: { x: 0, y: 0, z: 0 } },
        properties: {
          roadKind: 'field_path',
          points: [
            { x: -20, y: 0, z: 0 },
            { x: 20, y: 0, z: 0 },
          ],
        },
      },
    ],
  }
}

function colorDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b)
}

export function runStudioParcelEditingCheck(): StudioParcelEditingReport {
  const failures: string[] = []
  const store = new StudioStore(buildParcelTestMap())

  store.setParcelBlock('A')
  store.setParcelType('arable')
  store.addParcelDraftPoint(-10, -10)
  store.addParcelDraftPoint(10, -10)
  store.addParcelDraftPoint(10, 10)
  store.addParcelDraftPoint(-10, 10)
  if (!store.commitParcelDraft()) {
    failures.push('commitParcelDraft failed for A-01 polygon')
  }

  const field = store.getMap().objects.find(
    (object) => object.layer === 'fields' && object.kind === 'field',
  )
  if (!field) {
    failures.push('No field created after commitParcelDraft')
    return { passed: false, failures }
  }

  const props = parseFieldParcelProperties(field.properties)
  if (props?.parcelId !== 'A-01') {
    failures.push(`Expected parcel id A-01, got ${props?.parcelId ?? 'none'}`)
  }

  const originalPoints = [
    { x: -10, z: -10 },
    { x: 10, z: -10 },
    { x: 10, z: 10 },
    { x: -10, z: 10 },
  ]
  const editedPoints = originalPoints.map((point, index) =>
    index === 1 ? { x: 14, z: -10 } : point,
  )
  if (!store.updateFieldParcelPolygon(field.id, editedPoints)) {
    failures.push('updateFieldParcelPolygon failed for vertex edit')
  }

  const readyPreset = FIELD_TEST_PRESETS.find((preset) => preset.id === 'ready_wheat')
  if (!readyPreset) {
    failures.push('Missing ready_wheat preset')
  } else if (
    !store.updateFieldParcel(field.id, { fieldTestState: readyPreset.state })
  ) {
    failures.push('Failed to apply Ready wheat harvest preset')
  }

  const engine = new NullEngine({
    renderWidth: 1,
    renderHeight: 1,
    textureSize: 1,
    deterministicLockstep: true,
    lockstepMaxSteps: 4,
  })
  const scene = new Scene(engine)
  const mapSceneBuilder = new MapSceneBuilder()
  mapSceneBuilder.build(scene, store.getMap())
  const mesh = findStudioMeshByObjectId(scene, field.id)
  const material = mesh?.material as StandardMaterial | undefined
  const expectedStyle = getFieldVisualStyle(States.Harvestable, 100)
  if (
    !material ||
    colorDistance(material.diffuseColor, expectedStyle.diffuse) > 0.2
  ) {
    failures.push('Field mesh visual does not reflect Ready wheat harvest state')
  }

  const serialized = MapFileService.serialize(store.getMap())
  const loaded = MapFileService.parse(serialized)
  if (!loaded) {
    failures.push('MapFileService.parse returned null after serialize')
  } else {
    const loadedField = loaded.objects.find((object) => object.id === field.id)
    const loadedProps = loadedField
      ? parseFieldParcelProperties(loadedField.properties)
      : null
    if (loadedProps?.fieldTestState?.lifecycleState !== States.Harvestable) {
      failures.push('Save/load roundtrip lost harvestable crop state')
    }
    if (loadedProps?.parcelId !== 'A-01') {
      failures.push('Save/load roundtrip lost parcel id')
    }

    const reloadScene = new Scene(engine)
    mapSceneBuilder.build(reloadScene, loaded)
    const reloadMesh = findStudioMeshByObjectId(reloadScene, field.id)
    const reloadMaterial = reloadMesh?.material as StandardMaterial | undefined
    if (
      !reloadMaterial ||
      colorDistance(reloadMaterial.diffuseColor, expectedStyle.diffuse) > 0.2
    ) {
      failures.push('Visual after load does not match Ready wheat harvest state')
    }
    reloadScene.dispose()
  }

  const duplicate = store.duplicateField(field.id)
  if (!duplicate) {
    failures.push('duplicateField returned null')
  } else {
    const dupProps = parseFieldParcelProperties(duplicate.properties)
    if (!dupProps?.parcelId || dupProps.parcelId === 'A-01') {
      failures.push('duplicateField did not allocate a new unique parcel id')
    }
  }

  if (!store.deleteField(field.id)) {
    failures.push('deleteField failed')
  }
  if (store.findObject(field.id)) {
    failures.push('deleteField did not remove parcel from map')
  }

  const dupMap: WorldMapDocument = {
    ...buildParcelTestMap(),
    objects: [
      ...buildParcelTestMap().objects,
      {
        id: 'field_dup_a',
        layer: 'fields',
        kind: 'field',
        name: 'Dup A',
        transform: { position: { x: 0, y: 0.04, z: 0 } },
        shape: {
          type: 'polygon',
          points: [
            { x: -5, z: -5 },
            { x: 5, z: -5 },
            { x: 5, z: 5 },
            { x: -5, z: 5 },
          ],
          height: 0.08,
        },
        properties: {
          parcelBlock: 'A',
          fertility: 75,
          parcelId: 'A-01',
          parcelType: 'arable',
          ownershipStage: 'start',
        },
      },
      {
        id: 'field_dup_b',
        layer: 'fields',
        kind: 'field',
        name: 'Dup B',
        transform: { position: { x: 20, y: 0.04, z: 0 } },
        shape: {
          type: 'polygon',
          points: [
            { x: 15, z: -5 },
            { x: 25, z: -5 },
            { x: 25, z: 5 },
            { x: 15, z: 5 },
          ],
          height: 0.08,
        },
        properties: {
          parcelBlock: 'A',
          fertility: 75,
          parcelId: 'A-01',
          parcelType: 'arable',
          ownershipStage: 'start',
        },
      },
    ],
  }
  const dupValidation = validateWorldMap(dupMap)
  if (!dupValidation.issues.some((issue) => issue.ruleId === 'parcel-duplicate-id')) {
    failures.push('Validation did not flag duplicate parcel id')
  }

  const invalidCropMap: WorldMapDocument = {
    ...buildParcelTestMap(),
    objects: [
      ...buildParcelTestMap().objects,
      {
        id: 'field_invalid',
        layer: 'fields',
        kind: 'field',
        name: 'Invalid crop',
        transform: { position: { x: 0, y: 0.04, z: 0 } },
        shape: {
          type: 'polygon',
          points: [
            { x: -5, z: -5 },
            { x: 5, z: -5 },
            { x: 5, z: 5 },
            { x: -5, z: 5 },
          ],
          height: 0.08,
        },
        properties: {
          parcelBlock: 'A',
          fertility: 75,
          parcelId: 'A-99',
          parcelType: 'arable',
          ownershipStage: 'start',
          fieldTestState: {
            cropEnabled: false,
            cropId: 'wheat',
            lifecycleState: States.Harvestable,
            growthPercent: 100,
            workState: 'readyToHarvest',
          },
        },
      },
    ],
  }
  const invalidValidation = validateWorldMap(invalidCropMap)
  const caughtInvalidCrop = invalidValidation.issues.some(
    (issue) =>
      issue.ruleId === 'parcel-crop-type-when-disabled' ||
      issue.ruleId === 'parcel-ready-without-crop' ||
      issue.ruleId === 'field-crop-disabled-with-type',
  )
  if (!caughtInvalidCrop) {
    failures.push('Validation did not flag invalid crop state')
  }

  scene.dispose()
  engine.dispose()

  return {
    passed: failures.length === 0,
    failures,
  }
}
