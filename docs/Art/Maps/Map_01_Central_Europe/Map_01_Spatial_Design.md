# Map 01 — Spatial Design

## World Composition & Spatial Logic

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Typ** | Spatial Design / World Composition |
| **Vlastník** | World Director |
| **Backup** | Environment Lead, Level Design Director |
| **Review** | Před zahájením Map_01_Landscape_Layout |
| **Poslední změna** | 2026-07-04 |
| **Scope** | Prostorová logika Map 01 — Vertical Slice |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální prostorová logika první mapy |

---

## Účel dokumentu

Tento dokument **není mapa**. Není layoutem. Není level designem v herním smyslu. Není seznamem objektů.

Definuje **prostorové vztahy a logiku kompozice** celé první mapy FarmOS. Odpovídá na otázku:

> **Proč jsou jednotlivé části krajiny rozmístěny právě takto?**

Po schválení tohoto dokumentu vzniká [Map_01_Landscape_Layout.md](Map_01_Landscape_Layout.md) — makrokompozice; poté [Map_01_View_Composition.md](Map_01_View_Composition.md) — kompozice z kamery; detailní rozvržení následuje v `Map_01_Road_Network` a `Map_01_Field_Layout`.

**[RULE]** Map_01_Spatial_Design je **Source of Truth pro prostorovou logiku Map 01**. Žádný dokument níže v hierarchii nesmí měnit tyto principy bez revize tohoto dokumentu nebo nového ADR.

---

## Co dokument neřeší

Implementace, engine, AI, ekonomika, spawn, questy, velikost mapy v metrech, souřadnice objektů, polygonální modely.

---

## Odvození ze závazných dokumentů

| Zdroj | Co Spatial Design přebírá |
|-------|---------------------------|
| [Art Bible](../../00_Strategy/Art_Bible.md) | Čitelnost z výšky, pole jako centrum, isometric management pohled |
| [World Identity Statement](../../00_Strategy/World_Identity_Statement.md) | Přehledná zvlněná krajina, klid, kurátorství, hráč jako správce |
| [ADR-A01 Framework](../../00_Strategy/ADR-A01_Regional_Identity_Framework.md) | Středoevropský venkov — logické hospodaření, ne koláž |
| [Map_01_Design_Bible](Map_01_Design_Bible.md) | Obsah mapy: farma, vesnice, řeka, rybník, pole, les, POI |

Tento dokument **nemění** žádné z výše uvedených rozhodnutí — převádí je do **prostorových pravidel**.

---

## Pozice v hierarchii

```text
Art Bible
        │
World Identity Statement
        │
ADR-A01 Regional Identity
        │
Map_01_Design_Bible
        │
Map_01_Spatial_Design          ← tento dokument
        │
Map_01_Landscape_Layout
        │
POI Guide · Vegetation · Lighting · Asset List
```

---

## 1. Spatial Design Philosophy

Prostorové uspořádání Map 01 vychází z přesvědčení, že **krajina není náhodná** — je výsledkem generací hospodaření, vodních toků, cest a osídlení. Hráč to musí cítit i bez znalosti historie regionu.

### Základní principy

| Princip | Význam |
|---------|--------|
| **Přirozenost** | Každý prvek má důvod být tam, kde je — voda teče dolů, cesty spojují osídlení, pole leží na vhodných půdách |
| **Čitelnost** | Z management výšky musí být okamžitě jasné: kde je farma, kde vesnice, kde pole, kde les, kde voda |
| **Logické vazby** | Farma není uprostřed lesa bez cesty; rybník není na hřebeni kopce; vesnice není izolovaná bez vztahu k okolí |
| **Harmonie** | Prvky se doplňují — žádná dominanta nepřebíjí všechny ostatní; krajina dýchá |
| **Realistické hospodaření** | Prostor odráží konvenční středoevropské zemědělství — velké bloky polí, remízky, louky u vody |
| **Kurátorství** | Realita je uspořádaná — redukujeme chaos, který by narušil klid a orientaci, ne fyzikální logiku |

### Rozhodovací test prostoru

> *„Kdyby tady skutečně hospodařili lidé po generace — a zároveň by tady chtěl hráč trávit hodiny pohledem shora — dávalo by toto uspořádání smysl?"*

Pokud ne — prostor je špatně, i když vypadá hezky na concept artu.

### Vztah k management kameře

Všechny principy jsou psány pro **isometric pohled s zoomem**. Prostor musí fungovat:

- při max oddálení (orientace v krajině),
- při default výšce (denní management),
- při max přiblížení (detail farmy a pole).

---

## 2. Spatial Hierarchy

Krajina Map 01 má **vrstvenou hierarchii dominant**. Každá vrstva plní jinou funkci pro oko i pro orientaci hráče.

### Primární dominanty

Nejsilnější prvky — definují identitu mapy a strukturu prostoru.

| Dominanta | Prostorová funkce |
|-----------|-------------------|
| **Hlavní farma** | **Centrum gravitace** mapy — oko i hráč se k ní vrací; největší souvislá zástavba v hráčově dosahu; kotva emocí i gameplay |
| **Vesnice** | **Kulturní horizont** — signál civilizace; umístěna tak, aby byla čitelná z většiny otevřených polí, typicky na hřebeni nebo svahu |
| **Řeka** | **Lineární osa** krajiny — strukturuje prostor podél směru toku; odděluje nebo spojuje území; vede pohled do hloubky |

**[RULE]** Primární dominanty musí být **vzájemně viditelné** z alespoň jednoho typického výhledu — hráč musí chápat jejich vztah bez mapy.

### Sekundární dominanty

Podporují primární vrstvu — doplňují orientaci a hloubku.

| Dominanta | Prostorová funkce |
|-----------|-------------------|
| **Rybník** | **Vodní kotva** — klidná plocha; kontrast k textuře polí; často mezi farmou a vesnicí nebo v jejich blízkosti |
| **Most** | **Místo přechodu** — bod na ose řeky; paměť místa; spojuje břehy |
| **Mlýn** | **Kulturní uzel u vody** — vazba řeky na lidskou činnost; sekundární silueta |
| **Kostel** | **Nejvyšší bod vesnice** — čitelná věž proti obloze; orientace z dálky |

Sekundární dominanty **nesmí konkurovat** farmě o pozornost v blízkém pásmu — podporují ji z prostřední vzdálenosti nebo horizontu.

### Terciární orientační body

Mikro-kotvy — dávají rytmus a autenticitu, ne globální orientaci.

| Bod | Prostorová funkce |
|-----|-------------------|
| **Alej** | Vede oko; rámuje cestu nebo výhled |
| **Remízek** | Člení pole; měkká hranice mezi plochami |
| **Osamělý strom** | Mikro-dominanta v louce nebo na návrší |
| **Kaplička** | Lidský rozměr mimo vesnici |
| **Lesní cesta** | Vstup do lesa; signál změny prostředí |

Terciární body jsou **hustěji**, ale **tišeji** — nesmí vytvořit vizuální šum.

### Hierarchie v záběru (typický)

```text
Blízké pásmo:     FARMA (primární)
Střední pásmo:    rybník · alej · most · pole (sekundární + negative space)
Horizont:         vesnice + kostel · řeka v údolí (primární + sekundární)
Rámování:         remízky · lesní okraj (terciární)
```

---

## 3. Landscape Rhythm

Monotónní krajina — nekonečné pole bez členění — ničí dlouhodobý zážitek i čitelnost. Map 01 musí mít **rytmus**: střídání ploch, linií, výšek a vegetace.

### Typický rytmický řetězec

```text
Pole (otevřené)
    ↓
Alej nebo remízek (linie)
    ↓
Pole (jiná plodina / stav)
    ↓
Louka (měkčí textura)
    ↓
Remízek (úzký pás)
    ↓
Pole (otevřené)
    ↓
Vesnice na svahu (zástavba)
    ↓
Řeka v údolí (lineární prvek)
    ↓
Lesní okraj (uzavření pohledu)
```

### Pravidla rytmu

| Pravidlo | Aplikace |
|----------|----------|
| **Žádný nekonečný pás** | Stejný typ plochy (obilí) nesmí bez přerušení dominovat celému záběru |
| **Remízek každých N polí** | Mezi velkými bloky ornice musí být členící prvek — remízek, cesta, alej |
| **Střídání textury** | Ornice / zelenina / louka / strniště — vizuální variace v rámci realismu |
| **Vertikální akcent** | Stromy, věž kostela, silo — pravidelně prostupují horizontální rytmus polí |
| **Dech mezi pásmy** | Louka nebo pastvina jako „mezerová" plocha mezi intenzivními poli |

### Rytmus a sezóna

Rytmus musí fungovat ve **všech ročních obdobích** — v zimě, kdy pole jsou holá, nahrazuje remízky a lesní pásy roli texturové variety.

---

## 4. Compression & Expansion

Krajina střídá **uzavřené** a **otevřené** prostory. Tento princip vytváří pocit cesty, objevování a emocionální dech — bez nutnosti level design scripted momentů.

### Princip

```text
LES (uzavřeno — stín, úzkost mírná, intimní)
    ↓
Úzká cesta / remízek (komprese)
    ↓
OTEVŘENÉ POLE (expanze — prostor, světlo, přehled)
    ↓
Vesnice (mírná komprese — struktura, střechy)
    ↓
Stromořadí / alej (rámování — vedení)
    ↓
ŘEKA / LOUKY (expanze — horizont, obloha)
    ↓
Mírný svah s výhledem (maximální expanze)
```

### Proč to funguje

| Efekt | Mechanismus |
|-------|-------------|
| **Orientace** | Po uzavřeném úseku hráč „vystoupí" do otevřeného prostoru a okamžitě znovu načte dominanty |
| **Atmosféra** | Komprese buduje očekávání; expanze přináší úlevu a klid — emoce World Identity |
| **Paměť místa** | Hráč si pamatuje *„za lesem bylo velké pole s vesnicí"* — prostor má příběh |
| **Čitelnost** | Otevřené plochy jsou zónou management rozhodování; uzavřené jsou přechodem |

### Pravidla komprese a expanze

1. **Nejširší expanze** musí obsahovat farmu nebo pohled na farmu — hráč nikdy neztratí kotvu.
2. **Komprese není bludiště** — lesní cesta má výstup do max N sjezdu otevřeného prostoru.
3. **Poměr** — expanze dominuje nad kompresí (cca 60 : 40) — FarmOS je o otevřené krajině, ne o lese.
4. **Řeka a údolí** — přirozená kompresní zóna; louky nad řekou = expanze s vodní osou.

---

## 5. Sightlines

Sightlines jsou **pravidla viditelnosti** — co smí být vidět odkud, a co se má odhalovat postupně.

### Co musí být vidět z dálky (max zoom out)

| Prvek | Proč |
|-------|------|
| Silueta hlavní farmy | Kotva — vždy „doma" |
| Věž kostela / vesnický obrys | Civilizace na horizontu |
| Lesní pás na hřebeni | Hranice krajiny |
| Obloha a horizont | Prostor World Identity |

### Co se odhaluje postupně (pan / zoom)

| Prvek | Kdy |
|-------|-----|
| Rybník | Při panu z farmy směrem k vesnici nebo vodě |
| Most | Při sledování řeky nebo sjezdu do údolí |
| Samoty | Při prozkoumávání periferie — ne z centra mapy |
| Mlýn | Při přiblížení k vodní ose |
| Remízky a detaily polí | Při zoom in |

### Dominanty vždy rozpoznatelné

Z **jakéhokoli typického gameplay záběru** musí hráč do 3 sekund identifikovat:

1. Kde je jeho farma.
2. Kde je nejbližší velké otevřené pole.
3. Kde je vesnice nebo její směr.

### Pravidla horizontu

- Horizont je **vždy viditelný** při pohledu přes otevřené pole — nikdy nezcela zastíněný lesy.
- Vesnice nebo lesní hřeben **protíná horizont** — ne prázdná šedá čára.
- Výškový profil horizontu je **měkký** — žádné ostré horské štíty.

### Zakázané sightlines

- Farma zcela skrytá za lesy z default pohledu.
- Vesnice neviditelná z žádného otevřeného pole.
- Dvě primární dominanty stejné vizuální váhy v jednom záběru bez hierarchie.

---

## 6. Visual Anchors

Visual anchors jsou **opakovatelné orientační signály** — systém, ne jednotlivé objekty.

### Systém kotví

| Kotva | Typ | Význam |
|-------|-----|--------|
| **Kostel — věž** | Kulturní | „Tam je vesnice" — vertikální linie proti obloze |
| **Silo farmy** | Funkční | „Tam je má farma" — nejvyšší prvek dvora |
| **Rybník** | Přírodní-vodní | Klidná plocha — odlišná od pole i lesa |
| **Most** | Infrastrukturní | Přechod — bod na mapě mentální cesty |
| **Starý statek / samota** | Kulturní | Rozptýlené osídlení — živost krajiny |
| **Velký dub (solitér)** | Přírodní | Mikro-kotva v otevřené krajině |
| **Lesní mýtina** | Přírodní | Změna prostředí uvnitř lesa — orientace v kompresi |

**Poznámka:** „Větrný strom" jako kotva — pouze pokud odpovídá středoevropské krajině v kontextu Map 01; není povinný prvek. Solitérní dub nebo lípa je preferovanější.

### Pravidla kotví

1. Každá kotva má **jednu primární roli** — kostel neorientuje k vodě.
2. Kotvy jsou **rozptýlené** — ne všechny v jednom clusteru.
3. **Silo a kostel** nesmí splývat v siluetě z běžných úhlů.
4. Vodní kotva (rybník) je **nejblíže farmě** nebo na cestě mezi farmou a vesnicí.

---

## 7. Natural Framing

Přírodní prvky **vedou pohled** — výhledy jsou komponované, ne náhodné.

### Nástroje rámování

| Prvek | Jak rámuje |
|-------|------------|
| **Alej** | Tunel nebo koridor směrem k vesnici, rybníku nebo výhledu |
| **Remízek** | Vertikální pás oddělující pole — vede oko podél hranice |
| **Skupina stromů** | Rámuje jednu stranu záběru — „okno" do krajiny |
| **Křoviny u vody** | Spodní rámování rybníka nebo potoka |
| **Svah** | Horní nebo dolní hrana záběru — vede k řece v údolí |

### Pravidla rámování

1. **Výhled z farmy** — alespoň jeden přirozený rám (alej, remízek) směrem k horizontu.
2. **Výhled k vesnici** — vesnice je v „okně" mezi poli nebo stromy, ne uprostřed monotónní textury.
3. **Rybník** — částečně rámován vegetací; nikdy holá modrá tečka bez kontextu.
4. **Řeka** — viditelná jako linie v údolí — svahy jako přirozený rám.

### Co rámování není

- Náhodný strom uprostřed výhledu bez kompozičního důvodu.
- Les, který blokuje všechny výhledy z farmy.
- Symetrie jako architektonický park — krajina je organická, ne formální zahrada.

---

## 8. Player Reading

Hráč Map 01 **nečte mapu v UI** — čte krajinu. Prostor musí být intuitivní bez tutoriálu orientace.

### První pohled (0–10 sekund)

| Pořadí | Kam oko směřuje | Proč |
|--------|-----------------|------|
| 1 | Hlavní farma | Nejsilnější silueta v blízkém pásmu; startovní kotva |
| 2 | Nejbližší pole | Kontrast ornice / plodiny kolem farmy |
| 3 | Horizont — vesnice nebo les | Kontext „kde jsem" |

### Co přitáhne pozornost (priorita)

1. **Pohyb** (stroj, worker) — vždy nad statickou krajinou.
2. **Kontrast** — zlaté pole vs. zelená louka; voda vs. země.
3. **Vertikála** — věž, silo, solitér.
4. **Světlo** — odlesk na rybníku.

### Jak hráč pozná důležitá místa bez mapy

| Místo | Signál |
|-------|--------|
| Farma | Největší zástavba v dosahu; silo; dvůr |
| Vesnice | Kostel na horizontu; shluk střech |
| Voda | Rybník jako plocha; řeka v údolí jako tmavší linie |
| Les | Souvislý tmavší pás — hranice obhospodařované krajiny |
| Cesta | Světlejší linie v poli nebo mezi remízky |

### Orientace bez mapy — mentální model

Hráč si buduje model:

```text
„Farma je uprostřed mého světa.
 Pole jsou kolem ní.
 Vesnice je tam, kde vidím kostel.
 Voda je v údolí — pod kopcem.
 Les je na okraji — tam končí pole."
```

Pokud tento model nefunguje z libovolného běžného záběru, spatial design selhává.

---

## 9. Landmark Density

Příliš málo dominant = monotónní krajina. Příliš mnoho = chaos. Map 01 potřebuje **vyváženou hustotu**.

### Tři úrovně hustoty

| Úroveň | Počet (orientačně) | Příklady | Pravidlo |
|--------|-------------------|----------|----------|
| **Významné dominanty** | 3–4 na celou mapu | Farma, vesnice, řeka, rybník | Vždy čitelné; nikdy konkurenční v jednom záběru |
| **Menší orientační body** | 5–8 | Most, mlýn, samoty, alej, kostel jako detail | Podporují; ne přebíjí |
| **Přírodní zajímavosti** | rozptýleně | Solitér, kaplička, lesní mýtina, propustek | Autenticita; max 1–2 viditelné v jednom záběru |

### Pravidla hustoty

1. **Jeden záběr = jedna primární dominanta** — ostatní v pozadí nebo mimo záběr.
2. **Minimální vzdálenost mezi významnými dominantami** — nesmí splývat v jedné siluetě (kvalitativně: kostel a silo musí být rozpoznatelné zvlášť).
3. **Periférie** může být řidší — centrum hráčovy pozornosti (farma + okolní pole) je hustší na informace.
4. **Terciární body** nesmí vytvořit „šachovnici" zajímavostí — jsou v rytmu krajiny, ne na gridu.

### Test hustoty

> Při max zoom out: hráč spočítá na prstech jedné ruky významné prvky a okamžitě ví, co který znamená.

---

## 10. Negative Space

Prázdný prostor — velké pole, louka, obloha, hladina rybníka — **není chyba**. Je to nosič klidu, čitelnosti a identity FarmOS.

### Funkce negative space

| Prostor | Funkce |
|---------|--------|
| **Velké pole** | Canvas pro gameplay čitelnost; pole jsou hra |
| **Louka** | Dech mezi intenzivními plochami; měkčí emoce |
| **Otevřený horizont** | Prostor World Identity — „čerstvý vzduch" |
| **Hladina vody** | Klid; kontrast k busyness farmy |
| **Obloha** | Minimálně třetina záběru při širokém pohledu |

### Pravidla negative space

1. **Nezahlcovat** — každé prázdné pole nemusí mít objekt uprostřed.
2. **Nezastavovat** — velké plochy zůstávají otevřené; stavby na okrajích.
3. **Kurátorovat, ne mazat** — negative space je uspořádaný, ne opuštěný (stopy práce, remízky na okrajích).
4. **Poměr** — otevřená plocha dominuje nad zástavbou — zemědělská krajina, ne vesnická urbanizace.

### Negative space vs. monotónnost

Negative space ≠ nudné pole bez rytmu. Prázdná plocha musí mít **hranici** (remízek, cesta, svah) a **kontext** (co hráč na poli dělá).

---

## 11. Spatial Anti-Patterns

Map 01 se musí vyhnout následujícím prostorovým chybám. Nejde o blacklist assetů — jde o **chybnou logiku rozmístění**.

| Anti-pattern | Proč je problém |
|--------------|-----------------|
| **Náhodné rozmístění objektů** | Krajina působí jako asset dump, ne jako místo |
| **Příliš mnoho dominant vedle sebe** | Oko neví, kam se dívat; porušení hierarchie |
| **Dlouhé monotónní pásy polí** | Únava; ztráta rytmu; narušení dlouhodobé hry |
| **Les bez struktury** | Komprese bez výstupu; tmavá zeď bez cesty |
| **Náhodné zatáčky cest** | Cesty bez cíle; narušení logiky hospodaření |
| **Izolované budovy bez logiky** | Samota bez cesty, bez pole, bez vody — neuvěřitelné |
| **Rybník bez vazby na krajinu** | Vodní plocha „nalepená" — chybí přítok, okolí, důvod |
| **Farma skrytá v údolí** | Ztráta čitelnosti z výšky; farma musí být vidět |
| **Vesnice uprostřed pole bez vazby** | Historicky a vizuálně nepravděpodobné |
| **Řeka bez údolí** | Porušení fyzické logiky reliéfu |
| **Symetrický „herní" layout** | FarmOS je organická krajina, ne šachovnice |
| **Stejná výška všeho** | Ztráta hloubky; údolí řeky musí být čitelné |
| **Křižující sightlines bez hierarchie** | Dva „centra" mapy — hráč zmaten |

**[RULE]** Každý anti-pattern je důvod k revizi layoutu — ne k výjimce „protože asset už existuje".

---

## 12. Spatial Review Checklist

Použít při review [Map_01_Landscape_Layout.md](Map_01_Landscape_Layout.md) a každé iterace blockoutu. Všechny položky musí být **ano**.

### Čitelnost a hierarchie

- [ ] Je krajina čitelná z management výšky v celém rozsahu zoomu?
- [ ] Jsou dominanty správně odstupňované (primární / sekundární / terciární)?
- [ ] Farma je okamžitě rozpoznatelná jako centrum?
- [ ] Vesnice a řeka jsou čitelné z otevřených polí?

### Prostorový zážitek

- [ ] Má hráč dostatek výhledů a expanzních momentů?
- [ ] Má svět rytmus — střídání polí, remízků, louk, lesů?
- [ ] Funguje střídání komprese a expanze?
- [ ] Je orientace intuitivní bez mapy?

### Příroda a logika

- [ ] Jsou přírodní prvky logicky rozmístěné (voda v údolí, les na hřebeni)?
- [ ] Cesty spojují osídlení a pole — ne vedou do ničeho?
- [ ] Rybník a řeka mají vazbu na reliéf a okolí?

### Identita FarmOS

- [ ] Má krajina dostatek vizuálního klidu (negative space)?
- [ ] Odpovídá [World Identity Statement](../../00_Strategy/World_Identity_Statement.md)?
- [ ] Odpovídá [Map_01_Design_Bible](Map_01_Design_Bible.md)?
- [ ] Žádný spatial anti-pattern z sekce 11?

### Zkrácený test (5 otázek)

```text
1. Vím, kde je farma?          → ano / ne
2. Vím, kde jsou pole?         → ano / ne
3. Vím, kde je vesnice?        → ano / ne
4. Cítím prostor a klid?       → ano / ne
5. Chci zoomovat blíž?        → ano / ne
```

---

## Source of Truth — shrnutí

| Téma | Autorita |
|------|----------|
| Prostorová logika Map 01 | **Tento dokument** |
| Obsah a charakter mapy | [Map_01_Design_Bible](Map_01_Design_Bible.md) |
| Filozofie světa | [World Identity Statement](../../00_Strategy/World_Identity_Statement.md) |
| Konkrétní rozvržení terénu | Map_01_Landscape_Layout (až po schválení tohoto dokumentu) |

---

## Otevřené otázky před Landscape Layout

Tyto body Spatial Design **nezamyká** — řeší je až Layout v rámci pravidel tohoto dokumentu:

| ID | Otázka | Vazba na princip |
|----|--------|------------------|
| S01 | Relativní poloha farmy vůči řece (nad údolím / na břehu / oddělená polem) | Sightlines, komprese/expanze |
| S02 | Je vesnice vlevo nebo vpravo od farmy z default pohledu | Player reading, rytmus |
| S03 | Rybník blíže k farmě nebo k vesnici | Visual anchors, hierarchie |
| S04 | Kde je jediný „max expanze" výhled (vyhlídka) | Compression & expansion |
| S05 | Kolik samot a v jakém pásmu (blízko farmy vs. periférie) | Landmark density |
| S06 | Šířka hlavního lesního pásu na horizontu | Horizont, negative space |

---

## Shrnutí

### 1. Proč je dokument potřeba před Landscape Layout

Design Bible říká **co** mapa obsahuje. Spatial Design říká **jak spolu prvky prostorově souvisí a proč**. Bez této vrstvy by Layout řešil umístění objektů na mapu ad hoc — výsledkem by byl asset dump s hezkými jednotlivostmi, ale bez sjednocené prostorové inteligence. AAA studia oddělují **world composition** od **layout** právě proto, aby level designéři a environment artisté sdíleli stejná pravidla před kreslením první čáry.

### 2. Jak zabrání náhodnému rozmístění

Hierarchie dominant, rytmus krajiny, sightlines, landmark density a spatial anti-patterns vytvářejí **testovatelný rámec**. Každý budoucí objekt musí odpovědět: jakou roli hraje v hierarchii, jak ovlivňuje rytmus, zda porušuje anti-pattern. Náhodné „dáme rybník sem, protože je to hezké" bez odpovědi na tyto otázky je zakázáno.

### 3. Co bude při tvorbě Layout již uzamčeno

- Filozofie prostorového uspořádání (sekce 1)
- Hierarchie primární / sekundární / terciární dominant (sekce 2)
- Principy rytmu a střídání ploch (sekce 3)
- Logika komprese a expanze (sekce 4)
- Pravidla sightlines a horizontu (sekce 5)
- Systém visual anchors (sekce 6)
- Pravidla natural framing (sekce 7)
- Model player reading (sekce 8)
- Landmark density limits (sekce 9)
- Hodnota negative space (sekce 10)
- Spatial anti-patterns (sekce 11)
- Review checklist (sekce 12)

Layout **řeší pouze** konkrétní uspořádání v rámci těchto pravidel — ne principy.

### 4. Otevřené otázky před rozvržením

S01–S06: relativní poloha farmy k řece a vesnici, umístění rybníka, pozice max výhledu, počet a pásmo samot, šířka lesního horizontu. Tyto volby Layout dokument vyřeší — Spatial Design definuje **jak o nich rozhodovat**, ne finální odpověď.

---

## Související dokumenty

- [Map_01_Design_Bible.md](Map_01_Design_Bible.md)
- [World_Identity_Statement.md](../../00_Strategy/World_Identity_Statement.md)
- [Art_Bible.md](../../00_Strategy/Art_Bible.md)
- [Maps/README.md](../README.md)
- [00_INDEX.md](../../00_INDEX.md)
