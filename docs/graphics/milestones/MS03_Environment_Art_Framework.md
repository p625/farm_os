# MS03 — Environment Art Framework

**Status:** dokončeno (2026-07-04)  
**Předchozí milníky:** MS1A, MS1A.5, MS1B, MS1C, MS2  
**Baseline:** MS2 Vegetation Framework (thin instances, 9 layers)

---

## 1. Cíl milníku

Přeměnit procedurálně rozmístěnou vegetaci na **datově řízený Environment Art pipeline** připravený pro profesionální středoevropské assety.

MS03 **není** nový renderer. Renderer (MS2) zůstává beze změny — přijímá pouze `EnvironmentPlacementResult` → instance transformace.

---

## 2. Architektura

```
WorldMap + farm layout context
        ↓
EnvironmentPlacementPlanner
        ↓
  BiomeSampler → ClusterPlacer → EcologyResolver → ColorVariation
        ↓
EnvironmentPlacementResult (instancesByLayer + stats)
        ↓
VegetationInstanceBuilder (adapter, bez placement rules)
        ↓
VegetationSystem → VegetationLayer (thin instances, 9 draw calls)
```

**Konfigurace:** `src/config/environment/`  
**Typy:** `src/types/environment-art.ts`  
**Runtime planner:** `src/rendering/environment/`

Vegetation renderer **nezná** biomy, clustery ani ekologii — pouze instance data.

---

## 3. Biome systém

Biome = sada pravidel (ne renderer).

| ID | Stav | Charakter |
|----|------|-----------|
| `meadow` | aktivní | Otevřená louka, květiny, rozptýlené keře |
| `field` | aktivní | Arální pole — suchá tráva, žádné keře |
| `forest` | aktivní | Hustý lesní interiér |
| `forest_edge` | aktivní | Okraj lesa — více keřů |
| `roadside` | aktivní | Tráva podél cest |
| `farm_yard` | aktivní | Dvůr farmy — řídká vegetace |
| `wetland` | budoucí | Mokřady (disabled) |
| `village` | budoucí | Vesnická zástavba (disabled) |

Každý biome obsahuje:

- `vegetationLayers` — váhy asset rodin
- `densityProfile` — sparse / medium / dense / ultra
- `colorVariation` — profil barevné variance
- `clusterProfile` — typ clusteru (tráva, květiny, keře, stromy…)
- `allowedAssets` — povolené asset rodiny
- `priority` — při překryvu biomes vyhrává vyšší priorita

Sampler: `EnvironmentBiomeSampler.ts` — road, field center, forest interior/edge, farm hub radius.

---

## 4. Asset library

Každý asset je `EnvironmentAssetDefinition`:

- `id`, `category`, `displayName`
- `meshSource` (null = placeholder), `placeholder`
- `minScale`, `maxScale`, `rotationVariance`
- `colorVariation`, `windProfile`, `lodProfile`
- `shadowMode`, `collision`, `enabled`
- `vegetationLayer` — mapování na existující MS2 vrstvu
- `variants[]` — **ne** Grass01/Grass02, ale rodina + varianty

### Kategorie

Grass, Flower, Bush, Tree, DeadTree, Rock, Log, Reed, GroundClutter

### Rodiny (příklady)

| Rodina | Varianty | MS2 layer |
|--------|----------|-----------|
| `grass` | 12 | short_grass |
| `flower` | 12 | meadow_grass |
| `bush` | 6 | shrub |
| `oak` | 8 | scattered_tree |
| `twig`, `leaf_litter`, `stump`… | 3–6 | field_margin |

Soubor: `environment-assets.ts`

---

## 5. Cluster placement

Příroda není šachovnice. Vegetace se rozmisťuje po **clusterech** s mezerami (`gapProbability`).

| Cluster profile | Použití |
|-----------------|---------|
| `grass_clump` | Malé skupiny trávy |
| `flower_patch` | Větší skupiny květin (louka) |
| `shrub_group` | Keře po skupinách |
| `tree_group` | Stromy po skupinách |
| `forest_edge_band` | Pás okraje lesa |
| `roadside_strip` | Pás podél cesty |
| `ground_clutter_scatter` | Mikrodetaily na zemi |

Každý cluster: `minInstances`–`maxInstances`, `radius`, `spacing`, `gapProbability`.

Linear features: `EnvironmentLinearFeatures.ts` — hedgerow a tree_line podél definovaných linií.

---

## 6. Ecology rules

Datově definované vztahy v `environment-ecology.ts`:

| Pravidlo | Efekt |
|----------|-------|
| Tree → tall grass ring | Vyšší hustota trávy kolem kmene |
| Bush → reduced grass | Méně trávy pod keřem |
| Rock → dry grass | Suchá řídká tráva u kamene |
| Forest edge → more shrubs | Více keřů na okraji lesa |
| Field → no shrubs | Keře vyloučeny ze středu pole |
| Meadow → more flowers | Více květin na louce |
| Log → ground clutter | Větvičky/listí u pařezu |

Resolver: `EnvironmentEcologyResolver.ts` — radius falloff, density multiplier.

---

## 7. Ground clutter architektura

Připraveno bez finálních meshů:

- `twig` — větvičky
- `leaf_litter` — listí
- `stump` — pařezy
- `stick` — klacíky
- `dry_grass_clump` — suchá tráva
- `rock` — kameny (field_margin layer)

Vše mapováno na existující `field_margin` / `forest_edge` vrstvy — **žádné nové draw calls**.

---

## 8. Color variation

Profily v `environment-color-variation.ts`:

- Hue ±3 %
- Brightness ±5 %
- Saturation ±4 %

Per-instance výpočet: `EnvironmentColorVariation.ts`  
Renderer čte `colorRgb` na `VegetationInstanceTransform` → thin instance `color` buffer v `VegetationLayer`.

---

## 9. Density profiles

| ID | Multiplier | Cluster multiplier |
|----|------------|-------------------|
| `sparse` | 0.55 | 0.70 |
| `medium` | 1.00 | 1.00 |
| `dense` | 1.45 | 1.25 |
| `ultra` | 2.10 | 1.55 |

Každý biome používá jeden profil (`environment-density.ts`).

---

## 10. Placement API

```typescript
// Planner output
interface EnvironmentPlacementResult {
  instancesByLayer: Record<VegetationLayerType, EnvironmentPlacementInstance[]>
  stats: EnvironmentPlacementStats
  densityProfile: EnvironmentDensityProfileId
}
```

Entry point: `EnvironmentPlacementPlanner.plan()`  
Adapter: `VegetationInstanceBuilder.buildAll()` deleguje na planner.

---

## 11. Debug (DEV only)

`EnvironmentDebug.ts` — po build loguje:

- aktivní biomy
- počet asset rodin
- počet clusterů
- počet instancí
- color variation statistics (min/max hue, brightness, saturation)

Console tag: `[FarmOS Environment]`

---

## 12. Výkonnostní dopad

| Metrika | MS2 | MS03 |
|---------|-----|------|
| Vegetation layers | 9 | 9 (beze změny) |
| Draw calls | 9 thin instance meshes | 9 (beze změny) |
| Placement CPU | Grid scatter | Cluster scatter (podobná složitost) |
| Per-instance data | matrix | matrix + optional color buffer |

Žádné nové meshe, žádný nový renderer, žádné porušení thin instances.

---

## 13. Připravenost na finální assety

1. Nahradit `meshSource: null` skutečnými GLB cestami v `environment-assets.ts`
2. Přidat variantní mesh mapping (variant → sub-mesh nebo samostatný source)
3. Zapnout `wetland`, `village` biomy po map datech
4. Vegetation masks z mapy (budoucí raster)
5. Screenshot validace vůči MS1B baseline po vizuálním upgradu

---

## 14. Doporučení pro MS4 Sky & Atmosphere

- Sladit color variation profily s budoucím sky LUT / atmospheric scattering
- Forest edge a meadow biomy ladit proti obloze za letního poledne
- Připravit biome-specific ambient tint (data only, bez implementace weather)
- Atmosférická dálka by měla ovlivnit tree/shrub LOD cull distances v configu

---

## 15. Soubory

### Nové

```
src/types/environment-art.ts
src/config/environment/
  environment-biomes.ts
  environment-assets.ts
  environment-clusters.ts
  environment-ecology.ts
  environment-color-variation.ts
  environment-density.ts
  index.ts
src/rendering/environment/
  EnvironmentPlacementPlanner.ts
  EnvironmentBiomeSampler.ts
  EnvironmentClusterPlacer.ts
  EnvironmentEcologyResolver.ts
  EnvironmentColorVariation.ts
  EnvironmentLinearFeatures.ts
  EnvironmentDebug.ts
  index.ts
docs/graphics/milestones/MS03_Environment_Art_Framework.md
```

### Upravené

```
src/types/vegetation-rendering.ts          — rozšířen VegetationInstanceTransform
src/rendering/vegetation/VegetationInstanceBuilder.ts — delegace na planner
src/rendering/vegetation/VegetationSystem.ts        — environment debug log
src/rendering/vegetation/VegetationLayer.ts         — thin instance color buffer
docs/graphics/FarmOS_Graphics_Vision_v1.md
```

---

## 16. Build status

```
npm run build  ✅
npm run check  ✅ (lint + tsc + gameplay placement regression)
```
