# Art Bible — FarmOS

| | |
|--|--|
| **Verze** | v0.2.0 |
| **Status** | Draft |
| **Tier** | T0 |
| **Preprodukční fáze** | 1 — Creative Direction |
| **Priorita** | **#1 — nejvyšší** |
| **Vlastník** | Art Director |
| **Backup** | TBD |
| **Review** | Ročně nebo major milestone (0.5, 1.0) |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.2.0 | 2026-07-04 | — | Ústava grafiky: motto, emoce, identita, neměnné principy |
| v0.1.0 | 2026-07-04 | — | Iniciální osnova a vizuální pilíře |

---

## Účel

**Nejvyšší vizuální autorita** celé grafické části FarmOS. Tento dokument je „ústava" — definuje směr, emoce, pilíře a hranice. Všechny ostatní art dokumenty z něj vycházejí a nesmí mu odporovat.

**Čte:** všichni artisté, design, produkce, marketing, outsource leads.  
**Neobsahuje:** hex barvy → [Color Script](Color_Script.md); osvětlení → [Lighting Guide](../02_Production_Guidelines/Lighting_Guide.md); konkrétní krajina → [Environment Bible](../01_Domain_Bibles/Environment_Bible.md); PBR → [Material Guide](../02_Production_Guidelines/Material_Guide.md).

**[RULE]** Art Bible je Source of Truth pro vizuální směr. Implementace v kódu ani prototypy nejsou autorita.

---

## 1. Motto FarmOS

> **„Svět, do kterého chcete zoomovat — ne projet kolem."**

Motto shrnuje základní smlouvu s hráčem: FarmOS není o rychlosti a adrenalinu. Je o **pohledu shora**, o přehledu, o pomalém budování vztahu k zemi a farmě. Kamera zůstává v management výšce; svět musí být dost krásný a čitelný, aby hráč chtěl přibližovat zoom, ne měnit hru na akční simulátor.

---

## 2. Emoce, které hra vyvolává

| Emoce | Jak ji vizuál podporuje |
|-------|-------------------------|
| **Klid** | Pokojné denní světlo, žádný vizuální chaos, měkká atmosféra |
| **Kontrola** | Čitelný stav farmy z výšky — hráč vidí, co se děje |
| **Zadostiučinění** | Viditelný pokrok — oranice, růst, sklizeň, stopy po práci |
| **Péče** | Živá farma s wear a sezónností — svět reaguje na hráčovu práci |
| **Důvěra** | Konzistentní realismus — svět působí uvěřitelně, ne jako rozbitý prototyp |
| **Touha zůstat** | Krajina a atmosféra, které lákají k pozorování, ne jen ke klikání |

**[RULE]** FarmOS nevyvolává strach, urgenci ani competitive stress. Vizuál nesmí působit jako battle royale, survival horror ani arcade závod.

---

## 3. Stupeň realismu

**Cíl:** *believable contemporary European farm* — uvěřitelná současná evropská farma pro management simulátor.

```text
Stylizace ◄────────────────────────────────────► Fotorealismus
   │                        │                           │
   │                   ★ FarmOS                          │
   │         (believable management sim)                 │
```

| Aspekt | Rozhodnutí |
|--------|------------|
| Materiály | PBR principy — světlo a povrch se chovají věrohodně |
| Proporce | Reálné měřítko — stroje, budovy, pole odpovídají realitě |
| Detaily | Škálované s vzdáleností — hero u strojů, zjednodušení v dálce |
| Styl | Žádná karikatura, žádný low-poly „indie" vzhled jako cíl |
| Archviz | Ne cíl — hra, ne realitní vizualizace pro developera |

**Rozhodovací test:** *„Vypadá to jako farma, kterou bych chtěl spravovat — ne jako tech demo ani jako dětská hra?"*

Konkrétní region a kulturní vrstva → [ADR-A01 Framework](ADR-A01_Regional_Identity_Framework.md) (musí být Accepted před Environment Bible).

---

## 4. Vizuální pilíře

### 4.1 Čitelnost z výšky

Isometrická kamera je primární pohled ([Camera Guide](../02_Production_Guidelines/Camera_Composition_Guide.md)). Siluety, kontrast a hierarchie musí fungovat v celém rozsahu zoomu.

| Priorita | Co musí být okamžitě čitelné |
|----------|------------------------------|
| 1 | Stavy polí (oranice, růst, sklizeň) |
| 2 | Stroje a jejich aktivita |
| 3 | Budovy a logistické uzly (silo, mlýn, sklad) |
| 4 | Sezónní kontext (barva krajiny, listí, sníh) |

### 4.2 Realismus s měřítkem

- Wear a špína jsou **narrativní** — vyprávějí příběh použití, nejsou náhodný šum.
- Detaily se škálují s vzdáleností.

### 4.3 Živost bez chaosu

Farma není muzeum. Po práci zůstávají stopy — tire ruts, prach, zbytky slámy. Každý prvek živosti musí mít gameplay nebo narativní důvod.

### 4.4 Sezónnost jako identita

Hra je o cyklech. Vizuální změna ročních období je stejně důležitá jako zvuk nebo UI. Palety → [Color Script](Color_Script.md) po schválení [Lighting Guide](../02_Production_Guidelines/Lighting_Guide.md).

### 4.5 Klid a důvěra

Tón je **pokojný, denní, pracovní**. Preferované podmínky: jasné dopoledne, měkké odpoledne, zatažené ale čitelné dny. Bouřky jsou výjimka s významem, ne default.

---

## 5. Co tvoří vizuální identitu FarmOS

Vizuální identita = soubor prvků, podle kterých hráč pozná FarmOS bez loga:

| Prvek | Definice |
|-------|----------|
| **Isometrický management pohled** | Hráč vždy spravuje, ne řídí závodní auto |
| **Pole jako vizuální centrum** | Oranice a plodiny dominují záběru — farma je o zemi |
| **Believable evropská krajina** | Region dle ADR-A01 — architektura, vegetace, infrastruktura |
| **Denní pracovní atmosféra** | Klidné světlo, živá ale ne dramatická obloha |
| **Stopy práce** | Wear na strojích, stopy na poli — farma žije |
| **Sezónní proměna** | Svět se mění v čase — jaro, léto, podzim, zima |
| **Čitelnost nad efektem** | Každý vizuální prvek slouží rozhodování |

Brand a marketing vrstva → [Visual Identity](Visual_Identity.md).

---

## 6. Anti-patterns — co FarmOS vizuálně NENÍ

| Anti-pattern | Proč ne |
|--------------|---------|
| Kopie Farming Simulator / Manor Lords | Vlastní identita; inspirace jen v [Mood Library](Mood_Reference_Library.md) |
| Arcade barevnost, neon akcenty | Narušuje čitelnost a realism level |
| Přeplněná scéna „pro krásu" | Management čitelnost a konzistence |
| Hero character focus | Workers jsou funkční, ne protagonista |
| Noc jako default | Hra se hraje převážně ve dne |
| Generický „low poly indie" look jako cíl | Believable materiály při rozumném budgetu |
| Driving sim estetika | FarmOS není závodní hra |
| Fotorealistický archviz | Hra, ne prodejní brožura developera |

---

## 7. Wear & cleanliness filozofie

| Kategorie | Úroveň wear | Příklad |
|-----------|-------------|---------|
| Nový stroj / nová budova | Čistý, minimální opotřebení | Nový traktor |
| Běžná provozní farma | Střední — prach, škrábance, olej | Default stav světa |
| Starší infrastruktura | Vyšší — rez, patina, opravy | Historická stodola |
| Po práci v poli | Dočasné — bláto, stopy | Tire tracks, zaprášení |

**[RULE]** Wear mapuje na stáří assetu a intenzitu použití — ne na náhodu per instance.

Technické rozsahy PBR → [Material Guide](../02_Production_Guidelines/Material_Guide.md) (Fáze 2).

---

## 8. Principy, které se nikdy nesmí porušit

Tyto zásady jsou **neměnné** bez záznamu v [Art Decision Log](../01_ART_DECISION_LOG.md) a schválení Art Directora:

1. **Art Bible je vizuální autorita** — implementace se přizpůsobuje docs, ne naopak.
2. **Čitelnost z výšky** — gameplay informace musí být viditelné v isometric pohledu.
3. **FarmOS není driving sim** — vizuál nesmí evokovat závodní nebo akční hru.
4. **Klidný denní tón** — default světa není noc, apokalypsa ani fantasy.
5. **Jeden fakt na jednom místě** — barvy v Color Script, světlo v Lighting Guide, krajina v Environment Bible.
6. **Inspirace ≠ pravidla** — reference v Mood Library nejsou automaticky závazné.
7. **Živost má důvod** — stopy práce a wear musí dávat smysl, ne plnit scénu šumem.
8. **Sezónnost je identita** — roční cyklus musí být vizuálně patrný napříč světem.
9. **Regionální konzistence** — po schválení ADR-A01 nesmí domény vizuálně odporovat regionu.
10. **Produkční spec až po směru** — Asset Pipeline a LOD pravidla nejdříve po uzamčení Creative Direction.

---

## 9. Doménová hierarchie v záběru

```text
1. Aktivní gameplay zóna (pole, stroj v práci)
2. Logistické uzly (silo, sklad, garáž)
3. Krajinový kontext (horizont, lesní okraj)
4. Atmosférické prvky (obloha, mlha — podporují, nepřebíjí)
```

Detailní pravidla → [01_Domain_Bibles/](../01_Domain_Bibles/) po dokončení preprodukční roadmapy ([00_INDEX.md](../00_INDEX.md)).

---

## 10. North star reference

**[INSPIRATION]** Max 1 stránka. Plný katalog → [Mood Reference Library](Mood_Reference_Library.md).

| Směr | Reference (TBD) |
|------|-----------------|
| Krajina & atmosféra | _doplnit po ADR-A01_ |
| Současná evropská farma | _doplnit po ADR-A01_ |
| Management čitelnost | _TBD_ |

---

## 11. Vazba na produkt

| Produktový fakt | Vizuální důsledek |
|-----------------|-------------------|
| Zemědělská manažerská simulace | Čitelnost, klid, pole jako centrum |
| Stroje jako controllable entities | Vehicle/Machine Guide (Fáze 3) |
| Budovy jako logistické uzly | Building Style (Fáze 3) |
| Pole jako core gameplay | Environment + Terrain (Fáze 1–2) |
| Worker jako controllable actor | Character Guide — lightweight (Fáze 3) |

Technická architektura: [`docs/Architecture/`](../Architecture/README.md) — art docs ji nemění.

---

## 12. Další kroky (preprodukce)

| Pořadí | Akce |
|--------|------|
| 1 | Schválit tuto Art Bible (Draft → Approved) |
| 1b | Schválit [World Identity Statement](World_Identity_Statement.md) — Vision Lock |
| 2 | Workshop dle [ADR-A01 Framework](ADR-A01_Regional_Identity_Framework.md) → Accepted v Decision Log |
| 3 | Dokončit [Environment Bible](../01_Domain_Bibles/Environment_Bible.md) |
| 4 | Dokončit [Lighting Guide](../02_Production_Guidelines/Lighting_Guide.md) |
| 5 | Finalizovat [Color Script](Color_Script.md) |

---

## Související dokumenty

- [00_INDEX.md](../00_INDEX.md) — preprodukční roadmapa
- [World_Identity_Statement.md](World_Identity_Statement.md) — Vision Lock, filozofie světa
- [ADR-A01 Framework](ADR-A01_Regional_Identity_Framework.md) — rozhodovací metodika
- [01_ART_DECISION_LOG.md](../01_ART_DECISION_LOG.md) — zápis finálního rozhodnutí
- [Environment_Bible.md](../01_Domain_Bibles/Environment_Bible.md)
- [Lighting_Guide.md](../02_Production_Guidelines/Lighting_Guide.md)
- [Color_Script.md](Color_Script.md)
