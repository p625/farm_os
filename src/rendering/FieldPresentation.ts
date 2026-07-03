import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  PointerEventTypes,
  type AbstractMesh,
  type Scene,
} from '@babylonjs/core'
import { FIELD_DEFINITIONS, FIELD_POSITIONS } from '@/config/farm-layout.ts'
import type { Field } from '@entities/Field.ts'
import type { FieldSystem } from '@systems/FieldSystem.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'

const FIELD_MESH_IDS = ['field_1', 'field_2', 'field_3'] as const

const STATE_COLORS: Record<string, Color3> = {
  [States.Grass]: new Color3(0.35, 0.55, 0.22),
  [States.Plowed]: new Color3(0.38, 0.26, 0.14),
  [States.Seeded]: new Color3(0.42, 0.3, 0.16),
  [States.Growing]: new Color3(0.32, 0.5, 0.18),
  [States.Harvestable]: new Color3(0.78, 0.62, 0.12),
  [States.Harvested]: new Color3(0.45, 0.38, 0.2),
}

const HOVER_EMISSIVE = new Color3(0.08, 0.12, 0.04)
const SELECT_EMISSIVE = new Color3(0.24, 0.32, 0.1)

export class FieldPresentation {
  private scene: Scene | null = null
  private fieldSystem: FieldSystem | null = null
  private hoveredFieldId: string | null = null
  private onVisualChange: (() => void) | null = null
  private pointerObserver: ReturnType<Scene['onPointerObservable']['add']> | null =
    null

  setOnVisualChange(listener: () => void): void {
    this.onVisualChange = listener
  }

  attach(scene: Scene, fieldSystem: FieldSystem): void {
    this.detach()
    this.scene = scene
    this.fieldSystem = fieldSystem
    this.hoveredFieldId = null
    this.syncVisuals()
    this.pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        this.updateHover(pointerInfo.pickInfo?.pickedMesh ?? null)
        return
      }

      if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) {
        return
      }

      const pick = pointerInfo.pickInfo
      if (!pick?.hit || !pick.pickedMesh) {
        return
      }

      const fieldId = this.resolveFieldId(pick.pickedMesh)
      if (fieldId) {
        this.fieldSystem?.selectField(fieldId)
        this.syncVisuals()
      }
    })
  }

  syncVisuals(): void {
    if (!this.scene || !this.fieldSystem) {
      return
    }

    const selectedId = this.fieldSystem.getSelectedFieldId()

    for (const meshId of FIELD_MESH_IDS) {
      const mesh = this.scene.getMeshByName(meshId)
      const field = this.fieldSystem.getField(meshId)
      if (!mesh?.material || !field) {
        continue
      }

      const material = mesh.material as StandardMaterial
      material.diffuseColor = this.colorForField(field).clone()
      material.emissiveColor = this.emissiveForField(meshId, selectedId)
    }
  }

  getHoveredFieldId(): string | null {
    return this.hoveredFieldId
  }

  detach(): void {
    if (this.pointerObserver && this.scene) {
      this.scene.onPointerObservable.remove(this.pointerObserver)
    }
    this.pointerObserver = null
    this.hoveredFieldId = null
    this.onVisualChange = null
    this.scene = null
    this.fieldSystem = null
  }

  private updateHover(pickedMesh: AbstractMesh | null): void {
    const fieldId = pickedMesh ? this.resolveFieldId(pickedMesh) : null
    if (fieldId === this.hoveredFieldId) {
      return
    }
    this.hoveredFieldId = fieldId
    this.syncVisuals()
    this.onVisualChange?.()
  }

  private emissiveForField(
    meshId: string,
    selectedId: string | null,
  ): Color3 {
    if (meshId === selectedId) {
      return SELECT_EMISSIVE.clone()
    }
    if (meshId === this.hoveredFieldId) {
      return HOVER_EMISSIVE.clone()
    }
    return Color3.Black()
  }

  private colorForField(field: Field): Color3 {
    if (field.state === States.Growing) {
      const t = field.growthPercent / 100
      const soil = STATE_COLORS[States.Seeded]
      const crop = STATE_COLORS[States.Growing]
      return Color3.Lerp(soil, crop, t)
    }

    return STATE_COLORS[field.state] ?? STATE_COLORS[States.Grass]
  }

  private resolveFieldId(mesh: AbstractMesh): string | null {
    if (FIELD_MESH_IDS.includes(mesh.name as (typeof FIELD_MESH_IDS)[number])) {
      return mesh.name
    }
    if (
      mesh.parent &&
      FIELD_MESH_IDS.includes(mesh.parent.name as (typeof FIELD_MESH_IDS)[number])
    ) {
      return mesh.parent.name
    }
    return null
  }
}

export class FieldOverlayPresentation {
  private scene: Scene | null = null
  private fieldSystem: FieldSystem | null = null
  private fieldPresentation: FieldPresentation | null = null

  attach(
    scene: Scene,
    fieldSystem: FieldSystem,
    fieldPresentation: FieldPresentation,
  ): void {
    this.detach()
    this.scene = scene
    this.fieldSystem = fieldSystem
    this.fieldPresentation = fieldPresentation
    this.createOverlays()
    this.syncVisuals()
  }

  syncVisuals(): void {
    if (!this.scene || !this.fieldSystem || !this.fieldPresentation) {
      return
    }

    const selectedId = this.fieldSystem.getSelectedFieldId()
    const hoveredId = this.fieldPresentation.getHoveredFieldId()

    for (const definition of FIELD_DEFINITIONS) {
      const field = this.fieldSystem.getField(definition.id)
      if (!field) {
        continue
      }

      this.updateLabel(definition.id, definition.name)
      this.updateGrowthOverlay(definition.id, field)
      this.updateOutline(definition.id, selectedId, hoveredId)
    }
  }

  detach(): void {
    if (!this.scene) {
      this.scene = null
      this.fieldSystem = null
      this.fieldPresentation = null
      return
    }

    for (const definition of FIELD_DEFINITIONS) {
      this.scene.getMeshByName(`field_label_${definition.id}`)?.dispose()
      this.scene.getMeshByName(`field_growth_bg_${definition.id}`)?.dispose()
      this.scene.getMeshByName(`field_growth_fill_${definition.id}`)?.dispose()
      this.scene
        .getMeshByName(`field_outline_hover_${definition.id}`)
        ?.dispose()
      this.scene
        .getMeshByName(`field_outline_select_${definition.id}`)
        ?.dispose()
    }

    this.scene = null
    this.fieldSystem = null
    this.fieldPresentation = null
  }

  private createOverlays(): void {
    if (!this.scene) {
      return
    }

    for (const definition of FIELD_DEFINITIONS) {
      const position = FIELD_POSITIONS[definition.id]
      if (!position) {
        continue
      }

      this.createLabel(definition.id, definition.name, position)
      this.createGrowthOverlay(definition.id, position)
      this.createOutlineMeshes(definition.id, position)
    }
  }

  private createLabel(
    fieldId: string,
    label: string,
    position: { x: number; y: number; z: number },
  ): void {
    if (!this.scene) {
      return
    }

    const plane = MeshBuilder.CreatePlane(
      `field_label_${fieldId}`,
      { width: 4.2, height: 0.9 },
      this.scene,
    )
    plane.position.set(position.x, 2.3, position.z)
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL
    plane.isPickable = false

    const texture = new DynamicTexture(
      `field_label_texture_${fieldId}`,
      { width: 512, height: 96 },
      this.scene,
      false,
    )
    texture.drawText(
      label,
      null,
      58,
      'bold 44px system-ui, sans-serif',
      '#e8f5e3',
      'transparent',
      true,
    )

    const material = new StandardMaterial(`field_label_mat_${fieldId}`, this.scene)
    material.diffuseTexture = texture
    material.emissiveColor = new Color3(0.15, 0.2, 0.12)
    material.disableLighting = true
    material.backFaceCulling = false
    plane.material = material
  }

  private updateLabel(fieldId: string, label: string): void {
    const mesh = this.scene?.getMeshByName(`field_label_${fieldId}`)
    const material = mesh?.material as StandardMaterial | undefined
    const texture = material?.diffuseTexture as DynamicTexture | undefined
    texture?.drawText(
      label,
      null,
      58,
      'bold 44px system-ui, sans-serif',
      '#e8f5e3',
      'transparent',
      true,
    )
  }

  private createGrowthOverlay(
    fieldId: string,
    position: { x: number; y: number; z: number },
  ): void {
    if (!this.scene) {
      return
    }

    const bg = MeshBuilder.CreateBox(
      `field_growth_bg_${fieldId}`,
      { width: 6, height: 0.02, depth: 0.35 },
      this.scene,
    )
    bg.position.set(position.x, 0.14, position.z + 5.2)
    bg.isPickable = false

    const bgMaterial = new StandardMaterial(`field_growth_bg_mat_${fieldId}`, this.scene)
    bgMaterial.diffuseColor = new Color3(0.12, 0.12, 0.1)
    bgMaterial.emissiveColor = new Color3(0.05, 0.05, 0.04)
    bg.material = bgMaterial

    const fill = MeshBuilder.CreateBox(
      `field_growth_fill_${fieldId}`,
      { width: 6, height: 0.03, depth: 0.28 },
      this.scene,
    )
    fill.position.set(position.x - 3, 0.16, position.z + 5.2)
    fill.isPickable = false

    const fillMaterial = new StandardMaterial(
      `field_growth_fill_mat_${fieldId}`,
      this.scene,
    )
    fillMaterial.diffuseColor = new Color3(0.35, 0.72, 0.28)
    fillMaterial.emissiveColor = new Color3(0.12, 0.25, 0.08)
    fill.material = fillMaterial
    fill.setEnabled(false)
    bg.setEnabled(false)
  }

  private updateGrowthOverlay(fieldId: string, field: Field): void {
    const bg = this.scene?.getMeshByName(`field_growth_bg_${fieldId}`)
    const fill = this.scene?.getMeshByName(`field_growth_fill_${fieldId}`)
    const position = FIELD_POSITIONS[fieldId]
    if (!bg || !fill || !position) {
      return
    }

    const isGrowing =
      field.state === States.Growing || field.state === States.Seeded
    bg.setEnabled(isGrowing)
    fill.setEnabled(isGrowing)

    if (!isGrowing) {
      return
    }

    const progress = Math.max(0.04, field.growthPercent / 100)
    fill.scaling.x = progress
    fill.position.x = position.x - 3 + 3 * progress
  }

  private createOutlineMeshes(
    fieldId: string,
    position: { x: number; y: number; z: number },
  ): void {
    if (!this.scene) {
      return
    }

    const hover = MeshBuilder.CreateBox(
      `field_outline_hover_${fieldId}`,
      { width: 10.3, height: 0.03, depth: 14.3 },
      this.scene,
    )
    hover.position.set(position.x, 0.1, position.z)
    hover.isPickable = false
    hover.setEnabled(false)

    const hoverMaterial = new StandardMaterial(
      `field_outline_hover_mat_${fieldId}`,
      this.scene,
    )
    hoverMaterial.diffuseColor = new Color3(0.55, 0.75, 0.45)
    hoverMaterial.emissiveColor = new Color3(0.18, 0.28, 0.1)
    hoverMaterial.alpha = 0.55
    hover.material = hoverMaterial

    const select = MeshBuilder.CreateBox(
      `field_outline_select_${fieldId}`,
      { width: 10.6, height: 0.04, depth: 14.6 },
      this.scene,
    )
    select.position.set(position.x, 0.12, position.z)
    select.isPickable = false
    select.setEnabled(false)

    const selectMaterial = new StandardMaterial(
      `field_outline_select_mat_${fieldId}`,
      this.scene,
    )
    selectMaterial.diffuseColor = new Color3(0.7, 0.95, 0.55)
    selectMaterial.emissiveColor = new Color3(0.35, 0.5, 0.15)
    selectMaterial.alpha = 0.85
    select.material = selectMaterial
  }

  private updateOutline(
    fieldId: string,
    selectedId: string | null,
    hoveredId: string | null,
  ): void {
    const hover = this.scene?.getMeshByName(`field_outline_hover_${fieldId}`)
    const select = this.scene?.getMeshByName(`field_outline_select_${fieldId}`)
    if (!hover || !select) {
      return
    }

    const isSelected = fieldId === selectedId
    const isHovered = fieldId === hoveredId && !isSelected

    hover.setEnabled(isHovered)
    select.setEnabled(isSelected)
  }
}
