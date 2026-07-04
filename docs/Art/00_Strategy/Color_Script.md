# Color Script — FarmOS

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Tier** | T0 |
| **Vlastník** | Art Director |
| **Backup** | Lighting Lead |
| **Review** | Kvartálně; sezónní palety additive |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální kostra + prototypové hodnoty z kódu |

---

## Účel

**Jediný zdroj pravdy** pro všechny barvy: region, sezóny, UI akcenty, semantické barvy (úroda, varování, stavy polí).

**[RULE]** Žádný jiný dokument nesmí definovat hex/RGB palety — pouze odkazovat sem.

---

## 1. Prototypové hodnoty (synchronizovat po schválení)

Aktuální implementace v kódu — **Draft**, ne Approved:

### Atmosféra (`FarmEnvironment.ts`)

| Prvek | RGB (0–1) | Hex | Poznámka |
|-------|-----------|-----|----------|
| Sky horizon | 0.72, 0.86, 0.96 | `#B8DBF5` | clearColor |
| Fog | 0.62, 0.80, 0.90 | `#9ECCE6` | exp2 fog |
| Ambient | 0.35, 0.38, 0.32 | `#596152` | scene ambient |

### Stavy pole (`FieldAppearance.ts`)

| Stav | RGB diffuse | Hex | Semantika |
|------|-------------|-----|-----------|
| Grass | 0.32, 0.58, 0.24 | `#52943D` | Neobdělaná půda |
| Plowed | 0.42, 0.28, 0.16 | `#6B4729` | Ornice |
| Seeded | 0.46, 0.34, 0.18 | `#75572E` | Zaseto |
| Growing | 0.38, 0.62, 0.22 | `#619E38` | Růst |
| Harvestable | 0.86, 0.72, 0.18 | `#DBB82E` | Sklizeň ready |
| Harvested | 0.48, 0.40, 0.22 | `#7A6638` | Po sklizni |

**[RULE]** Po schválení této tabulky aktualizovat `src/rendering/appearance/FieldAppearance.ts` a `FarmEnvironment.ts`.

---

## 2. Obsahová osnova (TBD)

- [ ] Základní paleta regionu (země, vegetace, obloha)
- [ ] Sezónní varianty → odkaz [Seasonal Visual Guide](../01_Domain_Bibles/Seasonal_Visual_Guide.md)
- [ ] UI semantické barvy (success, warning, disabled)
- [ ] Barvy gameplay stavů (vybraný stroj, hover pole)
- [ ] Kontrastní pravidla pro čitelnost z isometric kamery
- [ ] Export swatches (ASE / JSON pro engine)

---

## Související dokumenty

- [Art_Bible.md](Art_Bible.md)
- [Seasonal_Visual_Guide.md](../01_Domain_Bibles/Seasonal_Visual_Guide.md)
- [UI_Style_Guide.md](../02_Production_Guidelines/UI_Style_Guide.md)
- [Lighting_Guide.md](../02_Production_Guidelines/Lighting_Guide.md)
