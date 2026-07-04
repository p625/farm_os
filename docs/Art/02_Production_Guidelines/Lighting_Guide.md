# Lighting Guide — FarmOS

| | |
|--|--|
| **Verze** | v0.2.0 |
| **Status** | Draft |
| **Tier** | T2 (soubor) · **Fáze 1** (priorita dokončení) |
| **Preprodukční fáze** | 1 — Creative Direction |
| **Priorita** | **#4 — před Color Script** |
| **Vlastník** | Lighting Lead |
| **Backup** | Art Director |
| **Review** | Před schválením Color Script |
| **Poslední změna** | 2026-07-04 |
| **Blokováno** | [Art Bible](../00_Strategy/Art_Bible.md), [ADR-A01](../01_ART_DECISION_LOG.md#adr-a01--regionální-identita-farmy), [Environment Bible](../01_Domain_Bibles/Environment_Bible.md) |
| **Blokuje** | [Color Script](../00_Strategy/Color_Script.md), [Material Guide](Material_Guide.md) |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.2.0 | 2026-07-04 | — | Povýšeno do Fáze 1; SoT pro osvětlení; před Color Script |
| v0.1.0 | 2026-07-04 | — | Iniciální kostra |

---

## Účel

**Source of Truth pro osvětlení** FarmOS. Exponometrie, denní doba, interiér/exteriér, čitelnost scény z isometric kamery.

Světlo určuje vzhled všech materiálů. [Color Script](../00_Strategy/Color_Script.md) **musí vycházet z tohoto dokumentu** — ne naopak.

**Neobsahuje:** vizuální obsah oblohy a počasí jako doména → [Sky & Weather Guide](../01_Domain_Bibles/Sky_Weather_Guide.md) (Fáze 2).

**[RULE]** Lighting Guide je autorita osvětlení. Implementace se synchronizuje z docs po schválení.

---

## Pozice v preprodukci

| Pořadí Fáze 1 | Dokument |
|--------------|----------|
| 1 | Art Bible |
| 2 | ADR-A01 |
| 3 | Environment Bible |
| **4** | **Lighting Guide** ← tento dokument |
| 5 | Color Script |

---

## Obsahová osnova (TBD)

- [ ] Filozofie světla dle [Art Bible](../00_Strategy/Art_Bible.md) — klidný denní tón
- [ ] Key / fill / ambient poměry
- [ ] Default time of day (dopoledne / měkké odpoledne)
- [ ] Stíny — charakter a čitelnost z výšky
- [ ] Interiér budov (garáž, mlýn) — Fáze 3
- [ ] Vztah k obloze — handoff na Sky/Weather Guide
- [ ] Čitelnost gameplay prvků (pole, stroje, budovy)
- [ ] Kontrastní pravidla pro HUD overlay (handoff UI Style Guide)

---

## Vazba na Color Script

Po schválení tohoto dokumentu:

1. Lighting Lead + Art Director definují finální paletu v Color Script.
2. Prototypové barvy v implementaci se označí za nahrazené.
3. Material Guide (Fáze 2) odkazuje na oba dokumenty.

---

## Související dokumenty

- [00_INDEX.md](../00_INDEX.md)
- [Art_Bible.md](../00_Strategy/Art_Bible.md)
- [Environment_Bible.md](../01_Domain_Bibles/Environment_Bible.md)
- [Color_Script.md](../00_Strategy/Color_Script.md) — **následující krok**
- [Sky_Weather_Guide.md](../01_Domain_Bibles/Sky_Weather_Guide.md)
