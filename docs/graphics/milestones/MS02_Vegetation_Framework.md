# MS02 — Vegetation Framework

**Status:** dokončeno (2026-07-04)  
**Předchozí milníky:** MS1A, MS1A.5, MS1B, MS1C  
**Baseline pro validaci:** MS1B terrain + MS1C screenshot benchmark

---

## 1. Současný stav před MS2

### Co existovalo

- **Studio vegetation editor** — ruční placement, paint brush, 11 typů v `VegetationTypePalette`
- **Procedurální placeholdery** — `VegetationMeshBuilder.ts` (strom, keř, tráva jako samostatné meshe)
- **Map vegetation objects** — `layer: 'vegetation'` v `WorldMapDocument`
- **Zone scatter** — `expandVegetationZones.ts` pro Map 01 (lesy, remízky, aleje)
- **Legacy dekorace** — `FarmDecorationsBuilder` hardcoded stromy/keře bez mapy

### Co chybělo

- Runtime **GPU instancing** (thin instances)
- Datově řízené **vegetation layers**
- **Placement rules** (cesty, pole, remízky)
- **LOD policy** a wind foundation
- Integrace s **RenderingSystem** (stíny, refresh)
- Samostatný rendering modul `src/rendering/vegetation/`

---

## 2. Nová architektura

```
FarmSceneBuilder
    ↓
VegetationSystem
    ↓
VegetationLayerRegistry (9 layers)
    ↓
VegetationInstanceBuilder + VegetationPlacementRules
    ↓
VegetationLayer (thin instances per layer)
    ↓
VegetationWindController
```

**Konfigurace:** `src/config/rendering/vegetation/`  
**Typy:** `src/types/vegetation-rendering.ts`  
**Runtime:** `src/rendering/vegetation/`

Studio editor zůstává beze změny — mapové objekty se v gameplay runtime ingestují do instancovaných vrstev místo per-object meshů.

---

## 3. Vegetation layers

| ID | Typ | Popis |
|----|-----|-------|
| `short_grass` | short_grass | Krátká tráva — louky, otevřená krajina |
| `meadow_grass` | meadow_grass | Vyšší luční tráva |
| `field_margin` | field_margin | Suchá tráva na mezích polí |
| `roadside_grass` | roadside_grass | Tráva podél cest |
| `shrub` | shrub | Malý keř |
| `hedgerow` | hedgerow | Živý plot / remízek |
| `forest_edge` | forest_edge | Okraj lesa |
| `tree_line` | tree_line | Alej / stromořadí |
| `scattered_tree` | scattered_tree | Rozptýlené stromy |

Každá vrstva obsahuje: density, scale variation, placement rules, LOD, wind profile, placeholder asset id, debug color.

---

## 4. Placement rules

Placeholder rules (bez raster vegetation mask):

| Rule ID | Chování |
|---------|---------|
| `avoid_roads` | Žádná vegetace na vozovce (kromě `roadside_grass`) |
| `avoid_field_centers` | Střed aktivních polí bez vegetace |
| `meadow_bias` | Vyšší váha na loukách mimo pole |
| `field_edge_boost` | Meze polí — `field_margin`, `shrub` |
| `road_edge_boost` | Okraje cest — `roadside_grass` |
| `forest_edge_boost` | Okraj lesních zón |
| `hedgerow_lines` | Linie remízků |
| `tree_line_alley` | Alejové linie |
| `forest_interior_boost` | Stromy uvnitř lesních zón |

Data zdroje: `getActiveFieldLayout()`, road rects z farm layout, forest zones z Map 01 blockout, map vegetation points z `WorldMapDocument`.

---

## 5. LOD policy

| Pásmo | Vzdálenost | Chování |
|-------|------------|---------|
| near | 0–55 m | Plná hustota |
| mid | 55–110 m | ~55 % instancí |
| far | 110–180 m | ~25 % instancí |
| hidden | >180 m | Vypnuto |

**Speciální pravidla:**

- `short_grass` — vypnuto při vysoké kameře nebo vzdálenosti >95 m
- Architektura připravena pro budoucí billboardy (`enableBillboardArchitecture: true`)

---

## 6. Wind foundation

- `VegetationWindController` — jemný pohyb přes `scene.onBeforeRenderObservable`
- Tráva: nejsilnější sway (~0.55 strength)
- Keře: střední (~0.22)
- Stromy: minimální (~0.08)
- Cíl: klidný červnový den, žádný přehnaný vítr

---

## 7. Placeholder assety (MS2)

Označeno `MS2_PLACEHOLDER` v metadata:

1. `placeholder_short_grass` — krátká tráva (box)
2. `placeholder_meadow_grass` — vyšší luční tráva
3. `placeholder_dry_grass` — suchá tráva na mezích
4. `placeholder_shrub_small` — malý keř (sphere)
5. `placeholder_shrub_large` — větší keř / lesní okraj
6. `placeholder_young_tree` — mladý listnatý strom (válec + koruna)
7. `placeholder_forest_edge` — větší keřový cluster

Barvy: `VEGETATION_BIOME_CONFIG` — středoevropská letní paleta, saturation cap 0.62.

---

## 8. Performance poznámky

- **Thin instances** — 1 draw call per layer (9 vrstev max)
- **Cap per layer** — `maxInstances` v katalogu (např. short_grass 12000)
- **LOD thinning** při build time podle kamery
- **Stíny** — pouze keře a stromy (`farmos_veg_src_*` tree/shrub layers)
- Očekávaný počet instancí: **15 000–35 000** (medium density)

---

## 9. Screenshot validace (MS2)

Použij existující benchmark kamery (F8 / ruční Windows screenshoty).

### Nejdůležitější pohledy

| Preset | Co hodnotit |
|--------|-------------|
| `meadow_ground_view` | Hustota trávy, ground readability, anti-chaos |
| `forest_edge_view` | Remízky, okraj lesa, stíny |
| `horizon_view` | Vliv vegetace na dálkový výhled, fog |
| `dirt_road_view` | Okraje cest, přechod tráva → štěrk |
| `field_long_view` | Čitelnost polí vs. vegetace na mezích |

### Checklist MS2

- [ ] Hustota — není koberec, není prázdno
- [ ] Čitelnost polí zachována
- [ ] Přirozené okraje cest
- [ ] Remízky působí věrohodně
- [ ] Barevná konzistence s terrainem (žádná přesycená zelená)
- [ ] Dálkový výhled — hloubka bez šumu
- [ ] Subjektivní FPS / plynulost

---

## 10. Známá omezení

- Placeholder geometrie — finální assety (glTF) chybí
- Ground Y = 0 (bez terrain height sampling v runtime scatter)
- Žádné raster vegetation masks (pouze pravidla + zóny)
- Wind = rotace source meshu, ne per-instance vertex shader
- Studio preview stále používá per-object meshe
- Billboard LOD neimplementován

---

## 11. Další kroky

1. **MS2B — Vegetation Visual Upgrade** — finální assety, lepší placeholdery
2. Terrain height sampling pro placement
3. Raster vegetation mask texture
4. Per-instance wind shader
5. Billboard impostors pro dálkové stromy
6. Sezónní a biome varianty

---

## 12. DEV debug

Po startu hry (DEV) konzole vypíše:

```
[FarmOS Vegetation] { densityPreset, totalInstances, layers: [...] }
```

Layers lze vypnout přes `setVegetationLayersEnabled(registry, false)` v `VegetationDebug.ts`.
