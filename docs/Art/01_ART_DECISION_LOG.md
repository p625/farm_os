# Art Decision Log

| | |
|--|--|
| **Verze** | v0.3.0 |
| **Status** | Draft |
| **Tier** | T0 |
| **Vlastník** | Art Director |
| **Backup** | TBD |
| **Review** | Při každém schváleném vizuálním rozhodnutí |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.3.0 | 2026-07-04 | — | ADR-A01 Decision Framework — samostatný dokument |
| v0.2.0 | 2026-07-04 | — | ADR-A01 povýšen na blokující prioritu Fáze 1 |
| v0.1.0 | 2026-07-04 | — | Iniciální šablona ADR |

---

## Účel

Záznam **proč** jsme změnili vizuální směr — bez přepisování Bible. Formát inspirovaný ADR (Architecture Decision Records).

**[RULE]** Konflikt mezi docs nebo změna pilíře → nový záznam zde, pak aktualizace dotčeného dokumentu.

---

## Preprodukční priorita ADR

| Priorita | ADR | Status | Blokuje |
|----------|-----|--------|---------|
| **#2 Fáze 1** | [ADR-A01](#adr-a01--regionální-identita-farmy) · [Framework](00_Strategy/ADR-A01_Regional_Identity_Framework.md) | Proposed (framework ready) | Environment, Building, Vegetation, Terrain, Infrastructure |
| — | ADR-A02 Míra modernity strojů vs. historické budovy | Čeká na A01 | Vehicle, Building |
| — | ADR-A03 Den/noční cyklus — vizuální scope v1.0 | Čeká na A01 | Lighting, Sky/Weather |

---

## Šablona záznamu

```markdown
### ADR-A### — Název rozhodnutí

| | |
|--|--|
| **Datum** | YYYY-MM-DD |
| **Status** | Proposed / Accepted / Superseded by ADR-A### |
| **Rozhodl** | Jméno / role |
| **Dotčené docs** | seznam odkazů |

#### Kontext
Co vedlo k rozhodnutí?

#### Rozhodnutí
Co jsme zvolili?

#### Důsledky
Co se mění v produkci? Co zůstává?

#### Alternativy (zamítnuté)
| Alternativa | Proč ne |
|-------------|---------|
| … | … |
```

---

## Záznamy

### ADR-A01 — Regionální identita farmy

| | |
|--|--|
| **Priorita** | **#2 — Fáze 1 Creative Direction (blokující)** |
| **Decision Framework** | **[ADR-A01 Regional Identity Framework](00_Strategy/ADR-A01_Regional_Identity_Framework.md)** |
| **Datum rozhodnutí** | — |
| **Status** | **Proposed** — framework připraven, region nevybrán |
| **Rozhodl** | Art Director (po workshopu dle frameworku) |
| **Dotčené docs** | Art Bible, Environment Bible, Building Style, Vegetation, Terrain, Infrastructure, Sky/Weather, Seasonal, Lighting, Color Script, Mood Library |

#### Kontext

FarmOS potřebuje jednotnou regionální identitu dříve, než lze dokončit jakýkoli doménový guide. Art Bible stanovuje *believable contemporary European farm* — ADR-A01 konkretizuje vizuální svět.

Kompletní metodika výběru — kritéria, kandidáti, matice, otevřené otázky — je v **[Decision Framework](00_Strategy/ADR-A01_Regional_Identity_Framework.md)**. Tento záznam slouží k zápisu **finálního rozhodnutí** po workshopu.

#### Rozhodnutí (TBD — po vyplnění frameworku)

_Zapisuje se po Accepted. Šablona:_

| Oblast | Schválený směr |
|--------|----------------|
| Region / směr | _TBD_ |
| In / Out list | _TBD — viz framework_ |
| Odpovědi Q1–Q14 | _TBD — viz framework sekce 7_ |
| Výsledek matice | _TBD_ |

#### Důsledky

Po **Accepted** — viz [framework sekce 6](00_Strategy/ADR-A01_Regional_Identity_Framework.md#6-dopady-rozhodnutí).

#### Alternativy (zamítnuté)

| Alternativa | Proč ne |
|-------------|---------|
| Okamžitý výběr regionu bez frameworku | Chybí objektivní kritéria a zodpovězené strategické otázky |
| Region řešit až v produkci assetů | Vede k nekončitým reworkům |
| Generická „evropská" farma bez specifikace | Tým 20+ lidí nedokáže konzistentně rozhodovat |

---

## Superseded rozhodnutí

Přesunout sem záznamy nahrazené novějším ADR s odkazem na nástupce.
