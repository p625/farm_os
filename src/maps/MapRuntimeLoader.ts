import type { Scene } from '@babylonjs/core'
import { spawnRuntimeMachineMesh } from '@rendering/RuntimeMachineMeshBuilder.ts'
import {
  resolveRuntimeMachineSpawns,
  type RuntimeMachineSpawn,
} from '@/maps/resolveRuntimeMachineSpawns.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'

/**
 * Spawns gameplay-ready machine meshes from Studio map data.
 * Studio map data is the single source of truth for machine placement.
 */
export function loadRuntimeMachines(
  scene: Scene,
  worldMap: WorldMapDocument,
): readonly RuntimeMachineSpawn[] {
  const spawns = resolveRuntimeMachineSpawns(worldMap)

  for (const spawn of spawns) {
    spawnRuntimeMachineMesh(scene, spawn)
  }

  return spawns
}
