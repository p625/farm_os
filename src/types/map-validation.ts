import type { StudioLayerId } from '@/types/world-map.ts'

export type MapValidationSeverity = 'error' | 'warn' | 'info'

export interface MapValidationIssue {
  id: string
  ruleId: string
  severity: MapValidationSeverity
  message: string
  objectId?: string
  layer?: StudioLayerId
  position?: { x: number; y: number; z: number }
}

export interface MapValidationReport {
  runAt: string
  issueCount: number
  errorCount: number
  warnCount: number
  infoCount: number
  issues: MapValidationIssue[]
  /** True when there are no error-level issues. */
  passed: boolean
}

export const EMPTY_MAP_VALIDATION_REPORT: MapValidationReport = {
  runAt: '',
  issueCount: 0,
  errorCount: 0,
  warnCount: 0,
  infoCount: 0,
  issues: [],
  passed: true,
}
