# FarmOS Gameplay Vision

**Type:** Design compass (non-normative)  
**Status:** Draft — Game Director review  
**Audience:** Design, product, implementation planning  
**Does not override:** Architecture Freeze v1.0, Golden Rules

---

## Core philosophy

FarmOS is an **agricultural management simulation** played in the browser. The player is not a driver. The player is an **operator of a growing farm business** — someone who decides what to grow, where to invest, how to deploy machines, and how to keep cash, storage, and deadlines in balance.

The fantasy is not “perfect steering.” The fantasy is **competent command**: watching a farm you designed execute under pressure, stepping in when it matters, and feeling the weight of scale.

Three pillars define what FarmOS should feel like:

| Pillar | Meaning |
|--------|---------|
| **Command, not choreography** | Machines move and work; the player assigns intent. Manual play is satisfying for setup and crisis, not for repeating the same field fifty times. |
| **Scale as the reward** | Progression is felt when the farm outgrows one pair of hands — more land, more machines, more bottlenecks, more interesting tradeoffs. |
| **Grounded regional identity** | Central European farmland: believable fields, seasons, machinery culture, and a world that reads as a place — not an abstract factory grid. |

FarmOS should never compete with Farming Simulator on **vehicle feel**. It should compete on **readable operations at scale** — closer to a light management sim with a living map than to an action driving game or a pure optimization spreadsheet.

---

## Long-term player goal

The primary long-term goal is to **build a resilient, profitable agricultural operation** that the player is proud to oversee.

Money is the scoreboard, not the soul. The deeper goals are:

1. **Territorial growth** — own or control more productive land across blocks and regions.
2. **Operational maturity** — run parallel field work, logistics, and processing without constant micromanagement.
3. **Strategic identity** — become *known* for something: grain specialist, diversified crop portfolio, value-added processor, contract supplier, or regional logistics hub.
4. **Mastery of bottlenecks** — solve the problems scale creates: storage limits, transport distance, labor gaps, weather windows, crop care timing.

A player after many hours should answer: *“I run a company that feeds a region”* — not *“I clicked harvest 10,000 times.”*

Secondary goals support the main arc:

- Unlock better equipment and facilities.
- Complete contracts and reputation tiers.
- Optimize margin per hectare and per machine-hour.
- Reduce waste (spoiled grain, missed windows, idle fleet).

**What FarmOS is not optimizing for:** infinite idle clicker progression, prestige resets as the main loop, or completionist 100% map painting with no economic tension.

---

## Core gameplay loop

### Today’s loop

```text
Acquire capacity (land, machines, attachments)
        ↓
Plan the season (what to grow, where, when)
        ↓
Execute field work (cultivate → plant → care → harvest)
        ↓
Move product (trailers, silos, delivery)
        ↓
Monetize (market, processing, contracts)
        ↓
Reinvest or stabilize (debt, repairs, upgrades)
        ↓
Repeat at larger scale
```

This loop is **necessary but not sufficient** for hundreds of hours.

### What the loop needs

The loop becomes durable when each cycle introduces **new constraints**, not just bigger numbers:

| Layer | Role |
|-------|------|
| **Calendar pressure** | Planting windows, harvest urgency, crop care timing — time is a resource. |
| **Spatial pressure** | Distance between fields, silos, dealers, and processors — logistics is gameplay. |
| **Capacity pressure** | Bins fill, trailers queue, one combine cannot cover three blocks alone. |
| **Financial pressure** | Lease vs buy, operating cost, loan servicing, volatile prices. |
| **Information pressure** | Fleet status, work orders, storage levels, margins — the player manages by overview. |

The satisfying moment is **plan → dispatch → observe → adjust** — not repeating identical micro-actions.

### Missing pieces (design targets, not promises)

- **Seasonal planning UI** — what will Block B grow this year, and why?
- **Contracts and obligations** — deliver 500 t wheat by day 120 or pay penalty.
- **Reputation / buyer relationships** — unlock better prices or exclusive demand.
- **Risk events** — drought window, price crash, breakdown, labor absence (tuned for management, not punishment).
- **Processing depth** — mill/bakery as margin levers, not decoration.
- **Clear “chapter” goals** — first owned combine, first Block C field, first processing profit month.

---

## Progression

Progression should read as a **career arc**, not a tech tree checkbox.

```text
Family farm          →  one tractor, starter fields, manual everything, learn the land
Growing farm         →  second machine, leased land, first GPS/work orders, logistics matters
Professional farm    →  dedicated harvest fleet, block-scale orders, storage strategy
Industrial farm      →  processing chain, contracts, workers, multi-crop rotation
Agricultural company →  regional footprint, specialization, optimization, delegation
```

### Milestone examples

| Tier | Land | Machines | Player mindset |
|------|------|----------|----------------|
| Starter | Block A, maybe lease B | 1 tractor, shared attachments | “I do every job myself.” |
| Expansion | Own Block B | 2 tractors + 1 combine | “I need to split work.” |
| Mechanization | Block C entries | Multiple combines, trailers | “Harvest is a operation.” |
| Processing | Hub upgrades | Trucks, silo expansion | “Margin is in the mill.” |
| Corporation | Multi-region (future) | Fleet + workers + manager tools | “I run the schedule.” |

Milestones should be **visible in the world**: new buildings, fuller yard, busier roads, more machines parked, richer crop mix — not only HUD numbers.

Progression gates should prefer **operational readiness** over raw cash:

- Can you store the harvest?
- Can you move it before the next field is ready?
- Can you afford to idle a machine during off-season?

---

## Economy

### Early economy: learn the unit economics

- Simple crop sales with volatile spot prices.
- Lease vs purchase land.
- Attachment and machine costs as capital decisions.
- Operating cost awareness (fuel, maintenance — when introduced).

The player learns: **margin per hectare, per day, per machine-hour.**

### Mid economy: obligations and processing

- **Contracts** — guaranteed price, volume, deadline; penalty for failure.
- **Processing** — convert raw crop to higher-value goods; capacity and input timing.
- **Storage strategy** — hold for price vs cash flow now; bin space as constraint.
- **Loans** — expand faster with risk; interest as pressure.

### Late economy: specialization and markets

- **Export lanes** (abstracted) — premium buyers with logistics requirements.
- **Cooperative membership** — shared storage, bulk negotiation, reputation.
- **Livestock** (if ever) — different rhythm, feed loops, separate buildings — only if it adds decision depth, not scope bloat.
- **Regional demand shifts** — crop rotation as response to market, not arbitrary quest list.

Economy should reward **planning**, not reflexes. The player who planted the wrong crop mix should feel consequence in Q3, not instant game over.

---

## What creates interesting decisions

Decisions matter when **two good options conflict**:

| Decision | Tension |
|----------|---------|
| Buy tractor vs hire worker | Capital vs recurring cost; flexibility vs coverage |
| Own vs lease land | Long-term asset vs cash preservation |
| Sell now vs store | Liquidity vs price gamble; bin capacity |
| One large combine vs two smaller | Throughput vs redundancy; single point of failure |
| Diversify crops vs specialize | Risk spread vs equipment efficiency |
| Invest in mill vs more fields | Vertical margin vs horizontal scale |
| Manual crisis fix vs let GPS finish | Player attention as scarce resource |
| Take contract vs spot market | Certainty vs upside |

**Bad decisions** are obvious one-correct-answer choices (“always buy the most expensive tractor”). **Good decisions** depend on farm state, season, and player strategy.

Crop care, block layout, and road distance should feed these decisions — not exist as isolated mini-games.

---

## Preventing repetition

### Mechanics that create natural variety

- **Crop rotation and soil fertility** — fields want different plans over time.
- **Seasonal calendar** — different problems each month.
- **Parallel bottlenecks** — harvest, transport, and sale compete for attention.
- **Block geography** — Block A near silo vs Block C remote — same task, different logistics puzzle.
- **Equipment compatibility** — headers, crops, attachments change what “ready” means.
- **Work order scope** — single field vs block vs contract fulfillment changes dispatch.
- **Market and contract volatility** — same farm, different year strategy.

### Mechanics that become chores (minimize or automate)

- Repeating identical field commands field-by-field after scale.
- Walking every machine manually across the map for routine work.
- Clicking through the same radial menu ten times per minute.
- Inventory micromanagement without strategic consequence.
- Pure waiting with nothing to plan.

**Design rule:** If a skilled player does it the same way every time without thinking, it should eventually be **delegatable** (GPS, workers, work orders) while leaving **exceptions** to the player.

---

## Automation philosophy

Automation must **unlock scale**, not **delete gameplay**.

```text
Automation handles routine execution.
The player handles intent, priorities, and exceptions.
```

### What automation should do

- Execute work orders across fields and blocks.
- Repeat proven patterns (plow Block B, spray eligible growing fields).
- Keep machines productive while the player plans the next season.
- Surface problems (bin full, machine blocked, contract at risk) — not hide them.

### What the player should still enjoy manually

- **First contact** — learning a new field, crop, or machine.
- **Crisis intervention** — reroute a combine, clear a logistics jam, reassign a work order.
- **High-stakes moments** — harvest before weather window closes; contract deadline week.
- **Layout and expansion** — buying land, placing logistics flow, choosing specialization.
- **Strategic planning** — season plan, crop mix, capital allocation.

### Automation progression (player-facing fantasy)

```text
I drive everything
    → GPS handles one machine
    → Work orders handle blocks
    → Workers own orders
    → I manage the company dashboard
```

The player should feel **more powerful** as automation grows, not **more bored**. New automation tiers open **new problems** (fleet coordination, storage, contracts) — same pattern as Factorio belts unlocking science, not replacing fun.

---

## Player motivation

Players stay when they have **agency, clarity, and compounding identity**.

| Motivation | FarmOS expression |
|------------|-------------------|
| **Mastery** | Better margins, smoother harvests, fewer bottlenecks |
| **Growth** | Visible farm expansion, busier yard, more land |
| **Expression** | Crop mix, specialization, fleet composition |
| **Completion** | Contracts fulfilled, blocks fully utilized, processing online |
| **Relaxation** | Watching machines work; overview panels; calm pacing |
| **Optimization** | Optional depth for spreadsheet-minded players |

Avoid motivation that relies only on **number go up** without new problems to solve.

---

## End-game vision (100+ hours)

Imagine a player deep into FarmOS:

**The farm**

- Owns or leases land across all blocks (and future regions).
- Runs **6–12 machines** with distinct roles — not 6 identical tractors.
- Maintains **processing capacity** (mill, storage expansion, maybe bakery).
- Juggles **2–4 active work order types** during peak season.

**What the player spends time on**

- Reviewing fleet and work orders — who is idle, what is blocked.
- Contract and market timing — sell, store, or process.
- Season planning — next rotation, capital budget.
- Exception handling — full bin, broken window, worker reassignment.
- Expansion decisions — new land, new machine class, new building.

**What the player rarely does**

- Manually plow every field.
- Drive empty trailers across familiar routes without reason.

**The emotional beat**

The farm feels like a **living operation** the player built. Screenshots show clustered machinery, varied crop colors, roads in use — a place with rhythm, not a static diorama.

---

## What should never become tedious

### Keep enjoyable

- Strategic planning and season setup.
- First harvest of a new crop on new land.
- Solving a logistics bottleneck with a clever reassignment.
- Watching a well-planned block order complete.
- Meaningful purchases (first combine, first owned Block C field).
- Reading the farm at a glance — fleet, map, storage.

### Should become automated (over time)

- Repetitive single-field GPS after the player has proven the pattern.
- Routine block cultivation when no exceptions exist.
- Standard trailer shuttles on fixed routes (future transport orders).
- Refill / routine maintenance when systems support it.

### Never automate away entirely

- Major capital decisions.
- Contract acceptance and risk tradeoffs.
- Crisis response.
- Expansion timing.
- Crop mix strategy.

---

## Comparison with other games (what FarmOS is *not*, what it can be)

| Game | Core appeal | FarmOS distinction |
|------|-------------|-------------------|
| **Farming Simulator** | Vehicle authenticity, modding, solo field zen | FarmOS: management scale, browser access, less driving skill |
| **Factorio** | Factory optimization, infinite complexity | FarmOS: seasonal biological rhythm, land as identity, not pure graph |
| **Satisfactory** | 3D factory exploration, spectacle | FarmOS: grounded agrarian realism, smaller scope, readable ops |
| **Captain of Industry** | Production chains, island planning | FarmOS: open landscape, machine dispatch, crop/live world |
| **Workers & Resources** | Deep logistics simulation | FarmOS: lighter logistics, faster sessions, agricultural focus |
| **Transport Fever** | Network building over decades | FarmOS: player-owned fleet on fixed map, not route-building sim |
| **RimWorld** | Story emergence, crisis drama | FarmOS: calmer pacing, economic progression, less tragedy RNG |

### What FarmOS can uniquely offer

1. **Browser-native farm command** — check your fleet between meetings; scale without installing a 100 GB sim.
2. **Work-order-first agriculture** — GPS and workers as business tools, not cheat codes.
3. **Regional believability** — Central European field blocks, crop care, and art direction as identity.
4. **Management at human scale** — readable fleet, event log, block orders; complexity without Factorio-grade overhead.
5. **The “grow into a company” arc** — same map, same systems, escalating organizational challenge.

FarmOS wins by being the game where **you feel like an agricultural director**, not a hired hand on loop.

---

## Mechanics to prioritize

| Priority | Mechanic | Why |
|----------|----------|-----|
| High | Seasonal planning & crop rotation | Long-term strategy |
| High | Contracts & deadlines | Purpose beyond spot grinding |
| High | Workers + work order panel (16E–16F) | Scale without chore |
| High | Storage & logistics bottlenecks | Makes land distance matter |
| High | Processing margin chain | Economic depth |
| Medium | Maintenance / breakdown (light) | Fleet decisions |
| Medium | Loans & lease economy | Expansion tension |
| Medium | Reputation / buyers | Market identity |
| Medium | Weather windows (readable, not punishing) | Calendar pressure |
| Lower | Livestock | Only if distinct loop |
| Lower | Multiplayer | Out of current scope |

---

## Mechanics to avoid

| Avoid | Reason |
|-------|--------|
| Pure idle game loop | Kills command fantasy |
| Mandatory manual repetition at scale | Chores without decisions |
| Driving as primary skill check | Wrong genre |
| Opaque automation | Player must trust and debug orders |
| Punishing RNG without counterplay | Frustration, not management |
| Feature sprawl without economic consequence | Content that does not matter |
| Spreadsheet-required play for casual users | Accessibility matters in browser |
| Copying FS vehicle depth | Unwinnable comparison |
| Copying Factorio infinite scaling | Loses agrarian identity |

---

## Suggested roadmap after Phase 16

Phases are **design themes**, not implementation commitments. Order may shift based on playtesting.

### Phase 17 — Season & strategy layer

- Crop rotation and fertility consequences (light, readable).
- Season planner UI — intended crops per block.
- Annual goals / chapter milestones.
- Weather or growth windows as planning pressure (not disaster simulator).

*Player question answered:* “What should I grow this year?”

### Phase 18 — Economy depth

- Contracts (volume, deadline, premium).
- Spot market volatility and storage hold strategy.
- Loans, operating costs, lease machinery.
- Buyer reputation tiers.

*Player question answered:* “When do I sell, and to whom?”

### Phase 19 — Workers & company operations (complete 16E–16F)

- Farm workers owning work orders.
- Work Orders panel — eligible scope, priorities, pause/resume.
- Manager overview — fleet utilization, idle time, at-risk contracts.
- Notifications for exceptions (bin full, order stalled).

*Player question answered:* “Who does what while I plan?”

### Phase 20 — Processing & value chain

- Mill/bakery as strategic investments.
- Input/output timing with harvest flow.
- Margin analytics per crop path.

*Player question answered:* “Do I sell grain or flour?”

### Phase 21 — World & expansion

- Additional regions or map packs (art-led).
- Road network gameplay — distance, approach, future truck routes.
- Land auctions, neighbor plots, long-term territorial goals.

*Player question answered:* “Where does the company grow next?”

### Phase 22 — Late-game operations

- Transport orders (recurring logistics).
- Light maintenance and downtime.
- Cooperative / export contracts.
- Optional hard mode economic pressure.

*Player question answered:* “How do I keep a large farm efficient?”

### Ongoing — Polish & identity

- Event log as farm newspaper.
- Seasonal visuals and audio.
- Studio tools for community maps.
- Balance passes so each tier has 10–20 hours of **new** problems.

---

## Design compass (one paragraph)

FarmOS succeeds when every hour adds **operational responsibility** the player welcomes — more land, more machines, more contracts, more ways for a plan to succeed or need a smart fix. Automate the routine; celebrate the overview; keep the player as **director of a place they built**. Money funds growth, but growth funds **interesting problems**. That is the loop worth hundreds of hours.

---

## Document maintenance

This vision informs product and phase planning. It does not authorize architecture changes.

When a proposed feature does not serve **command, scale, or regional identity**, question it.

When a feature removes decisions without opening new ones, question it.

When a feature makes the player repeat proven patterns manually at hour 50, automate it.

---

*FarmOS Gameplay Vision — design compass for long-term development.*
