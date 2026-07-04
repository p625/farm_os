# Maps — FarmOS

Dokumentace **konkrétních herních map**. Každá mapa má vlastní Design Bible jako Source of Truth pro její návrh.

Obecné domain guides (`01_Domain_Bibles/`, `02_Production_Guidelines/`) platí pro celý projekt. Map docs je **aplikují na konkrétní oblast**.

---

## Mapy

| Mapa | Dokument | Stav |
|------|----------|------|
| **Map 01** (Vertical Slice) | [Map_01_Design_Bible.md](Map_01_Design_Bible.md) | Draft |

## Navazující dokumenty (Map 01 — TBD)

- `Map_01_Landscape_Layout.md`
- `Map_01_POI_Guide.md`
- `Map_01_Vegetation.md`
- `Map_01_Lighting.md`
- `Map_01_Asset_List.md`

---

## Hierarchie

```text
Art Bible → World Identity → ADR-A01
       │
       ▼
Map_XX_Design_Bible
       │
       ▼
Map_XX_Landscape_Layout · POI · Vegetation · …
       │
       ▼
Environment / Vegetation / Building guides (obecné)
```
