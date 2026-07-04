# Asset Pipeline Spec — FarmOS

| | |
|--|--|
| **Verze** | v0.2.0 |
| **Status** | Draft |
| **Tier** | T2 |
| **Preprodukční fáze** | **4 — Production** |
| **Priorita** | **Nízká v preprodukci** — až po uzamčení Fáze 1–3 |
| **Vlastník** | Tech Art Lead |
| **Backup** | Art Director |
| **Review** | Měsíčně (po vstupu do produkce assetů) |
| **Poslední změna** | 2026-07-04 |
| **Blokováno** | Schválení Art Bible, ADR-A01, Environment, Lighting, Color Script + Fáze 2–3 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.2.0 | 2026-07-04 | — | Označeno jako Fáze 4; není preprodukční priorita |
| v0.1.0 | 2026-07-04 | — | Iniciální kostra |

---

## Účel

Technická SoT pro produkci assetů: naming, LOD, texel density, pivot points, export formáty, struktura složek.

**[RULE]** Pipeline **implementuje** vizuální záměr z bible — nesmí měnit art direction, jen enforce konzistenci.

**[RULE]** Tento dokument **není prioritou preprodukce**. Dokončit až po uzamčení Creative Direction a World Building. Předčasná specifikace pipeline bez vizuálního směru vede k reworkům.

---

## Scope (Fáze 4)

- Naming convention
- Texel density
- LOD rules
- Export formáty a import workflow
- Struktura složek v repozitáři
- Pivot a scale pravidla

Viz [00_INDEX.md](../00_INDEX.md) — preprodukční roadmapa.

---

## Obsahová osnova (TBD — po Fázi 3)

- [ ] Naming convention
- [ ] Export formáty
- [ ] Jednotky a scale (1 unit = 1 m)
- [ ] Pivot a origin pravidla per kategorie
- [ ] LOD levels a přechodové vzdálenosti
- [ ] Texel density (tex/m) per kategorie
- [ ] UV a padding pravidla
- [ ] Budget tabulky per kategorie assetu

---

## Související dokumenty

- [00_INDEX.md](../00_INDEX.md) — Fáze 4
- [Material_Guide.md](Material_Guide.md)
- [Art_QA_Checklist.md](../03_Templates/Art_QA_Checklist.md)
- [Outsource_Package_Spec.md](../03_Templates/Outsource_Package_Spec.md)
