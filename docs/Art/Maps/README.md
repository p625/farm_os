# Maps — FarmOS

Dokumentace **konkrétních herních map**. Každá mapa je **produkční balíček** — dokumentace + reference.

Obecné principy: [`00_Map_Guidelines/`](00_Map_Guidelines/).

---

## Struktura

```text
docs/Art/Maps/
├── 00_Map_Guidelines/
├── Map_01_Central_Europe/          ← Vertical Slice — dokumentace UZAVŘENA
│   ├── Map_01_Design_Bible.md
│   ├── Map_01_Spatial_Design.md
│   ├── Map_01_Landscape_Layout.md
│   ├── Map_01_View_Composition.md
│   ├── Map_01_Master_Plan.md
│   ├── Map_01_Agricultural_Master_Plan.md
│   ├── Map_01_Road_Network.md
│   ├── Map_01_Field_Layout.md
│   ├── Map_01_References/
│   └── … (POI, Vegetation, Lighting — při produkci assetů)
└── archive/
```

---

## Map 01 — Central Europe (Vertical Slice)

**Stav dokumentace: UZAVŘENA** (2026-07-04). Další fáze: **Phase 13 — FarmOS World Editor**.

| Dokument | Stav | Účel |
|----------|------|------|
| [Design Bible](Map_01_Central_Europe/Map_01_Design_Bible.md) | Approved | Co mapa obsahuje |
| [Spatial Design](Map_01_Central_Europe/Map_01_Spatial_Design.md) | Approved | Prostorová logika |
| [Landscape Layout](Map_01_Central_Europe/Map_01_Landscape_Layout.md) | Approved | Makrokompozice (Varianta A) |
| [View Composition](Map_01_Central_Europe/Map_01_View_Composition.md) | Approved | Kompozice pohledů z kamery |
| [Master Plan](Map_01_Central_Europe/Map_01_Master_Plan.md) | Approved | SoT produkce Map 01 |
| [Agricultural Master Plan](Map_01_Central_Europe/Map_01_Agricultural_Master_Plan.md) | Approved | SoT zemědělské logiky |
| [Road Network](Map_01_Central_Europe/Map_01_Road_Network.md) | Approved | Logika pohybu krajinou |
| [**Field Layout**](Map_01_Central_Europe/Map_01_Field_Layout.md) | **Approved** | **SoT parcel a gameplay prostoru** |
| [References](Map_01_Central_Europe/Map_01_References/README.md) | Připraveno | Fotoreference per oblast |
| Map_01_POI_Guide | TBD | Při produkci assetů |
| Map_01_Vegetation | TBD | Při produkci assetů |
| Map_01_Lighting | TBD | Při produkci assetů |
| Map_01_Asset_List | TBD | Při produkci assetů |

---

## Produkční řada Map 01

```text
Design Bible → Spatial Design → Landscape Layout
    → View Composition → Master Plan → Agricultural Master Plan
    → Road Network → Field Layout          ← UZAVŘENO
    → Phase 13: FarmOS World Editor
    → Blockout → Production (POI, Vegetation, Lighting, Assets)
```

---

## Hierarchie

```text
Art Bible → World Identity → ADR-A01
       │
       ▼
00_Map_Guidelines
       │
       ▼
Map_XX_Design_Bible → … → Field_Layout → World Editor
```

---

## Source of Truth

| Oblast | Dokument |
|--------|----------|
| Principy všech map | `00_Map_Guidelines/` |
| Produkce Map 01 | `Map_01_Master_Plan.md` |
| Zemědělská logika Map 01 | `Map_01_Agricultural_Master_Plan.md` |
| Pohyb / komunikace Map 01 | `Map_01_Road_Network.md` |
| **Parcely / gameplay prostor Map 01** | **`Map_01_Field_Layout.md`** |
