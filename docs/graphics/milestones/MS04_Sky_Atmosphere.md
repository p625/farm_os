# MS04 — Sky & Atmosphere

**Status:** dokončeno (2026-07-04)  
**Předchozí milníky:** MS1A–MS1C, MS2, MS3  
**Vizuální cíl:** „Klidný letní den ve střední Evropě.“

---

## 1. Cíl milníku

Výrazně zlepšit **atmosféru a hloubku krajiny** bez nového rendereru, bez počasí a bez volumetric efektů.

Rozdíl musí být **okamžitě viditelný** na benchmark screenshotu — zejména `horizon_view` a `field_long_view`.

---

## 2. Architektura

```
RenderingSystem
    ↓
SkySystem
    ├── SkyGradient        (procedurální obloha — zenith → horizon)
    ├── AtmosphereController (linear haze, distance color)
    └── SunController      (noon sun profile → lights + ambient)
```

**Konfigurace:** `src/config/rendering/sky/`  
**Runtime:** `src/rendering/sky/`  
**Typy:** `src/types/sky-rendering.ts`

MS1A.5 `FogController` a `EnvironmentLightingController` jsou nahrazeny SkySystem vrstvou. Terrain, vegetace a environment framework **nebyly přepsány**.

---

## 3. Sky systém

Procedurální **sky dome** (infinite distance sphere) s gradient shaderem:

| Parametr | Popis |
|----------|-------|
| `zenithColor` | Tmavší modrá nahoře |
| `horizonColor` | Světlejší obzor |
| `gradientPower` | Křivka přechodu |
| `horizonSoftness` | Měkkost u horizontu |
| `hazeIntensity` | Jemná mlžná vrstva u obzoru |

Aktivní profil: `june_noon_central_europe`

---

## 4. Atmospheric haze

**Ne volumetric fog** — lineární atmosférická perspektiva:

- `fogStart: 95`, `fogEnd: 1280` (dříve 180–2200)
- Barva mlhy = blend horizontu oblohy (`resolveAtmosphereHazeColor`)
- `contrastReduction` — dokumentovaný parametr pro budoucí shader rozšíření

Efekt: vzdálené objekty (vegetace placeholdery, objekty se StandardMaterial) získávají nižší kontrast a splývají s obzorem.

---

## 5. Sunlight profiles

| Profil | Stav |
|--------|------|
| Morning | připraveno (`enabled: false`) |
| **Noon** | **aktivní** |
| Afternoon | připraveno (`enabled: false`) |

Noon profil řídí:

- směr a intenzitu directional light
- hemispheric diffuse / groundColor
- ambient tint
- exposure bias (1.04)

---

## 6. Ambient color

- `GLOBAL_AMBIENT_PROFILE` — aktivní globální ambient
- `BIOME_AMBIENT_PROFILES` — meadow / forest / roadside (**data only**, MS4 neaplikuje lokálně)

---

## 7. Distance color

`atmosphere-config.ts` → `distanceColor`:

- `nearDistance`, `farDistance`
- `horizonBlend` — váha barvy obzoru v mlze
- `saturationFalloff` — připraveno pro budoucí shader pass

---

## 8. DEV debug

Console tag `[FarmOS Sky]` po inicializaci:

- aktivní sky profile
- sun profile (elevation, azimuth, ambient)
- haze start/end/color
- zenith / horizon colors

---

## 9. Screenshot validace

Benchmark kamery (MS1C) — prioritní pohledy:

| Preset | MS4 focus |
|--------|-----------|
| `field_long_view` | atmosférická hloubka, sky gradient |
| `horizon_view` | haze, měkký horizont |
| `forest_edge_view` | haze na vzdálených stromech |

F8 / F9 benchmark tooling beze změny.

---

## 10. Omezení (dodrženo)

- ❌ počasí, déšť, sníh
- ❌ volumetric clouds / fog
- ❌ SSR, SSAO, DOF, bloom, lens flare
- ❌ přepis terrain / vegetation / environment / RenderingSystem architektury

---

## 11. Budoucí rozšíření

- Morning / Afternoon sun profily (zapnout `enabled: true`)
- HDRI / IBL napojení na sky profiles
- Biome-local ambient (data už existují)
- Terrain shader fog pass (bez přepisu MS1B materiálů)
- Weather milestone — přepínání sky + sun profilů

---

## 12. Soubory

### Nové

```
src/types/sky-rendering.ts
src/config/rendering/sky/
src/rendering/sky/
docs/graphics/milestones/MS04_Sky_Atmosphere.md
```

### Upravené

```
src/rendering/RenderingSystem.ts
src/rendering/LightingSystem.ts
src/rendering/core/ImageProcessingController.ts
src/config/rendering/visual-benchmark-config.ts
src/config/rendering/index.ts
src/config/rendering/environment-config.ts (deprecated note)
docs/graphics/FarmOS_Graphics_Vision_v1.md
```

---

## 13. Build status

```
npm run build  ✅
npm run check  ✅
```
