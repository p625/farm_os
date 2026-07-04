import {
  getCornCombineHome,
  getCornCombineHomeRotationY,
  getGrainCombineHome,
  getGrainCombineHomeRotationY,
  getTractorHome,
  getTractorHomeRotationY,
} from '@/config/farm-layout.ts'
import { getGroundedPosition } from '@/maps/grounding.ts'
import { tryGetActiveMapContext } from '@/maps/MapRuntimeContext.ts'
import { getRuntimeMachineSpawn } from '@/maps/resolveRuntimeMachineSpawns.ts'
import { MachineId } from '@/types/machine.ts'

export interface MachineHome {
  position: { x: number; y: number; z: number }
  rotationY: number
}

export function resolveMachineHome(machineId: MachineId): MachineHome {
  const worldMap = tryGetActiveMapContext()?.worldMap
  if (worldMap) {
    const spawn = getRuntimeMachineSpawn(worldMap, machineId)
    if (spawn) {
      return {
        position: { ...spawn.position },
        rotationY: spawn.rotationY,
      }
    }
  }

  if (machineId === MachineId.Tractor1) {
    const home = getTractorHome()
    return {
      position: getGroundedPosition(home.x, home.z),
      rotationY: getTractorHomeRotationY(),
    }
  }

  if (machineId === MachineId.GrainCombine1) {
    const home = getGrainCombineHome()
    return {
      position: getGroundedPosition(home.x, home.z),
      rotationY: getGrainCombineHomeRotationY(),
    }
  }

  if (machineId === MachineId.CornCombine1) {
    const home = getCornCombineHome()
    return {
      position: getGroundedPosition(home.x, home.z),
      rotationY: getCornCombineHomeRotationY(),
    }
  }

  const tractorHome = getTractorHome()
  return {
    position: getGroundedPosition(tractorHome.x, tractorHome.z),
    rotationY: getTractorHomeRotationY(),
  }
}
