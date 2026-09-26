# TRAVERSAL-REMAINING-LEGS-AUDIT-1

Audit / gallery / architecture-plan pass. **No production behaviour changed.** T0 remains the only
gate-enabled Traversal leg; T1/T2/T3/T4 relations exist structurally but are not production-enabled.
This document is the operator-review package: current-state evidence, generic-vs-T0 matrix, target
architecture, per-leg audits, T2 retirement plan, final-refuge preparation plan, missing-asset
inventory, and recommended branch order.

## 1. Baseline

- Branch: `traversal-remaining-legs-audit-1` (created from `main`, not merged).
- Baseline commit: `d300ca95487732a459b50cfc82bf2407bb4a264e`.
- Production gate: `TRAVERSAL_PRODUCTION_GATE` is fail-closed with `rolloutLegIds: ['T0']` —
  no query-string, DEV, or environment override (`src/traversal/TraversalFeaturePolicy.ts:14-18`).
- Gallery evidence: `docs/reports/traversal-remaining-legs-audit-1-browser/` (97 indexed current
  production captures, including 17 T0 references and required named aliases, plus 3 asset
  contact sheets, `gallery-index.json`, `index.md`, and static `index.html`).
  Method: unmodified app, RunSystem-built durable saves resumed through the real title-screen
  Continue, real UI clicks; combat advances via the existing DEV QA victory control only.
- Validation refreshed on this branch: focused relation/runtime/controller/feature/structure/full-route/
  historical-guard/refuge suites **71/71**; full Vitest **2562/2562** across **160** files;
  `tsc --noEmit` and `vite build` passed. The full gallery runner completed 4/4 routes with
  zero recorded page errors, and the static HTML index rendered 97 cards in Chromium. The
  build emitted the existing large-chunk advisory.

## 2. Current Traversal architecture

Production flow today (T0 only):

1. `GameApp.enterCampaignPresentation()` finds the leg candidate only when
   `candidate.id === 'T0'` (`src/game/GameApp.ts:865-871`), gate-checked via
   `isTraversalProductionEnabledForLeg`, then calls `enterTraversalT0` (`GameApp.ts:283-355`).
2. `enterTraversalT0` presents the departure Journey boundary (`Vers <destination>` /
   `Prendre la route`), saves an auto-save at the resolved origin (the traversal session itself is
   never persisted), then mounts `TraversalT0Scene` under `document.body.dataset.campaignSurface =
   'traversal'`.
3. `TraversalT0Scene` (`src/traversal/TraversalT0Scene.ts`, ~773 lines) owns DOM, caravan, road
   motion, lane interaction, beat presentation, transitions, fork overlay wiring, and canonical
   node handoffs. It throws for any leg other than T0 (`TraversalT0Scene.ts:109`), hard-codes
   `selectTraversalBranch(run, 'T0', nodeId)` (`:123`) and reads `traversalBranches!.T0` (`:133`).
4. Route authoring is T0-specific: `resolveTraversalT0Route` rejects non-T0 legs with `NOT_T0`
   (`TraversalT0Route.ts:264-273`), appends `AMBIENT_T0_BEATS`, materializes branch beats at fixed
   `progress01: .91` bound to `locationId: 'selected-route'` (`:316-335`), and stamps
   `legId: 'T0'`, `distanceKm: 4` (`:347-356`).
5. World composition is T0-specific: `TRAVERSAL_T0_WORLD` is 10 fixed sections under
   `/assets/generated/lion-phase/traversal/t0/world-v1` with a fixed boundary table
   (`TraversalT0World.ts:46-78`); `resolveTraversalWorld(presentedBranch)` encodes the T0
   junction/selected-route variant swap (`:88-103`).
6. `TraversalWorldRenderer` is structurally reusable but imports `resolveTraversalWorld` and uses
   `TRAVERSAL_WORLD_ASSETS.forest` for section margins (`TraversalWorldRenderer.ts:2, 22, 46`).
7. Runtime + controller are already generic over `LionTraversalLeg`:
   `TraversalRunRuntime` (phases RUNNING → DECISION/LOCAL_INTERACTION → APPROACHING_STAGE →
   NODE_HANDOFF/NODE_RESOLUTION → RESUMING → FORK_OVERLAY → ARRIVING → COMPLETE) and
   `TraversalRunController` (stage activation, fork overlay, handoff callbacks) take the leg as a
   parameter and contain no T0 literal.
8. RunSystem is authoritative for route topology: `selectTraversalBranch` and
   `bypassTraversalNode` validate against `LION_TRAVERSAL_LEGS` + `getAvailableRunNodes`, but both
   hard-code `candidate.id === 'T0'` (`src/game/runSystem.ts:644, 654`). `getAvailableRunEdges`
   already consumes `run.traversalBranches` and `run.bypassedRouteNodeIds` generically
   (`runSystem.ts:618-631`).
9. Local (in-traversal) road combat is separate from campaign combat: `playTraversalRoadCombat`
   requires `session.legId === 'T0'` and `phase === 'LOCAL_INTERACTION'`
   (`GameApp.ts:413-446`); it uses `createRoadEncounterConfig` which clones a composition,
   strips pre/post dialogue, zeroes rewards, and never calls canonical `resolveCombat` —
   the result is a boolean returned to the road (`TraversalRoadEncounter.ts:10-22`).
   `ROAD_POOL` is a fixed forest pool (`wolf_pack`, `spider_nest`, `forest_patrol`).
10. Optional-ignore consequences are authored content, T0-only by design:
    `resolveTraversalIgnoreConsequence` returns `null` for `legId !== 'T0'`
    (`src/game/TraversalOptionalConsequencePolicy.ts:13`).
11. Arrival completes the physical leg only: `completeTraversalT0` re-enters
    `enterCampaignPresentation`, which presents the canonical destination boundary — explicit
    player agency, never an implicit node consume (`GameApp.ts:399-411`).

## 3. Generic-vs-T0-specific matrix

| Module | Status | T0 coupling |
|---|---|---|
| `TraversalRunRuntime` | Generic | None — session model keyed on `LionTraversalLeg` |
| `TraversalRunController` | Generic | None — leg + callbacks injected |
| `TraversalForkOverlay` | Generic | Implements the relation's `forkPresentation` contract |
| `TraversalRoadSpace` | Generic primitive | Fixed road metrics; reusable as-is |
| `TraversalTransition` (`TRAVERSAL_RHYTHM`, `transitionEase`) | Generic | None |
| `TraversalSprite` | Generic | None |
| `TraversalInteractionGrammar` | Generic seam | Reads `TRAVERSAL_LOCAL_NARRATIVES` registry (T0-only content today, keyed by beat id — extendable per leg) |
| `TRAVERSAL_DEPTH` planes | Generic | Plane constants reusable |
| `TraversalForegroundRenderer` / `TRAVERSAL_OCCLUDERS` | T0 assets | ferns/roots under `t0/depth-v1/foreground`; occluder layout is T0 spacing |
| `TraversalWorldRenderer` | Generic mechanics | `resolveTraversalWorld` + `TRAVERSAL_WORLD_ASSETS.forest` margin art hard-imported |
| `TraversalCaravan` / `TRAVERSAL_CARAVAN` | T0 vehicle | Painted caravan + wheel metadata fixed to `t0/vehicle/traversal-caravan` |
| `TRAVERSAL_T0_ASSETS` | T0-only | fork sign, foreground loop, vehicle, chest, cart, waystone |
| `TraversalT0Route` | T0-only | `legId:'T0'` type, `NOT_T0` guard, ambient beats, fork at .91, `distanceKm:4`, `resolveRoadEncounterId` seed pick from forest `ROAD_POOL` |
| `TraversalT0World` | T0-only | Fixed 10-section composition, T0 junction variant logic |
| `TraversalT0Scene` | T0-only | DOM construction, guard, `selectTraversalBranch('T0')`, world/route/caravan imports |
| `TraversalRoadEncounter` | Mostly T0 | Config cloning is generic; `ROAD_POOL` is T0-flavoured |
| `TraversalOptionalConsequencePolicy` | T0-only content | Authored per-node opt-out consequences; null elsewhere |
| `TraversalFeaturePolicy` | Generic gate | `rolloutLegIds` is the single control point |
| `runSystem` branch/bypass | Generic shape | Two `id === 'T0'` literals |
| `GameApp` traversal integration | T0-only | `candidate.id === 'T0'` entry, `enterTraversalT0`, road-combat leg check, `activeTraversal: TraversalT0Scene` type, `?qa=1&traversal=t0` preview |

Responsibility classification for the extraction branch (the labels are intentional boundaries):

| Responsibility and source | Classification | Target |
|---|---|---|
| Phase transitions and stage completion (`TraversalRunRuntime.ts:51-61, 146-175, 304`) | GENERIC_ALREADY | Keep shared; receives `LionTraversalLeg` |
| Stage activation, fork callbacks, handoff (`TraversalRunController.ts:37`) | GENERIC_ALREADY | Keep shared; receives leg and callbacks |
| Fork UI contract (`TraversalForkOverlay.ts:13`, `LionCampaignTravelRelations.ts:10-20`) | PRESENTATION_ONLY | Reuse with relation-owned fork semantics |
| T0 forest art, foreground, caravan, ambient props (`TraversalT0Assets.ts:1`, `TraversalT0World.ts:46-103`) | SHOULD_BECOME_DATA | Inject per-leg world/presentation config |
| T0 route copy, 4 km pacing, forest encounter pool (`TraversalT0Route.ts:118-131, 264-356`) | SHOULD_BECOME_DATA | Per-leg route authoring; stages still from relation |
| Scene DOM, movement, hit tests, interaction panels (`TraversalT0Scene.ts:82-773`) | SHOULD_BECOME_SHARED_RUNTIME | Extract generic `TraversalScene` with T0 adapter |
| Scene T0 guard and branch lookup (`TraversalT0Scene.ts:109,123,133,163`) | T0_SPECIFIC | Replace literals with injected `leg.id` |
| World renderer's fixed T0 import (`TraversalWorldRenderer.ts:2,22,46`) | SHOULD_BECOME_SHARED_RUNTIME | Inject world resolver and margin art |
| Active-scene lifecycle and local combat checks (`GameApp.ts:150,283-446,865-873`) | SHOULD_BECOME_SHARED_RUNTIME | Generic scene type/entry and gated leg scan |
| Traversal rollout (`TraversalFeaturePolicy.ts:14-38`) | CAMPAIGN_AUTHORITY — DO NOT MOVE | Keep `rolloutLegIds: ['T0']` until later approvals |
| Leg topology and stage membership (`LionCampaignTravelRelations.ts:54-151`) | CAMPAIGN_AUTHORITY — DO NOT MOVE | T2 semantics change only in its later branch |
| Anchor role, entry/exit policy (`LionCampaignStructure.ts:73-346`) | CAMPAIGN_AUTHORITY — DO NOT MOVE | Keep separate from visual config |
| Branch selection, bypass and available edges (`runSystem.ts:618-658`) | CAMPAIGN_AUTHORITY — DO NOT MOVE | Generalize T0 literal within RunSystem |
| Shared gold/reputation/route-loot HUD (`CampaignStatusHud.ts:8,16,73`) | PRESENTATION_ONLY | Read state; reuse without duplicating HUD or changing loot |

## 4. Target generic architecture

Extract presentation seams; do not fork the campaign authority:

- **`TraversalLegPresentation` (new contract, per leg):** bundles
  `resolveRoute(leg, runNodes, party, seed) → TraversalRoute` (rename of `TraversalT0Route`,
  `legId` widened to `LionTraversalLegId`), `world(leg, presentedBranch) → TraversalWorldSection[]`,
  `vehicleAssets`, `foregroundAssets`, `ambientBeats`, `roadEncounterPool`, `distanceKm`,
  `originDeparture`/`destinationArrival` presentation metadata. T0 becomes one registered
  presentation; T1/T3/T4 add theirs without touching runtime code.
- **`TraversalScene` (generic):** today's `TraversalT0Scene` minus literals — the leg id flows
  through to `selectTraversalBranch(run, leg.id, nodeId)`, `traversalBranches[leg.id]`, and the
  injected route/world/vehicle. Keep `TraversalT0Scene` as a thin `extends`/alias during migration
  so existing tests keep pinning T0 behaviour.
- **World renderer:** inject `resolveWorld(branch)` and a `marginAsset` instead of importing T0
  symbols (`TraversalWorldRenderer.ts:2` is the only coupling).
- **RunSystem:** drop the `&& candidate.id === 'T0'` literals in `selectTraversalBranch` /
  `bypassTraversalNode` — the relation tables already validate stages; gate enforcement stays in
  `TraversalFeaturePolicy` + `enterCampaignPresentation`.
- **GameApp:** `enterCampaignPresentation` scans `LION_TRAVERSAL_LEGS` for any
  `usesTraversalPresentation(leg.id)` leg whose origin matches; `playTraversalRoadCombat` checks
  `LOCAL_INTERACTION` + leg rollout instead of the T0 literal; `activeTraversal` typed as the
  generic scene.
- **Forks, optional interactions, canonical handoffs:** unchanged — fork stays a
  `TRAVERSAL_OVERLAY` inside the mounted world; optional interrupts stay local decisions;
  `enterRunNode`/`resolveRunNode`/`markResolved` remain the only canonical commit path.
- **Local road combat vs campaign combat:** unchanged boundary — road encounters are seeded local
  compositions with stripped rewards; stage nodes (e.g. `lion-valmir-road`, `lion-final-trial-combat`)
  keep canonical `combatId` authority through `resolveRunNode`/`startCombat`.

## 5. T1 audit — First Refuge → Bois-Clair

Relation (`LionCampaignTravelRelations.ts:86-104`): origin `lion-first-refuge`, destination
`lion-village-choice`, stages:

1. `lion-reserve-trail` — MANDATORY_INTERRUPT (event/`reserve_trail`, VALMIR_ROAD, ROUTE_INTERRUPT,
   exit RESUME_TRAVERSAL; dialogue `reserve_trail`, 2 authored choices — convoy raid vs mark-and-go).
2. `lion-valmir-road` — MANDATORY_INTERRUPT (combat `road_to_valmir`/`marsh_crossing` seeded
   variants, VALMIR_ROAD, exit `ROUTE_FORK`).
3. `lion-second-trial-event` / `lion-second-trial-combat` — IN_TRAVERSAL_FORK with the standard
   `forkPresentation` contract. **Stricter than T0:** no `branchEncounterMode` and no
   `optionalBranchNodeIds` — both branches commit to a mandatory encounter.
   - event: `old_shrine_event` (VALMIR_ROAD hold `old-shrine-tableau.png`, cinematic
     `shrine_reveal_context`).
   - combat: `troll_crossing`/`serpent_checkpoint`/`serpent_duelist_trial` adaptive + mandate
     variants (hold `forest-road-tableau.png`, reveal cinematics per content id).

Current production path (verified by gallery): Journey departure from the resolved refuge →
`reserve_trail` dialogue → Journey → `pre_valmir_road` → combat → `post_valmir_road` →
`ate_serpent_general_warning` → `valmir_route_fork` cinematic (held end-frame over the live
fork Journey — observed) → fork Journey (`La route se divise`, choices
`lion-second-trial-event`/`lion-second-trial-combat`) → `old_shrine_event` →
`bois_clair_arrival` cinematic → `village_choice` dialogue → `village_defense`/`village_raid`
combat → aftermath dialogue (`village_defense_aftermath`) → `ate_maelor_seal_analysis` +
reputation event → Journey handoff to `lion-second-refuge`.

Asset readiness: VALMIR_ROAD family ships `travel/valmir-road-travel.png` (byte-identical to
`valmir-road-tableau.png`) and `tableau/old-shrine-tableau.png`; BOIS_CLAIR ships burning +
saved/sacrificed aftermath tableaux and a byte-identical travel plate. **No side-on 1536×1024
Traversal world sections exist for this leg** — the current plates are three-quarter perspective
vistas with a receding road, not lateral road sections (see `asset-sheet-t1-bois-clair.png`).

Bois-Clair arrival sequencing (future): Traversal destination = `lion-village-choice`; arrival
must keep the physical leg complete and hand the canonical anchor to `resolveRunNode` unchanged —
the `bois_clair_arrival` cinematic + `village_choice` dialogue + village combat + aftermath stay
in node authority, identical to today's Journey-mediated flow.

## 6. T2 retirement / NarrativeStage handoff plan

Current T2 (`LionCampaignTravelRelations.ts:106-110`): `lion-village-choice → lion-second-refuge`,
`stages: []` — a playable leg with zero route content. Both anchors are the same
geographic/narrative area: `lion-village-choice` is BOIS_CLAIR, `lion-second-refuge` is
SECOND_REFUGE night; the edge already has a dedicated travel plate
(`travel/second-refuge-morning-travel.png`) and `resolveCin6aRefugeDeparture('lion-second-refuge')
→ 'second_refuge_departure'` exists for the *outbound* direction.

Target: Bois-Clair resolution → NarrativeStage continuity → Second Refuge arrival → existing
refuge hub. **No physical Traversal leg between them.**

- Keep the literal id `T2` in `LionTraversalLegId` (historical numbering; T3/T4 keep their ids).
- Introduce a future playable-leg type equivalent to
  `LionPlayableTraversalLegId = 'T0' | 'T1' | 'T3' | 'T4'`. Keep the historical
  `LionTraversalLegId` for compatibility, while typed production rollout gates and playable
  leg definitions exclude T2.
- Preferred later representation: remove the T2 object from the **playable**
  `LION_TRAVERSAL_LEG_DEFINITIONS`, retain historical `T2` in the persisted leg-id union, and
  declare `T2` in a separate `LION_NARRATIVE_HANDOFFS` relation with the same origin/destination.
  Audit that direct edge explicitly (same class as `LION_MAJOR_CAMPAIGN_TRANSITIONS`), because
  `auditLionTravelRelations` currently walks only playable legs. Do not renumber T3/T4.
- `LionCampaignStructure`: `lion-village-choice.exitPolicy` is currently `START_TRAVERSAL`
  (`:247`); the retirement branch flips it to a narrative-continuation policy.
  `lion-second-refuge.exitPolicy` stays `START_TRAVERSAL` (T3 origin).
- Current production selection does **not** consult T2: `GameApp.enterCampaignPresentation`
  selects only `candidate.id === 'T0'` (`GameApp.ts:865-877`) and otherwise enters Journey.
  Journey receives `getAvailableRunNodes` from RunSystem (`GameApp.ts:973-985`), which derives
  choices from the RunGraph's direct edges (`runSystem.ts:618-639`); the relation table is used
  by the audit and by T0 branch/bypass validation, not by this T2 Journey handoff.
- Current presentation is a Journey/TRAVEL surface on
  `edge:lion-village-choice>lion-second-refuge` (SECOND_REFUGE `second_refuge_morning_travel`)
  plus `ate_bois_clair_night_watch` inside the refuge. The later handoff branch should stage
  **Bois-Clair saved/sacrificed aftermath → company regroup → time shift → second-refuge night
  arrival** through NarrativeStage, then open the existing hub. Existing outcome tableaux and
  `second-refuge-night-tableau.png` cover the location; the morning travel still belongs to the
  later outbound T3 departure. Do not move or auto-resolve either RunNode.
- Test impact (retirement branch, not this one): `LionCampaignTravelRelations.test.ts` asserts
  exactly `['T0'..'T4']` (line 10), 13 interrupts, and 3 forks — the T2 semantics change must keep
  ids stable and update only the playable-leg expectations.
- Save compatibility: production never starts T2 because the gate is T0-only; existing durable
  saves still resume at `lion-village-choice` or `lion-second-refuge`, and those ids and their
  direct link must stay stable. Preserve the serialized `traversalBranches` and
  `bypassedRouteNodeIds` shapes; ignore or safely reject a hand-authored historical `T2` branch
  entry instead of adding a save-schema migration. Exercise reload/Continue at both anchors.

## 7. T3 audit — Second Refuge → Garen → Witnesses → final fork → Shadow Signs

Relation (`LionCampaignTravelRelations.ts:112-130`): origin `lion-second-refuge`, destination
`lion-shadow-signs`, stages:

1. `lion-lancer-recruit` — MANDATORY_INTERRUPT (event/`mystery_lancer_recruit` = Garen,
   WITNESS_ROAD, `garen_encounter` cinematic, optional cast flag `recruitedLancer`).
2. `lion-witnesses` — MANDATORY_INTERRUPT (event/`witnesses_on_road`, WITNESS_ROAD, exitPolicy
   `ROUTE_FORK`; 6-member required cast; ATE `ate_lion_council_doubt`; `witnesses_encounter`
   cinematic observed in gallery).
3. `lion-final-trial-event` / `lion-final-trial-combat` — IN_TRAVERSAL_FORK (same strict shape as
   T1: both mandatory).
   - event: `mystery_dragon_roost` / `serpent_informant` / `mystery_shrine` +
     `FINAL_EVENT_AFTER_ELITE` adaptive (SHADOW_RUINS, `young_dragon_encounter` /
     `serpent_informant_encounter` / `shrine_reveal_context` cinematics; combat-capable event:
     `pre_young_dragon_roost` → combat observed in gallery).
   - combat: `ruins_guardians`/`serpent_hunters` tier variants (`ruins_approach_context` /
     `serpent_road_tension` cinematics).

Destination `lion-shadow-signs` is a MAJOR_REVELATION anchor (DIALOGUE `shadow_signs`, evidence
choice, two ATEs `ate_ruins_awaken` + `ate_serpent_retreat_order`) — a hard narrative boundary,
not a route interrupt.

Asset readiness: WITNESS_ROAD ships `witness-road-tableau.png` + byte-identical travel plate;
SHADOW_RUINS ships `shadow-ruins-tableau.png`, `dragon-roost-area.png`, `shadow-ruins-approach.png`
(travel). All are perspective vistas — **no side-on Traversal sections**. Day→night transition is
authored (second-refuge-morning → witness-road daylight → moonlit ruins), which fits a single leg
with an embedded lighting shift at the fork/ruins approach.

Distinct boundaries to preserve: `lion-witnesses` (survivor testimony, WITNESS_ROAD) and
`lion-shadow-signs` (evidence reveal, SHADOW_RUINS) must remain separate canonical nodes with the
Traversal fork between them; the fork decision stays a `TRAVERSAL_OVERLAY` on the mounted world.
The existing controller's `NODE_HANDOFF → NODE_RESOLUTION → RESUMING` path can carry Garen,
Witnesses, event dialogue, and both event-branch and combat-branch combat returns without
changing campaign resolution. T3's two pre-fork stages and both fork branches are mandatory;
no T0 optional-ignore policy should be copied. Local road props/combat remain separate from
canonical stage combat. The gallery's dragon-roost **event** branch enters combat, so an
`event` RunNode cannot be assumed to mean dialogue only.

## 8. T4 audit — Shadow Signs → Final Refuge

Relation (`LionCampaignTravelRelations.ts:131-136`): origin `lion-shadow-signs`, destination
`lion-final-refuge`, `stages: []` — an intentionally empty atmospheric connector.

Current production: post-`shadow_signs` ATEs, then Journey on
`edge:lion-shadow-signs>lion-final-refuge` (FINAL_REFUGE `final-refuge-travel.png`,
byte-identical to `final-refuge-tableau.png`), then the `final_refuge` story dialogue.

Future Traversal intent: a short, uninterrupted run — the night-ruins edge resolving into the
last-lit camp. `stages: []` means no canonical interrupts; ambient beats only. Reuse candidates:
`shadow-ruins-approach.png` / `final-refuge-travel.png` as *palette references* for one or two new
side-on sections (they are perspective vistas, not sections). Arrival must land on
`lion-final-refuge` exactly as today (Journey-style agency) — the preparation hub is a separate
later change (§13).

The **45–75 second** unobstructed-travel estimate is a prototype hypothesis, not an acceptance
contract. Calibrate final T4 duration from runtime playtesting at desktop and mobile. A trial
composition could spend roughly one third in cool ruins, one third in a quieter open road, and
one third revealing the restrained warm camp. Keep zero authored campaign stops. Ambient props
may reward looking around but cannot become required route blockers or fabricated encounters.

Visual contracts for later art approval:

| Leg | Family progression | Landmarks and pressure | Arrival seam |
|---|---|---|---|
| T1 | FIRST_REFUGE → VALMIR_ROAD → BOIS_CLAIR | Open mountain/light and convoy geography; smoke and pressure accumulate toward the village; fork reads as shrine vs checkpoint | Physical arrival precedes `bois_clair_arrival` and canonical village choice |
| T3 | SECOND_REFUGE → WITNESS_ROAD → SHADOW_RUINS | Warm safe departure → daylight human road and testimony → uncertainty → ancient ruin influence; never start visually corrupted | Fork and combat resume on road, then physical arrival precedes Shadow Signs evidence dialogue |
| T4 | SHADOW_RUINS → FINAL_REFUGE | Quiet aftermath, cool ruins yielding to restrained warm camp; longer visual breathing and no artificial density | Arrive at the existing final-refuge story boundary until preparation-hub branch |

## 9. Asset inventory

Production pack `public/assets/generated/lion-phase/environments/demo-environment-pack-v1`
(manifest `src/render/data/demo-environment-pack-v1.production.json`):

The machine-readable report contains **43 per-segment production asset entries** with full
repository paths, dimensions, role, clean-environment status, baked-cast status, and usability.
`node tools/traversal-remaining-legs-audit-1-inventory.mjs` regenerates that inventory from the
approved manifest and MP4 headers. The table below summarizes the per-leg decisions; every
listed PNG is environment-only with no baked actors, while the cinematic clips are fixed
editorial shots whose cast varies. None is a lateral Traversal section.

| Leg / segment | Current production image/still (under the pack root above) | Current video (under `public/assets/cinematics/`) | Size and use |
|---|---|---|---|
| T1 / refuge exit | `tableau/first-refuge-tableau.png`, `travel/first-refuge-travel.png` | `first_refuge_departure.mp4` | PNG 1672×941; video 1920×1080; tableau for NarrativeStage, travel plate for Journey |
| T1 / reserve and Valmir | `tableau/valmir-road-tableau.png`, `travel/valmir-road-travel.png`, `tableau/old-shrine-tableau.png` | `valmir_route_fork.mp4`, `shrine_reveal_context.mp4`, `serpent_road_tension.mp4`, `troll_crossing_reveal.mp4`, `serpent_duelist_reveal.mp4` | PNG 1672×941; videos 1920×1080; vistas/holds and content cinematics only |
| T1 / Bois-Clair | `tableau/bois-clair-tableau-burning.png`, `travel/bois-clair-travel.png`, `tableau/bois-clair-tableau-aftermath-saved.png`, `tableau/bois-clair-tableau-aftermath-sacrificed.png`, `strategic/bois-clair-burning-strategic.png`, `combat-stage/bois-clair-burning-stage.png` | `bois_clair_arrival.mp4`, `bois_clair_saved.mp4`, `bois_clair_sacrificed.mp4` | PNG 1672×941; videos 1920×1080; outcome-specific holds and combat art, no world layers |
| T3 / refuge exit | `tableau/second-refuge-night-tableau.png`, `travel/second-refuge-morning-travel.png` | `second_refuge_departure.mp4` | PNG 1672×941; video 1920×1080; preserve warm night → morning departure progression |
| T3 / Garen and witnesses | `tableau/witness-road-tableau.png`, `travel/witness-road-travel.png` | `garen_encounter.mp4`, `witnesses_encounter.mp4` | PNG 1671×941; videos 1920×1080; daylight human road, staged cast stays in NarrativeStage/video |
| T3 / fork and ruins | `tableau/dragon-roost-area.png`, `travel/shadow-ruins-approach.png`, `tableau/shadow-ruins-tableau.png`, `strategic/lion-sanctum-strategic.png`, `combat-stage/lion-sanctum-stage.png` | `young_dragon_encounter.mp4`, `serpent_informant_encounter.mp4`, `shrine_reveal_context.mp4`, `ruins_approach_context.mp4`, `serpent_road_tension.mp4`, `shadow_signs.mp4` | PNG 1672×941; videos 1920×1080; moonlit holds/approach and combat art, unsuitable as lateral road sections |
| T4 / ruins departure | `tableau/shadow-ruins-tableau.png`, `travel/shadow-ruins-approach.png` | — | 1672×941; cool ruin palette reference and Journey/NarrativeStage source |
| T4 / final camp | `travel/final-refuge-travel.png`, `tableau/final-refuge-tableau.png` | `final_refuge_dossier.mp4` at destination | PNG 1672×941; video 1920×1080; warm arrival hold, not a Traversal world section |

Tableau PNGs are suitable NarrativeStage backgrounds; travel PNGs are existing Journey plates
and possible staged stills if mapped; strategic/combat-stage PNGs belong only to those combat
surfaces. The MP4s are cinematic beats, not NarrativeStage backgrounds or Traversal layers.

- 13 visual families, 44 approved assets, 44 promoted, 170 contexts mapped, 0 unmapped, 0 fallback;
  all 44 assets byte-identical between approved and promoted forms.
- NarrativeStage/travel plates: 1672×941 (except `witness-road-tableau.png` at 1671×941).
- T0 Traversal world art: 1536×1024 side-on sections under
  `assets/generated/lion-phase/traversal/t0/world-v1` + `depth-v1/clearance` +
  `depth-v1/foreground` + `vehicle/traversal-caravan` + `entities/*` + `forest-v4/*`.
- Byte-identical tableau↔travel pairs (asset reuse, not distinct road art):
  `valmir-road-tableau.png` = `valmir-road-travel.png`;
  `bois-clair-tableau-burning.png` = `bois-clair-travel.png`;
  `witness-road-tableau.png` = `witness-road-travel.png`;
  `final-refuge-tableau.png` = `final-refuge-travel.png`.
- Every campaign edge/node in scope already has a mapped TRAVEL plate / HOLD_SOURCE tableau
  (verified in manifest `mappings`; per-leg production paths are in the JSON inventory).
- State-sensitive plates exist and must be respected: `bois-clair-tableau-burning` vs
  `…-aftermath-saved`/`…-sacrificed`; `second-refuge-night-tableau` vs
  `second-refuge-morning-travel`; `dragon-roost-area` vs generic `shadow-ruins-tableau`.
- Contact sheets: `asset-sheet-t0-world-reference.png`, `asset-sheet-t1-bois-clair.png`,
  `asset-sheet-t3-t4-final.png` in the browser gallery directory. Findings: T0 sections are
  lateral road paintings with a low empty road band; all final-act plates are three-quarter
  perspective vistas with a receding road and no actors baked in — suitable for their mapped
  NarrativeStage/Journey/combat surfaces and as *style/palette reference*, not as Traversal sections.

## 10. Missing asset inventory

Campaign topology and content already define the legs. The production gaps are generic scene
integration and Traversal-world art:

| Leg | Needed | Reuse |
|---|---|---|
| T1 | ~4–6 side-on sections: refuge-edge forest → Valmir road (daylight, smoke on horizon) → junction → two branch reads (shrine approach / fortified checkpoint) → Bois-Clair burning outskirts; cleared variant after `lion-valmir-road` combat. Traversal ends on approach to `lion-village-choice`; saved/sacrificed aftermath stays under that canonical node after arrival. | caravan, wheels, occluder sprites, chest/cart/waystone props, marker set |
| T3 | ~5–7 sections: morning refuge exit → witness road (open fields) → junction → two branch reads (dragon roost / infested ruins) → moonlit ruins approach to `lion-shadow-signs` | same vehicle/props; serpent/ruins enemy sprites exist in character registry for beats |
| T4 | 2–3 sections: night ruins edge → final approach into the lit camp | smallest leg; likely no cleared variants |
| All | No new video required for the legs themselves | existing encounter/reveal cinematics already cover stage content (§14) |

The needed section types by segment are: T1 refuge-edge departure, open Valmir/convoy road,
shrine/checkpoint fork reads, and smoke-led Bois-Clair approach; T3 warm second-refuge exit,
daylight Witness road, neutral junction, distinct event/combat branch reads, and a gradual
moonlit ruins reveal; T4 cool ruins departure, open quiet transition, and restrained warm camp
arrival. The approved vista plates in §9 provide palette and landmarks, but none can fill these
missing lateral sections directly. Retain existing caravan/props where they fit the new art;
approve any new prop set against each visual family rather than assuming T0 forest dressing fits.

## 11. Final-act gallery findings

`final-act-main` run (event branches) completed end-to-end: T1 surfaces → Bois-Clair dialogue and
combat → aftermath → Second Refuge hub → T3 surfaces → final fork → dragon-roost branch →
Shadow Signs evidence → T4 handoff → final refuge dialogue → judgement → final boss entry.
Key observations (all in `gallery-index.json` state snapshots):

- The T1 fork is currently presented by Journey (`La route se divise`) with the
  `valmir_route_fork` cinematic **held on its end frame above the live choice** — the reference
  pattern Traversal forks must replace with `TRAVERSAL_OVERLAY`.
- Village-choice resolution chains `village_defense` → `village_defense_aftermath` →
  `ate_maelor_seal_analysis` → reputation event `rep_event_roadside_intimidation` →
  `pre_serpent_reprisals` + reprisal combat + `post_serpent_reprisals` before the second-refuge
  Journey — a denser post-node stack than a Traversal arrival would have produced on T0;
  sequencing must be re-verified when T1 lands.
- Second Refuge hub (`exploration-stop`) works today on `lion-second-refuge`.
- `final_refuge` dialogue is followed by `rep_event_village_memorial_request` before the
  judgement Journey — a reputation beat that a future preparation hub must keep ordered after.
- `lion_finale_judgement` builds dynamically (`buildLionFinaleJudgement`); gallery captured the
  `lion_judgement` cinematic, choice, `serpent_general_reveal`, `serpent_pursuit_pre_combat`,
  and final boss combat entry.

## 12. Final refuge current authority audit

- `lion-final-refuge` RunNode: `type: 'story'`, `contentId: 'final_refuge'` (`runSystem.ts:328`).
  `resolveRunNode` only enters the interactive-refuge path when `node.type === 'refuge'`
  (`GameApp.ts:1132`) — final refuge today is pure dialogue → `markResolved` → campaign
  presentation → Journey → `lion-final-judgement`.
- `resolveRefugePresentation` additionally has no `lion-final-refuge` entry in
  `INTERACTIVE_REFUGES` (`RefugePresentation.ts:14-28`) — doubly excluded.
- Campaign structure (`LionCampaignStructure.ts:332-346`): role REFUGE, anchor, DIALOGUE
  authority, `entryPolicy: LOCATION_ARRIVAL`, `exitPolicy: LOCATION_CONTINUATION`, next =
  `lion-final-judgement`. The `final-refuge → judgement` edge is a declared
  `LION_MAJOR_CAMPAIGN_TRANSITIONS` direct transition — not a traversal leg.
- The `final_refuge` dialogue (content.ts:1318) is already a calm 6-step preparation beat
  (Maelor's accounts, Séraphine's portent, Marian's waiting families, Alistair's threshold) —
  the authored "pre-dialogue" already exists; only the hub is missing.
- `CIN6A_JOURNEY_TRIGGERS.beforeDialogue.final_refuge → 'final_refuge_dossier'` cinematic exists;
  `CIN6A_REFUGE_DEPARTURES` has no final-refuge entry.
- `CLAN_ANCHOR_DIALOGUES` maps only `lion-first-refuge → first_refuge_gathering`
  (`campaignGrammarContent.ts:38-40`).

Current assertions/guards that the preparation branch must update together:

| Current rule | Evidence | Later migration |
|---|---|---|
| Canonical map and generated RunNode are story | `src/game/content.ts:34`; `src/game/runSystem.ts:328-332` | Change canonical node type to `refuge`; retain id, link, content id |
| Hub entry requires `node.type === 'refuge'` | `src/game/GameApp.ts:1132`; `src/ui/RefugePresentation.ts:14-43` | Register FINAL_REFUGE presentation and reuse existing hub actions |
| Campaign structure says REFUGE role but DIALOGUE authority / continuation exit | `src/campaign/LionCampaignStructure.ts:332-346`; structure tests | Update entry/exit contract to pre-dialogue → hub → departure, retain direct judgement edge |
| Cinematic census explicitly says story-only and no shop/rest agency | `tools/cinematics/specs/campaign_cinematic_census.json:52,190`; `tools/cinematics/campaign_cinematic_census.test.mjs:191-193` | Revise census and assertion after hub rollout; keep dossier before dialogue |
| Tests pin story-only behavior | `src/game/cin2CampaignBridge.test.ts:202-213`; `src/game/refugeHubContinuity.test.ts:102-111`; `src/ui/RefugePresentation.test.ts:36-39` | Replace with node/dialogue/hub/departure tests in preparation branch |
| Route and finale integration assume present node order | `src/game/r6FullRouteIntegration.test.ts:250,570,628`; `src/game/r5NarrativeExpansion.test.ts:89,221`; `src/game/lionFinale.test.ts` | Keep ids and judgement/boss behavior; test hub on both fresh and resumed saves |

Recommendation: **change the canonical RunNode type to `refuge` (A)**. Campaign structure
already calls this anchor a REFUGE; retaining a story node with a special management attachment
would create a second way into shop/rest authority. The entry dialogue must be a one-time
preparation beat before the existing hub, never a replacement for it.

## 13. Final refuge future preparation-hub plan

Target flow (later branch, not this audit): T4 arrival → `final_refuge` pre-dialogue →
management hub (Clan, Shop, Amélioration, Repos, Reprendre la route) → explicit departure →
`lion-final-judgement` → `lion_finale_judgement` → finale combat resolution.

- Convert `lion-final-refuge` RunNode `type: 'story' → 'refuge'` (or add an equivalent dedicated
  path) and register it in `INTERACTIVE_REFUGES` (FINAL_REFUGE family,
  `final-refuge-tableau.png` / HOLD_SOURCE `node:lion-final-refuge` context already mapped).
- Order: secure loot → `final_refuge` dialogue once (`refugeSecured`/`clanArrival`-style flags as
  with other refuges) → hub loop → `markResolved` → post-node narrative → Journey on the existing
  `final-refuge→judgement` major transition. Keep `rep_event_village_memorial_request` and any
  other injected beats ordered **after** hub exit.
- Guard: `resolveRefugePresentation` today throws `Missing interactive refuge presentation` if a
  `refuge`-typed node lacks an entry — both changes must land in the same branch.
- Do **not** touch `buildLionFinaleJudgement`, `resolveLionFinaleExecution`,
  `resolvePendingLionFinaleCombat`, or boss ids — the judgement authority is unchanged.
- Save semantics: refuge hub sessions are durable at node level (existing refuge precedent);
  nothing about Traversal session persistence changes.

## 14. Cinematic-remaster boundaries

No new video dependencies are introduced or required for T1/T3/T4 or the final-refuge hub.
Existing wiring already covers the final act:

- `CIN6A_JOURNEY_TRIGGERS` (`Cin6aPresentation.ts:15-27`): `bois_clair_arrival` before
  `village_choice`, `shadow_signs` before `shadow_signs`, `final_refuge_dossier` before
  `final_refuge`, `ruins_approach_context` before `ruins_guardians`, `forest_journey_tension`
  before forest combats.
- `CIN6C_P1_JOURNEY_TRIGGERS` (`:44-64`): per-content reveals — `garen_encounter`,
  `shrine_reveal_context`, `young_dragon_encounter`, `serpent_informant_encounter`,
  `serpent_road_tension`, etc., each suppressed once its resolution flag is set
  (`CIN6C_DIALOGUE_RESOLUTION_FLAGS`).
- `VIDEO_CINEMATIC_TRIGGERS` (`CinematicTriggers.ts:10-20`): `lion_judgement` before
  `lion_finale_judgement`; `serpent_general_reveal` / `lion_champion_reveal` before finale
  combats; `resolveCin6aBoisClairAftermath` maps `bois_clair_saved` / `bois_clair_sacrificed`.
- Premium remaster later pass is limited to: intro, Alaric audience, Bois-Clair arrival, final
  judgement, final boss — per plan `KEY-CINEMATIC-REMASTER-1`.

## 15. Implementation order

1. Extract generic seams (route/world/vehicle/presentation injection, leg-id flow, RunSystem
   literal removal, GameApp leg scan) — no production change; T0 pinned by existing tests.
2. T1 authoring + enablement (world art gated by `rolloutLegIds` review).
3. T2 retirement → NarrativeStage/direct handoff for `village-choice → second-refuge`.
4. T3 authoring + enablement (largest leg: two mandatory interrupts + strict fork).
5. T4 authoring + enablement (short atmospheric leg, no stages).
6. Final refuge hub conversion (pre-dialogue → hub → departure).
7. Final-act tableau/continuity polish if the gallery shows drift.
8. Optional premium cinematic remaster (5 moments only).

## 16. Risk / guard / test impact

- **Fork/branch authority:** `selectTraversalBranch`/`bypassTraversalNode` keep validating against
  the relation + `getAvailableRunNodes`; genericising removes only the T0 literal. Saves holding
  `traversalBranches`/`bypassedRouteNodeIds` keep schema (`traversalRouteAuthority.test.ts` legacy
  cases must keep passing).
- **RouteCommitGuard:** Journey commits stay authorized only in TRAVEL/JOURNEY/NARRATIVE with an
  available node — Traversal forks must keep using `selectTraversalBranch` + scene-internal
  overlay, not the route-commit path.
- **Adaptive variants:** `resolveAdaptiveNode` mutates presentation (label/contentId) at
  availability time; Traversal stage presentation must consume the *available* node objects (as
  `TraversalT0Route` already does) so mandate/tier variants render correctly on T1/T3 forks.
- **Opt-out consequences:** `TraversalOptionalConsequencePolicy` is T0-authored only; T1/T3 have
  no optional interrupts in current relations (both forks are strictly mandatory) — correct today,
  re-audit if stages gain OPTIONAL_INTERRUPT.
- **Checkpoint/reset:** `failRunToCheckpoint` clears downstream `bypassedRouteNodeIds` /
  `traversalBranches` generically — no change needed.
- **Tests that will need updating only in their own branches:**
  `LionCampaignTravelRelations.test.ts` (exact T0–T4 list, 13 interrupts, 3 forks),
  `traversalRouteAuthority.test.ts` (T1 bypass currently expected false),
  `TraversalFeaturePolicy.test.ts` (rollout list), plus T0-named suites kept as T0 pins.
- **Docs referencing T0-only scope:** `docs/reports/traversal-t0-production-rollout-1.md`,
  `docs/TRAVERSAL_T0_FINAL_CONVERGENCE.md`, `docs/reports/campaign-presentation-migration-1.md`.
- **Gallery method note:** the held-cinematic-over-Journey fork required the QA driver to commit
  through the mounted choice (DOM click) — a genuine presentation finding, not a product bug.

## 17. Recommended branch sequence

| # | Branch | Scope |
|---|---|---|
| A | `TRAVERSAL-GENERIC-RUNTIME-1` | Extract scene/route/world/vehicle/presentation seams; remove `T0` literals in runSystem + GameApp scan; T0 behaviour pinned, gate unchanged |
| B | `TRAVERSAL-T1-PRODUCTION-1` | T1 world art + route adapter + rollout `['T0','T1']`; Bois-Clair arrival unchanged |
| C | `BOIS-CLAIR-SECOND-REFUGE-HANDOFF-1` | Retire playable T2 → NarrativeStage/direct handoff; keep `T2` id + numbering |
| D | `TRAVERSAL-T3-PRODUCTION-1` | T3 world art + adapter; Witnesses/Shadow-Signs boundaries preserved |
| E | `TRAVERSAL-T4-PRODUCTION-1` | Short atmospheric leg; arrives at final refuge without opening a hub |
| F | `FINAL-REFUGE-PREPARATION-1` | `final_refuge` pre-dialogue → management hub → departure → judgement |
| G | `FINAL-ACT-TABLEAU-CONTINUITY-1` | Continuity polish only if gallery review shows drift |
| H | `KEY-CINEMATIC-REMASTER-1` | Premium video pass: intro, audience, Bois-Clair arrival, judgement, final boss |

Stop point: this audit branch ends here for operator review. No merge, no production enablement.
