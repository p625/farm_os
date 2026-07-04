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
import { getFieldLayoutEntry } from '@/config/map-01-layout.ts'
import { FIELD_IDS } from '@/config/field-catalog.ts'
import type { Field } from '@entities/Field.ts'
import type { FieldSystem } from '@systems/FieldSystem.ts'
import type { CropSystem } from '@systems/CropSystem.ts'
import type { OwnershipSystem } from '@systems/OwnershipSystem.ts'
import { getFieldVisualStyle } from './appearance/FieldAppearance.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'

const FIELD_MESH_IDS = FIELD_IDS

const HOVER_EMISSIVE = new Color3(0.1, 0.14, 0.05)
const SELECT_EMISSIVE = new Color3(0.28, 0.36, 0.12)

export class FieldPresentation {
  private scene: Scene | null = null
  private fieldSystem: FieldSystem | null = null
  private cropSystem: CropSystem | null = null
  private hoveredFieldId: string | null = null
  private onVisualChange: (() => void) | null = null
  private onFieldSelected: ((fieldId: string) => void) | null = null
  private pointerObserver: ReturnType<Scene['onPointerObservable']['add']> | null =
    null

  setCropSystem(cropSystem: CropSystem): void {
    this.cropSystem = cropSystem
  }

  setOnVisualChange(listener: () => void): void {
    this.onVisualChange = listener
  }

  setOnFieldSelected(listener: (fieldId: string) => void): void {
    this.onFieldSelected = listener
  }

  attach(scene: Scene, fieldSystem: FieldSystem): void {
    this.detach()
    this.scene = scene
    this.fieldSystem = fieldSystem
    this.hoveredFieldId = null
    this.syncBaseVisuals()
    this.syncSelectionOverlay()
    this.pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        this.updateHover(pointerInfo.pickInfo?.pickedMesh ?? null)
        return
      }

      if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) {
        return
      }

      const event = pointerInfo.event as PointerEvent
      if (event.button !== 0) {
        return
      }

      const pick = pointerInfo.pickInfo
      if (!pick?.hit || !pick.pickedMesh) {
        return
      }

      const fieldId = this.resolveFieldId(pick.pickedMesh)
      if (fieldId) {
        if (this.onFieldSelected) {
          this.onFieldSelected(fieldId)
        } else {
          this.fieldSystem?.selectField(fieldId)
        }
        this.syncSelectionOverlay()
      }
    })
  }

  syncBaseVisuals(): void {
    if (!this.scene || !this.fieldSystem) {
      return
    }

    for (const meshId of FIELD_MESH_IDS) {
      const mesh = this.scene.getMeshByName(meshId)
      const field = this.fieldSystem.getField(meshId)
      if (!mesh?.material || !field) {
        continue
      }

      if (this.cropSystem?.isCropActive(field)) {
        continue
      }

      const material = mesh.material as StandardMaterial
      const style = getFieldVisualStyle(field.state, field.growthPercent)
      material.diffuseColor = style.diffuse.clone()
      material.specularColor = style.specular.clone()
      material.emissiveColor = style.emissive.clone()
    }
  }

  syncSelectionOverlay(): void {
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
      const baseEmissive = this.cropSystem?.isCropActive(field)
        ? material.emissiveColor.clone()
        : getFieldVisualStyle(field.state, field.growthPercent).emissive.clone()

      material.emissiveColor = this.emissiveForField(meshId, selectedId).add(
        baseEmissive,
      )
    }
  }

  syncVisuals(): void {
    this.syncBaseVisuals()
    this.syncSelectionOverlay()
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
    this.cropSystem = null
  }

  private updateHover(pickedMesh: AbstractMesh | null): void {
    const fieldId = pickedMesh ? this.resolveFieldId(pickedMesh) : null
    if (fieldId === this.hoveredFieldId) {
      return
    }
    this.hoveredFieldId = fieldId
    this.syncSelectionOverlay()
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

  private resolveFieldId(mesh: AbstractMesh): string | null {
    if (FIELD_MESH_IDS.includes(mesh.name)) {
      return mesh.name
    }
    if (mesh.parent && FIELD_MESH_IDS.includes(mesh.parent.name)) {
      return mesh.parent.name
    }
    return null
  }
}

export class FieldOverlayPresentation {
  private scene: Scene | null = null
  private fieldSystem: FieldSystem | null = null
  private fieldPresentation: FieldPresentation | null = null
  private ownershipSystem: OwnershipSystem | null = null
  private cropSystem: CropSystem | null = null

  attach(
    scene: Scene,
    fieldSystem: FieldSystem,
    fieldPresentation: FieldPresentation,
    ownershipSystem: OwnershipSystem,
    cropSystem: CropSystem,
  ): void {
    this.detach()
    this.scene = scene
    this.fieldSystem = fieldSystem
    this.fieldPresentation = fieldPresentation
    this.ownershipSystem = ownershipSystem
    this.cropSystem = cropSystem
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

      this.updateLabel(definition.id, this.getFieldLabel(field))
      this.updateGrowthOverlay(definition.id, field)
      this.updateOutline(definition.id, selectedId, hoveredId)
    }
  }

  detach(): void {
    if (!this.scene) {
      this.scene = null
      this.fieldSystem = null
      this.fieldPresentation = null
      this.ownershipSystem = null
      this.cropSystem = null
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
    this.ownershipSystem = null
    this.cropSystem = null
  }

  private getFieldLabel(field: Field): string {
    if (this.cropSystem?.isCropActive(field)) {
      const cropId = this.cropSystem.normalizePlantedCropId(
        field.cropId,
        field.state,
      )
      if (cropId) {
        return this.cropSystem.getCropName(cropId)
      }
    }
    return field.name
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

    const layout = getFieldLayoutEntry(fieldId)
    const barWidth = layout ? Math.min(layout.meshSize.width - 2, 8) : 6
    const barZ = position.z + (layout ? layout.meshSize.depth / 2 + 0.6 : 5.2)

    const bg = MeshBuilder.CreateBox(
      `field_growth_bg_${fieldId}`,
      { width: barWidth, height: 0.02, depth: 0.35 },
      this.scene,
    )
    bg.position.set(position.x, 0.14, barZ)
    bg.isPickable = false

    const bgMaterial = new StandardMaterial(`field_growth_bg_mat_${fieldId}`, this.scene)
    bgMaterial.diffuseColor = new Color3(0.12, 0.12, 0.1)
    bgMaterial.emissiveColor = new Color3(0.05, 0.05, 0.04)
    bg.material = bgMaterial

    const fill = MeshBuilder.CreateBox(
      `field_growth_fill_${fieldId}`,
      { width: barWidth, height: 0.03, depth: 0.28 },
      this.scene,
    )
    fill.position.set(position.x - barWidth / 2, 0.16, barZ)
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
    const layout = getFieldLayoutEntry(fieldId)
    if (!bg || !fill || !position) {
      return
    }

    const barWidth = layout ? Math.min(layout.meshSize.width - 2, 8) : 6
    const barZ = position.z + (layout ? layout.meshSize.depth / 2 + 0.6 : 5.2)

    const isGrowing = Boolean(
      this.ownershipSystem?.canUseField(fieldId) &&
        (field.state === States.Growing || field.state === States.Seeded),
    )
    bg.setEnabled(isGrowing)
    fill.setEnabled(isGrowing)

    if (!isGrowing) {
      return
    }

    const progress = Math.max(0.04, field.growthPercent / 100)
    fill.scaling.x = progress
    fill.position.x = position.x - barWidth / 2 + (barWidth / 2) * progress
    fill.position.z = barZ
    bg.position.z = barZ
  }

  private createOutlineMeshes(
    fieldId: string,
    position: { x: number; y: number; z: number },
  ): void {
    if (!this.scene) {
      return
    }

    const layout = getFieldLayoutEntry(fieldId)
    const width = layout?.meshSize.width ?? 10
    const depth = layout?.meshSize.depth ?? 14

    const hover = MeshBuilder.CreateBox(
      `field_outline_hover_${fieldId}`,
      { width: width + 0.3, height: 0.03, depth: depth + 0.3 },
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
      { width: width + 0.6, height: 0.04, depth: depth + 0.6 },
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
