# Map 01 — Design Bible (Vertical Slice)

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Typ** | World Layout / Level Design Bible |
| **Vlastník** | World Director / Environment Lead |
| **Backup** | Art Director |
| **Review** | Před zahájením produkce mapy |
| **Poslední změna** | 2026-07-04 |
| **Scope** | První hratelná mapa — Vertical Slice |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální návrh první mapy FarmOS |

---

## Účel dokumentu

Tento dokument je **kompletní návrh první hratelné mapy FarmOS** — referenční oblast pro Vertical Slice, vizuální etalon hry a základ pro všechny budoucí mapy.

Není to implementační specifikace. Neřeší engine, optimalizaci, spawn, AI, ekonomiku ani questy. Popisuje **pouze svět** — jak vypadá, jak se cítí a jak je uspořádaný.

**[RULE]** Map 01 Design Bible je **Source of Truth pro návrh první hratelné mapy**. Domain guides (Environment, Vegetation, Building…) zůstávají obecnou autoritou pro celý projekt; tento dokument je jejich **konkretizace pro Map 01**.

---

## Odvození ze strategické dokumentace

Tento návrh **nemění** rozhodnutí nadřazených dokumentů — převádí je do první mapy.

| Zdroj | Co přebírá Map 01 |
|-------|-------------------|
| [Art Bible](../../00_Strategy/Art_Bible.md) | Management pohled, pole jako centrum, klid, čitelnost, believable evropská farma |
| [World Identity Statement](../../00_Strategy/World_Identity_Statement.md) | Inspirováno realitou s kurátorovanou idealizací; přehledná jemně zvlněná krajina; správce/hospodář |
| [ADR-A01 Framework](../../00_Strategy/ADR-A01_Regional_Identity_Framework.md) | Středoevropský směr — bez vázání na jeden stát; vlastní identita FarmOS |

### Rozhodnutí specifická pro Map 01

| Oblast | Rozhodnutí |
|--------|------------|
| **Region** | Střední Evropa — syntéza inspirací (ČR, jižní Polsko, Rakousko, Německo), ne kopie jedné země |
| **Reliéf** | Jemně zvlněná krajina — ne dramatické hory, ne úplná rovina |
| **Zemědělství** | Konvenční středoevropské — obilí, řepka, kukuřice, louky, pastviny |
| **Osídlení** | Jedna vesnice, samoty, jedna hlavní farma — bez města |
| **Vodstvo** | Řeka, rybník, potoky, mokřady — měřítko venkovské, ne velká vodní díla |

---

## Pozice v hierarchii

```text
Art Bible
       │
       ▼
World Identity Statement
       │
       ▼
ADR-A01 (středoevropský směr — Map 01 jako referenční instance)
       │
       ▼
Map 01 Design Bible          ← tento dokument
       │
       ▼
Map_01_Spatial_Design        ← prostorová logika (před Layout)
       │
       ├──► Map_01_Landscape_Layout (TBD)
       ├──► Map_01_POI_Guide (TBD)
       └──► …
       │
       ▼
Environment Bible · Vegetation · Building · Lighting · Color Script
       (obecné guides — Map 01 je jejich aplikace na první oblast)
```

---

## Cíl mapy

Map 01 bude:

- **první hratelnou mapou** FarmOS — místo, kde se Vertical Slice odehraje;
- **referenční mapou** pro budoucí vývoj — standard kvality, kompozice a identity;
- **vizuálním etalonem** — každý budoucí asset se měří proti tomu, jak vypadá na Map 01;
- **základem pro další mapy** — opakovatelná struktura, ne jednorázový ostrov.

Map 01 musí na první pohled říct: *tohle je FarmOS* — ne generický farming sim, ne kopie jedné země.

---

## 1. Design Goals

### Primární cíle

| Cíl | Popis |
|-----|-------|
| **Identita** | Mapa reprezentuje vizuální slib FarmOS — klid, důvěra, práce na zemi |
| **Čitelnost** | Hráč z management výšky okamžitě čte pole, farmu, vesnici a směr krajiny |
| **Prostor** | Velké výhledy dávají pocit živého světa většího než hráčova parcela |
| **Živost** | Krajina vypadá obývaná a obhospodařovaná — ne opuštěná, ne muzeum |
| **Etalon** | Každý budoucí biomy, budovy a vegetace se porovnává s touto mapou |

### Emoce, které mapa musí vyvolat

- **Klid a otevřenost** — široké obzory, měkké světlo, absence vizuálního tlaku.
- **Důvěra** — svět vypadá jako místo, kde zemědělství dává smysl dnes.
- **Touha zoomovat** — detaily (dvůr, řádky plodin, remízky) lákají k přiblížení.
- **Pocit domova** — hlavní farma je kotvou; vesnice a krajina ji obklopují přirozeně.
- **Každodennost** — běžný pracovní den, ne festival ani katastrofa.

### Vztah k gameplay (pouze vizuální)

Mapa musí vizuálně podporovat management simulaci:

- Pole jsou **největší a nejčitelnější** plochy — stavy ornice a plodin jsou okamžitě rozpoznatelné.
- Hlavní farma sedí **logicky v krajině** — přístup z cest, blízkost vody, sousedství polí.
- Vesnice a samoty dávají **kontext** — hráč není izolovaný v prázdné rovině.
- Cesty tvoří **srozumitelnou síť** — kam vést stroj je z výšky intuitivní.

**[RULE]** Design Goals neřeší mechaniky — pouze to, co musí svět umožnit vidět a cítit.

---

## 2. World Overview

### Celkový charakter

Map 01 je **středoevropská venkovská krajina** v mírně zvlněné krajině — typický prostor mezi nížinou a podhůřím. Není to horská krajina ani bezútěšná rovina. Je to **pracující krajina** — většinu plochy tvoří zemědělství, doplněné lesními pásy, vodou a malou zástavbou.

Krajina působí **klidně a přehledně**. Hráč vidí daleko, ale vždy má pocit, že svět pokračuje za horizontem.

### Měřítko (kvalitativní)

- **Makro:** jedna souvislá venkovská oblast s vesnicí, řekou a rozptýlenou zástavbou.
- **Střední:** několik větších polních bloků, dva až tři lesní celky, jeden výrazný rybník.
- **Mikro:** remízky, aleje, samoty, mosty — detaily, které dávají autenticitu.

Velikost v metrech ani kilometrech **tento dokument neřeší** — řeší charakter a proporce vztahů.

### Horizont

Horizont je **vždy přítomen** — hráč vidí, že farma leží v širší krajině. Vzdálené kopce, lesní pásy a obrys vesnice na hřebeni vytváří hloubku bez dramatických hor.

Typický horizont Map 01:

```text
[nebe — měkké, světlé]
[ vzdálený les │ vesnické střechy │ mírný hřbet kopce ]
[ střední pásmo — pole, remízky, aleje ]
[ blízké pásmo — aktivní farma, cesty, vodní prvek ]
```

### Dominanty

Přirozené dominanty — prvky, které orientují oko a paměť hráče:

| Dominanta | Role |
|-----------|------|
| **Hlavní farma** | Vizuální a emocionální centrum — největší souvislá zástavba v hráčově dosahu |
| **Vesnický kostel** | Orientační bod na horizontu — „tam je vesnice" |
| **Rybník** | Vodní kotva krajiny — odraz oblohy, klid |
| **Řeka v údolí** | Lineární prvek — strukturuje krajinu ve směru toku |
| **Alej nebo remízka** | Vedou oko do hloubky záběru |
| **Most** | Mikro-dominanta — místo přechodu, paměť místa |

### Přirozené orientační body

Hráč se orientuje podle:

1. Polohy hlavní farmy (vždy „doma").
2. Siluety vesnice s kostelem (civilizace).
3. Lesních pásů (hranice otevřené krajiny).
4. Rybníka a řeky (voda = směr).
5. Hlavní silnice II./III. třídy (spojení s okolím mimo mapu).

---

## 3. Landscape Structure

### Pole

- Velké **souvislé bloky** konvenčního zemědělství — obilí, řepka, kukuřice střídané v logických plochách.
- Pole jsou **čitelná z výšky** — hranice mezi plodinami a ornice jsou vizuálně zřetelné.
- Ornice a strniště nesmí působit jako textura — musí mít charakter práce.
- Mezi poli **remízky** — úzké pásy vegetace, které člení krajinu bez chaosu.

### Louky a pastviny

- **Louky** — trvalý travní porost, často podél vodních toků a na mírných svazích.
- **Pastviny** — otevřenější, méně intenzivní než orná pole; vizuálně odlišné barvou a výškou vegetace.
- Louky **změkčují** přechod mezi polem a lesem nebo vodou.

### Lesy

- **Smíšené lesy** — listnaté (dub, buk, jasan, lípa) s příměsí jehličnanů (smrk, borovice) na chladnějších svazích.
- **Lesní okraje** — přirozený přechod, ne ostrá čára; podrost a křoviny.
- **Remízky** — úzké lesní pásy mezi poli — typický středoevropský prvek.
- **Aleje** — podél cest a toků; vůdce okem do krajiny.
- Les není temný prales — je to ** hospodářský les** v kulturní krajině.

### Voda

| Prvek | Charakter |
|-------|-----------|
| **Řeka** | Menší tok v mírném údolí; jeden hlavní vodní tah mapy; klidný, ne divoký |
| **Rybník** | Jeden výrazný rybník — kulatý nebo mírně oválný; typický středoevropský; klidná hladina |
| **Potoky** | Feeder řeky a rybníka; klikatí mezi loukami; přirozené koryto |
| **Mokřady** | U vtoků a v nížinách; rákosí, mokřadní vegetace — bez dramatického bažinařství |

Voda je **klidná a funkční** — ne rekreační riviéra, ne záplavová katastrofa.

### Svahy a údolí

- Reliéf **jemně zvlněný** — mírné návrší, krátké svahy, mělká údolí.
- Pole sledují **kontury svahů** — terasy nejsou dramatické, ale svah je čitelný.
- Řeka teče **údolím** — nejvýraznější vertikální struktura reliéfu.
- Žádné strmělé srázy ani horské průsmyky.

### Horizont

- Vzdálené **mírné kopce** nebo lesní hřebeny — měkká silueta.
- Vesnice **na hřebeni nebo svahu** — čitelná zástavba proti obloze.
- Obloha zabírá **významnou část záběru** — pocit prostoru a čerstvého vzduchu.

---

## 4. Land Use

Koncepční rozdělení krajiny Map 01. Procenta jsou **orientační poměry**, ne měření plochy.

| Kategorie | Podíl (orientačně) | Charakter |
|-----------|-------------------|-----------|
| **Zemědělská půda — orná** | ~45–55 % | Obilí, řepka, kukuřice; hlavní vizuální plocha |
| **Zemědělská půda — louky a pastviny** | ~10–15 % | Travní porost, pastviny |
| **Les a remízky** | ~20–25 % | Smíšený les, lesní okraje, aleje, remízky |
| **Voda** | ~3–5 % | Řeka, rybník, potoky, mokřady |
| **Zastavěné území** | ~2–4 % | Vesnice, samoty, hlavní farma, hospodářské objekty |
| **Cesty a infrastruktura** | ~3–5 % | Silnice, polní cesty, mosty, oplocení |

### Principy land use

1. **Zemědělství dominuje** — hráč musí cítit, že je na farmě uprostřed pole, ne v lese u kapličky.
2. **Les rámuje** — lesní pásy na okrajích otevřené krajiny, ne uprostřed farmy.
3. **Voda je vzácná a významná** — málo plochy, vysoký vizuální dopad.
4. **Zástavba je řídká** — vesnice je malá; prostor patří krajině.
5. **Cesty spojují** — síť je čitelná, ne hustá dálniční síť.

### Co land use vylučuje

Vinice, olivové háje, intenzivní skleníkové komplexy, průmyslové areály, velká městská zástavba, golfová hřiště, solární farmy jako dominantu.

---

## 5. Points of Interest

Orientační body Map 01 — **bez přesné polohy**. Pořadí odráží typickou důležitost pro hráče a kompozici.

### Tier 1 — Kotvy mapy

| POI | Popis | Vizuální role |
|-----|-------|---------------|
| **Hlavní farma** | Centrální statek hráče — dvůr, stodoly, silo, obytná část | Emocionální a gameplay centrum; největší silueta v blízkém pásmu |
| **Vesnická náves** | Malá vesnice s kostelem, několika domy, možná hospoda | Horizontální orientace; „civilizace" v dosahu |
| **Rybník** | Jeden výrazný rybník v blízkosti farmy nebo vesnice | Klid, odraz oblohy; vodní identita mapy |

### Tier 2 — Strukturální POI

| POI | Popis | Vizuální role |
|-----|-------|---------------|
| **Kostel** | Jednoduchá venkovská sakrální stavba — věž jako orientační bod | Silueta na horizontu |
| **Most přes řeku** | Dřevěný nebo betonový most; jeden hlavní, případně menší | Přechod, paměť místa |
| **Mlýn** | Historický nebo přestavěný mlýn u vody — funkční nebo částečně | Kulturní vrstva; voda + architektura |
| **Samota** | Jedna až tři rozptýlené usedlosti mimo vesnici | Živost krajiny; ne každý žije v návsi |

### Tier 3 — Krajinné POI

| POI | Popis | Vizuální role |
|-----|-------|---------------|
| **Lesní křižovatka** | Místo, kde se setkávají lesní a polní cesty | Mikro-orientace; pocit sítě cest |
| **Alej** | Stromořadí podél cesty nebo toku | Vede oko; rámuje výhled |
| **Vyhlídka** | Mírné návrší s výhledem přes pole k vesnici a horizontu | První „wow" prostoru — klidný, ne dramatický |
| **Propustek / brod** | Menší přechod vodního toku mimo hlavní most | Autenticita infrastruktury |
| **Hřiště nebo kaplička** | Drobná architektura u vesnice (volitelné) | Lidský rozměr vesnice |

### POI hierarchie v záběru

```text
Blízko hráče:    farma → dvůr → pole → cesta
Střední vzdálenost: rybník → alej → samota → most
Horizont:        vesnice + kostel → lesní pás → kopce
```

**[RULE]** Každý POI musí projít [World Identity checklist](../../00_Strategy/World_Identity_Statement.md#9-checklist--odpovídá-asset-identitě-farmos).

---

## 6. Visual Composition

### Kompoziční principy

Map 01 je komponována pro **isometric management kameru** — čitelnost z výšky je absolutní priorita nad dramatickým úhlem.

| Princip | Aplikace na Map 01 |
|---------|-------------------|
| **Vrstvená hloubka** | Tři pásmata: blízké pole / střední krajina / horizont |
| **Focal point** | Hlavní farma v blízkém pásmu; oko se vrací k ní |
| **Rámování** | Aleje a remízky rámovávají výhledy; lesní okraje uzavírají záběr |
| **Kontrast siluet** | Vesnice a kostel proti obloze; stodola proti poli |
| **Rytmus** | Opakující se řádky plodin, pravidelné remízky — klid, ne monotónnost |

### Výhledy

Map 01 nabízí **několik typů výhledů**:

1. **Z farmy přes pole** — otevřený, produktivní; vesnice na horizontu.
2. **Podél aleje** — hloubka, perspektiva bez nutnosti nízkého úhlu.
3. **Z vyhlídky** — panoramatický klid; pochopení celé oblasti.
4. **K rybníku** — intimnější; odraz oblohy a vegetace u vody.
5. **Podél řeky** — lineární průvodce krajinou; most jako cíl.

### Horizont a obloha

- Obloha je **vždy součástí kompozice** — minimálně jedna třetina záběru při max zoomu out.
- Mraky jsou **měkké a podpůrné** — ne dramatické cumulonimbus jako default.
- Horizont je **čistý ale živý** — žádné tovární komíny, žádné mrakodrapy.

### Siluety

Čitelné siluety z výšky (priorita):

1. Stodola a silo hlavní farmy
2. Věž kostela
3. Lesní pás na hřebeni
4. Alej jako tmavá linie
5. Hladina rybníka jako světlá plocha

---

## 7. Atmosphere

### Denní doba

**Default:** pozdní dopoledne až brzké odpoledne — světlé, klidné světlo, měkké stíny.

| Denní doba | Role na Map 01 |
|------------|----------------|
| Dopoledne | Primární — čitelnost, čerstvost |
| Odpoledne | Sekundární — teplejší tón, delší stíny u stromů |
| Zataženo | Častý variant — měkké světlo, stále čitelné |
| Ráno s mlhou | Výjimečný — atmosféra u rybníka a v údolí řeky |
| Večer / noc | Mimo default Vertical Slice — až s gameplay důvodem |

### Roční období

Map 01 musí být navržena tak, aby **všechna čtyři roční období** fungovala vizuálně:

| Sezóna | Charakter Map 01 |
|--------|------------------|
| **Jaro** | Svěží zelená, ornice, začátek růstu |
| **Léto** | Zlaté obilí, plná zeleň, živá obloha — **referenční sezóna pro první prezentaci** |
| **Podzim** | Řepka žlutá, sklizeň, barevné listí v remízkách |
| **Zima** | Sníh na polích a střechách, odhalená struktura krajiny, stále čitelná |

Léto je **primární referenční sezóna** pro moodboard a první vizuální target — ne jediná sezóna ve hře.

### Počasí

- **Default:** jasno až lehká oblačnost.
- **Časté:** mírná oblačnost — měkké světlo.
- **Výjimečné:** déšť, mlha — atmosféra, ne gameplay trest.
- **Zakázané jako default:** bouřka, extrémní vítr, apokalyptická obloha.

### Barvy a světlo

- Paleta **teple měkká** — zlatá obilí, zelená louky, modrošedá obloha.
- Barvy podléhají [Color Script](../../00_Strategy/Color_Script.md) po [Lighting Guide](../../02_Production_Guidelines/Lighting_Guide.md) — Map 01 definuje **charakter**, ne hex.
- Světlo **difúzní a klidné** — žádné přepálené HDR záře.

### Celkový pocit

> Letní dopoledne na středoevropské venkově — ticho přerušené šumem větru v obilí, daleko kostel, blízko práce na poli.

---

## 8. Player Experience

### První dojem (spuštění hry)

Hráč se ocitne v **management pohledu nad hlavní farmou**. První záběr musí komunikovat:

1. **„Tady je moje farma"** — dvůr, stodoly, silo jsou okamžitě čitelné.
2. **„Kolem je krajina"** — pole, remízky, v dálce vesnice.
3. **„Svět je klidný a velký"** — horizont, obloha, prostor.
4. **„Chci zoomovat"** — detaily dvora a polí lákají blíž.

### Postupné odkrývání

Krajina se **neodkrývá cutscénou** — hráč ji objevuje pohybem kamery a zoomem:

| Fáze objevování | Co hráč vidí | Emoce |
|-----------------|--------------|-------|
| **Start** | Farma + nejbližší pole | Domov, kontrola |
| **Krátký zoom out** | Celý farmstead, příjezdová cesta | Přehled |
| **Pan k vesnici** | Kostel, náves, rybník | Kontext, sousedství |
| **Pan k lesu / řece** | Lesní okraj, most, údolí | Hloubka světa |
| **Max zoom out** | Panorama — pole, horizont, obloha | Prostor, klid |

### Vztah hráče k mapě

Hráč je **správce a hospodář** — mapa není tematický park k prohlížení. Každé místo má potenciál práce: pole k obdělání, cesta k projetí, dvůr k rozšíření.

Svět **existoval před hráčem** — vesnice, mlýn, samoty nejsou „unlocknuté" — jsou tam. Hráč do krajiny **vstupuje jako pokračovatel**, ne jako stvořitel.

### Co hráč nemusí vidět hned

- Celá řeka od pramene po ústí.
- Všechny samoty najednou.
- Každý lesní chodníček.

Mapa má **míru tajemství** — přehledná, ale ne průhledná na první pohled.

---

## 9. Out of Scope

První mapa **záměrně neobsahuje**:

### Urbanismus a doprava

- Město nebo předměstí
- Dálnice nebo rychlostní komunikace
- Letiště, vlakové nádraží, logistická centra
- Vícepodlažní zástavba

### Terén a biomy

- Vysoké hory, alpské louky, strmé srázy
- Úplná rovina bez horizontu
- Pobřeží, moře, pláž
- Poušť, step, tundra

### Zemědělství a průmysl

- Vinice, olivové háje
- Rýže, bavlna, tropické plodiny
- Skleníkové agrokomplexy jako dominantu
- Průmyslová zóna, továrna, elektrárna
- Větrné farmy jako dominantní prvek krajiny

### Atmosféra a styl

- Noční neon, cyberpunk
- Hollywoodský západ slunce jako jediný mood
- Fantasy biomy
- Apokalyptická nebo postapokalyptická krajina
- Turistické klišé (lanovka, rozhledna jako centrum mapy)

### Obsah

- Quest-specific lokace mimo svět farmy
- Arena nebo izolované gameplay zóny bez krajinného kontextu

**[RULE]** Out of Scope platí pro Map 01 Vertical Slice. Budoucí mapy mohou rozšířit geografii — ale Map 01 definuje **jadro identity**, ne hranici franchise.

---

## 10. Reference Direction

Následující témata budou potřeba pro moodboard a [Mood Reference Library](../../00_Strategy/Mood_Reference_Library.md). **Konkrétní fotografie zatím ne** — pouze směr kurátorství.

### Krajina a pole

- Letní zlaté obilí ve mírném svahu — velký výhled
- Jarní ornice s remízkami — struktura pole
- Podzimní řepkové pole — barevný kontrast
- Zimní krajina se sněhem — čitelnost struktury bez vegetace

### Les a vegetace

- Smíšený lesní okraj s podrostem
- Remízky mezi poli — středoevropský standard
- Aleje lip nebo dubů podél cesty
- Louka s rozptýlenými stromy

### Voda

- Klidný rybník s lekníny a rákosím — odraz oblohy
- Mělké údolí s potokem a mostkem
- Mokřad u vtoků — přirozená vegetace

### Architektura a osídlení

- Středoevropský statek — stodola, silo, obytná část
- Vesnická náves s kostelem — malá, ne skanzen
- Samota na konci polní cesty
- Mlýn u vody — historická vrstva
- Most přes řeku — dřevo nebo beton

### Infrastruktura

- Silnice III. třídy s polem po obou stranách
- Polní cesta s kolejemi od strojů
- Lesní cesta — štěrk nebo udusaná země
- Oplocení a brána farmy

### Technika a práce

- Současný traktor na poli — believable, ne showroom
- Stopy po sklizni — strniště, stopy na ornici
- Balíky slámy u stodoly

### Atmosféra

- Měkké dopolední světlo nad polem
- Lehká oblačnost — difúzní světlo
- Mlha u rybníka za úsvitu — výjimečný mood

### Kurátorství referencí

**Povoleno:** středoevropská venkovská fotografie, dokumentární zemědělství, regionální archiv krajiny.

**Zakázáno jako primární reference:** screenshoty konkurenčních her, Instagram filtry, turistické pohlednice s přesycenými barvami, alpské extrémy, americké velké farmy.

---

## Source of Truth — Map 01

| Téma | Autorita pro Map 01 |
|------|---------------------|
| Návrh první hratelné mapy | **Tento dokument** |
| Filozofie světa (obecně) | [World Identity Statement](../../00_Strategy/World_Identity_Statement.md) |
| Vizuální ústava | [Art Bible](../../00_Strategy/Art_Bible.md) |
| Obecná krajina (cross-map) | [Environment Bible](../../01_Domain_Bibles/Environment_Bible.md) — po dokončení |
| POI detail, layout | Map_01_Landscape_Layout, Map_01_POI_Guide (TBD) |

**[RULE]** Při konfliktu mezi obecným guide a Map 01 Design Bible pro **první mapu** platí tento dokument. Při konfliktu s Art Bible nebo World Identity platí vždy nadřazený dokument.

---

## Navazující dokumenty (TBD)

Po schválení Map 01 Design Bible vzniknou produkční podklady:

| Dokument | Účel | Vlastník |
|----------|------|----------|
| [Map_01_Spatial_Design.md](Map_01_Spatial_Design.md) | Prostorová logika, kompozice, sightlines | World Director |
| [Map_01_Landscape_Layout.md](Map_01_Landscape_Layout.md) | Makrokompozice (Varianta A) | World Director |
| [Map_01_View_Composition.md](Map_01_View_Composition.md) | Kompozice pohledů z kamery — před Road/Field | World Director |
| `Map_01_Road_Network.md` | Silnice a polní cesty | World Director |
| `Map_01_Field_Layout.md` | Parcely polí | Level Design |
| `Map_01_POI_Guide.md` | Detail POI | Environment Lead |
| `Map_01_Vegetation.md` | Plodiny a les per zóna | Vegetation Lead |
| `Map_01_Lighting.md` | Světlo mapy | Lighting Lead |
| `Map_01_Asset_List.md` | Asset katalog VS | Art Producer |

```text
Map_01_Design_Bible (schválit první)
       │
       ├── Map_01_Spatial_Design
       ├── Map_01_Landscape_Layout
       ├── Map_01_View_Composition
       ├── Map_01_Road_Network
       ├── Map_01_Field_Layout
       ├── Map_01_POI_Guide
       ├── Map_01_Vegetation
       ├── Map_01_Lighting
       ├── Map_01_Asset_List
       └── Map_01_References/
```

---

## Otevřená rozhodnutí před produkcí

Následující body **tento dokument neuzamyká** — vyžadují workshop před `Landscape_Layout` a asset produkcí:

| ID | Otázka | Blokuje |
|----|--------|---------|
| M01-D01 | Přesná poloha hlavní farmy vůči vesnici (blízko / na okraji / izolovaně) | Landscape Layout |
| M01-D02 | Je mlýn funkční součást farmy, nebo samostatný POI? | POI Guide, Building |
| M01-D03 | Počet a typ samot (1–3) | POI Guide |
| M01-D04 | Dominantní plodina v referenčním letním záběru (obilí vs. řepka vs. mix) | Vegetation, Color |
| M01-D05 | Hlavní farma — historická vrstva vs. moderní rozšíření (poměr) | Building Style pro Map 01 |
| M01-D06 | Rybník — na pozemku farmy, nebo sdílený s vesnicí? | Layout, gameplay vizuál |
| M01-D07 | Schválení ADR-A01 jako „Střední Evropa syntéza" pro celý projekt, nejen Map 01 | Franchise konzistence |
| M01-D08 | Rozsah mapy — kvalitativní hranice (co je na okraji za horizontem) | Landscape Layout |

---

## Shrnutí

### Jak návrh podporuje dlouhodobou vizi FarmOS

Map 01 není jednorázová aréna — je **genetický kód** vizuální identity. Středoevropská jemně zvlněná krajina s konvenčním zemědělstvím, malou vesnicí a velkými výhledy přímo implementuje World Identity Statement: věrohodný pracovní svět s kurátorovanou idealizací. Každá budoucí mapa bude buď variací tohoto jazyka, nebo vědomým rozšířením — nikdy náhodným mixem.

### Navazující dokumenty

`Map_01_View_Composition` (aktuální fáze), poté `Map_01_Road_Network`, `Map_01_Field_Layout`, `Map_01_POI_Guide`, `Map_01_Vegetation`, `Map_01_Lighting`, `Map_01_Asset_List` — viz sekce výše.

### Rozhodnutí před produkcí

Uzavřít otevřené body M01-D01 až M01-D08; schválit tento Design Bible; synchronizovat s dokončovanými Environment a Lighting guides; teprve poté zahájit blockout a asset produkci.

---

## Související dokumenty

- [Art_Bible.md](../../00_Strategy/Art_Bible.md)
- [World_Identity_Statement.md](../../00_Strategy/World_Identity_Statement.md)
- [ADR-A01_Regional_Identity_Framework.md](../../00_Strategy/ADR-A01_Regional_Identity_Framework.md)
- [00_INDEX.md](../../00_INDEX.md)
- [Environment_Bible.md](../../01_Domain_Bibles/Environment_Bible.md)
