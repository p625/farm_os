import {
  CORN_COMBINE_HOME,
  CORN_COMBINE_HOME_ROTATION_Y,
  FIELD_POSITIONS,
  GRAIN_COMBINE_HOME,
  GRAIN_COMBINE_HOME_ROTATION_Y,
  JOB_WORK_DURATION,
  TRACTOR_MOVE_SPEED,
} from '@/config/farm-layout.ts'
import { MachineCapability, MachineId, type MachineCommand } from '@/types/machine.ts'
import type { IMachineController } from '@/types/machine-controller.ts'
import type { MachineSaveData } from '@/types/save.ts'
import type { FarmShopSystem } from './FarmShopSystem.ts'
import type { CropSystem } from './CropSystem.ts'
import type { FieldSystem } from './FieldSystem.ts'
import type { MachineCapabilityResolver } from './MachineCapabilityResolver.ts'
import { GrainBin } from './GrainBin.ts'
import { GameSystem } from './GameSystem.ts'
import {
  JobType,
  TractorState,
  type JobType as JobTypeValue,
  type TractorSnapshot,
} from '@/types/tractor.ts'
import type { CommandTask as MachineCommandTask } from '@/types/machine.ts'
import type { GrainBinSnapshot } from '@/types/grain-bin.ts'

interface Vec3 {
  x: number
  y: number
  z: number
}

interface ActiveWork {
  type: JobTypeValue
  fieldId: string
  cropId?: string
}

interface CombineHome {
  position: Vec3
  rotationY: number
}

const ARRIVAL_THRESHOLD = 0.15

export class CombineJobSystem extends GameSystem implements IMachineController {
  readonly name: string
  readonly machineId: MachineId
  private readonly fieldSystem: FieldSystem
  private readonly home: CombineHome
  private cropSystem: CropSystem | null = null
  private farmShopSystem: FarmShopSystem | null = null
  private capabilityResolver: MachineCapabilityResolver | null = null
  private readonly grainBin: GrainBin
  private state: TractorState = TractorState.Idle
  private position: Vec3
  private rotationY: number
  private activeCommand: MachineCommand | null = null
  private moveTarget: Vec3
  private activeWork: ActiveWork | null = null
  private workTimer = 0
  private workDuration = 1.5
  private onChange: (() => void) | null = null
  private onVisualChange: (() => void) | null = null

  constructor(
    fieldSystem: FieldSystem,
    machineId: MachineId,
    home: CombineHome,
    systemName: string,
  ) {
    super()
    this.fieldSystem = fieldSystem
    this.machineId = machineId
    this.home = home
    this.name = systemName
    this.position = { ...home.position }
    this.rotationY = home.rotationY
    this.moveTarget = { ...home.position }
    this.grainBin = new GrainBin()
  }

  setCropSystem(cropSystem: CropSystem): void {
    this.cropSystem = cropSystem
  }

  setFarmShopSystem(farmShopSystem: FarmShopSystem): void {
    this.farmShopSystem = farmShopSystem
  }

  setCapabilityResolver(resolver: MachineCapabilityResolver): void {
    this.capabilityResolver = resolver
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  setOnVisualChange(listener: () => void): void {
    this.onVisualChange = listener
  }

  getCapabilities(): readonly MachineCapability[] {
    return (
      this.capabilityResolver?.getEffectiveCapabilities(this.machineId) ?? [
        MachineCapability.Move,
      ]
    )
  }

  initialize(): void {
    this.state = TractorState.Idle
    this.position = { ...this.home.position }
    this.rotationY = this.home.rotationY
    this.activeCommand = null
    this.moveTarget = { ...this.home.position }
    this.activeWork = null
    this.workTimer = 0
    this.grainBin.restoreFromSave(undefined)
    this.notifyChange()
  }

  applySave(saved: MachineSaveData): void {
    this.state = isMachineState(saved.state) ? saved.state : TractorState.Idle
    this.position = {
      x: saved.position.x,
      y: saved.position.y,
      z: saved.position.z,
    }
    this.rotationY = saved.rotationY
    this.activeCommand = saved.activeCommand
      ? cloneCommand(saved.activeCommand as MachineCommand)
      : null
    this.activeWork = saved.activeWork
      ? parseActiveWork(saved.activeWork)
      : null
    this.workTimer = saved.workTimer
    this.workDuration = saved.workDuration
    this.grainBin.restoreFromSave(saved.grainBin)

    if (this.activeCommand) {
      this.moveTarget = resolveMoveTarget(this.activeCommand, this.position)
      if (this.state !== TractorState.Moving && this.state !== TractorState.Working) {
        this.state = TractorState.Idle
        this.activeCommand = null
        this.activeWork = null
      }
    } else {
      this.activeWork = null
      if (this.state !== TractorState.Idle) {
        this.state = TractorState.Idle
      }
    }

    this.notifyChange()
  }

  toSaveData(): MachineSaveData {
    return {
      machineId: this.machineId,
      position: { ...this.position },
      rotationY: this.rotationY,
      state: this.state,
      activeCommand: this.activeCommand ? cloneCommand(this.activeCommand) : null,
      activeWork: this.activeWork ? { ...this.activeWork } : null,
      workTimer: this.workTimer,
      workDuration: this.workDuration,
      grainBin: this.grainBin.toSaveData(),
    }
  }

  issueCommand(command: MachineCommand): boolean {
    if (this.isBusy()) {
      return false
    }

    const requiredCapability = getRequiredCapability(command.task)
    if (
      requiredCapability &&
      !this.capabilityResolver?.hasEffectiveCapability(
        this.machineId,
        requiredCapability,
      )
    ) {
      return false
    }

    if (!this.validateCommand(command)) {
      return false
    }

    this.activeCommand = cloneCommand(command)
    this.moveTarget = resolveMoveTarget(command, this.position)
    this.activeWork = buildActiveWork(command)
    this.workTimer = 0
    this.state = TractorState.Moving
    this.notifyChange()
    return true
  }

  update(deltaTime: number): void {
    if (this.state === TractorState.Idle) {
      return
    }

    const step = TRACTOR_MOVE_SPEED * this.getSpeedMultiplier() * deltaTime
    let notifyHud = false

    switch (this.state) {
      case TractorState.Moving: {
        if (this.moveToward(this.moveTarget, step)) {
          if (!this.activeWork) {
            this.finishCommand()
            notifyHud = true
          } else {
            this.state = TractorState.Working
            this.workTimer = 0
            this.workDuration = this.getWorkDuration(this.activeWork.type)
            notifyHud = true
          }
        }
        break
      }
      case TractorState.Working: {
        this.workTimer += deltaTime
        notifyHud = true
        if (this.workTimer >= this.workDuration) {
          this.applyWork()
          this.finishCommand()
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

  getPosition(): Readonly<Vec3> {
    return this.position
  }

  getRotationY(): number {
    return this.rotationY
  }

  getGrainBinSnapshot(): GrainBinSnapshot | null {
    return this.grainBin.toSnapshot((cropId) =>
      this.cropSystem?.getCropName(cropId) ?? cropId,
    )
  }

  toSnapshot(): TractorSnapshot {
    const field = this.activeWork
      ? this.fieldSystem.getField(this.activeWork.fieldId)
      : undefined

    return {
      state: this.state,
      position: { ...this.position },
      rotationY: this.rotationY,
      activeJob: this.activeWork
        ? {
            type: this.activeWork.type,
            fieldId: this.activeWork.fieldId,
            fieldName: field?.name ?? this.activeWork.fieldId,
            cropId: this.activeWork.cropId,
            cropName: this.activeWork.cropId
              ? this.cropSystem?.getCropName(this.activeWork.cropId)
              : undefined,
          }
        : null,
      workProgress:
        this.state === TractorState.Working
          ? Math.min(1, this.workTimer / this.workDuration)
          : 0,
    }
  }

  dispose(): void {
    this.activeCommand = null
    this.activeWork = null
    this.onChange = null
    this.onVisualChange = null
    this.cropSystem = null
    this.farmShopSystem = null
    this.capabilityResolver = null
  }

  private finishCommand(): void {
    this.state = TractorState.Idle
    this.activeCommand = null
    this.activeWork = null
    this.workTimer = 0
  }

  private getSpeedMultiplier(): number {
    return this.farmShopSystem?.getTractorSpeedMultiplier() ?? 1
  }

  private getWorkDuration(type: JobTypeValue): number {
    const base = JOB_WORK_DURATION[type] ?? 1.5
    const multiplier = this.farmShopSystem?.getWorkDurationMultiplier() ?? 1
    return base * multiplier
  }

  private validateCommand(command: MachineCommand): boolean {
    switch (command.task.kind) {
      case 'none':
        return command.destination.kind === 'world'
      case 'harvest': {
        if (command.destination.kind !== 'field') {
          return false
        }
        const fieldId = command.destination.fieldId
        if (!this.fieldSystem.canHarvest(fieldId)) {
          return false
        }
        const cropId = this.fieldSystem.getFieldCropId(fieldId)
        if (!cropId || !this.capabilityResolver?.canHarvestCrop(this.machineId, cropId)) {
          return false
        }
        const yieldAmount = this.cropSystem?.getYield(cropId) ?? 0
        return this.grainBin.canAccept(cropId, yieldAmount)
      }
      default:
        return false
    }
  }

  private applyWork(): void {
    if (!this.activeWork || this.activeWork.type !== JobType.Harvest) {
      return
    }

    const result = this.fieldSystem.completeHarvest(this.activeWork.fieldId)
    if (!result) {
      return
    }

    this.grainBin.add(result.cropId, result.yield)
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

export class GrainCombineJobSystem extends CombineJobSystem {
  constructor(fieldSystem: FieldSystem) {
    super(
      fieldSystem,
      MachineId.GrainCombine1,
      {
        position: { ...GRAIN_COMBINE_HOME },
        rotationY: GRAIN_COMBINE_HOME_ROTATION_Y,
      },
      'GrainCombineJobSystem',
    )
  }
}

export class CornCombineJobSystem extends CombineJobSystem {
  constructor(fieldSystem: FieldSystem) {
    super(
      fieldSystem,
      MachineId.CornCombine1,
      {
        position: { ...CORN_COMBINE_HOME },
        rotationY: CORN_COMBINE_HOME_ROTATION_Y,
      },
      'CornCombineJobSystem',
    )
  }
}

function parseActiveWork(
  work: NonNullable<MachineSaveData['activeWork']>,
): ActiveWork | null {
  if (typeof work.fieldId !== 'string') {
    return null
  }

  if (work.type === JobType.Harvest) {
    return { type: JobType.Harvest, fieldId: work.fieldId }
  }

  return null
}

function getRequiredCapability(
  task: MachineCommandTask,
): MachineCapability | null {
  switch (task.kind) {
    case 'none':
      return MachineCapability.Move
    case 'harvest':
      return MachineCapability.Harvest
    default:
      return null
  }
}

function buildActiveWork(command: MachineCommand): ActiveWork | null {
  if (command.task.kind !== 'harvest' || command.destination.kind !== 'field') {
    return null
  }

  return {
    type: JobType.Harvest,
    fieldId: command.destination.fieldId,
  }
}

function resolveMoveTarget(command: MachineCommand, fallback: Vec3): Vec3 {
  switch (command.destination.kind) {
    case 'world':
      return { x: command.destination.x, y: 0, z: command.destination.z }
    case 'field':
      return FIELD_POSITIONS[command.destination.fieldId] ?? { ...fallback }
    default:
      return { ...fallback }
  }
}

function cloneCommand(command: MachineCommand): MachineCommand {
  return structuredClone(command)
}

function isMachineState(value: string): value is TractorState {
  return (
    value === TractorState.Idle ||
    value === TractorState.Moving ||
    value === TractorState.Working
  )
}
