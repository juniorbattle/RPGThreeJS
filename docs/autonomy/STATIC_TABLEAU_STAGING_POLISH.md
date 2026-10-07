# Static tableau staging polish

CURRENT FACT: IN_PROGRESS; one authored relational source correction is implemented and reviewed. Production/browser acceptance is OPEN. Independent continuation is authorized while the narrative OS-static runner gate is blocked; neither task is declared complete.

Authority: OD-2026-10-03-A and PRESENTATION_AND_MEDIA / DIALOGUE_STAGING, immutable set1.1.0. Scope: existing authored grouping, stable facing, bounded cast transitions, reduced motion/focus and responsive layouts. Canon, dialogue, outcomes and the four-visible-actor cap remain protected.

## Implemented source checkpoint

The active three-speaker `serpent_pursuit_pre_combat` shape placed Alaric and the General on the right, opposite Séraphine, and labelled Alaric's address to Séraphine as opposing-group speech. The plan facade now overlays only `1@alaric@0|2@serpent_general_boss@0|3@sage_seraphine@0`: Alaric LEFT and Séraphine CENTER_LEFT face right; Serpent remains FAR_RIGHT facing left. Alaric still addresses Séraphine in step1, with an authored conversation target. Other step directions remain unchanged, so speaker changes do not flip the actors.

Groups, roles, three-actor cast, scale, depth, entry effects, steps, transitions and all game truth are preserved. Generated plans remain byte-identical; the base two-speaker confrontation and unrelated runtime shapes are unchanged. The resolved-runtime regression in `DialogueStagingDirector.test.ts` checks geography, cast and facing while preserving the sequence/state. Focused spatial, tableau, stage and census checks pass 42 tests; the new regression passes separately. TypeScript passes. The narrative reviewer accepts the exact source diff only.

The complete director suite has one inherited failure at line71 expecting `mediaRemasterLater=true` for the forest mismatch. It fails identically with the original HEAD plan facade, independently substituted and then restored byte-for-byte under the lock. This expectation is outside the changed Serpent shape; no test was weakened and no full-suite PASS is claimed. Raw baseline evidence: `tmp/autonomy/staging-baseline-1933.log`.

## Exact continuation

After normal preflight, review both paired state and `NARRATIVE_CONTEXT_COHERENCE.md`. Inspect the existing `run_cin6d6_route_browser_qa.mjs` `serpent-ending` path: it naturally reaches the exact three-speaker pre-combat dialogue but currently records choices/final boundaries, so add only the bounded observation needed for its cast positions/facing before native advancement, with a guardian review of the precise assertion. Keep combat results explicitly fixture-scoped, or stop the observation before combat; no earned-campaign proof.

Build the physical source (including the six unchanged deferred keyboard blobs), register one unique production normal-motion smoke and inspect the actual three actors at their effective pixel bounds. Check the two allied figures remain visually distinct at narrow width, not merely that their slot names match. Reuse compatible receipts; wider desktop/620/390 normal and OS-only static-tableau/focus/cast-transition proof belongs to the queue milestone. Existing static-only OS assertion is exhausted this run and must not be rewritten to manufacture a PASS. Do not run historical drivers with tracked default output paths or certify DEV-only fixtures as production.

Remaining task scope: the other relational groupings, stable facing and short exit/breath/entry transitions; reduced-motion/focus/responsive acceptance. Source review found the Bois-Clair civilian separately grouped with at most four visible actors, so do not invent a second correction. Narrative council normal-motion proof and both refugee acknowledgements remain independently open. Preserve the ten canonical Pursuit mapping blockers and exact deferred keyboard task/action.
