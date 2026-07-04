import { NullEngine, Scene } from '@babylonjs/core'
import { MACHINE_CATALOG } from '@/config/machine-catalog.ts'
import { SaveGameService } from '@game/SaveGameService.ts'
import { FarmSceneBuilder } from '@rendering/FarmSceneBuilder.ts'
import { AttachmentPresentation } from '@rendering/AttachmentPresentation.ts'
import { AttachmentSystem } from '@systems/AttachmentSystem.ts'
import { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import { buildMapRuntimeContext } from '@/maps/MapPackageLoader.ts'
import {
  captureRuntimeSceneSnapshot,
  exportGameplayPlacementTestPackage,
  countGameplayAnchorGizmoMeshes,
} from '@/maps/GameplayPlacementSelfCheck.ts'
import {
  hasStudioMachinePlacements,
  resolveRuntimeMachineSpawns,
} from '@/maps/resolveRuntimeMachineSpawns.ts'
import { resolveRuntimeAttachmentSpawns } from '@/maps/resolveRuntimeAttachmentSpawns.ts'
import { setActiveMapContext } from '@/maps/MapRuntimeContext.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'

export interface RuntimeDuplicationReport {
  machineSpawns: number
  attachmentSpawns: number
  saveMachineCount: number
  saveAttachmentCount: number
  legacyFallbackUsed: boolean
  scene: {
    tractorNodeCount: number
    combineNodeCount: number
    attachmentNodeCount: number
    gameplayAnchorMeshCount: number
    duplicateMachineNodes: string[]
    duplicateAttachmentNodes: string[]
  }
  studioDebugAnchorMeshCount: number
  passed: boolean
  failures: string[]
}

function countStudioMachines(map: WorldMapDocument): number {
  return map.objects.filter((object) => {
    if (object.layer !== 'vehicles') {
      return false
    }
    const props = parseVehiclePlacementProperties(object.properties)
    return Boolean(
      props &&
        props.placementKind !== 'attachment' &&
        (props.machineId || props.placementKind === 'machine'),
    )
  }).length
}

function countStudioAttachments(map: WorldMapDocument): number {
  return map.objects.filter((object) => {
    if (object.layer !== 'vehicles') {
      return false
    }
    const props = parseVehiclePlacementProperties(object.properties)
    return props?.placementKind === 'attachment'
  }).length
}

function findDuplicateNodeNames(
  scene: Scene,
  names: readonly string[],
): string[] {
  const duplicates: string[] = []
  for (const name of names) {
    const count = scene.transformNodes.filter((node) => node.name === name).length
    if (count > 1) {
      duplicates.push(`${name}×${count}`)
    }
  }
  return duplicates
}

function findDuplicateAttachmentRoots(scene: Scene): string[] {
  const counts = new Map<string, number>()
  for (const node of scene.transformNodes) {
    if (!node.name.startsWith('attachment_')) {
      continue
    }
    counts.set(node.name, (counts.get(node.name) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name, count]) => `${name}×${count}`)
}

export function runGameplayRuntimeDuplicationCheck(
  map: WorldMapDocument,
): RuntimeDuplicationReport {
  const failures: string[] = []
  const machineSpawns = resolveRuntimeMachineSpawns(map)
  const attachmentSpawns = resolveRuntimeAttachmentSpawns(map)
  const studioMachines = countStudioMachines(map)
  const studioAttachments = countStudioAttachments(map)
  const studioMachinePlacements = hasStudioMachinePlacements(map)

  const legacyFallbackUsed =
    studioMachinePlacements && machineSpawns.length !== studioMachines

  if (legacyFallbackUsed) {
    failures.push(
      `Legacy hub machine fallback active: ${studioMachines} Studio machine(s) but ${machineSpawns.length} runtime spawn(s)`,
    )
  }

  if (studioAttachments > 0 && attachmentSpawns.length !== studioAttachments) {
    failures.push(
      `Attachment resolver mismatch: ${studioAttachments} Studio attachment(s) but ${attachmentSpawns.length} runtime spawn(s)`,
    )
  }

  const exported = exportGameplayPlacementTestPackage(map)
  setActiveMapContext(
    buildMapRuntimeContext(exported.packageData, {
      packageData: exported.packageData,
      worldMap: map,
    }),
  )

  const save = new SaveGameService().createDefaultSave(map.id, 'E2E Regression')
  const saveMachineCount = Object.keys(save.machines).length
  const saveAttachmentCount = save.attachments.items.length

  if (studioMachinePlacements && saveMachineCount !== machineSpawns.length) {
    failures.push(
      `Save bootstrap machine count ${saveMachineCount} does not match runtime spawns ${machineSpawns.length}`,
    )
  }

  if (studioAttachments > 0 && saveAttachmentCount !== attachmentSpawns.length) {
    failures.push(
      `Save bootstrap attachment count ${saveAttachmentCount} does not match runtime spawns ${attachmentSpawns.length}`,
    )
  }

  const engine = new NullEngine({
    renderWidth: 1,
    renderHeight: 1,
    textureSize: 1,
    deterministicLockstep: true,
    lockstepMaxSteps: 4,
  })

  const gameScene = new Scene(engine)
  new FarmSceneBuilder().build(gameScene)

  const attachmentSystem = new AttachmentSystem()
  attachmentSystem.initialize()
  attachmentSystem.applySave(save.attachments)
  const attachmentPresentation = new AttachmentPresentation()
  attachmentPresentation.attach(gameScene, attachmentSystem)

  const sceneSnapshot = captureRuntimeSceneSnapshot(gameScene)

  const machineNodeNames = MACHINE_CATALOG.map((entry) => entry.sceneNodeName)
  const duplicateMachineNodes = findDuplicateNodeNames(gameScene, machineNodeNames)
  if (duplicateMachineNodes.length > 0) {
    failures.push(
      `Duplicate machine scene nodes: ${duplicateMachineNodes.join(', ')}`,
    )
  }

  const duplicateAttachmentNodes = findDuplicateAttachmentRoots(gameScene)
  if (duplicateAttachmentNodes.length > 0) {
    failures.push(
      `Duplicate attachment scene nodes: ${duplicateAttachmentNodes.join(', ')}`,
    )
  }

  if (sceneSnapshot.gameplayAnchorMeshCount > 0) {
    failures.push(
      `Runtime scene exposes ${sceneSnapshot.gameplayAnchorMeshCount} gameplay anchor gizmo mesh(es) outside Studio debug mode`,
    )
  }

  if (studioMachines > 0 && sceneSnapshot.tractorNodeCount + sceneSnapshot.combineNodeCount > machineSpawns.length) {
    failures.push(
      `More machine nodes in scene (${sceneSnapshot.tractorNodeCount + sceneSnapshot.combineNodeCount}) than runtime spawns (${machineSpawns.length})`,
    )
  }

  if (
    studioAttachments > 0 &&
    sceneSnapshot.attachmentNodeCount !== attachmentSpawns.length
  ) {
    failures.push(
      `Attachment scene nodes (${sceneSnapshot.attachmentNodeCount}) do not match runtime spawns (${attachmentSpawns.length})`,
    )
  }

  const studioScene = new Scene(engine)
  const mapSceneBuilder = new MapSceneBuilder()
  mapSceneBuilder.build(studioScene, map, { renderGameplayAnchors: true })
  const studioDebugAnchorMeshCount = countGameplayAnchorGizmoMeshes(studioScene)

  if (studioDebugAnchorMeshCount === 0) {
    failures.push(
      'Studio debug mode did not render anchor gizmos — Gameplay Debug layer may be broken',
    )
  }

  const runtimeOnlyScene = new Scene(engine)
  mapSceneBuilder.build(runtimeOnlyScene, map, { renderGameplayAnchors: false })
  const runtimeAnchorMeshes = countGameplayAnchorGizmoMeshes(runtimeOnlyScene)
  if (runtimeAnchorMeshes > 0) {
    failures.push(
      `MapSceneBuilder with renderGameplayAnchors:false still created ${runtimeAnchorMeshes} anchor gizmo mesh(es)`,
    )
  }

  gameScene.dispose()
  studioScene.dispose()
  runtimeOnlyScene.dispose()
  attachmentPresentation.detach()
  attachmentSystem.dispose()
  engine.dispose()
  setActiveMapContext(null)

  return {
    machineSpawns: machineSpawns.length,
    attachmentSpawns: attachmentSpawns.length,
    saveMachineCount,
    saveAttachmentCount,
    legacyFallbackUsed,
    scene: {
      ...sceneSnapshot,
      duplicateMachineNodes,
      duplicateAttachmentNodes,
    },
    studioDebugAnchorMeshCount,
    passed: failures.length === 0,
    failures,
  }
}
