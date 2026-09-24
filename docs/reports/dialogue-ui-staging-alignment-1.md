# DIALOGUE-UI-STAGING-ALIGNMENT-1

## Mission and baseline

Align production dialogue with the merged campaign UI Kit and place stage-owned characters inside the visible tableau. This is presentation work only. The branch was created directly from clean `main` at `dba502fe397c902b5f38a1efb95442531ca6be36`.

The four supplied previews set the composition target: a compact navy and antique-gold card with speaker, spoken text, a framed bust, and restrained choices over a dominant environment.

## Authority and handoff audit

| Concern | Existing authority and handoff | This pass |
| --- | --- | --- |
| Dialogue IDs, lines, steps, choices, gates, effects, routes | `src/game` content and `DialogueSequence`/`DialogueStep`; `DialogueView` advances the canonical graph and applies existing effects | No truth or progression code changed |
| Dialogue presentation decision | `NarrativeDialogueAdapter` and `DialogueStagingDirector` derive visual mode, phase, text segments, speaker association, and choice lanes | Kept their contract |
| Scene and cast | `NarrativeStage.presentDialogueTableau()` hands off after media; `NarrativeSceneSurface` owns the static cast and speaker focus | Added ground/depth presentation metadata within that owner |
| Character image identity | `CharacterVisualRegistry` role resolution with existing `assetManifest.characterProfiles` fallback for non-manifest story NPCs | Card crop resolves the `ui` role; no copied or generated portraits |
| Speaker metadata and text | Current `DialogueStep.speaker`, `tag`, `actorId`, `text` and adapter display segments | Card reads these fields directly |
| UI rendering | `DialogueView` creates the card and semantic choice buttons | Decorates them with `CampaignUi` frame, button, divider, icon, and typography roles |
| Safe zones | Tableau phase layout and speaker position are owned by the staging system; CSS placed earlier large dialogue modes in several lanes | One compact lower card and bounded choice stack reserve the lower viewport; cast feet and contact lines stay above or behind the card while faces remain visible |

`VIDEO -> STATIC_TABLEAU -> dialogue` remains the handoff. The card portrait is a crop of the same registered identity, while `NarrativeSceneSurface` remains the only owner of full-body staged actors. A legacy large portrait is suppressed in NarrativeStage mode to avoid another full-body actor layer.

## Implementation

- **Dialogue card:** A 600px maximum lower card uses `campaign-ui-frame--compact`, Alegreya speaker text, Source Sans 3 speech, a kit divider, and a 94×102 portrait region. On narrow screens the portrait is 72×82 and the card remains inside the viewport. The scene background stays exposed.
- **Portraits:** `resolveDialoguePortrait` reads the registry `ui` role, then the canonical manifest profile for story NPCs outside the V2 manifest. CSS crops the existing master at a standard scale with three small per-character crop overrides. Missing registration or image load error hides the portrait region and keeps the card readable. No PNG was modified or created.
- **Staging:** `NarrativeSceneSurface` now resolves a family-aware ground contact line and a gentle slot depth scale for far, mid, and near positions. Authored cast slots, identity scale, facing, phase, and speaker state remain intact. The tableau background remains the dominant image.
- **Choices:** Existing choice logic remains in `DialogueView`. Choice buttons now use `CampaignUi` secondary/disabled buttons and icons. The canonical speech card stays visible when choices activate; it becomes disabled while semantic, focusable choice buttons take focus. Three options form a compact bounded stack. Longer lists scroll inside the stack.
- **Responsive safe zone:** The card and choices have separate lower viewport bands at 1440×810, 620×780, and 390×844. The scene cast rises during a choice state so its faces remain above the lower UI; the card and choices do not overlap.

## Files changed

| Path | Purpose |
| --- | --- |
| `src/ui/DialogueView.ts` | Kit decoration, card portrait, persistent speech during choices, stage portrait guard |
| `src/ui/DialoguePortrait.ts` | Canonical portrait resolver and crop metadata |
| `src/ui/dialogue-alignment.css` | Compact card, choices, responsive layout, cast presentation |
| `src/ui/DialogueView.test.ts` | Portrait source/fallback, speech/choice persistence |
| `src/cinematics/NarrativeSceneSurface.ts` | Scene-owned contact line and depth slot resolver |
| `src/cinematics/NarrativeSceneSurface.test.ts` | Ground/depth geometry contract |
| `src/main.ts` | Load dialogue alignment style after the existing theme |
| `tools/dialogue/dialogue-proof.html` | Deterministic browser proof entry |
| `tools/dialogue/dialogue-proof.ts` | Isolated production-component scene fixture |
| `tools/dialogue/run-dialogue-ui-staging-qa.mjs` | Repeatable Playwright viewport and interaction QA |
| `docs/reports/dialogue-ui-staging-alignment-1.md` | This report |
| `docs/reports/dialogue-ui-staging-alignment-1-screenshots/*` | Seven visual captures and `qa-results.json` |

The browser proof uses actual UI and tableau components, registered character art, and an existing environment-only camp background. Its speech and no-effect choices are isolated fixture data; they do not enter game content or save state.

## Validation

| Check | Result |
| --- | --- |
| Focused dialogue/UI/NarrativeStage/Journey/Traversal tests | 9 files, 89/89 passing |
| TypeScript (`node node_modules/typescript/bin/tsc --noEmit`) | Pass |
| Production build (`node node_modules/vite/bin/vite.js build`) | Pass; existing large-chunk advisory only |
| `git diff --check` | Pass |
| Full Vitest suite | 150 files, 2,515/2,515 passing |
| Browser QA (`node tools/dialogue/run-dialogue-ui-staging-qa.mjs`) | 8/8 states across 1440×810, 620×780, 390×844, including five mobile choices; no page errors, missing portrait, card overflow, card/choice overlap, or failed choice click |

The local `npx` launcher is broken on this machine, so the repository-local TypeScript, Vite, and Vitest entry points were used.

## Screenshots

All files are under `docs/reports/dialogue-ui-staging-alignment-1-screenshots/`:

- `desktop-standard.jpg`
- `desktop-choices.jpg`
- `desktop-multi-cast.jpg`
- `narrow-standard.jpg`
- `narrow-choices.jpg`
- `mobile-standard.jpg`
- `mobile-choices.jpg`
- `mobile-many-choices.jpg`
- `qa-results.json`

## Non-goals and caveats

No dialogue IDs, text, choice ordering, requirements, effects, routes, campaign topology, save schema, registry authority, combat, merchant, Traversal policy, RunSystem, production gates, core art, or backgrounds were changed. The browser fixture confirms layout with one existing camp environment and a three/four-person cast; final artistic acceptance across all authored backgrounds remains the operator's visual review. The default isolated dialogue mode retains its legacy full-body portrait compatibility, while production NarrativeStage uses stage-owned cast plus the compact card crop.

## Future recommendation

After operator review, any scene with an unusual ground plane can receive a small tableau-family or phase-specific presentation adjustment in `NarrativeSceneSurface` without changing dialogue truth or adding portrait assets.
