export const TractorState = {
  Idle: 'idle',
  Moving: 'moving',
  Working: 'working',
} as const

export type TractorState = (typeof TractorState)[keyof typeof TractorState]

export const JobType = {
  Plow: 'plow',
  Seed: 'seed',
  Harvest: 'harvest',
  Fertilize: 'fertilize',
  Spray: 'spray',
} as const

export type JobType = (typeof JobType)[keyof typeof JobType]

export interface TractorJobSnapshot {
  type: JobType
  fieldId: string
  fieldName: string
  cropId?: string
  cropName?: string
}

export interface TractorSnapshot {
  state: TractorState
  activeJob: TractorJobSnapshot | null
  activeLogisticsLabel: string | null
  workProgress: number
  position: { x: number; y: number; z: number }
  rotationY: number
}
