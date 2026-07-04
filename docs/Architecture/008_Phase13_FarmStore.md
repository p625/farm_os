# 008 — Phase 13: Farm Store (Dealer MVP)

**Type:** Specification  
**Status:** Approved — Implementation in progress  
**Architecture Freeze:** v1.0 unchanged

---

## Overview

Phase 13 introduces the **Farm Store** architecture — a unified purchase layer for world-facing shops. **Dealer** is the first **Store Type**; Agronomy, Livestock, and Forestry are reserved for future phases.

Purchases flow through **Products**, not hardcoded machine SKUs. A Product may fulfill into different world objects over time (machines today; attachments, fertilizer, seed, chemicals, pallets later).

```
Product  →  fulfillment (template / inventory / pallet)  →  World object instance
```

For Phase 13 MVP, only **machine** fulfillment is implemented via **WorldObjectFactory** (evolved from MachineFactory).

---

## Farm Store Architecture

### Store types

| Store Type | Phase | Purpose |
|------------|-------|---------|
| **Dealer** | 13 MVP | Machines (tractors first) |
| Agronomy | Future | Seed, fertilizer |
| Livestock | Future | Animals, feed |
| Forestry | Future | Forestry equipment |

Each store is linked to a world **Interaction Point** and optional building visual.

### Store vs Farm Shop (upgrades)

| System | Panel | Save slice | Purpose |
|--------|-------|------------|---------|
| `FarmShopSystem` | Farm Shop HUD | `upgrades` | Stat upgrades |
| `FarmStoreSystem` | Farm Store panel | `farmStore` | Product purchases |

---

## Product Model

### Layers

```text
Product (purchase abstraction)
    ↓ fulfillment
Machine Template (capabilities, slots, visual prototype)
    ↓ instantiation
Machine Instance (tractor_1, tractor_2, …)
```

### Product definition (catalog)

- `id` — stable product id (e.g. `product_small_tractor`)
- `storeType` — Dealer | Agronomy | …
- `category` — Tractors | Harvesters | Attachments | Trailers | Fertilizers | Chemicals
- `name`, `description`, `price`
- `imageKey` — presentation asset key (placeholder in MVP)
- `specifications` — readonly string list for product card
- `fulfillment` — discriminated union (`machine` | `inventory` | …); MVP: `machine` only
- `maxOwned` — optional purchase cap (product-oriented ownership)

### Product card (HUD snapshot)

Each card exposes:

- image (key → CSS/icon in MVP)
- name
- description
- price
- specifications
- availability (`available` | `unaffordable` | `limit_reached` | `coming_soon`)
- owned count (per **product id**, not SKU variant)

### Ownership

`farmStore.ownedProducts: Record<ProductId, number>` — product-oriented counts. Starter `tractor_1` is **not** counted; only purchases increment the product count.

---

## Delivery

### Delivery Zone

Generic world location for fulfilled purchases (renamed from “spawn slots”). Defined in `delivery-zone-catalog.ts` with positions near the Dealer.

Allocation: first zone slot clear of machines within clearance radius; otherwise purchase blocked with player hint.

### Delivery Queue

Architecture supports delayed delivery; **Phase 13 delivers instantly** (`delayDays: 0`).

```text
purchase → enqueue DeliveryQueueEntry → process immediately → spawn world object
```

Save preserves `deliveryQueue` for future timed deliveries.

---

## Interaction Model

1. Right-click **Dealer interaction pad** (no machine selection required)
2. Radial: **Obchod** (Open Store)
3. `Game.openFarmStore(storeId)` → Farm Store HUD panel
4. Category tabs (6 categories; only Tractors has one product in MVP)
5. `Game.purchaseProduct(productId)` → gateway → `FarmStoreSystem` → `WorldObjectFactory` → `MachineRegistry`

Purchases are **non-machine commands** (same class as `purchaseUpgrade`).

---

## World Object Factory

`WorldObjectFactory` creates simulation controllers and coordinates presentation spawn. Phase 13: **machines only**; future: attachments, pallets, etc.

---

## Machine Instances

| Instance | Source | Template |
|----------|--------|----------|
| `tractor_1` | Bootstrap | `small_tractor` |
| `tractor_2+` | Product purchase | `small_tractor` |
| Combines | Bootstrap | unchanged |

ID allocation: `tractor_{N}` where N = max existing + 1 (monotonic, persisted in save).

---

## Save (v9)

```typescript
farmStore: {
  ownedProducts: Record<string, number>
  deliveryQueue: DeliveryQueueEntry[]
}
machines: {
  tractor_1, grain_combine_1, corn_combine_1,  // starters
  tractor_2?, …                                  // purchased
}
```

Migration v8 → v9: empty `ownedProducts`, empty `deliveryQueue`.

---

## Files (implementation map)

| Area | Files |
|------|-------|
| Types | `types/product.ts`, `types/farm-store.ts`, `types/delivery.ts`, `types/machine-template.ts` |
| Config | `product-catalog.ts`, `farm-store-catalog.ts`, `delivery-zone-catalog.ts`, `machine-template-catalog.ts` |
| Systems | `FarmStoreSystem.ts`, `WorldObjectFactory.ts`, `MachineInstanceRegistry.ts`, `MachineTickSystem.ts` |
| Core | `Game.ts`, `GameSnapshot.ts`, `SaveGameService.ts` |
| UI | `FarmStorePanel.tsx`, `ProductCard.tsx` |
| Rendering | `FarmSceneBuilder.ts`, `MachinePresentation.ts`, `MachineInputPresentation.ts` |

---

## MVP Scope

### In scope

- Dealer building + interaction point
- Farm Store panel with 6 category tabs (5 empty / coming soon)
- One product: Small Tractor
- Money deduction, instant delivery to Delivery Zone
- Dynamic `tractor_N` register, select, move, field work, save/load

### Out of scope

- Other store types (UI placeholders only in types)
- Attachment / trailer / harvester / fertilizer / chemical purchase
- Loans, used equipment, brands, service
- Delayed delivery (queue structure only)
- Architecture Freeze changes

---

## Acceptance Criteria

- [ ] Dealer visible on map; interaction pad opens store without machine selected
- [ ] Product card shows name, description, price, specs, availability, owned count
- [ ] Purchase deducts money; spawns tractor at Delivery Zone
- [ ] New tractor fully playable; save/load preserves instance
- [ ] `npm run build` passes
- [ ] Game remains gateway; UI does not mutate simulation
