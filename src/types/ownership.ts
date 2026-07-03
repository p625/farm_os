export const FieldOwnership = {
  Owned: 'owned',
  Available: 'available',
  Leased: 'leased',
} as const

export type FieldOwnership =
  (typeof FieldOwnership)[keyof typeof FieldOwnership]
