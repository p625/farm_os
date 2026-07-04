import type { RoadKind } from '@/types/road.ts'

export interface RoadTypeDefinition {
  id: RoadKind
  label: string
  width: number
  color: readonly [number, number, number]
}

export const ROAD_TYPES: readonly RoadTypeDefinition[] = [
  {
    id: 'asphalt_wide',
    label: 'Široká asfaltová',
    width: 8,
    color: [0.34, 0.34, 0.37],
  },
  {
    id: 'asphalt_narrow',
    label: 'Úzká asfaltová',
    width: 4.5,
    color: [0.3, 0.3, 0.33],
  },
  {
    id: 'field_path',
    label: 'Úzká polní',
    width: 2.5,
    color: [0.45, 0.4, 0.32],
  },
] as const

export function getRoadTypeDefinition(kind: RoadKind): RoadTypeDefinition {
  return ROAD_TYPES.find((entry) => entry.id === kind) ?? ROAD_TYPES[0]
}
