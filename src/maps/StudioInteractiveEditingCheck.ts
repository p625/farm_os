import type { WorldMapDocument } from '@/types/world-map.ts'
import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { StudioStore } from '@/studio/core/StudioStore.ts'
import { MapFileService } from '@/studio/io/MapFileService.ts'
import {
  buildGameplayPlacementTestMap,
  runGameplayPlacementSelfCheck,
} from '@/maps/GameplayPlacementSelfCheck.ts'
import {
  rotateObjectsWithAnchors,
  translateObjectsWithAnchors,
} from '@/studio/anchor/studioAnchorSync.ts'
import { getAnchorsForParent } from '@/types/scene-anchor.ts'
import { MachineId } from '@/types/machine.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'

export interface StudioInteractiveEditingReport {
  passed: boolean
  failures: string[]
}

function countIds(objects: readonly { id: string }[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const object of objects) {
    counts.set(object.id, (counts.get(object.id) ?? 0) + 1)
  }
  return counts
}

function duplicateIds(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
}

export function runStudioInteractiveEditingCheck(): StudioInteractiveEditingReport {
  const failures: string[] = []
  const baseMap = buildGameplayPlacementTestMap()
  const store = new StudioStore(baseMap)

  const tractor = store.getMap().objects.find((object) => {
    if (object.layer !== 'vehicles') {
      return false
    }
    const props = parseVehiclePlacementProperties(object.properties)
    return props?.machineId === MachineId.Tractor1
  })
  if (!tractor) {
    failures.push('Test map missing tractor placement')
    return { passed: false, failures }
  }

  store.selectObject(tractor)
  if (store.getSnapshot().selectedObject?.id !== tractor.id) {
    failures.push('selectObject did not select tractor')
  }

  const anchorsBefore = getAnchorsForParent(store.getMap().objects, tractor.id)
  const anchorPositionsBefore = anchorsBefore.map(
    (anchor) => `${anchor.id}:${anchor.transform.position.x},${anchor.transform.position.z}`,
  )

  store.checkpointHistory('test-move')
  store.moveObjectWithAnchors(tractor.id, { x: 12, z: 24 })
  const movedTractor = store.findObject(tractor.id)
  if (!movedTractor || movedTractor.transform.position.x !== 12) {
    failures.push('moveObjectWithAnchors did not update tractor position')
  }

  const anchorsAfterMove = getAnchorsForParent(store.getMap().objects, tractor.id)
  for (const anchor of anchorsAfterMove) {
    const before = anchorsBefore.find((entry) => entry.id === anchor.id)
    if (!before) {
      continue
    }
    const deltaX = movedTractor!.transform.position.x - tractor.transform.position.x
    const deltaZ = movedTractor!.transform.position.z - tractor.transform.position.z
    const expectedX = before.transform.position.x + deltaX
    const expectedZ = before.transform.position.z + deltaZ
    if (
      Math.abs(anchor.transform.position.x - expectedX) > 0.01 ||
      Math.abs(anchor.transform.position.z - expectedZ) > 0.01
    ) {
      failures.push(`Anchor ${anchor.id} did not follow parent move`)
    }
  }

  const manualAnchor = anchorsAfterMove[0]
  if (manualAnchor) {
    store.checkpointHistory('test-anchor-edit')
    store.updateAnchor(manualAnchor.id, { position: { x: 99, z: 88 } })
    const edited = store.findObject(manualAnchor.id)
    if (
      !edited ||
      Math.abs(edited.transform.position.x - 99) > 0.01 ||
      Math.abs(edited.transform.position.z - 88) > 0.01
    ) {
      failures.push('Manual anchor edit was not persisted in store')
    }
  }

  store.checkpointHistory('test-duplicate')
  const duplicate = store.duplicateObject(tractor.id)
  if (!duplicate || duplicate.id === tractor.id) {
    failures.push('duplicateObject did not create a new vehicle id')
  }

  const idsAfterDuplicate = countIds(store.getMap().objects)
  const dupesAfterDuplicate = duplicateIds(idsAfterDuplicate)
  if (dupesAfterDuplicate.length > 0) {
    failures.push(
      `Duplicate object ids after duplication: ${dupesAfterDuplicate.join(', ')}`,
    )
  }

  store.checkpointHistory('test-delete')
  const building = store.getMap().objects.find((object) => object.layer === 'buildings')
  if (building) {
    const buildingAnchors = getAnchorsForParent(store.getMap().objects, building.id)
    store.deleteGameplayObject(building.id)
    if (store.findObject(building.id)) {
      failures.push('deleteGameplayObject did not remove building')
    }
    for (const anchor of buildingAnchors) {
      if (store.findObject(anchor.id)) {
        failures.push(`deleteGameplayObject left child anchor ${anchor.id}`)
      }
    }
  }

  const serialized = MapFileService.serialize(store.getMap())
  const loaded = MapFileService.parse(serialized)
  if (!loaded) {
    failures.push('MapFileService.parse returned null after serialize')
  } else {
    const loadedDupes = duplicateIds(countIds(loaded.objects))
    if (loadedDupes.length > 0) {
      failures.push(
        `Duplicate ids after save/load roundtrip: ${loadedDupes.join(', ')}`,
      )
    }
    const placementCheck = runGameplayPlacementSelfCheck(loaded)
    if (!placementCheck.passed) {
      failures.push(
        `Placement self-check failed after interactive edits: ${placementCheck.failures.join('; ')}`,
      )
    }
  }

  store.checkpointHistory('test-undo')
  if (!store.canUndo()) {
    failures.push('Expected undo stack after checkpointed edits')
  } else {
    store.undo()
  }

  const pureMap: WorldMapDocument = {
    formatVersion: WORLD_MAP_FORMAT_VERSION,
    id: 'anchor_sync_unit',
    name: 'Anchor Sync Unit',
    meta: {
      author: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    terrain: ensureTerrainHeightfield({ width: 100, height: 100 }),
    objects: [
      {
        id: 'parent',
        layer: 'vehicles',
        kind: 'tractor',
        name: 'Parent',
        transform: { position: { x: 0, y: 0, z: 0 }, rotationY: 0 },
        shape: { type: 'box', width: 2, height: 2, depth: 3 },
      },
      {
        id: 'anc_1',
        layer: 'poi',
        kind: 'anchor',
        name: 'Anchor',
        transform: { position: { x: 2, y: 0, z: 0 } },
        properties: {
          anchorKind: 'parking',
          label: 'Parking',
          parentObjectId: 'parent',
        },
      },
    ],
  }

  const translated = translateObjectsWithAnchors(pureMap.objects, 'parent', 5, 0)
  const translatedAnchor = translated.find((object) => object.id === 'anc_1')
  if (
    !translatedAnchor ||
    Math.abs(translatedAnchor.transform.position.x - 7) > 0.01
  ) {
    failures.push('translateObjectsWithAnchors unit check failed')
  }

  const rotated = rotateObjectsWithAnchors(translated, 'parent', Math.PI / 2)
  const rotatedAnchor = rotated.find((object) => object.id === 'anc_1')
  if (
    !rotatedAnchor ||
    Math.abs(rotatedAnchor.transform.position.x - 5) > 0.1 ||
    Math.abs(rotatedAnchor.transform.position.z - 2) > 0.1
  ) {
    failures.push('rotateObjectsWithAnchors unit check failed')
  }

  void anchorPositionsBefore

  return {
    passed: failures.length === 0,
    failures,
  }
}
