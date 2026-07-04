/**
 * Mandatory regression test for gameplay-aware Studio placement.
 * Run: npm run test:gameplay-placement
 * Also runs as part of: npm run check / npm run ci
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { MapFileService } from '../src/studio/io/MapFileService.ts'
import {
  buildGameplayPlacementTestMap,
  exportGameplayPlacementTestPackage,
  runGameplayPlacementSelfCheck,
} from '../src/maps/GameplayPlacementSelfCheck.ts'
import {
  buildCatalogCoveragePlacementMap,
  runCatalogDefinitionCoverageCheck,
  runCatalogPlacementCoverageCheck,
} from '../src/maps/GameplayCatalogCoverageCheck.ts'
import { runGameplayRuntimeDuplicationCheck } from '../src/maps/GameplayRuntimeDuplicationCheck.ts'
import { runStudioInteractiveEditingCheck } from '../src/maps/StudioInteractiveEditingCheck.ts'
import { runStudioParcelEditingCheck } from '../src/maps/StudioParcelEditingCheck.ts'
import { runPolygonEditorCheck } from '../src/maps/PolygonEditorCheck.ts'

const OUT_DIR = join(process.cwd(), 'public', 'maps', 'GameplayPlacementTest')

function printFailures(label: string, failures: readonly string[]): void {
  if (failures.length === 0) {
    return
  }
  console.error(`\n${label} FAILED:`)
  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }
}

function main(): void {
  console.log('=== FarmOS Gameplay Placement Regression Test ===\n')

  const allFailures: string[] = []

  console.log('1/6 Catalog definition coverage')
  const catalogDefinitions = runCatalogDefinitionCoverageCheck()
  console.log(
    `  buildings=${catalogDefinitions.buildingCount} machines=${catalogDefinitions.machineCount} attachments=${catalogDefinitions.attachmentCount} studio=${catalogDefinitions.studioPlacementCount}`,
  )
  console.log(
    `  ${catalogDefinitions.passed ? 'PASSED' : 'FAILED'} (${catalogDefinitions.failures.length} issue(s))`,
  )
  allFailures.push(...catalogDefinitions.failures)

  console.log('\n2/6 Catalog placement coverage (all assets placed once)')
  const catalogMap = buildCatalogCoveragePlacementMap()
  const catalogPlacement = runCatalogPlacementCoverageCheck(catalogMap)
  console.log(
    `  placement entities=${catalogPlacement.placementEntityCount}`,
  )
  console.log(
    `  ${catalogPlacement.passed ? 'PASSED' : 'FAILED'} (${catalogPlacement.failures.length} issue(s))`,
  )
  allFailures.push(...catalogPlacement.failures)

  console.log('\n3/6 Gameplay placement E2E map')
  const map = buildGameplayPlacementTestMap()
  const placement = runGameplayPlacementSelfCheck(map)
  console.log(
    `  buildings=${placement.counts.buildings} machines=${placement.counts.machines} attachments=${placement.counts.attachments} anchors=${placement.counts.anchors}`,
  )
  console.log(
    `  runtime machine spawns=${placement.runtime.machineSpawns} attachment spawns=${placement.runtime.attachmentSpawns}`,
  )
  console.log(
    `  ${placement.passed ? 'PASSED' : 'FAILED'} (${placement.failures.length} issue(s))`,
  )
  allFailures.push(...placement.failures)

  console.log('\n4/6 Runtime duplication + save bootstrap + scene checks')
  const runtime = runGameplayRuntimeDuplicationCheck(map)
  console.log(
    `  save machines=${runtime.saveMachineCount} attachments=${runtime.saveAttachmentCount}`,
  )
  console.log(
    `  scene tractor=${runtime.scene.tractorNodeCount} attachments=${runtime.scene.attachmentNodeCount} anchor gizmos=${runtime.scene.gameplayAnchorMeshCount}`,
  )
  console.log(
    `  legacy fallback used=${runtime.legacyFallbackUsed} studio debug anchors=${runtime.studioDebugAnchorMeshCount}`,
  )
  console.log(
    `  ${runtime.passed ? 'PASSED' : 'FAILED'} (${runtime.failures.length} issue(s))`,
  )
  allFailures.push(...runtime.failures)

  console.log('\n5/6 Studio interactive editing')
  const interactive = runStudioInteractiveEditingCheck()
  console.log(
    `  ${interactive.passed ? 'PASSED' : 'FAILED'} (${interactive.failures.length} issue(s))`,
  )
  allFailures.push(...interactive.failures)

  console.log('\n6/7 Studio parcel & crop editing')
  const parcels = runStudioParcelEditingCheck()
  console.log(
    `  ${parcels.passed ? 'PASSED' : 'FAILED'} (${parcels.failures.length} issue(s))`,
  )
  allFailures.push(...parcels.failures)

  console.log('\n7/7 Polygon editor regression')
  const polygonEditor = runPolygonEditorCheck()
  console.log(
    `  ${polygonEditor.passed ? 'PASSED' : 'FAILED'} (${polygonEditor.failures.length} issue(s))`,
  )
  allFailures.push(...polygonEditor.failures)

  mkdirSync(OUT_DIR, { recursive: true })
  const mapPath = join(OUT_DIR, 'GameplayPlacementTest.farmos-map.json')
  writeFileSync(mapPath, `${MapFileService.serialize(map)}\n`, 'utf8')

  const exported = exportGameplayPlacementTestPackage(map)
  writeFileSync(
    join(OUT_DIR, 'package.json'),
    `${JSON.stringify(
      {
        ...exported.packageData.manifest,
        worldMapFile: 'GameplayPlacementTest.farmos-map.json',
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  writeFileSync(
    join(OUT_DIR, 'layout.json'),
    `${JSON.stringify(exported.packageData.layout, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(OUT_DIR, 'fields.json'),
    `${JSON.stringify(exported.packageData.fields, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(OUT_DIR, 'camera-profiles.json'),
    `${JSON.stringify(exported.packageData.cameraProfiles, null, 2)}\n`,
    'utf8',
  )

  const report = {
    generatedAt: new Date().toISOString(),
    passed: allFailures.length === 0,
    catalogDefinitions,
    catalogPlacement,
    placement,
    runtime,
    interactive,
    parcels,
    failures: allFailures,
  }
  const reportPath = join(OUT_DIR, 'self-check-report.json')
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  console.log(`\nMap written:    ${mapPath}`)
  console.log(`Report written: ${reportPath}`)

  if (allFailures.length > 0) {
    printFailures('Regression test', allFailures)
    process.exit(1)
  }

  console.log('\nPASSED — gameplay placement regression test is green.')
}

main()
