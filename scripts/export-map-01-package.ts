import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBuiltinMap01Context } from '../src/maps/MapPackageLoader.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'maps', 'map_01')
mkdirSync(outDir, { recursive: true })

const context = createBuiltinMap01Context()
const { manifest, layout, fields, cameraProfiles } = context.packageData

writeFileSync(join(outDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
writeFileSync(join(outDir, 'layout.json'), `${JSON.stringify(layout, null, 2)}\n`)
writeFileSync(join(outDir, 'fields.json'), `${JSON.stringify(fields, null, 2)}\n`)
writeFileSync(
  join(outDir, 'camera-profiles.json'),
  `${JSON.stringify(cameraProfiles, null, 2)}\n`,
)

console.log(`Exported map_01 package to ${outDir}`)
