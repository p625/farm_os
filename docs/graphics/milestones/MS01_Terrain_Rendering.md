# MS01 — Terrain Rendering Foundation

**Stav:** MS1A dokončeno (architektura) · MS1B plánováno (vizuální upgrade)  
**Datum:** 2026-07-04  
**Související:** [FarmOS_Graphics_Vision_v1.md](../FarmOS_Graphics_Vision_v1.md)

---

## Shrnutí

Milestone 1 je rozdělen na dvě fáze, aby se předešlo přepisování základu rendereru:

| Fáze | Název | Stav |
|------|-------|------|
| **MS1A** | Rendering Foundation | ✅ Hotovo |
| **MS1B** | Visual Upgrade | ⏳ Následuje |

MS1A nevytváří „jen terrain shader“. Zavádí **modulární terrain pipeline**, na které budou navazovat vegetation, roads, fields, decals, weather, puddles, snow, terrain editing, erosion a water blending.

---

## 1. Současná architektura (před MS1A)

### Vytváření terénu

| Kontext | Soubor | Chování |
|---------|--------|---------|
| Legacy prototyp | `FarmSceneBuilder.createTerrain` | `MeshBuilder.CreateGround` bez subdivizí, `StandardMaterial`, jedna difuzní barva |
| Studio / runtime mapa | `MapSceneBuilder` + `TerrainMeshSync` | Ground mesh s subdivizemi dle `terrain.resolution`, výšky z heightfieldu, **vertex colors** jako flat surface tint |
| Editor live sync | `StudioTerrainEditor` → `syncTerrainMeshField` | Inkrementální update pozic a barev při malování |

### Data terénu

`WorldMapTerrain` (`src/types/world-map.ts`):

- `width`, `height` — rozměr v metrech (Map_01: **4000×4000 m**)
- `resolution` — vzorky na osu (Map_01: **64**)
- `heights[]` — row-major heightfield
- `surfaces[]` — row-major index povrchu (0–3)

Studio palette (`TerrainSurfacePalette.ts`): Meadow, Soil, Path, Sand — pouze RGB barvy, žádné PBR.

### Materiály a shadery

- **Žádný custom terrain shader**
- `StandardMaterial` + `diffuseColor` nebo `useVertexColors`
- Magic numbers v `FarmEnvironment` (fog density 0.0065, exp2)
- Pole jako **samostatné mesh vrstvy** (`fields` layer), ne terrain material

### LOD

- Jediná „LOD“ logika: `subdivisions = resolution - 1`
- Žádné chunking, žádné distance-based mesh LOD
- Pro 4×4 km mapu: 63×63 quads na celé ploše

### Rendering stack

```
SceneManager → FarmSceneBuilder / MapSceneBuilder
             → FarmEnvironment (fog, clear color)
             → LightingSystem (hemi + directional, shadow map 1024)
             → StandardMaterial meshes
```

### Připravené rozšíření (před MS1A)

- `TerrainHeightmap` — brush, bilinear sampling, world↔grid mapping
- `TerrainMeshSync` — updatable vertex buffers pro editor
- `resolveTerrainMesh` — pick predicate pro gameplay
- `TerrainSurfacePalette` — surface ID kontrakt pro editor

---

## 2. Nalezené problémy

| # | Problém | Dopad |
|---|---------|-------|
| 1 | Chybí vrstvená render architektura | Každý nový feature (sníh, decals) by vyžadoval přepis |
| 2 | Jednotný flat color / vertex color místo PBR splattingu | Opakující se textury, žádná materiálová věrohodnost |
| 3 | Magic numbers mimo konfiguraci | Nelze ladit bez zásahu do kódu |
| 4 | Pole jako oddělený mesh layer | Duplicita s cílem „pole = terrain material“ |
| 5 | Exp2 fog s vysokou hustotou | Příliš mlhavý horizont, nesedí s cílovým červnovým polednem |
| 6 | Žádný LOD policy pro velké mapy | 8×8 km by neškálovalo |
| 7 | Žádný shader framework | Blokuje macro variation, normal maps, weather masks |
| 8 | Dva nezávislé terrain build path (legacy vs map) | Divergence chování |

---

## 3. Návrh nové architektury

### 3.1 Vrstvy terrain pipeline

```
Layer 1  Base terrain          — heightfield mesh, UV, normály
Layer 2  Terrain materials     — PBR splat blending (MS1A: uniform colors)
Layer 3  Macro variation       — world-space noise (MS1A: zapnuto)
Layer 4  Normal maps           — MS1B: texture slots připraveny
Layer 5  Detail maps           — MS1B+
Layer 6  Decals               — budoucí overlay bez přepisu shaderu
Layer 7  Vegetation masks      — budoucí density input
Layer 8  Weather masks         — budoucí mokré/suché blendy
Layer 9  Snow masks             — budoucí sezónní overlay
Layer 10 Runtime overlays       — debug, editor preview
```

Každá vrstva má `enabled` flag a volitelný `shaderDefine` v `terrain-pipeline-config.ts`.

### 3.2 Modulární struktura kódu

```
src/config/rendering/
  environment-config.ts       — distance fog, clear color
  terrain-material-catalog.ts — 10 PBR materiálů (data-driven)
  terrain-pipeline-config.ts  — LOD tiers, macro, splat, layers

src/types/terrain-rendering.ts — sdílené typy

src/rendering/terrain/
  TerrainRenderPipeline.ts    — mesh build, sync, environment
  TerrainShaderFramework.ts   — ShaderMaterial, uniform binding
  TerrainMaterialRegistry.ts  — catalog lookup, splat descriptors
  TerrainSplatEncoder.ts      — surface ID → RGBA weights
  TerrainLodPolicy.ts         — resolution pro velikost mapy
  TerrainLayerStack.ts        — aktivní vrstvy / defines
  shaders/terrainShaderSources.ts
```

### 3.3 Splat map architektura

- **3× RGBA splat mapy** (12 kanálů) — bez texture atlasu
- Vertex color = splat map 0, UV2 = splat map 1 (RG)
- Splat map 2 připravena pro texture binding v MS1B
- `legacySurfaceId` mapuje studio `surfaces[]` na materiál v catalogu
- Height blending a biome blending — konfigurovatelné, implementace MS1B

### 3.4 Materiálový katalog

Pole **není** samostatný shader. Cílový stav: ornice jako terrain material.

| ID | Název | Legacy surface |
|----|-------|----------------|
| topsoil | Ornice | 1 (Soil) |
| clay | Hlína | 3 (Sand) |
| gravel | Štěrk | 2 (Path) |
| asphalt | Asfalt | — |
| grass | Tráva | — |
| meadow | Louka | 0 (Meadow) |
| dry_grass | Suchá tráva | — |
| mud | Bláto | — |
| rock | Kameny | — |
| forest_floor | Lesní půda | — |

### 3.5 LOD policy

| Tier | Max edge | Default res | Max res |
|------|----------|-------------|---------|
| prototype | 256 m | 32 | 64 |
| small | 1 km | 64 | 128 |
| medium | 2 km | 64 | 192 |
| large | 4 km | 64 | 256 |
| xlarge | 8 km | 96 | 384 |

Budoucí chunking: `estimateTerrainChunkCount()` připraveno v `TerrainLodPolicy.ts`.

### 3.6 Fog

Linear distance fog z `environment-config.ts`:

- start: 180 m, end: 2200 m
- barva horizontu: měkká letní modrá
- nahrazuje exp2 fog s `density: 0.0065`

---

## 4. Seznam upravených souborů

| Soubor | Změna |
|--------|-------|
| `src/rendering/FarmEnvironment.ts` | Deleguje na `applyEnvironmentRendering` |
| `src/rendering/FarmSceneBuilder.ts` | Legacy terrain přes pipeline |
| `src/studio/terrain/TerrainMeshSync.ts` | Splat sync místo flat vertex colors |
| `docs/graphics/FarmOS_Graphics_Vision_v1.md` | MS1A status |

## 5. Nové soubory

| Soubor | Účel |
|--------|------|
| `src/config/rendering/*` | Rendering konfigurace |
| `src/types/terrain-rendering.ts` | Typy pipeline |
| `src/rendering/terrain/*` | Terrain pipeline moduly |
| `docs/graphics/milestones/MS01_Terrain_Rendering.md` | Tento dokument |

---

## 6. Závislosti

```
MapSceneBuilder / FarmSceneBuilder
        ↓
TerrainMeshSync (studio kompatibilita)
        ↓
TerrainRenderPipeline
        ↓
TerrainShaderFramework ← terrain-pipeline-config
        ↓                  terrain-material-catalog
TerrainSplatEncoder ←── TerrainMaterialRegistry
        ↓
TerrainLodPolicy
```

**Nezměněno (záměrně):** gameplay systémy, editor logika, map loading, save, placement.

---

## 7. Budoucí rozšíření

### MS1B — Visual Upgrade (dokončeno 2026-07-04)

- [x] PBR texture sety (procedurální placeholder, vyměnitelné)
- [x] Splat map textury
- [x] Height-aware blending
- [x] Normal map layer
- [x] Detail map layer
- [x] Screenshot benchmark config

### Po MS1B

- Terrain chunking pro 8×8 km
- Decal layer (prach, polní cesty)
- Vegetation mask output z terrain shaderu
- Weather / snow mask blend
- Napojení na Milestone 2 (HDR, IBL, cascade shadows)

---

## 8. Architektonická rozhodnutí

1. **MS1A před MS1B** — nejdřív architektura, pak textury a vizuální skok.
2. **Data-driven config** — žádné magic numbers v rendereru.
3. **Jeden shader framework** — `farmosTerrain` s layer defines, ne hardcoded varianty.
4. **Vertex splat jako přechod** — MS1A encode do color/uv2; MS1B přejde na texture splat maps bez změny API.
5. **Studio bridge** — `TerrainMeshSync` zachovává public API pro editor.
6. **Pole zůstávají jako mesh layer** v MS1A — migrace na terrain material až po field pipeline refaktoru (mimo scope MS1).

---

## 9. Rizika

| Riziko | Mitigace |
|--------|----------|
| Shader bez textur stále vypadá „prototypově“ | MS1B explicitně oddělen; očekávání nastavena |
| 8 materiálových slotů ve shaderu (ne 12) | Třetí splat mapa v MS1B rozšíří uniform binding |
| Výkon custom shaderu vs StandardMaterial | Jednoduchý forward lighting; profiling v MS1B |
| Chunking chybí | LOD policy + max vertices cap; chunking jako MS1B/MS2 task |

---

## 10. Doporučení pro Milestone 2

Po dokončení MS1B:

1. HDR render target + ACES tone mapping
2. Sync `uLightDirection` / `uAmbientColor` z `LightingSystem` místo statických hodnot
3. IBL pro terrain PBR — materiály už mají roughness/metallic
4. Cascade shadow maps — terrain jako hlavní shadow receiver
5. Exposure control — navázat na `colorGrading` config

---

## 11. MS1B — co je hotové (2026-07-04)

- [x] Terrain Material Library (`terrain-material-library.ts`)
- [x] Procedurální PBR atlasy (nahraditelné finálními texturami)
- [x] GPU splat map textury (3× RGBA z heightfield surfaces)
- [x] Height-based splat blending
- [x] Normal maps + macro variation + detail maps
- [x] UV anti-tiling (shader)
- [x] Slope rules API + automatický rock blend na svazích
- [x] Color balance (teplé červnové poledne)
- [x] Screenshot benchmark config (`terrain-screenshot-benchmark.ts`)
- [x] TypeScript build bez chyb

## 12. MS1B — zbývající úkoly

- [ ] Finální PBR textury místo procedurálních placeholderů
- [ ] Screenshot validační sada (5 benchmark pohledů — ruční capture)
- [ ] Biome blending (config připraven, `biomeBlendingEnabled: false`)
- [ ] Terrain chunking pro 8×8 km

## 13. Shader změny (MS1B)

| Oblast | Změna |
|--------|-------|
| Splatting | 3× RGBA splat textury + softness + height blend |
| PBR | Atlas sampling (albedo, normal, height, AO, roughness) |
| Macro | World-space macro atlas + per-material scale |
| Detail | Distance-faded detail atlas |
| Anti-tile | Rotace + offset world UV per slot |
| Slope | `smoothstep` rock overlay z normály |
| Lighting | Normál map blend + spec z roughness |

---

## 14. Původní sekce MS1A

- [x] Terrain pipeline modul (`src/rendering/terrain/`)
- [x] 10-vrstvý layer stack (config + defines)
- [x] PBR material catalog (10 materiálů)
- [x] Splat encoder (RGBA, 3 mapy)
- [x] Custom terrain shader s multi-material blend
- [x] Macro variation (procedural noise)
- [x] Color grading (saturation, contrast, brightness, shadow lift)
- [x] LOD policy pro 4×4 a 8×8 km
- [x] Linear distance fog
- [x] Rendering config v `src/config/rendering/`
- [x] Integrace runtime + studio terrain mesh
- [x] TypeScript build bez chyb

## 12. MS1B — co následuje

- [ ] Texturované PBR materiály
- [ ] GPU splat map textury
- [ ] Height blending
- [ ] Normal map layer aktivace
- [ ] Screenshot validační sada
- [ ] Vizuální srovnání s referenčním stylem (červen, poledne, střední Evropa)
