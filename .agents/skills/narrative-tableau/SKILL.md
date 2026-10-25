---
name: narrative-tableau
description: "Use when working on RPGThreeJS narrative presentation: STATIC_TABLEAU staging, NarrativeStage, dialogue UI and staging, cast and background ownership, choices and fallback agency. Includes the visible-actor cap and the never-mint-canon rule."
---

# Narrative tableau

OD-2026-10-24-A / set 1.10.0 retired every production video and stopped cinematic and illustrated production. The static dialogues and tableaux now carry all eight historical moments, with zero active video, hold, preload or shipped MP4. Improving them is the current presentation work: `docs/autonomy/STATIC_NARRATIVE_FINISHING_PLAN_2026-10-24.md`.

Contracts: PRESENTATION_AND_MEDIA (tableau), CAMPAIGN_AND_STATE (canon and choices), WORLD_AND_CHARACTERS (Character System V2), all in `docs/contracts/`.

## Ownership

`src/cinematics/` (`NarrativeStage`, `NarrativeTableau`, `StaticTableauComposition`, `DialogueStagingDirector`, the `Narrative*` policy, resolver, plans and transition modules, `DialoguePresentationSegments`, `NarrativeSceneSurface`, `NarrativeUtilityDock`), `src/ui/DialogueView.ts`, `src/ui/DialoguePortrait.ts` and `tools/dialogue/`.

## Invariants

Digest of the contracts at set 1.10.0 (baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5`); the contract text wins on any difference.

- Interactive narrative plays as a staged tableau: actors have an authored position, facing, look target, depth and focus, and are restaged when relational/dramatic readability requires it; a new speaker alone does not require a turn.
- Keep each composition readable: at most four visible actors. Restage rather than cram.
- Say who owns the background and who owns the cast. With videos retired, the stage owns both for every historical moment; no video delay or empty interlude replaces a moment.
- Positions carry relational meaning (same side, opposing side, authority, subject, speaker). Facing is authored and stable; turn only for a changed relationship, new subject, important opposition or dramatic focus (DIALOGUE_STAGING).
- Cast changes use a short exit → breathing interval → entry or restage, with bounded duration and kept agency and focus. Reduced motion uses a gentle fade, a short pause or focus continuity without large displacement.
- No visible production `...` transition placeholder; legitimate authored punctuation is not placeholder copy. ATE captions are chosen by simultaneity, place or group change, or temporal continuity, never at random, and add no plot fact.
- Dialogue text (except explicitly authorized factual corrections), choice agency and canonical outcomes survive any staging change. Choice layout is presentation and never decides what a choice means.
- Presentation shows truth and never creates or mutates it. A fallback or missing image never blocks progression; resolved POI revisits replay no one-shot narrative presentation or effect (OD-2026-10-13-D).
- Character System V2 masters and promoted poses are the identity authority; no silent remaster. A background must match the narrative truth of the moment: place, time, weather, destroyed or intact state, factions, branch outcome (WORLD_AND_CHARACTERS).

## Current direction — OD-2026-10-24-B

The [flow and sprite direction](../../../docs/autonomy/PLAYABLE_FLOW_SPRITES_VFX_DIRECTION_2026-10-24.md) proposes a small local frame animation for one actor (Alistair idle at the camp). Its independent framing review found it compatible with STATIC_TABLEAU without amendment, within the limits that document sets: optional animation definition with fallback to the master, one bounded clock, a fixed informative image under OS or game reduced motion, no animation state in V6, no ownership of focus, lines, choices or combat timing, four visible actors at most. A frame animation never replaces composition or relational staging.

## Canon gate

Check current explicit operator decisions before asking: OD-2026-10-03-A authorizes the pre-judgement preparation boundary and factual acknowledgement corrections within its limits. Outside explicit authorization, a new dialogue/choice/stage/outcome/reward/lore is a canon change requiring the operator. Presentation briefs may not mint canon. The Alistair emblem or origin, the prologue and the first-refuge scene are open decisions.

## Generated files

`src/cinematics/FinalPresentationRegistry.generated.ts` and `src/cinematics/FinalDialoguePresentation.generated.ts` are generated. Read the `cinematics-journey` skill before touching them.

## Verify

- `npm run cinematics:validate-narrative-staging`.
- Focused: `npx vitest run src/cinematics/NarrativeStage.test.ts src/cinematics/NarrativePresentationRuntime.test.ts src/cinematics/NarrativeStagingAudit.test.ts src/ui/DialogueView.test.ts` plus any other `Narrative*` test touched, then `npx tsc --noEmit`.
- Browser and geometry: `tools/dialogue/run-dialogue-ui-staging-qa.mjs` and `tools/cinematics/validate_cin67x_choice_geometry.mjs`; for a played campaign path, the drivers listed in the `qa-evidence` skill. Read each header first.
- Check the visible-actor count, one primary surface, choice bounds at 390x844, and comparable before/after captures of the scene you changed.

## Hand off

Journey, retired cinematic identities, skip and resume: `cinematics-journey`. Frame animation of an actor: `combat-vfx-sprites`. Focus, reduced motion, viewports: `ui-accessibility`. Canon or save impact: `contracts-compliance`.

## Return (impact brief)

Contracts read; files and owners affected; invariants at risk (contract section and why); verification required (exact commands); cross-domain handoffs; verdict OK, OK with conditions, or BLOCKED.

## OD-2026-10-03-A review scope

Read PRESENTATION_AND_MEDIA/DIALOGUE_STAGING and the manual-playtest decision. Review authored same/opposing-side, authority/subject and speaker relationships; keep Alaric with the heroes against Serpent, civilians distinct, and no more than four visible actors through framed subsets/restaging. Facing remains stable unless relations/dramatic readability change. Check brief exit/breath/entry, reduced-motion alternative, focus/choices, contextual ATE captions and removal of placeholder ellipses. A pretty composition is insufficient when it expresses a false relation or narrative moment. Preserve the Alaric climax and established facts; no invented lore, witnesses or consequences.
