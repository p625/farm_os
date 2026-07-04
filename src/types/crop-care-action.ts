export const CropCareAction = {
  Fertilize: 'fertilize',
  Spray: 'spray',
} as const

export type CropCareAction =
  (typeof CropCareAction)[keyof typeof CropCareAction]
