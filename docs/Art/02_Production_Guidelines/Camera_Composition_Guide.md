# Camera & Composition Guide — FarmOS

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Tier** | T2 (strategický obsah) |
| **Vlastník** | Art Director |
| **Backup** | Environment Lead |
| **Review** | Pololetně |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální verze z prototypu `CameraController.ts` |

---

## Účel

Strategická hra = isometric/tilted camera je ~80 % vizuálního dojmu. Pravidla framingu, zoom levels, safe zones pro UI.

**[RULE]** Composition je produkčně testovatelná (screenshot testy) — proto samostatný guide, ne sekce v Art Bible.

---

## 1. Kamera — schválené parametry (Draft)

Implementace: `src/rendering/CameraController.ts` (Babylon `ArcRotateCamera`).

| Parametr | Hodnota | Poznámka |
|----------|---------|----------|
| Typ | ArcRotateCamera | Isometric lock |
| Alpha | −π/4 (−45°) | Fixní azimut |
| Beta | 1.05 rad | Fixní elevace |
| Radius default | 42 | Výchozí zoom |
| Radius min | 25 | Max přiblížení |
| Radius max | 70 | Max oddálení |
| Look-at target | (4, 0, 4) | Střed farmy (prototyp) |
| Wheel precision | 12 | Citlivost zoomu |
| Panning sensibility | 80 | Citlivost posunu |

**[RULE]** Alpha/Beta jsou locked — hráč nemění úhel pohledu, pouze zoom a pan.

---

## 2. Input — pravé tlačítko

**Vazba:** [Rendering Architecture](../../Architecture/004_RenderingArchitecture.md)

| Akce | Chování |
|------|---------|
| Right-drag | Pan kamery |
| Right-click (bez drag) | Gameplay příkaz (pohyb stroje, kontextové menu) |

Input layer musí rozlišit click vs. drag pomocí movement threshold.

---

## 3. Kompoziční pravidla

### 3.1 Čitelnost z výšky

- Pole musí být čitelná v celém rozsahu radius 25–70.
- Siluety budov nesmí splývat s horizontem — kontrastní edge nebo separace mlhou.
- Stroj v aktivní práci = vizuální focal point (bez rušivého DOF v management view).

### 3.2 Safe zones

- HUD overlay rezervuje okraje obrazovky — environment layout to respektuje.
- _TBD:_ konkrétní margin px po definici UI layoutu.

### 3.3 Screenshot testy

- [ ] Default zoom (radius 42) — celá farma čitelná
- [ ] Min zoom (25) — stavy polí čitelné
- [ ] Max zoom (70) — siluety budov a horizont

---

## 4. Marketing vs. gameplay

Gameplay kamera = locked isometric. Marketing může použít volnější úhly za podmínek [Cinematic Guide](Cinematic_Marketing_Guide.md).

---

## 5. Otevřené otázky

| ID | Otázka |
|----|--------|
| — | Smoothing a bounds panning (update loop v CameraController je zatím prázdný) |
| — | Dynamický look-at při expanzi farmy |

---

## Související dokumenty

- [Art_Bible.md](../00_Strategy/Art_Bible.md)
- [UI_Style_Guide.md](UI_Style_Guide.md)
- [Environment_Bible.md](../01_Domain_Bibles/Environment_Bible.md)
