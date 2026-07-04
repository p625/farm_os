# Phase 17 — Game Framework & Player Experience

## Status

| Field | Value |
|-------|-------|
| **Status** | Approved (with refinements) — **planning only** |
| **Prerequisite** | Phase 16D Block Work Orders |
| **Architecture** | Freeze v1.0 unchanged |
| **Gameplay** | No new economy, crops, workers, seasons, or machines |

## Purpose

Transform FarmOS from a **technology prototype** into a **complete game shell** around existing gameplay. Map Editor integration is **design-only** here; runtime loads exported packages without knowing how they were authored.

**In scope:** Simulation Clock, map packages, main menu, save slots, simulation calibration, time/pause UI polish.  
**Out of scope:** seasons, contracts, weather, workers, cloud saves, difficulty gameplay, autosave implementation (placeholder only).

---

## Current baseline (audit)

| Area | Today | Problem |
|------|-------|---------|
| **Entry** | `App` → `GameShell` → `Game.start()` → auto `loadSavedGame()` | No main menu; always resumes or fresh implicit state |
| **Save** | Single `localStorage` key `farmos-save`, version **13** | No slots, no metadata, no map binding |
| **Map** | Hardcoded `map-01-layout.ts` + `field-catalog.ts` | New maps require code changes |
| **Clock** | `FieldSystem`: `SECONDS_PER_DAY = 1` → **1 real sec = 1 game day** at 1× | Absurd pacing; HUD hint contradicts design bible |
| **Work durations** | `JOB_WORK_DURATION` 1–2 **real seconds** | Not derived from simulation time |
| **Movement** | `TRACTOR_MOVE_SPEED` × real `deltaTime` | Decoupled from day length |
| **Crop growth** | `growingDays` advanced on `advanceDay()` | Coupled to broken day length |
| **Speed** | `World.gameSpeed` 0.25–5×; HUD options `[1,2,3,5]` | No pause; not aligned with target 1×/2×/4× |
| **Studio map** | `WorldMapDocument` v1 exists | Not consumed by runtime |

---

## Recommended implementation order

Sub-phases have dependencies. **Do not implement in strict A→F letter order.**

```text
1. 17D — Simulation Clock
       ↓
2. 17A — Map Packages
       ↓
3. 17C — Save Manager        ← requires mapId from registry
       ↓
4. 17B — Main Menu / New Game
       ↓
5. 17E — Simulation Calibration
       ↓
6. 17F — Game Polish
```

| Order | Sub-phase | Rationale |
|-------|-----------|-----------|
| **1** | **17D** Simulation Clock | Central time source; all durations derive from simulation time |
| **2** | **17A** Map Packages | Maps must exist before saves bind to `mapId` / map name |
| **3** | **17C** Save Manager | Slots need map metadata from `MapPackageRegistry` |
| **4** | **17B** Main Menu / New Game | Menu needs packages + save slots + clock |
| **5** | **17E** Simulation Calibration | Calibrate existing durations against Simulation Clock |
| **6** | **17F** Game Polish | Pause, speed UX, time display on stable clock |

**Why Map Packages before Save Manager:** save slots must already know which map they belong to. `SaveSlotMetadata` carries `mapId` and `mapName` resolved from the package registry — not hardcoded `map_01`.

**Integration milestone:** 17D + 17A + 17C + 17B ship together as **Playable Game v1**. 17E + 17F follow immediately — without calibration the clock feels empty.

**Parallel work:** Map Editor team can implement package export (17A schema) while 17D Simulation Clock is built. No implementation of 17B/17C until 17A registry exists.

---

## Design target — simulation pacing

**Do not optimize balance around one fixed player day-length setting.**

Define a single **design target** for calibration and playtesting:

| | |
|-|-|
| **Design target** | Normal gameplay ≈ **45 real minutes per game day** at **1×** |
| **Purpose** | Simulation Calibration (17E) tunes durations against this reference |

Players remain free to choose day length in settings:

| Setting | Role |
|---------|------|
| 15 / 30 / 45 / 60 / 90 min per day | User preference (45 min = design target default) |
| **Pause** | `timeScale 0` |
| **1× / 2× / 4×** | Honest accelerators |
| Custom (future) | Reserved |

All durations are expressed in **simulation time**. Changing day-length setting scales real-time wait without rewriting balance constants.

---

## Phase 17D — Simulation Clock

### Goal

**One authoritative Simulation Clock** — the central simulation time source for the entire game. Converts real time ↔ simulation time. **No gameplay system uses real-time durations directly.**

### Future dependents

The Simulation Clock will be consumed by (present and future):

- Crops
- Machines
- Logistics
- Workers
- Production
- Contracts
- Economy
- Weather
- Seasons

All gameplay durations **must derive from Simulation Time**.

### Simulation Clock architecture

```text
                    ┌─────────────────────────┐
  real deltaTime ──►│   SimulationClock       │──► simulationDeltaTime
                    │  - dayLengthSetting     │
                    │  - timeScale (0,1,2,4)  │
                    │  - paused               │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  FieldSystem             TractorJobSystem        ProductionSystem
  (day advance)           (work + move)           (mill progress)
  MarketSystem            LogisticsSystem         CropSystem (days)
```

#### Core types

```typescript
interface SimulationClockConfig {
  /** Real minutes for one game day at timeScale 1. Design target: 45. */
  realMinutesPerGameDay: 15 | 30 | 45 | 60 | 90
  timeScale: 0 | 1 | 2 | 4   // 0 = paused
}

interface SimulationClockState {
  currentDay: number
  /** 0.0–1.0 progress through current day */
  dayFraction: number
  totalGameDaysElapsed: number
}
```

#### Conversion law (permanent)

```text
realSecondsPerGameDay = realMinutesPerGameDay × 60
simulationSecondsPerRealSecond = (24 × 60 × 60) / realSecondsPerGameDay

simulationDeltaTime = realDeltaTime × simulationSecondsPerRealSecond × timeScale
```

**Day advance:** when `dayFraction` crosses 1.0 → `World.advanceDay()` + domain `onDayAdvanced` hooks (fields, market).

**Preference:** store `realMinutesPerGameDay` in `farmos-preferences` (default **45**). Global setting, not per-save (override reserved).

### System integration rules

| System | Today | After 17D |
|--------|-------|-----------|
| `FieldSystem` | `SECONDS_PER_DAY = 1` | Uses `SimulationClock` day fraction / advance |
| `TractorJobSystem` / `CombineJobSystem` | `workTimer += deltaTime` (real sec) | `workTimer += simulationDeltaTime`; durations in **simulation-seconds** |
| Movement | `TRACTOR_MOVE_SPEED * deltaTime` | Speed in simulation-time units |
| `ProductionSystem` | real-time fraction | simulation-time aligned |
| `CropSystem` | `growingDays` on day tick | unchanged unit (days); day length now meaningful |
| `MarketSystem` | `advanceDay` | triggered by clock day boundary |

**New module:** `src/game/SimulationClock.ts` — owned by `Game`, injected into systems.

**Forbidden after 17D:** magic numbers meaning real seconds in gameplay code. Durations live in `time-balance.ts` as **simulation-minutes** or **fraction of day**.

### Calibration reference (design target only)

At **45 min/day** and **1×**:

- **1 simulation hour ≈ 112 real seconds** — enough to observe machine work and open Fleet.

### Files likely to change (17D)

| Area | Files |
|------|-------|
| **New** | `src/game/SimulationClock.ts`, `src/config/time-balance.ts` |
| **New** | `src/types/simulation-clock.ts` |
| **Modify** | `World.ts` — delegate speed/pause to clock |
| **Modify** | `FieldSystem.ts`, controllers, `ProductionSystem.ts`, `LogisticsSystem.ts` |
| **Modify** | `Game.ts`, `GameLoop.ts` — tick clock first |

### Acceptance criteria (17D)

- [ ] Single `SimulationClock` instance; no system computes day length independently.
- [ ] Changing `realMinutesPerGameDay` changes day rate without code edits.
- [ ] Pause (`timeScale 0`) freezes simulation; UI still responsive.
- [ ] `dayFraction` exposed in snapshot for HUD and save metadata.
- [ ] Save/load restores `currentDay` + `dayFraction` (save v14).
- [ ] No real-second durations in gameplay systems (grep audit passes).

---

## Phase 17A — Map Packages

### Goal

Runtime loads **self-contained map packages**. Map Editor exports them; FarmOS discovers and validates them. **No gameplay code change per map.**

### Map Package architecture

A package is a **folder or single archive** with a mandatory manifest and validated schema version.

```text
maps/
  map_01_central_europe/
    package.json          ← manifest (metadata + version)
    layout.json           ← world bounds, terrain ref, hub, spawns
    fields.json           ← gameplay field catalog for this map
    interaction-points.json
    camera-profiles.json
    roads.json            ← optional; visual + future path hints
    terrain/
      heightfield.json
    preview.png           ← optional; path also in manifest
```

#### `package.json` (manifest)

```typescript
interface MapPackageManifest {
  packageFormatVersion: 1

  // Identity (required)
  id: string                      // stable slug, e.g. "map_01"
  name: string                    // display: "Central Europe"
  version: string                 // package semver, e.g. "1.0.0"
  author?: string
  description?: string
  preview?: string                // relative path, e.g. "preview.png"

  // Provenance
  source: 'official' | 'community'  // only 'official' used today; community = reserved

  // Future / reserved (optional in Phase 17)
  difficulty?: string             // e.g. "standard" — placeholder
  recommendedPlayers?: number     // reserved
  requiredVersion?: string        // min FarmOS semver gate

  // Runtime hints (derived or authored)
  fieldCount?: number
  blockIds?: string[]
  createdAt?: string
  updatedAt?: string
}
```

| Field | Phase 17 | Notes |
|-------|----------|-------|
| `id`, `name`, `version` | Required | Registry key + UI |
| `author`, `description`, `preview` | Recommended | Map selection cards |
| `source` | Required | `official` for bundled Map 01; `community` documented only |
| `difficulty`, `recommendedPlayers`, `requiredVersion` | Reserved | Manifest accepts; runtime may ignore |
| `fieldCount`, `blockIds` | Optional | Validator may compute from `fields.json` |

#### `layout.json`, `fields.json`, etc.

Unchanged from prior plan — see layout/fields/interaction-points/camera schemas in implementation notes.

### Runtime loading pipeline

```text
MapPackageRegistry.discover()
        ↓
MapPackageLoader.load(manifest)
        ↓
MapRuntimeContext
        ↓
Game bootstrap
```

**Rules:**

1. `Game` receives `MapRuntimeContext` at construction — **not** global imports.
2. `map-01-layout.ts` + `field-catalog.ts` become **export script source** for first official package, not runtime imports.
3. Bundled `public/maps/map_01/` is the transition default.
4. Save `mapId` must match a discovered package on load.

### Map Editor integration

FarmOS **must never depend on editor internals**. Only consume exported packages.

```text
Map Editor
        ↓  Export
Map Package
        ↓
FarmOS
        ↓
Map Registry
        ↓
New Game → Choose Map
        ↓
Play
```

**Editor:** emit valid package per `packageFormatVersion: 1`.  
**Runtime:** validate, load, render — no Studio APIs, no project file parsing.

### Files likely to change (17A)

| Area | Files |
|------|-------|
| **New** | `src/maps/MapPackageRegistry.ts`, `MapPackageLoader.ts`, `MapRuntimeContext.ts` |
| **New** | `src/types/map-package.ts` |
| **New** | `public/maps/map_01/` (source: `official`) |
| **New** | `scripts/export-map-01-package.ts` |
| **Refactor** | Scene/field/camera/interaction loaders |

### Acceptance criteria (17A)

- [ ] Map 01 playable from package; `source: 'official'`.
- [ ] `MapPackageRegistry` exposes `id`, `name`, `description`, `preview`, `version`.
- [ ] Invalid package fails gracefully.
- [ ] Second test package loads without gameplay code changes.
- [ ] No runtime import of `map-01-layout.ts` in game path.

---

## Phase 17C — Save Manager

### Goal

**Multiple local save slots** with metadata rich enough for **meaningful save selection without loading gameplay state**.

### Save slot metadata (index)

Every slot exposes:

| Field | Source |
|-------|--------|
| **Farm Name** | `farmName` |
| **Map Name** | `mapName` from `MapPackageRegistry` (not just `mapId`) |
| **Current Day** | `currentDay` |
| **Current Time** | `timeOfDay` derived from `dayFraction` (e.g. `14:32`) |
| **Season** | Placeholder string (e.g. `—` or `Spring`) until Phase 20 |
| **Money** | `money` |
| **Play Time** | `playTimeSeconds` (ex-pause) |
| **Last Played** | `lastPlayedAt` ISO timestamp |

```typescript
interface SaveSlotMetadata {
  slotId: string
  farmName: string
  mapId: string
  mapName: string
  money: number
  currentDay: number
  timeOfDay: string              // "HH:MM" from dayFraction
  seasonLabel: string            // placeholder until seasons
  playTimeSeconds: number
  lastPlayedAt: string
  previewImage?: string          // future placeholder
  saveVersion: number
}

interface SaveSlotIndex {
  slots: SaveSlotMetadata[]
  lastPlayedSlotId: string | null
}
```

**Rule:** index updates on save, load, and exit — **no full gameplay deserialize** needed for Load Game screen.

### Storage layout

```text
localStorage:
  farmos-save-index        → SaveSlotIndex
  farmos-save-slot-{id}    → GameSaveData
  farmos-preferences       → { lastPlayedSlotId, realMinutesPerGameDay, ... }
```

### Full save additions (v14)

```typescript
interface GameSaveData {
  version: number
  mapId: string
  farmName: string
  playTimeSeconds: number
  createdAt: string
  dayFraction: number
  // existing domain slices unchanged
}
```

### Operations

| Action | Behavior |
|--------|----------|
| **Continue** | Load `lastPlayedSlotId` |
| **Save Game** | Flush slot; refresh metadata including map name from registry |
| **Overwrite** | Confirm when slot occupied |
| **Delete** | Remove slot + index entry |
| **Load** | Validate `mapId` exists in registry |

### Migration impact

| Version | Change |
|---------|--------|
| **v13 → v14** | `mapId: 'map_01'`, `farmName`, `playTimeSeconds`, `createdAt`, `dayFraction` |
| **Storage** | Legacy `farmos-save` → `farmos-save-slot-slot_1` + index with full metadata |

### Acceptance criteria (17C)

- [ ] ≥5 slots; metadata list shows all fields above without loading game.
- [ ] `mapName` resolves via registry (fails clearly if package missing).
- [ ] `seasonLabel` present as placeholder.
- [ ] Legacy save migrates with `mapId` + `mapName` for Map 01.
- [ ] Delete / overwrite with confirmation.

---

## Phase 17B — Main Menu / New Game

### Goal

Replace direct game start with **Main Menu → New Game wizard**.

### Flow

```text
Main Menu
  ├── Continue
  ├── New Game → Map Selection → Difficulty (placeholder) → Farm Name → Create
  ├── Load Game → Slot picker (metadata from 17C)
  └── Settings (future)
        ↓
GameShell + Game(session)
```

### Session config

```typescript
interface GameSessionConfig {
  slotId: string
  mapId: string
  farmName: string
  difficultyId: 'standard'  // placeholder
  isNewGame: boolean
}
```

`Game.start(session)` loads slot or creates new farm from `MapRuntimeContext` — **no unconditional auto-load**.

### Acceptance criteria (17B)

- [ ] Launch shows Main Menu.
- [ ] New Game uses maps from `MapPackageRegistry`.
- [ ] Continue / Load use save metadata from 17C.
- [ ] Difficulty placeholder only.
- [ ] No regression to commands, work orders, fleet.

---

## Phase 17E — Simulation Calibration

### Goal

**Calibrate** existing gameplay durations against the Simulation Clock. **This is not a gameplay redesign** — same tasks, same loops, same relative relationships; only the mapping from simulation time to real time changes.

### What changes vs what does not

| Changes | Does not change |
|---------|-----------------|
| Duration constants → simulation-time units | Crop identities, prices, field layout |
| Movement speed scaling | Work order logic, machine commands |
| Growth days felt duration at design target | Attachment rules, crop care optional model |

### Duration audit checklist

| Category | Target unit (simulation time) |
|----------|-------------------------------|
| Plow / seed / harvest | game-minutes per ha, area-scaled |
| Fertilize / spray | game-minutes |
| Load / unload | game-minutes |
| Machine travel | game-minutes by distance |
| Crop growth | game **days** (unchanged unit) |
| Mill | fraction of day |

### Calibration principles (design target: 45 min/day, 1×)

1. **One field plow** ≈ 3–8 real minutes — player can watch or open Fleet.
2. **Block A GPS plow order** ≈ 20–40 real minutes at 1× — worthwhile automation.
3. **One wheat cycle** (grow + harvest) ≈ 2–4 real hours at 1× — session-scale.
4. Calibrate at **45 min/day**; verify **15** and **90** settings scale linearly.
5. **2× / 4×** remain honest; do not calibrate only at 4×.

### Tuning workflow

1. Set clock to design target (45 min/day).
2. Tune reference 10 ha field durations in `time-balance.ts`.
3. Verify harvest + trailer + silo chain.
4. Verify GPS block order end-to-end.
5. Playtest: Fleet usable during active work at 1×.

### Acceptance criteria (17E)

- [ ] All durations from `time-balance.ts` in simulation units.
- [ ] Timing bands met at **45 min/day** design target.
- [ ] No gameplay rule changes — calibration only.
- [ ] HUD remaining time matches felt progress.

---

## Phase 17F — Game Polish

### Goal

Time **readable and controllable** — no new gameplay.

| Feature | Detail |
|---------|--------|
| **Pause** | `timeScale 0` |
| **Speed** | `1×`, `2×`, `4×` only |
| **Day + time** | From `SimulationClock` |
| **Season label** | Placeholder in HUD (matches save metadata) |
| **Autosave hook** | Placeholder badge |
| **Loading screen** | Map name + farm name |

Remove misleading hint: “1 real second ≈ 1 game day”.

### Acceptance criteria (17F)

- [ ] Pause freezes simulation.
- [ ] Speed controls: Pause, 1×, 2×, 4×.
- [ ] Day + time-of-day from `SimulationClock`.
- [ ] Season shown as placeholder until Phase 20.

---

## Map Editor integration summary

```text
Map Editor  →  Export  →  Map Package  →  FarmOS  →  Map Registry  →  New Game  →  Play
```

FarmOS never depends on editor internals.

---

## Save migration summary

| Item | Impact |
|------|--------|
| **SAVE_VERSION** | 13 → **14** |
| **New fields** | `mapId`, `farmName`, `playTimeSeconds`, `createdAt`, `dayFraction` |
| **Index metadata** | `mapName`, `timeOfDay`, `seasonLabel`, `lastPlayedAt` |
| **Storage** | Single key → index + per-slot |
| **Domain slices** | Unchanged |

---

## Architecture compliance

| Rule | Status |
|------|--------|
| No MachineCommand changes | ✓ |
| No Work Order model changes | ✓ |
| No Fleet / GPS logic changes | ✓ |
| No new crops / economy | ✓ |
| Game remains command gateway | ✓ |

Phase 17 adds **shell systems** (`SimulationClock`, `MapPackageRegistry`, `SaveSlotIndex`, menu UI) — not new gameplay domains.

---

## Future roadmap (planning recommendation)

After Phase 17 completes:

| Phase | Theme | Contents |
|-------|-------|----------|
| **18** | **Company Operations** | Worker Registry, Work Orders Panel, Manager Dashboard |
| **19** | **Economy** | Contracts, Market depth, Loans, Reputation |
| **20** | **Seasons** | Rotation, Weather, Crop planning |

Planning recommendation only — not approved implementation.

---

## Risk analysis

| Risk | Mitigation |
|------|------------|
| Map package drift from Studio | Shared `map-package.ts`; export validation in CI |
| Clock refactor mid-harvest save | Save timers in simulation-seconds; v14 migration |
| Calibration feels slow at 90 min/day | Design target documented; settings scale linearly |
| Scope creep into seasons | `seasonLabel` placeholder only in 17C/17F |
| Save without map package | Block load; show clear error in slot UI |

---

## Test plan (phase-level)

1. Simulation Clock: pause, 1×/2×/4×, 45 min/day design target.
2. Map 01 from official package; registry lists metadata.
3. New Game → save → Load Game shows metadata without deserialize.
4. Legacy v13 migrates with map name.
5. Calibration playtest at 45 min/day.
6. GPS block order after clock + calibration.
7. `npm run build` per sub-phase merge.

---

## Document maintenance

When implementing, add sub-phase implementation notes as needed. This document is the **master plan** for Phase 17.

---

*Phase 17 — Game Framework & Player Experience. Approved with refinements. Planning only. Architecture Freeze v1.0 unchanged.*
