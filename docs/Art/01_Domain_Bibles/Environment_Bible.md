# Environment Bible — FarmOS

| | |
|--|--|
| **Verze** | v0.2.0 |
| **Status** | Draft |
| **Tier** | T1 |
| **Preprodukční fáze** | 1 — Creative Direction |
| **Priorita** | **#3 — po ADR-A01** |
| **Vlastník** | Environment Lead |
| **Backup** | Art Director |
| **Review** | Kvartálně |
| **Poslední změna** | 2026-07-04 |
| **Blokováno** | [Art Bible](../00_Strategy/Art_Bible.md), [World Identity Statement](../00_Strategy/World_Identity_Statement.md), [ADR-A01 Framework](../00_Strategy/ADR-A01_Regional_Identity_Framework.md) (Accepted) |
| **Blokuje** | Terrain, Vegetation, Sky/Weather, Seasonal |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.2.0 | 2026-07-04 | — | Povýšeno do Fáze 1; SoT krajiny; rozšířená osnova |
| v0.1.0 | 2026-07-04 | — | Iniciální kostra |

---

## Účel

**Source of Truth pro krajina (makro).** Environment je největší vizuální plocha celé hry. Tento dokument definuje, jak hráč čte svět ze strategické výšky — dříve než se produkuje jakýkoli terén, vegetace nebo asset.

**Neobsahuje:** mikro terén a ornici → [Terrain Guide](Terrain_Landscape_Guide.md); konkrétní druhy stromů → [Vegetation Guide](Vegetation_Guide.md); budovy → [Building Style Guide](Building_Style_Guide.md).

**[RULE]** Environment Bible je autorita krajiny. Implementace se synchronizuje z docs po schválení.

---

## Pozice v preprodukci

| Pořadí Fáze 1 | Dokument |
|--------------|----------|
| 1 | Art Bible |
| 2 | ADR-A01 |
| **3** | **Environment Bible** ← tento dokument |
| 4 | Lighting Guide |
| 5 | Color Script |

---

## Obsahová osnova (TBD)

### Krajina a region

- [ ] Geografický a kulturní kontext dle [ADR-A01 Framework](../00_Strategy/ADR-A01_Regional_Identity_Framework.md) (po Accepted)
- [ ] Biomy a jejich vizuální charakter
- [ ] Reliéf a výšková struktura krajiny

### Čitelnost a kompozice

- [ ] Hierarchie prostoru (foreground farm / midground fields / background horizon)
- [ ] Čitelnost mapy z isometric kamery ([Camera Guide](../02_Production_Guidelines/Camera_Composition_Guide.md))
- [ ] Hustota detailu per vzdálenostní pásmo
- [ ] Siluety a kontrast vůči obloze

### Prvky krajiny

- [ ] **Horizont** a skyline pravidla
- [ ] **Pole** — makro čitelnost, vztah k farmě
- [ ] **Lesy** a lesní okraj
- [ ] **Voda** — potoky, rybníky, odvodnění (makro)
- [ ] **Cesty** — makro síť (detail → [Infrastructure Guide](Infrastructure_Guide.md))
- [ ] **Přirozené dominanty** — kopce, aleje, izolované stromy

### Reference

- [ ] `[INSPIRATION]` → [Mood Library](../00_Strategy/Mood_Reference_Library.md) — kurátorováno podle ADR-A01

---

## Související dokumenty

- [Art_Bible.md](../00_Strategy/Art_Bible.md)
- [01_ART_DECISION_LOG.md](../01_ART_DECISION_LOG.md) — ADR-A01
- [Terrain_Landscape_Guide.md](Terrain_Landscape_Guide.md) — Fáze 2
- [Vegetation_Guide.md](Vegetation_Guide.md) — Fáze 2
- [Lighting_Guide.md](../02_Production_Guidelines/Lighting_Guide.md) — Fáze 1 #4
