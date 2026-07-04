import { FieldRadialActionKind } from '@/types/machine.ts'

export function getFieldWorkTaskLabel(taskKind: FieldRadialActionKind): string {
  switch (taskKind) {
    case FieldRadialActionKind.Plow:
      return 'Plow'
    case FieldRadialActionKind.Seed:
      return 'Seed'
    case FieldRadialActionKind.Harvest:
      return 'Harvest'
    case FieldRadialActionKind.Fertilize:
      return 'Fertilize'
    case FieldRadialActionKind.Spray:
      return 'Spray'
    default:
      return 'Work'
  }
}
