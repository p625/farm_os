# Maps — FarmOS

Dokumentace **konkrétních herních map**. Každá mapa je **produkční balíček** — dokumentace + reference.

Obecné principy: [`00_Map_Guidelines/`](00_Map_Guidelines/).

---

## Struktura

```text
docs/Art/Maps/
├── 00_Map_Guidelines/
├── Map_01_Central_Europe/          ← Vertical Slice (produkční balíček)
│   ├── Map_01_Design_Bible.md
│   ├── Map_01_Spatial_Design.md
│   ├── Map_01_Landscape_Layout.md
│   ├── Map_01_View_Composition.md
│   ├── Map_01_References/
│   └── … (Road Network, Field Layout, POI — TBD)
└── archive/
```

---

## Map 01 — Central Europe (Vertical Slice)

| Dokument | Stav | Účel |
|----------|------|------|
| [Design Bible](Map_01_Central_Europe/Map_01_Design_Bible.md) | Draft | Co mapa obsahuje |
| [Spatial Design](Map_01_Central_Europe/Map_01_Spatial_Design.md) | Draft | Prostorová logika |
| [Landscape Layout](Map_01_Central_Europe/Map_01_Landscape_Layout.md) | Draft | Makrokompozice (Varianta A) |
| [View Composition](Map_01_Central_Europe/Map_01_View_Composition.md) | Draft | **Kompozice pohledů z kamery** |
| [References](Map_01_Central_Europe/Map_01_References/README.md) | Připraveno | Fotoreference per oblast |
| Map_01_Road_Network | TBD | Po View Composition |
| Map_01_Field_Layout | TBD | Po View Composition |
| Map_01_POI_Guide | TBD | Po Field Layout |
| Map_01_Vegetation | TBD | |
| Map_01_Lighting | TBD | |
| Map_01_Asset_List | TBD | |

---

## Produkční řada Map 01

```text
Design Bible → Spatial Design → Landscape Layout
    → View Composition          ← aktuální fáze
    → Road Network → Field Layout → POI → Vegetation → Lighting → Asset List
```

**Záměrná odchylka od běžného AAA:** View Composition před cestami a poli — hráč vidí kameru, ne CAD výkres.

---

## Hierarchie

```text
Art Bible → World Identity → ADR-A01
       │
       ▼
00_Map_Guidelines
       │
       ▼
Map_XX_Design_Bible → Spatial_Design → Landscape_Layout → View_Composition → …
```

---

## Source of Truth

| Oblast | Dokument |
|--------|----------|
| Principy všech map | `00_Map_Guidelines/` |
| Makro layout Map 01 | `Map_01_Landscape_Layout.md` |
| Kompozice pohledů Map 01 | `Map_01_View_Composition.md` |
| Prostorová logika Map 01 | `Map_01_Spatial_Design.md` |
