import { getWorldCenter } from '@/config/map-01-layout.ts'
import { FARM_HUB } from '@/config/map-01-layout.ts'

export type CameraProfileId = 'overview'

export interface CameraProfile {
  id: CameraProfileId
  alpha: number
  beta: number
  radius: number
  target: { x: number; y: number; z: number }
  lowerRadiusLimit: number
  upperRadiusLimit: number
  wheelPrecision: number
  panningSensibility: number
}

const worldCenter = getWorldCenter()
const farmLookAt = {
  x: (FARM_HUB.barn.position.x + worldCenter.x) / 2,
  y: 0,
  z: (FARM_HUB.barn.position.z + worldCenter.z) / 2,
}

/**
 * Named camera profiles. Only `overview` is implemented in Phase 14.
 * Future profiles (field focus, machine follow) will be added without
 * changing the controller architecture.
 */
export const CAMERA_PROFILES: Record<CameraProfileId, CameraProfile> = {
  overview: {
    id: 'overview',
    alpha: -Math.PI / 4,
    beta: 1.05,
    radius: 72,
    target: farmLookAt,
    lowerRadiusLimit: 20,
    upperRadiusLimit: 110,
    wheelPrecision: 12,
    panningSensibility: 80,
  },
}

export const DEFAULT_CAMERA_PROFILE_ID: CameraProfileId = 'overview'

export function getCameraProfile(
  id: CameraProfileId = DEFAULT_CAMERA_PROFILE_ID,
): CameraProfile {
  return CAMERA_PROFILES[id]
}
