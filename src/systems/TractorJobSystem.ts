import {
  getFieldPositions,
  getScaledFieldWorkDuration,
  getTractorHome,
  getTractorHomeRotationY,
  TRACTOR_MOVE_SPEED,
} from '@/config/farm-layout.ts'
import { getGroundedPosition, getTerrainHeightAt } from '@/maps/grounding.ts'
import { resolveMachineHome } from '@/maps/resolveMachineHome.ts'
import { getScaledCropCareWorkDuration } from '@/config/crop-care-balance.ts'
import { CropCareAction } from '@/types/crop-care.ts'
import type { MachineCapabilityResolver } from './MachineCapabilityResolver.ts'
import type { LogisticsSystem } from './LogisticsSystem.ts'
import type { MachineRegistry } from './MachineRegistry.ts'
import {
  applyLogisticsWork,
  formatLogisticsTaskLabel,
  getLogisticsRequiredCapability,
  getLogisticsWorkDuration,
  isLogisticsTask,
  resolveLogisticsMoveTarget,
  validateLogisticsCommand,
} from './MachineLogisticsSupport.ts'
import { MachineCapability, MachineId, type MachineCommand } from '@/types/machine.ts'
import type { IMachineController } from '@/types/machine-controller.ts'
import type { MachineSaveData } from '@/types/save.ts'
import type { FarmShopSystem } from './FarmShopSystem.ts'
import type { CropSystem } from './CropSystem.ts'
import type { FieldSystem } from './FieldSystem.ts'
import { GameSystem } from './GameSystem.ts'
import {
  JobType,
  TractorState,
  type JobType as JobTypeValue,
  type TractorSnapshot,
} from '@/types/tractor.ts'
import type { CommandTask as MachineCommandTask } from '@/types/machine.ts'

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

const ARRIVAL_THRESHOLD = 0.15

export class TractorJobSystem extends GameSystem implements IMachineController {
  readonly name: string
  readonly machineId: MachineId
  private readonly fieldSystem: FieldSystem
  private cropSystem: CropSystem | null = null
  private farmShopSystem: FarmShopSystem | null = null
  private state: TractorState = TractorState.Idle
  private position: Vec3 = { x: 0, y: 0, z: 0 }
  private rotationY = 0
  private activeCommand: MachineCommand | null = null
  private moveTarget: Vec3 = { x: 0, y: 0, z: 0 }
  private activeWork: ActiveWork | null = null
  private workTimer = 0
  private workDuration = 1.5
  private capabilityResolver: MachineCapabilityResolver | null = null
  private logisticsSystem: LogisticsSystem | null = null
  private machineRegistry: MachineRegistry | null = null
  private onChange: (() => void) | null = null
  private onVisualChange: (() => void) | null = null

  constructor(
    fieldSystem: FieldSystem,
    machineId: MachineId = MachineId.Tractor1,
    home: Vec3 = getTractorHome(),
    rotationY: number = getTractorHomeRotationY(),
  ) {
    super()
    this.fieldSystem = fieldSystem
    this.machineId = machineId
    this.name = `TractorJobSystem:${machineId}`
    this.position = { ...home }
    this.rotationY = rotationY
    this.moveTarget = { ...home }
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

  setLogisticsSystem(logisticsSystem: LogisticsSystem): void {
    this.logisticsSystem = logisticsSystem
  }

  setMachineRegistry(registry: MachineRegistry): void {
    this.machineRegistry = registry
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
        MachineCapability.Tow,
      ]
    )
  }

  initialize(): void {
    this.state = TractorState.Idle
    if (this.machineId === MachineId.Tractor1) {
      const home = resolveMachineHome(MachineId.Tractor1)
      this.position = { ...home.position }
      this.rotationY = home.rotationY
      this.moveTarget = { ...home.position }
    }
    this.activeCommand = null
    this.activeWork = null
    this.workTimer = 0
    this.notifyChange()
  }

  applySave(saved: MachineSaveData): void {
    this.state = isTractorState(saved.state) ? saved.state : TractorState.Idle
    const grounded = getGroundedPosition(saved.position.x, saved.position.z)
    const position =
      Math.abs(saved.position.y - grounded.y) <= 1.5
        ? saved.position
        : grounded
    this.position = {
      x: position.x,
      y: position.y,
      z: position.z,
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

    if (this.activeCommand) {
      this.moveTarget = resolveMoveTarget(
        this.activeCommand,
        this.position,
        this.machineRegistry,
      )
      if (this.state === TractorState.Moving) {
        // keep moving
      } else if (
        this.state === TractorState.Working &&
        (this.activeWork ||
          (this.activeCommand && isLogisticsTask(this.activeCommand.task)))
      ) {
        // keep working
      } else {
        this.state = TractorState.Idle
        this.activeCommand = null
        this.activeWork = null
      }

      if (
        this.activeCommand &&
        isLogisticsTask(this.activeCommand.task) &&
        !validateLogisticsCommand(
          this.machineId,
          this.activeCommand,
          this.logisticsSystem,
        )
      ) {
        this.finishCommand()
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
    this.moveTarget = resolveMoveTarget(
      command,
      this.position,
      this.machineRegistry,
    )
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

    const step = TRACTOR_MOVE_SPEED * this.getTractorSpeedMultiplier() * deltaTime
    let notifyHud = false

    switch (this.state) {
      case TractorState.Moving: {
        if (this.moveToward(this.moveTarget, step)) {
          if (this.isLogisticsCommand()) {
            this.state = TractorState.Working
            this.workTimer = 0
            this.workDuration = getLogisticsWorkDuration(this.activeCommand!.task)
            notifyHud = true
          } else if (!this.activeWork) {
            this.finishCommand()
            notifyHud = true
          } else {
            this.state = TractorState.Working
            this.workTimer = 0
            this.workDuration = this.getWorkDuration(
              this.activeWork.type,
              this.activeWork.fieldId,
            )
            notifyHud = true
          }
        }
        break
      }
      case TractorState.Working: {
        this.workTimer += deltaTime
        notifyHud = true
        if (this.workTimer >= this.workDuration) {
          if (this.isLogisticsCommand()) {
            this.applyLogistics()
          } else if (this.activeWork) {
            this.applyWork()
          }
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

  cancelActiveCommand(): void {
    if (this.state === TractorState.Idle) {
      return
    }
    this.finishCommand()
    this.notifyChange()
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
      activeLogisticsLabel:
        this.state === TractorState.Working && this.isLogisticsCommand()
          ? formatLogisticsTaskLabel(this.activeCommand)
          : null,
      workProgress:
        this.state === TractorState.Working
          ? Math.min(1, this.workTimer / this.workDuration)
          : 0,
      workRemainingSeconds:
        this.state === TractorState.Working
          ? Math.max(0, this.workDuration - this.workTimer)
          : null,
    }
  }

  dispose(): void {
    this.activeCommand = null
    this.activeWork = null
    this.onChange = null
    this.onVisualChange = null
    this.cropSystem = null
    this.farmShopSystem = null
  }

  private finishCommand(): void {
    this.state = TractorState.Idle
    this.activeCommand = null
    this.activeWork = null
    this.workTimer = 0
  }

  private getTractorSpeedMultiplier(): number {
    return this.farmShopSystem?.getTractorSpeedMultiplier() ?? 1
  }

  private getWorkDuration(type: JobTypeValue, fieldId: string): number {
    const multiplier = this.farmShopSystem?.getWorkDurationMultiplier() ?? 1
    if (type === JobType.Fertilize) {
      return getScaledCropCareWorkDuration(
        CropCareAction.Fertilize,
        fieldId,
        multiplier,
      )
    }
    if (type === JobType.Spray) {
      return getScaledCropCareWorkDuration(
        CropCareAction.Spray,
        fieldId,
        multiplier,
      )
    }
    return getScaledFieldWorkDuration(type, fieldId, multiplier)
  }

  private validateCommand(command: MachineCommand): boolean {
    if (isLogisticsTask(command.task)) {
      return validateLogisticsCommand(
        this.machineId,
        command,
        this.logisticsSystem,
      )
    }

    switch (command.task.kind) {
      case 'none':
        return command.destination.kind === 'world'
      case 'plow':
        return (
          command.destination.kind === 'field' &&
          this.fieldSystem.canPlow(command.destination.fieldId)
        )
      case 'seed':
        return (
          command.destination.kind === 'field' &&
          this.fieldSystem.canSeed(
            command.destination.fieldId,
            command.task.cropId,
          )
        )
      case 'harvest':
        return (
          command.destination.kind === 'field' &&
          this.fieldSystem.canHarvest(command.destination.fieldId)
        )
      case 'fertilize':
        return (
          command.destination.kind === 'field' &&
          this.fieldSystem.canFertilize(command.destination.fieldId)
        )
      case 'spray':
        return (
          command.destination.kind === 'field' &&
          this.fieldSystem.canSpray(command.destination.fieldId)
        )
      default:
        return false
    }
  }

  private isLogisticsCommand(): boolean {
    return this.activeCommand ? isLogisticsTask(this.activeCommand.task) : false
  }

  private applyLogistics(): void {
    if (!this.activeCommand) {
      return
    }
    applyLogisticsWork(this.machineId, this.activeCommand, this.logisticsSystem)
  }

  private applyWork(): void {
    if (!this.activeWork) {
      return
    }

    const { type, fieldId, cropId } = this.activeWork
    switch (type) {
      case JobType.Plow:
        this.fieldSystem.plowField(fieldId)
        break
      case JobType.Seed:
        if (cropId) {
          this.fieldSystem.seedField(fieldId, cropId)
        }
        break
      case JobType.Harvest:
        this.fieldSystem.harvestField(fieldId)
        break
      case JobType.Fertilize:
        this.fieldSystem.fertilizeField(fieldId)
        break
      case JobType.Spray:
        this.fieldSystem.sprayField(fieldId)
        break
    }
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
    this.position.y = getTerrainHeightAt(this.position.x, this.position.z)
    this.rotationY = Math.atan2(dx, dz)
    return false
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}

function parseActiveWork(
  work: NonNullable<MachineSaveData['activeWork']>,
): ActiveWork | null {
  if (typeof work.fieldId !== 'string') {
    return null
  }

  if (work.type === JobType.Plow) {
    return { type: JobType.Plow, fieldId: work.fieldId }
  }
  if (work.type === JobType.Seed && typeof work.cropId === 'string') {
    return { type: JobType.Seed, fieldId: work.fieldId, cropId: work.cropId }
  }
  if (work.type === JobType.Harvest) {
    return { type: JobType.Harvest, fieldId: work.fieldId }
  }
  if (work.type === JobType.Fertilize) {
    return { type: JobType.Fertilize, fieldId: work.fieldId }
  }
  if (work.type === JobType.Spray) {
    return { type: JobType.Spray, fieldId: work.fieldId }
  }

  return null
}

function getRequiredCapability(
  task: MachineCommandTask,
): MachineCapability | null {
  const logisticsCapability = getLogisticsRequiredCapability(task)
  if (logisticsCapability) {
    return logisticsCapability
  }

  switch (task.kind) {
    case 'none':
      return MachineCapability.Move
    case 'plow':
      return MachineCapability.Plow
    case 'seed':
      return MachineCapability.Seed
    case 'harvest':
      return MachineCapability.Harvest
    case 'fertilize':
      return MachineCapability.Fertilize
    case 'spray':
      return MachineCapability.Spray
    default:
      return null
  }
}

function buildActiveWork(command: MachineCommand): ActiveWork | null {
  switch (command.task.kind) {
    case 'plow':
      if (command.destination.kind !== 'field') {
        return null
      }
      return { type: JobType.Plow, fieldId: command.destination.fieldId }
    case 'seed':
      if (command.destination.kind !== 'field') {
        return null
      }
      return {
        type: JobType.Seed,
        fieldId: command.destination.fieldId,
        cropId: command.task.cropId,
      }
    case 'harvest':
      if (command.destination.kind !== 'field') {
        return null
      }
      return { type: JobType.Harvest, fieldId: command.destination.fieldId }
    case 'fertilize':
      if (command.destination.kind !== 'field') {
        return null
      }
      return { type: JobType.Fertilize, fieldId: command.destination.fieldId }
    case 'spray':
      if (command.destination.kind !== 'field') {
        return null
      }
      return { type: JobType.Spray, fieldId: command.destination.fieldId }
    case 'none':
      return null
    default:
      if (isLogisticsTask(command.task)) {
        return null
      }
      return null
  }
}

function resolveMoveTarget(
  command: MachineCommand,
  fallback: Vec3,
  registry: MachineRegistry | null,
): Vec3 {
  if (isLogisticsTask(command.task)) {
    return resolveLogisticsMoveTarget(command, registry, fallback)
  }

  switch (command.destination.kind) {
    case 'world':
      return getGroundedPosition(command.destination.x, command.destination.z)
    case 'field': {
      const fieldPos = getFieldPositions()[command.destination.fieldId] ?? fallback
      return getGroundedPosition(fieldPos.x, fieldPos.z)
    }
    case 'farm':
    case 'building':
    case 'machine':
      return { ...fallback }
    default:
      return { ...fallback }
  }
}

function cloneCommand(command: MachineCommand): MachineCommand {
  return structuredClone(command)
}

function isTractorState(value: string): value is TractorState {
  return (
    value === TractorState.Idle ||
    value === TractorState.Moving ||
    value === TractorState.Working
  )
}

export function formatTractorState(state: TractorState): string {
  switch (state) {
    case TractorState.Idle:
      return 'Idle'
    case TractorState.Moving:
      return 'Moving'
    case TractorState.Working:
      return 'Working'
    default:
      return state
  }
}

export function formatJobType(
  type: JobTypeValue,
  cropName?: string,
): string {
  switch (type) {
    case JobType.Plow:
      return 'Plow'
    case JobType.Seed:
      return cropName ? `Seed ${cropName}` : 'Seed crop'
    case JobType.Harvest:
      return 'Harvest'
    case JobType.Fertilize:
      return 'Fertilize'
    case JobType.Spray:
      return 'Spray'
    default:
      return type
  }
}
