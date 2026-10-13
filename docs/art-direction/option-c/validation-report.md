# Option C phases 1–3 — P0 dynamic presentation coverage validation

Validation date: 2026-09-13

Baseline: `main == origin/main == 678a37ac6f1b9320a94e4c4571ab2e069d6e237b`

Verdict: **P0 repaired and validated; phase 4 is technically unblocked but remains pending explicit operator review/authorization**

## Change boundary

The completed Option C phases 1–3 remain unchanged except for this validation report. The six visual references remain non-production inputs with `productionUseAllowed: false`.

- Gameplay truth, narrative text, speakers, routes, choices, choice effects, recruitment, conduct, witnesses, Shadow state, reputation, and ending truth: unchanged.
- Save schema: unchanged.
- Combat logic and VFX: unchanged.
- Canonical sprites and production media: unchanged.
- GPT Image attempts: 0.
- MiniMax attempts: 0.
- Commit/push: none.

## Root cause and repair

`resolveGameDialogue()` resolves a state-built Lion finale before the static `dialogues` entry. That runtime sequence begins at semantic step `open` and conditionally adds `record`, `lie-rebuked`, `merits`, `breaches`, `stains`, and `shadow`. The CIN-6E-A.4R generator previously iterated only the static registry, whose `lion_finale_judgement` placeholder contains step `1`. The runtime resolver therefore produced a valid sequence shape that had no exact generated presentation plan, while the static validator compared only the same incomplete static source and incorrectly passed.

The repair adds one deterministic presentation-shape contract shared by generation and runtime resolution:

1. state-built dialogue builders, aliases, and their complete step envelopes are explicitly registered;
2. 320 deterministic presentation-state scenarios resolve all 71 campaign dialogues and deduplicate them into 123 exact runtime shapes;
3. the generator emits an exact plan for every non-canonical shape and retains the canonical plan only when its signature matches exactly;
4. runtime selection uses dialogue ID plus exact ordered step/speaker/choice-count signature;
5. an unknown shape throws instead of selecting a wildcard, generic plan, or silent fallback;
6. the static staging validator now embeds and validates the campaign-wide runtime census.

## Runtime step census

Authoritative contract:

`RUNTIME_REACHABLE_PRESENTATION_STEPS == PLANNED_PRESENTATION_STEPS + EXPLICIT_LEGITIMATE_RUNTIME_ONLY_STEPS`

| Classification | Count |
|---|---:|
| Runtime-reachable presentation steps | 270 |
| Planned runtime presentation steps | 270 |
| Explicit legitimate runtime-only steps | 0 |
| Missing from plan | 0 |
| Unknown | 0 |
| Canonical dialogue steps | 247 |
| Dead/unreachable authored placeholders | 2 |

The two dead/unreachable entries are documented rather than ignored:

- `lion_finale_judgement:1`: static placeholder superseded by the state-built judgement sequence.
- `pre_lion_chief:4`: legacy static tail superseded by the state-built three-step Lion Trial sequence.

The general repair also covers dynamic steps in the Serpent pursuit/aftermath, voluntary and non-voluntary Lion Trial, final-refuge recruitment insertions, epilogue, and every contextual optional step discovered across the campaign.

## Static validator regression lock

The validator now checks exact variant-plan presence, exact ordered step ownership, duplicate step ownership, speaker visibility/cast ownership, and A.4R video/HOLD doctrine. A mutation regression removes `lion_finale_judgement:open` from its generated variant and proves validation fails. A second regression proves an unregistered runtime shape throws instead of being masked by the canonical plan.

Current validator result:

- 71/71 dialogues.
- 247/247 canonical dialogue steps.
- 28/28 choice steps.
- 270/270 runtime-reachable presentation steps.
- Missing runtime steps: 0.
- Missing variant plans: 0.
- Invalid variant plans: 0.
- Unknown runtime steps: 0.

## A.4R integrity

- `DIALOGUE_STEPS_ON_VIDEO = 0`
- `DIALOGUE_STEPS_ON_HOLD = 0`
- `CHOICE_STEPS_ON_HOLD = 0`
- Hidden/static speaker violations: 0.
- Transition flashes declared by the generated audit: 0.
- Route changes: 0.
- Choice-effect changes: 0.
- Narrative-fact loss: 0.

## Browser QA

The browser harness now resolves dialogues through the real state-aware `resolveGameDialogue()` path instead of reading static placeholders. It runs exact finale variants through `applyFinalDialoguePresentationPlan()` and the real NarrativeStage surface.

Both supported viewports passed:

| Viewport | Representative scenes | Finale variants | Targeted staging cases | Transition probes | Console/page errors |
|---|---:|---:|---:|---:|---:|
| 1920×1080 | 18/18 | 7/7 | 5/5 | 4/4 | 0 |
| 1366×768 | 18/18 | 7/7 | 5/5 | 4/4 | 0 |

Finale coverage includes:

- Lion finale dynamic `open`;
- Serpent pursuit and aftermath;
- voluntary Lion Trial;
- non-voluntary/rejected-claim Lion Trial;
- final refuge with both recruitment insertions reachable;
- epilogue terminal step.

`lion_finale_judgement/open` passes at both viewports as `STATIC_TABLEAU`, with `alaric` present and active before the line. No missing plan, missing surface, missing cast image, viewport overflow, stale HOLD, console error, page error, or runtime fallback was observed. Direct interactive QA through `Flux Lion réel` reproduced the repaired `OUVERTURE` card successfully at both viewports.

## Automated validation

| Validation | Result | Evidence |
|---|---|---|
| Deterministic dialogue-plan generator | PASS | 71 dialogues, 247 original/final canonical steps, 28 choices, 78 static segments; all preservation and A.4R invariants zero. |
| Runtime presentation census validator | PASS | 320 state scenarios, 123 exact runtime shapes, 270/270 runtime steps, missing 0, unknown 0. |
| Focused P0/generator/presentation/preproduction tests | PASS | 7 files, 60 tests passed. |
| Focused A.4R regression set | PASS | 10 files, 75 tests passed. |
| Typecheck | PASS | `tsc --noEmit`. |
| Production build | PASS | 131 modules transformed; existing large-chunk warnings only. |
| Published VFX validator | PASS | Schema 1 valid, zero published actions. No VFX file changed. |
| Full Vitest suite | BASELINE EXCEPTION ONLY | 125/126 files passed; 2,351/2,362 tests passed. All 11 failures remain exclusively in `src/combat/vfx/CasterMotionBackCompat.test.ts`; new regressions: 0. |
| Diff hygiene | PASS | `git diff --check` reports line-ending notices only, no whitespace error. |

The first in-sandbox Vite/Vitest invocation was blocked by the known esbuild access-denied restriction while resolving `vite.config.ts`; the authorized rerun outside that restriction produced the results above.

## Protected-system declaration

- `GAME_TRUTH_CHANGED = NO`
- `NARRATIVE_CHANGED = NO`
- `ROUTES_CHANGED = NO`
- `CHOICE_EFFECTS_CHANGED = NO`
- `SAVE_SCHEMA_CHANGED = NO`
- `COMBAT_CHANGED = NO`
- `VFX_CHANGED = NO`
- `CANONICAL_SPRITES_CHANGED = NO`
- `PRODUCTION_MEDIA_CHANGED = NO`
- `GPT_IMAGE_ATTEMPTS = 0`
- `MINIMAX_ATTEMPTS = 0`

## Gates

- `DYNAMIC_PRESENTATION_COVERAGE_LOCK = YES`
- `LION_FINALE_OPEN_GATE = PASS`
- `NEW_REGRESSIONS = 0`
- `OPTION_C_PHASE4_UNBLOCKED = YES`
- `READY_FOR_OPTION_C_FOREST_ROAD_PILOT = YES_PENDING_OPERATOR_REVIEW`
- `COMMIT = NO`
- `PUSH = NO`

No Forest Road pilot, visual generation, production integration, commit, or push was started.
