# MS01A.5 — Renderer Foundation

**Stav:** dokončeno (2026-07-04)  
**Předchází:** [MS01 — Terrain Rendering Foundation (MS1A)](MS01_Terrain_Rendering.md)  
**Související:** [FarmOS_Graphics_Vision_v1.md](../FarmOS_Graphics_Vision_v1.md)

---

## Shrnutí

MS1A dodal terrain pipeline. MS1A.5 centralizuje **celý renderovací stack** do `RenderingSystem` — HDR, image processing, fog, environment, shadows a quality config. Terrain pipeline z MS1A zůstává beze změny v odpovědnosti; pouze přestal vlastnit fog/ambient.

---

## 1. Současný renderer (před MS1A.5)

### Scene

| Kontext | Vytvoření |
|---------|-----------|
| Hra | `SceneManager` → `new Scene(engine)` → `FarmSceneBuilder.build()` |
| Studio | `StudioEngine` → `new Scene(engine)` → `MapSceneBuilder.build()` |

### Camera

- Hra: `CameraController` — `ArcRotateCamera`, profily z `camera-profiles.ts`
- Studio: `StudioCameraController` — samostatná implementace

### Lights

- Hra: `LightingSystem` — hemispheric + directional, magic numbers inline
- Studio: `StudioLighting` — duplicitní konfigurace bez stínů

### Environment & Fog

- `FarmEnvironment` → `applyEnvironmentRendering()` v terrain pipeline
- Fog/ambient/clearColor rozptýlené mezi terrain a scene buildery

### Materials

- Terrain: custom `farmosTerrain` shader (MS1A)
- Ostatní: `StandardMaterial` přímo ve scene builderech

### Babylon rendering pipeline

- Standardní forward rendering Babylon.js
- **Žádné** `ImageProcessingConfiguration`
- **Žádné** HDR / tone mapping / exposure
- **Žádné** IBL
- **Žádné** color curves
- `ShadowGenerator` 1024 px pouze v `LightingSystem` (hra)

---

## 2. Nové komponenty

```
src/rendering/
  RenderingSystem.ts          — centrální orchestrátor
  core/
    HdrController.ts
    ImageProcessingController.ts
    EnvironmentLightingController.ts
    FogController.ts
    ShadowManager.ts
    IblEnvironment.ts           — API only (bez HDRI)

src/config/rendering/
  hdr-config.ts
  image-processing-config.ts
  lighting-config.ts
  shadow-config.ts
  ibl-config.ts
  rendering-quality-config.ts
  environment-config.ts       — rozšířeno (fog modes)
```

---

## 3. Architektura

```
RenderingSystem
├── HdrController              — HDR capability probe + IPC path
├── EnvironmentLightingController — clear color, ambient
├── FogController              — linear fog (exp/height/weather připraveno)
├── ImageProcessingController  — ACES, exposure, contrast, color curves
├── IblEnvironment             — API stub (Milestone 2)
├── ShadowManager              — shadow maps (cascade připraveno)
└── LightingSystem             — hemispheric + directional světla
        ↓
TerrainPipeline (MS1A)         — beze změny odpovědnosti
        ↓
Materials / Vegetation / Weather / Water (budoucí)
```

### Inicializační pořadí

1. Scene + mesh build (FarmSceneBuilder / MapSceneBuilder)
2. `RenderingSystem.initialize()`
   - HDR probe
   - Environment (ambient, clear)
   - Fog
   - Image processing (ACES, exposure, curves)
   - IBL stub
   - Lights + shadows (hra: ano, studio: ne)
   - `syncTerrainShaderLighting()`

3. Po rebuild obsahu scény: `refreshAfterSceneContent()` — stíny + terrain lighting sync

---

## 4. Vazby

| Modul | Vlastník rendereru | Poznámka |
|-------|-------------------|----------|
| HDR | `HdrController` | Fallback na LDR na slabém HW |
| Tone mapping | `ImageProcessingController` | ACES přes Babylon IPC |
| Exposure / contrast | `ImageProcessingController` | |
| Color curves | `ImageProcessingController` | Jemný shadow lift |
| Fog | `FogController` | Config z `environment-config.ts` |
| Ambient / clear | `EnvironmentLightingController` | |
| Stíny | `ShadowManager` | Kvalita z `rendering-quality-config.ts` |
| Světla | `LightingSystem` | Config z `lighting-config.ts` |
| IBL | `IblEnvironment` | `enabled: false`, žádné HDRI |
| Terrain shader světlo | `syncTerrainShaderLighting` | Voláno z RenderingSystem |

### Integrace

- **Game:** `RenderingSystem(sceneManager)` — `initialize({ shadows: true })`
- **Studio:** `RenderingSystem()` + `attach(scene, engine)` — `initialize({ shadows: false })`
- **FarmEnvironment:** deprecated no-op
- **MapSceneBuilder / FarmSceneBuilder:** nevolají environment přímo

---

## 5. Konfigurace (žádné magic numbers)

| Soubor | Obsah |
|--------|-------|
| `hdr-config.ts` | HDR path, float fallback |
| `image-processing-config.ts` | ACES, exposure 1.04, contrast, curves |
| `lighting-config.ts` | Hemi + directional summer rig |
| `shadow-config.ts` | Map size, blur, cascade stub |
| `ibl-config.ts` | `enabled: false`, URL null |
| `rendering-quality-config.ts` | Presety low–ultra |
| `environment-config.ts` | Linear fog 180–2200 m |

---

## 6. Budoucí rozšíření

### Milestone 2 (Lighting & HDR)

- [ ] Napojit `IblEnvironment` na HDRI / prefiltered cube
- [ ] Cascade shadows (`shadow-config.cascade.enabled`)
- [ ] DefaultRenderingPipeline nebo custom HDR render targets
- [ ] Exposure řízený denní dobou
- [ ] Sync IPC s weather/atmosphere

### Fog

- [ ] `exponential` — aktivní implementace v `FogController`
- [ ] `height` — výšková mlha (Vysočina, údolí)
- [ ] `weather` — napojení na weather system

### MS1B (Terrain Visual Upgrade)

- Terrain textury nezávislé na renderer foundation
- Screenshot validace s novým ACES outputem

---

## 7. Co nebylo měněno

- Gameplay systémy
- Editor tools / store logika
- Terrain pipeline moduly (MS1A)
- Map loading, save, placement
- Žádné nové textury, vegetace, assety, počasí

---

## 8. Rizika

| Riziko | Mitigace |
|--------|----------|
| ACES bez HDR render targetů | Jemné nastavení exposure/curves; plný HDR v M2 |
| IBL stub | Explicitně `enabled: false` |
| Studio bez stínů | Konfigurovatelné `shadows: false` |
| Duplicitní `StudioLighting.ts` | Soubor zůstává, nepoužíván — smazat v cleanup sprintu |

---

## 9. Připravenost pro MS1B

Renderer foundation je připraven:

- Centralizovaný image processing — terrain textury budou profitovat z ACES bez dalšího refaktoru
- Shadow manager — připraven pro větší mapy a cascade
- Quality presets — MS1B může zvýšit shadow map size bez zásahu do kódu
- IBL API — Milestone 2 může přidat HDRI bez změny `RenderingSystem` rozhraní

**`npm run build` — prochází bez chyb.**
