# DIALOGUE-UI-STAGING-ALIGNMENT-1 — Static Tableau V2 and final pre-merge pass

## Decision and authority

The first branch pass adopted the campaign UI Kit, compact speech card, portraits, and semantic choices, but also tried to seat dialogue actors inside the environment with family-dependent ground lines and far/mid/near scale. The resulting characters were too small and the visual grammar converged with NarrativeStage. The adopted direction is a premium theatrical Static Tableau: the environment sets the place, while large canonical full-body sprites stand before it on a foreground plane.

This is presentation-only work on the existing dialogue-ui-staging-alignment-1 branch, based on main dba502fe397c902b5f38a1efb95442531ca6be36. No dialogue content, choice ID, effect, route, save schema, or canonical art changed. NarrativeStage still owns the VIDEO -> STATIC_TABLEAU -> dialogue handoff; NarrativeSceneSurface remains the single full-body cast owner. DialogueView uses a crop of the registered UI visual for speaker identity in the card, with the existing manifest fallback for unregistered story NPCs.

## Accepted Static Tableau implementation at `4c093e7`

| Area | Behavior at the accepted baseline |
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

## Prior dialogue scrollbar and visual-balance correction

The dialogue card now uses `overflow: hidden !important`. Its four decorative frame corners were inset by 5px while preserving the previously visible 14px crop of each ornament; the ornaments had expanded both native scroll extents by 5px. Choice stacks use `overflow-x: hidden` and `overflow-y: auto`, so the five-choice mobile fixture still scrolls vertically. No card width, max-height, typography, dialogue content, choice semantics, or narrative logic changed.

After the operator requested stronger portrait presence, the UI portrait crop was enlarged to 4.3× and raised toward the face, with targeted offsets for silhouettes whose heads lie unusually high or low in their source images. The young dragon crop now centers its head instead of its wing. Canonical image files were not edited. The [portrait contact sheet](dialogue-static-tableau-v2-review/portrait-contact-sheet.png) shows 21 speaker portraits at review size. The portrait-fallback fixture was checked separately on desktop and mobile because all 334 canonical review states have a registered portrait.

The later operator feedback also authorized three specific foreground scale corrections: forest troll ×1.18, young dragon ×1.16, shrine apparition ×0.82. Their authored X anchors, theatrical baseline, phase mapping, and choice lanes did not move. The [before/after comparison](dialogue-static-tableau-v2-review/silhouette-before-after.jpg) shows the desktop balance; the [gallery](dialogue-static-tableau-v2-review/gallery.html) includes dedicated 1366×768, 620×780, and 390×844 checks for troll and apparition, alongside the existing dragon samples. The dragon was limited to ×1.16 after mobile inspection to preserve separation from Maelor.

The final exhaustive browser audit measured **334 card states** across 75 dialogues, 257 steps, 29 choice states, and the four required viewports, with 219 captures and zero page errors. Every measured card computed to `overflow-x: hidden` and `overflow-y: hidden`. Maximum `scrollWidth - clientWidth` and `scrollHeight - clientHeight` were both **0px**; no speaker, tag, portrait frame, speech, outcome, divider, or continue affordance extended beyond the card. The longest visible speech measured 195 characters and fit at 598/598px width and 190/190px height. Card widths stayed 600px at 1440/1366, 596px at 620, and 366px at 390; their range of heights was 111–191.86px. The direct comparison with the prior committed audit matched 328 states: 789 unaffected actor instances had **0px geometry change**, the 22 intended troll/dragon/apparition instances retained their X anchors and baseline, and the largest card-rectangle delta was **0.005px** from browser subpixel rounding. Representative desktop and mobile screenshots were pixel-identical outside the card for unaffected scenes.

Verification at that baseline: dialogue browser interaction QA **10/10** (including portrait fallback and a vertically scrollable five-choice list); exhaustive card/choice overflow failures **0/0**; gallery navigation QA passed at 1440 and 390; full Vitest **150 files, 2,517/2,517 tests**; TypeScript and production build passed; `git diff --check` passed. The CIN-6E-A preproduction test allowlist was updated for the already operator-approved `StaticTableauComposition.ts` on this branch; no protected visual asset or game system was changed. The build retains its existing large-chunk advisory. Earlier narrow/mobile weak-presence and Audience cluster-overlap findings remain advisory; that review recorded no new heavy-overlap finding from the enlarged dragon.

## Final pre-merge runtime presentation pass

Baseline: `4c093e75cf107eb77cabec2d1ef0f6931feb4523` on the same `dialogue-ui-staging-alignment-1` branch. The actual Journey next-event panel still inherited `overflow: auto` and a height cap. Its `campaign-ui-frame` departure variant also had four corners extending 5px beyond the panel's scroll dimensions. The final runtime panel now sizes to its content with computed `overflow-x/y: visible`; departure corners sit inside the same card rectangle. The card's width, padding, typography, title/caption/context/button content, and navy/gold treatment remain intact. The existing branch choice surface stays separate; its two buttons now fit side by side at 390px instead of extending beyond the viewport.

Static Tableau dialogue actors no longer receive a multiplier based on cast size (formerly 1.28/1.18/1.14/1.10 for 1/2/3/4). One 1.14 base applies to every theatrical actor, multiplied only by the authored actor scale and the already approved troll/dragon/apparition silhouette tuning. The responsive cast width and baseline rules likewise no longer branch on cast count. The four-person choice-safe lift is now a choice-state rule for all cast sizes. Speaker handoff still changes lighting only. The same actor was rendered in 1/2/3/4 cast fixtures at 1440×810, 1366×768, 620×780, and 390×844: **zero X/bottom/width/height/scale differences above 1px** within each viewport. Compared with the accepted 334-state audit, all 829 matching actor instances retained their X anchor (maximum delta 0.00006px); desktop baseline delta was 0px, and the speech card rectangle delta was at most 0.005px. Responsive baselines intentionally normalized across cast sizes, with up to 118px difference for a one-actor mobile choice relative to the previous count-specific rule.

The cast grammar is now explicit on each stage-owned Journey tableau: `SCENE_INTEGRATED` with authored actor X, road baseline, and scale for camp departure, Audience forest-road departure, Valmir fork, and the generic travel fallback. Dialogue tableaux keep `THEATRICAL_FOREGROUND` and their approved composition profiles. No FAR/MID/NEAR depth rule or cast-count-derived stage placement drives Journey actors. The forest-road trio occupies the open paved path while the distant castle, HUD, lower-right agency card, and route continue remain visible. Camp and Valmir use separate coordinates against their own approved stills. No art asset or narrative authority changed.

The [Journey scene gallery](dialogue-journey-scene-review/gallery.html), [four contact sheets](dialogue-journey-scene-review/contact-sheets/), and [measurements](dialogue-journey-scene-review/measurements.json) cover four reachable stage-owned cast tableau definitions in six agency variants across 1440×810, 1366×768, 620×780, and 390×844: **24 real `NarrativeStage`/`JourneyOverlay` captures**. The next-event and fork cards use canonical `RunNode` labels and metadata through `planJourneyBoundary`; the departure card uses the `GameApp` title/button contract. Each measurement records cast mode, actor anchor/body bottom/alpha-visible height/scale, card rectangle, actual computed overflow, scroll dimensions, visible text and ornament bounds, choice bounds, and HUD rectangle. Across all 24: computed card overflow is `visible/visible`; maximum horizontal and vertical scroll excess are **0px**; no card text, choice text, ornament, or button is clipped or offscreen; all actor images decoded, alpha-visible heads are in view, and there were zero page errors. The visible actor body-height range is 147–183px at 1440 and 85–106px at 390, consistent with road perspective. The compact card's height range is 110–170px at 1440 and 100–158px at 390. The mobile branch choice geometry was inspected directly after its correction.

The refreshed [Static Tableau gallery](dialogue-static-tableau-v2-review/gallery.html), [cast-count invariance audit](dialogue-static-tableau-v2-review/cast-count-invariance.json), and [geometry comparison](../../tools/dialogue/check-static-tableau-geometry.mjs) cover **75 dialogues, 82 phases, 257 canonical steps, 29 choice states, 334 measured states, and 219 canonical captures**, plus eight cast-count fixture captures. Dialogue card overflow, horizontal choice overflow, and browser page errors were all zero. Four responsive and 15 desktop contact sheets were regenerated and visually inspected. The advisory composition analyzer records 39 weak-presence samples and 8 large alpha-box overlaps, mostly on narrow/mobile views; these are visible in the gallery and are not clipping or scrollbar failures.

Final validation: focused NarrativeSceneSurface, NarrativeTableau, NarrativeStage, JourneyOverlay, JourneyCampaignBoundary and spatial tests **6 files, 73/73**; focused traversal/campaign-boundary tests **4 files, 41/41**; dialogue browser interaction **10/10**; full Vitest **150 files, 2,518/2,518**; TypeScript, production build, gallery navigation, Journey browser audit, exhaustive dialogue browser audit, geometry comparison, and `git diff --check` all pass. The production build retains its existing large-chunk advisory. This branch is prepared for operator visual review without a merge.

## Journey cast presence adjustment

After operator review, `SCENE_INTEGRATED` Journey actors received a uniform **1.20×** multiplier on top of their existing per-character and per-road authored scales. Their X positions and road baselines remain authored by each Journey tableau. The `THEATRICAL_FOREGROUND` branch and its approved 1.14 base are unchanged. No CSS, card, HUD, portrait, scene asset, narrative content, or gameplay logic changed.

The refreshed [Journey gallery](dialogue-journey-scene-review/gallery.html), [contact sheets](dialogue-journey-scene-review/contact-sheets/), and [measurements](dialogue-journey-scene-review/measurements.json) cover the same 24 runtime captures at 1440×810, 1366×768, 620×780, and 390×844. All 72 measured actor silhouettes are 20% taller than the prior capture within browser rounding; their maximum X-anchor difference is **0.00005px**. At 390×844, visible body heights are now **102–127px**. The card and HUD rectangles have **0px** difference; card scroll excess, clipping, offscreen choices, and page errors are all zero. The scene contact sheets were visually checked for ground contact and card clearance.

The Static Tableau exhaustive review still covers **75 dialogues, 334 measured states, and 219 captures** with zero card or horizontal choice overflow failures. Comparing its new audit against the preceding commit gives **0px difference** for all 829 theatrical actor anchors, scales, and figure geometry; the largest card rectangle difference is **0.0044px** from subpixel rounding. Its regenerated screenshots and audit were restored after this comparison because they are outside this Journey-only visual change. Dialogue interaction QA remains **10/10**; focused tests **73/73**; full Vitest **150 files, 2,518/2,518**; TypeScript and production build pass. The build retains its pre-existing large-chunk advisory.

## Final Journey cast size refinement

The operator requested **1.40× of the original scene-integrated size**, superseding the 1.20× review above. The multiplier remains limited to `SCENE_INTEGRATED`; each actor retains its authored road X and baseline, and theatrical dialogue geometry is untouched. Compared with the 1.20× capture, all 72 Journey actor scales increased by exactly 7/6 within floating-point rounding, with maximum X-anchor drift of **0.00005px**. At 390×844, visible actor body heights now range from **119–148px**. The refreshed 24-capture [gallery](dialogue-journey-scene-review/gallery.html), [measurements](dialogue-journey-scene-review/measurements.json), and four contact sheets show clear heads and feet, with the cards and HUD still at **0px rectangle difference**. Browser review reports zero card overflow, clipping, offscreen choices, or page errors.

Focused NarrativeStage/Journey tests pass **73/73**, full Vitest **2,518/2,518**, and TypeScript and production build pass. Dialogue interaction browser QA passes **10/10**. The exhaustive Static Tableau review passes **334/334 states** with no overflow or page error; comparison against the preceding commit shows **0px change** to all 829 theatrical actor anchors, scales, and figure geometries. Its maximum card rectangle deviation is **0.014px** from browser subpixel rounding. Regenerated theatrical review artifacts were restored because this pass only changes Journey cast size.
