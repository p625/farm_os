export type SunProfileId = 'morning' | 'noon' | 'afternoon'

export type SkyProfileId = 'june_noon_central_europe'

export type BiomeAmbientProfileId = 'meadow' | 'forest' | 'roadside'

export interface RgbTriplet {
  readonly r: number
  readonly g: number
  readonly b: number
}

export interface SkyGradientConfig {
  zenithColor: readonly [number, number, number]
  horizonColor: readonly [number, number, number]
  gradientPower: number
  horizonSoftness: number
}

export interface SkyProfileDefinition {
  id: SkyProfileId
  displayName: string
  enabled: boolean
  sunElevationDegrees: number
  sunAzimuthDegrees: number
  gradient: SkyGradientConfig
  hazeIntensity: number
  ambientTint: readonly [number, number, number]
}

export interface AtmosphericHazeConfig {
  enabled: boolean
  color: readonly [number, number, number]
  start: number
  end: number
  contrastReduction: number
}

export interface DistanceColorConfig {
  enabled: boolean
  nearDistance: number
  farDistance: number
  horizonBlend: number
  saturationFalloff: number
}

export interface AtmosphereConfig {
  haze: AtmosphericHazeConfig
  distanceColor: DistanceColorConfig
}

export interface SunLightRigConfig {
  intensity: number
  diffuse: readonly [number, number, number]
  specular: readonly [number, number, number]
  direction: readonly [number, number, number]
  position: readonly [number, number, number]
}

export interface SunHemisphericRigConfig {
  intensity: number
  diffuse: readonly [number, number, number]
  groundColor: readonly [number, number, number]
  direction: readonly [number, number, number]
}

export interface SunProfileDefinition {
  id: SunProfileId
  displayName: string
  enabled: boolean
  sunElevationDegrees: number
  sunAzimuthDegrees: number
  directional: SunLightRigConfig
  hemispheric: SunHemisphericRigConfig
  ambientTint: readonly [number, number, number]
  exposureBias: number
}

export interface BiomeAmbientProfileDefinition {
  id: BiomeAmbientProfileId
  displayName: string
  tint: readonly [number, number, number]
  weight: number
}

export interface GlobalAmbientProfileDefinition {
  id: string
  displayName: string
  color: readonly [number, number, number]
  biomeProfiles: readonly BiomeAmbientProfileId[]
}

export interface SkySystemConfig {
  enabled: boolean
  activeSkyProfileId: SkyProfileId
  activeSunProfileId: SunProfileId
  domeDiameter: number
  domeSegments: number
}

export interface SkyRuntimeState {
  skyProfileId: SkyProfileId
  sunProfileId: SunProfileId
  hazeIntensity: number
  hazeStart: number
  hazeEnd: number
  ambientColor: readonly [number, number, number]
  zenithColor: readonly [number, number, number]
  horizonColor: readonly [number, number, number]
}
