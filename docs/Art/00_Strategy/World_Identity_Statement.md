# World Identity Statement — FarmOS

## Vision Lock

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Tier** | T0 |
| **Preprodukční fáze** | 1 — Creative Direction |
| **Priorita** | **#1b — po Art Bible, před ADR-A01** |
| **Vlastník** | Art Director |
| **Backup** | Environment Lead |
| **Review** | Před workshopem ADR-A01; ročně |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální Vision Lock — filozofie světa bez výběru regionu |

---

## Účel tohoto dokumentu

Tento dokument odpovídá na jedinou otázku:

> **Jaký svět FarmOS vlastně vytváříme?**

Není to Environment Bible — nepopisuje konkrétní krajinu, biomy ani layout mapy.  
Není to Lore — nevypráví příběh postav ani historii místa.  
Není to Game Design — neřeší mechaniky, ekonomiku ani progression.

Je to **Vision Lock**: uzamčení filozofie světa **dříve**, než bude vybrán konkrétní region v [ADR-A01](ADR-A01_Regional_Identity_Framework.md).

**[RULE]** World Identity Statement je jedinou autoritou pro filozofii světa, míru realismu, úroveň idealizace, charakter krajiny a emocionální identitu. Regionální identitu řeší až ADR-A01.

---

## Pozice v hierarchii

```text
Art Bible                    ← ústava grafiky (proč a jaký typ hry)
       │
       ▼
World Identity Statement     ← tento dokument (jaký svět vytváříme)
       │
       ▼
ADR-A01 Regional Identity    ← který konkrétní evropský svět
       │
       ▼
Environment Bible            ← jak krajina vypadá
       │
       ▼
Lighting Guide → Color Script → Vegetation → Buildings → Materials
```

Po schválení tohoto dokumentu lze kandidátní regiony v ADR-A01 hodnotit objektivně: *„Podporuje tento směr identitu FarmOS?"* — ne *„Je hezký?"*.

---

## 1. Jaký svět FarmOS představuje?

FarmOS nevytváří kopii reality ani ilustraci z učebnice. Vytváří **věrohodný pracovní svět** — místo, kde zemědělství dává smysl, kde krajina má řád a kde hráč cítí, že spravuje skutečnou farmu, ne herní arénu.

### Možné přístupy (spektrum)

| Přístup | Popis | Vztah k FarmOS |
|---------|-------|----------------|
| **Dokumentární** | Maximální věrnost fotografii; chaos, opotřebení a vizuální šum reality beze změny | Příliš hrubý — narušuje čitelnost management kamery a klidný tón |
| **Inspirovaný realitou** | Vychází z reálných farem a krajin; selektuje a uspořádává prvky reality | **Základ doporučené filozofie** |
| **Idealizovaný** | Zjemňuje nebo vypouští nepříjemné prvky reality ve prospěch estetiky a pohody | **Kurátorovaná vrstva** — ne samostatný směr |
| **Stylizovaný** | Záměrně odchyluje proporce, barvy nebo materiály od reality | Mimo scope — odporuje [Art Bible](Art_Bible.md) |
| **Kombinovaný** | Mix přístupů s jasnými pravidly, co z čeho platí | **Doporučený výsledek** |

### Doporučená filozofie: *Inspirowaný realitou s kurátorovanou idealizací*

FarmOS stojí na **dvou pilířích**:

1. **Věrohodnost** — svět musí vypadat, jako by mohl existovat dnes, na evropské venkovské krajině. Proporce, materiály, práce na poli, stroje a sezónní cyklus respektují realitu.

2. **Kurátorství** — realita je příliš chaotická, špinavá a vizuálně rozházená pro dlouhodobou management hru. Svět proto **neukazuje vše**, co existuje v terénu. Vybíráme to, co podporuje klid, čitelnost a emoční identitu FarmOS.

**[RULE]** FarmOS není dokumentární film o chudobě venkova ani turistická pohlednice. Je to **místo, kde chcete pracovat** — ne utíkat.

**Rozhodovací test:** *„Vypadá to jako skutečná farma, ale zároveň jako místo, kde bych chtěl trávit stovky hodin — ne jako náhodný výřez reality?"*

---

## 2. Jaký pocit má svět vyvolávat?

Svět FarmOS má být emocionálně **stabilní**. Hráč nesmí cítit úzkost z vizuálu — úzkost může přijít z rozhodování ve hře, ne z toho, že scéna působí chaoticky, agresivně nebo falešně.

### Primární emoce

| Emoce | Význam pro svět |
|-------|-----------------|
| **Klid** | Žádný vizuální šum; prostor k přemýšlení; dýchání scény |
| **Důvěryhodnost** | Svět nepůsobí jako placeholder ani jako pastička jiné hry |
| **Prostor** | Krajina dává pocit rozsahu — i malá farma sedí v širším kontextu |
| **Čerstvý vzduch** | Světlé denní podmínky; otevřená obloha; absence dusna a claustrofobie |
| **Harmonie** | Prvky spolu souzní — barvy, materiály, vegetace, světlo |
| **Produktivita** | Svět vypadá jako místo práce, která má smysl a viditelný výsledek |
| **Každodennost** | Není to výjimečný den ani katastrofa — je to běžný pracovní den na farmě |
| **Respekt ke krajině** | Země není jen textura — je to partner a nositel hry |

### Emoce, které svět aktivně potlačuje

Strach, urgenci, ironii, cynismus, přehnanou romantiku, turistické kýčování, competitive adrenalín.

**[RULE]** Pokud záběr vyvolává spíš *„wow, jaké drama"* než *„ano, tady chci být"*, nepatří do FarmOS.

---

## 3. Jak realistický má svět být?

Realismus ve FarmOS není jedna škála — je to **sada nezávislých rozhodnutí**. Každá oblast má vlastní očekávanou úroveň.

```text
Nízký realismus ◄────────────────────────────────────► Vysoký realismus
(stylizace)                                              (dokument)
```

### 3.1 Fyzický realismus

**Úroveň: vysoká.**

- Stroje, budovy, pole a vegetace respektují reálné proporce a měřítko.
- Gravitace, kontakt se zemí, stopy po práci — věrohodné chování.
- Žádné nemožné geometry — budova, která by v realitě neustála.

Fyzický realismus se **nesnižuje** pro efekt. Pokud něco vypadá „herně" ale ne fyzicky, je to chyba.

### 3.2 Vizuální realismus

**Úroveň: střední až vysoká — s kurátorským filtrem.**

- Materiály a světlo se chovají věrohodně (PBR principy v produkci).
- Detaily se škálují s vzdáleností — ne vše je hero kvalita.
- Vizuální šum reality (odpad, náhodný nepořádek, přeplněné pozadí) se **redukuje**, ne kopíruje beze zbytku.

Vizuální realismus slouží **čitelnosti z management kamery**, ne showreelu.

### 3.3 Barevný realismus

**Úroveň: střední — harmonizovaný.**

- Barvy vycházejí z reálné krajiny, ale jsou **uspořádané** — žádná náhodná sytost.
- Paleta podporuje klid a čitelnost stavů pole — ne konkuruje gameplay informacím.
- Finální autorita → [Color Script](Color_Script.md) po [Lighting Guide](../02_Production_Guidelines/Lighting_Guide.md).

Barevný realismus **neznamená** přesnou fotografickou reprodukci — znamená *věrohodnou a klidnou* paletu.

### 3.4 Architektonický realismus

**Úroveň: vysoká v rámci zvoleného regionu (po ADR-A01).**

- Budovy musí vypadat, jako by je někdo skutečně používal — ne jako dekorace.
- Historické a moderní vrstvy mohou koexistovat, ale musí dávat kulturní smysl.
- Konkrétní typologie (střechy, materiály, siluety) → až po ADR-A01 a [Building Style Guide](../01_Domain_Bibles/Building_Style_Guide.md).

Před ADR-A01 platí pouze princip: **architektura musí být uvěřitelná, ne okázalá**.

### 3.5 Zemědělský realismus

**Úroveň: vysoká — priorita celého projektu.**

- Ornice, strniště, stopy strojů, fáze růstu plodin — musí odpovídat reálnému zemědělství.
- Farma vypadá jako **provoz**, ne jako výstava na veletrhu.
- Intenzita mechanizace může být moderní, ale vizuálně věrohodná — ne sci-fi.

Zemědělský realismus je **jádro identity FarmOS**. Hráč musí věřit, že pole a stroje fungují jako na skutečné farmě.

### Shrnutí realismu

| Oblast | Úroveň | Poznámka |
|--------|--------|----------|
| Fyzický | Vysoká | Bez kompromisů |
| Vizuální | Střední–vysoká | S kurátorským filtrem |
| Barevný | Střední | Harmonizovaný, klidný |
| Architektonický | Vysoká (v rámci regionu) | Typologie po ADR-A01 |
| Zemědělský | Vysoká | Jádro identity |

---

## 4. Co je záměrně idealizováno?

Idealizace ve FarmOS není lež — je to **editorial choice**. Stejně jako dobrá fotografie venkova neukazuje vše, co je v záběru, FarmOS vybírá realitu, která slouží zážitku.

### Principy idealizace

| Oblast | Co idealizujeme | Proč |
|--------|-----------------|------|
| **Čistota krajiny** | Méně odpadu, méně náhodného nepořádku, méně vizuálního šumu | Čitelnost a klid |
| **Hustota dopravy** | Minimální silniční provoz mimo farmy; žádné dálniční šruměc | Management fokus, ne město |
| **Množství odpadu** | Žádné skládky, rozptýlený plast, agresivní průmyslový odpad v záběru | Respekt ke krajině |
| **Vizuální chaos** | Redukce konkurenčních siluet, reklam, konfliktních stylů | Harmonický svět |
| **Průmyslové zóny** | Mimo primární záběr; pokud viditelné, jen jako vzdálený kontext | Farma, ne továrna |
| **Reklamní smog** | Žádné billboardy, neon, brandové dominace krajiny | Autenticita venkova |
| **Extrémní opotřebení** | Wear ano — ale ne chátrání jako default celého světa | Důvěra a péče, ne deprese |
| **Počasí** | Častěji příznivé a čitelné; extrémy výjimečně | Každodennost, ne katastrofa |

**[RULE]** Idealizace **nesmí** popřít zemědělský realismus. Nemůžeme mít sterilní pole bez stop práce — to by bylo jiné idealizování (umělá čistota), které FarmOS nechce.

**Rozhodovací test idealizace:** *„Vypouštíme to, protože to škodí zážitku — ne proto, že nám chybí reference?"*

---

## 5. Co musí být vždy autentické?

Následující oblasti **nesmí být idealizovány** do bodu, kdy přestanou být věrohodné. Jsou nosiči důvěry hráče ve svět.

| Oblast | Proč je autenticita kritická |
|--------|------------------------------|
| **Práce na poli** | Ornice, setí, růst, sklizeň — hráč musí číst stav země na první pohled |
| **Stroje** | Proporce, funkce, wear z používání — stroje jsou vizuální hrdinové management simu |
| **Vegetace** | Plodiny vypadají jako plodiny, ne jako zelené koule; sezónní změna musí být věrohodná |
| **Počasí** | Déšť, mlha, oblačno musí odpovídat tomu, co hráč očekává — ne Hollywoodu |
| **Půda** | Textura, vlhkost, stopy — země je gameplay surface |
| **Světlo** | Denní světlo musí reagovat na oblohu a materiály věrohodně |
| **Materiály** | Dřevo vypadá jako dřevo, kov jako kov, bláto jako bládo — bez plastového efektu |

**[RULE]** Autenticita v těchto oblastech má přednost před krásou. Pokud asset vypadá „hezky", ale nepravdivě v kontextu farmy, asset selhává.

---

## 6. Filozofie krajiny

Krajina FarmOS není kulisa za budovami — je **hlavní scénou**. Hráč tráví většinu času pohledem na pole, horizont a prostor mezi nimi.

### Charakter krajiny (bez konkrétního regionu)

| Parametr | Doporučený charakter | Proč |
|----------|---------------------|------|
| **Dramatičnost** | Nízká až střední | Drama patří do rozhodování, ne do alpských útesů v každém záběru |
| **Reliéf** | Jemně zvlněná až mírně kopcovitá | Čitelnost polí; horizont s jemnou hloubkou |
| **Monumentálnost** | Střední — prostor ano, epic ne | Hráč cítí rozsah, ne pocit, že je mraveneček |
| **Intimita** | Střední | Farma je osobní projekt, ne anonymní agrokorporace v záběru |
| **Přehlednost** | **Vysoká — priorita** | Management kamera musí číst krajinu jako mapu |
| **Členitost** | Střední | Dostatek variety pro dlouhodobou hru; ne chaos parcel |

### Krajinové principy

1. **Pole dominují** — otevřená zemědělská plocha je vizuální centrum, ne okraj.
2. **Horizont existuje** — hráč cítí, že farma je součástí širší krajiny, ne izolované krabičky.
3. **Les a voda jsou kontext** — podporují kompozici, nepřebíjí čitelnost polí.
4. **Cesty vedou někam** — infrastruktura má smysl, ne je dekorativní čára.
5. **Sezóna mění charakter** — stejná krajina v zimě a v létě musí být vizuálně odlišná a věrohodná.

**[RULE]** Konkrétní biomy, stromy a vodní prvky definuje ADR-A01 a [Environment Bible](../01_Domain_Bibles/Environment_Bible.md). Tento dokument definuje pouze **charakter**, ne geografii.

---

## 7. Jaký vztah má hráč ke světu?

Hráč FarmOS není turista, který fotí krajinu. Není ani anonymní bůh, který pohrdá detaily.

### Primární role: **Správce a hospodář**

Hráč je osoba, která **odpovídá za farmu a krajinu v jejím dosahu**. Svět existoval před hráčem — hráč ho nepíše od nuly, ale **přebírá, rozvíjí a utváří** svou prací.

| Role | Platí? | Vysvětlení |
|------|--------|------------|
| Návštěvník | Částečně | Hráč pozoruje krásu krajiny — ale není pasivní |
| Správce | **Ano — primární** | Rozhoduje, plánuje, vidí důsledky |
| Hospodář | **Ano — primární** | Práce na zemi, stroje, sklizeň — svět reaguje |
| Budovatel | Ano | Rozšiřuje farmu, infrastrukturu, produkci |
| Součást krajiny | Metaforicky | Dlouhodobě „patří" místu — svět nesmí působit cizě vůči hráči |

### Důsledky pro vizuál

- Svět musí vypadat **obyvatelně a spravovatelně** — ne jako dezerťák ani jako muzeum.
- Stopy práce hráče jsou viditelné — farma se mění pod jeho rukama.
- Svět hráče **nepodléhá** — hráč není oběť krajiny; krajina je partner.
- Workers a stroje jsou **prodloužením hráčovy vůle** — ne protagonisté příběhu.

**[RULE]** Vizuál nesmí evokovat, že hráč je vetřelec nebo že svět je proti němu. FarmOS je o spolupráci s místem.

---

## 8. Out of Vision

Následující seznam není blacklist konkrétních assetů. Je to **blacklist vizuální filozofie** — principů, které jsou s identitou FarmOS neslučitelné bez nového ADR.

### Atmosféra a světlo

- Přehnaně saturované barvy a „instagramové" filtry
- Hollywoodské západy slunce jako default obloha
- Noční neon, cyberpunk, apokalyptická obloha
- Extrémní post-processing (přepálené HDR, agresivní bloom, film grain jako styl)

### Svět a architektura

- Futuristické farmy, vertikální zemědělství jako vizuální standard
- Sterilní prostředí bez stop života a práce
- Náhodný mix architektur z různých kontinentů bez kulturní logiky
- Okázalé monumentální stavby dominující nad poli
- Fantasy prvky (kouzla, nereálné struktury, stylizované proporce)

### Krajina a chaos

- Vizuální chaos — příliš mnoho konkurenčních focal points
- Přeplněná scéna „pro krásu" bez gameplay důvodu
- Průmyslová degradace jako default estetika
- Turistické klišé (větrné mlýny jako dekor bez kontextu, „pohlednice" kompozice)

### Realismus a wear

- Přehnané opotřebení celého světa — chátrání místo živé farmy
- Karikatura venkova — ani ironická, ani romantická
- Arcade vizuální jazyk (speed lines, exaggerated particles jako styl)

### Žánr a konkurence

- Estetika driving simulátoru
- Přímá vizuální kopie existujících farming titulů
- Battle royale / survival horror atmosféra

**[RULE]** Pokud concept artist navrhne asset, který porušuje Out of Vision, asset se zamítá bez ohledu na technickou kvalitu.

---

## 9. Checklist — odpovídá asset identitě FarmOS?

Použít při review conceptu, blockoutu i finálního assetu. Všechny položky musí být **ano**. Jedno **ne** = iterace nebo zamítnutí.

| # | Otázka |
|---|--------|
| 1 | Podporuje asset **klid** scény — nepřidává vizuální stres? |
| 2 | Působí **věrohodně** v kontextu současné evropské farmy? |
| 3 | **Zapadá** do světa inspirovaného realitou s kurátorovanou idealizací? |
| 4 | **Neruší** barevnou harmonii a čitelnost z management výšky? |
| 5 | Nepůsobí **okázale** — slouží farmě, ne showreelu? |
| 6 | Respektuje **vizuální pilíře** [Art Bible](Art_Bible.md)? |
| 7 | Má **důvod existence** — gameplay, logistika nebo narativ práce? |
| 8 | Je v oblasti **autenticity** (sekce 5) pravdivý — ne jen „hezky namalovaný"? |
| 9 | **Neporušuje** žádný princip z Out of Vision (sekce 8)? |
| 10 | Po schválení ADR-A01: je **konzistentní s regionem**? *(do té doby: neodporuje obecné evropské věrohodnosti)* |

### Zkrácená verze (rychlý test)

```text
Klid?  Věrohodné?  Zapadá?  Neokázalé?  Má důvod?
```

Pět ano = pokračovat. Jakékoli ne = stop a konzultace s leadem.

---

## 10. Motto světa

> **„Pracující krajina, které věříte — uspořádaná tak, aby v ní chtěl člověk zůstat."**

Interní motto pro art tým. Není marketingový slogan. Připomíná, že FarmOS buduje **důvěru a klid** skrze věrohodnou práci na zemi — ne skrze efekt ani drama.

---

## Source of Truth — shrnutí

| Téma | Autorita |
|------|----------|
| Filozofie světa | **Tento dokument** |
| Míra realismu (obecně) | **Tento dokument** |
| Úroveň idealizace | **Tento dokument** |
| Charakter krajiny (obecně) | **Tento dokument** |
| Emocionální identita světa | **Tento dokument** |
| Ústava grafiky, pilíře | [Art Bible](Art_Bible.md) |
| Konkrétní region | [ADR-A01 Framework](ADR-A01_Regional_Identity_Framework.md) |
| Konkrétní krajina, biomy | [Environment Bible](../01_Domain_Bibles/Environment_Bible.md) |

---

## Proces schválení (Vision Lock)

- [ ] Art Bible ve stavu Approved nebo Frozen
- [ ] Art Director review — sekce 1–10 kompletní
- [ ] Environment Lead review — sekce 6 (krajina) a 5 (autenticita)
- [ ] Status změna: Draft → **Approved**
- [ ] ADR-A01 workshop může začít — kandidáti se hodnotí proti tomuto dokumentu
- [ ] Kritérium K12 (emoční shoda) a K7 (realistický styl) v ADR-A01 matici odkazují sem

---

## Související dokumenty

- [Art_Bible.md](Art_Bible.md) — nadřazená ústava
- [ADR-A01_Regional_Identity_Framework.md](ADR-A01_Regional_Identity_Framework.md) — následující krok
- [00_INDEX.md](../00_INDEX.md) — preprodukční roadmapa
- [Environment_Bible.md](../01_Domain_Bibles/Environment_Bible.md) — po ADR-A01

---

## Shrnutí

**Proč je dokument důležitý:** Bez Vision Lock každý hodnotí regiony a assety podle osobního vkusu. World Identity Statement dává týmu společnou definici *jaký svět stavíme* — dříve, než se rozhodne *kde* na mapě Evropy stojí.

**Co uzamyká:** Filozofii „inspirováno realitou s kurátorovanou idealizací", úrovně realismu v pěti oblastech, principy idealizace a autenticity, charakter krajiny, vztah hráče ke světu a Out of Vision blacklist.

**Jak pomůže při ADR-A01:** Každý kandidátní region v rozhodovací matici lze hodnotit proti sekci 1–8 tohoto dokumentu — ne jen proti estetické preferenci. Region, který podporuje přehlednost, klid a zemědělský realismus, dostane objektivně vyšší skóre než region, který je „krásný", ale dramatický nebo chaotický.

**Co se po schválení zjednoduší:**

| Dokument | Proč |
|----------|------|
| [ADR-A01 Framework](ADR-A01_Regional_Identity_Framework.md) | Kritéria mají kotvu v identitě světa |
| [Environment Bible](../01_Domain_Bibles/Environment_Bible.md) | Charakter krajiny je předdefinovaný |
| [Lighting Guide](../02_Production_Guidelines/Lighting_Guide.md) | Emoce a denní tón jsou uzamčeny |
| [Color Script](Color_Script.md) | Barevný realismus má rámec |
| [Vegetation](../01_Domain_Bibles/Vegetation_Guide.md), [Building](../01_Domain_Bibles/Building_Style_Guide.md), [Material](../02_Production_Guidelines/Material_Guide.md) | Autenticita vs. idealizace je jasná |
