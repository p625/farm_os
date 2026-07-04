import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createMap01BlockoutData } from '../src/maps/map-01-blockout/layoutSpec.ts'
import { assembleMap01WorldDocument } from '../src/maps/map-01-blockout/assembleMapDocument.ts'
import {
  validateMap01BlockoutData,
  validateMap01WorldDocument,
} from '../src/maps/map-01-blockout/validateMap01Blockout.ts'
import { MapFileService } from '../src/studio/io/MapFileService.ts'
import { exportWorldMapToPackage } from '../src/studio/export/WorldMapExporter.ts'

const MAP_FOLDER = 'Map_01_Central_Europe'
const MAP_FILE = 'Map_01_Central_Europe.farmos-map.json'

export function writeMap01BlockoutFiles(repoRoot = process.cwd()): {
  dataDir: string
  publicMapPath: string
  issues: string[]
} {
  const data = createMap01BlockoutData()
  const dataDir = join(repoRoot, 'maps', MAP_FOLDER)
  const publicDir = join(repoRoot, 'public', 'maps', MAP_FOLDER)
  const publicMapPath = join(publicDir, MAP_FILE)

  mkdirSync(dataDir, { recursive: true })
  mkdirSync(publicDir, { recursive: true })

  const writeJson = (name: string, payload: unknown) => {
    writeFileSync(join(dataDir, name), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  }

  writeJson('metadata.json', data.metadata)
  writeJson('terrain.json', data.terrain)
  writeJson('fields.json', data.fields)
  writeJson('roads.json', data.roads)
  writeJson('buildings.json', data.buildings)
  writeJson('water.json', data.water)
  writeJson('vegetation.json', data.vegetation)
  writeJson('poi.json', data.poi)

  const worldMap = assembleMap01WorldDocument(data)
  writeFileSync(publicMapPath, `${MapFileService.serialize(worldMap)}\n`, 'utf8')

  const exported = exportWorldMapToPackage(worldMap, {
    packageId: data.metadata.id,
    packageName: data.metadata.name,
    description: data.metadata.description,
  })
  const manifest = {
    ...exported.packageData.manifest,
    source: 'official' as const,
    author: data.metadata.author,
    worldMapFile: MAP_FILE,
    createdAt: data.metadata.createdAt,
    updatedAt: data.metadata.createdAt,
  }

  writeFileSync(
    join(publicDir, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(publicDir, 'layout.json'),
    `${JSON.stringify(exported.packageData.layout, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(publicDir, 'fields.json'),
    `${JSON.stringify(exported.packageData.fields, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(publicDir, 'camera-profiles.json'),
    `${JSON.stringify(exported.packageData.cameraProfiles, null, 2)}\n`,
    'utf8',
  )

  const issues = [
    ...validateMap01BlockoutData(data),
    ...validateMap01WorldDocument(worldMap),
  ].map((issue) => `[${issue.level}] ${issue.message}`)

  return { dataDir, publicMapPath, issues }
}

const result = writeMap01BlockoutFiles()

console.log(`Map 01 blockout data written to: ${result.dataDir}`)
console.log(`Studio map written to: ${result.publicMapPath}`)

if (result.issues.length === 0) {
  console.log('Validation: OK')
} else {
  console.log('Validation:')
  for (const issue of result.issues) {
    console.log(`  ${issue}`)
  }
  if (result.issues.some((issue) => issue.startsWith('[error]'))) {
    process.exitCode = 1
  }
}
