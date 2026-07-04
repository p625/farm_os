# Map 01 — Agricultural Master Plan

## Agricultural Logic

| | |
|--|--|
| **Verze** | v1.0.0 |
| **Status** | Approved |
| **Typ** | Agricultural Master Plan / Farming Landscape Logic |
| **Vlastník** | World Director |
| **Backup** | Environment Lead, Level Design Director |
| **Review** | Před Road Network a Field Layout |
| **Poslední změna** | 2026-07-04 |
| **Mapa** | Map 01 — Central Europe (Vertical Slice) |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v1.0.0 | 2026-07-04 | — | Iniciální zemědělská logika Map 01 |

---

## Účel dokumentu

Tento dokument definuje **zemědělskou logiku Map 01** — jak krajina funguje jako skutečný hospodářský celek.

Neřeší jednotlivá pole, konkrétní cesty, čísla parcel ani implementaci. Odpovídá na otázku:

> **Jak tato krajina funguje jako skutečný zemědělský celek?**

**[RULE]** `Map_01_Agricultural_Master_Plan.md` je **jediná autorita** pro zemědělskou logiku mapy, vztahy mezi hospodářskými oblastmi, pohyb techniky na makro úrovni a vazbu mezi krajinou a zemědělstvím. Road Network a Field Layout tyto principy **nesmí měnit** — pouze je realizovat.

Tento dokument **nemění** obsah schválených zdrojových dokumentů. Odvozuje se z [Map_01_Master_Plan.md](Map_01_Master_Plan.md) a předcházející řady.

**Neřeší:** engine, optimalizaci, AI, ekonomiku, konkrétní plodiny na jednotlivých polích, rozmístění jednotlivých stromů.

---

## Pozice v produkční řadě

```text
Map_01_Master_Plan
        │
        ▼
Map_01_Agricultural_Master_Plan      ← tento dokument
        │
        ▼
Map_01_Road_Network
        │
        ▼
Map_01_Field_Layout
        │
        ▼
Drainage · Farm Infrastructure
        │
        ▼
Map_01_POI_Guide · Vegetation
        │
        ▼
Lighting · Asset List
```

---

## 1. Agricultural Vision

Map 01 představuje **konvenční středoevropské zemědělství** v kulturní krajině — typ hospodaření, který hráč zná z reálného venkova mezi nížinou a podhůřím, ale kurátorovaný pro čitelnost a klid FarmOS.

| Princip | Map 01 |
|---------|--------|
| **Typ hospodaření** | Konvenční — obilí, řepka, kukuřice, louky, pastviny; bez exotických forem |
| **Mechanizace** | Běžná moderní technika — traktory, kombajny, návěsy; žádný muzejní provoz jako default |
| **Velikost hospodářství** | Realistický středoevropský statek — jedna hlavní farma s několika většími bloky polí; ne agroholding, ne chalupářský pozemek |
| **Charakter krajiny** | Pracující krajina — většina plochy je obhospodařovaná nebo historicky zemědělská |
| **Kurátorství** | Realita s idealizací — logika hospodaření je věrohodná, chaos je redukován |

**Vyloučeno:** vinice, olivové háje, intenzivní skleníky, průmyslové areály, solární farmy jako dominantu, tropické plodiny, organické minifarmy jako jediný model.

**Citovatelná věta:**

> *Map 01 je středoevropský statek na návrší — konvenční, mechanizovaný, čitelný z výšky a věrohodný jako místo, kde lidé skutečně hospodařili generace.*

---

## 2. Farming Regions

Mapa je rozdělena na **logické hospodářské oblasti** — ne parcely, ne souřadnice. Každá oblast má důvod existovat a jinou intenzitu obhospodařování.

```text
                    [PERIFERNÍ LES — hřeben]
                              │
         [VZDÁLENÉ POLE C] — [VESNICKÁ KRAJINA]
                              │
              [ŘÍČNÍ NIVA + LOUKY] — údolí
                     /              \
        [PRODUKČNÍ POLE B]    [MOST / PŘECHOD]
               \                    /
                [CENTRÁLNÍ OBLAST — farma + pole A]
                        │
                [PŘÍJEZDOVÁ KRAJINA — silnice ven]
```

### Regiony

| Region | Poloha (logická) | Funkce | Intenzita |
|--------|------------------|--------|-----------|
| **Centrální produkční oblast** | Návrší kolem farmy | Jádro hospodaření — pole A, dvůr, silo, rybník | Nejvyšší |
| **Jižní / údolní pole** | Sestup k řece — blok B | Velká orná plocha; sklizeň, panorama, expanze | Vysoká |
| **Říční niva** | Údolí podél toku | Louky, mokřady, ochranné pásy; méně ornice | Nízká–střední |
| **Protější svah** | Za řekou pod vesnicí — blok C | Vzdálenější orná půda; vizuální hloubka; nemusí být hráčova na startu | Střední |
| **Louky a pastviny** | Podél toků, na svazích, mezi poli | Travní porost; přechod pole–voda–les | Nízká |
| **Okrajové lesní hospodářství** | Hřeben, boční pás, remízky | Hospodářský les, aleje, ochranné pásy | Nízká (les) |
| **Vesnická krajina** | Hřeben nad údolím | Zástavba, zahrady, ne orná dominance | Minimální ornice |
| **Příjezdová krajina** | Za farmou směrem ven z mapy | Spojení s větším světem; servisní přístup | Infrastrukturní |

**[RULE]** Orná půda dominuje v **centru a údolí**; les a louka **rámuje a člení** — nikdy naopak.

---

## 3. Farm Influence Radius

Vztah farmy k okolní krajině — tři zóny vlivu bez metrů, pouze princip.

### Zóna I — Jádro hospodaření

**Nejintenzivněji obhospodařovaná oblast.**

- Hlavní farma, dvůr, silo, stodoly.
- Pole A — bezprostřední orná půda statku.
- Rybník v dosahu servisu farmy.
- Nejvyšší frekvence pohybu techniky; nejvyšší vizuální detail wear.

*Hráč zde tráví většinu času. Vše musí působit jako „moje".*

### Zóna II — Běžně obsluhovaná oblast

**Pravidelná produkční zóna ve vzdálenosti jedné pracovní směny.**

- Pole B — velký blok k údolí.
- Polní cesty z farmy k blokům A a B.
- Louky v bezprostřední blízkosti polí (seno, ochranné pásy).
- Odvoz ke silu, příprava půdy, sklizeň — hlavní sezónní provoz.

*Technika zde je normální, ne výjimečná. Krajina vypadá obhospodařovaně.*

### Zóna III — Vzdálenější hospodářské plochy

**Příležitostná nebo sousední obhospodařování.**

- Pole C za řekou — může patřit jinému hospodářství nebo být expanzní.
- Samoty — vlastní malé hospodaření.
- Vesnické zahrady a louky — ne intenzivní ornice.
- Lesní okraje — těžba, ale ne pole.

*Méně stop techniky. Krajina je čitelná jako „okolí", ne jako denní práce hráče — pokud hráč nevlastní blok C.*

**[RULE]** Hlavní farma zůstává **přirozeným centrem** všech tří zón — i Zóna III je orientována vůči farmě (sightline V6, odvoz domů).

---

## 4. Agricultural Connectivity

Jak spolu jednotlivé části krajiny **přirozeně fungují** — systémové vazby, ne cesty.

| Vazba | Logika |
|-------|--------|
| **Farma ↔ pole** | Farma je uprostřed svých polí, ne izolovaná za lesem. Pole A obklopuje dvůr; pole B je v logickém sestupu terénu k vodě. |
| **Farma ↔ silo / sklad** | Logistický uzel na dvoře — sklizeň končí zde; odvoz z polí směřuje domů. |
| **Pole ↔ louky** | Louky na místech nevhodných pro intenzivní ornici — svahy, nivy, přechody k vodě. |
| **Pole ↔ les** | Les neprostupuje ornici; remízky a aleje tvoří měkkou hranici. Les na hřebeni = hranice kotliny, ne překážka uprostřed pole. |
| **Pole ↔ voda** | Řeka a potoky odvádějí vodu z kotliny; louky v nivě; ornice na vyšších, lépe odvodněných místech. |
| **Farma ↔ rybník** | Rybník v dosahu servisu — napájení, údržba, případný chov; vizuálně patří k statku. |
| **Farma ↔ vesnice** | Sousední komunita — společná silnice III. třídy, ne společný dvůr. Vesnice nekonkuruje farmě o ornou půdu v údolí. |
| **Vesnice ↔ pole C** | Vesnice na svahu nad menším polem — historicky logické osídlení s výhledem na údolí. |
| **Celá mapa ↔ svět ven** | Silnice za farmou = napojení na region mimo mapu; sklizeň a zásoby mají kam proudit. |

### Systémový princip

```text
VODA (údolí) → strukturuje reliéf a louky
RELIÉF (návrší) → určuje polohu farmy a odtok
FARMA (návrší) → gravitace hospodaření
POLE (kolem farmy) → produkce
LES (hřeben) → hranice a remízky
VESNICE (hřeben) → kulturní kontext
```

---

## 5. Machinery Flow

Přirozené **pohybové trasy zemědělské techniky** na makro úrovni — ne konkrétní cesty (to bude Road Network).

### Hlavní směry

| Směr | Aktivita | Sezónní zátěž |
|------|----------|---------------|
| **Dvůr → pole A** | Denní práce, příprava, menší operace | Celoroční — vysoká |
| **Dvůr → pole B** | Orba, setí, sklizeň velkého bloku | Jaro–podzim — velmi vysoká |
| **Pole B → dvůr / silo** | Odvoz sklizně | Léto–podzim — špička |
| **Dvůr → louky** | Senoseč (vizuální), příležitná údržba | Léto |
| **Dvůr → řeka / most** | Přechod k poli C, sousední práce | Střední |
| **Silnice ven → dvůr** | Dodávky, odvoz komodity mimo mapu | Občasná |

### Principy toku

1. **Vše začíná a končí na dvoře** — farma je logistický hub.
2. **Hlavní osa polí** sleduje **kontury svahu** k údolí — stroj nejezdí kolmo svahem bez důvodu.
3. **Sklizeň plyne od periferie pole k odvozu** — ne náhodně přes celou mapu.
4. **Těžká technika preferuje silnici III. třídy a polní cesty** — ne lesní stezky.
5. **Sezónní špička** — jaro (ornice, setí) a léto–podzim (sklizeň) zatěžují trasu dvůr ↔ pole B nejvíc; zima = minimum pohybu, stopy ve sněhu volitelně.

### Tire logic (koncept)

```text
[Silnice ven] ──→ [FARMA / dvůr] ──→ [Pole A]
                         │
                         ├──→ [Pole B] ──→ [odvoz zpět]
                         │
                         ├──→ [Rybník] (servis)
                         │
                         └──→ [Silnice k mostu] ──→ [Pole C / vesnice]
```

**[RULE]** Road Network musí tyto směry **podporovat**, ne protiřečit. Každá hlavní trasa má zemědělský důvod.

---

## 6. Water & Agriculture

Voda strukturuje krajinu a **omezuje i umožňuje** hospodaření.

| Prvek | Zemědělská funkce | Vliv na layout |
|-------|-------------------|----------------|
| **Řeka** | Hlavní odtok kotliny; hranice mezi bloky; napájení nivních luk | Ornice nad nivou; louky v údolí; most jako nutný přechod |
| **Rybník** | Retence vody; chov / okrasná funkce; mikroklima u farmy | U farmy na návrší nebo patě; napájen potokem shora |
| **Potoky** | Feeder řeky a rybníka; odvodnění polí; koryto v loukách | Klikatí mezi loukami — ne přímý řez ornice |
| **Mokřady** | Přirozená retence u vtoků; ochrana biodiverzity; **ne ornice** | U vtoků do řeky; rákosí; vizuální autenticita |

### Hydrologická logika (kvalitativní)

```text
Vyšší terén (farma, pole A)
        ↓ odtok
Potok → rybník → potok → louky v nivě → řeka v údolí → mimo mapu
```

**Principy:**

- Ornice na **svahu a návrší** — lépe odvodněná půda.
- Louky a mokřady v **nížinách** — voda přirozeně končí.
- Řeka je **přirozená hranice** mezi intenzivnější a vzdálenější ornou půdou (blok B vs. blok C).
- Voda **nikdy neblokuje** logiku farmy — most a brody jsou součást systému, ne výjimka.

**Drainage** (budoucí dokument) rozpracuje odtok z polí do potoků — musí vycházet z této hydrologie.

---

## 7. Landscape Productivity

Proč je každá část krajiny tím, čím je — **logika produktivity**, ne náhodný land use.

| Typ půdy | Proč zde | Proč ne jinak |
|----------|----------|---------------|
| **Ornice — pole A** | Blízkost farmy, rovnější půda na návrší, denní obsluha | Příliš daleko = nelogické pro jádro statku |
| **Ornice — pole B** | Velký souvislý blok na svažitější půdě směrem k údolí; ideální pro mechanizaci | Příliš malé = neefektivní pro konvenční hospodaření |
| **Ornice — pole C** | Menší blok za řekou; historicky osídlený svah; expanzní potenciál | Uprostřed lesa = nelogické |
| **Louky** | Nivy, svahy, přechody; seno; méně vhodná ornice | Uprostřed nejlepší ornice = plýtvání a nelogičnost |
| **Pastviny** | Méně intenzivní travní porost; vizuálně odlišné od ornice | Místo pole B = ztráta produkční identity |
| **Les — hřeben** | Hranice kotliny; hospodářský les; ochrana svahů | Uprostřed údolí = blokace hospodaření |
| **Remízky** | Ekologický pás, vítr, členění monotónní ornice, orientace | Bez remízků = únava krajiny i hráče |
| **Ochranné pásy** | Podél vodních toků — eroze, zákonný i vizuální standard | Ornice až k břehu = nepravděpodobné a špatné pro screenshoty |
| **Zástavba** | Farma a vesnice na vyšších místech — suché, historické | Uprostřed nivy = záplavové riziko, nelogické |

**Poměry** (orientačně z Design Bible): ornice ~45–55 %, louky ~10–15 %, les a remízky ~20–25 %, voda ~3–5 %.

---

## 8. Seasonal Agricultural Cycle

Jak se krajina **mění během roku** — vizuální a funkční změny, ne kalendář.

| Fáze | Krajina | Zemědělská aktivita (vizuální) | Kompoziční poznámka |
|------|---------|-------------------------------|---------------------|
| **Jaro** | Svěží zeleň, tmavá ornice, začátek růstu | Orba, setí — stopy na poli | Čitelnost stavů pole prioritní; CM-01 musí fungovat |
| **Léto** | Plná zeleň nebo zlaté obilí; teplé světlo | Růst, příprava sklizně, seno na loukách | **Referenční etalon** — HV-01, HV-06 |
| **Sklizeň** | Zlatá / žlutá pole; prach za strojem | Kombajn, odvoz — špička machinery flow | CM-03; nejvyšší vizuální odměna cyklu |
| **Podzim** | Strniště, řepka žlutá, listí v remízkách | Ornice po sklizni, setí ozimů | Kontrast bez chaosu |
| **Zima** | Sníh, holá struktura, kouř z komína | Minimum pohybu; struktura z remízků a lesů | Horizont a siluety důležitější než barva; CM-06 |

### Principy sezónnosti

1. **Kompozice zůstává** — dominanty (farma, vesnice, řeka) se nemění; mění se barva a vegetace.
2. **Zima nesmí zničit čitelnost** — remízky a lesní pásy nesou strukturu polí.
3. **Sklizeň je vrchol cyklu** — krajina musí vypadat odměňující, ne vyčerpaná.
4. **Louky a les** moderují sezónní extrémy — zelené pásy mezi holými poli v zimě.

---

## 9. Expansion Strategy

Jak může mapa **růst** — principy, ne konkrétní DLC plány.

| Směr expanze | Princip | Logická návaznost |
|--------------|---------|-------------------|
| **Nová pole** | Rozšíření do Zóny III — pole C, periferní bloky | Vyžaduje přístup z existující silniční sítě; nesmí prolétnout les nebo řeku bez mostu |
| **Další farmy** | Samoty jako budoucí hráčské nebo NPC statky | Už připravené v layoutu (1–3 samoty); vlastní malé pole a dvůr |
| **Nové hospodářské oblasti** | Za horizontem nebo za řekou — mimo aktuální Zónu II | Silnice ven z mapy jako narrative hook |
| **Infrastruktura** | Nové silo, hangár, biogas — na dvoře nebo periferii farmy | Musí sedět na machinery flow |
| **Budoucí mapy / DLC** | Nová kotlinová krajina se stejným jazykem — návrší–údolí–horizont | Map 01 jako etalon; expanze ne porušení identity |

**[RULE]** Expanze **respektuje hydrologii a zóny vlivu** — nelze „koupit" les a proměnit v pole bez ADR a revize Agricultural Master Plan.

---

## 10. Agricultural Constraints

Závazná omezení pro všechny produkční dokumenty.

| ID | Omezení |
|----|---------|
| **AC-01** | Les nelze bezdůvodně měnit na ornici — remízky ano, lesní masiv ne |
| **AC-02** | Voda tvoří přirozenou hranici — ornice ne v nivě bez odvodnění |
| **AC-03** | Remízky mají ekologickou i vizuální funkci — nelze odstranit pro „větší pole" |
| **AC-04** | Hlavní farma zůstává přirozeným centrem hospodaření — nelze přesunout do periferie |
| **AC-05** | Každé pole musí mít logický přístup pro techniku — izolované parcely zakázány |
| **AC-06** | Vesnice neexpanduje do ornice údolí — zástavba na hřebeni |
| **AC-07** | Rybník patří k systému farmy — nesmí být izolovaný bez vztahu k dvoru |
| **AC-08** | Hospodářské budovy musí mít vazbu na provoz — silo u dvora, ne uprostřed pole C |
| **AC-09** | Konvenční zemědělství — žádné exotické plodiny jako dominantní identita |
| **AC-10** | Machinery flow nesmí protínat remízek bez polní cesty — technika potřebuje prostor |

---

## 11. Agricultural Anti-Patterns

Čemu se návrh **musí vyhnout** — zemědělská varianta spatial a view anti-patterns.

| ID | Anti-pattern | Proč | Mitigace |
|----|--------------|------|----------|
| **AA-01** | Pole bez logického přístupu | Porušuje konvenční hospodaření | Road Network — každý blok A/B/C má cestu |
| **AA-02** | Izolované parcely obklopené lesem | Nelze obsloužit technikou | Field Layout — souvislé bloky |
| **AA-03** | Náhodně rozmístěné louky | Působí jako dekorace | Louky v nivách a na svazích dle produktivity |
| **AA-04** | Cesty vedoucí nikam | Porušuje důvěru (NV-02) | Tire logic — každá cesta má cíl |
| **AA-05** | Hospodářské budovy bez vazby na provoz | Nelogický statek | POI Guide — silo u dvora |
| **AA-06** | Vodní prvky bez významu | Dekorativní rybníček | Hydrologická logika — feeder, odtok |
| **AA-07** | Ornice v zátopové zóně | Nepravděpodobné | Louky v nivě, pole nad ní |
| **AA-08** | Monokultura bez hranic | Únava krajiny (NV-04) | Remízky, střídání bloků A/B/C |
| **AA-09** | Technika přes les bez cesty | Nelogický provoz | Machinery flow — les = komprese, ne zkratka |
| **AA-10** | Vesnice uprostřed nejlepší ornice | Město vs. farma konflikt | Vesnice na hřebeni, pole v údolí |
| **AA-11** | Rybník bez vztahu k farmě | Ztráta AC-07 | Rybník v Zóně I |
| **AA-12** | Sklizeň vyžadující jinou kameru | Porušuje View Composition | Pole layout pro isometric farming views |

---

## 12. Agricultural Review Checklist

Kontrolní seznam před schválením Road Network, Field Layout a blockoutu.

### Celkový dojem

- [ ] Působí krajina jako **fungující hospodářský celek**?
- [ ] Lze bez vysvětlení pochopit, kde je statek, kde se pěstuje a kde končí ornice?
- [ ] Odpovídá to **World Identity Statement** — klid, prostor, věrohodná práce?

### Vazby

- [ ] Jsou vazby **farma ↔ pole ↔ silo** logické?
- [ ] Má voda **skutečnou funkci** — odtok, hranice, louky?
- [ ] Vesnice a samoty **doplňují**, ne konkurují farmě?

### Čitelnost

- [ ] Jsou hospodářské oblasti **čitelné z management výšky**?
- [ ] Zóny I / II / III jsou rozpoznatelné v chování krajiny?
- [ ] Remízky a louky **člení** bez chaosu?

### Produkční návaznost

- [ ] Podporuje toto rozhodnutí **budoucí Road Network** (tire logic)?
- [ ] Podporuje toto rozhodnutí **budoucí Field Layout** (bloky A/B/C)?
- [ ] Podporuje toto **Drainage** (hydrologická logika)?
- [ ] Podporuje toto **Vegetation** (produktivita per region)?
- [ ] Machinery flow je **kompatibilní** s View Composition farming views?

### Anti-patterns

- [ ] Žádný AA-01 až AA-12 není porušen v makro návrhu?
- [ ] Všechna omezení AC-01 až AC-10 jsou respektována?

---

## Otevřená rozhodnutí (zemědělská)

Rozhodnutí, která Agricultural Master Plan **neuzamyká** — předat produkčním dokumentům.

| ID | Otázka | Riziko | Rozhodne |
|----|--------|--------|----------|
| **AG-01** | Vlastnictví pole C na startu — hráčovo / sousedovo | High | Game Design + Field Layout |
| **AG-02** | Dominantní letní plodina bloku B (obilí / řepka / mix) | Medium | Vegetation, L04/M01-D04 |
| **AG-03** | Rybník — čistě chov / okrasný / kombinace | Low | POI Guide, M01-D06 |
| **AG-04** | Mlýn — funkční součást nebo kulturní POI | Low | POI Guide, M01-D02/L03 |
| **AG-05** | Počet samot a jejich hospodářský rozsah | Low | POI Guide, L02/M01-D03 |
| **AG-06** | Senoseč na loukách — vizuální aktivita ano/ne | Low | Vegetation, Seasonal |
| **AG-07** | Brod vs. druhý most — přístup k poli C | Low | Road Network, L06 |
| **AG-08** | Historická vs. moderní vrstva farmy (poměr budov) | Medium | POI, M01-D05 |

**Uzamčeno tímto dokumentem:** konvenční středoevropské hospodaření; regiony a zóny vlivu; hydrologická logika; machinery flow principy; AC-01–10; AA-01–12; tire logic koncept.

---

## Shrnutí

### 1. Proč je Agricultural Master Plan posledním strategickým dokumentem před produkcí

Art Direction říká *jak má mapa vypadat*. Master Plan říká *co produkovat a v jakém pořadí*. Agricultural Master Plan říká *proč krajina funguje jako zemědělský celek* — bez toho by Road Network a Field Layout mohly být logické z pohledu CAD, ale neuvěřitelné jako hospodaření. Tím se uzavírá fáze návrhu světa.

### 2. Jak pomůže vytvořit uvěřitelnou zemědělskou krajinu

Každý produkční dokument má odpověď na „proč je to tady" — ne jen „kam to patří". Outsource partner vidí, že louka v nivě není náhodná, ale důsledek vody. Level designer ví, že pole B musí mít odvoz ke silu. FarmOS se tak může odlišit od simulátorů, kde je mapa dekorace polí.

### 3. Co je předem rozhodnuté pro Road Network

- Tire logic — hlavní osy dvůr ↔ pole A/B ↔ silnice ↔ most ↔ vesnice.
- Každá cesta má zemědělský cíl (AA-04).
- Těžká technika na silnici III. třídy a polních cestách, ne v lese.
- Příjezdová silnice ven z mapy za farmou.
- Servisní přístup k rybníku.
- Most jako nutný přechod k poli C — ne volitelná dekorace.

### 4. Co vychází přímo z tohoto dokumentu do Field Layout

- Bloky A (Zóna I), B (Zóna II), C (Zóna III) — logika, ne parcely.
- Remízky mezi bloky — povinné (AC-03).
- Louky v nivách a na svazích — ne uprostřed nejlepší ornice.
- Ochranné pásy podél vody.
- Žádné izolované parcely (AA-02).
- Pole sledující kontury svahu k údolí.
- Přístupová logika pro machinery flow per blok.

### 5. Otevřené otázky před blockoutem

- **AG-01** — vlastnictví pole C (ovlivní hráčův dosah a machinery flow).
- **AG-02** — letní plodina bloku B (ovlivní HV-06 a Vegetation).
- **L08** — potvrzení varianty A po blockout review.
- **VC-01/02** — orientace farmy k default kameře (ovlivní umístění budov na dvoře, ne ornici).
- **M01-D07** — ADR-A01 jako franchise standard.

Po uzavření AG-01 a AG-02 lze zahájit Road Network a Field Layout paralelně po schválení tire logic.

---

## Související dokumenty

- [Map_01_Master_Plan.md](Map_01_Master_Plan.md)
- [Map_01_Design_Bible.md](Map_01_Design_Bible.md)
- [Map_01_Landscape_Layout.md](Map_01_Landscape_Layout.md)
- [Map_01_Spatial_Design.md](Map_01_Spatial_Design.md)
- [Map_01_View_Composition.md](Map_01_View_Composition.md)
- [Map_01_Road_Network.md](Map_01_Road_Network.md)
- [Map_01_Field_Layout.md](Map_01_Field_Layout.md)
- [World Identity Statement](../../00_Strategy/World_Identity_Statement.md)
- [Maps README](../README.md)
