# Map 01 — View Composition Plan

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Typ** | View Composition / Camera Design |
| **Vlastník** | World Director |
| **Backup** | Art Director, Environment Lead |
| **Review** | Před Road Network a Field Layout |
| **Poslední změna** | 2026-07-04 |
| **Mapa** | Map 01 — Central Europe (Vertical Slice) |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální plán kompozice pohledů z kamery |

---

## Účel dokumentu

Hráč **nikdy nevidí mapu jako CAD výkres**. Vidí ji z **isometric management kamery** — zoom, pan, stovky hodin opakovaného pozorování.

Tento dokument definuje **kompozici pohledů** pro Map 01: kde má být krásně, kde čitelně, kde se vyhnout. Řeší to, co silnice a parcely pole **samy neopraví** — proto přichází **před** `Map_01_Road_Network` a `Map_01_Field_Layout`.

> **Proč tato fáze existuje:** Logická mapa z ptačí perspektivy může z herní kamery působit špatně. FarmOS to eliminuje už na začátku — kompozice pohledu je první.

**[RULE]** Map_01_View_Composition je **Source of Truth pro kompozici pohledů Map 01**. Road Network a Field Layout musí kompozici **podporovat**, ne ji ohrožovat.

---

## Závazné zdroje

| Dokument | Vztah |
|----------|-------|
| [Map_01_Landscape_Layout](Map_01_Landscape_Layout.md) | Varianta A — makro uspořádání (návrší, údolí, vesnice) |
| [Map_01_Spatial_Design](Map_01_Spatial_Design.md) | Sightlines V1–V6, hierarchie dominant |
| [Camera_Composition_Guide](../../02_Production_Guidelines/Camera_Composition_Guide.md) | Isometric parametry, zoom 25–70, default ~42 |
| [World Identity Statement](../../00_Strategy/World_Identity_Statement.md) | Klid, prostor, touha zoomovat |

---

## Pozice v produkční řadě Map 01

```text
Map_01_Design_Bible
    → Map_01_Spatial_Design
    → Map_01_Landscape_Layout
    → Map_01_View_Composition      ← tento dokument
    → Map_01_Road_Network
    → Map_01_Field_Layout
    → Map_01_POI_Guide
    → Map_01_Vegetation
    → Map_01_Lighting
    → Map_01_Asset_List
```

Reference fotografií: [`Map_01_References/`](Map_01_References/README.md)

---

## Kamera — designové parametry

Hráč ovládá **zoom** (přiblížení) a **pan** (posun). Úhel pohledu je fixní — isometric management.

| Pásmo | Zoom (radius) | Role v kompozici |
|-------|---------------|------------------|
| **Blízké** | ~25 | Detail farmy, stroje, stopy na poli, sklizeň |
| **Střední** | ~35–45 | Denní management — default start |
| **Široké** | ~55–70 | Orientace, panorama, screenshot moment |

**[RULE]** Každý Hero View musí být validován ve **všech třech pásmech**, kde je relevantní — zejména střední a široké.

---

## 1. Hero Views

Ikony mapy — záběry, které definují Map 01 a FarmOS. Musí fungovat jako první dojem i po 100 hodinách.

### HV-01 — „Moje farma" (startovní pohled)

| | |
|--|--|
| **Kamera** | Střední zoom, look-at na farmu; odpovídá V1 z Landscape Layout |
| **Kompozice** | Farma v blízkém pásmu; pole A klesají k údolí; vesnice + kostel na horizontu; obloha min. ¼ záběru |
| **Emoce** | Domov, kontrola, *„tady začínám"* |
| **Priorita** | **Kritická** — první frame po spuštění |

### HV-02 — „Velké pole"

| | |
|--|--|
| **Kamera** | Široký zoom z farmy nebo vyhlídky V5; pole B dominuje |
| **Kompozice** | Otevřená ornice/plodina; remízky jako rytmus; horizont měkký; žádná dominanta nepřebíjí pole |
| **Emoce** | Prostor, produktivita, klid |
| **Priorita** | Kritická — etalon negative space |

### HV-03 — „Vesnice v dálce"

| | |
|--|--|
| **Kamera** | Střední až široký zoom z farmy přes údolí |
| **Kompozice** | Kostel jako čitelná silueta na hřebeni; řeka v údolí jako prostřední pásmo; les za vesnicí |
| **Emoce** | Sousedství, širší svět |
| **Priorita** | Vysoká |

### HV-04 — „Řeka v údolí"

| | |
|--|--|
| **Kamera** | Střední zoom u mostu (V4) nebo pohled shora z farmy |
| **Kompozice** | Lineární tok; most jako mikro-dominanta; svahy rámuje; vesnice nahoře volitelně |
| **Emoce** | Klid vody, hloubka krajiny |
| **Priorita** | Střední |

### HV-05 — „Rybník u farmy"

| | |
|--|--|
| **Kamera** | Střední zoom, V3 |
| **Kompozice** | Klidná hladina; farma v rámu; odraz oblohy; vegetace u břehu |
| **Emoce** | Intimní klid, odpočinek od práce |
| **Priorita** | Střední |

### HV-06 — „Sklizeň zlatá"

| | |
|--|--|
| **Kamera** | Střední zoom nad polem B nebo blízko; při práci stroje blízký zoom |
| **Kompozice** | Zlaté obilí / žlutá řepka; stroj jako živý prvek; farma na horizontu nebo v periférii |
| **Emoce** | Zadostiučinění, vrchol cyklu |
| **Priorita** | Vysoká — marketing i gameplay |

---

## 2. Camera Moments

Místa, kde má hráč říct: *„To vypadá krásně."* — bez scripted cutsceney; pouze kompozicí světa a kamery.

| ID | Moment | Kdy nastává | Kompoziční podmínka |
|----|--------|-------------|---------------------|
| **CM-01** | První spuštění | Start hry | HV-01 perfektní bez UI clutter |
| **CM-02** | První max zoom out | Hráč oddálí kameru | Panorama: farma, pole, vesnice, obloha — V2 |
| **CM-03** | První sklizeň | Pole přechází do harvestable | Teplé světlo, zlatá plodina, čitelný stroj |
| **CM-04** | Podél aleje | Pan směrem k vesnici | Stromy vedou oko — natural framing |
| **CM-05** | U rybníka v mlze | Ranní mlha (výjimečné počasí) | Měkké světlo, tichá voda |
| **CM-06** | Zimní ráno | Sníh na polích | Čistá struktura krajiny, kouř z komína volitelně |
| **CM-07** | Večerní zlatá hodinka | Pozdní odpoledne (pokud TOD) | Dlouhé stíny, teplé tóny — bez Hollywood přepalu |
| **CM-08** | Návrat domů | Pohled z cesty k vesnici zpět na farmu — V6 | Farma jako cíl siluety |

**[RULE]** Minimálně **CM-01, CM-02, CM-03** musí projít screenshot testem před schválením Road Network.

---

## 3. Seasonal Views

Stejné místo — čtyři sezóny. Kompozice (horizont, dominanty) **zůstává**; mění se barva a vegetace.

### Referenční body sezón (stejná kamera jako HV-01 / HV-02)

| Sezóna | HV-01 (farma) | HV-02 (velké pole) | Kompoziční poznámka |
|--------|---------------|-------------------|---------------------|
| **Jaro** | Svěží zeleň, ornice viditelná | Světlé pole, začátek růstu | Čitelnost stavů pole prioritní |
| **Léto** | **Referenční etalon** — plná zeleň, teplé světlo | Zlaté obilí nebo zelená kukuřice | Primární marketing a VS |
| **Podzim** | Stříbrno-zlatá, listí v remízkách | Řepka žlutá, strniště | Kontrast bez chaosu |
| **Zima** | Sníh na střechách, kouřový rám | Holá struktura polí, sníh | Horizont a siluety důležitější než barva |

**[RULE]** Žádná sezóna nesmí rozbít čitelnost HV-01 — pokud zima skryje hranice polí, remízky a lesní pás musí strukturu nést.

---

## 4. Landmark Visibility

Odkud musí být která dominanta viditelná (kvalitativně — bez souřadnic).

| Landmark | Vždy viditelný z | Viditelný za podmínek | Nesmí dominovat z |
|----------|------------------|----------------------|-------------------|
| **Farma (silo + stodola)** | HV-01, V6, většina polí | Všude v otevřené krajině | — |
| **Kostel** | HV-01, HV-03, HV-02 (široký) | Z mostu | Blízký zoom u farmy |
| **Silo** | Blízký zoom farmy | Střední zoom | Nesmí zakrýt celou farmu |
| **Rybník** | HV-05, HV-01 (periferně) | Pan k vodě | Nesmí přebít siluetu farmy v CM-01 |
| **Les (hřeben)** | Široký zoom všude | — | Nesmí zastínit horizont z polí |
| **Most** | HV-04, pohled podél řeky | Z farmy (malý) | — |

### Test viditelnosti

Z **default středního zoomu na farmě** musí být do 2 sekund rozpoznatelné: farma, směr k poli B, směr k vesnici (kostel), přítomnost vody (rybník nebo údolí řeky).

---

## 5. Screenshot Quality

Moderní hra se šíří přes Steam, Reddit, YouTube a screenshoty hráčů. Mapa musí generovat krásné záběry **téměř sama** — bez režiséra.

### Principy screenshotovatelnosti

| Princip | Aplikace Map 01 |
|---------|-----------------|
| **Horizont v záběru** | Min. 20–30 % oblohy při širokém zoomu |
| **Jedna dominanta** | Žádný screenshot chaos — vždy jasný subjekt |
| **Teplé denní světlo** | Default TOD = dopoledne; žádný šedý flat overcast jako jediný mood |
| **Živý prvek** | Stroj, pták, vítr v obilí — volitelně; statika jen výjimečně |
| **Čisté okraje** | UI skryté v marketing shots; in-game HUD nesmí zabírat CM-01 |
| **Bez ugly angles** | Negative views (sekce 7) zakázány i v „náhodných" hráčských záběrech |

### Screenshot tier list (cíl pro level art)

| Tier | Příklad | Použití |
|------|---------|---------|
| **S** | HV-01 léto, HV-06, CM-02 | Steam caps, trailer |
| **A** | HV-03, HV-05, CM-04 | Key art, loading |
| **B** | HV-04, podzimní varianty | Sociální sítě |
| **C** | Běžný management zoom | Gameplay — musí být čitelné, ne nutně S |

**[RULE]** Pokud záběr není minimálně **Tier A** po dokončení layoutu, layout se reviduje — ne se „doufá" na post-processing.

---

## 6. Farming Views

Jak vypadají klíčové farming momenty z kamery — čitelnost gameplay **a** estetika.

| Aktivita | Zoom | Kompozice | Čitelnost |
|----------|------|-----------|-----------|
| **Orba** | Střední → blízký | Tmavá ornice kontrastuje se zelení; stroj diagonálně v záběru | Stopa za strojem viditelná |
| **Setí** | Střední | Světlejší pás ornice; jemný rozdíl od okolní půdy | Pole hranice čitelné |
| **Růst** | Střední, široký | Zelené vlny; remízky jako mřížka | Fáze růstu z barvy |
| **Sklizeň** | Střední, blízký u stroje | Zlatá / žlutá dominantní barva; prach za kombajnem volitelně | Harvestable stav okamžitý |
| **Odvoz** | Střední | Traktor + návěs na cestě k silu; silueta farmy v cíli | Cesta jako vedoucí linie |
| **Práce u sila** | Blízký | Silo vertikála; dvůr jako rám; stroj u sypání | Logistický uzel čitelný |

**[RULE]** Farming views nesmí vyžadovat jiný úhel kamery než management — pokud sklizeň vypadá špatně z isometric, problém je layout pole, ne kamera.

---

## 7. Negative Views

Pohledům, kterým se **aktivně vyhýkáme** — při layoutu, road network i field layout.

| ID | Negative view | Proč | Mitigace v layoutu |
|----|---------------|------|---------------------|
| **NV-01** | Zadní strana všech budov farmy najednou | Nevlídné, nečitelné | Farmu orientovat frontem k default kameře |
| **NV-02** | Silnice končící v lese bez logiky | Porušuje důvěru | Road Network — každá cesta má cíl |
| **NV-03** | Plochý prázdný horizont bez siluety | Nuda, ztráta prostoru | Vesnice + les na hřebeni |
| **NV-04** | Monotónní pole bez hranice do nekonečna | Únava po 10 h | Remízky, střídání plodin, svah |
| **NV-05** | Dva konkurenční focal pointy stejné váhy | Roztříštěná pozornost | Spatial hierarchy |
| **NV-06** | Rybník zakrývající farmu z startu | Ztráta CM-01 | Rybník mimo osu HV-01 |
| **NV-07** | Stěna lesa zabírající >40 % širokého záběru | Klaustrofobie | Les jen na hřebeni a bočním pásu |
| **NV-08** | Šedá obloha bez kontrastu k zemi | Deprese, flat screenshot | Lighting — difúzní ale ne mrtvé |
| **NV-09** | Zadní pohled na vesnici (zadní fasády) | Neautentický „modelářský" záběr | Vesnice orientovaná k polím |
| **NV-10** | Průmyslová silueta (tobol, větrné turbíny) v záběru | Out of vision | Design Bible out of scope |

### Negative view test

Při blockout review: **pan celou mapou** na středním zoomu — pokud více než 3 sekundy neexistuje příjemný záběr, layout selhává.

---

## 8. Zoom Habitats — kde hráč tráví čas

Místa, kde hráč **nejčastěji zoomuje** — musí být nejkrásnější a nejčitelnější.

| Zóna | Typický zoom | Požadavek |
|------|--------------|-----------|
| **Dvůr farmy** | Blízký (25–30) | Detail wear, stroje, silo — hero asset kvalita |
| **Pole A u farmy** | Střední | Denní stavy plodin — okamžitá čitelnost |
| **Pole B (velké)** | Střední → široký | Sklizeň, panorama — CM-03 |
| **Cesta farmě–most** | Střední | Přechodová kompozice — nesmí být nuda |
| **Silo / vykládka** | Blízký | Logistika — čistý framing |

---

## View Composition Review

Před přechodem na Road Network / Field Layout:

- [ ] HV-01 až HV-06 definované a navázané na Variantu A
- [ ] CM-01, CM-02, CM-03 popsány a testovatelné v blockoutu
- [ ] Sezónní variace HV-01/02 neporušují čitelnost
- [ ] Landmark visibility tabulka splnitelná z makro layoutu
- [ ] Min. 3 záběry Tier S identifikované
- [ ] Farming views čitelné z isometric kamery
- [ ] Negative views NV-01–10 mitigované v návrhu
- [ ] Soulad s [World Identity](../../00_Strategy/World_Identity_Statement.md) a [Spatial Design](Map_01_Spatial_Design.md)

---

## Otevřená rozhodnutí (pro blockout)

| ID | Otázka | Blokuje |
|----|--------|---------|
| VC-01 | Přesný look-at target default kamery (střed dvora vs. silo) | CM-01 |
| VC-02 | Orientace farmy — která fasáda k default kameře (NV-01) | POI, building |
| VC-03 | Dominantní letní plodina pro HV-06 (obilí vs. řepka) | Vegetation |
| VC-04 | Mlha u rybníka — standardní preset nebo výjimečný | Lighting |
| VC-05 | Safe zone HUD — kolik % obrazu rezervovat (CM-01) | UI Style Guide |

**Uzamčeno po schválení:** pořadí produkce View Composition před Road/Field; Hero Views HV-01–06; Negative Views seznam; screenshot tier požadavky.

---

## Shrnutí

### Proč tato fáze

Kompozice z kamery je to, co hráč vidí 500+ hodin — ne CAD plán pole. Oddělení View Composition od Road/Field Layout je záměrná odchylka od rigidního AAA pipeline ve prospěch management simu, kde kamera je 80 % dojmu.

### Co následuje

Po schválení a blockout testu CM-01–03: [Map_01_Master_Plan.md](Map_01_Master_Plan.md) → `Map_01_Road_Network` → `Map_01_Field_Layout` → POI → Vegetation → Lighting.

### Produkční balíček

`Map_01_Central_Europe/` je první **produkční balíček** mapy — dokumentace + [`Map_01_References/`](Map_01_References/README.md) pro kurátorství fotografií per oblast.

---

## Související dokumenty

- [Map_01_Landscape_Layout.md](Map_01_Landscape_Layout.md)
- [Map_01_Spatial_Design.md](Map_01_Spatial_Design.md)
- [Camera_Composition_Guide](../../02_Production_Guidelines/Camera_Composition_Guide.md)
- [Map_01_References/README.md](Map_01_References/README.md)
