# Map 01 — Master Plan

## Production Vision

| | |
|--|--|
| **Verze** | v1.0.0 |
| **Status** | Approved |
| **Typ** | Master Plan / Production Vision |
| **Vlastník** | World Director |
| **Backup** | Art Director, Production Director |
| **Review** | Před zahájením produkčních podkladů a blockoutu |
| **Poslední změna** | 2026-07-04 |
| **Mapa** | Map 01 — Central Europe (Vertical Slice) |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v1.0.0 | 2026-07-04 | — | Iniciální Master Plan — sjednocení schválené Art Direction |

---

## Účel dokumentu

Tento dokument je **Master Plan** první mapy FarmOS.

Není guide. Není návrh. Je **jediný referenční dokument pro produkci Map 01** — dokument, který si otevře Art Director, World Director, Environment Lead, Level Designer, nový člen týmu nebo outsource studio a během několika minut pochopí celou filozofii první mapy.

**[RULE]** `Map_01_Master_Plan.md` je **Source of Truth pro produkci Map 01**. Všechny produkční dokumenty (Road Network, Field Layout, POI Guide, Vegetation, Lighting, Asset List…) se musí řídit tímto dokumentem. Tento dokument **nemění** obsah schválených zdrojových dokumentů — pouze je sjednocuje.

**Neřeší:** implementaci, engine, AI, ekonomiku, skripty, polygonální modely, detailní assety.

---

## 1. Executive Summary

**Map 01 — Central Europe** je první hratelná mapa FarmOS a vizuální etalon celého projektu. Je to syntéza středoevropské venkovské krajiny — jemně zvlněná kotlinová krajina s konvenčním zemědělstvím, jednou vesnicí, jednou hlavní farmou a bez městské zástavby. Region není kopie jedné země; je to vlastní identita FarmOS inspirovaná Českem, jižním Polskem, Rakouskem a Německem.

**Zážitek:** Hráč je správce statku na návrší. Z isometric management kamery vidí své pole sestupovat k údolí řeky, vesnici s kostelem na protějším svahu a široký horizont oblohy. Krajina působí klidně, důvěryhodně a živě — místo, kde zemědělství dává smysl a kde chce hráč zoomovat stovky hodin.

**Proč existuje:** Map 01 není jednorázová aréna. Je genetický kód vizuální identity FarmOS — referenční standard kvality, kompozice a identity pro Vertical Slice i všechny budoucí mapy.

**Reprezentace FarmOS:** Když hráč poprvé spustí hru, musí říct *tohle je FarmOS* — ne generický farming sim. Map 01 implementuje Art Bible (management pohled, pole jako centrum, klid), World Identity Statement (realita s kurátorovanou idealizací) a ADR-A01 (středoevropský směr bez vázání na jeden stát).

**Makro uspořádání:** Schválená **Varianta A „Návrší a údolí"** — farma na návrší, pole k údolí, řeka jako osa, vesnice na hřebeni, rybník u farmy.

---

## 2. Vision Snapshot

> *FarmOS je klidný, čitelný, věrohodný svět středoevropského venkova — kde hráč jako správce hospodaří na zvlněné krajině s velkými výhledy, kde pole jsou vizuálním centrem, kde krajina vypadá obývaná a kurátorovaná, a kde isometric kamera po stovkách hodin stále nabízí pohledy, které stojí za zoom.*

Tento odstavec je **citovatelný text** pro budoucí mapy — definuje, co Map 01 reprezentuje v rámci franchise.

| Pilíř | Map 01 |
|-------|--------|
| **Art Bible** | Management pohled, čitelnost, pole jako centrum, believable evropská farma |
| **World Identity** | Inspirováno realitou + idealizace; prostor; hráč jako hospodář |
| **ADR-A01** | Střední Evropa syntéza — vlastní identita, ne jeden stát |
| **Filozofie mapy** | Návrší–údolí–horizont; krajina jako výsledek generací hospodaření |

---

## 3. Macro Layout Summary

**Varianta A — „Návrší a údolí"** (schváleno)

```text
                    [LES]    [VESNICE + kostel]
                      \         |
         horizont →    [LOUKA]-[ŘEKA v údolí]-[LES]
                              /   |
                    [POLE]--[most]--[POLE]
                       \    |    /
                        [POLE][POLE]
                           |
                      [FARMA][RYBNÍK]
                           |
                    [=== silnice ===]--→ (mimo mapu)
```

| Prvek | Role v kompozici |
|-------|------------------|
| **Farma** | Centrum gravitace na návrší — kotva emocí i gameplay; výhled dolů k polím a údolí |
| **Vesnice** | Kulturní horizont na protějším svahu — kostel jako silueta proti obloze |
| **Řeka** | Lineární osa údolí — strukturuje prostor, spojuje nebo odděluje území |
| **Les** | Hřeben a boční pásy — uzavírá kotlinu, rámuje horizont bez klaustrofobie |
| **Pole** | Bloky A (u farmy) a B (velké pole k údolí) — vizuální centrum, negative space |
| **Rybník** | Vodní kotva u farmy — klid, kontrast k textuře polí; nesmí zakrýt farmu z startu |

Směr „nahoře" = horizont / dálka od startovní farmy.

---

## 4. Spatial Logic Summary

Shrnutí [Map_01_Spatial_Design.md](Map_01_Spatial_Design.md) — bez opakování celého dokumentu.

### Hierarchy

| Vrstva | Prvky | Funkce |
|--------|-------|--------|
| **Primární** | Farma, vesnice, řeka | Identita mapy; vzájemně viditelné z typického výhledu |
| **Sekundární** | Rybník, most, mlýn, kostel | Hloubka a orientace; nesmí konkurovat farmě v blízkém pásmu |
| **Terciární** | Alej, remízek, samota, kaplička | Rytmus a autenticita; tiše, bez vizuálního šumu |

### Rhythm

Střídání otevřených polí, remízků, alejí, louek a zástavby. Žádný nekonečný pás stejné plodiny. Vertikální akcenty (silo, věž) pravidelně prostupují horizontální rytmus. Rytmus musí fungovat ve všech sezónách — v zimě ho nesou remízky a lesní pásy.

### Sightlines

Definované výhledy V1–V6: z farmy přes pole (V1), panorama (V2), k rybníku (V3), podél řeky (V4), z vyhlídky (V5), návrat k farmě (V6). Z default středního zoomu na farmě musí být do 2 sekund rozpoznatelné: farma, směr k velkému poli, směr k vesnici, přítomnost vody.

### Compression & Expansion

Krajina střídá uzavřené (les, úzká cesta) a otevřené prostory (pole, louky, horizont). Poměr cca 60 : 40 ve prospěch expanze. Nejširší expanze obsahuje farmu nebo pohled na farmu — hráč nikdy neztratí kotvu.

### Negative Space

Velké pole (blok B) je záměrná prázdná plocha — produktivní klid, ne „prázdné místo k vyplnění". Obloha min. ¼ záběru při širokém zoomu.

---

## 5. Hero Experiences

Nejdůležitější okamžiky z [Map_01_View_Composition.md](Map_01_View_Composition.md). Implementace není předmětem tohoto dokumentu — pouze závazná produkční očekávání.

| ID | Zážitek | Kdy | Priorita |
|----|---------|-----|----------|
| **CM-01 / HV-01** | První pohled po spuštění — „Moje farma" | Start hry | Kritická |
| **CM-02 / V2** | Panorama z farmy — pole, údolí, vesnice, obloha | První max zoom out | Kritická |
| **CM-03 / HV-06** | Sklizeň — zlaté pole, stroj, zadostiučinění | Harvestable stav | Vysoká |
| **HV-03** | Vesnice v dálce — kostel na hřebeni přes údolí | Orientace, sousedství | Vysoká |
| **HV-04** | Pohled přes řeku — tok, most, svahy | Klid vody, hloubka | Střední |
| **CM-04** | Podél aleje směrem k vesnici | Pan po mapě | Vysoká |
| **CM-06** | Zimní ráno — čistá struktura krajiny ve sněhu | Sezónní variace | Střední |
| **CM-08 / V6** | Návrat domů — farma jako cíl siluety | Pohled z cesty k vesnici | Střední |

**Screenshot Tier S** (Steam, trailer): HV-01 léto, HV-06, CM-02.

**Blockout gate:** CM-01, CM-02, CM-03 musí projít screenshot testem před schválením Road Network.

---

## 6. Production Priorities

Rozdělení podle priority pro plánování času, budgetu a review. Odvozeno z Design Bible (POI tiers) a View Composition.

### Tier 1 — Musí být perfektní

| Oblast | Co zahrnuje |
|--------|-------------|
| **Hlavní farma** | Dvůr, silo, stodola, orientace k default kameře (NV-01) |
| **Pole A + B** | Čitelnost stavů, sklizeň, negative space — HV-02, CM-03 |
| **Startovní kompozice** | HV-01, CM-01 — první frame |
| **Panorama** | CM-02 — široký zoom z farmy |
| **Vesnice + kostel** | Silueta na horizontu — HV-03 |
| **Kamera default** | Střední zoom ~35–45, look-at na farmu |

### Tier 2 — Velmi kvalitní

| Oblast | Co zahrnuje |
|--------|-------------|
| **Rybník** | HV-05, CM-05 (mlha) |
| **Řeka + most** | HV-04, lineární osa |
| **Alej** | CM-04, framing |
| **Silnice farmě–vesnice** | Odvoz ke silu, logistika |
| **Remízky a hranice polí** | Rytmus, sezónní čitelnost |
| **Sezónní variace** | HV-01/02 ve čtyřech ročních obdobích |

### Tier 3 — Stačí funkční

| Oblast | Co zahrnuje |
|--------|-------------|
| **Samoty** (1–2) | Živost krajiny |
| **Mlýn** | Kulturní vrstva u vody |
| **Lesní křižovatka** | Mikro-orientace |
| **Kaplička / hřiště** | Volitelné lidské detaily vesnice |
| **Propustek / brod** | Autenticita mimo hlavní most |
| **Periferní lesní cesty** | Přechod do lesa |

---

## 7. Production Risks

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| **Monotónní pole** | Únava po 10+ hodinách; NV-04 | Remízky, střídání plodin (A/B/C), svah; Field Layout podle Spatial rhythm |
| **Špatné panorama** | CM-02 selže; ztráta „wow" | Vesnice + les na hřebeni (NV-03); obloha min. 20–30 % širokého záběru |
| **Přehnaná hustota lesa** | Klaustrofobie; NV-07 | Les jen na hřebeni a bočním pásu; max ~40 % širokého záběru |
| **Slabá orientace** | Hráč se ztrácí bez mapy | Landmark visibility tabulka; test 2 sekundy z default zoomu |
| **Rybník zakrývá farmu** | CM-01 zničen; NV-06 | Rybník mimo osu HV-01; periferní umístění |
| **Zadní fasády farmy/vesnice** | NV-01, NV-09 | Orientace budov k default kameře a k polím |
| **Silnice bez logiky** | Porušení důvěry; NV-02 | Road Network — každá cesta má cíl |
| **Šedá obloha jako default** | Flat screenshoty; NV-08 | Lighting — difúzní ale živé; teplé dopoledne jako etalon |
| **Dva konkurenční focal pointy** | Roztříštěná pozornost; NV-05 | Spatial hierarchy — farma vždy primární v blízkém pásmu |
| **Layout logický shora, špatný z kamery** | Klasický FS problém | View Composition před Road/Field; negative view test při blockoutu |

---

## 8. Dependencies

Hierarchie závazných dokumentů, ze kterých Master Plan vychází:

```text
Art Bible
    ↓
World Identity Statement
    ↓
ADR-A01 Regional Identity Framework
    ↓
Map_01_Design_Bible
    ↓
Map_01_Spatial_Design
    ↓
Map_01_Landscape_Layout        (Varianta A)
    ↓
Map_01_View_Composition
    ↓
Map_01_Master_Plan               ← tento dokument
    ↓
Map_01_Agricultural_Master_Plan
    ↓
Road Network · Field Layout · POI · Vegetation · Lighting · Asset List
```

| Dokument | Odkaz |
|----------|-------|
| Art Bible | [../../00_Strategy/Art_Bible.md](../../00_Strategy/Art_Bible.md) |
| World Identity Statement | [../../00_Strategy/World_Identity_Statement.md](../../00_Strategy/World_Identity_Statement.md) |
| ADR-A01 Framework | [../../00_Strategy/ADR-A01_Regional_Identity_Framework.md](../../00_Strategy/ADR-A01_Regional_Identity_Framework.md) |
| Design Bible | [Map_01_Design_Bible.md](Map_01_Design_Bible.md) |
| Spatial Design | [Map_01_Spatial_Design.md](Map_01_Spatial_Design.md) |
| Landscape Layout | [Map_01_Landscape_Layout.md](Map_01_Landscape_Layout.md) |
| View Composition | [Map_01_View_Composition.md](Map_01_View_Composition.md) |
| Agricultural Master Plan | [Map_01_Agricultural_Master_Plan.md](Map_01_Agricultural_Master_Plan.md) |
| Reference fotografií | [Map_01_References/](Map_01_References/README.md) |

---

## 9. Production Readiness

| Oblast | Stav | Poznámka |
|--------|------|----------|
| **Art Direction** (Art Bible, World Identity, ADR-A01) | Complete | Schváleno |
| **Design** (Design Bible) | Complete | Schváleno |
| **Spatial** (Spatial Design) | Complete | Schváleno |
| **Macro Layout** (Landscape Layout, Varianta A) | Complete | Schváleno |
| **Composition** (View Composition) | Complete | Schváleno |
| **Master Plan** | Complete | Tento dokument |
| **Agricultural Logic** | Complete | [Agricultural Master Plan](Map_01_Agricultural_Master_Plan.md) |
| **Road Network** | Complete | [Road Network](Map_01_Road_Network.md) |
| **Field Layout** | Complete | [Field Layout](Map_01_Field_Layout.md) |
| **Dokumentace Map 01** | **Uzavřena** | → Phase 13 World Editor |
| **Blockout** | Pending | Ve World Editoru |
| **POI Guide** | Pending | Po Field Layout |
| **Vegetation** | Pending | |
| **Lighting** | Pending | |
| **Asset Production** | Pending | Po Asset List |
| **Blockout** | Pending | Po Gate E vstupech |
| **References** | Připraveno | Složky existují; obsah TBD |

---

## 10. Production Gates

Jednoduchý systém schvalování před přechodem mezi fázemi.

### Gate A — Art Direction Complete

| | |
|--|--|
| **Účel** | Uzamčení vizuální identity celého projektu |
| **Vstupy** | Art Bible, World Identity Statement, ADR-A01 |
| **Výstupy** | Schválená creative direction pro Map 01 i franchise |

**Stav:** ✅ Complete

---

### Gate B — Spatial Review Complete

| | |
|--|--|
| **Účel** | Prostorová logika mapy definována před makro layoutem |
| **Vstupy** | Design Bible, Spatial Design |
| **Výstupy** | Schválená hierarchie, rytmus, sightlines, compression/expansion |

**Stav:** ✅ Complete

---

### Gate C — View Composition Approved

| | |
|--|--|
| **Účel** | Kompozice z kamery uzamčena před cestami a poli |
| **Vstupy** | Landscape Layout (Varianta A), View Composition |
| **Výstupy** | HV-01–06, CM-01–08, negative views, screenshot tiers |

**Stav:** ✅ Complete

---

### Gate D — Master Plan Approved

| | |
|--|--|
| **Účel** | Sjednocení všech rozhodnutí do jednoho produkčního dokumentu |
| **Vstupy** | Všechny dokumenty Gate A–C |
| **Výstupy** | Schválený Master Plan; zelená pro produkční podklady |

**Stav:** ✅ Complete (tento dokument)

---

### Gate E — Blockout Approved

| | |
|--|--|
| **Účel** | Ověření kompozice v prostoru před asset produkcí |
| **Vstupy** | Master Plan, greybox terénu + placeholder dominant |
| **Výstupy** | CM-01, CM-02, CM-03 screenshot test; negative view test; schválení L08 (Varianta A) |

**Stav:** ⏳ Pending

---

### Gate F — Production Ready

| | |
|--|--|
| **Účel** | Všechny produkční dokumenty hotové; může začít asset pipeline |
| **Vstupy** | Road Network, Field Layout, POI Guide, Vegetation, Lighting, Asset List |
| **Výstupy** | Kompletní produkční balíček Map 01; outsource briefy |

**Stav:** ⏳ Pending

---

## 11. Open Decisions

Rozhodnutí, která **nejsou uzamčena** — musí být uzavřena před nebo během příslušné produkční fáze.

| ID | Otázka | Riziko | Blokuje |
|----|--------|--------|---------|
| **M01-D01** | Poloha farmy vůči vesnici (blízko / okraj / izolace) | Medium | Blockout |
| **M01-D02** | Mlýn — součást farmy nebo samostatný POI | Low | POI Guide |
| **M01-D03** | Počet samot (1–3) | Low | POI Guide |
| **M01-D04** | Dominantní letní plodina (obilí / řepka / mix) | Medium | Vegetation, HV-06 |
| **M01-D05** | Farma — historická vs. moderní vrstva (poměr) | Medium | Building, POI |
| **M01-D06** | Rybník — pozemek farmy nebo sdílený s vesnicí | Medium | Layout, POI |
| **M01-D07** | ADR-A01 jako franchise standard (ne jen Map 01) | High | Celý projekt |
| **M01-D08** | Rozsah mapy — co je za horizontem | Medium | Blockout |
| **L01** | Strana rybníka vůči farmě | Low | Blockout |
| **L02** | Počet a poloha samot | Low | POI Guide |
| **L03** | Poloha mlýna (řeka vs. rybník) | Low | POI, budovy |
| **L04** | Plodina bloku B v letním etalonu | Medium | Vegetation |
| **L05** | Boční lesní pás — západ nebo východ | Low | Lighting, kompozice |
| **L06** | Jedna vs. dvě polní mosty / brody | Low | Road Network |
| **L07** | Startovní vlastnictví polí (A vs. A+B) | High | Game Design → layout |
| **L08** | Potvrzení varianty A po blockoutu | High | Makro layout freeze |
| **VC-01** | Look-at target default kamery (dvůr vs. silo) | Medium | CM-01 |
| **VC-02** | Orientace farmy k default kameře | Medium | CM-01, NV-01 |
| **VC-03** | Letní plodina pro HV-06 | Medium | Vegetation |
| **VC-04** | Mlha u rybníka — standardní nebo výjimečná | Low | Lighting |
| **VC-05** | HUD safe zone pro CM-01 | Low | UI Style Guide |

**Uzamčeno (nesmí se měnit bez ADR):** Varianta A makro layout; pořadí View Composition před Road/Field; HV-01–06; NV-01–10; screenshot tier požadavky; návrší–údolí–horizont struktura.

---

## 12. Next Production Documents

Po schválení Master Planu a Agricultural Master Planu **končí strategická dokumentace Map 01**. Následuje produkce konkrétních podkladů:

```text
Map_01_Agricultural_Master_Plan     ← uzamčeno
    ↓
Map_01_Road_Network.md
    ↓
Map_01_Field_Layout.md
    ↓
Map_01_POI_Guide.md
    ↓
Map_01_Vegetation.md
    ↓
Map_01_Lighting.md
    ↓
Map_01_Asset_List.md
    ↓
Blockout Review                    (Gate E)
    ↓
Asset Production                   (Gate F)
```

| Dokument | Vlastník | Závisí na |
|----------|----------|-----------|
| Road Network | World Director | Master Plan, View Composition (NV-02) |
| Field Layout | Level Design | Road Network, Spatial rhythm |
| POI Guide | Environment Lead | Field Layout, Design Bible POI tiers |
| Vegetation | Vegetation Lead | Field Layout, L04/M01-D04 |
| Lighting | Lighting Lead | POI, View Composition (CM-07, NV-08) |
| Asset List | Art Producer | Vše výše |

Paralelně: plnění [`Map_01_References/`](Map_01_References/README.md) fotografiemi per oblast.

---

## Shrnutí

### 1. Proč je Master Plan důležitý před blockoutem

Blockout bez sjednocené vize vede k opravám, které se dotýkají všeho — terénu, cest, polí i budov. Master Plan uzamyká **co** a **proč** před **jak**. Gate E (blockout) testuje kompozici, ne objevuje identitu.

### 2. Jak pomůže týmu a partnerům

Nový člen nebo outsource studio dostane jeden dokument místo sedmi. Za pět minut chápe region, makro layout, hero zážitky, priority, rizika a otevřená rozhodnutí. Reference jsou organizované per oblast v `Map_01_References/`.

### 3. Jak sníží riziko nekonzistence

Každý produkční dokument má jasnou pozici v hierarchii a závazné vstupy. Road Network nesmí porušit View Composition. Field Layout nesmí zničit spatial rhythm. Konflikty se řeší proti Master Planu, ne ad hoc v chatu.

### 4. Co je připraveno pro produkční fázi

| Připraveno | Stav |
|------------|------|
| Art Direction (Art Bible, World Identity, ADR-A01) | ✅ |
| Map 01 Design Bible | ✅ |
| Spatial Design | ✅ |
| Landscape Layout (Varianta A) | ✅ |
| View Composition | ✅ |
| Master Plan | ✅ |
| Agricultural Master Plan | ✅ |
| References architektura | ✅ (obsah TBD) |
| **Další krok** | **Phase 13 — FarmOS World Editor** |

---

## Související dokumenty

- [Map_01_Design_Bible.md](Map_01_Design_Bible.md)
- [Map_01_Spatial_Design.md](Map_01_Spatial_Design.md)
- [Map_01_Landscape_Layout.md](Map_01_Landscape_Layout.md)
- [Map_01_View_Composition.md](Map_01_View_Composition.md)
- [Map_01_Agricultural_Master_Plan.md](Map_01_Agricultural_Master_Plan.md)
- [Map_01_References/README.md](Map_01_References/README.md)
- [Maps README](../README.md)
- [Map_Design_Principles.md](../00_Map_Guidelines/Map_Design_Principles.md)
