# UI-VISUAL-DIRECTION-SYSTEM-1

## Goal and scope

Establish one premium navy, antique-gold and ivory campaign UI family, then apply it to the CampaignStatusHud, Traversal next stop, NarrativeStage departure agency, and Traversal optional encounter. The game world remains visible and dominant. No campaign rules, route logic, save contract, combat logic, or production traversal gate changed.

## Implementation

- `src/ui/design-system/CampaignUi.ts`: static SVG icons for gold, reputation, destination, dialogue and merchant; reusable four-corner frame decoration. The first three icons and merchant icon are used by this slice. Dialogue is ready for later adoption.
- `src/ui/design-system/campaign-ui.css` and `frame-corner.svg`: navy/brass/ivory tokens; compact, standard and hero frame variants; corner ornament; vertical and horizontal divider styles; primary and secondary button styles.
- `src/ui/CampaignStatusHud.ts`, `src/styles/app.css`: larger two-segment HUD with coin and shield SVGs. It still shows only gold (including route gold) and reputation, retains the existing single movable owner, and excludes gems.
- `src/traversal/TraversalT0Scene.ts`, `src/styles/traversal.css`: destination frame and pin icon; merchant encounter frame, merchant icon and common buttons. The redundant route-context plaque is visually hidden to keep the road clear; the scene's accessible route label and route behavior remain in place.
- `src/cinematics/JourneyOverlay.ts`: departure-only frame and button treatment, selected by the existing `Départ` / `Vers ...` presentation labels. `DÉPART → VERS [destination] → PRENDRE LA ROUTE` and its continuation callback remain unchanged.
- `src/ui/CampaignStatusHud.test.ts`, `src/traversal/TraversalT0Scene.test.ts`, `src/cinematics/JourneyOverlay.test.ts`: narrow assertions for icons, frames and preserved action. `src/cinematics/JourneySession.test.ts` allows only the presentation helper import in JourneyOverlay while retaining the gameplay import guard.
- `tools/ui-visual-direction-qa.mjs`: repeatable live browser capture and overlap check. It intercepts the dev bootstrap only inside Playwright to reach the actual departure and T0 surfaces; no runtime QA hook or production gate was added.

## Validation

| Check | Result |
| --- | --- |
| Focused Vitest, 3 files | PASS, 24/24 |
| TypeScript, `npx.cmd tsc --noEmit` | PASS |
| Production build, `npm.cmd run build` | PASS; existing chunk-size warning |
| `git diff --check` | PASS; Git emitted only LF/CRLF conversion notices |
| Browser QA | PASS; four captures, no page errors, no HUD/panel overlap in measured viewports |
| Full Vitest, `npm.cmd test -- --run` | 2508 passed, 1 failed, 149 files total |

The single full-suite failure is `tools/cinematics/cin6ea_preproduction.test.mjs`, a historical CIN-6E-A protected-diff lock comparing this worktree against commit `57ba69c`. Four disallowed paths are already different at the parent HEAD (`NarrativePresentationPlans.ts`, `TraversalOptionalConsequencePolicy.ts`, `campaignGrammarConsolidation.test.ts`, `campaignGrammarContent.ts`). The new authorized Journey overlay and import-guard files add three more names to that historical diff check. The lock was left intact; no runtime or focused behavioral test fails. The parent-HEAD comparison was verified with `git diff --name-only 57ba69c HEAD -- src/game src/cinematics`.

## Browser captures

- [NarrativeStage departure](ui-visual-direction-system-1-browser/01-narrative-departure.png): destination-led panel and HUD; scenic cast remains visible.
- [Traversal normal](ui-visual-direction-system-1-browser/02-traversal-normal.png): HUD and destination frame; no overlap.
- [Traversal merchant](ui-visual-direction-system-1-browser/03-traversal-merchant.png): optional encounter uses the same frame, type and buttons; the merchant and caravan remain visible.
- [Narrow merchant](ui-visual-direction-system-1-browser/04-traversal-merchant-narrow.png): 620 × 780; panels stack without overlap.
- [Browser QA measurements](ui-visual-direction-system-1-browser/browser-qa.json): exact rectangles, text checks and zero page errors.

## Remaining work

Dialogue can adopt the prepared speech icon, title hierarchy and divider after its staging flow is separately reviewed. Combat HUD and Refuge/management need their own information-density and interaction pass. Traversal camera and composition remain a separate task. This slice did not redesign combat, Refuge, menu, dialogue flow, campaign logic, save data, routes or the asset pipeline.
