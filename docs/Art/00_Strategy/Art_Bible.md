# Art Bible — FarmOS

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Tier** | T0 |
| **Vlastník** | Art Director |
| **Backup** | TBD |
| **Review** | Ročně nebo major milestone (0.5, 1.0) |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální osnova a vizuální pilíře |

---

## Účel

Nejvyšší vizuální autorita FarmOS. Definuje **proč** svět vypadá tak, jak vypadá — ne konkrétní hex barvy, poly county ani modely stodol.

**Čte:** všichni artisté, design, marketing, outsource leads.  
**Neobsahuje:** technické PBR hodnoty → [Material Guide](../02_Production_Guidelines/Material_Guide.md); palety → [Color Script](Color_Script.md).

---

## 1. Vizuální slib hráči

> Svět, do kterého chcete **zoomovat** — ne projet kolem.

FarmOS je dlouhodobá **zemědělská manažerská simulace**. Hráč spravuje pole, logistiku, sklady, výrobu a techniku v čase. Vizuál musí podporovat:

- **Klid a kontrolu** — hráč přehledně vidí stav farmy ze strategické výšky.
- **Živou farmu** — stopy po práci, sezónní změny, opotřebení strojů.
- **Čitelnost před efektem** — každý pixel slouží rozhodování, ne showreelu.

**[RULE]** FarmOS není závodní hra ani driving sim. Pohyb strojů slouží management gameplay — dispatch, haul, operate.

---

## 2. Vizuální pilíře

### 2.1 Čitelnost z výšky

Isometrická kamera je primární pohled ([Camera Guide](../02_Production_Guidelines/Camera_Composition_Guide.md)). Siluety, kontrast a barevná hierarchie musí fungovat při zoomu 25–70 m radius.

| Priorita | Co musí být okamžitě čitelné |
|----------|------------------------------|
| 1 | Stavy polí (oranice, růst, sklizeň) |
| 2 | Stroje a jejich aktivita |
| 3 | Budovy a logistické uzly (silo, mlýn, sklad) |
| 4 | Sezónní kontext (barva krajiny, listí, sníh) |

### 2.2 Realismus s měřítkem

**[RULE]** Cíl: *believable contemporary European farm* — ne fotorealistický archviz, ne stylizovaná kreslená hra.

- Materiály a světlo respektují PBR ([Material Guide](../02_Production_Guidelines/Material_Guide.md)).
- Detaily se škálují s vzdáleností — hero detaily u strojů, zjednodušení u vzdálené vegetace.
- Wear a špína jsou **narrative**, ne náhodná šumová textura.

### 2.3 Živost bez chaosu

Farma není muzeum. Po práci zůstávají stopy — tire ruts, prach, zbytky slámy ([Decal Guide](../02_Production_Guidelines/Decal_Ground_Detail_Guide.md)). Ale:

**[RULE]** Každý prvek „živosti" musí mít gameplay nebo narativní důvod. Dekorativní nepořádek bez systému je zakázán.

### 2.4 Sezónnost jako identita

Hra je o cyklech. Vizuální změna ročních období je stejně důležitá jako UI nebo zvuk ([Seasonal Visual Guide](../01_Domain_Bibles/Seasonal_Visual_Guide.md)).

**[RULE]** Sezónní palety žijí výhradně v [Color Script](Color_Script.md). Ostatní docs odkazují.

### 2.5 Klid a důvěra

Tón je **pokojný, denní, pracovní**. Ne apokalypsa, ne fantasy, ne agresivní marketingový kontrast.

- Preferované světelné podmínky: jasné dopoledne, měkké odpoledne, zatažené ale čitelné dny.
- Bouřky a extrémy jsou výjimka s gameplay významem, ne default.

---

## 3. Co FarmOS vizuálně NENÍ

| Anti-pattern | Proč ne |
|--------------|---------|
| Kopie Farming Simulator / Manor Lords | Vlastní identita; inspirace jen v [Mood Library](Mood_Reference_Library.md) |
| Arcade barevnost, neon akcenty | Narušuje čitelnost a realism level |
| Přeplněná scéna „pro krásu" | Performance + management čitelnost |
| Hero character focus | Workers jsou funkční, ne protagonista ([Character Guide](../01_Domain_Bibles/Character_Crowd_Guide.md)) |
| Noc jako default | Hra se hraje převážně ve dne; noc až s gameplay důvodem |
| Generický „low poly indie" | Believable materiály při rozumném budgetu |

---

## 4. Realism level — referenční škála

```text
Stylizace ◄────────────────────────────────────► Fotorealismus
   │                        │                           │
   │                   ★ FarmOS                          │
   │              (believable management sim)            │
```

**[RULE]** Rozhodovací test: *„Vypadá to jako farma, kterou bych chtěl spravovat — ne jako tech demo ani jako dětská hra?"*

---

## 5. Wear & cleanliness filozofie

| Kategorie | Úroveň wear | Příklad |
|-----------|-------------|---------|
| Nový stroj / nová budova | Čistý, minimální opotřebení | Nový traktor ze showroomu |
| Běžná provozní farma | Střední — prach, škrábance, olejové skvrny | Default stav světa |
| Starší infrastruktura | Vyšší — rez, opravené díly, patina | Historická stodola |
| Po práci v poli | Dočasné — bláto, stopy | Tire tracks, zaprášení |

**[RULE]** Wear mapuje na stáří assetu a intenzitu použití — ne na náhodu per instance.

---

## 6. Doménová hierarchie v záběru

Při kompozici záběru (gameplay i marketing) platí vizuální priorita:

```text
1. Aktivní gameplay zóna (pole, stroj v práci)
2. Logistické uzly (silo, sklad, garáž)
3. Krajinový kontext (horizont, lesní okraj)
4. Atmosférické prvky (obloha, mlha — podporují, nepřebíjí)
```

Detailní pravidla per doména → [01_Domain_Bibles/](../01_Domain_Bibles/).

---

## 7. North star reference

**[INSPIRATION]** Max 1 stránka vizuálního směru. Plný katalog → [Mood Reference Library](Mood_Reference_Library.md).

| Směr | Reference (TBD — doplnit odkazy PureRef/Miro) |
|------|-----------------------------------------------|
| Krajina & atmosféra | _TBD_ |
| Současná evropská farma | _TBD_ |
| Management čitelnost | _TBD_ |

---

## 8. Vazba na produkt

| Produktový fakt ([Vision](../Architecture/001_VisionAndRoadmap.md)) | Vizuální důsledek |
|---------------------------------------------------------------------|-------------------|
| Stroje jako controllable entities | Vehicle/Machine Guide — stroje jsou vizuální hrdinové |
| Budovy jako logistické uzly | Building Style — čitelné siluety, vstupy/výstupy |
| Pole jako core gameplay | Terrain + Field vizuální stavy — nejdůležitější read |
| Worker jako controllable actor | Character Guide — lightweight, ne RPG hero |
| Babylon.js Presentation layer | Asset Pipeline — formáty a konvence pro engine |

---

## 9. Otevřené otázky (k rozhodnutí)

Zaznamenat v [Art Decision Log](../01_ART_DECISION_LOG.md) po schválení:

| ID | Otázka | Kandidáti |
|----|--------|-----------|
| ADR-A01 | Regionální identita farmy (střední Evropa vs. širší) | _TBD_ |
| ADR-A02 | Míra modernity strojů vs. historické budovy | _TBD_ |
| ADR-A03 | Den/noční cyklus — vizuální scope v1.0 | _TBD_ |

---

## 10. Související dokumenty

- [00_INDEX.md](../00_INDEX.md) — mapa celé art dokumentace
- [Color_Script.md](Color_Script.md) — palety a semantické barvy
- [Visual_Identity.md](Visual_Identity.md) — brand a marketing konzistence
- [Seasonal_Visual_Guide.md](../01_Domain_Bibles/Seasonal_Visual_Guide.md) — roční období
- [Camera_Composition_Guide.md](../02_Production_Guidelines/Camera_Composition_Guide.md) — isometric pravidla
