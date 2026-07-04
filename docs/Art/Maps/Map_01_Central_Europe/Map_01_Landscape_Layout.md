# Map 01 — Landscape Layout

## Macro Layout Study

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Typ** | Macro Layout / Kompoziční studie |
| **Vlastník** | World Director |
| **Backup** | Environment Lead, Level Design Director |
| **Review** | Před detailním Field Layout a POI Guide |
| **Poslední změna** | 2026-07-04 |
| **Mapa** | Map 01 — Central Europe (Vertical Slice) |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Makrokompozice: 5 variant, doporučení Varianta A |

---

## Účel dokumentu

Navrhnout **makrokompozici** první mapy FarmOS — hledání nejlepšího prostorového uspořádání hlavních celků krajiny.

**Není to:** finální rozmístění objektů, souřadnice, metry, implementace, detail budov ani stromů.

**Je to:** koncepční rozvržení vztahů mezi farmou, vesnicí, vodou, lesy, poli a komunikacemi — podklad pro `Map_01_Field_Layout`, `Map_01_POI_Guide`, `Map_01_Road_Network`.

**[RULE]** Tento dokument je **Source of Truth pro makro layout Map 01**. Odvozuje se z [Map_01_Spatial_Design.md](Map_01_Spatial_Design.md) a **nesmí** měnit závazné strategické dokumenty.

---

## Závazné zdroje

| Dokument | Co layout musí respektovat |
|----------|---------------------------|
| [Art Bible](../../00_Strategy/Art_Bible.md) | Čitelnost, pole jako centrum, klid |
| [World Identity Statement](../../00_Strategy/World_Identity_Statement.md) | Zvlněná krajina, kurátorství, správce |
| [ADR-A01](../../00_Strategy/ADR-A01_Regional_Identity_Framework.md) | Střední Evropa, vlastní identita |
| [Map_01_Design_Bible](Map_01_Design_Bible.md) | Obsah mapy, POI, land use |
| [Map_01_Spatial_Design](Map_01_Spatial_Design.md) | Hierarchie, rytmus, sightlines, anti-patterns |

---

## Legenda schémat

```text
[FARMA]     Hlavní farma hráče
[VES]       Vesnice (náves + kostel)
[ŘEKA]      Hlavní říční tok (údolí)
[RYB]       Rybník
[LES]       Lesní masiv / lesní okraj
[POLE]      Hlavní orná / plodiny
[LOUKA]     Louka / pastvina
[===]       Silnice II./III. třídy
[---]       Polní / lesní cesta
```

Směr „nahoře" = **horizont / dálka od startovní farmy** (typicky sever nebo severovýchod v mentálním modelu hráče).

---

# Část I — Varianty makrokompozice

## Varianta A — „Návrší a údolí"

### Schéma

```text
                    [LES]    [VES + kostel]
                      \         |
         horizont →    [LOUKA]-[ŘEKA v údolí]-[LES]
                              /   |
                    [POLE]--[most]--[POLE]
                       \    |    /
                        [POLE][POLE]
                           |
                      [FARMA][RYB]
                           |
                    [=== silnice ===]--→ (mimo mapu)
                           |
                    [POLE] [alej] [POLE]
```

### Hlavní myšlenka

Farma stojí na **mírném návrší** s výhledem do údolí řeky. Vesnice je na **protějším svahu** — čitelná na horizontu. Pole se rozprostírají **mezi a kolem farmy** směrem k údolí. Rybník u farmy. Řeka strukturuje prostor jako osa údolí.

### Silné stránky

- Nejlepší **sightline** z farmy: pole → údolí → vesnice na hřebeni.
- Farma jako **centrum gravitace** na vyvýšeném místě — management čitelnost.
- Přirozená **komprese/expanze**: sjezd k řece, výhled z návrší.
- Silná **hierarchie dominant** dle Spatial Design.

### Slabé stránky

- Vyžaduje **pečlivý reliéf** — špatně navržený svah může skrýt pole.
- Větší **vertikální rozdíl** než u ostatních variant — nutná kontrola isometric čitelnosti.

### World Identity

Otevřené pole, klid, velký výhled — přímo podporuje „prostor" a „čerstvý vzduch". Kurátorovaná idyla bez dramatických hor.

### Spatial Design

Primární dominanty (farma, vesnice, řeka) vzájemně viditelné. Rytmus pole–údolí–horizont. Negative space v polích mezi farmou a řekou.

### Zážitek hráče

*„Stojím na své farmě a vidím svá pole, vesnici v dálce a řeku v údolí."* Okamžitý pocit správce krajiny.

---

## Varianta B — „Říční osa"

### Schéma

```text
[VES]---[===]---[LES]
  |              |
[RYB]          [POLE]
  |              |
[ŘEKA=========ŘEKA]  ← hlavní osa mapy
  |              |
[POLE]         [POLE]
  |              |
[FARMA]--------[LOUKA]
  |
[===]
```

### Hlavní myšlenka

Krajina je organizována **podél toku řeky**. Farma na jednom břehu, vesnice na druhém nebo v blízkosti mostu. Pole do záplavové roviny a svahů.

### Silné stránky

- Velmi **přirozená** logika (osídlení u vody).
- Jasná **orientace** — řeka jako osa.
- Snadné **panoráma** podél toku.

### Slabé stránky

- Farma a vesnice mohou **konkurovat** v jedné ose pohledu.
- Riziko **úzkého** layoutu — méně expanze pole.
- Horizont může být **příliš lineární** — monotónní rytmus.

### World Identity / Spatial Design

Věrohodná, ale méně „management panorama" — spíš průvodce podél vody.

### Zážitek hráče

*„Moje farma je u řeky, vesnice je přes most."* Intimní, méně epické panorama.

---

## Varianta C — „Sousedský svazek"

### Schéma

```text
              [LES]
                |
    [POLE]--[VES]--[POLE]
         \    |    /
          [FARMA-RYB]
               |
         [POLE][POLE][POLE]
               |
          [ŘEKA v dálce]
               |
            [LOUKA]
```

### Hlavní myšlenka

Farma a vesnice tvoří **blízký dvojcentrum** — sousední usedlosti v jedné krajině. Pole obklopují obě. Řeka na periferii.

### Silné stránky

- Silný **sociální kontext** — farma není izolovaná.
- **Kompaktní** — rychlá orientace.
- Dobrá **čitelnost** vztahu farma–vesnice.

### Slabé stránky

- Méně **prostoru** a velkých výhledů — porušuje World Identity „prostor".
- Horizont **slabší** — vesnice příliš blízko, méně expanze.
- Riziko **přeplněného** blízkého pásma — landmark density.

### Zážitek hráče

*„Sousedím s vesnicí."* Příjemné, ale méně „svět, do kterého chcete zoomovat".

---

## Varianta D — „Lesní rám"

### Schéma

```text
[LES][LES][LES][VES][LES]
[LES]  [POLE][POLE]  [LES]
[LES]  [POLE][FARMA]  [LES]
[LES]  [RYB][POLE]   [LES]
[LES]--[ŘEKA]--[LOUKA]--[LES]
         [===]
```

### Hlavní myšlenka

Les **obklopuje** otevřenou krajinnou mísu — farma a pole v „míse", vesnice v zářezu lesa na horizontu.

### Silné stránky

- Silné **rámování** a komprese/expanze (výjezd z lesa na pole).
- Dramatický **kontrast** les / pole.
- Vesnice v **lesním zářezu** — malebné.

### Slabé stránky

- Příliš mnoho **komprese** — les může dusit management pohled.
- Horizont **často zastíněn** — porušení sightline pravidel.
- Méně otevřené **negative space** — konflikt s identitou FarmOS.

### Zážitek hráče

*„Jsem v kotlině obklopené lesy."* Krásné, ale těsnější než cílová identita.

---

## Varianta E — „Vodní trojúhelník"

### Schéma

```text
           [VES]
             |
    [POLE]--[RYB]--[POLE]
          \  |  /
           \[ŘEKA]/
            /    \
      [FARMA]----[LOUKA]
          |        |
       [POLE]    [LES]
          |
       [===]
```

### Hlavní myšlenka

**Rybník a řeka** tvoří vodní jádro mezi farmou a vesnicí. Pole radiálně kolem.

### Silné stránky

- Silné **vodní kotvy** — klid, odrazy.
- **Vyvážená** kompozice tří center (farma, voda, vesnice).
- Dobrá **vizuální rozmanitost**.

### Slabé stránky

- Rybník může **konkurovat** farmě o pozornost v blízkém pásmu.
- Složitější **logika** odvodnění — rybník + řeka musí dávat hydrologický smysl.
- Riziko **příliš mnoha dominant** v střední vzdálenosti.

### Zážitek hráče

*„Voda je srdcem krajiny."* Klidné, ale rybník může přebíjet farmu.

---

# Část II — Porovnání variant

Hodnocení škála **1–5** (5 = nejlépe). Váhy rovné — finální vážení až na review workshopu.

| Kritérium | A Návrší | B Řeka | C Soused | D Les | E Voda |
|-----------|:--------:|:------:|:--------:|:-----:|:------:|
| **Čitelnost** | 5 | 4 | 4 | 3 | 3 |
| **Přirozenost** | 5 | 5 | 4 | 4 | 3 |
| **Orientace** | 5 | 4 | 5 | 3 | 3 |
| **Kompozice** | 5 | 3 | 3 | 4 | 4 |
| **Potenciál rozšíření** | 4 | 4 | 3 | 3 | 3 |
| **Vizuální rozmanitost** | 4 | 3 | 3 | 5 | 4 |
| **Vhodnost pro první mapu** | 5 | 4 | 3 | 2 | 3 |
| **Součet** | **33** | **27** | **25** | **24** | **23** |

### Poznámky k hodnocení

- **Čitelnost:** Varianta A maximalizuje pohled z farmy na pole a horizont — core management zážitek.
- **Kompozice:** A implementuje hierarchii a rytmus ze Spatial Design nejpřesněji.
- **Vhodnost pro první mapu:** A je nejbezpečnější etalon — jasná struktura, minimální riziko reworku identoty.
- **Vizuální rozmanitost:** D a E vyšší, ale na úkor čitelnosti — pro VS není prioritní.

**Žádná varianta není perfektní.** A vyhrává na součtu, ale vyžaduje kvalitní reliéf. B je silná alternativa, pokud by test čitelnosti svahu u A selhal.

---

# Část III — Doporučení

## Doporučená varianta: **A — „Návrší a údolí"**

### Zdůvodnění

1. **Nejlépe naplňuje Spatial Design** — primární dominanty (farma, vesnice, řeka) v jasné trojúhelníkové vztahové struktuře s maximální vzájemnou viditelností z otevřených polí.
2. **Nejlépe naplňuje World Identity** — velký výhled, otevřená pole, klidný horizont s vesnicí; farma na návrší = pocit správce.
3. **Nejlepší etalon pro franchise** — struktura „farma na návrší → pole → údolí → vesnice na horizontu" je opakovatelný jazyk pro budoucí mapy.
4. **Nejlepší player reading** — start na farmě, okamžitý přehled polí, vesnice jako cíl na horizontu, řeka jako osa údolí.
5. **Nejvyšší skóre** v porovnání bez extrémního kompromisu v jedné oblasti.

### Rizika volby A

| Riziko | Mitigace |
|--------|----------|
| Svah skrývá pole z kamery | Testovat v blockoutu; svahy mírné, pole orientovaná směrem k farmě |
| Příliš velký výškový rozdíl | Držet „jemně zvlněné" — údolí jako mělká proláklin, ne kaňon |
| Vesnice příliš daleko emocionálně | Silná silueta kostela; rybník a cesta jako vizuální spojnice |
| Monotónní pole mezi farmou a řekou | Rytmus remízků a střídání plodin dle Spatial Design |

### Silná alternativa

**Varianta B** — pokud blockout A ukáže problémy se svahy, B zachová řeku jako osu bez nutnosti návrší.

---

# Část IV — Rozpracování varianty A (koncepční)

## Hlavní farma

### Role

**Centrum gravitace** mapy — emocionální kotva, gameplay hub, nejsilnější silueta v blízkém pásmu.

### Vztahové umístění

- Na **mírném návrší** — výhled dolů na pole a do údolí.
- **Před farmou** (směrem k hráči / jih): hlavní pole a příjezdová silnice.
- **Za farmou / po stranách**: rybník v těsné blízkosti (východ nebo jihovýchod); remízky.
- **Pohled z farmy dopředu**: pole klesají k údolí řeky; na protějším svahu vesnice.
- **Není v záplavové zóně** — nad úrovní řeky, logická historická poloha statku.

---

## Vesnice

### Vztah ke krajině

- Na **protějším svahu** nad údolím řeky — typická poloha vesnice s výhledem na pole.
- **Kostel** nejvyšší bod — čitelný z většiny polí.
- Náves **kompaktní** — 8–15 domů koncepčně, bez měřítka.
- **Les** za vesnicí na hřebeni — uzavírá horizont.

### Propojení s farmou

- **Silnice III. třídy** — od farmy podél údolí, most přes řeku, stoupá k vesnici.
- **Vizuální spoj** — cesta čitelná z výšky jako světlá linie.
- **Emoční vztah** — sousední komunita v dosahu, ne přilepená k dvoru.

---

## Pole

### Seskupení

- **Blok A** — těsně u farmy: hlavní orná půda hráče (startovní gameplay pole).
- **Blok B** — mezi farmou a řekou: větší souvislá plocha — „velké pole" pro expanzi a panorama.
- **Blok C** — za řekou / na protějším svahu pod vesnicí: menší blok — vizuální hloubka, ne nutně hráčovo na startu.
- **Remízky** mezi bloky — rytmus dle Spatial Design.

### Vazba na komunikace

- Polní cesty **kolmé i rovnoběžné** s údolím — přístup ze silnice na každý blok.
- **Tire logic** — hlavní příjezd z silnice k farmě, odbočky na pole.

---

## Lesy

### Rámování

- **Lesní pás za vesnicí** — horizontální uzavření pohledu.
- **Lesní okraj** na jedné boční straně mapy (západ nebo východ) — boční rám.
- **Remízky** — ne souvislý prales uprostřed polí.

### Panoramata

- Z farmy: les viditelný **jen na hřebeni** — neblokuje pole.
- Z údolí řeky: les rámuje **horní třetinu** záběru.
- Lesní cesta jako **komprese** — výstup na louku nebo pole.

---

## Vodní prvky

### Řeka

- Teče **údolím** mezi farmou a vesnicí — od periferie mapy (vstup) k periferii (výstup).
- **Jeden hlavní most** — silnice III. třídy; sekundární propustka pro potok.
- Kotva **lineární orientace** — hráč sleduje tok.

### Rybník

- **U farmy** — na návrší nebo jeho patě; napájen potokem z vyššího terénu.
- Vizuálně **nejblíž hráči** vodní prvek — klid, odraz oblohy.
- **Nepřekrývá** siluetu farmy z default pohledu.

### Potoky a mokřady

- Feeder rybníka a řeky — v loukách mezi poli.
- **Mokřad** u vtoků do řeky — autenticita, ne překážka.

---

## Silniční síť (logika)

| Úsek | Typ | Funkce |
|------|-----|--------|
| Příjezd k farmě | Silnice III. třídy | Spojení s okolím mimo mapu; hlavní tepna |
| Farmě → most | Silnice III. třídy | Podél údolí |
| Most → vesnice | Silnice III. třídy | Stoupá k návsi |
| Mezi poli | Polní cesty | Přístup k blokům A, B, C |
| Do lesa | Lesní cesta | Komprese; dead-end nebo průchod k samotě |
| K rybníku | Polní / újezdová | Servis rybníka a farmy |

**[RULE]** Každá cesta má **cíl** — farmu, pole, vesnici, most, samotu. Cesta bez cíle je zakázána.

---

## Výhledy

| ID | Pozice (koncepční) | Co hráč vidí | Typ |
|----|-------------------|--------------|-----|
| **V1** | Default — nad farmou | Farma, pole A, údolí, vesnice na horizontu | Startovní panorama |
| **V2** | Max zoom out z farmy | Celá struktura mapy — pole, řeka, les, obloha | Expanze |
| **V3** | U rybníka | Voda, farma v rámu, pole | Intimní klid |
| **V4** | U mostu | Řeka, cesta, svahy, vesnice nahoře | Kompozice přechodu |
| **V5** | Vyhlídka na bočním návrší | Panorama polí — „velké pole" B | Max expanze dle Spatial Design |
| **V6** | Pohled zpět k farmě z cesty k vesnici | Farma jako cíl — domů | Návratová kotva |

---

## Přirozené hranice

| Směr | Charakter | Efekt |
|------|-----------|-------|
| **K horizontu (k vesnici)** | Les na hřebeni, vesnice, obloha | Uzavření s dýcháním — svět pokračuje |
| **Podél řeky** | Tok mizí za vegetací / mírným ohybem | Otevřená osa |
| **Boční strany** | Lesní pás nebo louky + vzdalující se pole | Měkké hranice — mapa není krabice |
| **Za farmou (dozadu)** | Silnice odcházející z mapy | Spojení s větším světem |

Mapa působí **otevřeně** na pole a oblohu, **uzavřeně** lesním hřebenem — klasická kotlinová krajina bez pocitu klecě.

---

# Macro Layout Review

Checklist — doporučená varianta A musí splnit vše před přechodem na detailní layout.

### Art Bible

- [ ] Pole jsou vizuální centrum — ano, bloky A a B dominují.
- [ ] Čitelnost z management výšky — návrší farmy umožňuje přehled.
- [ ] Klidný tón — otevřená krajina, žádná městská zástavba.

### World Identity Statement

- [ ] Inspirováno realitou s kurátorovanou idealizací — středoevropský svazek, ne chaos.
- [ ] Prostor a velké výhledy — V2, V5.
- [ ] Hráč jako správce — farma na návrší.

### ADR-A01 (Střední Evropa)

- [ ] Konvenční zemědělství, smíšený les, vesnice + samoty — ano.
- [ ] Vlastní identita — syntéza, ne jeden stát.

### Map_01_Spatial_Design

- [ ] Hierarchie dominant — farma / vesnice / řeka primární.
- [ ] Rytmus krajiny — remízky, střídání bloků.
- [ ] Compression & expansion — lesní cesta, údolí, otevřená pole.
- [ ] Sightlines — V1–V6 definované.
- [ ] Negative space — blok B.
- [ ] Žádný spatial anti-pattern — kontrolováno v porovnání variant.

---

# Otevřená rozhodnutí

Před **detailním** layoutem (`Field_Layout`, `POI_Guide`, `Road_Network`) musí být rozhodnuto:

| ID | Otázka | Dopad |
|----|--------|-------|
| L01 | Přesná strana rybníka vůči farmě (východ / jihovýchod) | Blockout, POI |
| L02 | Počet a poloha samot (1–2) — periférie vs. cesta k lesu | POI Guide |
| L03 | Mlýn — u řeky mezi farmou a vesnicí, nebo u rybníka | POI, budovy |
| L04 | Dominantní plodina bloku B v letním etalonu (obilí / řepka / mix) | Vegetation, Color |
| L05 | Boční lesní pás — západ nebo východ mapy | Kompozice, slunce |
| L06 | Jedna vs. dvě polní mosty / brody | Road Network |
| L07 | Rozsah hráčova vlastnictví pole na startu (jen A, nebo A+B) | Game Design vstup — mimo tento doc, ale ovlivní layout |
| L08 | Schválení varianty A po blockout review — nebo fallback na B | Makro layout freeze |

**Uzamčeno tímto dokumentem (po schválení):** varianta A, vztah farma–údolí–vesnice, role rybníka u farmy, řeka jako osa, logika silnic, koncepce výhledů V1–V6.

---

# Shrnutí

### 1. Proč varianta A

Nejvyšší skóre v čitelnosti, kompozici a vhodnosti pro první mapu; nejlépe implementuje Spatial Design a World Identity; dává hráči okamžitý pocit správce na návrší s výhledem na pole a vesnici.

### 2. Dlouhodobá vize FarmOS

Struktura „návrší–údolí–horizont" se stává **opakovatelným jazykem** franchise — budoucí mapy mohou variovat reliéf a poměry, ne princip. Map 01 jako etalon nastavuje laťku identoty.

### 3. Navazující dokumenty

| Dokument | Priorita |
|----------|----------|
| [Map_01_Master_Plan.md](Map_01_Master_Plan.md) | **SoT produkce** — sjednocení všech rozhodnutí |
| [Map_01_Agricultural_Master_Plan.md](Map_01_Agricultural_Master_Plan.md) | **SoT zemědělské logiky** |
| `Map_01_Road_Network.md` | **Aktuální** — logika pohybu | World Director |
| `Map_01_Field_Layout.md` | **Uzavřeno** — SoT parcel | Level Design |
| `Map_01_POI_Guide.md` | Po Field Layout |
| `Map_01_Vegetation.md` | Střední |
| `Map_01_Lighting.md` | Střední |
| `Map_01_Asset_List.md` | Po POI a Field Layout |

### 4. Otevřené otázky před konkrétní mapou

L01–L08: strana rybníka, samoty, mlýn, plodina etalonu, orientace lesa, mosty, scope vlastnictví polí, potvrzení A po blockoutu.

---

## Související dokumenty

- [Map_01_Design_Bible.md](Map_01_Design_Bible.md)
- [Map_01_Spatial_Design.md](Map_01_Spatial_Design.md)
- [Map_01_View_Composition.md](Map_01_View_Composition.md)
- [Map_01_Master_Plan.md](Map_01_Master_Plan.md)
- [Map_01_Agricultural_Master_Plan.md](Map_01_Agricultural_Master_Plan.md)
- [Map_01_Road_Network.md](Map_01_Road_Network.md)
- [Map_01_Field_Layout.md](Map_01_Field_Layout.md)
- [Map_Design_Principles.md](../00_Map_Guidelines/Map_Design_Principles.md)
- [Maps README](../README.md)
