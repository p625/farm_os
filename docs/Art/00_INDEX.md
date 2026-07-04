# FarmOS — Art Documentation Index

| | |
|--|--|
| **Verze** | v0.3.0 |
| **Status** | Draft |
| **Tier** | T0 |
| **Vlastník** | Art Director |
| **Backup** | TBD |
| **Review** | Při každé změně struktury docs |
| **Poslední změna** | 2026-07-04 |
| **Fáze projektu** | **Preprodukce** |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.3.0 | 2026-07-04 | — | Odkaz na ADR-A01 Decision Framework |
| v0.2.0 | 2026-07-04 | — | AAA preprodukční roadmapa |
| v0.1.0 | 2026-07-04 | — | Iniciální struktura art dokumentace |

---

## Účel tohoto dokumentu

Jediné vstupní místo do vizuální dokumentace FarmOS. Definuje **hierarchii autority**, **preprodukční roadmapu**, **tier systém**, **vlastníky** a **mapu vazeb**.

Technická architektura: [`docs/Architecture/`](../Architecture/README.md) (Freeze v1.0 — mimo scope úprav art docs).

---

## Preprodukční roadmapa

FarmOS je ve **preprodukci**. Dokumentace se dokončuje ve čtyřech fázích. **Asset Pipeline a produkční specifikace nejsou prioritou**, dokud není uzamčena Creative Direction.

```text
┌─────────────────────────────────────────────────────────────────┐
│  FÁZE 1 — Creative Direction          ← AKTUÁLNÍ PRIORITA       │
│  Art Bible → ADR-A01 → Environment → Lighting → Color Script    │
├─────────────────────────────────────────────────────────────────┤
│  FÁZE 2 — World Building                                        │
│  Vegetation → Material → Terrain → Sky/Weather → Seasonal       │
├─────────────────────────────────────────────────────────────────┤
│  FÁZE 3 — Architecture                                          │
│  Building Style → Props → Infrastructure → Vehicle → Character  │
├─────────────────────────────────────────────────────────────────┤
│  FÁZE 4 — Production              ← až po uzamčení Fáze 1–3     │
│  Asset Pipeline → Naming → LOD → Outsource → QA → Import        │
└─────────────────────────────────────────────────────────────────┘
```

### Fáze 1 — Creative Direction (nejvyšší priorita)

„Ústava" grafiky FarmOS. Musí být dokončena a schválena jako první.

| Pořadí | Dokument | Stav | Blokuje |
|--------|----------|------|---------|
| 1 | [Art_Bible.md](00_Strategy/Art_Bible.md) | Draft | vše ostatní |
| 2 | [ADR-A01](01_ART_DECISION_LOG.md#adr-a01--regionální-identita-farmy) · [Framework](00_Strategy/ADR-A01_Regional_Identity_Framework.md) | Proposed (framework ready) | Environment, Building, Vegetation, Terrain |
| 3 | [Environment_Bible.md](01_Domain_Bibles/Environment_Bible.md) | Draft | Terrain, Vegetation, Sky/Weather |
| 4 | [Lighting_Guide.md](02_Production_Guidelines/Lighting_Guide.md) | Draft | Color Script, Material, VFX |
| 5 | [Color_Script.md](00_Strategy/Color_Script.md) | Draft | UI, Seasonal, Field stavy |

**Závislost osvětlení a barev:** Lighting Guide musí být schválen **před** finální paletou v Color Script. Světlo určuje vzhled materiálů — barvy z něj vycházejí, ne naopak.

### Fáze 2 — World Building

| Pořadí | Dokument | Poznámka |
|--------|----------|----------|
| 1 | [Vegetation_Guide.md](01_Domain_Bibles/Vegetation_Guide.md) | Kultury, louky, lesní okraj |
| 2 | [Material_Guide.md](02_Production_Guidelines/Material_Guide.md) | PBR po schváleném světle |
| 3 | [Terrain_Landscape_Guide.md](01_Domain_Bibles/Terrain_Landscape_Guide.md) | Pole, erosion, cesty |
| 4 | [Sky_Weather_Guide.md](01_Domain_Bibles/Sky_Weather_Guide.md) | Počasí jako vizuální obsah |
| 5 | [Seasonal_Visual_Guide.md](01_Domain_Bibles/Seasonal_Visual_Guide.md) | Roční období napříč světem |

**Blokováno:** dokončením Fáze 1 (zejména ADR-A01 + Environment + Color Script).

### Fáze 3 — Architecture

| Pořadí | Dokument | Poznámka |
|--------|----------|----------|
| 1 | [Building_Style_Guide.md](01_Domain_Bibles/Building_Style_Guide.md) | Farmy, sila, stodoly |
| 2 | [Props_Guide.md](01_Domain_Bibles/Props_Guide.md) | Drobné farmářské objekty |
| 3 | [Infrastructure_Guide.md](01_Domain_Bibles/Infrastructure_Guide.md) | Cesty, ploty, vedení |
| 4 | [Vehicle_Machine_Guide.md](01_Domain_Bibles/Vehicle_Machine_Guide.md) | Stroje |
| 5 | [Character_Crowd_Guide.md](01_Domain_Bibles/Character_Crowd_Guide.md) | Workers — lightweight |

**Blokováno:** dokončením Fáze 2.

### Fáze 4 — Production

Teprve po uzamčení Art Direction (Fáze 1–3).

| Dokument | Obsah |
|----------|-------|
| [Asset_Pipeline_Spec.md](02_Production_Guidelines/Asset_Pipeline_Spec.md) | Naming, export, texel density, LOD, složky |
| [Outsource_Package_Spec.md](03_Templates/Outsource_Package_Spec.md) | Outsourcing guide |
| [Art_QA_Checklist.md](03_Templates/Art_QA_Checklist.md) | Asset QA |
| [Asset_Brief_Template.md](03_Templates/Asset_Brief_Template.md) | Import workflow per asset |

**[RULE]** Produční dokumenty v preprodukci **neřešíme**. Jejich předčasné dokončení vytváří falešnou jistotu bez uzamčeného vizuálního směru.

### Podpůrné dokumenty (průběžně, neblokující)

| Dokument | Fáze použití |
|----------|--------------|
| [Mood_Reference_Library.md](00_Strategy/Mood_Reference_Library.md) | Fáze 1 — kurátorství referencí |
| [Visual_Identity.md](00_Strategy/Visual_Identity.md) | Fáze 1–3 — brand |
| [Camera_Composition_Guide.md](02_Production_Guidelines/Camera_Composition_Guide.md) | Fáze 1 — isometric identita |
| [UI_Style_Guide.md](02_Production_Guidelines/UI_Style_Guide.md) | Po Color Script |
| [VFX_Guide.md](02_Production_Guidelines/VFX_Guide.md) | Fáze 2 |
| [Decal_Ground_Detail_Guide.md](02_Production_Guidelines/Decal_Ground_Detail_Guide.md) | Fáze 2–3 |
| [Cinematic_Marketing_Guide.md](02_Production_Guidelines/Cinematic_Marketing_Guide.md) | Před release |

---

## Pyramida autority

```text
                    ┌─────────────────────┐
                    │   Game Bible (99)   │  ← kreativní autorita (proč hra existuje)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │     Art Bible         │  ← vizuální autorita (Fáze 1)
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ADR-A01            Environment       Lighting Guide
     (region)              Bible            (před barvami)
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │    Color Script       │  ← SoT barev (po Lighting)
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        World Building    Architecture      Production
        (Fáze 2)          (Fáze 3)          (Fáze 4)
```

**Při konfliktu platí vyšší vrstva.** Změna směru → [Art Decision Log](01_ART_DECISION_LOG.md), ne tichá úprava nižšího dokumentu.

---

## Source of Truth (SoT)

| Otázka | Jediný zdroj pravdy |
|--------|---------------------|
| Technická architektura hry | `docs/Architecture/` (Freeze v1.0) |
| Proč má svět vypadat takto? | Game Bible → [Art Bible](00_Strategy/Art_Bible.md) |
| Jaká je celková nálada a vizuální filozofie? | [Art Bible](00_Strategy/Art_Bible.md) |
| Region, krajina, biomy, horizont? | [ADR-A01](01_ART_DECISION_LOG.md) + [Framework](00_Strategy/ADR-A01_Regional_Identity_Framework.md) + [Environment Bible](01_Domain_Bibles/Environment_Bible.md) |
| Jak svítí scéna? | [Lighting Guide](02_Production_Guidelines/Lighting_Guide.md) |
| Jaké barvy a jejich význam? | [Color Script](00_Strategy/Color_Script.md) |
| Jak vypadá architektura? | [Building Style Guide](01_Domain_Bibles/Building_Style_Guide.md) |
| Jak vypadá infrastruktura? | [Infrastructure Guide](01_Domain_Bibles/Infrastructure_Guide.md) |
| Jaké jsou PBR hodnoty, wear? | [Material Guide](02_Production_Guidelines/Material_Guide.md) |
| Jak vypadá obloha, mlha, déšť? | [Sky & Weather Guide](01_Domain_Bibles/Sky_Weather_Guide.md) |
| Poly count, UV, naming? | [Asset Pipeline Spec](02_Production_Guidelines/Asset_Pipeline_Spec.md) — **Fáze 4** |
| Inspirace a reference? | [Mood Reference Library](00_Strategy/Mood_Reference_Library.md) |

**[RULE]** Žádná implementace (kód, prototyp, placeholder asset) není Source of Truth. Dokumenty schvaluje Art Director; implementace se synchronizuje z docs.

---

## Pravidlo jednoho faktu

| Zakázáno duplikovat | Kde to patří jedině |
|---------------------|---------------------|
| Hex kódy, palety sezón | Color Script (+ Seasonal odkazuje) |
| Osvětlení, exponometrie, TOD | Lighting Guide |
| Makro krajina, biomy | Environment Bible |
| PBR parametry, wear levels | Material Guide |
| Poly/TEX budgets, LOD | Asset Pipeline Spec (Fáze 4) |
| Inspirace, reference boardy | Mood Reference Library |
| Regionální identita | ADR-A01 |

---

## Tier systém (organizace souborů)

Tier popisuje **kde soubor leží**, ne **kdy ho dokončit**. Pořadí dokončení určuje preprodukční roadmapa výše.

| Tier | Složka | Schvaluje |
|------|--------|-----------|
| **T0** | `00_Strategy/` | Art Director |
| **T1** | `01_Domain_Bibles/` | Lead dané disciplíny |
| **T2** | `02_Production_Guidelines/` | příslušný Lead |
| **T3** | `03_Templates/` | Art Producer |

**Status dokumentu:** `Draft` → `Approved` → `Frozen` (pouze additive změny).

---

## Katalog dokumentů (podle fáze)

### Kořen

| Dokument | Fáze | Vlastník |
|----------|------|----------|
| [00_INDEX.md](00_INDEX.md) | — | Art Director |
| [01_ART_DECISION_LOG.md](01_ART_DECISION_LOG.md) | 1 | Art Director |

### Fáze 1 — Creative Direction

| Dokument | Vlastník |
|----------|----------|
| [Art_Bible.md](00_Strategy/Art_Bible.md) | Art Director |
| [ADR-A01 Regionální identita](01_ART_DECISION_LOG.md#adr-a01--regionální-identita-farmy) | Art Director |
| [ADR-A01 Decision Framework](00_Strategy/ADR-A01_Regional_Identity_Framework.md) | Art Director |
| [Environment_Bible.md](01_Domain_Bibles/Environment_Bible.md) | Environment Lead |
| [Lighting_Guide.md](02_Production_Guidelines/Lighting_Guide.md) | Lighting Lead |
| [Color_Script.md](00_Strategy/Color_Script.md) | Art Director + Lighting Lead |

### Fáze 2 — World Building

| Dokument | Vlastník |
|----------|----------|
| [Vegetation_Guide.md](01_Domain_Bibles/Vegetation_Guide.md) | Vegetation Lead |
| [Material_Guide.md](02_Production_Guidelines/Material_Guide.md) | Tech Art Lead |
| [Terrain_Landscape_Guide.md](01_Domain_Bibles/Terrain_Landscape_Guide.md) | Environment Lead |
| [Sky_Weather_Guide.md](01_Domain_Bibles/Sky_Weather_Guide.md) | Lighting + Environment Lead |
| [Seasonal_Visual_Guide.md](01_Domain_Bibles/Seasonal_Visual_Guide.md) | Art Director |

### Fáze 3 — Architecture

| Dokument | Vlastník |
|----------|----------|
| [Building_Style_Guide.md](01_Domain_Bibles/Building_Style_Guide.md) | Hard Surface Lead |
| [Props_Guide.md](01_Domain_Bibles/Props_Guide.md) | Environment / Props Lead |
| [Infrastructure_Guide.md](01_Domain_Bibles/Infrastructure_Guide.md) | Hard Surface Lead |
| [Vehicle_Machine_Guide.md](01_Domain_Bibles/Vehicle_Machine_Guide.md) | Hard Surface Lead |
| [Character_Crowd_Guide.md](01_Domain_Bibles/Character_Crowd_Guide.md) | Art Director |

### Fáze 4 — Production

| Dokument | Vlastník |
|----------|----------|
| [Asset_Pipeline_Spec.md](02_Production_Guidelines/Asset_Pipeline_Spec.md) | Tech Art Lead |
| [Art_QA_Checklist.md](03_Templates/Art_QA_Checklist.md) | Tech Art Lead |
| [Outsource_Package_Spec.md](03_Templates/Outsource_Package_Spec.md) | Art Producer |
| [Asset_Brief_Template.md](03_Templates/Asset_Brief_Template.md) | Art Producer |
| [Environment_Blockout_Brief.md](03_Templates/Environment_Blockout_Brief.md) | Environment Lead |

### Podpůrné (T0/T2)

| Dokument | Vlastník |
|----------|----------|
| [Visual_Identity.md](00_Strategy/Visual_Identity.md) | Art Director + UI Lead |
| [Mood_Reference_Library.md](00_Strategy/Mood_Reference_Library.md) | Art Director |
| [Camera_Composition_Guide.md](02_Production_Guidelines/Camera_Composition_Guide.md) | Art Director |
| [UI_Style_Guide.md](02_Production_Guidelines/UI_Style_Guide.md) | UI Lead |
| [VFX_Guide.md](02_Production_Guidelines/VFX_Guide.md) | VFX Lead |
| [Decal_Ground_Detail_Guide.md](02_Production_Guidelines/Decal_Ground_Detail_Guide.md) | Tech Art Lead |
| [Cinematic_Marketing_Guide.md](02_Production_Guidelines/Cinematic_Marketing_Guide.md) | Art Director |

---

## Blokující dokumenty (aktuálně)

Grafický vývoj **nesmí pokračovat do produkce assetů**, dokud nejsou schváleny:

| Dokument | Proč blokuje |
|----------|--------------|
| **Art Bible** | Bez ústavy chybí rozhodovací kritéria pro vše |
| **ADR-A01** | [Framework](00_Strategy/ADR-A01_Regional_Identity_Framework.md) připraven; čeká se na workshop a **Accepted** v Decision Log |
| **Environment Bible** | Největší vizuální plocha hry — krajina musí být definována dříve než assety |
| **Lighting Guide** | Barvy a materiály bez světla jsou nevalidní |
| **Color Script** | Finální paleta až po Lighting; do té doby jen prototyp |

---

## Governance — role a vlastnictví

| Role | Fáze 1 dokumenty |
|------|------------------|
| **Art Director** | Art Bible, INDEX, ADR-A01, Seasonal (schvalovatel) |
| **Environment Lead** | Environment Bible |
| **Lighting Lead** | Lighting Guide, Color Script (spoluautor) |
| **Tech Art Lead** | Fáze 4 — Pipeline, QA |
| **Art Producer** | Fáze 4 — Templates, Outsource |

---

## Workflow nového assetu (Fáze 4+)

```text
1. Ověřit: Fáze 1–3 Approved / Frozen
2. Asset Brief (šablona)
   └─ odkazy na: Domain Bible + Material + Pipeline + Seasonal
3. Produkcí (outsource / internal)
4. Review proti Art QA Checklist
5. Konflikt → Art Decision Log
```

---

## Vazby na ostatní dokumentaci

| Externí dokument | Vztah k Art docs |
|------------------|------------------|
| [`docs/Architecture/`](../Architecture/README.md) | Technická autorita — art docs ji nemění |
| [`001_VisionAndRoadmap.md`](../Architecture/001_VisionAndRoadmap.md) | Produktový scope (stroje, budovy) |
| Game Bible (TBD) | Kreativní autorita nad Art Bible |
| World Rules (TBD) | Simulace sezón → Seasonal + Sky vlastní vizuál |

---

## Rychlý start (preprodukce)

1. Přečti [Art Bible](00_Strategy/Art_Bible.md) — ústava grafiky.
2. Projdi [ADR-A01 Framework](00_Strategy/ADR-A01_Regional_Identity_Framework.md) — rozhodovací workshop před výběrem regionu.
3. Po ADR-A01: [Environment Bible](01_Domain_Bibles/Environment_Bible.md).
4. Po Environment: [Lighting Guide](02_Production_Guidelines/Lighting_Guide.md) → pak [Color Script](00_Strategy/Color_Script.md).
5. **Nepřeskakuj na** [Asset Pipeline Spec](02_Production_Guidelines/Asset_Pipeline_Spec.md) — to je Fáze 4.
6. Inspirace: [Mood Reference Library](00_Strategy/Mood_Reference_Library.md) — ne jako pravidla.

---

## Deprecated dokumenty

Zastaralé verze patří do [`archive/`](archive/).
