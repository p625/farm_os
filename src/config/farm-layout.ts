export const TRACTOR_HOME = {
  x: 6,
  y: 0,
  z: 10,
} as const

export const TRACTOR_HOME_ROTATION_Y = -Math.PI / 6

export const FIELD_DEFINITIONS = [
  { id: 'field_1', name: 'North Field' },
  { id: 'field_2', name: 'Center Field' },
  { id: 'field_3', name: 'South Field' },
] as const

export const FIELD_POSITIONS: Record<string, { x: number; y: number; z: number }> =
  {
    field_1: { x: -12, y: 0, z: -4 },
    field_2: { x: 0, y: 0, z: -4 },
    field_3: { x: 12, y: 0, z: -4 },
  }

export const TRACTOR_MOVE_SPEED = 10

export const JOB_WORK_DURATION: Record<string, number> = {
  plow: 1.5,
  seed: 1.2,
  harvest: 2,
}
