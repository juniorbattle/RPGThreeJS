# DIALOGUE-UI-STAGING-ALIGNMENT-1 — corrective Static Tableau V2 pass

## Decision and authority

The first branch pass adopted the campaign UI Kit, compact speech card, portraits, and semantic choices, but also tried to seat dialogue actors inside the environment with family-dependent ground lines and far/mid/near scale. The resulting characters were too small and the visual grammar converged with NarrativeStage. The adopted direction is a premium theatrical Static Tableau: the environment sets the place, while large canonical full-body sprites stand before it on a foreground plane.

This is presentation-only work on the existing dialogue-ui-staging-alignment-1 branch, based on main dba502fe397c902b5f38a1efb95442531ca6be36. No dialogue content, choice ID, effect, route, save schema, or canonical art changed. NarrativeStage still owns the VIDEO -> STATIC_TABLEAU -> dialogue handoff; NarrativeSceneSurface remains the single full-body cast owner. DialogueView uses a crop of the registered UI visual for speaker identity in the card, with the existing manifest fallback for unregistered story NPCs.

## Corrective implementation

| Area | Final behavior |
| --- | --- |
| Environmental depth removed | Removed resolveNarrativeGroundPlacement, depthScale, data-depth-slot, family-driven ground offsets, and the pseudo-ground CSS band. |
| Foreground presence | Restored the proven tall transparent-sprite canvas and cast-density scales: 1.28 for one actor, 1.18 for two, 1.14 for three, 1.10 for four. Intentional lower-body crop remains available. |
| Composition | StaticTableauComposition maps existing semantic screen positions to visual X targets using scene family and authored actor groups. It never derives a profile from cast count and never changes authored slots or choice lanes. |
| Speaker state | ACTIVE is fully lit, LISTENING remains readable at 0.8 opacity, and authored BACKGROUND actors remain dimmer. Speaker handoffs do not change actor X, scale, or baseline. |
| Card and choices | The UI Kit, Alegreya speaker/title, Source Sans 3 speech, portrait crop/fallback, compact navy/gold card, and canonical semantic choice buttons remain. The card stays in the lower band until choices actually activate; it then stays visible above the choice stack. |
| Responsive | Narrow and mobile layouts keep larger cast silhouettes. At 390px, a dense four-person choice lifts the whole foreground cast by 8vh solely for card clearance; no depth cue or actor-specific speaker movement is introduced. The speech card and choice stack have a measured gap. |

The eight reusable composition profiles are AUTHORITY_AUDIENCE, ADVISER_EXCHANGE, COMPANY_EXCHANGE, OPPOSING_GROUPS, EVENT_SUBJECT_FOCUS, PRE_COMBAT_CONFRONTATION, AFTERMATH_GROUP, and FINALE_FOCUS. Audience gives the delegation a left cluster and authority the right side; adviser and company scenes use different lane targets; opposing scenes retain faction separation. Existing phase changes and authored cast membership remain authoritative. **Phase-specific exceptions: 0. Per-step coordinate overrides: 0.**

## Exhaustive review

The current repository contains **75 reachable dialogues, 257 canonical steps, and 29 choice states**, rather than the approximately 71/247/28 counts in the corrective brief. The protected staging audit tests confirm the current 75/257 coverage; no content was added here. The browser harness renders the real production dialogue components and canonical assets. It measured **82 visual phases and 328 states**, including every canonical step, all 29 choices, and one representative speaker handoff in each phase that has one.

The gallery contains **171 desktop captures at 1440×810** (every phase opening, material phase change, choice, and first handoff) and **42 representative captures** across the eight composition profiles at 1366×768, 620×780, and 390×844. All 15 desktop and 4 responsive contact sheets were inspected, including the Audience, dragon, refugee, finale, and dense choice scenes. Each gallery entry names dialogue, phase, speaker, cast, profile, and viewport. The JSON records semantic positions, alpha-visible geometry, cast state/opacity/scale, card and choice rectangles, and actor/actor and actor/card intersections.

At 1440×810 the alpha-visible body-height ranges are:

| Cast size | Visible viewport height |
| --- | --- |
| 1 | 52.2–67.7% |
| 2 | 48.1–62.4% |
| 3 | 46.5–74.6% |
| 4 | 44.8–51.8% |

The final browser run reported no page errors, offscreen heads, invisible speakers, missing images, card content overflow, page overflow, card/choice collision, card obstruction of the measured head band, or actor anchor/height/baseline jump above 1px across speech handoffs. Speech cards sit in the lower viewport band until the choice state begins. The former apparent horizontal jump was the alpha silhouette changing optical center when an authored facing flips; the actor anchor and size stay fixed.

The advisory geometry review still records 27 weak-presence samples on representative narrow/mobile views under a desktop-oriented threshold, and four large alpha-bounding-box overlaps in the Audience cluster at narrow/mobile sizes. Those four overlap samples belong to one authored phase across speech and choice captures; direct inspection shows distinct faces and deliberate delegation grouping. Mobile visible-body ratios are lower than desktop because the card and choice stack consume more vertical room: the representative 390×844 four-person cast is 24.8–27.7%. Its choice state exposes the cast's heads and upper bodies after the safe-zone adjustment. These are visual tradeoffs for operator review, not silent automated passes.

Evidence:

- docs/reports/dialogue-static-tableau-v2-review/gallery.html
- docs/reports/dialogue-static-tableau-v2-review/composition-audit.json
- docs/reports/dialogue-static-tableau-v2-review/review-findings.json
- docs/reports/dialogue-static-tableau-v2-review/contact-sheets/
- docs/reports/dialogue-static-tableau-v2-review/screenshots/
- docs/reports/dialogue-ui-staging-alignment-1-screenshots/

## Verification

| Check | Result |
| --- | --- |
| Focused dialogue, staging, UI, NarrativeStage, Journey, Traversal | 12 files, 105/105 tests pass |
| Full Vitest | 150 files, 2,516/2,516 tests pass |
| TypeScript | Pass |
| Production build | Pass; existing large-chunk advisory |
| Existing dialogue browser interaction QA | 8/8 states pass |
| Exhaustive browser capture | 75 dialogues, 82 phases, 257 steps, 29 choices, 328 measured states, 213 captures, zero page errors |
| Git whitespace check | Pass |

The local npx launcher is broken on this machine, so repository-local TypeScript, Vite, and Vitest entry points were used. The browser proof is a deterministic production-component harness with no effect writes, followed by manual gallery inspection. Final artistic acceptance remains with the operator, especially the four-person mobile Audience choice.

## File map for this corrective commit

- src/cinematics/StaticTableauComposition.ts — semantic-to-visual profile tuning.
- src/cinematics/NarrativeSceneSurface.ts and src/cinematics/NarrativeSceneSurface.test.ts — remove environmental depth and test stable foreground geometry.
- src/ui/dialogue-alignment.css — theatrical cast lighting, stable lower card, and responsive safe zones.
- tools/dialogue/static-tableau-v2-proof.html and .ts — canonical browser harness.
- tools/dialogue/run-static-tableau-v2-review.mjs, analyze-static-tableau-v2-review.mjs, and create-static-tableau-contact-sheets.py — exhaustive capture, geometry review, and contact sheets.
- docs/reports/dialogue-static-tableau-v2-review/ — gallery, machine audit, findings, captures, contact sheets.
- docs/reports/dialogue-ui-staging-alignment-1-screenshots/ — updated original eight browser QA captures and results.
- This report.

The earlier branch implementation in DialogueView, DialoguePortrait, the UI Kit integration, tests, main style import, and original browser fixture is retained. No merge was performed.

## Final runtime scrollbar and visual-balance correction

The dialogue card now uses `overflow: hidden !important`. Its four decorative frame corners were inset by 5px while preserving the previously visible 14px crop of each ornament; the ornaments had expanded both native scroll extents by 5px. Choice stacks use `overflow-x: hidden` and `overflow-y: auto`, so the five-choice mobile fixture still scrolls vertically. No card width, max-height, typography, dialogue content, choice semantics, or narrative logic changed.

After the operator requested stronger portrait presence, the UI portrait crop was enlarged to 4.3× and raised toward the face, with targeted offsets for silhouettes whose heads lie unusually high or low in their source images. The young dragon crop now centers its head instead of its wing. Canonical image files were not edited. The [portrait contact sheet](dialogue-static-tableau-v2-review/portrait-contact-sheet.png) shows 21 speaker portraits at review size. The portrait-fallback fixture was checked separately on desktop and mobile because all 334 canonical review states have a registered portrait.

The later operator feedback also authorized three specific foreground scale corrections: forest troll ×1.18, young dragon ×1.16, shrine apparition ×0.82. Their authored X anchors, theatrical baseline, phase mapping, and choice lanes did not move. The [before/after comparison](dialogue-static-tableau-v2-review/silhouette-before-after.jpg) shows the desktop balance; the [gallery](dialogue-static-tableau-v2-review/gallery.html) includes dedicated 1366×768, 620×780, and 390×844 checks for troll and apparition, alongside the existing dragon samples. The dragon was limited to ×1.16 after mobile inspection to preserve separation from Maelor.

The final exhaustive browser audit measured **334 card states** across 75 dialogues, 257 steps, 29 choice states, and the four required viewports, with 219 captures and zero page errors. Every measured card computed to `overflow-x: hidden` and `overflow-y: hidden`. Maximum `scrollWidth - clientWidth` and `scrollHeight - clientHeight` were both **0px**; no speaker, tag, portrait frame, speech, outcome, divider, or continue affordance extended beyond the card. The longest visible speech measured 195 characters and fit at 598/598px width and 190/190px height. Card widths stayed 600px at 1440/1366, 596px at 620, and 366px at 390; their range of heights was 111–191.86px. The direct comparison with the prior committed audit matched 328 states: 789 unaffected actor instances had **0px geometry change**, the 22 intended troll/dragon/apparition instances retained their X anchors and baseline, and the largest card-rectangle delta was **0.005px** from browser subpixel rounding. Representative desktop and mobile screenshots were pixel-identical outside the card for unaffected scenes.

Final verification: dialogue browser interaction QA **10/10** (including portrait fallback and a vertically scrollable five-choice list); exhaustive card/choice overflow failures **0/0**; gallery navigation QA passed at 1440 and 390; full Vitest **150 files, 2,517/2,517 tests**; TypeScript and production build passed; `git diff --check` passed. The CIN-6E-A preproduction test allowlist was updated for the already operator-approved `StaticTableauComposition.ts` on this branch; no protected visual asset or game system was changed. The build retains its existing large-chunk advisory. Earlier narrow/mobile weak-presence and Audience cluster-overlap findings remain advisory; the final review recorded no new heavy-overlap finding from the enlarged dragon.
