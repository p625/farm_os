# Color Script — FarmOS

| | |
|--|--|
| **Verze** | v0.2.0 |
| **Status** | Draft |
| **Tier** | T0 |
| **Preprodukční fáze** | 1 — Creative Direction |
| **Priorita** | **#5 — po Lighting Guide** |
| **Vlastník** | Art Director |
| **Backup** | Lighting Lead |
| **Review** | Kvartálně; sezónní palety additive |
| **Poslední změna** | 2026-07-04 |
| **Blokováno** | [Lighting Guide](../02_Production_Guidelines/Lighting_Guide.md) (schválení) |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.2.0 | 2026-07-04 | — | SoT pravidlo: docs → implementace; prototyp označen jako dočasný |
| v0.1.0 | 2026-07-04 | — | Iniciální kostra + prototypové hodnoty z kódu |

---

## Účel

**Jediný Source of Truth** pro všechny barvy: region, sezóny, UI akcenty, semantické barvy (úroda, varování, stavy polí).

**[RULE]** Žádný jiný dokument nesmí definovat hex/RGB palety — pouze odkazovat sem.

**[RULE]** Color Script je autorita barev. **Implementace se synchronizuje z tohoto dokumentu — ne opačně.** Prototypové hodnoty v kódu jsou dočasné a nemají normativní váhu.

---

## Závislost na Lighting Guide

Finální paleta **musí vycházet ze schváleného** [Lighting Guide](../02_Production_Guidelines/Lighting_Guide.md).

```text
Art Bible → Environment Bible → Lighting Guide → Color Script → implementace
```

Světlo určuje vzhled materiálů. Barvy definované bez světla jsou nevalidní. Dokud není Lighting Guide ve stavu Approved, platí pouze sekce „Prototyp" níže — ne finální paleta.

---

## 1. Prototyp — dočasné hodnoty (NE Source of Truth)

Níže uvedené hodnoty jsou **pouze převzatý prototyp** z rané implementace. Slouží jako reference při psaní Lighting Guide a finální palety. **Po schválení Lighting Guide budou nahrazeny** autoritativní paletou v této sekci.

**Status prototypu:** dočasný · ne Approved · nesynchronizovat jako finální

### Atmosféra (prototyp)

| Prvek | Hex | Poznámka |
|-------|-----|----------|
| Sky horizon | `#B8DBF5` | placeholder |
| Fog | `#9ECCE6` | placeholder |
| Ambient | `#596152` | placeholder |

### Stavy pole (prototyp)

| Stav | Hex | Semantika |
|------|-----|-----------|
| Grass | `#52943D` | Neobdělaná půda |
| Plowed | `#6B4729` | Ornice |
| Seeded | `#75572E` | Zaseto |
| Growing | `#619E38` | Růst |
| Harvestable | `#DBB82E` | Sklizeň ready |
| Harvested | `#7A6638` | Po sklizni |

---

## 2. Finální paleta (TBD — po Lighting Guide)

- [ ] Základní paleta regionu dle [ADR-A01](../01_ART_DECISION_LOG.md#adr-a01--regionální-identita-farmy)
- [ ] Paleta pod schváleným osvětlením (key/fill/ambient)
- [ ] Sezónní varianty → [Seasonal Visual Guide](../01_Domain_Bibles/Seasonal_Visual_Guide.md)
- [ ] UI semantické barvy (success, warning, disabled)
- [ ] Barvy gameplay stavů (vybraný stroj, hover pole)
- [ ] Kontrastní pravidla pro čitelnost z isometric kamery

Po schválení: aktualizovat implementaci z této sekce.

---

## Související dokumenty

- [00_INDEX.md](../00_INDEX.md) — pořadí Fáze 1
- [Art_Bible.md](Art_Bible.md)
- [Lighting_Guide.md](../02_Production_Guidelines/Lighting_Guide.md) — **předchozí krok**
- [Seasonal_Visual_Guide.md](../01_Domain_Bibles/Seasonal_Visual_Guide.md)
- [UI_Style_Guide.md](../02_Production_Guidelines/UI_Style_Guide.md)
