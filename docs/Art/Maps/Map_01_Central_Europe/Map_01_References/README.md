# Map 01 — References

Kurátorství fotografických a vizuálních referencí pro **Map 01 Central Europe**.

Tato složka je součást **produkčního balíčku** mapy. Obrázky se přidávají průběžně — architektura složek je připravená od začátku.

**[RULE]** Reference jsou `[INSPIRATION]` — ne acceptance criteria. Viz [Mood Reference Library](../../00_Strategy/Mood_Reference_Library.md).

---

## Struktura

```text
Map_01_References/
├── README.md           ← tento soubor
├── Farm/               # Statky, dvory, sila, stodoly
├── Village/            # Náves, kostel, venkovská zástavba
├── Fields/             # Ornice, obilí, řepka, sklizeň, remízky
├── Roads/              # Silnice III. třídy, polní cesty, mosty
├── Rivers/             # Řeka, potoky, mokřady, propustky
├── Forests/            # Smíšený les, aleje, lesní okraje
├── Lighting/           # Denní doba, mlha, obloha
└── Weather/            # Déšť, zataženo, sníh (sezónní)
```

---

## Vazba na dokumentaci

| Složka | Dokument | Hero Views |
|--------|----------|------------|
| Farm | POI Guide, View Composition HV-01 | HV-01, HV-05 |
| Village | POI Guide | HV-03 |
| Fields | Field Layout, Agricultural Master Plan | Farming views, parcely |
| Roads | Road Network, Agricultural Master Plan | CM-04, odvoz, tire logic |
| Rivers | Landscape Layout, Agricultural Master Plan | HV-04, hydrologie |
| Forests | Vegetation | Horizont, framing |
| Lighting | Map_01_Lighting | CM-01–08 |
| Weather | Seasonal, Sky Guide | Seasonal views |

---

## Jak přidávat reference

1. Pojmenovat soubor: `{kategorie}_{popis}_{zdroj}.jpg` (nebo odkaz v `.url` / `.md` indexu).
2. Označit tagy: sezóna, region inspirace, `[INSPIRATION]`.
3. Propojit s Hero View ID (např. `HV-01`, `CM-03`) v poznámce.
4. Licenci ověřit před použitím v outsource balíčku.

---

## Index referencí (TBD)

| ID | Soubor / URL | Kategorie | Tagy | Hero View |
|----|--------------|-----------|------|-----------|
| — | _zatím prázdné_ | | | |

---

## Související

- [Map_01_View_Composition.md](../Map_01_View_Composition.md)
- [Map_01_Master_Plan.md](../Map_01_Master_Plan.md)
- [Map_01_Agricultural_Master_Plan.md](../Map_01_Agricultural_Master_Plan.md)
- [Map_01_Road_Network.md](../Map_01_Road_Network.md)
- [Map_01_Field_Layout.md](../Map_01_Field_Layout.md)
- [Map_01_Design_Bible.md](../Map_01_Design_Bible.md) — sekce Reference Direction
