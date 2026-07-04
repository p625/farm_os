# Map 01 — Field Layout

## Agricultural Parcel Design

| | |
|--|--|
| **Verze** | v1.0.0 |
| **Status** | Approved |
| **Typ** | Field Layout / Parcel Design |
| **Vlastník** | Level Design Director |
| **Backup** | World Director, Environment Lead |
| **Review** | Před World Editor a blockout parcel |
| **Poslední změna** | 2026-07-04 |
| **Mapa** | Map 01 — Central Europe (Vertical Slice) |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v1.0.0 | 2026-07-04 | — | Iniciální návrh parcel — uzavření dokumentace Map 01 |

---

## Účel dokumentu

Tento dokument **není seznam polí**. Není CAD výkres. Není implementací.

Definuje, **jak budou jednotlivé zemědělské parcely fungovat jako gameplay prostor** — charakter, pořadí rozvoje, vztahy a zážitek z práce.

> **Jak budou jednotlivé zemědělské parcely fungovat jako gameplay prostor?**

**[RULE]** `Map_01_Field_Layout.md` je **autorita** pro logiku parcel, pořadí rozvoje, charakter jednotlivých polí a gameplay strukturu mapy. **FarmOS World Editor** tato pravidla respektuje. Parcely se **podřizují** [Map_01_Road_Network.md](Map_01_Road_Network.md) — hranice jdou podél field access, ne naopak.

Tento dokument **nemění** uzamčené zdrojové dokumenty. Odvozuje se z Agricultural Master Plan, Road Network, View Composition a Master Plan.

**Neřeší:** implementaci, engine, mesh, kolize, AI, ekonomiku, ceny pozemků, polygonální tvary.

---

## Pozice v produkční řadě

```text
Map_01_Master_Plan
        │
Map_01_Agricultural_Master_Plan
        │
Map_01_Road_Network
        │
Map_01_Field_Layout              ← tento dokument — uzavření návrhu Map 01
        │
Phase 13 — FarmOS World Editor
        │
Blockout → Production
```

**Po schválení tohoto dokumentu je strategická i produkční dokumentace Map 01 uzavřena.** Další změny návrhu parcel probíhají ve World Editoru nebo novým ADR.

---

## Závazné zdroje

| Dokument | Co Field Layout přebírá |
|----------|-------------------------|
| [Map_01_Road_Network](Map_01_Road_Network.md) | Field access A/B/C, tire logic, hranice u cest |
| [Map_01_Agricultural_Master_Plan](Map_01_Agricultural_Master_Plan.md) | Bloky A/B/C, zóny vlivu, AC/AA, remízky |
| [Map_01_View_Composition](Map_01_View_Composition.md) | HV-02, HV-06, CM-03, farming views |
| [Map_01_Landscape_Layout](Map_01_Landscape_Layout.md) | Makro bloky, remízky mezi bloky |

---

## 1. Parcel Design Philosophy

Pole v FarmOS nejsou barevné plochy na mapě — jsou **místem práce a součástí krajiny**.

| Princip | Význam |
|---------|--------|
| **Přirozené tvary** | Hranice sledují terén, remízky a historii hospodaření — ne ideální obdélníky z CAD |
| **Čitelnost** | Z management výšky okamžitě rozpoznatelné: které pole, jaký stav, kde hranice |
| **Realistické hospodaření** | Velikost a tvar odpovídají konvenčnímu středoevropskému statku — blok lze obsloužit technikou |
| **Vizuální pestrost** | Střídání velikostí, orientací a okrajů — žádné dvě identická pole |
| **Různé pracovní zkušenosti** | Každá parcela nabízí jiný rytmus jízdy, jinou kompozici, jinou fázi rozvoje farmy |
| **Kurátorství** | Realita s idealizací — chaos hranic je redukován, logika zůstává |

### Rozhodovací test parcely

> *„Pozná hráč toto pole po desíti hodinách — a chce na něm pracovat znovu?"*

Pokud je pole zaměnitelné s vedlejším bez důsledku — návrh selhává.

---

## 2. Farming Blocks

Tři hlavní bloky odpovídají [Agricultural Master Plan — Farming Regions](Map_01_Agricultural_Master_Plan.md#2-farming-regions) a [Landscape Layout — Pole](Map_01_Landscape_Layout.md#pole).

```text
                    [BLOCK C — protější svah]
                              │
                    [ŘEKA / niva / louky]
                              │
              [BLOCK B — údolní velké pole]
                              │
              [BLOCK A — farma a návrší]
                    [FARMA]
```

| Blok | Zóna | Poloha logická | Role |
|------|------|----------------|------|
| **Block A** | I | Návrší kolem farmy | Start, denní práce, učení |
| **Block B** | II | Sestup k řece | Produktivní jádro, panorama, sklizeň |
| **Block C** | III | Za řekou pod vesnicí | Expanze, hloubka, dlouhodobý cíl |

**Louky a pastviny** nejsou orná parcely — samostatná kategorie **M** (meadow); viz sekce Parcel Relationships.

---

## 3. Individual Parcels

Logické parcely **bez geometrie** — World Editor je realizuje podle těchto pravidel.

### Block A — „Dvůr a návrší"

| ID | Název | Charakter | Obtížnost | Vizuální identita | Vztah k okolí |
|----|-------|-----------|-----------|-------------------|---------------|
| **A-01** | Domácí pole | Kompaktní, nejblíže silu; mírný sklon k údolí | Nízká | Ornice u dvora; stroje viditelné z farmy | Farma, farm roads, HV-01 |
| **A-02** | Pole u rybníka | Menší; okraj lemovaný vegetací u vody | Nízká | Voda v periférii záběru; klidnější textura | Rybník, service track; HV-05 periferně |
| **A-03** | Přední svah | Střední plocha; členitější okraj u remízky | Střední | První „velký" dojem z návrší směrem k B | Remízek směrem k B; sightline V1 |

**Logika bloku A:** tři parcely různé velikosti — učí hráče číst hranice bez přetížení. Celý blok A je **jeden souvislý orný celek** rozdělený remízkou a farm road, ne izolované ostrovy.

---

### Block B — „Velké pole"

| ID | Název | Charakter | Obtížnost | Vizuální identita | Vztah k okolí |
|----|-------|-----------|-----------|-------------------|---------------|
| **B-01** | Horní lán | Širší, mírnější sklon; dlouhé souvislé jízdy | Střední | Negative space; zlaté obilí v létě — **HV-02, HV-06** | Field access z údolí (RN-03); remízek k A |
| **B-02** | Dolní lán | K řece; mírný svah; kratší pracovní úseky | Vyšší | Řeka v periférii; hloubka krajiny | Ochranný pás u vody; louka v nivě |
| **B-03** | Lán za cestou | Rozdělen field access B — práce kolem komunikace | Střední | Světlá linie cesty v tmavé ornici | Primary / field access v údolí; CM-03 odvoz |

**Logika bloku B:** hero produkční prostor mapy. B-01 nese sklizeň a screenshoty; B-02 přidává výzvu svahu; B-03 variuje machinery experience kolem cesty.

**Rozhodnutí RN-03 (uzamčeno):** Block B je obsluhován **primárně field access z primary v údolí** (hlavní trasa sklizně a CM-03). **Krátké napojení z A** přes remízek u A-03 — headland pro drobnou práci, ne plnohodnotná druhá silnice (vyhýbáme RN-AP09).

---

### Block C — „Za řekou"

| ID | Název | Charakter | Obtížnost | Vizuální identita | Vztah k okolí |
|----|-------|-----------|-----------|-------------------|---------------|
| **C-01** | Svah pod vesnicí | Menší; nepravidelnější okraj u svahu | Střední | Vesnice a kostel na horizontu nad polem — HV-03 | Most + field access C; lesní pás v periférii |
| **C-02** | Loučná mez (volitelná) | Úzký pás mezi C-01 a remízkem — spíše louka než ornice | Nízká | Měkký přechod k lesu | Hranice kotliny |

**Logika bloku C:** vizuální hloubka a expanzní cíl. **AG-01 doporučení:** na startu **sousedovo** (NPC / pronájem později) — hráč vidí pole za řekou, ale vlastní ho až v pokročilé fázi.

---

### Meadow parcels — kategorie M (ne ornice)

| ID | Název | Charakter | Gameplay |
|----|-------|-----------|----------|
| **M-01** | Nivní louka | Podél řeky mezi B a mostem | Senoseč vizuální; ochranný pás — **ne ornice** |
| **M-02** | Přechodová louka | Mezi A a B u remízku | Měkká hranice bloků |
| **M-03** | Louka u potoka | Feeder rybníka | Hydrologie; bez field access skrz |

---

## 4. Ownership Progression

Parcely podporují **přirozený růst farmy** — ne vše najednou.

| Fáze | Parcely | Kategorie | Záměr |
|------|---------|-----------|-------|
| **Počáteční** | A-01, A-02 | Start | Okamžitá práce u dvora; nácvik managementu |
| **Rozvojová** | A-03, B-01 (část) | Early mid | První větší investice; první sklizeň „velkého" pole |
| **Pokročilá** | B-01 (celé), B-02, B-03 | Mid | Plné využití Block B; CM-03, machinery flow špička |
| **Dlouhodobý cíl** | C-01 | Late | Přechod řeky; nová výzva; expanze statku |

### Principy vlastnictví

1. **Block A** — vždy hráčovo od startu (L07 doporučení: **jen A**, ne A+B na startu).
2. **Block B** — akvizice v průběhu první sezóny / early campaign; B-01 může být částečně dostupné dříve než B-02.
3. **Block C** — pozdní cíl; vyžaduje most a logistiku přes primary.
4. **Louky M** — část může být společná / vesnická; ne blokují progres ornice.

**[RULE]** Progrese sleduje **zóny vlivu** I → II → III — ne náhodný výběr parcel na mapě.

---

## 5. Gameplay Variety

Každá orná parcela nabízí **jiný zážitek** — žádné dvě stejné.

| Parcela | Typ zážitku | Odlišnost |
|---------|-------------|-----------|
| **A-01** | Kompaktní denní práce | Krátké úseky; častý návrat ke silu |
| **A-02** | Práce u vody | Měkké okraje; jiná vegetace v periférii |
| **A-03** | Členitější okraj | Remízek; příprava na větší pole |
| **B-01** | Dlouhé rovné jízdy | Hero sklizeň; minimum otáčení |
| **B-02** | Svah a kratší pásy | Častější otáčení; pozor na svah |
| **B-03** | Pole rozdělené cestou | Práce kolem překážky; dvě poloviny |
| **C-01** | Nepravidelný tvar | Jiný horizont; vesnice jako rám |

**Vyhnout se:** třem obdélníkům stejné velikosti; symetrickému „šachovnicovému" rozvržení.

---

## 6. Machinery Experience

Rozdíly při práci **bez konkrétních strojů** — délka úseku, otáčení, překážky, svah.

| Parcela | Jízda | Otáčení | Překážky | Svah |
|---------|-------|---------|----------|------|
| **A-01** | Krátká | Častá u sila | Dvůr v blízkosti | Minimální |
| **A-02** | Krátká | Střední | Vegetace u rybníka | Mírný |
| **A-03** | Střední | Střední | Remízek na jedné straně | Mírný sestup |
| **B-01** | **Dlouhá** | Řídká | Žádné — otevřený lán | Mírný |
| **B-02** | Střední | Častější | Ochranný pás u řeky | **Výraznější** |
| **B-03** | Střední | U cesty | **Field access** dělí parcelu | Mírný |
| **C-01** | Střední | Nepravidelná | Svah pod vesnicí | Střední |

### Principy

- **Sklizeň B-01** = nejuspokojivější dlouhé úseky (farming view z View Composition).
- **A-01** = učící prostor — chyby jsou blízko domova.
- **Těžká technika** nikdy přes M-03 mokřad ani remízek bez cesty (AC-10).

---

## 7. Visual Composition

Pole jsou **součást kompozice** — ne jen gameplay grid.

| Aspekt | Aplikace Map 01 |
|--------|-----------------|
| **Směr linií** | Ornice v A směřuje k údolí; B-01 vede oko k horizontu a vesnici (HV-01, HV-02) |
| **Rytmus** | Střídání A (menší pásy) → B (velká plocha) → remízek → louka → řeka |
| **Horizont** | B-01 a B-02 nesou pohled na vesnici a kostel — nesmí jednotvárně zakrýt |
| **Pohledy z kamery** | A v HV-01; B v HV-02/06; C v HV-03 periferně |
| **Sezónní změny** | Zima: remízky a les nesou strukturu když ornice holá; B-01 struktura z cesty B-03 |

### Kompoziční pravidla parcel

1. **Největší plocha (B-01)** směřuje k **negative space** a obloze — ne k lesu.
2. **Remízky** jsou viditelné v záběru jako tmavé linie — ne skryté za UI.
3. **Žádná parcela** nesmí v CM-01 zcela zakrýt siluetu farmy.

---

## 8. Parcel Relationships

Jak parcely **na sebe navazují** — topologie, ne souřadnice.

```text
[A-01]──farm road──[FARMA]──farm road──[A-02]
   │                                      │
   └──── remízek ──── [A-03] ─── remízek ─┘
                           │
                      remízek
                           │
              [B-03]──field access B──[B-01]
                 │                      │
            primary v údolí          [B-02]──ochranný pás──[M-01]──řeka
                                                    │
                                                 [most]
                                                    │
                                              [C-01]──remízek──les
```

| Vztah | Příklad |
|-------|---------|
| **Přes remízek** | A-03 ↔ B-01; C-01 ↔ les |
| **Přes cestu** | B-03 rozdělena field access B |
| **Přes louku** | B-02 ↔ M-01 ↔ řeka |
| **Přes potok** | M-03 mezi A a rybníkem — louka, ne ornice |
| **Přes alej** | Primary podél B — scenic, ne hranice parcely |

**[RULE]** Orná parcela **nikdy nesousedí** s řekou bez ochranného pásu (M-01) nebo louky.

---

## 9. Future Expansion

Přidávání parcel **bez narušení logiky**.

| Expanze | Princip |
|---------|---------|
| **Nová parcela v A** | Pouze zmenšením louky M-02 — ne přes les |
| **Rozšíření B** | Spojení s periferní loukou — nový remízek povinný |
| **Nový blok D** | Za lesním hřebenem nebo u samoty — vlastní field access ze secondary |
| **Nová farma (DLC)** | Vlastní blok A′ — nesmí sdílet silo bez logiky |
| **C-02 jako ornice** | Pouze pokud C-01 plně obsazeno a hráč v late game |

World Editor musí validovat novou parcelu proti AC/FL-AP a Road Network.

---

## 10. Agricultural Constraints

Závazná pravidla — rozšíření AC z Agricultural Master Plan.

| ID | Pravidlo |
|----|----------|
| **FL-01** | Žádné izolované pole — každá parcela souvisí s blokem a field access |
| **FL-02** | Každá orná parcela má logický přístup z Road Network |
| **FL-03** | Remízky mají ekologickou i hranicovou funkci — ne čistá dekorace |
| **FL-04** | Ochranný pás u vody — M-01 mezi B-02 a řekou |
| **FL-05** | Návaznost na Road Network — hranice podél cest, ne cesty podle náhodných hranic |
| **FL-06** | Louky v nivě nejsou ornice bez ADR |
| **FL-07** | Les nelze orat — hranice parcely u lesa = remízek |
| **FL-08** | Block B přístupný z údolí — tire logic |
| **FL-09** | Block C přístupný jen z mostní strany |
| **FL-10** | Počet parcel v bloku ≤ 4 — čitelnost z výšky |

---

## 11. Parcel Anti-Patterns

| ID | Anti-pattern | Proč |
|----|--------------|------|
| **FL-AP01** | Všechna pole stejně velká | Monotónní gameplay i vizuál (NV-04) |
| **FL-AP02** | Všechny tvary obdélník se stejnou orientací | Šachovnice; únava |
| **FL-AP03** | Pole bez přístupu | AA-01 |
| **FL-AP04** | Remízek bez vlivu na hranici | Porušuje FL-03 |
| **FL-AP05** | Nelogická hranice přes svah | Ornice v zátopové zóně |
| **FL-AP06** | Parcela uprostřed lesa | AA-02 |
| **FL-AP07** | Příliš mnoho malých parcel v B | Ztráta HV-02 negative space |
| **FL-AP08** | Ornice až k břehu řeky | FL-04, NV |
| **FL-AP09** | Symetrie kolem farmy | Nepřirozené; modelářský dojem |
| **FL-AP10** | Parcela bez vizuální identity | Zaměnitelná s jinou |

---

## 12. Review Checklist

### Charakter a gameplay

- [ ] Má **každá orná parcela** vlastní charakter?
- [ ] Podporuje **gameplay variety** — různé délky jízd, svahy, překážky?
- [ ] **Ownership progression** je čitelná I → II → III?

### Kompozice a dokumentace

- [ ] Podporuje **View Composition** (HV-01–06, CM-03)?
- [ ] Odpovídá **Agricultural Master Plan** (bloky, zóny, AC)?
- [ ] **Navazuje na Road Network** — field access A/B/C respektovány?
- [ ] **RN-03** uzamčeno — B z údolí + headland z A?

### Rozmanitost a budoucnost

- [ ] Nabízí **rozmanitost** bez chaosu?
- [ ] Podporuje **budoucí rozšíření** (sekce 9)?
- [ ] Žádný **FL-AP01–10**?

### World Editor readiness

- [ ] Každá parcela má ID, blok, fázi vlastnictví, charakter?
- [ ] Louky M odděleny od ornice?
- [ ] Pravidla validovatelná jako constraints ve editoru?

---

## Schéma parcel (konceptuální)

```text
         [C-01]     [vesnice]
            \         |
    [M-01]─[B-02]─[řeka]─[most]
              \     |
         [B-03]─[B-01]  ← velké pole / HV-06
              \   /
           remízek
              |
    [A-03]─[A-01]─[FARMA]─[A-02]─[rybník]
```

---

## Otevřená rozhodnutí (minimální)

| ID | Stav | Poznámka |
|----|------|----------|
| **RN-03** | ✅ Uzamčeno | B primárně z údolí; headland A-03 → B |
| **AG-01** | Doporučeno | C-01 sousedovo na startu — Game Design potvrdí |
| **L07** | Doporučeno | Start jen Block A — Game Design potvrdí |
| **AG-02** | Otevřeno | Dominantní plodina B-01 — Vegetation / World Editor |
| **FL-O01** | Otevřeno | C-02 jako louka vs. budoucí ornice — late game |

**Uzamčeno tímto dokumentem:** parcelní struktura A/B/C/M; ownership progression; RN-03; FL-01–10; FL-AP01–10; podřízenost Road Network.

---

## Shrnutí

### 1. Proč je tento dokument posledním návrhovým dokumentem Map 01

Všechny vyšší vrstvy — identita, prostor, krajina, kamera, hospodaření, pohyb — jsou uzamčeny. Field Layout je **první dokument, který pojmenovává konkrétní gameplay prostory** (parcely), ale stále bez geometrie a implementace. Po něm už návrh nepotřebuje další vrstvu dokumentů — potřebuje **nástroj a prostor**.

### 2. Jak pomůže při tvorbě World Editoru

Editor dostane validovatelná pravidla: ID parcel, bloky, fáze vlastnictví, constraints FL-01–10, vazbu na field access, zákaz FL-AP. Uživatel editoru **nekreslí náhodné polygony** — umisťuje parcely do schválených bloků s automatickou kontrolou proti Road Network a Agricultural Master Plan.

### 3. Jak budou pravidla využita při blockoutu

Greybox: nejdřív cesty (Road Network), poté **hrubé obrysy parcel** podle schématu výše — barvy per blok, remízky jako pruhy, louky M jako jiná textura. Test CM-03 na B-01, HV-01 na A, tire logic průjezdu. Jemná geometrie až ve World Editoru.

### 4. Co se už pouze upravuje ve World Editoru (ne v dokumentaci)

- Přesné tvary a velikosti parcel v rámci schválených bloků.
- Umístění remízků na hranicích (počet v limitu FL-10).
- Volba plodiny per parcela (AG-02).
- Drobné posuny hranic u terénu po blockoutu.
- C-02 aktivace jako ornice v late game (FL-O01).

Změna počtu parcel, nového bloku nebo přístupové logiky = **ADR + revize tohoto dokumentu**.

### 5. Další fáze projektu

**Potvrzeno: další fáze projektu je Phase 13 — FarmOS World Editor.**

Interní nástroj pro vizuální tvorbu a úpravu map respektující pravidla celé dokumentační řady Map 01 a umožňující převod návrhů do první hratelné verze mapy. Po World Editoru následuje blockout parcel v nástroji a produkce assetů (POI, Vegetation, Lighting dle potřeby implementace).

---

## Dokumentační balíček Map 01 — uzavřen

| # | Dokument | Stav |
|---|----------|------|
| 1 | Design Bible | Approved |
| 2 | Spatial Design | Approved |
| 3 | Landscape Layout | Approved |
| 4 | View Composition | Approved |
| 5 | Master Plan | Approved |
| 6 | Agricultural Master Plan | Approved |
| 7 | Road Network | Approved |
| 8 | **Field Layout** | **Approved** |

**Strategická i produkční dokumentace první mapy je uzavřena.**

---

## Související dokumenty

- [Map_01_Road_Network.md](Map_01_Road_Network.md)
- [Map_01_Agricultural_Master_Plan.md](Map_01_Agricultural_Master_Plan.md)
- [Map_01_Master_Plan.md](Map_01_Master_Plan.md)
- [Map_01_View_Composition.md](Map_01_View_Composition.md)
- [Map_01_References/Fields/](../Map_01_References/README.md)
- [Maps README](../README.md)
