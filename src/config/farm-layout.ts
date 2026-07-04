import { FIELD_CATALOG } from '@/config/field-catalog.ts'

export const TRACTOR_HOME = {
  x: 6,
  y: 0,
  z: 10,
} as const

export const TRACTOR_HOME_ROTATION_Y = -Math.PI / 6

export const GRAIN_COMBINE_HOME = {
  x: 22,
  y: 0,
  z: 10,
} as const

export const CORN_COMBINE_HOME = {
  x: 30,
  y: 0,
  z: 10,
} as const

export const GRAIN_COMBINE_HOME_ROTATION_Y = -Math.PI / 6
export const CORN_COMBINE_HOME_ROTATION_Y = -Math.PI / 6

export const EQUIPMENT_YARD_SPAWN_POSITIONS: Record<
  string,
  { x: number; y: number; z: number }
> = {
  plow_1: { x: 10, y: 0, z: 24 },
  seeder_1: { x: 18, y: 0, z: 24 },
  trailer_1: { x: 26, y: 0, z: 24 },
  grain_header_1: { x: 12, y: 0, z: 30 },
  corn_header_1: { x: 24, y: 0, z: 30 },
}

export const ATTACHMENT_SLOT_OFFSETS: Record<
  string,
  { x: number; y: number; z: number }
> = {
  front_hitch: { x: 0, y: 0.3, z: 2.2 },
  rear_hitch: { x: 0, y: 0.25, z: -1.8 },
  trailer_hitch: { x: 0, y: 0.4, z: -3.8 },
  header_slot: { x: 0, y: 0.35, z: 2.5 },
}

export const DETACH_OFFSET = { x: 2.5, y: 0, z: 0 } as const

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
