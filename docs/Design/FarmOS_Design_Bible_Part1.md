# FarmOS Design Bible — Part I

## Seasons, Calendar, Crops & Economy

**Type:** Permanent gameplay reference (non-normative)  
**Status:** Approved — Part I of Design Bible  
**Prerequisite:** [FarmOS Gameplay Vision](./FarmOS_Gameplay_Vision.md)  
**Does not override:** Architecture Freeze v1.0  

This document defines **balancing rules and design law** for future gameplay systems. It is not an implementation spec.

**Units:** Currency **₡**. Yield **units per hectare (u/ha)** unless noted. Tiers: **L** Low, **M** Medium, **H** High, **VH** Very High.

---

## Part 1 — Calendar

### Recommended model: **12 named months, four seasons**

FarmOS should **not** simulate 365 real-world days. It should **not** use season-only abstraction without month labels (too vague for contracts and crop windows).

**Use a 12-month agrarian calendar** grouped into four seasons. Each month lasts **10 game days** → **120-day year**.

| Why this model | Detail |
|----------------|--------|
| Readable planning | “Plant wheat in Month 3” is actionable in UI and contracts. |
| Browser pacing | A full year remains a manageable session unit, not a multi-hour wait. |
| Regional identity | Central European crop rhythm without simulation excess. |
| System hooks | Weather tendency, market seasonality, and risk attach to **month index**, not day-of-year math. |
| Future-proof | Contracts, loans, and insurance can reference months cleanly. |

**Day counter:** Global `currentDay` continues (1…∞). **Month** = `((currentDay - 1) mod 120) / 10 + 1`. **Year** = `floor((currentDay - 1) / 120) + 1`. Display both in HUD when calendar ships.

### Season grouping

| Season | Months | Character |
|--------|--------|-----------|
| **Winter** | 12, 1, 2 | Planning, maintenance, storage sales, limited field work |
| **Spring** | 3, 4, 5 | Soil prep, planting peak, early care |
| **Summer** | 6, 7, 8 | Growth, care peak, early harvests |
| **Autumn** | 9, 10, 11 | Main harvest, logistics stress, contract fulfillment |

### Calendar table

| Month | Name (display) | Season | Primary activities | Weather tendency | Risk |
|-------|----------------|--------|--------------------|------------------|------|
| 1 | Frostend | Winter | Review storage; sell held grain; plan rotation; shop/dealer | Cold, dry | Cash crunch if over-invested |
| 2 | Thaw | Winter → Spring | Plow prep on light soils; early barley window opens | Wet, variable | Mud delay (future): plow slower |
| 3 | Seedbreak | Spring | **Wheat, barley, potato** planting; fertilize after seed | Cool, warming | Missed plant window → fallow opportunity cost |
| 4 | Greenrise | Spring | **Canola, soybean** planting; spray windows open | Mild, rain bands | Care backlog if fleet undersized |
| 5 | Longsun | Spring → Summer | **Corn** planting; last chance spring cereals | Warm, stable | Wrong crop mix visible by Month 6 |
| 6 | Highgrowth | Summer | Fertilize / spray growing crops; first **barley** harvest | Hot, dry spells | Dry stress (future): care matters more |
| 7 | Dryfield | Summer | Care peak; **wheat, canola** approaching harvest | Hot | Logistics pre-plan for harvest wave |
| 8 | Goldhaul | Summer → Autumn | **Wheat, barley, canola** harvest; bin pressure begins | Warm, clear | Combine + trailer bottleneck |
| 9 | Fullcrop | Autumn | **Corn, soybean, potato** harvest peak | Mild | Highest simultaneous machine demand |
| 10 | Stripdown | Autumn | Late harvest finish; haul to silo; spot vs store decision | Cool, wet risk | Price dip as market glut (seasonal) |
| 11 | Storemonth | Autumn → Winter | Contract delivery; processing; sell or hold | Cool | Contract penalty if under-stored |
| 12 | Yearclose | Winter | Loan payment; annual goals; next-year plan | Cold | Idle fleet if no winter work designed |

**Design note:** Months are **gameplay buckets**, not astronomical accuracy. Crop windows may overlap intentionally so the player cannot do everything at once.

---

## Part 2 — Crop calendar

Complete crop rhythm on the 12-month calendar. **Growing duration** is expressed in game days (within-month), not real time.

| Crop | Plant window (months) | Care window | Harvest window | Storage | Difficulty |
|------|------------------------|-------------|----------------|---------|------------|
| **Wheat** | 3–4 | 4–7 (fertilize early, spray mid) | 8–9 | Silo; stable 12 months | ★★☆☆☆ |
| **Barley** | 3 (early) | 4–6 | 6–8 (early) | Silo; stable 12 months | ★★☆☆☆ |
| **Corn** | 5–6 | 6–8 (fertilize critical) | 9–10 | Silo; stable 9 months | ★★★☆☆ |
| **Canola** | 4–5 | 5–8 (spray sensitive) | 8–9 | Silo; stable 8 months | ★★★★☆ |
| **Soybean** | 4–5 | 5–8 | 9–10 | Silo; stable 10 months | ★★★☆☆ |
| **Potato** | 3–4 | 4–7 (fertilize) | 9–10 | Silo / heap; **best sold by Month 11** | ★★★☆☆ |

### Growing duration (target balance)

| Crop | Days in ground (target) | Why |
|------|-------------------------|-----|
| Barley | 35–40 | Fastest turnover; teaches calendar |
| Wheat | 45–50 | Standard reference crop |
| Potato | 45–55 | Bulk; overlaps wheat harvest planning |
| Soybean | 50–60 | Warm-season; harvest collides with corn |
| Canola | 55–65 | Longer care runway; rewards attention |
| Corn | 60–70 | Longest; highest volume payoff |

### Why each crop exists

| Crop | Exists because… |
|------|------------------|
| **Wheat** | **Tutorial grain.** Teaches plow → seed → optional care → harvest → sell. Contract-friendly anchor crop every player understands. |
| **Barley** | **Cash-flow crop.** Faster cycle returns liquidity early in the year; lower margin but forgives learning mistakes. |
| **Corn** | **Scale crop.** Highest volume per ha; forces combine header investment, trailer throughput, and bin capacity. |
| **Canola** | **Skill crop.** Care-sensitive, higher margin; punishes neglect without hard-failing harvest. Specialist identity. |
| **Soybean** | **Rotation crop.** Breaks wheat/barley monoculture; different plant/harvest window spreads workload; stable market. |
| **Potato** | **Bulk / storage crop.** High tonnage, low unit price; teaches storage timing and haul economics; forgiving for new land. |

No crop is “strictly better.” Each occupies a **calendar niche** and a **strategic niche**.

---

## Part 3 — Crop identity

Every crop has a **one-sentence role** and a **mechanical identity**.

| Crop | Identity sentence | Gameplay identity |
|------|-------------------|-------------------|
| **Wheat** | The reliable backbone of a Central European farm. | Low risk · steady margin · **contract king** · forgives skipped care |
| **Barley** | Quick money in spring when the farm is still small. | Fast turnover · lower value · **liquidity** · early harvest relief |
| **Corn** | Volume that fills bins and tests logistics. | High volume · **heavy logistics** · combine-dependent · harvest congestion |
| **Canola** | Premium crop for players who invest in care. | High investment · high reward · **care-sensitive** · price spikes |
| **Soybean** | The sensible second crop in a rotation plan. | Medium everything · **workload spread** · stable contracts · rotation enabler |
| **Potato** | Tons of product, cents of margin. | Bulk yield · low unit price · **storage timing** · haul-intensive |

### Identity matrix (axes)

| Crop | Risk | Margin | Logistics load | Care demand | Contract fit |
|------|------|--------|----------------|-------------|--------------|
| Wheat | L | M | M | L | VH |
| Barley | L | L–M | M | L | M |
| Corn | M | M | VH | M | H |
| Canola | H | H | M | H | M |
| Soybean | M | M | H | M | H |
| Potato | M | L | VH | M | L |

---

## Part 4 — Economy

Balancing table for **per-hectare full cycle** at reference fertility, optional care applied where noted. Values are **targets** for tuning — not current prototype numbers.

| Crop | Seed cost (₡/ha) | Machine investment | Care investment (₡/ha) | Yield (u/ha) | Avg sale price (₡/u) | Gross margin (₡/ha) | Profit stability | Storage value | Contract suitability | Strategic role |
|------|------------------|--------------------|-------------------------|--------------|----------------------|------------------------|------------------|---------------|----------------------|----------------|
| **Wheat** | 500 | M (tractor + seeder) | 100 optional | 45 | 42 | ~1,290 | H | M (hold 2–3 mo) | VH | Anchor / contracts |
| **Barley** | 400 | M | 80 optional | 50 | 36 | ~1,320 | H | L | M | Early cash flow |
| **Corn** | 1,000 | H (combine header) | 150 optional | 75 | 38 | ~1,750 | M | M | H | Volume / scale test |
| **Canola** | 800 | M (+ sprayer value) | 200 recommended | 35 | 58 | ~1,230–1,630* | L | H (off-season premium) | M | Skill / premium |
| **Soybean** | 700 | M–H | 120 optional | 48 | 46 | ~1,508 | M–H | M | H | Rotation / spread |
| **Potato** | 600 | M | 140 optional | 90 | 22 | ~1,380 | M | VH (early sell) / L (late) | L | Bulk / haul tutorial |

\*Canola margin range: low end without care, high end with full care bonus.

### Machine investment key

| Tier | Meaning | Examples |
|------|---------|----------|
| **L** | Starter tractor + plow + seeder | Block A only |
| **M** | + spreader/sprayer | Crop care viable |
| **H** | + dedicated combine/header | Corn/soy at scale |
| **VH** | + second tractor/trailer fleet | Multi-block harvest |

### Economic laws (Part I)

1. **No crop dominates all columns.** If one crop wins margin, risk, and stability, rebalance.
2. **Volume crops tax logistics**, not just seed cost.
3. **Care crops tax attention**, not mandatory success.
4. **Starter farm** should profit on wheat/barley/potato without combine.
5. **Combine crops** (corn, soybean at scale) are mid-game gates, not day-one.

---

## Part 5 — Market

### Design goal

The market should create **timing decisions**, not gambling. The player reads **season + storage + contracts**, not daily noise alone.

### Price composition

```text
SpotPrice(crop, day) =
  BasePrice(crop)
  × SeasonalIndex(crop, month)
  × VolatilityNoise(crop, day)   // small
  clamped to [Floor, Ceiling]
```

| Layer | Purpose |
|-------|---------|
| **Base price** | Long-term identity (potato cheap per u, canola expensive per u) |
| **Seasonal index** | Predictable rhythm — harvest glut, off-season premium |
| **Volatility noise** | ±5–15% daily variation; **never** the primary decision driver |
| **Floor / ceiling** | Prevents runaway exploits and death spirals |

### Seasonal index (example targets)

Values are multipliers on base price by **month of sale**.

| Month | Wheat | Barley | Corn | Canola | Soybean | Potato |
|-------|-------|--------|------|--------|---------|--------|
| 1–2 | 1.10 | 1.05 | 1.00 | 1.15 | 1.05 | 0.90 |
| 3–5 | 0.95 | 0.95 | 0.90 | 0.95 | 0.95 | 0.95 |
| 6–7 | 1.00 | 1.00 | 0.95 | 1.00 | 1.00 | 1.00 |
| 8–9 | **0.85** | **0.85** | 0.90 | **0.85** | 0.90 | 0.95 |
| 10 | **0.80** | **0.80** | **0.85** | **0.80** | **0.85** | **0.90** |
| 11–12 | 1.05 | 1.00 | 1.00 | 1.20 | 1.05 | 1.10 |

**Rule:** Harvest months are cheap (glut). Winter months reward holders — especially canola and wheat.

### Storage value

| Crop | Hold strategy |
|------|-----------------|
| Wheat, barley | Hold Oct → Jan for modest gain; contracts often beat gambling |
| Canola | Best storage crop for off-season premium |
| Corn, soybean | Hold only if bin space allows; moderate premium |
| Potato | **Sell before Month 11** unless processing exists (future); storage bonus fades |

**Storage is not free inventory.** Bin capacity is a progression gate. Overflow forces spot sales at worst seasonal index.

### Volatility

- Daily noise: pseudo-random swing, amplitude **≤ 15%** of base (aligns with current prototype spirit).
- **No crop may swing more than 25% in a single month** from seasonality + noise combined.
- Event log announces large moves; HUD shows trend arrow (future).

### Contracts (design model)

| Field | Rule |
|-------|------|
| **Offer timing** | Posted Month 1–2 and Month 6 for next delivery window |
| **Price** | Usually **base × 1.05–1.15** (premium for certainty) |
| **Volume** | Fixed tonnes or u; partial delivery allowed with penalty |
| **Delivery window** | Month 10–12 typical for cereals |
| **Penalty** | 20% of undelivered volume value + reputation hit |
| **Reputation** | Unlocks better premiums and larger volumes |

**Contracts vs spot:**

- Contracts = **stability and planning** (wheat, soybean, corn).
- Spot = **flexibility** when bins overflow or prices spike unexpectedly.
- Canola spot-hold can beat weak contracts — intentional specialist path.

---

## Part 6 — Player progression

Hour bands assume engaged play with learning. Automation columns describe **intended end state** of each band.

### 0–10 hours — Learn the land

| Dimension | Target state |
|-----------|--------------|
| **Own** | Block A fields (starter + 1 purchase or lease), 1 tractor, plow + seeder, optional spreader |
| **Crops** | Wheat, barley, potato only |
| **Decisions** | Which field to plow first; seed affordability; sell vs hold first harvest |
| **Manual** | All field work, movement, harvest |
| **GPS** | Optional single-field experiments |
| **Pain introduced** | Cash runway; one machine doing everything |

### 10–30 hours — Growing farm

| Dimension | Target state |
|-----------|--------------|
| **Own** | Block B entry, 2nd tractor or first combine, trailer, spreader + sprayer |
| **Crops** | + canola, soybean; corn with combine |
| **Decisions** | Lease vs buy; block assignment; care worth it?; first bin pressure |
| **Manual** | Crises, new fields, harvest peaks |
| **GPS** | This field + selected fields on routine work |
| **Workers** | Not yet — player still dispatches |
| **Pain introduced** | Harvest timing overlap; haul distance |

### 30–80 hours — Professional operation

| Dimension | Target state |
|-----------|--------------|
| **Own** | Most Block B, Block C start, combine + header set, 2–3 tractors, expanded silo |
| **Crops** | Full rotation across blocks |
| **Decisions** | Block-scale work orders; contract acceptance; storage vs spot; fleet composition |
| **Manual** | Exceptions, contract week, logistics jams |
| **GPS** | Block orders standard |
| **Workers** | 1–2 workers on owned work orders |
| **Pain introduced** | Parallel bottlenecks; idle machine cost |

### 80–200 hours — Agricultural company

| Dimension | Target state |
|-----------|--------------|
| **Own** | Full map footprint, processing (mill), 4+ machines, worker roster |
| **Crops** | Specialized identity (grain co, oilseed specialist, etc.) |
| **Decisions** | Season plan; contract portfolio; processing margin; loan/leverage |
| **Manual** | Strategy, expansion, crisis only |
| **GPS** | Default execution layer |
| **Workers** | Own most routine orders |
| **Manager** | Priorities, eligible scope, pause/resume, fleet utilization |
| **Pain introduced** | Capital allocation; reputation; year-over-year optimization |

---

## Part 7 — Automation philosophy

Automation tiers map directly to **Work Orders** and **CommandOwner**. Automation never bypasses the command gateway.

### Tier definitions

| Tier | Player role | Work order scope | Owner |
|------|-------------|------------------|-------|
| **Manual** | Player issues each command | None / ad hoc | `player` |
| **GPS** | Player plans; machine executes one order | single, fields, block | `gps` |
| **Worker** | Player assigns order to worker | all GPS scopes + eligible (panel) | `worker` |
| **Manager** | Player sets priorities and policies | multi-machine, eligible, contracts | `manager` (future owner) |

### What stays manual forever

| Category | Examples |
|----------|----------|
| **Strategy** | Season crop plan per block; rotation choice |
| **Capital** | Buy land, machines, buildings; loans |
| **Contracts** | Accept, decline, negotiate tier (future) |
| **Crisis** | Bin full reroute; cancel/reassign stalled order; emergency sell |
| **Expansion** | First work on new block; new crop type first cycle |
| **Processing** | When to run mill; input sourcing (future) |

### What becomes GPS (Phase 16 — done / ongoing)

| Category | When |
|----------|------|
| Repeated field work on **known pattern** | After player has done task once manually on that block |
| **Block cultivation** | Plow / fertilize / spray block orders |
| **Single-field repeat** | Player explicitly chooses scope |
| **Harvest** | Only when bin + route capacity confirmed (future guard) |

GPS does **not** choose crop mix or accept contracts.

### What becomes Worker (Phase 16E target)

| Category | When |
|----------|------|
| **Owned work orders** | Player creates order, assigns worker + machine |
| **Routine block cycles** | Same order type repeats within season |
| **Off-player attention** | Player plans in UI while worker executes |
| **Eligible scope** | From Work Orders panel, not radial |

Worker does **not** replan season or rebalance portfolio.

### What becomes Manager (Phase 16F+ / late)

| Category | When |
|----------|------|
| **Priority rules** | “Harvest before plow if harvestable” |
| **Fleet utilization** | Assign idle machine to highest-priority eligible field |
| **Contract fulfillment** | Auto-queue delivery hauls when contract due (future) |
| **Pause / resume** | Bin full → pause harvest orders farm-wide |

Manager does **not** remove player from expansion and contract **acceptance**.

### Automation progression rule

```text
New task type → Manual first → GPS optional → Worker delegation → Manager policy
```

Skipping tiers is allowed for veterans via UI unlock, but **first occurrence each year** should surface teaching friction.

---

## Part 8 — Design rules

Permanent laws. Future features must pass these or amend the bible explicitly.

### Crop & calendar

1. **Every crop must have a reason to exist** — unique calendar niche + strategic role; no reskins.
2. **Every month must have a primary activity** — even winter rewards planning/sales.
3. **Plant windows overlap; harvest windows overlap** — parallelism creates fleet tension.
4. **Skipping care never hard-fails harvest** — care is optimization, not gatekeeping.

### Economy & market

5. **Money is a consequence, not the objective** — progression is capacity and identity.
6. **No dominant strategy** — specialization beats generalism in one axis only.
7. **Harvest month depresses spot prices** — storage and contracts must matter.
8. **Contracts trade upside for certainty** — never strictly worse than spot in all cases.

### Machines & progression

9. **Every machine purchase unlocks a new strategic option** — not just speed.
10. **Logistics capacity gates volume crops** — corn/potato punish missing trailers/bins.
11. **Combine is a mid-game key** — not required to finish starter arc.

### Automation & UX

12. **Automation removes repetition, not decisions.**
13. **No mechanic exists only to consume clicks** — if it’s always the same, delegate it.
14. **Player must always be able to override automation** — cancel, reassign, pause.
15. **Automation failures must be visible** — fleet, event log, notifications.

### Scope discipline

16. **Features must connect to calendar, economy, or fleet** — no orphan systems.
17. **Browser session respect** — meaningful progress in 15–30 minutes.
18. **Regional believability over simulation depth** — feel Central European, don’t simulate EU subsidy law.

---

## Part 9 — Balance principles

Philosophy for tuning. No exact formulas — relationships matter.

### High risk ↔ high reward

- **Canola** and contract-heavy specialization sit high on risk/reward.
- **Wheat** sits center — reliable, lower peak.
- Risk comes from **timing, care, and market**, not random crop death.

### Specialization ↔ diversification

| Approach | Wins when… | Loses when… |
|----------|------------|-------------|
| **Specialize** (e.g. all wheat) | Contracts align; fleet optimized | Harvest glut; price crash; boredom |
| **Diversify** | Spreads workload; stable year | Higher capital; jack of all trades margins |

Target: **specialist runs 10–20% better in good years; generalist survives bad years.**

### Capital investment

- Machines are **capacity**, not stats.
- Second tractor ≠ 2× speed if silo and trailer unchanged.
- Investments should **create new problems** (more hectares to haul) not only delete old ones.

### Storage

- Storage converts **time into money** at seasonal index rates.
- Storage without capacity planning is a **trap** (forced spot sale at Month 10).
- Potato teaches **negative storage** — holding too long hurts.

### Contracts

- Contracts are **planning anchors**, not quests.
- Failure hurts but does not end the game — reputation recovery over 1–2 seasons.
- Best contracts match crop identity (wheat VH, potato L).

### Scale

| Scale | Balance focus |
|-------|---------------|
| Small | Teach loop; fast feedback; barley/wheat |
| Medium | Fleet overlap; block orders; bin limits |
| Large | Worker/manager; contracts; processing; loans |

**Scale increases coordination cost faster than revenue** — until player masters automation.

### Tuning process (meta)

1. Anchor **wheat** first — one ha, one season, full loop.
2. Tune **barley vs wheat** early-game liquidity.
3. Tune **corn** only after combine + trailer exist in test save.
4. Tune **canola** care ROI — must beat wheat only with care applied.
5. Run **full-map harvest month** stress test before shipping calendar features.

---

## Appendix A — Quick reference card

```text
CALENDAR     12 months × 10 days = 120-day year
ANCHOR CROP  Wheat (contracts, stability)
FAST CROP    Barley (liquidity)
SCALE CROP   Corn (volume, logistics)
SKILL CROP   Canola (care, storage premium)
ROTATION     Soybean (workload spread)
BULK CROP    Potato (tonnage, sell timing)

MARKET       Base × Season(month) × Noise(day)
SELL LOW     Months 8–10 (harvest glut)
SELL HIGH    Months 1–2, 11–12 (storage)

AUTOMATION   Manual → GPS → Worker → Manager
NEVER AUTO   Season plan, contracts, capital, crisis
```

---

## Appendix B — Document maintenance

| Change type | Action |
|-------------|--------|
| New crop | Add Parts 2–4 rows; verify identity matrix |
| New month event | Update Part 1 calendar table |
| Market rebalance | Update Part 5; log in design changelog |
| New automation tier | Update Part 7 |

Part II (planned): **Fleet, logistics, buildings, workers, contracts UI.**

---

*FarmOS Design Bible Part I — permanent gameplay reference for seasons, crops, and economy.*
