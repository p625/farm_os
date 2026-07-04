# Gameplay Placement E2E — regresní test

Povinný regresní test pro data-driven pipeline **katalog → FarmOS Studio → export → runtime loader → save bootstrap → scéna**.

Každá změna katalogů, Map Studia, runtime loaderu, save bootstrapu nebo asset spawnování by měla projít tímto testem před commitem.

## Co test ověřuje

Test se skládá ze čtyř bloků (výstup `1/4` … `4/4`):

### 1. Catalog definition coverage

- Každá **building / machine / attachment** definice má neprázdné a validní `defaultAnchors`
- Každé `anchorKind`, `label`, `localX` / `localZ` je korektní
- **Unikátní ID** v rámci `BUILDING_CATALOG`, `MACHINE_CATALOG`, `ATTACHMENT_CATALOG` a `StudioPlacementCatalog`
- **Unikátní anchor identita** (`anchorKind` + `entityId` + `label`) uvnitř každé entity

### 2. Catalog placement coverage

- Syntetická mapa s **jedním placementem každého** assetu z katalogu
- Po placementu existují všechny **required** kotvy podle šablon

### 3. Gameplay placement E2E mapa

Referenční scénář (dealer, silo, traktor, pluh, secí stroj, přívěs):

- validace mapy (`validateWorldMap`)
- export do balíčku
- resolver runtime machine / attachment spawnů
- export `farmHub` z kotev (silo entry, dealer entry, tractor home)
- žádné duplicitní machine ID ve spawn resolveru

### 4. Runtime duplication + save bootstrap

- **Legacy hub fallback** se nepoužije, pokud mapa má Studio machine placementy
- **Save bootstrap** (`createDefaultSave`) odpovídá počtu runtime spawnů
- Headless Babylon scéna (`NullEngine`):
  - žádný machine mesh vícekrát (`sceneNodeName` z `MACHINE_CATALOG`)
  - žádný attachment root `attachment_*` vícekrát
  - **0 anchor gizmo meshů** v runtime (`FarmSceneBuilder` / `renderGameplayAnchors: false`)
  - anchor gizmos **jsou** vidět ve Studio debug režimu (`renderGameplayAnchors: true`)

## Jak spustit

```bash
# Pouze placement regresní test
npm run test:gameplay-placement

# Alias
npm run test

# Před commitem — lint + TypeScript + regresní test
npm run check

# CI ekvivalent
npm run ci
```

## Jak interpretovat výstup

Úspěšný běh končí:

```text
PASSED — gameplay placement regression test is green.
```

U každého bloku uvidíš `PASSED` nebo `FAILED` a počet problémů.

### JSON report

Po každém běhu:

`public/maps/GameplayPlacementTest/self-check-report.json`

Obsahuje strukturované výsledky všech čtyř bloků a seznam `failures`.

### Dev konzole ve hře (volitelné)

V `import.meta.env.DEV` po startu hry:

- `globalThis.farmosPlacementCheck` — map-level self-check
- `globalThis.farmosRuntimeSnapshot` — počty nodů ve scéně

## Co znamená selhání

| Selhání | Typická příčina |
|---------|------------------|
| `defaultAnchors must not be empty` | Chybí šablony v `asset-anchor-templates.ts` |
| `duplicate anchor identity` | Dvě kotvy se stejným kind + entityId + label u jednoho assetu |
| `duplicate id` v katalogu | Kolize ID při přidání nového assetu |
| `missing required anchors after placement` | `createDefaultBuildingAnchors` / `createDefaultPlacementAnchors` negenerují required kotvy |
| `Legacy hub machine fallback active` | `resolveRuntimeMachineSpawns` stále doplňuje stroje z hubu i při Studio placementu |
| `Save bootstrap … does not match` | `SaveGameService` nebo `AttachmentSystem.applySave` merguje legacy defaulty |
| `Duplicate machine scene nodes` | Dvojí spawn meshů (Studio + hardcoded / fallback) |
| `gameplay anchor gizmo mesh(es) outside Studio debug` | `renderGameplayAnchors` zapnuto v runtime nebo chybí `omitLayers` |
| `Studio debug mode did not render anchor gizmos` | Rozbitý Gameplay Debug layer ve Studiu |

## Jak přidat nový stroj nebo budovu

1. **Katalog** — přidej záznam do `machine-catalog.ts`, `attachment-catalog.ts` nebo `BuildingTypePalette` / `building-catalog.ts`.
2. **Kotvy** — doplň šablony v `asset-anchor-templates.ts` (`MACHINE_ANCHOR_TEMPLATES`, `ATTACHMENT_ANCHOR_TEMPLATES` nebo `BUILDING_ANCHOR_TEMPLATES`). Označ gameplay-kritické kotvy `required: true`.
3. **Studio placement** — u strojů/nářadí stačí katalog; `StudioPlacementCatalog` se generuje automaticky z `MACHINE_CATALOG` + `ATTACHMENT_CATALOG`.
4. **Unikátní ID** — ověř, že nové ID nekoliduje v daném katalogu ani ve `StudioPlacementCatalog` (`machine:…` / `attachment:…`).
5. **Spusť test** — `npm run test:gameplay-placement` musí projít bez úprav test mapy (blok 2 umístí všechny assety automaticky).
6. **Volitelně E2E mapa** — pokud je asset součástí referenčního scénáře (dealer/silo/…), přidej ho do `buildGameplayPlacementTestMap()` v `GameplayPlacementSelfCheck.ts`.

### Kontrolní checklist nového assetu

- [ ] `defaultAnchors` nejsou prázdné a required kotvy dávají smysl pro gameplay
- [ ] `npm run check` prošel
- [ ] Ve Studiu lze asset umístit z panelu nástrojů
- [ ] Po placementu validace mapy nehlásí chybějící kotvy
- [ ] V runtime je asset ve scéně právě jednou (u nové hry z mapy s placementem)

## Související soubory

| Soubor | Účel |
|--------|------|
| `scripts/e2e-gameplay-placement-test.ts` | Spouštěč regresního testu |
| `src/maps/GameplayCatalogCoverageCheck.ts` | Kontrola katalogů a placement coverage |
| `src/maps/GameplayPlacementSelfCheck.ts` | E2E mapa + map-level checks |
| `src/maps/GameplayRuntimeDuplicationCheck.ts` | Runtime / save / scéna |
| `src/config/asset-anchor-templates.ts` | Šablony kotev |
| `public/maps/GameplayPlacementTest/` | Export test mapy + JSON report |
