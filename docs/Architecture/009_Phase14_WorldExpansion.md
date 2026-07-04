# Phase 14 — World Expansion

## Status

| Field | Value |
|-------|-------|
| **Status** | Implemented |
| **Save version** | 10 |
| **Depends on** | Phase 13 (Farm Store) |

## Purpose

Enlarge the playable world so multi-machine ownership creates real workload before automation (Phase 16).

- Configurable world bounds (not hardcoded terrain size)
- 9 fields across Blocks A / B / C (Map 01 progression)
- Per-field mesh dimensions and layout data module
- Area-scaled field work duration
- Named camera profiles (`overview` only)
- Save v10 migration adds new fields without losing progress

## Layout module

**Source of truth:** `src/config/map-01-layout.ts`

| Export | Role |
|--------|------|
| `MAP_01_WORLD_BOUNDS` | Configurable min/max X/Z — terrain size derived |
| `getWorldTerrainSize()` | Width/depth for ground mesh |
| `getWorldCenter()` | Terrain placement |
| `FIELD_LAYOUT` | Per-field position, mesh size, block |
| `FARM_HUB` | Farmyard, buildings, spawns, delivery slots |

`farm-layout.ts` re-exports layout data and keeps gameplay constants (speeds, job durations, attachment offsets).

### Field layout metadata (reserved)

`FieldLayoutEntry` optional fields — **documentation / data only**, no gameplay:

- `roadAccess` — future road network id
- `preferredMachineApproach` — future approach heuristic

## Camera profiles

**File:** `src/config/camera-profiles.ts`

Named profiles prepared for future modes (field focus, machine follow). Phase 14 implements only `overview`.

`CameraController.applyProfile()` applies a profile; default is `overview`.

## Interaction points

`InteractionPointDefinition.visibilityPriority` — optional, reserved for future radial-menu ordering. No runtime effect in Phase 14.

## Spawn zones (future)

`DELIVERY_ZONE_CATALOG` / `DealerLot` is the first instance of a future **Spawn Zone** architecture:

```text
SpawnZone (future)
  ├── DealerLot (machines)
  ├── EquipmentYard (attachments) — future
  └── Custom zones — FarmOS Studio
```

Phase 14 keeps dealer delivery behavior unchanged; catalog comment documents the direction.

## Work duration scaling

```text
duration = baseJobDuration × sqrt(area / 10 ha) × shopMultiplier
```

Capped at 1.6× reference area scale.

## Save migration v9 → v10

- Appends `field_7`–`field_9` (and any future catalog fields) to `fields[]` and `ownership[]`
- Existing field progress preserved
- New fields default to catalog `initialOwnership` (Available)

## Out of scope

- GPS Autowork, workers, fleet UI (Phase 16)
- Crop care (Phase 15)
- Drivable roads, pathfinding
- FarmOS Studio editor runtime

## Related

- [010_Phase16_Automation.md](./010_Phase16_Automation.md) — approved automation architecture (deferred)
- Map 01 art docs: `docs/Art/Maps/Map_01_Central_Europe/`
