import { getActiveFarmHub, getActiveWorldBounds, getActiveWorldCenter } from '@/config/farm-layout.ts'
import { tryGetActiveMapContext } from '@/maps/MapRuntimeContext.ts'

export type CameraProfileId = 'overview'

export interface CameraProfile {
  id: CameraProfileId
  alpha: number
  beta: number
  radius: number
  target: { x: number; y: number; z: number }
  lowerRadiusLimit: number
  upperRadiusLimit: number
  lowerBetaLimit: number
  upperBetaLimit: number
  wheelPrecision: number
  panningSensibility: number
}

const LEGACY_MAP_SPAN_METERS = 140

function resolveMapSpanMeters(): number {
  const bounds = getActiveWorldBounds()
  return Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ)
}

function resolveMapCameraScale(): number {
  return Math.max(1, resolveMapSpanMeters() / LEGACY_MAP_SPAN_METERS)
}

function resolveFarmLookAt(): { x: number; y: number; z: number } {
  const hub = getActiveFarmHub()
  const worldCenter = getActiveWorldCenter()
  return {
    x: (hub.barn.position.x + worldCenter.x) / 2,
    y: hub.barn.position.y ?? 0,
    z: (hub.barn.position.z + worldCenter.z) / 2,
  }
}

function applyMapScaleToProfile(profile: CameraProfile): CameraProfile {
  const scale = resolveMapCameraScale()
  if (scale <= 1) {
    return profile
  }

  const span = resolveMapSpanMeters()
  return {
    ...profile,
    lowerRadiusLimit: Math.max(12, profile.lowerRadiusLimit * Math.min(scale, 4)),
    upperRadiusLimit: Math.min(
      Math.max(profile.upperRadiusLimit * scale, span * 0.08),
      span * 0.45,
    ),
    panningSensibility: profile.panningSensibility * Math.sqrt(scale),
  }
}

const STATIC_CAMERA_PROFILES: Record<CameraProfileId, CameraProfile> = {
  overview: {
    id: 'overview',
    alpha: -Math.PI / 4,
    beta: 1.05,
    radius: 94,
    target: resolveFarmLookAt(),
    lowerRadiusLimit: 24,
    upperRadiusLimit: 140,
    lowerBetaLimit: 0.15,
    upperBetaLimit: Math.PI / 2.2,
    wheelPrecision: 12,
    panningSensibility: 80,
  },
}

export const CAMERA_PROFILES = STATIC_CAMERA_PROFILES

export const DEFAULT_CAMERA_PROFILE_ID: CameraProfileId = 'overview'

export function getCameraProfile(
  id: CameraProfileId = DEFAULT_CAMERA_PROFILE_ID,
): CameraProfile {
  const context = tryGetActiveMapContext()
  const exported = context?.cameraProfiles.find((profile) => profile.id === id)
    ?? context?.cameraProfiles[0]
  if (exported) {
    const base = STATIC_CAMERA_PROFILES[id]
    return applyMapScaleToProfile({
      ...base,
      id,
      alpha: exported.alpha,
      beta: exported.beta,
      radius: exported.radius,
      target: {
        x: exported.targetOffset.x,
        y: exported.targetOffset.y ?? 0,
        z: exported.targetOffset.z,
      },
    })
  }

  const base = STATIC_CAMERA_PROFILES[id]
  return applyMapScaleToProfile({
    ...base,
    target: resolveFarmLookAt(),
  })
}
