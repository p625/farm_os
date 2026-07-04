# FarmOS — Art Documentation Index

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Tier** | T0 |
| **Vlastník** | Art Director |
| **Backup** | TBD |
| **Review** | Při každé změně struktury docs |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální struktura art dokumentace |

---

## Účel tohoto dokumentu

Jediné vstupní místo do vizuální dokumentace FarmOS. Definuje **hierarchii autority**, **tier systém**, **vlastníky** a **mapu vazeb** mezi dokumenty.

Pro technickou architekturu hry viz [`docs/Architecture/`](../Architecture/README.md).

---

## Pyramida autority

```text
                    ┌─────────────────────┐
                    │   Game Bible (99)   │  ← kreativní autorita (proč hra existuje)
                    └──────────┬──────────┘
                               │ informuje tón, emoce, pilíře
                    ┌──────────▼──────────┐
                    │     Art Bible         │  ← vizuální strategie (jak svět vypadá)
                    └──────────┬──────────┘
                               │ rozpadá se na domény
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
   Domain Bibles          Color Script          Visual Identity
   (Terrain, Building…)   (paleta)              (logo, typografie světa)
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                    Production Guidelines
                    (Material, Lighting, Asset Pipeline…)
                               │
                               ▼
                    Templates & Briefs
                    (per-asset, per-milestone)
```

**Při konfliktu platí vyšší vrstva.** Změna směru → [Art Decision Log](01_ART_DECISION_LOG.md), ne tichá úprava nižšího dokumentu.

---

## Source of Truth (SoT)

| Otázka | Jediný zdroj pravdy |
|--------|---------------------|
| Proč má svět vypadat takto? | Game Bible → [Art Bible](00_Strategy/Art_Bible.md) |
| Jaká je celková nálada a vizuální filozofie? | [Art Bible](00_Strategy/Art_Bible.md) |
| Jaké barvy a jejich význam? | [Color Script](00_Strategy/Color_Script.md) |
| Jak vypadá konkrétní doména? | příslušná Domain Bible |
| Jaké jsou PBR hodnoty, wear? | [Material Guide](02_Production_Guidelines/Material_Guide.md) |
| Jak svítí scéna technicky? | [Lighting Guide](02_Production_Guidelines/Lighting_Guide.md) |
| Jak vypadá obloha, mlha, déšť? | [Sky & Weather Guide](01_Domain_Bibles/Sky_Weather_Guide.md) |
| Jak vypadá UI? | [UI Style Guide](02_Production_Guidelines/UI_Style_Guide.md) |
| Poly count, UV, naming? | [Asset Pipeline Spec](02_Production_Guidelines/Asset_Pipeline_Spec.md) |
| Je asset hotový? | [Art QA Checklist](03_Templates/Art_QA_Checklist.md) |
| Kamera, zoom, framing? | [Camera & Composition Guide](02_Production_Guidelines/Camera_Composition_Guide.md) |
| Inspirace a reference? | [Mood Reference Library](00_Strategy/Mood_Reference_Library.md) |

---

## Pravidlo jednoho faktu

| Zakázáno duplikovat | Kde to patří jedině |
|---------------------|---------------------|
| Hex kódy, palety sezón | Color Script (+ Seasonal odkazuje) |
| PBR parametry, wear levels | Material Guide |
| Poly/TEX budgets, LOD | Asset Pipeline Spec |
| Inspirace, reference boardy | Mood Reference Library |
| Pravidla kamer, FOV, clipping | Camera & Composition Guide |
| Počasí jako gameplay vizuál | Sky & Weather Guide |
| „Jak má vypadat stodola“ | Building Style Guide |

Ostatní dokumenty **odkazují**, nekopírují.

---

## Tier systém

| Tier | Složka | Změnovost | Schvaluje |
|------|--------|-----------|-----------|
| **T0** | `00_Strategy/` | Ročně / milestone | Art Director |
| **T1** | `01_Domain_Bibles/` | Kvartálně | Lead dané disciplíny |
| **T2** | `02_Production_Guidelines/` | Měsíčně | příslušný Lead |
| **T3** | `03_Templates/` | Průběžně | Art Producer |
| **T4** | Mood Library (v T0) | Průběžně | Art Director (kurátor) |

**Status dokumentu:** `Draft` → `Approved` → `Frozen` (pouze additive změny).

---

## Katalog dokumentů

### Kořen

| Dokument | Tier | Vlastník | Účel |
|----------|------|----------|------|
| [00_INDEX.md](00_INDEX.md) | T0 | Art Director | Tento index |
| [01_ART_DECISION_LOG.md](01_ART_DECISION_LOG.md) | T0 | Art Director | Historie vizuálních rozhodnutí (WHY) |

### T0 — Strategie (`00_Strategy/`)

| Dokument | Vlastník | Účel |
|----------|----------|------|
| [Art_Bible.md](00_Strategy/Art_Bible.md) | Art Director | Vizuální pilíře, realism level, anti-patterns |
| [Visual_Identity.md](00_Strategy/Visual_Identity.md) | Art Director + UI Lead | Brand světa, logo, ikonografie |
| [Mood_Reference_Library.md](00_Strategy/Mood_Reference_Library.md) | Art Director | Index referencí `[INSPIRATION]` |
| [Color_Script.md](00_Strategy/Color_Script.md) | Art Director + Lighting Lead | SoT pro všechny barvy |

### T1 — Doménové bible (`01_Domain_Bibles/`)

| Dokument | Vlastník | Účel |
|----------|----------|------|
| [Environment_Bible.md](01_Domain_Bibles/Environment_Bible.md) | Environment Lead | Makro: krajina, region, čitelnost mapy |
| [Terrain_Landscape_Guide.md](01_Domain_Bibles/Terrain_Landscape_Guide.md) | Environment Lead | Mikro: pole, erosion, cesty, drainage |
| [Building_Style_Guide.md](01_Domain_Bibles/Building_Style_Guide.md) | Hard Surface Lead | Architektura farmy, stodoly, sila |
| [Vegetation_Guide.md](01_Domain_Bibles/Vegetation_Guide.md) | Vegetation Lead | Kultury, louky, lesní okraj |
| [Props_Guide.md](01_Domain_Bibles/Props_Guide.md) | Environment / Props Lead | Drobné farmářské objekty |
| [Vehicle_Machine_Guide.md](01_Domain_Bibles/Vehicle_Machine_Guide.md) | Hard Surface Lead | Traktory, kombajny, návěsy |
| [Character_Crowd_Guide.md](01_Domain_Bibles/Character_Crowd_Guide.md) | Art Director | Workers — lightweight, „dost dobří z 50 m“ |
| [Sky_Weather_Guide.md](01_Domain_Bibles/Sky_Weather_Guide.md) | Lighting + Environment Lead | Obloha, mraky, mlha, déšť |
| [Seasonal_Visual_Guide.md](01_Domain_Bibles/Seasonal_Visual_Guide.md) | Art Director | Jaro/léto/podzim/zima napříč vším |

### T2 — Produkční guidelines (`02_Production_Guidelines/`)

| Dokument | Vlastník | Účel |
|----------|----------|------|
| [Material_Guide.md](02_Production_Guidelines/Material_Guide.md) | Tech Art Lead | PBR rozsahy, wear, rust |
| [Lighting_Guide.md](02_Production_Guidelines/Lighting_Guide.md) | Lighting Lead | Exponometrie, TOD, performance |
| [VFX_Guide.md](02_Production_Guidelines/VFX_Guide.md) | VFX Lead | Prach, déšť, harvest particles |
| [Decal_Ground_Detail_Guide.md](02_Production_Guidelines/Decal_Ground_Detail_Guide.md) | Tech Art Lead | Tire tracks, mokré stopy, stubble |
| [UI_Style_Guide.md](02_Production_Guidelines/UI_Style_Guide.md) | UI Lead | HUD, panely, ikony |
| [Camera_Composition_Guide.md](02_Production_Guidelines/Camera_Composition_Guide.md) | Art Director | Isometric framing, zoom levels |
| [Asset_Pipeline_Spec.md](02_Production_Guidelines/Asset_Pipeline_Spec.md) | Tech Art Lead | Naming, LOD, export, složky |
| [Cinematic_Marketing_Guide.md](02_Production_Guidelines/Cinematic_Marketing_Guide.md) | Art Director | Trailery, key art (volitelné do v1.0) |

### T3 — Šablony (`03_Templates/`)

| Dokument | Vlastník | Účel |
|----------|----------|------|
| [Asset_Brief_Template.md](03_Templates/Asset_Brief_Template.md) | Art Producer | Brief per asset |
| [Environment_Blockout_Brief.md](03_Templates/Environment_Blockout_Brief.md) | Environment Lead | Blockout před produkcí |
| [Outsource_Package_Spec.md](03_Templates/Outsource_Package_Spec.md) | Art Producer | Balíček pro externí studia |
| [Art_QA_Checklist.md](03_Templates/Art_QA_Checklist.md) | Tech Art Lead | Objektivní „done“ |

---

## Vazby na ostatní dokumentaci

| Externí dokument | Vztah k Art docs |
|------------------|------------------|
| [`docs/Architecture/001_VisionAndRoadmap.md`](../Architecture/001_VisionAndRoadmap.md) | Produktový směr — stroje, budovy, gameplay scope |
| [`docs/Architecture/004_RenderingArchitecture.md`](../Architecture/004_RenderingArchitecture.md) | Technická vrstva: Babylon.js, Presentation read-only |
| Game Bible (TBD) | Kreativní autorita nad Art Bible |
| World Rules (TBD) | Simulace sezón/počasí → Seasonal + Sky vlastní vizuál |
| Game Design docs (TBD) | Gameplay funkce budov → Building Style vlastní vzhled |

---

## Workflow nového assetu

```text
1. Asset Brief (šablona)
   └─ odkazy na: Domain Bible + Material + Pipeline + Seasonal

2. Produkcí (outsource / internal)

3. Review proti Art QA Checklist

4. Konflikt → Art Decision Log (ne tichá změna v Material Guide)
```

---

## Governance — role a vlastnictví

| Role | Dokumenty |
|------|-----------|
| **Art Director** | Art Bible, INDEX, Decision Log, Camera, Seasonal (schvalovatel) |
| **Environment Lead** | Environment, Terrain, Props |
| **Hard Surface Lead** | Building, Vehicle/Machine |
| **Vegetation Lead** | Vegetation |
| **Lighting Lead** | Lighting, Sky/Weather (spoluautor) |
| **Tech Art Lead** | Asset Pipeline, Material, Decal, Art QA |
| **VFX Lead** | VFX |
| **UI Lead** | UI Style, Visual Identity (spoluautor) |
| **Art Producer** | Templates, Outsource packages |

---

## Aktuální stav implementace (kód)

Prototyp v `src/rendering/` již obsahuje základ vizuálního směru — art docs ho postupně formalizují:

| Modul | Co řeší dnes | Cílový art doc |
|-------|--------------|----------------|
| `CameraController.ts` | Isometric ArcRotate, radius 25–70 | Camera & Composition Guide |
| `FarmEnvironment.ts` | Sky horizon, exp fog | Sky/Weather + Lighting |
| `FieldAppearance.ts` | Barvy stavů pole (prototyp) | Color Script + Seasonal Visual |
| `FarmSceneBuilder.ts` | Blockout scény | Environment + Terrain |

**[RULE]** Prototypové hodnoty v kódu nejsou autorita — po schválení docs se synchronizují z Color Script / guides do kódu.

---

## Deprecated dokumenty

Zastaralé verze patří do [`archive/`](archive/). Původní soubor zůstane s redirectem na nástupce.

---

## Rychlý start pro nové členy týmu

1. Přečti [Art Bible](00_Strategy/Art_Bible.md) — vizuální slib hráči.
2. Projdi [Color Script](00_Strategy/Color_Script.md) a [Camera Guide](02_Production_Guidelines/Camera_Composition_Guide.md).
3. Najdi svou doménu v `01_Domain_Bibles/`.
4. Před prvním assetem: [Asset Pipeline Spec](02_Production_Guidelines/Asset_Pipeline_Spec.md) + [Art QA Checklist](03_Templates/Art_QA_Checklist.md).
5. Inspirace pouze přes [Mood Reference Library](00_Strategy/Mood_Reference_Library.md) — ne jako pravidla.
