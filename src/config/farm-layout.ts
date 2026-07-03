import { FIELD_CATALOG } from '@/config/field-catalog.ts'

export const TRACTOR_HOME = {
  x: 6,
  y: 0,
  z: 10,
} as const

export const TRACTOR_HOME_ROTATION_Y = -Math.PI / 6

export const FIELD_DEFINITIONS = FIELD_CATALOG.map(({ id, name }) => ({
  id,
  name,
}))

export const FIELD_POSITIONS: Record<string, { x: number; y: number; z: number }> =
  {
    field_1: { x: -12, y: 0, z: -4 },
    field_2: { x: 0, y: 0, z: -4 },
    field_3: { x: 12, y: 0, z: -4 },
    field_4: { x: 24, y: 0, z: -4 },
    field_5: { x: -24, y: 0, z: -4 },
    field_6: { x: 0, y: 0, z: -18 },
  }

export const TRACTOR_MOVE_SPEED = 10

export const JOB_WORK_DURATION: Record<string, number> = {
  plow: 1.5,
  seed: 1.2,
  harvest: 2,
}
