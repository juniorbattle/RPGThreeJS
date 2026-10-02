# RPGThreeJS — Game Design Locks & Audit Trace

Date: 2026-09-30
Audited repository baseline: `main @ 00b96f1b502539618790b1c0d8d642f86d3dcf7f`
Status: design-authority trace for continuing audit; not an implementation task specification.

## 1. Core game identity — LOCK

**Cité du tournoi / RPGThreeJS is a narrative tactical RPG campaign in modern pixel-art / HD-2D language.**

The player rebuilds the identity, legitimacy and practical strength of a diminished clan while travelling through an authored campaign. Decisions are made under resource and tactical constraints; those decisions persist as facts and return later through dialogue, events, witnesses, reputation, combat consequences and the Lion judgement.

The core loop is not an XP grind. It is:

`prepare → travel → decide → fight / avoid / help → carry consequences → secure progress at refuge → prepare again → face accumulated consequences`

The game should prefer deeper use of existing systems over adding new systems without a clear role.

## 2. Narrative consequence philosophy — LOCK

The game judges **facts and conduct**, not only a morality/reputation number.

Important narrative truth may include merits, breaches, stains, witnesses, public reputation, Shadow knowledge/disclosure and explicit route facts. Public reputation can influence credibility, prices, event weighting and social framing, but it must not erase serious established acts.

A future implementation must preserve the distinction between:

- what actually happened;
- what people believe or say about it;
- the player's public reputation;
- the final interpretation/judgement of those facts.

## 3. Narrative presentation — LOCK

The normal narrative language is the **Static Tableau / NarrativeStage**, not video.

Characters are staged like actors in a small theatrical composition using canonical sprites and authored pose/placement/facing/focus. The runtime may restage the same conversation into multiple phases rather than shrinking many characters into one frame.

Key rules:

- maximum four readable visible actors in a composition;
- discrete staging positions, facing, look targets, dramatic side and entry/exit behavior;
- speaker focus and listener hierarchy;
- choices may be spatially represented, but presentation geometry never owns choice semantics;
- presentation may visualize game truth but never create or mutate game truth;
- fallback media must never replay already-resolved content or block progression.

## 4. Journey / Travel / Traversal — LOCKED DIRECTION

### Journey
Journey/NarrativeStage is the production continuity layer outside playable Traversal. It presents campaign boundaries, destination agency and transitions while preserving narrative continuity.

### TravelView
TravelView is not the primary production experience. It is a fallback / DEV / recovery surface and must not become the central campaign hub again.

### Traversal
Playable Traversal is used when the physical journey itself deserves to be embodied. Traversal uses the same campaign truth and is not an independent mini-game.

The production Traversal family is now:

- **T0 — LOCK / production reference**
- **T1 — TO PRODUCE** using the established T0 grammar
- **T3 — TO PRODUCE** using the established T0 grammar
- **T2 — REMOVE / no longer needed**
- **T4 — REMOVE / no longer needed**

T2 is unnecessary because after Bois-Clair the following camp/refuge can be reached directly without an additional road leg. T4 is unnecessary because it duplicates an approach beat immediately before the judgement.

Do **not** mechanically renumber T3 into T2 simply for sequence aesthetics. Preserve stable IDs unless a dedicated migration proves renumbering safe and worthwhile.

### Shared Traversal art/system grammar
T1 and T3 must inherit the T0 production language:

- same horizontal / side-on gameplay camera;
- same caravan language;
- same two-lane road logic;
- same forest route family as the common base where narratively appropriate;
- same Risk / Reward / Pursuit grammar;
- same route/checkpoint rhythm and covered transitions;
- visual variation should primarily come from checkpoint-specific authored art, local props, NPCs, encounters, forks and arrival context.

Do not invent filler events merely to increase density.

## 5. Cinematic doctrine — LOCK

Production will contain **exactly eight major cinematic videos** in the current Lion campaign scope. These are the only `KEEP_MAJOR_VIDEO` beats retained as production cinematics:

1. `camp_departure`
2. `alaric_audience_arrival`
3. `bois_clair_arrival`
4. `bois_clair_saved`
5. `bois_clair_sacrificed`
6. `lion_judgement`
7. `serpent_route_ending`
8. `lion_trial_route_ending`

These eight videos are intended to be treated as premium, grand, memorable event cinematics — closer in philosophy to the rare major FMV moments of classic Final Fantasy than to routine scene coverage.

### Everything else
All other cinematic slots are to be removed from the **production cinematic set**.

There should be no routine enemy-reveal videos and no video simply because a scene is narratively important.

Non-major content must resolve through the surface that best matches its function:

- conversation / recruitment / testimony / choice → `STATIC_TABLEAU`;
- ordinary travel / geography → Journey / Traversal / travel still as appropriate;
- enemy entrance / tactical threat → combat handoff and/or Combat Stage;
- scenic punctuation → static/held environment if needed;
- gameplay consequence → authoritative gameplay system first, presentation second.

The old implication `MAIN_EVENT => CINEMATIC_REQUIRED` is superseded.

New doctrine:

**Narrative importance and cinematic value are separate axes.**

A video is justified only when both are true:

1. the beat is narratively major; and
2. motion, transformation, scale or spectacle adds something materially stronger than the normal Tableau/Traversal/Combat language.

Existing non-retained MP4s, registry entries and references should later be cleaned only after live-reference verification. Do not break fallback or campaign routing during cleanup.

## 6. Character visual authority — LOCK

**Character System V2 is the final visual ceiling and canonical character line.**

The work already completed on canonical masters and combat poses is approved as the final production character direction. It is not an interim placeholder awaiting a later general visual remaster.

Rules:

- canonical V2 masters remain the identity authority;
- canonical poses remain the combat/narrative pose authority;
- existing characters must not be regenerated or redesigned merely for stylistic novelty;
- any new character must be produced to the same identity, scale, pixel-art language and V2 presentation standard;
- documents suggesting a future replacement/remaster pipeline for the approved V2 cast must be reconciled or explicitly marked historical so they cannot supersede the approved V2 line.

## 7. Environment visual authority — LOCK

The visual-family approach remains authoritative. A location must remain recognizably the same place across Narrative Tableau, Traversal/Travel, Tactical Combat, Combat Stage and Cinematic use.

Modern pixel-art / HD-2D is a construction language, not a post-processing filter. Preserve intentional pixel clusters, readable silhouettes, controlled material language, atmospheric depth and authored lighting. Avoid photorealistic conversion, generic anime illustration reduction, or unrelated visual redesign between surfaces.

## 8. Combat authority — LOCK

The current CombatBridge / canonical tactical combat remains the production combat system despite historical `legacy` naming in some implementation files.

Preserve authoritative combat rules such as deployment, grid movement, AP, initiative, targeting, status, skills, consumables, AI, victory/defeat and persistent post-combat state.

Current Lion combat configurations use a four-unit campaign deployment limit unless a later explicit design decision changes it.

Combat Stage remains **presentation-only**. It must never own or duplicate damage, AP, status, targeting, rewards or tactical truth.

VFX also remain presentation-only. VFX may represent impact, motion, timing, hit stop, screen shake and spectacle but never become a second gameplay resolver.

## 9. RPG progression — LOCK

The current game does not use a standard persistent XP/level progression loop.

Progression is primarily expressed through:

- recruitment;
- equipment;
- weapon tiers;
- accessories;
- crafting;
- skill unlock/access through gear;
- bounded skill upgrades;
- resources and preparation;
- narrative/campaign consequences.

Current campaign equipment authority is one equipped weapon plus two accessory slots per unit. Historical documentation suggesting one or two campaign weapons must not override current V6 truth.

Skill upgrades remain bounded to the existing upgrade model. Ultimates currently have no production unlock path and remain outside the locked demo progression until an explicit later design decision.

## 10. Route economy / refuge loop — LOCK

Temporary route loot and secured resources must remain distinct.

The road creates exposure and accumulation; the refuge secures progress and enables consolidation/management. Route rewards should not bypass this structure by directly becoming fully secured permanent resources unless explicitly designed otherwise.

Refuges are both narrative breathing spaces and mechanical checkpoints. They support the rhythm:

`danger → accumulation → arrival → security → management → departure`

## 11. Save and authority boundaries — LOCK

Save game stores authoritative world/game state, not transient presentation state.

Do not persist presentation-only details such as current animation frame, temporary visual focus, panel geometry, CSS transition state or sprite staging position.

Stable narrative IDs, flags, content IDs, combat IDs and node IDs should not be renamed casually. Compatibility/migration cost must be considered before any identity-level refactor.

## 12. Audio — DEFERRED UNTIL NARRATIVE LOCK

Audio is intentionally deferred.

No final audio identity should be invented or implemented yet. Music, ambience, UI sound, combat sound design and cinematic audio should be designed only after the narrative structure, scene classification and presentation contracts are fully locked.

Reason: the audio pass should reinforce the final dramatic rhythm rather than be repeatedly rebuilt while scene purpose and media classification are still moving.

When the narrative/presentation structure reaches full LOCK, audio becomes a dedicated polish/identity workstream.

## 13. Current cleanup / reconciliation targets

These are not authorization to edit immediately; they are the known documentation/runtime reconciliation targets for later implementation passes.

- remove T2 and T4 from future Traversal planning and active relation contracts where appropriate;
- retain T0, T1 and T3 as the three meaningful playable Traversal legs;
- reconcile old roadmaps that still describe T1–T4 as undecided;
- reconcile doctrine that equates `MAIN_EVENT` with mandatory video;
- reduce the production cinematic set to the eight retained videos;
- remove/reclassify enemy reveal videos and other non-major video beats;
- reconcile generated presentation registries/tests that still encode the older high-video count;
- reconcile Character Style Lock material where it implies the approved Character System V2 cast is only temporary;
- correct old README statements that conflict with current campaign structure or V6 equipment truth;
- keep audio explicitly deferred rather than letting ad-hoc sound work become accidental canon.

## 14. Consolidated production identity

**Cité du tournoi is a narrative tactical RPG in modern pixel art where a vulnerable company rebuilds its legitimacy through an authored campaign. Choices are remembered as concrete facts, travel carries risk and resources, refuges consolidate progress, tactical combat resolves real danger, and later scenes confront the player with what they actually did. Narrative scenes normally play as dynamic sprite tableaux staged like theatre; Traversal physically embodies the few road legs where travel itself matters; combat owns tactical threat; and only eight exceptional story moments receive full premium cinematic treatment. Character System V2, the established environment families, tactical combat authority and the separation between game truth and presentation are final visual/system foundations. Audio is deliberately postponed until the narrative and presentation structure is fully locked.**

## 15. Status after this audit decision pass

### LOCK
- core game identity;
- consequence philosophy;
- Static Tableau / NarrativeStage as normal narrative language;
- Character System V2 visual ceiling;
- environment-family continuity;
- tactical combat authority;
- Combat Stage/VFX presentation-only authority;
- equipment-driven progression rather than XP levels;
- temporary-loot/refuge consolidation loop;
- save authority boundaries;
- eight-video cinematic doctrine.

### APPROVED DIRECTION / TO IMPLEMENT
- produce T1 Traversal using the T0 grammar;
- produce T3 Traversal using the T0 grammar;
- remove T2 and T4 as unnecessary legs;
- clean non-retained cinematic video production paths and references;
- reconcile historical documentation with these final decisions.

### DEFERRED
- audio/music/sound identity until narrative/presentation structure is fully LOCK.

### Still to audit, not necessarily redesign
- exact T1 authored checkpoint sequence and production art requirements;
- exact T3 authored checkpoint sequence and production art requirements;
- documentation/runtime remnants that contradict the new cinematic doctrine;
- full end-to-end campaign continuity after future cleanup passes;
- later audio brief once narrative structure is frozen.
