# FarmOS Visual Benchmark 2026

Referenční dokument pro vizuální validaci rendereru po grafických milnících.

**Verze:** 2026-MS1C  
**Baseline:** MS1B — Terrain Visual Upgrade  
**Konfigurace:** `src/config/rendering/visual-benchmark-config.ts`  
**Runtime tooling (DEV):** `src/rendering/debug/VisualBenchmarkRunner.ts`

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
2. Přepínej presety klávesami **F8** (další) / **Shift+F8** (předchozí).
3. Ověř v konzoli aktivní preset (`[FarmOS Visual Benchmark]` log).
4. Pořiď screenshot (OS nebo viz níže).
5. Pojmenuj soubor: `{milestone}_{preset_id}_{datum}.png`  
   Příklad: `MS1B_farm_yard_view_2026-07-04.png`
6. Ulož do `docs/graphics/visual-benchmarks/screenshots/{milestone}/`.
7. Porovnej side-by-side s předchozí baseline — stejný preset, stejné podmínky.

**Neporovnávej** screenshoty z různých FOV, jiné denní doby nebo jiného render quality presetu.

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

### DEV hotkeys (pouze development build)

| Klávesa | Akce |
|---------|------|
| **F8** | Další benchmark preset |
| **Shift+F8** | Předchozí benchmark preset |

Po přepnutí se do konzole vypíše aktivní preset včetně pozice kamery a validation focus.

### Konzole (DEV)

```javascript
// Aktivní runner po startu hry
farmosVisualBenchmark.next()
farmosVisualBenchmark.previous()
farmosVisualBenchmark.applyPresetById('horizon_view')
farmosVisualBenchmark.logActivePreset()

// Volitelný export PNG (canvas.toDataURL)
const dataUrl = await farmosVisualBenchmark.captureCurrentBenchmarkFrame()
// Vlož do prohlížeče nebo stáhni ručně
```

### Ruční screenshot

1. Přepni na požadovaný preset (F8).
2. Počkej na stabilní frame.
3. Použij OS screenshot nebo `captureCurrentBenchmarkFrame()` v konzoli.

---

## 8. Screenshot galerie (MS1B Baseline)

> **TODO:** Po prvním review vlož sem referenční screenshoty MS1B.

| Preset | MS1B Baseline | Poznámka |
|--------|---------------|----------|
| `farm_yard_view` | *(pending)* | |
| `field_long_view` | *(pending)* | |
| `meadow_ground_view` | *(pending)* | |
| `dirt_road_view` | *(pending)* | |
| `forest_edge_view` | *(pending)* | |
| `horizon_view` | *(pending)* | |
| `material_closeup` | *(pending)* | |

Doporučená cesta assetů:  
`docs/graphics/visual-benchmarks/screenshots/MS1B/`

---

## 9. Technické poznámky

- Presety jsou **datově řízené** — žádné magic numbers v runtime kódu.
- Pozice kamery se škálují podle aktivní mapy (`resolveVisualBenchmarkPreset`).
- Anchor `farm_hub` = pozice stodoly; `world_center` = střed world bounds.
- Benchmark tooling **nikdy neběží v produkčním buildu** — pouze `import.meta.env.DEV`.
- Nemění gameplay, save, AI, placement ani editor.

---

## 10. Související dokumentace

- [FarmOS Graphics Vision v1](../FarmOS_Graphics_Vision_v1.md)
- [MS01 Terrain Rendering](../milestones/MS01_Terrain_Rendering.md)
- [MS01A5 Renderer Foundation](../milestones/MS01A5_Renderer_Foundation.md)
