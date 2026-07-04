# FarmOS Visual Benchmark 2026

Referenční dokument pro vizuální validaci rendereru po grafických milnících.

**Verze:** 2026-MS1C  
**Baseline:** MS1B — Terrain Visual Upgrade  
**Konfigurace:** `src/config/rendering/visual-benchmark-config.ts`  
**Runtime tooling (DEV):** `src/rendering/debug/BenchmarkRunner.ts`, `ScreenshotCaptureManager.ts`

---

## 1. Účel benchmarku

FarmOS už neměří grafický pokrok jen počtem implementovaných funkcí. Musíme měřit **skutečný obraz**.

Tento benchmark systém zajišťuje:

- opakovatelné screenshoty se stejnými kamerami, FOV, denní dobou, počasím a render nastavením
- objektivní porovnání mezi milníky
- dlouhodobou vizuální regresi — renderer může technicky růst, ale obraz se musí posouvat správným směrem

**Pravidlo:** Žádný další velký graphics milestone bez screenshot benchmarku a vizuálního review vůči poslední baseline.

---

## 2. MS1B Baseline

**MS1B — Terrain Visual Upgrade** je první oficiální terrain visual baseline FarmOS.

Obsahuje:

- PBR terrain splatting s 9 materiály
- procedurální atlasy (placeholder pro finální art)
- height blend, macro variation, detail mapy, anti-tiling, slope rock rules
- RenderingSystem (ACES, fog, exposure, shadows)

Všechny budoucí grafické změny se porovnávají **vůči MS1B baseline sadě screenshotů** pořízené tímto benchmark systémem.

První baseline sadu vlož do sekce 8 po prvním review.

---

## 3. Benchmark pohledy

| ID | Název | Zaměření |
|----|-------|----------|
| `farm_yard_view` | Farm Yard View | Farma směrem do krajiny — čitelnost farmy a okolí |
| `field_long_view` | Field Long View | Dlouhý výhled přes pole — tiling a dálka |
| `meadow_ground_view` | Meadow Ground View | Nízký pohled — tráva, detail, anti-tiling |
| `dirt_road_view` | Dirt Road View | Polní cesta — přechody materiálů |
| `forest_edge_view` | Forest Edge View | Okraj lesa / svah — lesní půda, slope rock |
| `horizon_view` | Horizon View | Dálkový výhled — fog, horizont, hloubka |
| `material_closeup` | Material Closeup View | Detail terrain materiálu zblízka |

Každý preset obsahuje: `id`, `displayName`, `description`, `cameraPosition`, `cameraTarget`, `fov`, `timeOfDay`, `weatherProfile`, `renderQuality`, `validationFocus`, `notes`.

**Podmínky (všechny presety):**

- Denní doba: červnové poledne (`june_noon`)
- Počasí: `clear`
- Render quality: `high`

---

## 4. Co hodnotit na každém pohledu

### Farm Yard View
- Čitelnost farmy vůči okolnímu terénu
- Přirozenost přechodů kolem budov
- Balance oblohy a terénu

### Field Long View
- Opakování textur v dlouhém záběru
- Macro variation — není pole „plastové“
- Čitelnost ornice / pole

### Meadow Ground View
- Detail trávy a normál zblízka
- Anti-tiling — žádné zjevné dlaždice
- Ground readability pro gameplay

### Dirt Road View
- Splat blending a height blend na hranách
- Přechod štěrk → ornice → tráva
- Žádné ostré „švy“

### Forest Edge View
- Lesní půda vs. louka
- Slope rock rules na svazích
- Stíny pod stromy / okraj lesa

### Horizon View
- Fog a měkký horizont
- Hloubka krajiny
- Dálková čitelnost bez šumu

### Material Closeup View
- PBR detail (albedo, normal, roughness)
- Žádné rozmazání detail map
- Mikrovariace bez artefaktů

---

## 5. Jak porovnávat screenshoty

1. Spusť hru v **DEV** režimu (`npm run dev`).
2. Stiskni **Shift+F9** — automaticky se vygeneruje celá sada screenshotů.
3. Screenshoty najdeš v `docs/graphics/visual-benchmarks/screenshots/latest/`.
4. Porovnej side-by-side s předchozí verzí (archivuj `latest/` před dalším milníkem, pokud potřebuješ historii).
5. Vyplň checklist v sekci 6.

**Neporovnávej** screenshoty z různých FOV, jiné denní doby nebo jiného render quality presetu.

### Workflow po každém Graphics Milestone

```
Shift+F9
    ↓
Vygeneruje se nová sada screenshotů (latest/)
    ↓
Porovnat s předchozí verzí
    ↓
Vyhodnotit rozdíly (checklist sekce 6)
    ↓
Teprve poté pokračovat na další milestone
```

---

## 6. Checklist vizuálního review

### Terrain
- [ ] Opakování textur — žádné zjevné dlaždice v dlouhém záběru
- [ ] Přirozenost přechodů mezi materiály
- [ ] Čitelnost materiálů (ornice, tráva, štěrk, lesní půda, kámen)
- [ ] Barevná konzistence napříč mapou
- [ ] Přirozenost svahů (slope rock jen kde dává smysl)
- [ ] Kvalita detailu zblízka (`material_closeup`, `meadow_ground_view`)
- [ ] Kvalita dálkového pohledu (`horizon_view`, `field_long_view`)

### Lighting
- [ ] Čitelnost stínů — ne černé díry, ne flat
- [ ] Přepaly — žádné spálené oblohy / highlighty
- [ ] Příliš tmavé plochy pod objekty / ve stínu
- [ ] Přirozenost denního světla (červnové poledne)
- [ ] Vztah terénu a oblohy — harmonický kontrast

### Atmosphere
- [ ] Horizont — měkký, ne ořezaný
- [ ] Fog — podporuje hloubku, ne zakrývá gameplay
- [ ] Hloubka krajiny v dálkovém záběru
- [ ] Barevná teplota — teplé letní světlo, ne studený filtr

### Performance
- [ ] Subjektivní plynulost při benchmark kamerách
- [ ] Shader cost rizika (příliš mnoho texture fetchů zblízka)
- [ ] Počet texture fetchů — sledovat při closeup presetu
- [ ] Škálovatelnost pro větší mapy (8×8 km LOD policy)

### Art Direction
- [ ] Středoevropský charakter krajiny
- [ ] Klidná realistická atmosféra
- [ ] Žádný přehnaný kontrast
- [ ] Žádná přesaturovaná zelená
- [ ] Přirozená čitelnost gameplaye (pole, cesty, farm yard)

---

## 7. Pořizování screenshotů

Vše probíhá **pouze klávesovými zkratkami** — Developer Console není potřeba.

### DEV hotkeys (pouze development build)

| Klávesa | Akce |
|---------|------|
| **F8** | Další benchmark preset |
| **Shift+F8** | Předchozí benchmark preset |
| **F9** | Uloží screenshot aktuální benchmark kamery |
| **Shift+F9** | Automaticky projde všechny presety, pořídí a uloží všechny PNG |

### Automatický export (Shift+F9)

1. Skryje HUD a debug UI.
2. Pro každý preset: přepne kameru → počká na stabilní frame → pořídí PNG přes Babylon `ScreenshotTools`.
3. Uloží soubory do `docs/graphics/visual-benchmarks/screenshots/latest/`.
4. Vytvoří `benchmark-report.txt`.
5. Obnoví původní kameru a UI.
6. Vypíše souhrn do konzole.

### Názvy souborů

```
001_farm_yard_view.png
002_field_long_view.png
003_meadow_ground_view.png
004_dirt_road_view.png
005_forest_edge_view.png
006_horizon_view.png
007_material_closeup.png
benchmark-report.txt
```

Složka `latest/` se při **Shift+F9** před exportem vyčistí a přepíše.

### Jednotlivý screenshot (F9)

Uloží PNG pro aktuálně aktivní preset do `latest/` bez mazání ostatních souborů v této složce.

---

## 8. Screenshot galerie (MS1B Baseline)

> Po prvním **Shift+F9** exportu zkopíruj obsah `latest/` sem nebo do `screenshots/MS1B/` jako archiv baseline.

| Preset | Soubor | MS1B Baseline |
|--------|--------|---------------|
| `farm_yard_view` | `001_farm_yard_view.png` | *(pending)* |
| `field_long_view` | `002_field_long_view.png` | *(pending)* |
| `meadow_ground_view` | `003_meadow_ground_view.png` | *(pending)* |
| `dirt_road_view` | `004_dirt_road_view.png` | *(pending)* |
| `forest_edge_view` | `005_forest_edge_view.png` | *(pending)* |
| `horizon_view` | `006_horizon_view.png` | *(pending)* |
| `material_closeup` | `007_material_closeup.png` | *(pending)* |

Aktivní export: `docs/graphics/visual-benchmarks/screenshots/latest/`  
Archiv baseline: `docs/graphics/visual-benchmarks/screenshots/MS1B/`

---

## 9. Technické poznámky

- Presety jsou **datově řízené** — žádné magic numbers v runtime kódu.
- Pozice kamery se škálují podle aktivní mapy (`resolveVisualBenchmarkPreset`).
- Anchor `farm_hub` = pozice stodoly; `world_center` = střed world bounds.
- Screenshoty pořizuje Babylon `ScreenshotTools` (`CreateScreenshotAsync` / render target fallback).
- Ukládání PNG probíhá přes Vite dev middleware:
  - `GET /__farmos_dev/benchmark-ready`
  - `POST /__farmos_dev/save-benchmark-screenshot`
  - `POST /__farmos_dev/clear-benchmark-folder`
  - `POST /__farmos_dev/save-benchmark-report`
- Middleware: `src/devtools/benchmark-screenshot-middleware.ts`
- Před capture se dočasně skryje HUD (`BenchmarkUiVisibility`).
- Benchmark tooling **nikdy neběží v produkčním buildu** — pouze `import.meta.env.DEV`.
- Nemění gameplay, save, AI, placement ani editor.

---

## 10. Související dokumentace

- [FarmOS Graphics Vision v1](../FarmOS_Graphics_Vision_v1.md)
- [MS01 Terrain Rendering](../milestones/MS01_Terrain_Rendering.md)
- [MS01A5 Renderer Foundation](../milestones/MS01A5_Renderer_Foundation.md)
