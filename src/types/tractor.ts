export const TractorState = {
  Idle: 'idle',
  MovingToField: 'moving_to_field',
  Working: 'working',
  Returning: 'returning',
} as const

export type TractorState = (typeof TractorState)[keyof typeof TractorState]

export const JobType = {
  Plow: 'plow',
  Seed: 'seed',
  Harvest: 'harvest',
} as const

export type JobType = (typeof JobType)[keyof typeof JobType]

export interface TractorJobSnapshot {
  type: JobType
  fieldId: string
  fieldName: string
}

export interface TractorSnapshot {
  state: TractorState
  activeJob: TractorJobSnapshot | null
  workProgress: number
}
