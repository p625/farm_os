import {
  FIELD_POSITIONS,
  JOB_WORK_DURATION,
  TRACTOR_HOME,
  TRACTOR_HOME_ROTATION_Y,
  TRACTOR_MOVE_SPEED,
} from '@/config/farm-layout.ts'
import type { FieldSystem } from './FieldSystem.ts'
import { GameSystem } from './GameSystem.ts'
import {
  JobType,
  TractorState,
  type JobType as JobTypeValue,
  type TractorSnapshot,
} from '@/types/tractor.ts'

interface ActiveJob {
  type: JobTypeValue
  fieldId: string
}

interface Vec3 {
  x: number
  y: number
  z: number
}

const ARRIVAL_THRESHOLD = 0.15

export class TractorJobSystem extends GameSystem {
  readonly name = 'TractorJobSystem'
  private readonly fieldSystem: FieldSystem
  private state: TractorState = TractorState.Idle
  private position: Vec3 = { ...TRACTOR_HOME }
  private rotationY = TRACTOR_HOME_ROTATION_Y
  private activeJob: ActiveJob | null = null
  private workTimer = 0
  private workDuration = 1.5
  private onChange: (() => void) | null = null
  private onVisualChange: (() => void) | null = null

  constructor(fieldSystem: FieldSystem) {
    super()
    this.fieldSystem = fieldSystem
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  setOnVisualChange(listener: () => void): void {
    this.onVisualChange = listener
  }

  initialize(): void {
    this.state = TractorState.Idle
    this.position = { ...TRACTOR_HOME }
    this.rotationY = TRACTOR_HOME_ROTATION_Y
    this.activeJob = null
    this.workTimer = 0
    this.notifyChange()
  }

  update(deltaTime: number): void {
    if (this.state === TractorState.Idle) {
      return
    }

    const step = TRACTOR_MOVE_SPEED * deltaTime
    let notifyHud = false

    switch (this.state) {
      case TractorState.MovingToField: {
        const target = this.getFieldPosition(this.activeJob!.fieldId)
        if (this.moveToward(target, step)) {
          this.state = TractorState.Working
          this.workTimer = 0
          this.workDuration = JOB_WORK_DURATION[this.activeJob!.type] ?? 1.5
          notifyHud = true
        }
        break
      }
      case TractorState.Working: {
        this.workTimer += deltaTime
        notifyHud = true
        if (this.workTimer >= this.workDuration) {
          this.applyJob()
          this.state = TractorState.Returning
          notifyHud = true
        }
        break
      }
      case TractorState.Returning: {
        const home = { ...TRACTOR_HOME }
        if (this.moveToward(home, step)) {
          this.rotationY = TRACTOR_HOME_ROTATION_Y
          this.state = TractorState.Idle
          this.activeJob = null
          this.workTimer = 0
          notifyHud = true
        }
        break
      }
    }

    this.onVisualChange?.()
    if (notifyHud) {
      this.notifyChange()
    }
  }

  isBusy(): boolean {
    return this.state !== TractorState.Idle
  }

  enqueuePlow(fieldId: string): boolean {
    return this.enqueueJob(JobType.Plow, fieldId)
  }

  enqueueSeed(fieldId: string): boolean {
    return this.enqueueJob(JobType.Seed, fieldId)
  }

  enqueueHarvest(fieldId: string): boolean {
    return this.enqueueJob(JobType.Harvest, fieldId)
  }

  getPosition(): Readonly<Vec3> {
    return this.position
  }

  getRotationY(): number {
    return this.rotationY
  }

  toSnapshot(): TractorSnapshot {
    const field = this.activeJob
      ? this.fieldSystem.getField(this.activeJob.fieldId)
      : undefined

    return {
      state: this.state,
      activeJob: this.activeJob
        ? {
            type: this.activeJob.type,
            fieldId: this.activeJob.fieldId,
            fieldName: field?.name ?? this.activeJob.fieldId,
          }
        : null,
      workProgress:
        this.state === TractorState.Working
          ? Math.min(1, this.workTimer / this.workDuration)
          : 0,
    }
  }

  dispose(): void {
    this.activeJob = null
    this.onChange = null
    this.onVisualChange = null
  }

  private enqueueJob(type: JobTypeValue, fieldId: string): boolean {
    if (this.isBusy()) {
      return false
    }

    if (!this.canPerformJob(type, fieldId)) {
      return false
    }

    this.activeJob = { type, fieldId }
    this.state = TractorState.MovingToField
    this.workTimer = 0
    this.notifyChange()
    return true
  }

  private canPerformJob(type: JobTypeValue, fieldId: string): boolean {
    switch (type) {
      case JobType.Plow:
        return this.fieldSystem.canPlow(fieldId)
      case JobType.Seed:
        return this.fieldSystem.canSeed(fieldId)
      case JobType.Harvest:
        return this.fieldSystem.canHarvest(fieldId)
      default:
        return false
    }
  }

  private applyJob(): void {
    if (!this.activeJob) {
      return
    }

    const { type, fieldId } = this.activeJob
    switch (type) {
      case JobType.Plow:
        this.fieldSystem.plowField(fieldId)
        break
      case JobType.Seed:
        this.fieldSystem.seedField(fieldId)
        break
      case JobType.Harvest:
        this.fieldSystem.harvestField(fieldId)
        break
    }
  }

  private getFieldPosition(fieldId: string): Vec3 {
    return FIELD_POSITIONS[fieldId] ?? { ...TRACTOR_HOME }
  }

  private moveToward(target: Vec3, step: number): boolean {
    const dx = target.x - this.position.x
    const dz = target.z - this.position.z
    const distance = Math.hypot(dx, dz)

    if (distance <= ARRIVAL_THRESHOLD || distance <= step) {
      this.position.x = target.x
      this.position.y = target.y
      this.position.z = target.z
      return true
    }

    this.position.x += (dx / distance) * step
    this.position.z += (dz / distance) * step
    this.position.y = target.y
    this.rotationY = Math.atan2(dx, dz)
    return false
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}

export function formatTractorState(state: TractorState): string {
  switch (state) {
    case TractorState.Idle:
      return 'Idle'
    case TractorState.MovingToField:
      return 'Moving to field'
    case TractorState.Working:
      return 'Working'
    case TractorState.Returning:
      return 'Returning'
    default:
      return state
  }
}

export function formatJobType(type: JobTypeValue): string {
  switch (type) {
    case JobType.Plow:
      return 'Plow'
    case JobType.Seed:
      return 'Seed wheat'
    case JobType.Harvest:
      return 'Harvest'
    default:
      return type
  }
}
