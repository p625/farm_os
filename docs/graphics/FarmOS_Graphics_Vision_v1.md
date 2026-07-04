# FarmOS Graphics Vision v1
## Referenční dokument pro vývoj rendereru

FarmOS je realistický zemědělský simulátor se zaměřením na klidnou, čistou a důvěryhodnou středoevropskou krajinu. Cílem není kopírovat Farming Simulator ani dosáhnout fotorealismu za každou cenu. Cílem je vytvořit moderní realistickou simulaci nové generace s vlastní vizuální identitou.

## 1. Vizuální filozofie

FarmOS není hra o spektakulárních efektech. Je to simulace krajiny, ve které hráč tráví dlouhý čas. Prostředí musí působit klidně, přirozeně, realisticky, čitelně a důvěryhodně.

Každý grafický prvek má podporovat atmosféru skutečné středoevropské krajiny, nikoli hollywoodský blockbuster.

## 2. Cílový vizuální styl

FarmOS kombinuje:

- AAA realistické nasvícení
- jemně stylizované barvy
- bohaté prostředí
- vysokou čitelnost gameplaye

Zásady:

- žádné přesaturované barvy
- žádný přehnaný kontrast
- žádné agresivní bloom efekty
- žádné Instagram filtry
- žádné efekty jen proto, že jsou moderní

## 3. Hlavní vizuální pilíře

### Krajina

Nejdůležitější část hry. Musí připomínat střední Evropu: jižní Čechy, Vysočinu, jižní Moravu, Rakousko nebo Bavorsko.

Klíčové prvky:

- zvlněný terén
- velké otevřené výhledy
- pole
- louky
- aleje
- remízky
- polní cesty
- vesnická zástavba
- lesy
- rybníky a potoky

### Světlo

Světlo je největší rozdíl mezi prototypem a moderně působící hrou.

Cíl:

- měkké letní denní světlo
- čitelné stíny
- přirozená obloha
- atmosférická dálka
- pocit krásného červnového dne

### Vegetace

Vegetace nesmí působit jako jednotlivé modely, ale jako ekosystém:

strom → keře → vysoká tráva → nízká tráva → květiny → větve → kameny → mikrodetaily.

### Materiály

Materiály musí být fyzikálně konzistentní a připravené pro PBR workflow.

Stejný materiál musí vypadat správně za dne, večer, v dešti, v mlze i na sněhu.

## 4. Rendering Architecture

Renderer bude rozdělen na vrstvy:

```
Scene
↓
Terrain
↓
Vegetation
↓
Buildings
↓
Vehicles
↓
Characters
↓
Particles
↓
Atmosphere
↓
Lighting
↓
Post Processing
↓
UI
```

Každá vrstva musí být samostatně rozšiřitelná.

## 5. Technologická vize

Současný stack:

- TypeScript
- Babylon.js
- WebGL2

Krátkodobě implementovat:

- PBR
- IBL
- HDR
- shadow cascades
- terrain splatting
- GPU instancing
- vegetation instancing
- základní fog
- tone mapping
- ambient occlusion

Střednědobě:

- custom GLSL shadery
- terrain shader
- vegetation shader
- wind shader
- weather shader
- cloud shader

Dlouhodobě:

- WebGPU
- WGSL
- compute shaders
- GPU driven rendering
- clustered lighting
- GPU culling
- virtual texturing, pokud bude potřeba

## 6. Doporučené pořadí grafických milestone

### Milestone 1 — Terrain Rendering Foundation
Priorita: ★★★★★

Rozděleno na dvě fáze (snížení rizika přepisování základu):

#### MS1A — Rendering Foundation ✅
Priorita: ★★★★★ · **Stav: dokončeno (2026-07-04)**

Obsah:

- modulární terrain pipeline (`src/rendering/terrain/`)
- 10-vrstvý layer stack (base → overlays)
- PBR material catalog (10 terrain materiálů)
- splat encoder architektura (3× RGBA)
- shader framework (`farmosTerrain`)
- macro variation (procedural)
- LOD policy (4×4 km, 8×8 km)
- distance fog (linear)
- rendering config (`src/config/rendering/`)

Dokumentace: [MS01_Terrain_Rendering.md](milestones/MS01_Terrain_Rendering.md)

#### MS1B — Visual Upgrade ✅
Priorita: ★★★★★ · **Stav: dokončeno (2026-07-04)**

Obsah:

- datově řízená `TERRAIN_MATERIAL_LIBRARY` (9 PBR materiálů)
- procedurální PBR atlasy (albedo, normal+height, AO+roughness, macro, detail)
- GPU splat map textury (3× RGBA)
- height-based blending
- macro variation (barva, roughness, normály)
- detail mapy s distance fade
- UV anti-tiling (world-space + rotace)
- slope rules API + shader rock blend
- screenshot benchmark config

Přínos:
Celá krajina přestane působit jako prototyp — viditelný grafický skok na screenshotu.

#### MS1C — Visual Validation & Screenshot Benchmark ✅
Priorita: ★★★★☆ · **Stav: dokončeno (2026-07-04)**

Obsah:

- `visual-benchmark-config.ts` — 7 datově řízených benchmark kamer
- `VisualBenchmarkRunner` — aplikace presetů, render quality, konzolový log
- DEV hotkeys F8 / Shift+F8 — přepínání benchmark kamer
- `captureCurrentBenchmarkFrame()` — volitelný PNG export přes canvas
- dokumentace vizuálního review a MS1B baseline

**Pravidlo:** Žádný další velký graphics milestone bez screenshot benchmarku a review vůči poslední baseline.

Dokumentace: [FarmOS_Visual_Benchmark_2026.md](visual-benchmarks/FarmOS_Visual_Benchmark_2026.md)

**Další doporučený krok:** MS2 — Vegetation Framework

#### MS1A.5 — Renderer Foundation ✅
Priorita: ★★★★★ · **Stav: dokončeno (2026-07-04)**

Obsah:

- `RenderingSystem` — centrální orchestrátor rendereru
- HDR workflow (capability probe + image processing path)
- Babylon `ImageProcessingConfiguration` — ACES, exposure, contrast, color curves
- centralizovaný fog (linear)
- `ShadowManager` (cascade připraveno architektonicky)
- `IblEnvironment` API (bez HDRI)
- rendering quality presets
- config v `src/config/rendering/`

Dokumentace: [MS01A5_Renderer_Foundation.md](milestones/MS01A5_Renderer_Foundation.md)

Původní obsah milestone (celkem):

- nový terrain shader
- texture splatting
- normálové mapy
- macro variation
- terrain blending
- lepší UV
- terrain LOD
- základní distance fog

### Milestone 2 — Lighting & HDR Pipeline
Priorita: ★★★★★

Obsah:

- HDR pipeline
- directional light setup
- sky light
- IBL
- ACES tone mapping
- contact shadows
- cascade shadows
- ambient occlusion
- exposure control

Přínos:
Každý objekt ve hře začne působit kvalitněji díky lepšímu světlu.

### Milestone 3 — Vegetation System
Priorita: ★★★★★

Obsah:

- GPU instancing
- tráva
- květiny
- keře
- aleje
- lesní okraje
- větrný shader
- billboard LOD
- density maps

Přínos:
Mapa začne působit živě a přirozeně.

### Milestone 4 — PBR Materials
Priorita: ★★★★☆

Obsah:

- půda
- ornice
- hlína
- štěrk
- beton
- kámen
- asfalt
- dřevo
- kůra
- cihla
- střešní krytina

Přínos:
Svět začne být materiálově uvěřitelný.

### Milestone 5 — Atmosphere
Priorita: ★★★★☆

Obsah:

- sky system
- clouds
- fog
- distance haze
- sun scattering
- golden hour
- blue hour

Přínos:
Mapa získá atmosféru a hloubku.

### Milestone 6 — Weather
Priorita: ★★★★☆

Obsah:

- déšť
- mlha
- vítr
- sníh
- mokré materiály
- louže

Přínos:
Svět získá variabilitu a sezónní charakter.

### Milestone 7 — Water
Priorita: ★★★★☆

Obsah:

- řeky
- potoky
- rybníky
- odrazy
- vlnění
- shore blending
- caustics

Přínos:
Vodní plochy přestanou být statickou texturou.

### Milestone 8 — Environment Polish
Priorita: ★★★☆☆

Obsah:

- prach
- pyl
- padající listí
- hmyz
- ptáci
- drobné animace vegetace
- mikrodetaily krajiny

Přínos:
Svět začne působit živě i v klidu.

## 7. Výkonnostní filozofie

FarmOS nebude stavět na extrémně drahých efektech. Cílem je bohatý svět s rozumným výkonem.

Zásady:

- chytrý LOD
- GPU instancing
- kvalitní shadery
- konzistentní PBR
- dobrá kompozice scény
- škálovatelné nastavení kvality

## 8. Čemu se vyhnout

Vyhnout se efektům, které ruší při dlouhém hraní:

- přehnaný bloom
- silný depth of field při běžném hraní
- přesaturované LUT filtry
- agresivní lens flare
- chromatická aberace
- silná vinětace
- trvalý film grain
- přehnaně tmavé stíny

Tyto efekty mohou být použity výjimečně ve foto režimu, nikoli jako základ renderingu.

## 9. Pravidlo pro každý grafický návrh

Každý budoucí grafický návrh musí odpovědět:

1. Jak zlepší vzhled hry?
2. Jak ovlivní atmosféru?
3. Jaký bude přínos pro hráče?
4. Jak zapadá do vizuální identity FarmOS?
5. Jaká je implementační náročnost?
6. Jaká je priorita?

## 10. První implementační směr

Nezačínej vegetací ani efekty.

Nejdříve připrav:

1. Terrain Rendering Foundation
2. Lighting & HDR Pipeline
3. Vegetation System

Důvod:
Pokud nebude kvalitní terén, světlo a atmosféra, žádné assety ani tráva hru nezachrání.

## 11. Pravidlo screenshot validace

Po každém grafickém milestone musí vzniknout minimálně:

- screenshot z farmy
- screenshot z pole
- screenshot z lesa/remízku
- screenshot z dálkového výhledu
- screenshot za jiného denního času, pokud je dostupný

Teprve po vizuálním porovnání s cílovým stylem pokračovat dál.

**MS1C (2026):** Benchmark systém je implementován — používej 7 presetů z `visual-benchmark-config.ts` a checklist v [FarmOS_Visual_Benchmark_2026.md](visual-benchmarks/FarmOS_Visual_Benchmark_2026.md). **Žádný další velký graphics milestone bez dokončeného benchmark review.**

**Další doporučený krok po MS1C:** MS2 — Vegetation Framework.

## 12. Závěr

FarmOS má směřovat k moderní realistické simulaci středoevropské krajiny.

Prioritou je:

- atmosféra
- čitelnost
- práce se světlem
- krajina
- přirozenost

Nikoli maximalizace počtu efektů.

---

## 13. Milestone progress log

### MS1A — Terrain Rendering Foundation (2026-07-04)

**Implementováno:**

- `src/rendering/terrain/` — kompletní pipeline modul
- `src/config/rendering/` — environment, materiály, pipeline config
- Custom `farmosTerrain` shader s multi-material splat blending
- Macro variation a color grading
- Linear distance fog
- LOD policy pro mapy do 8×8 km
- Integrace do `FarmSceneBuilder`, `MapSceneBuilder` (přes `TerrainMeshSync`)

**Připraveno (aktivace v MS1B):**

- Normal map layer (`TERRAIN_NORMALS` define)
- Detail map layer
- Decal / vegetation / weather / snow / overlay vrstvy
- Texture sloty v material catalogu
- Splat map 2 (třetí RGBA sada)
- Height blending a biome blending config

**Následuje:**

- MS1B Visual Upgrade — textury, splat maps, screenshot validace
- Milestone 2 — Lighting & HDR Pipeline (IBL, cascade shadows, plný HDR)

### MS1A.5 — Renderer Foundation (2026-07-04)

**Implementováno:**

- `RenderingSystem` — HDR, image processing, fog, environment, shadows, quality
- `ImageProcessingController` — ACES tone mapping, exposure, contrast, color curves
- `ShadowManager` — centralizované stíny s quality presets
- `IblEnvironment` — architektonické API (bez HDRI assetů)
- Integrace do `Game` a `StudioEngine`
- Konfigurace: `hdr-config`, `image-processing-config`, `lighting-config`, `shadow-config`, `ibl-config`, `rendering-quality-config`

**Připraveno:**

- Cascade shadow config (`enabled: false`)
- Fog modes: exponential, height, weather (placeholders)
- IBL hook pro Milestone 2

**Následuje:**

- Milestone 2 — Lighting & HDR Pipeline (IBL, cascade shadows, plný HDR)
- Nahrazení procedurálních placeholderů finálními texturami v `textures/terrain/library/`

### MS1B — Terrain Visual Upgrade (2026-07-04)

**Implementováno:**

- `terrain-material-library.ts` — 9 materiálů (louka, tráva, ornice, hlína, lesní půda, štěrk, asfalt, bláto, kameny)
- `TerrainProceduralTextures.ts` + `TerrainTextureLibrary.ts` — PBR atlasy a splat mapy
- `terrain-visual-config.ts` — height blend, detail, anti-tile, slope, color balance
- `terrain-slope-rules.ts` — API pro budoucí automatické pravidla
- `terrain-screenshot-benchmark.ts` — 5 benchmark kamer
- Přepsaný `farmosTerrain` fragment shader — PBR splatting, normály, macro, detail

**Připraveno pro výměnu assetů:**

- Každý materiál má `textures.*` cesty pod `/textures/terrain/library/{id}/`
- Procedurální generátor lze vypnout po nahrání finálních textur

**Následuje:**

- MS1C Visual Validation — screenshot benchmark systém ✅
- Milestone 2 — Lighting & HDR
- Finální texture art pass

### MS1C — Visual Validation & Screenshot Benchmark (2026-07-04)

**Implementováno:**

- `visual-benchmark-config.ts` — 7 benchmark presetů (farm, field, meadow, road, forest, horizon, closeup)
- `VisualBenchmarkRunner.ts` — kamera, FOV, render settings, konzolový log, volitelný PNG capture
- `VisualBenchmarkInput.ts` — DEV hotkeys F8 / Shift+F8
- Integrace do `Game.ts` (pouze DEV, dynamic import)
- `terrain-screenshot-benchmark.ts` — zpětná kompatibilita (re-export)
- Dokumentace: `docs/graphics/visual-benchmarks/FarmOS_Visual_Benchmark_2026.md`

**Baseline:**

- MS1B je první terrain visual baseline — všechny další změny porovnávat vůči MS1B screenshot sadě

**Následuje:**

- MS2 — Vegetation Framework
- Finální texture art pass
- Milestone 2 — Lighting & HDR (IBL, cascade shadows)
