# FarmOS — Art Documentation

Vizuální dokumentace projektu FarmOS. Projekt je ve fázi **preprodukce**.

Technická architektura je uzamčena v [`docs/Architecture/`](../Architecture/README.md) (Architecture Freeze v1.0). Tato složka definuje **výhradně vizuální směr a produkční pravidla grafiky**.

---

## Vstupní bod

Začni zde: **[00_INDEX.md](00_INDEX.md)**

---

## Preprodukční roadmapa

Dokumentace se dokončuje v tomto pořadí. **Nepřeskakovat fáze.**

```text
Fáze 1 — Creative Direction     ← AKTUÁLNĚ ZDE
Fáze 2 — World Building
Fáze 3 — Architecture
Fáze 4 — Production             ← až po uzamčení Art Direction
```

| Fáze | Dokumenty | Stav |
|------|-----------|------|
| **1 — Creative Direction** | Art Bible, World Identity Statement, ADR-A01, Environment Bible, Lighting Guide, Color Script | Rozpracovává se |
| **2 — World Building** | Vegetation, Material, Terrain, Sky/Weather, Seasonal Visual | Blokováno Fází 1 |
| **3 — Architecture** | Building Style, Props, Infrastructure, Vehicle/Machine, Character | Blokováno Fází 2 |
| **4 — Production** | Asset Pipeline, Templates, QA, Outsource | Blokováno Fází 3 |

---

## Source of Truth

| Oblast | Autorita |
|--------|----------|
| Technická architektura hry | `docs/Architecture/` (Freeze v1.0) |
| Vizuální směr | [Art Bible](00_Strategy/Art_Bible.md) |
| Filozofie světa, realismus, idealizace | [World Identity Statement](00_Strategy/World_Identity_Statement.md) |
| Krajina (makro) | [Environment Bible](01_Domain_Bibles/Environment_Bible.md) |
| Osvětlení | [Lighting Guide](02_Production_Guidelines/Lighting_Guide.md) |
| Barvy | [Color Script](00_Strategy/Color_Script.md) |
| Architektura budov | [Building Style Guide](01_Domain_Bibles/Building_Style_Guide.md) |

| Návrh Map 01 (Vertical Slice) | [Map_01_Design_Bible](Maps/Map_01_Design_Bible.md) |

---

## Vertical Slice

První hratelná mapa: **[Maps/Map_01_Design_Bible.md](Maps/Map_01_Design_Bible.md)**

---

## Struktura složek

```text
docs/Art/
├── 00_INDEX.md                 # Autorita, roadmapa, SoT
├── 01_ART_DECISION_LOG.md      # ADR záznamy (ADR-A01 zápis po workshopu)
├── 00_Strategy/
│     ├── Art_Bible.md
│     ├── World_Identity_Statement.md   # Vision Lock (Fáze 1 #1b)
│     └── ADR-A01_Regional_Identity_Framework.md
├── 01_Domain_Bibles/           # T1 — doménové bible
├── 02_Production_Guidelines/   # T2 — produkční pravidla (většina až Fáze 4)
├── 03_Templates/               # T3 — šablony (Fáze 4)
├── Maps/                       # Design Bible per mapa (Vertical Slice+)
│     └── Map_01_Design_Bible.md
└── archive/
```
