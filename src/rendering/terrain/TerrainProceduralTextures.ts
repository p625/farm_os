/**
 * Procedural PBR placeholder tiles for MS1B.
 * Replace texture paths in material library when final assets arrive.
 */

export type TerrainMaterialTileKind =
  | 'meadow'
  | 'grass'
  | 'topsoil'
  | 'clay'
  | 'forest_floor'
  | 'gravel'
  | 'asphalt'
  | 'mud'
  | 'rock'

function hash(x: number, y: number, seed: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  return v - Math.floor(v)
}

function noise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const a = hash(xi, yi, seed)
  const b = hash(xi + 1, yi, seed)
  const c = hash(xi, yi + 1, seed)
  const d = hash(xi + 1, yi + 1, seed)
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let value = 0
  let amp = 0.5
  let freq = 1
  for (let i = 0; i < octaves; i++) {
    value += noise2(x * freq, y * freq, seed + i * 17) * amp
    freq *= 2.03
    amp *= 0.5
  }
  return value
}

export interface TerrainTilePixels {
  albedo: Uint8ClampedArray
  normalHeight: Uint8ClampedArray
  aoRough: Uint8ClampedArray
  macro: Uint8ClampedArray
  detail: Uint8ClampedArray
}

function makeBuffer(size: number): Uint8ClampedArray {
  return new Uint8ClampedArray(size * size * 4)
}

function writePixel(
  buf: Uint8ClampedArray,
  size: number,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): void {
  const i = (y * size + x) * 4
  buf[i] = r
  buf[i + 1] = g
  buf[i + 2] = b
  buf[i + 3] = a
}

function kindFromId(materialId: string): TerrainMaterialTileKind {
  if (materialId === 'meadow') return 'meadow'
  if (materialId === 'grass') return 'grass'
  if (materialId === 'topsoil') return 'topsoil'
  if (materialId === 'clay') return 'clay'
  if (materialId === 'forest_floor') return 'forest_floor'
  if (materialId === 'gravel') return 'gravel'
  if (materialId === 'asphalt') return 'asphalt'
  if (materialId === 'mud') return 'mud'
  return 'rock'
}

export function generateTerrainMaterialTile(
  materialId: string,
  size: number,
  tint: readonly [number, number, number],
  roughness: number,
  heightScale: number,
): TerrainTilePixels {
  const kind = kindFromId(materialId)
  const seed = materialId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const albedo = makeBuffer(size)
  const normalHeight = makeBuffer(size)
  const aoRough = makeBuffer(size)
  const macro = makeBuffer(size)
  const detail = makeBuffer(size)

  const heights: number[] = new Array(size * size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const n = fbm(u * 6, v * 6, seed)
      const n2 = fbm(u * 14 + 2.3, v * 14 + 1.7, seed + 11)
      const macroN = fbm(u * 2.2, v * 2.2, seed + 29)

      let r = tint[0]
      let g = tint[1]
      let b = tint[2]
      let h = n
      let rough = roughness
      let ao = 0.85 + n2 * 0.15

      switch (kind) {
        case 'meadow':
        case 'grass':
          r = tint[0] * (0.88 + n * 0.18)
          g = tint[1] * (0.9 + n2 * 0.15)
          b = tint[2] * (0.85 + n * 0.12)
          h = n * 0.45 + n2 * 0.2
          rough = roughness + n2 * 0.04
          break
        case 'topsoil':
        case 'clay':
        case 'forest_floor':
          r = tint[0] * (0.82 + n * 0.22)
          g = tint[1] * (0.8 + n2 * 0.2)
          b = tint[2] * (0.78 + n * 0.18)
          h = n * 0.55
          break
        case 'gravel':
          r = tint[0] * (0.75 + (n > 0.55 ? 0.25 : n * 0.2))
          g = tint[1] * (0.75 + (n2 > 0.5 ? 0.22 : n2 * 0.18))
          b = tint[2] * (0.72 + n * 0.2)
          h = (n > 0.62 ? 0.75 : 0.35) + n2 * 0.15
          rough = 0.82 + n * 0.1
          break
        case 'asphalt':
          r = tint[0] * (0.92 + n * 0.08)
          g = tint[1] * (0.92 + n2 * 0.08)
          b = tint[2] * (0.94 + n * 0.06)
          h = n * 0.2
          rough = 0.72 + n2 * 0.08
          break
        case 'mud':
          r = tint[0] * (0.86 + n * 0.12)
          g = tint[1] * (0.84 + n2 * 0.1)
          b = tint[2] * (0.8 + n * 0.1)
          h = n * 0.25
          rough = 0.3 + n2 * 0.15
          ao = 0.75 + n * 0.2
          break
        case 'rock':
          r = tint[0] * (0.78 + n * 0.28)
          g = tint[1] * (0.76 + n2 * 0.26)
          b = tint[2] * (0.74 + n * 0.24)
          h = 0.4 + n * 0.45 + (n2 > 0.65 ? 0.2 : 0)
          rough = 0.78 + n * 0.12
          break
      }

      h *= heightScale
      heights[y * size + x] = h

      writePixel(albedo, size, x, y, Math.round(r * 255), Math.round(g * 255), Math.round(b * 255))
      writePixel(macro, size, x, y, Math.round(macroN * 255), Math.round(macroN * 245), Math.round(macroN * 235))
      writePixel(detail, size, x, y, Math.round((0.5 + n2 * 0.5) * 255), Math.round((0.5 + n * 0.5) * 255), 128)
      writePixel(aoRough, size, x, y, Math.round(ao * 255), Math.round(rough * 255), 0, 255)
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const left = heights[y * size + Math.max(0, x - 1)]
      const right = heights[y * size + Math.min(size - 1, x + 1)]
      const down = heights[Math.max(0, y - 1) * size + x]
      const up = heights[Math.min(size - 1, y + 1) * size + x]
      const dx = (right - left) * 2
      const dy = (up - down) * 2
      const nx = -dx
      const ny = -dy
      const nz = 1
      const len = Math.hypot(nx, ny, nz)
      const h = heights[y * size + x]
      writePixel(
        normalHeight,
        size,
        x,
        y,
        Math.round((nx / len) * 127 + 128),
        Math.round((ny / len) * 127 + 128),
        Math.round(h * 255),
        255,
      )
    }
  }

  return { albedo, normalHeight, aoRough, macro, detail }
}

export function blitTileToAtlas(
  atlas: Uint8ClampedArray,
  atlasWidth: number,
  tileSize: number,
  col: number,
  row: number,
  tile: Uint8ClampedArray,
  tileSizeSrc: number,
): void {
  for (let y = 0; y < tileSize; y++) {
    for (let x = 0; x < tileSize; x++) {
      const sx = Math.floor((x / tileSize) * tileSizeSrc)
      const sy = Math.floor((y / tileSize) * tileSizeSrc)
      const si = (sy * tileSizeSrc + sx) * 4
      const dx = col * tileSize + x
      const dy = row * tileSize + y
      const di = (dy * atlasWidth + dx) * 4
      atlas[di] = tile[si]
      atlas[di + 1] = tile[si + 1]
      atlas[di + 2] = tile[si + 2]
      atlas[di + 3] = tile[si + 3]
    }
  }
}
