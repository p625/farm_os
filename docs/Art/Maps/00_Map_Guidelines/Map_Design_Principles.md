# Map Design Principles — FarmOS

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Vlastník** | World Director |
| **Poslední změna** | 2026-07-04 |

---

## Účel

Obecné principy návrhu **jakékoli herní mapy** FarmOS. Každá konkrétní mapa (`Map_XX_*/`) tyto principy dědí a konkretizuje.

**Nadřazené dokumenty:** [Art Bible](../../00_Strategy/Art_Bible.md), [World Identity Statement](../../00_Strategy/World_Identity_Statement.md).

---

## Povinná dokumentační řada per mapa

```text
Map_XX_Design_Bible
    → Map_XX_Spatial_Design
    → Map_XX_Landscape_Layout
    → Map_XX_POI_Guide · Field_Layout · Road_Network · Vegetation · …
```

**[RULE]** Nepřeskakovat Spatial Design před Landscape Layout.

---

## Principy

1. **Čitelnost z management výšky** — pole a dominantly musí fungovat v isometric pohledu.
2. **Hierarchie dominant** — primární / sekundární / terciární (viz Spatial Design).
3. **Negative space** — otevřená pole jsou součást kompozice.
4. **Logické hospodaření** — prostor odráží generace zemědělství, ne asset dump.
5. **Etalon** — Map 01 je referenční; nové mapy nesmí porušit identitu bez ADR.

---

## Související

- [Biome_Design_Principles.md](Biome_Design_Principles.md)
- [Map_01_Central_Europe](../Map_01_Central_Europe/Map_01_Design_Bible.md) — referenční instance
