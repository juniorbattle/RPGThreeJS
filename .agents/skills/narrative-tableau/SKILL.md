---
name: narrative-tableau
description: "Use when working on RPGThreeJS narrative presentation: STATIC_TABLEAU staging, NarrativeStage, dialogue UI and staging, cast and background ownership, choices and fallback agency. Includes the visible-actor cap and the never-mint-canon rule."
---

# Narrative tableau

Contracts: PRESENTATION_AND_MEDIA (tableau), CAMPAIGN_AND_STATE (canon and choices), WORLD_AND_CHARACTERS (Character System V2), all in `docs/contracts/`.

## Ownership

`src/cinematics/` (`NarrativeStage`, `NarrativeTableau`, `StaticTableauComposition`, `DialogueStagingDirector`, the `Narrative*` policy, resolver, plans and transition modules, `DialoguePresentationSegments`, `NarrativeSceneSurface`, `NarrativeUtilityDock`), `src/ui/DialogueView.ts`, `src/ui/DialoguePortrait.ts` and `tools/dialogue/`.

## Invariants

Digest of the contracts as of commit `d7ca28aed5c377ffedb03202f6364b7a947d1096`; the contract text wins on any difference.

- Interactive narrative plays as a staged tableau: actors have an authored position, facing, look target, depth and focus, and are restaged when relational/dramatic readability requires it; a new speaker alone does not require a turn.
- Keep each composition readable: at most four visible actors. Restage rather than cram.
- Say who owns the background and who owns the cast. Never draw sprites for actors already integrated in a video.
- Dialogue text, choice agency and canonical outcomes survive any staging change. Choice layout is presentation and never decides what a choice means.
- Presentation shows truth and never creates or mutates it. A fallback never replays resolved content and never blocks progression.
- Character System V2 masters and promoted poses are the identity authority; no silent remaster.
## Canon gate

Check current explicit operator decisions before asking: OD-2026-10-03-A authorizes the pre-judgement preparation boundary and factual acknowledgement corrections within its limits. Outside explicit authorization, a new dialogue/choice/stage/outcome/reward/lore is a canon change requiring the operator. Presentation briefs may not mint canon. The Alistair emblem or origin, the prologue and the first-refuge scene are open decisions.

## Generated files

`src/cinematics/FinalPresentationRegistry.generated.ts` and `src/cinematics/FinalDialoguePresentation.generated.ts` are generated. Read the `cinematics-journey` skill before touching them.

## Verify

- `npm run cinematics:validate-narrative-staging`.
- Focused: `npx vitest run src/cinematics/NarrativeStage.test.ts src/cinematics/NarrativePresentationRuntime.test.ts src/ui/DialogueView.test.ts` plus any other `Narrative*` test touched, then `npx tsc --noEmit`.
- Browser and geometry: `tools/dialogue/run-dialogue-ui-staging-qa.mjs`, `tools/narrative-stage-utility-consistency-1-qa.mjs` and `tools/cinematics/validate_cin67x_choice_geometry.mjs`. Read each header first; ports and outputs are in the `qa-evidence` skill.
- Check the visible-actor count, one primary surface, choice bounds at 390x844, and zero dialogue steps on a hold.

## Hand off

Video slots, Journey, skip and resume: `cinematics-journey`. Focus, reduced motion, viewports: `ui-accessibility`. Canon or save impact: `contracts-compliance`.

## Return (impact brief)

Contracts read; files and owners affected; invariants at risk (contract section and why); verification required (exact commands); cross-domain handoffs; verdict OK, OK with conditions, or BLOCKED.

## OD-2026-10-03-A review scope

Read PRESENTATION_AND_MEDIA/DIALOGUE_STAGING and the manual-playtest decision. Review authored same/opposing-side, authority/subject and speaker relationships; keep Alaric with the heroes against Serpent, civilians distinct, and no more than four visible actors through framed subsets/restaging. Facing remains stable unless relations/dramatic readability change. Check brief exit/breath/entry, reduced-motion alternative, focus/choices, contextual ATE captions and removal of placeholder ellipses. A pretty composition is insufficient when it expresses a false relation or narrative moment. Preserve the Alaric climax and established facts; no invented lore, witnesses or consequences.
