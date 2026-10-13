# Demo 1h — R5 One-Hour Narrative Expansion

## Baseline and scope

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Exact baseline HEAD: `e6ba189d321d0387a3e0b6033a6b332f55b97fd0`
- Baseline verified before editing: exact required commit, with no pre-existing worktree changes.
- R1 Narrative Truth, R2 Alaric verdict/finale routing, R3 contextual dialogue/ATE resolution, and R4 deterministic event scheduling remain authoritative.
- This is a content-production pass. It adds no run node, combat, gameplay rule, morality meter, save schema, cinematic system, asset, or presentation architecture.

## Runtime audit before expansion

### Campaign structure

The generated Lion run contained 21 nodes across depths 0–17. Its spine was already sound: fallen-clan opening, Alaric briefing, opening combat, crossroads/recruitment, refugees, first refuge, reserve trail, Valmir-road combat, optional trial, Bois-Clair, second refuge, Serpent consequence, witnesses, optional trial, Shadow signs, final refuge, cumulative judgement, and one of two boss routes.

There were four unavoidable combats on a legitimate direct route: the opening creature encounter, the Valmir/Bois-Clair road encounter, Bois-Clair, and the finale. One normally selected optional trial produces the expected typical count of five. A content-rich player can deliberately take further branch fights, but the standard spine does not require them.

Three refuge/management pauses, eight contextual ATE rules, three R4 opportunity windows, four R4 event definitions, and a legitimate weighted no-event result were present. The R4 per-run budget was two events with three-step anti-spam spacing.

### Before inventory

| Inventory | R5 baseline |
| --- | ---: |
| Run nodes / maximum depth | 21 / 17 |
| Registered combats | 17 |
| Static dialogue sequences | 46 |
| Static dialogue steps | 136 |
| Static spoken words | 2,584 |
| Choice-label words | 243 |
| Authored choices | 46 |
| Contextual ATE rules | 8 |
| R4 event definitions | 4 |
| R4 opportunity windows / budget | 3 / 2 |

A representative pure-honour resolved route exposed 28 dialogue sequences, 84 visible steps, 1,809 spoken words, and 13 choice screens.

### Current playtime budget before expansion

These are modeled minutes from the actual route and content, not assumed targets. The representative values below sit within the observed uncertainty bands of 36–41 minutes fast, 48–55 minutes typical, and 64–74 minutes content-rich.

| Category | Fast | Typical | Content-rich |
| --- | ---: | ---: | ---: |
| Dialogue and opening presentation | 7.8 | 11.3 | 14.0 |
| Choice reading/decisions | 1.8 | 2.6 | 3.6 |
| Travel/map transitions | 1.5 | 1.8 | 2.3 |
| Refuges/management | 2.3 | 3.2 | 4.4 |
| Pre-finale combat | 21.5 | 27.5 | 38.0 |
| Optional ATE | 0.8 | 1.8 | 3.3 |
| R4 social events | 0.0 | 1.0 | 2.5 |
| Finale dialogue and route close | 2.8 | 3.8 | 4.8 |
| **Representative total** | **38.5** | **53.0** | **72.9** |

The weakness was concentrated rather than global. The opening and road fights had insufficient framing, several refugee/reserve/witness beats were terse, Cedric disappeared from important continuity points, Bois-Clair needed a quieter consequence beat, and optional fights often returned directly to the map. The content-rich route was already long enough; it did not need more topology or combat.

## Architecture and preservation

R5 uses the existing ownership chain:

`historical GameState facts -> R1/R2 semantic resolvers -> R3 contextual resolution -> DialogueView presentation`

The generic R3 resolver and `DialogueView` are unchanged. Conditional additions are data definitions and optional step patches in the existing contextual-content registry. R4 additions are definitions consumed by the existing director. `GameApp` has no R5-specific branching.

The run graph remains 21 nodes at depth 17. Consequently, no stale-route refresh, migration, or deterministic topology change was necessary. Save V6 remains unchanged; the ten new social facts use the existing boolean flag record.

The following authorities are untouched:

- `lionNarrative.ts` and R1 fact interpretation;
- `lionVerdict.ts` and the R2 severity hierarchy;
- `lionFinale.ts` and route eligibility/execution;
- `contextualDialogue.ts` and R3 resolution behavior;
- `reputationEventDirector.ts` and R4 scheduling behavior;
- `DialogueView.ts`, Combat Stage, combat rules, VFX, skills, equipment, crafting, and assets.

Bois-Clair therefore remains the dominant merit/breach axis. Public reputation can select or shade social encounters, but cannot forgive a sacrificed village, silenced witnesses, or a betrayed informant.

## Narrative changes by phase

### Fallen clan and Alaric

`acte_ouverture`, `camp_departure`, `lion_briefing`, and the opening-fight frame now establish lost status, the practical value of the Seal, the difference between accepting a mission and earning recognition, and Alaric's standard before the final judgement. The expansion uses short exchanges among the existing cast rather than a lore dump.

### Early route, refugees, and reserve trail

The opening and Valmir-road combats receive motive, stakes, and concise aftermaths. `mystery_recruit`, `refugee_trial`, and `reserve_trail` give civilians concrete needs and make Cedric respond only when recruited. The first-refuge watch is a short, once-only contextual reaction to whether the refugees were helped or exploited.

### Bois-Clair

`village_choice` now strengthens urgency and decision clarity without adding another decisive event. Existing defense/raid facts and rewards are unchanged. The second-refuge night watch recognizes rescue, sacrifice, or contradictory legacy state through the R2 semantic verdict reason, and Cedric can react contextually. Later witness and memorial material continues to treat the village outcome as historical fact, not reputation arithmetic.

### Serpent escalation and optional trials

The opposition now progresses from manipulated wildlife and observation to road control, reprisals, checkpoint pressure, hunters, and the recognized-route pursuit. Every registered production combat has pre- and post-combat dialogue. Shared framing is reused for equivalent adaptive combat variants; no combat configuration other than dialogue hook references was changed.

### Witnesses, Shadow, final refuge, and judgement

`witnesses_on_road` explains why living testimony matters socially and to Alaric. Saved, sacrificed, supportive, silenced, and contradictory legacy facts resolve through authoritative semantics. Shadow reactions distinguish fragments from definitive evidence, and Cedric/Garen appear only when their stable state permits it. `final_refuge` gathers the company without inventing facts. The R2 judgement, recognition route, voluntary trial, imposed trial, single Shadow disclosure, route-aware aftermaths, and route-aware epilogues remain intact.

## New dialogue content

R5 adds 25 reusable sequences:

- 18 combat frames/payoffs: `pre_opening_trail`, `post_opening_trail`, `pre_valmir_road`, `post_valmir_road`, `pre_serpent_patrol`, `post_serpent_patrol`, `pre_spider_nest`, `post_spider_nest`, `pre_serpent_reprisals`, `post_serpent_reprisals`, `pre_serpent_checkpoint`, `post_serpent_checkpoint`, `pre_ruins_guardians`, `post_ruins_guardians`, `post_serpent_hunters`, `post_serpent_duelist_trial`, `post_troll_crossing`, and `post_young_dragon_roost`;
- two contextual ATE bases: `ate_first_refuge_watch` and `ate_bois_clair_night_watch`;
- five R4 social-event dialogues: refuge supplies, Serpent rumours, political sponsorship, Bois-Clair memorial, and displaced-family demand.

Existing sequences were enriched in place where the campaign beat already belonged. Whole dialogue sequences were not duplicated for Cedric, witness, Bois-Clair, or Shadow variations.

## ATE expansion

Two short once-only ATEs were added at explicit post-node hooks:

| ATE | Trigger | Purpose | Context |
| --- | --- | --- | --- |
| `ate_first_refuge_watch` | `lion-first-refuge` | refugee consequence and companion continuity | helped/exploited, optional Cedric |
| `ate_bois_clair_night_watch` | `lion-second-refuge` | immediate Bois-Clair aftermath | saved/sacrificed/contradictory R2 reason |

They use the existing R3 eligibility/once-only model and saved seen flags. They do not add a random ATE pool or new scheduler.

## R4 event-pool expansion

The event pool grows from four to nine definitions while frequency stays fixed:

- hostile breadth: existing roadside intimidation and Bois-Clair denunciation plus displaced-family demand;
- neutral breadth: existing information broker plus Serpent-rumour exchange;
- helpful/high-profile breadth: existing public petition plus refuge-supply allocation, political sponsor, and Bois-Clair memorial.

All three existing windows remain at first refuge, Bois-Clair, and final refuge. Their no-event weights remain 12, 12, and 14; global budget remains two; minimum spacing remains three steps; definitions remain unique. No event starts combat, so reputation-dependent additional combat count is zero.

The larger weighted candidate set intentionally changes some seed-to-event selections. The seed hashing, ordering rules, eligibility evaluation, no-event result, uniqueness, family cooldown, and save/load behavior are unchanged. Determinism means the same expanded saved state resolves identically; it does not require preserving selections from the smaller R4 pool.

## Choice classification and historical facts

Each of the five new choice points is explicitly class B (social):

| Dialogue | Classification | Persistent scope |
| --- | --- | --- |
| Refuge supply offer | B | gold/item, reputation, allocation flag |
| Serpent rumour market | B | gold/reputation, information/story flag |
| Fallen-banner claimant | B | reputation, sponsorship/refusal flag |
| Bois-Clair memorial request | B | gold/reputation, memorial flag |
| Displaced-family demand | B | gold/reputation, acknowledgement/reparation flag |

The ten new flags are `r5BoughtRefugeSupplies`, `r5LeftRefugeSupplies`, `r5BoughtSerpentRumour`, `r5SharedClanFall`, `r5AcceptedPoliticalSponsor`, `r5RefusedPoliticalSponsor`, `r5CarriedBoisClairNames`, `r5FundedBoisClairMemorial`, `r5AcknowledgedDisplacedFamilies`, and `r5PaidDisplacedFamilies`.

None is a Lion Conduct input, route fact, morality score, or combat trigger. No new class C fact was justified, so no R1/R2 integration was required. Dramatic event wording explicitly states when present action cannot rewrite prior history.

## Combat-count audit

| Route style | Expected combats | R5 reputation combat |
| --- | ---: | ---: |
| Fast legitimate | 4 | 0 |
| Typical | 4–5 | 0 |
| Content-rich branch selection | up to 7 | 0 |

All 17 registered encounters now have valid pre/post dialogue references. No enemy, objective, reward, encounter rank, AP rule, targeting rule, damage model, AI, skill, equipment, stage, or VFX behavior was changed. No new combat was needed because the existing route already met the target.

## After inventory and playtime

| Inventory | Before | After | Change |
| --- | ---: | ---: | ---: |
| Run nodes / maximum depth | 21 / 17 | 21 / 17 | none |
| Registered combats | 17 | 17 | none |
| Static dialogue sequences | 46 | 71 | +25 |
| Static dialogue steps | 136 | 247 | +111 |
| Static spoken words | 2,584 | 5,627 | +3,043 |
| Choice-label words | 243 | 303 | +60 |
| Authored choices | 46 | 56 | +10 options |
| Contextual ATE rules | 8 | 10 | +2 |
| R4 event definitions | 4 | 9 | +5 |
| R4 windows / budget | 3 / 2 | 3 / 2 | none |

The automated fast-route model resolves actual R3 content for a saved-Bois-Clair/Cedric/definitive-Shadow profile. It exposes 3,640 spoken words, 130 choice-label words, 144 displayed steps, 13 choice screens, and the existing 179-word prologue. At 240 words per minute, with short step/decision pauses, three pre-finale combat allowances (4.5, 4.5, and 6.5 minutes), a 7.5-minute boss, three 45-second refuge pauses, and 18 five-second travel transitions, it totals **46.789 minutes** without an R4 event.

| Category | Fast measured model | Normal estimate | Content-rich estimate |
| --- | ---: | ---: | ---: |
| Core dialogue/opening | 14.0 | 16.0 | 18.5 |
| Choices | 1.8 | 2.7 | 3.5 |
| Travel/map transitions | 1.5 | 1.8 | 2.2 |
| Refuges/management | 2.25 | 3.2 | 4.0 |
| Pre-finale combat | 15.5 | 22.5 | 32.0 |
| Optional ATE | 2.0 | 2.5 | 3.3 |
| R4 events | 0.0 | 1.0 | 3.0 |
| Finale including boss | 9.7 | 10.0 | 10.5 |
| **Total** | **46.8** | **59.7** | **77.0** |

Reasonable cadence and combat-performance uncertainty produces a normal band of **58–66 minutes** and a content-rich band of **72–84 minutes**. The rich route can exceed normal modestly but remains below a deliberately bloated 90-minute design. Browser QA was checkpoint-accelerated rather than an unattended wall-clock hour, so the timing claim is grounded in resolved runtime content and conservative interaction/combat allowances, not a falsely claimed full timed recording.

## Representative routes and semantic regression

Automated semantic coverage includes all requested profiles:

- A pure honour;
- B honour with minor stains;
- C real mixed playtest history;
- D uncertain conduct;
- E infamy;
- F high reputation plus infamy;
- G low reputation plus honour;
- H saved Bois-Clair plus silenced witnesses;
- I/J Cedric recruited and absent across refugees, reserve trail, Shadow signs, and final refuge;
- K/L definitive Shadow evidence revealed and concealed;
- M voluntary Lion Trial.

The A–H cases assert the unchanged R1 conduct tier and R2 final route, demonstrating that high public reputation cannot rescue infamy and low reputation cannot erase honour. Additional tests distinguish saved/sacrificed Bois-Clair, silenced witnesses, once-only ATEs, and route-aware Shadow pre-combat reactions. Existing R1/R2 golden and complete-route regression families continue to pass.

## Save and deterministic behavior

- Save schema remains V6; no version bump or migration.
- Existing facts are neither renamed nor reinterpreted.
- New social booleans are backward-compatible absent-by-default flags.
- R3 dialogue/ATE and R4 event selection resolve identically after JSON V6 round-trip.
- ATE once-only flags survive save/load through the existing flag record.
- Legacy and contradictory facts continue through R1/R2 precedence rather than new raw-flag inference.
- Existing unconditional dialogues remain valid because conditional metadata is still optional.

## Browser QA

QA used the real local `GameApp` and `DialogueView`, not a synthetic renderer. The following production presentation paths were inspected:

- all five prologue panels, expanded opening, Alaric briefing, opening combat frame, and production deployment transition;
- honour refugee scene with recruited Cedric, first-refuge management, and the helped-refugee ATE;
- Bois-Clair buildup/choice, saved aftermath/night watch, and sacrificed/infamy night-watch variant;
- infamy witness scene with sacrificed-village and silenced-witness evidence;
- Shadow fragments/evidence progression, Cedric/Garen conditionals, revealed and concealed variants, and no duplicate disclosure;
- honour and infamy final-refuge variants;
- a contextual high-reputation Bois-Clair memorial event and a legitimate infamy no-event result, without repeat interruption;
- honour cumulative judgement into Serpent pursuit, its distinct aftermath, definitive-Shadow continuity, route-aware epilogue, and completed route state;
- infamy honest deposition, refused recognition, imposed Lion Trial, trial aftermath, route-aware epilogue, and completed route state;
- voluntary honour trial and its unchanged revealed-Shadow acknowledgement.

Exact saved profiles were loaded at narrative checkpoints to make contradictory routes reproducible. The two final boss outcomes were accelerated locally only to exercise the production post-combat/epilogue chain; the temporary development hook and seed page were removed before validation and are absent from the final diff. Dialogue layouts, choice cards, management transition, production combat deployment, and final map state showed no overflow or impossible character appearances. The browser console contained only Vite connection diagnostics and no application warnings or errors.

## Tests and validation

- Full Vitest: **PASS — 58 files, 1,265 tests, 0 failures**. Expected test-only missing-cinematic warnings remain unchanged.
- Standalone TypeScript: **PASS — `npx.cmd tsc --noEmit`**.
- Production build: **PASS — Vite built 94 modules**. The pre-existing large-chunk advisory remains informational.
- `git diff --check`: **PASS**.
- No commit and no push were performed.

Focused R5 tests cover content/combat boundaries, every combat's dialogue hooks, ATE eligibility/once-only behavior, R4 pool breadth with unchanged frequency, class-B choice boundaries, profiles A–M, Cedric presence, Shadow reveal/conceal, voluntary trial, R1/R2 semantic reuse, V6 round-trip determinism, and the 45-minute fast-route budget.

## Remaining gaps for R6

- Cinematic sequencing, mass camera choreography, cut-ins, and audio production remain intentionally not started.
- A future timed human playtest can calibrate reading and combat assumptions across player skill levels; it should tune prose or optional content rather than add architecture reflexively.
- The larger Shadow campaign remains promised, not resolved, and belongs after the locked Lion demo.
- Future content can broaden beyond the Lion chapter while continuing to use R3 context and the R4 director.

## Final gates

| Gate | Result |
| --- | --- |
| ONE_HOUR_CONTENT_EXPANSION | PASS |
| FAST_ROUTE_45_MIN_MINIMUM | PASS — 46.789 min conservative model |
| NORMAL_ROUTE_55_70_MIN | PASS — 58–66 min |
| TYPICAL_COMBAT_4_5 | PASS |
| REPUTATION_EXTRA_COMBAT_MAX_1_2 | PASS — 0 |
| FALLEN_CLAN_STAKES_CLEAR | PASS |
| ALARIC_EXPECTATIONS_CLEAR | PASS |
| BOIS_CLAIR_REMAINS_DECISIVE | PASS |
| SERPENT_ESCALATION_COHERENT | PASS |
| WITNESS_CONSEQUENCES_COHERENT | PASS |
| SHADOW_THREAD_COHERENT | PASS |
| CEDRIC_CONTINUITY | PASS |
| R3_CONTEXTUAL_SYSTEM_USED | PASS |
| R4_EVENT_DIRECTOR_USED | PASS |
| EVENT_SPAM_CONTROLLED | PASS |
| IMPORTANT_NEW_CHOICES_VERDICT_AWARE | PASS — all new important choices classified B |
| PUBLIC_REPUTATION_NOT_MORALITY | PASS |
| NO_NEW_MORALITY_METER | PASS |
| SERPENT_ROUTE_COHERENT | PASS |
| LION_ROUTE_COHERENT | PASS |
| SAVE_COMPATIBILITY | PASS — V6 unchanged |
| DETERMINISM | PASS |
| R1_PRESERVED | PASS |
| R2_PRESERVED | PASS |
| R3_PRESERVED | PASS |
| R4_PRESERVED | PASS |
| COMBAT_ARCHITECTURE | UNCHANGED |
| VFX | UNCHANGED |
| CINEMATIC_SYSTEM | NOT_STARTED |
| FULL_TEST_SUITE | PASS |
| TYPECHECK | PASS |
| BUILD | PASS |
| GIT_DIFF_CHECK | PASS |
| READY_FOR_R6 | YES |
