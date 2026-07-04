# ADR-A01 — Regionální identita farmy

## Decision Framework

| | |
|--|--|
| **ADR ID** | ADR-A01 |
| **Verze frameworku** | v0.1.0 |
| **Status rozhodnutí** | Proposed — framework připraven, výběr regionu neproveden |
| **Priorita** | **#2 — Fáze 1 Creative Direction (blokující)** |
| **Vlastník procesu** | Art Director |
| **Účastníci rozhodnutí** | Art Director, Environment Lead, Art leads disciplín, Creative Producer |
| **Poslední změna** | 2026-07-04 |
| **Záznam v logu** | [01_ART_DECISION_LOG.md](../01_ART_DECISION_LOG.md#adr-a01--regionální-identita-farmy) |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální Decision Framework — bez výběru regionu |

---

## Jak tento dokument používat

Toto **není** finální rozhodnutí. Je to metodika, podle které bude region vybrán a schválen.

```text
Art Bible (ústava)
       │
       ▼
World Identity Statement — filozofie světa (Vision Lock)
       │
       ▼
ADR-A01 Framework (tento dokument) — kritéria, kandidáti, matice
       │
       ▼
Workshop + bodové hodnocení + otevřené otázky zodpovězeny
       │
       ▼
ADR-A01 Accepted — zápis v Decision Logu
       │
       ▼
Odblokování Environment Bible, Lighting Guide, …
```

**[RULE]** Dokud status rozhodnutí není **Accepted**, žádný doménový art dokument nesmí být označen jako Approved.

---

## 1. Účel ADR-A01

### Proč toto rozhodnutí existuje

Po [Art Bible](Art_Bible.md) a schváleném [World Identity Statement](World_Identity_Statement.md) je regionální identita **dalším klíčovým rozhodnutím** celého FarmOS. Art Bible definuje *jaký typ* světa hra je. World Identity Statement definuje *jaký charakter světa* vytváříme. ADR-A01 definuje *který konkrétní evropský vizuální svět* tyto dokumenty naplňuje.

Bez uzavřeného ADR-A01 každý artist interpretuje „evropskou farmu" jinak. Jeden modeluje alpskou stodolu, druhý polský silážní válec, třetí francouzský mlýn. Výsledek není svět — je to koláž.

ADR-A01 existuje proto, aby **jedno rozhodnutí** propojilo všechny vizuální disciplíny na několik let vývoje.

### Co rozhodnutí ovlivňuje

| Vrstva | Dopad |
|--------|-------|
| **Krajina** | Reliéf, biomy, horizont, vodní prvky, field layout |
| **Architektura** | Materiály, střechy, proporce, stáří budov |
| **Vegetace** | Plodiny, louky, stromy, sezónní cyklus |
| **Infrastruktura** | Cesty, ploty, vedení, odvodnění |
| **Světlo a barva** | Atmosféra, paleta, kontrast pod oblohou regionu |
| **Reference a kurátorství** | Co patří do Mood Library a co je out of scope |
| **Rozšiřitelnost** | Jak budoucní obsah (DLC, nové mapy) navazuje na jádro |

### Co ADR-A01 neřeší

| Mimo scope | Kde se řeší |
|------------|-------------|
| Gameplay mechaniky, plodiny, stroje | Game Design / Architecture Freeze |
| Technická implementace, engine | `docs/Architecture/` |
| Poly count, LOD, naming | Asset Pipeline Spec (Fáze 4) |
| Konkrétní questy, příběh, NPC | Narrative (pokud vznikne) |
| Marketing brand mimo svět hry | Visual Identity |
| Finální hex palety | Color Script — **až po** Lighting Guide v kontextu regionu |

**[RULE]** ADR-A01 je čistě **vizuální a kulturní** rozhodnutí. Nesmí měnit Architecture Freeze ani produktový scope.

---

## 2. Rozsah rozhodnutí

Regionální identita není jedna věta na mapě. Je to soubor vzájemně provázaných vizuálních pravidel. ADR-A01 musí po schválení dát odpověď v každé z těchto oblastí:

### 2.1 Architektura

- Typické materiály (dřevo, cihla, kámen, plech, beton)
- Střechy (sklon, krytina, barva)
- Proporce farmsteadů a hospodářských dvorů
- Poměr historických vs. moderních staveb
- Siluety čitelné z isometric výšky

### 2.2 Krajina

- Reliéf (nížina, kopce, pánev, podhůří)
- Struktura krajiny (otevřená pole vs. parcely vs. terasy)
- Horizont a hloubka záběru
- Přirozené dominanty (lesy, aleje, vodní plochy)

### 2.3 Vegetace

- Typické plodiny a louky
- Lesní okraj a izolované stromy
- Dřeviny v okolí farmy a vesnice
- Sezónní proměnlivost — potenciál pro čtyři roční období

### 2.4 Zemědělství

- Vizuální charakter ornice, strnišť, pastvin
- Typické zemědělské stavby (sila, stodola, kůlna, chlévy)
- Stopy po mechanizaci (stopy, prach, stopa strojů)
- Intenzita průmyslového vs. rodinného zemědělství — **vizuálně**, ne gameplay

### 2.5 Silnice a dopravní síť

- Typ polních a příjezdových cest
- Povrch (zpevněná, štěrk, bahnité koleje)
- Šířka a wear — čitelnost z kamery

### 2.6 Vodní toky a hydrologie

- Potoky, kanály, odvodňovací příkopy
- Rybníky, nádrže, závlahové prvky
- Vizuální vliv na krajinu (vlhká nížina vs. suchá rovina)

### 2.7 Oplocení a hranice pozemků

- Ploty, kamenné zídky, živé ploty
- Brány a vstupy na farmu
- Čitelnost hranic polí z výšky

### 2.8 Kulturní prvky

- Drobná architektura (kříže, studny, přístřešky — pokud regionálně typické)
- Vizuální jazyk „místa" — co dělá farmu autentickou
- Co je záměrně **vyloučeno** (turistické klišé, neautentické dekorace)

### 2.9 Průmyslové a logistické objekty

- Sila, sušárny, sklady — regionální typologie
- Vizuální vztah farmy k větší infrastruktuře (viditelný / na horizontu / mimo záběr)

### 2.10 Elektrická a technická infrastruktura

- Vedení, sloupy, transformátory — regionální standard
- Jak moc je technická infrastruktura viditelná v krajině

### 2.11 Drobná architektura a props

- Nářadí, kontejnery, sudy, balíky — regionální varianta
- Úroveň vizuálního nepořádku vs. údržby

### 2.12 Barevnost krajiny

- Základní tóny země, vegetace, oblohy — směr pro Lighting a Color Script
- Ne hex hodnoty — **charakter palety** (teplá chladná, nasycená tlumená)

### 2.13 Charakter vesnic a okolí

- Vztah farmy k zástavbě (izolovaná, na okraji vesnice, součást dvora)
- Hustota a styl okolní zástavby na horizontu
- Míra idealizace vs. dokumentární realismus

---

## 3. Kritéria hodnocení

Následující kritéria slouží k **objektivnímu** porovnání kandidátních směrů. Nejsou vážená — váhy přiřadí Art Director před workshopem podle aktuálních priorit projektu.

Každé kritérium hodnotit škálou **1–5** (1 = nevyhovuje, 5 = vynikající). Komentář povinný u hodnot 1 a 5.

### K1 — Vizuální rozmanitost

Schopnost regionu nabídnout různorodé záběry (pole, dvůr, les, voda) bez vizuální monotónie v dlouhém hraní.

### K2 — Čitelnost z kamery

Funguje region v isometric management pohledu? Jsou siluety, kontrasty a field stavy čitelné v celém zoom rozsahu dle [Art Bible](Art_Bible.md)?

### K3 — Potenciál pro čtyři roční období

Má krajina dostatečný vizuální kontrast mezi jarem, létem, podzimem a zimou? Není jedna sezóna vizuálně „prázdná"?

### K4 — Dlouhodobá rozšiřitelnost

Lze na region navázat budoucí obsah (nové parcely, budovy, biomy) bez porušení identity?

### K5 — Rozpoznatelnost

Pozná hráč nebo pozorovatel region / směr bez textového popisu? Míra rozpoznatelnosti je **parametr k rozhodnutí**, ne automatický cíl — viz otevřené otázky.

### K6 — Vlastní identita FarmOS

Odlišuje tento směr FarmOS od existujících farming simů? Nepůsobí jako kopie jedné konkrétní hry?

### K7 — Kompatibilita s realistickým stylem

Sedí směr s believable management sim realismem z Art Bible? Nepnutí tým do stylizace ani archviz excess.

### K8 — Dostupnost referencí

Existuje dost kvalitních fotografických a filmových referencí pro interní tým i outsource?

### K9 — Variabilita zemědělství

Umožňuje region vizuálně rozlišit různé typy farem, plodin a infrastruktury v rámci jedné konzistentní identity?

### K10 — Potenciál pro budoucí DLC / nové regiony

Je tento směr „uzavřený svět" nebo „první kapitola" širšího evropského celku? Kritérium hodnotí strategii produktu — rozhodnutí zůstává na produkci, ale vizuální důsledky musí být známy.

### K11 — Koheze disciplín

Snadno z něj odvodí Environment, Building, Vegetation a Infrastructure guides jedním směrem — bez vnitřních rozporů?

### K12 — Emoční shoda

Podporuje klid, kontrolu a touhu zoomovat — emoce definované v Art Bible?

---

## 4. Kandidátní regionální směry

Níže jsou **směry k hodnocení**, ne doporučení. Žádný směr není vítěz. Finální výběr proběhne přes kritéria, matici a zodpovězení otevřených otázek.

---

### 4.1 Česká republika

| | |
|--|--|
| **Silné stránky** | Silná lokální reference pro český tým; typická středoevropská nížina a kopce; čitelné pole a vesnický kontext; bohaté zemědělské stopy (ornice, aleje, rybníky); autentická architektura hospodářských dvorů |
| **Slabé stránky** | Riziko přílišné úzkosti pro mezinárodní publikum; méně „exotických" vizuálních kontrastů; některé prvky snadno zaměnitelné s obecnou střední Evropou |
| **Rizika** | Přehnaná idealizace „české idylly"; politická nebo kulturní klišé; outsource bez lokální znalosti |
| **Potenciál pro FarmOS** | Vysoká autenticita pro domácí trh; kompaktní region s dobrou čitelností z výšky; silný potenciál sezónnosti (zima se sněhem, jarní pole) |

---

### 4.2 Střední Evropa (region jako celek)

| | |
|--|--|
| **Silné stránky** | Široká reference base; flexibilita bez vázání na jeden stát; odpovídá formulaci v Art Bible; snadná rozšiřitelnost |
| **Slabé stránky** | Bez tvrdého rozhodnutí hrozí vizuální roztříštěnost; „střední Evropa" může znamenat cokoli pro každého v týmu |
| **Rizika** | Nejkonzervativnější směr může sklouznout do generického „EU farm pack"; těžší outsource briefy bez konkrétní kotvy |
| **Potenciál pro FarmOS** | Největší strategická volnost; vhodné pokud chceme evropský sim bez národní značky; vyžaduje **doplnění** o pod-rozhodnutí (které prvky jsou in / out) |

---

### 4.3 Alpské podhůří

| | |
|--|--|
| **Silné stránky** | Dramatický horizont, silná sezónnost, vysoká rozpoznatelnost; kontrast louky vs. les vs. skála; silné emoční „postcard" kvality |
| **Slabé stránky** | Terén může snižovat čitelnost polí z isometric kamery; typická architektura může dominovat nad gameplay layoutem; méně typické pro velkoplošné obilniny |
| **Rizika** | Překročení realismu směrem k turistickému klišé; performance a layout komplikace ve svahu; odchýlení od „contemporary flat farm" |
| **Potenciál pro FarmOS** | Vynikající sezónní a lighting potenciál; silná identita; vhodné pokud chceme výraznější krajinu než rovina |

---

### 4.4 Polsko

| | |
|--|--|
| **Silné stránky** | Rozsáhlé zemědělské panoramata; silná pole a infrastruktura velkofarmy i menších dvorů; výrazná sezónnost; bohaté reference pro outsource ve střední Evropě |
| **Slabé stránky** | Velkoplošné monoculture fields mohou být vizuálně monotónní; některé prvky snadno asociované s konkrétní konkurencí |
| **Rizika** | Plochá krajina bez kompoziční hierarchie; málo vodních prvků v některých oblastech; stereotypní „východoevropská farma" |
| **Potenciál pro FarmOS** | Silný pro management sim — čitelná pole, sila, logistika; dobrý kompromis rozpoznatelnosti a rozmanitosti |

---

### 4.5 Německo

| | |
|--|--|
| **Silné stránky** | Vysoká kvalita referencí; mix moderního zemědělství a historických dvorů; silná infrastruktura; contemporary believable aesthetic |
| **Slabé stránky** | Silná asociace s Farming Simulator; riziko vizuální podobnosti s existujícím standardem žánru |
| **Rizika** | Hráči mohou vnímat FarmOS jako „další německou farmu"; těžší budování vlastní identity |
| **Potenciál pro FarmOS** | Nejvyšší reference base pro believable contemporary farm; vhodné pokud cílem je „premium realism" s odlišením v detailu a kompozici, ne v regionu |

---

### 4.6 Francie

| | |
|--|--|
| **Silné stránky** | Výrazná architektura (kámen, střechy), rozmanitá krajina (normandské kopce, vinařské terasy, velké pole); silný kulturní charakter |
| **Slabé stránky** | Jižní a severní Francie jsou vizuálně velmi odlišné — bez pod-rozhodnutí hrozí mix; terasy a kamenné zdi komplikují field layout |
| **Rizika** | Příliš „malebné" — kolize s management čitelností; outsource bez jasného pod-regionu |
| **Potenciál pro FarmOS** | Silná emoční identita; vhodné pro premium „living landscape" pokud se vybere jeden konzistentní pod-směr (např. severní Francie / Normandie) |

---

### 4.7 Smíšený evropský venkov

| | |
|--|--|
| **Silné stránky** | Maximální tvůrčí volnost; žádné národní klišé; snadné skládání „nejlepších" prvků pro gameplay čitelnost |
| **Slabé stránky** | Bez přísných pravidel vede k nekonzistenci; těžko kurátorovatelné pro velký tým; slabá autenticita |
| **Rizika** | „Frankenstein" krajina; outsource neví, co je závazné; žádná emoční kotva místa |
| **Potenciál pro FarmOS** | Pouze pokud je doplněn **striktní style filter** (co je povoleno / zakázáno); jinak vysoké riziko pro dlouhodobý projekt |

---

### 4.8 Fiktivní evropský region

| | |
|--|--|
| **Silné stránky** | Plná kontrola identity; žádné národní stereotypy; vlastní jméno světa pro marketing; snadné budoucí DLC regiony |
| **Slabé stránky** | Vyžaduje víc upfront worldbuildingu; reference musí být syntetizované, ne kopírované; vyšší zátěž na Art Director kurátorství |
| **Rizika** | Může působit genericky, pokud není dostatečně kotvený v reálné fyzice a kultuře; hráči mohou postrádat autenticitu |
| **Potenciál pro FarmOS** | Nejlepší pro dlouhodobou značku a franchise; vhodné pokud produkce plánuje více regionů — „první mapa" je jeden fiktivní celek inspirovaný reálnými vzory |

---

## 5. Rozhodovací matice

Matice se vyplní na **rozhodovacím workshopu**. Do té doby zůstává prázdná.

**Kandidáti (sloupce):** CZ · Střední Evropa · Alpy · Polsko · Německo · Francie · Smíšený · Fiktivní

**Kritéria (řádky):** K1–K12 dle sekce 3

### Tabulka hodnocení (nevyplněno)

| Kritérium | CZ | Stř. Evropa | Alpy | Polsko | Německo | Francie | Smíšený | Fiktivní |
|-----------|:--:|:-----------:|:----:|:------:|:-------:|:-------:|:-------:|:--------:|
| K1 Vizuální rozmanitost | | | | | | | | |
| K2 Čitelnost z kamery | | | | | | | | |
| K3 Čtyři roční období | | | | | | | | |
| K4 Rozšiřitelnost | | | | | | | | |
| K5 Rozpoznatelnost | | | | | | | | |
| K6 Vlastní identita FarmOS | | | | | | | | |
| K7 Realistický styl | | | | | | | | |
| K8 Reference | | | | | | | | |
| K9 Variabilita zemědělství | | | | | | | | |
| K10 DLC potenciál | | | | | | | | |
| K11 Koheze disciplín | | | | | | | | |
| K12 Emoční shoda | | | | | | | | |
| **Součet** | | | | | | | | |

### Váhy kritérií (TBD před workshopem)

| Kritérium | Váha (1–3) | Poznámka |
|-----------|:----------:|----------|
| K1 | | |
| K2 | | |
| K3 | | |
| … | | |

### Výstup workshopu

Po vyplnění matice Art Director připraví:

1. **Doporučený směr** (jeden nebo hybrid s jasnými pravidly)
2. **Závazný popis regionu** — 1–2 strany pro Decision Log
3. **In / Out list** — co do světa patří a co je zakázáno
4. **Status změna:** Proposed → **Accepted** v [Decision Log](../01_ART_DECISION_LOG.md)

---

## 6. Dopady rozhodnutí

Po **Accepted** ADR-A01 lze v tomto pořadí dokončovat blokované dokumenty:

### Okamžitě odblokováno (Fáze 1)

| Dokument | Co z ADR-A01 čerpá |
|----------|-------------------|
| [Environment Bible](../01_Domain_Bibles/Environment_Bible.md) | Krajina, biomy, horizont, voda, dominanty |
| [Lighting Guide](../02_Production_Guidelines/Lighting_Guide.md) | Charakter světla, obloha, atmosféra regionu |
| [Mood Reference Library](Mood_Reference_Library.md) | Kurátorství referencí podle regionu |

### Odblokováno po Environment + Lighting (Fáze 1 dokončení)

| Dokument | Co z ADR-A01 čerpá |
|----------|-------------------|
| [Color Script](Color_Script.md) | Charakter palety krajiny a sezón |
| [Camera Composition Guide](../02_Production_Guidelines/Camera_Composition_Guide.md) | Testovací scény v kontextu regionu |

### Odblokováno ve Fázi 2 — World Building

| Dokument | Co z ADR-A01 čerpá |
|----------|-------------------|
| [Vegetation Guide](../01_Domain_Bibles/Vegetation_Guide.md) | Plodiny, stromy, louky |
| [Terrain Landscape Guide](../01_Domain_Bibles/Terrain_Landscape_Guide.md) | Ornice, cesty, drainage |
| [Material Guide](../02_Production_Guidelines/Material_Guide.md) | Materiály typické pro region |
| [Sky Weather Guide](../01_Domain_Bibles/Sky_Weather_Guide.md) | Obloha a počasí regionu |
| [Seasonal Visual Guide](../01_Domain_Bibles/Seasonal_Visual_Guide.md) | Sezóny v kontextu klimatu |

### Odblokováno ve Fázi 3 — Architecture

| Dokument | Co z ADR-A01 čerpá |
|----------|-------------------|
| [Building Style Guide](../01_Domain_Bibles/Building_Style_Guide.md) | Architektura, střechy, materiály |
| [Infrastructure Guide](../01_Domain_Bibles/Infrastructure_Guide.md) | Cesty, ploty, vedení |
| [Props Guide](../01_Domain_Bibles/Props_Guide.md) | Drobná architektura, nářadí |
| [Vehicle Machine Guide](../01_Domain_Bibles/Vehicle_Machine_Guide.md) | Kontext strojů (ne značky — viz ADR-A02) |

### Stále blokováno i po ADR-A01

| Dokument | Proč |
|----------|------|
| Asset Pipeline Spec | Fáze 4 — produkce |
| Art QA Checklist | Fáze 4 |
| ADR-A02, ADR-A03 | Čekají na kontext z A01 |

---

## 7. Otevřené otázky

Tyto otázky **musí být zodpovězeny** před uzavřením ADR-A01. Odpovědi se zapíší do finálního záznamu v Decision Logu.

### Identita a rozpoznatelnost

| ID | Otázka |
|----|--------|
| Q1 | Má být region **jednoznačně rozpoznatelný** (hráč řekne „to je X"), nebo záměrně **generický evropský**? |
| Q2 | Má svět působit jako **konkrétní místo na mapě**, nebo jako **idealizovaný evropský venkov**? |
| Q3 | Jak moc smí být krajina **idealizovaná** oproti dokumentárnímu realismu? |

### Geografie a rozšiřitelnost

| ID | Otázka |
|----|--------|
| Q4 | Má být svět **uzavřený jeden region**, nebo **první z více regionů** (DLC, expanze)? |
| Q5 | Pokud více regionů — je ADR-A01 **jedna mapa**, nebo **celá vizuální filozofie franchise**? |
| Q6 | Smí být region **inspirován více státy** za podmínky jednotných pravidel (hybrid), nebo musí být **jedna kotva**? |

### Architektura a časová vrstva

| ID | Otázka |
|----|--------|
| Q7 | Jaký je poměr **historické** vs. **moderní** architektury na farmě? |
| Q8 | Jsou **průmyslové prvky** (velká sila, sklady) dominantní, nebo na okraji vizuální identity? |
| Q9 | Má vesnice na horizontu **růst s hráčem**, nebo zůstat **statickým kontextem**? |

### Kulturní a produkční hranice

| ID | Otázka |
|----|--------|
| Q10 | Jaké **kulturní prvky jsou zakázané** (kříže, monumenty, vlajky, reklamy)? |
| Q11 | Má region podporovat **mezinárodní marketing**, nebo primárně **domácí autenticitu**? |
| Q12 | Jaká je **minimální úroveň detailu** pro outsource bez znalosti regionu — co musí být v briefu vždy? |

### Vazba na další ADR

| ID | Otázka |
|----|--------|
| Q13 | Řeší ADR-A01 **modernitu strojů**, nebo to necháme na ADR-A02? |
| Q14 | Řeší ADR-A01 **den/noční cyklus**, nebo na ADR-A03? |

---

## Proces schválení (checklist)

- [ ] Art Bible ve stavu Approved nebo Frozen
- [ ] [World Identity Statement](World_Identity_Statement.md) ve stavu Approved
- [ ] Otevřené otázky Q1–Q14 zodpovězeny
- [ ] Rozhodovací matice vyplněna a vážený součet spočítán
- [ ] In / Out list vytvořen
- [ ] Mood Reference Library — první kurátorovaná sada referencí
- [ ] Finální zápis v [Decision Log](../01_ART_DECISION_LOG.md) — status **Accepted**
- [ ] Dotčené leads notifikováni — Environment Bible může začít

---

## Související dokumenty

- [Art_Bible.md](Art_Bible.md) — nadřazená ústava
- [World_Identity_Statement.md](World_Identity_Statement.md) — Vision Lock před tímto ADR
- [00_INDEX.md](../00_INDEX.md) — preprodukční roadmapa
- [01_ART_DECISION_LOG.md](../01_ART_DECISION_LOG.md) — zápis rozhodnutí po schválení

---

## Shrnutí frameworku

**Proč framework místo okamžitého výběru:** Regionální identita je příliš zásadní na intuitivní volbu v jednom meetingu. Framework vynucuje explicitní kritéria, porovnatelné kandidáty a zodpovězení strategických otázek dříve, než tým investuje měsíce do Environment Bible a assetů. Chrání projekt před „nelze vrátit" rozhodnutím pod časovým tlakem.

**Jak pomáhá dlouhodobé konzistenci:** Každý budoucí dokument a asset se odvozuje od jednoho Accepted záznamu. Tým 20–50 lidí má společný jazyk — co je in, co je out. Změna regionu v produkci vyžaduje nový ADR, ne tichou úpravu jedné guide.

**Co se odblokuje po uzavření ADR-A01:** Okamžitě Environment Bible, Lighting Guide a kurátorství Mood Library. Následně Color Script a celá Fáze 2 (Vegetation, Terrain, Material, Sky/Weather, Seasonal). Fáze 3 (Building, Infrastructure, Props, Vehicle) navazuje po World Building.
