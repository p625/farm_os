import type { RenderingQualityPreset } from '@/config/rendering/rendering-quality-config.ts'
import { getActiveFarmHub, getActiveWorldCenter } from '@/config/farm-layout.ts'
import { tryGetActiveMapContext } from '@/maps/MapRuntimeContext.ts'

export type VisualBenchmarkTimeOfDay = 'june_noon'
export type VisualBenchmarkWeather = 'clear'

export type VisualBenchmarkAnchor = 'farm_hub' | 'world_center'

export interface VisualBenchmarkVec3 {
  x: number
  y: number
  z: number
}

export interface VisualBenchmarkPresetTemplate {
  id: string
  displayName: string
  description: string
  anchor: VisualBenchmarkAnchor
  cameraPositionOffset: VisualBenchmarkVec3
  cameraTargetOffset: VisualBenchmarkVec3
  fov: number
  timeOfDay: VisualBenchmarkTimeOfDay
  weatherProfile: VisualBenchmarkWeather
  renderQuality: RenderingQualityPreset
  validationFocus: readonly string[]
  notes: string
}

export interface VisualBenchmarkPreset extends Omit<VisualBenchmarkPresetTemplate, 'cameraPositionOffset' | 'cameraTargetOffset' | 'anchor'> {
  cameraPosition: VisualBenchmarkVec3
  cameraTarget: VisualBenchmarkVec3
}

export interface VisualBenchmarkConfig {
  version: string
  baselineMilestone: 'MS1B'
  weather: VisualBenchmarkWeather
  timeOfDay: VisualBenchmarkTimeOfDay
  renderQuality: RenderingQualityPreset
  presets: readonly VisualBenchmarkPresetTemplate[]
  reviewChecklist: readonly string[]
}

const LEGACY_MAP_SPAN_METERS = 140

function resolveMapScale(): number {
  const map = tryGetActiveMapContext()?.worldMap
  if (!map) {
    return 1
  }
  return Math.max(1, Math.max(map.terrain.width, map.terrain.height) / LEGACY_MAP_SPAN_METERS)
}

function resolveAnchor(anchor: VisualBenchmarkAnchor): VisualBenchmarkVec3 {
  if (anchor === 'farm_hub') {
    const barn = getActiveFarmHub().barn.position
    return { x: barn.x, y: barn.y ?? 0, z: barn.z }
  }
  const center = getActiveWorldCenter()
  return { x: center.x, y: 0, z: center.z }
}

function scaleOffset(offset: VisualBenchmarkVec3, scale: number): VisualBenchmarkVec3 {
  return {
    x: offset.x * scale,
    y: offset.y,
    z: offset.z * scale,
  }
}

function addVec(a: VisualBenchmarkVec3, b: VisualBenchmarkVec3): VisualBenchmarkVec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function resolveVisualBenchmarkPreset(
  template: VisualBenchmarkPresetTemplate,
): VisualBenchmarkPreset {
  const scale = resolveMapScale()
  const anchor = resolveAnchor(template.anchor)
  const position = addVec(anchor, scaleOffset(template.cameraPositionOffset, scale))
  const target = addVec(anchor, scaleOffset(template.cameraTargetOffset, scale))

  const { cameraPositionOffset: _p, cameraTargetOffset: _t, anchor: _a, ...rest } = template
  return {
    ...rest,
    cameraPosition: position,
    cameraTarget: target,
  }
}

export const VISUAL_BENCHMARK_CONFIG: VisualBenchmarkConfig = {
  version: '2026-MS1C',
  baselineMilestone: 'MS1B',
  weather: 'clear',
  timeOfDay: 'june_noon',
  renderQuality: 'high',
  presets: [
    {
      id: 'farm_yard_view',
      displayName: 'Farm Yard View',
      description: 'Pohled z farmy směrem do krajiny — čitelnost farmy a okolí.',
      anchor: 'farm_hub',
      cameraPositionOffset: { x: -18, y: 14, z: 22 },
      cameraTargetOffset: { x: 35, y: 0, z: -20 },
      fov: 0.82,
      timeOfDay: 'june_noon',
      weatherProfile: 'clear',
      renderQuality: 'high',
      validationFocus: ['farm readability', 'terrain transition', 'horizon balance'],
      notes: 'Výchozí benchmark pro farm yard a okolní terén.',
    },
    {
      id: 'field_long_view',
      displayName: 'Field Long View',
      description: 'Dlouhý výhled přes pole — opakování textur a dálková čitelnost.',
      anchor: 'world_center',
      cameraPositionOffset: { x: -40, y: 22, z: 55 },
      cameraTargetOffset: { x: 25, y: 0, z: -45 },
      fov: 0.86,
      timeOfDay: 'june_noon',
      weatherProfile: 'clear',
      renderQuality: 'high',
      validationFocus: ['texture tiling', 'macro variation', 'atmospheric depth', 'sky gradient'],
      notes: 'MS4: porovnat atmosférickou hloubku a měkčí horizont vůči MS1B baseline.',
    },
    {
      id: 'meadow_ground_view',
      displayName: 'Meadow Ground View',
      description: 'Nízký pohled přes louku / trávu — detail a ground readability.',
      anchor: 'world_center',
      cameraPositionOffset: { x: -8, y: 3.5, z: 14 },
      cameraTargetOffset: { x: 12, y: 1.2, z: -6 },
      fov: 0.78,
      timeOfDay: 'june_noon',
      weatherProfile: 'clear',
      renderQuality: 'high',
      validationFocus: ['grass detail', 'close-up normals', 'anti-tiling'],
      notes: 'Detail map fade a anti-tiling musí být viditelné zblízka.',
    },
    {
      id: 'dirt_road_view',
      displayName: 'Dirt Road View',
      description: 'Polní cesta a přechody materiálů (štěrk, ornice, tráva).',
      anchor: 'world_center',
      cameraPositionOffset: { x: 22, y: 10, z: 18 },
      cameraTargetOffset: { x: -5, y: 0, z: -12 },
      fov: 0.84,
      timeOfDay: 'june_noon',
      weatherProfile: 'clear',
      renderQuality: 'high',
      validationFocus: ['splat blending', 'height blend', 'material edges'],
      notes: 'Kontrola měkkých přechodů bez ostrých hran.',
    },
    {
      id: 'forest_edge_view',
      displayName: 'Forest Edge View',
      description: 'Okraj lesa / remízek / svah — lesní půda a skalnaté svahy.',
      anchor: 'world_center',
      cameraPositionOffset: { x: -35, y: 16, z: -28 },
      cameraTargetOffset: { x: -55, y: 4, z: -48 },
      fov: 0.85,
      timeOfDay: 'june_noon',
      weatherProfile: 'clear',
      renderQuality: 'high',
      validationFocus: ['forest floor material', 'atmospheric depth', 'haze on trees', 'sky gradient'],
      notes: 'MS4: vzdálené stromy by měly mít nižší kontrast díky atmospheric haze.',
    },
    {
      id: 'horizon_view',
      displayName: 'Horizon View',
      description: 'Dálkový výhled s fog/haze — atmosféra a hloubka krajiny.',
      anchor: 'world_center',
      cameraPositionOffset: { x: -12, y: 28, z: 95 },
      cameraTargetOffset: { x: 0, y: 0, z: 0 },
      fov: 0.88,
      timeOfDay: 'june_noon',
      weatherProfile: 'clear',
      renderQuality: 'high',
      validationFocus: ['sky gradient', 'atmospheric haze', 'horizon softness', 'distance readability'],
      notes: 'MS4 SkySystem — zenith/horizon gradient + linear haze (ne volumetric fog).',
    },
    {
      id: 'material_closeup',
      displayName: 'Material Closeup View',
      description: 'Detailní pohled na terrain materiál zblízka.',
      anchor: 'world_center',
      cameraPositionOffset: { x: 4, y: 2.2, z: 6 },
      cameraTargetOffset: { x: 8, y: 0.5, z: 0 },
      fov: 0.72,
      timeOfDay: 'june_noon',
      weatherProfile: 'clear',
      renderQuality: 'high',
      validationFocus: ['PBR detail', 'normal maps', 'roughness variation', 'no blur'],
      notes: 'Nejbližší benchmark — detail mapy a normály.',
    },
  ],
  reviewChecklist: [
    'Stejný benchmark preset (id) jako v referenční sadě',
    'Stejný FOV a render quality (high)',
    'Červnové poledne, clear weather',
    'SkySystem aktivní (gradient sky, haze, noon sun profile)',
    'Porovnat field_long_view, horizon_view, forest_edge_view vůči MS1B/MS3 baseline',
  ],
} as const

export function listVisualBenchmarkPresets(): VisualBenchmarkPreset[] {
  return VISUAL_BENCHMARK_CONFIG.presets.map(resolveVisualBenchmarkPreset)
}

export function getVisualBenchmarkPresetById(id: string): VisualBenchmarkPreset | undefined {
  const template = VISUAL_BENCHMARK_CONFIG.presets.find((preset) => preset.id === id)
  return template ? resolveVisualBenchmarkPreset(template) : undefined
}
