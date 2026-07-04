import { MeshBuilder, VertexBuffer, type Mesh, type Scene } from '@babylonjs/core'
import { resolveTerrainLod } from '@/rendering/terrain/TerrainLodPolicy.ts'
import {
  bindTerrainMaterialTextures,
  createTerrainShaderMaterial,
  setTerrainPreviewEmissive,
  type TerrainSplatTextureSet,
} from '@/rendering/terrain/TerrainShaderFramework.ts'
import {
  buildTerrainSplatTexture,
  encodeSplatWeightGrid,
} from '@/rendering/terrain/TerrainTextureLibrary.ts'
import {
  encodeSurfaceGridToSplatColors,
  splatWeightsForLegacySurface,
  writeSplatMap1ToUv2,
  writeSplatWeightsToVertexColor,
} from '@/rendering/terrain/TerrainSplatEncoder.ts'
import type { TerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { surfaceIndexToMeshVertex } from '@/studio/terrain/TerrainGridMapping.ts'
import type { SyncTerrainMeshOptions } from '@/studio/terrain/TerrainMeshSync.ts'

const TERRAIN_SPLAT_KEY = 'farmosTerrainSplatTextures'

export interface TerrainGroundBuildOptions {
  width: number
  depth: number
  resolution?: number
  updatable?: boolean
  /** Used when mesh has no heightfield splat data yet (legacy flat terrain). */
  defaultLegacySurfaceId?: number
}

export function createTerrainGroundMesh(
  scene: Scene,
  name: string,
  options: TerrainGroundBuildOptions,
): Mesh {
  const lod = resolveTerrainLod(options.width, options.depth, options.resolution)
  const mesh = MeshBuilder.CreateGround(
    name,
    {
      width: options.width,
      height: options.depth,
      subdivisions: lod.subdivisions,
      updatable: options.updatable ?? false,
    },
    scene,
  )

  applyTerrainPipelineMaterial(mesh, scene)
  if (options.defaultLegacySurfaceId !== undefined) {
    applyDefaultLegacySurfaceSplat(mesh, options.defaultLegacySurfaceId)
  }
  return mesh
}

function applyDefaultLegacySurfaceSplat(mesh: Mesh, surfaceId: number): void {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  if (!positions) {
    return
  }
  const vertexCount = positions.length / 3
  const weights = splatWeightsForLegacySurface(surfaceId)
  const color = writeSplatWeightsToVertexColor(weights)
  const uv2Pair = writeSplatMap1ToUv2(weights)
  const colors = new Float32Array(vertexCount * 4)
  const uv2 = new Float32Array(vertexCount * 2)
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    colors[vertex * 4] = color[0]
    colors[vertex * 4 + 1] = color[1]
    colors[vertex * 4 + 2] = color[2]
    colors[vertex * 4 + 3] = color[3]
    uv2[vertex * 2] = uv2Pair[0]
    uv2[vertex * 2 + 1] = uv2Pair[1]
  }
  mesh.setVerticesData(VertexBuffer.ColorKind, colors, true)
  mesh.setVerticesData(VertexBuffer.UV2Kind, uv2, true)
  mesh.useVertexColors = true
}

export function applyTerrainPipelineMaterial(mesh: Mesh, scene: Scene): void {
  const splat = getMeshSplatTextures(mesh)
  const material = createTerrainShaderMaterial(scene, `${mesh.name}_terrainMaterial`, splat ?? undefined)
  mesh.material = material
  mesh.receiveShadows = true
  mesh.useVertexColors = true
}

function getMeshSplatTextures(mesh: Mesh): TerrainSplatTextureSet | null {
  return (mesh.metadata as { [TERRAIN_SPLAT_KEY]?: TerrainSplatTextureSet })?.[TERRAIN_SPLAT_KEY] ?? null
}

function disposeMeshSplatTextures(mesh: Mesh): void {
  const splat = getMeshSplatTextures(mesh)
  if (!splat) {
    return
  }
  splat.map0?.dispose()
  splat.map1?.dispose()
  splat.map2?.dispose()
  if (mesh.metadata) {
    delete (mesh.metadata as Record<string, unknown>)[TERRAIN_SPLAT_KEY]
  }
}

function buildFieldSplatTextures(scene: Scene, mesh: Mesh, field: TerrainHeightfield): TerrainSplatTextureSet {
  disposeMeshSplatTextures(mesh)
  const { resolution, surfaces } = field
  const splat: TerrainSplatTextureSet = {
    map0: buildTerrainSplatTexture(
      scene,
      `${mesh.name}_splat0`,
      resolution,
      encodeSplatWeightGrid(resolution, surfaces, 0),
    ),
    map1: buildTerrainSplatTexture(
      scene,
      `${mesh.name}_splat1`,
      resolution,
      encodeSplatWeightGrid(resolution, surfaces, 1),
    ),
    map2: buildTerrainSplatTexture(
      scene,
      `${mesh.name}_splat2`,
      resolution,
      encodeSplatWeightGrid(resolution, surfaces, 2),
    ),
  }
  mesh.metadata = { ...mesh.metadata, [TERRAIN_SPLAT_KEY]: splat }
  return splat
}

export function prepareTerrainMeshForPipeline(mesh: Mesh): void {
  mesh.useVertexColors = true
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  if (positions) {
    mesh.setVerticesData(VertexBuffer.PositionKind, positions, true)
    mesh.markVerticesDataAsUpdatable(VertexBuffer.PositionKind)
  }
}

export function syncTerrainMeshPipeline(
  mesh: Mesh,
  field: TerrainHeightfield,
  baseY: number,
  options: SyncTerrainMeshOptions = {},
): void {
  const { resolution, heights, surfaces } = field
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  if (!positions) {
    return
  }

  const positionBounds = options.positionBounds
  const updateAllPositions = !positionBounds
  const posMinI = positionBounds?.minI ?? 0
  const posMaxI = positionBounds?.maxI ?? resolution - 1
  const posMinJ = positionBounds?.minJ ?? 0
  const posMaxJ = positionBounds?.maxJ ?? resolution - 1

  let positionsDirty = false

  if (updateAllPositions) {
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const surfaceIndex = j * resolution + i
        const meshVertex = surfaceIndexToMeshVertex(i, j, resolution)
        positions[meshVertex * 3 + 1] = heights[surfaceIndex] - baseY
      }
    }
    positionsDirty = true
  } else if (positionBounds) {
    for (let j = posMinJ; j <= posMaxJ; j++) {
      for (let i = posMinI; i <= posMaxI; i++) {
        const surfaceIndex = j * resolution + i
        const meshVertex = surfaceIndexToMeshVertex(i, j, resolution)
        positions[meshVertex * 3 + 1] = heights[surfaceIndex] - baseY
      }
    }
    positionsDirty = true
  }

  const colors = encodeSurfaceGridToSplatColors(resolution, surfaces)
  const uv2 = encodeSurfaceGridToSplatUv2(resolution, surfaces)

  if (positionsDirty) {
    mesh.setVerticesData(VertexBuffer.PositionKind, positions, true)
    mesh.markVerticesDataAsUpdatable(VertexBuffer.PositionKind)
  }

  mesh.setVerticesData(VertexBuffer.ColorKind, colors, true)
  mesh.markVerticesDataAsUpdatable(VertexBuffer.ColorKind)
  mesh.setVerticesData(VertexBuffer.UV2Kind, uv2, true)
  mesh.markVerticesDataAsUpdatable(VertexBuffer.UV2Kind)
  mesh.useVertexColors = true

  const recomputeNormals = options.normals ?? positionsDirty
  if (recomputeNormals) {
    mesh.createNormals(true)
  }

  mesh.refreshBoundingInfo()

  const scene = mesh.getScene()
  const splat = buildFieldSplatTextures(scene, mesh, field)
  const material = mesh.material
  if (material) {
    bindTerrainMaterialTextures(material as import('@babylonjs/core').ShaderMaterial, scene, splat)
  }
}

function encodeSurfaceGridToSplatUv2(
  resolution: number,
  surfaces: readonly number[],
): Float32Array {
  const vertexCount = resolution * resolution
  const uv2 = new Float32Array(vertexCount * 2)

  for (let j = 0; j < resolution; j++) {
    for (let i = 0; i < resolution; i++) {
      const surfaceIndex = j * resolution + i
      const meshVertex = surfaceIndexToMeshVertex(i, j, resolution)
      const weights = splatWeightsForLegacySurface(surfaces[surfaceIndex] ?? 0)
      const encoded = writeSplatMap1ToUv2(weights)
      uv2[meshVertex * 2] = encoded[0]
      uv2[meshVertex * 2 + 1] = encoded[1]
    }
  }

  return uv2
}

export function setTerrainMeshPreviewTint(mesh: Mesh, active: boolean): void {
  setTerrainPreviewEmissive(mesh, active)
}
