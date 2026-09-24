# UI-VISUAL-DIRECTION-SYSTEM-2

## Goal

Refine the approved navy, antique-gold and ivory campaign UI into a smaller, more precisely aligned family. Scope is limited to CampaignStatusHud, next stop, NarrativeStage departure and Traversal optional encounters, plus their shared presentation CSS and font assets. No gameplay authority, route, save, dialogue or merchant behavior changed.

## Typography decision

All three candidates were loaded locally and compared on the real departure and merchant scenes. The six [comparison crops](ui-visual-direction-system-2-browser/font-comparison/) and [font measurements](ui-visual-direction-system-2-browser/font-comparison/comparison.json) record the actual rendered result.

| Candidate | Departure title width | Merchant title width | Visual judgment |
| --- | ---: | ---: | --- |
| Marcellus 400 | 264 px | 188 px | Clear and calm, but restrained enough to feel less distinctive at compact size. |
| Cormorant Garamond 600 | 272 px | 162 px | Elegant in the departure title; fine strokes and narrow merchant text become delicate in the small plaque. |
| **Alegreya 600/700** | **263 px** | **172 px** | Warm, legible and expressive at both sizes, without the stiffness of the previous Cinzel treatment. Selected. |

Selected stack: **Alegreya, Georgia, serif** for major titles, small labels and campaign buttons; **Source Sans 3, Inter, system-ui, sans-serif** for values, distances and descriptive copy. The browser check confirms both families are loaded and computed on the live UI. Marcellus and Cormorant Garamond remain development dependencies solely to reproduce the comparison; only Alegreya and Source Sans 3 are imported into the production stylesheet. Fonts elsewhere in the game remain unchanged.

## Changes and compactness

| Surface | Previous measured frame | Refined frame | Alignment change |
| --- | --- | --- | --- |
| Campaign HUD | 520 × 76 px | 438 × 64 px | Two balanced grid segments; icon and copy centered within each, with a shorter optional route-gold line. |
| Next stop | 270 × 94 px | 224 × 69 px | Smaller pin, tighter label/title/distance stack and slimmer progress rule. |
| Departure | 510 × 166 px | 430 × 110 px | Reduced padding, title-to-button gap and button height; destination-led wording retained. |
| Merchant encounter | 460 × 148 px | 420 × 110 px | Smaller merchant icon, tighter title/copy spacing and 32 px buttons. |
| Merchant at 620 px width | 600 × 135 px | 420 × 108 px | Content-sized panel instead of full-width banner. |

The shared frame corner sizes now step down by density: compact 19 px, standard 23 px, hero 27 px. Existing authored gold, reputation, destination and merchant SVGs retain one line-weight and color family. The desktop road view leaves the caravan, merchant and scenery unobstructed; the 390 × 844 capture keeps all three panels separate and the encounter text/buttons inside its frame.

## Changed files

- `package.json`, `package-lock.json`: production and comparison font packages.
- `src/styles/app.css`: selected font imports, compact HUD and departure typography/layout.
- `src/styles/traversal.css`: compact next-stop and encounter typography/layout, including narrow placement.
- `src/ui/CampaignStatusHud.ts`: use the compact shared frame variant.
- `src/ui/design-system/campaign-ui.css`: font tokens, smaller frame ornaments and common button font.
- `tools/ui-visual-direction-font-compare.mjs`: repeatable three-font comparison on actual game scenes.
- `tools/ui-visual-direction-2-qa.mjs`: live browser captures, previous-pass dimension comparison, font checks, mobile fit, overlap and encounter Ignore continuation.
- This report and the PNG/JSON artifacts under `docs/reports/ui-visual-direction-system-2-browser/`.

## Validation and browser QA

| Check | Result |
| --- | --- |
| Focused Vitest: HUD, JourneyOverlay, JourneySession, TraversalT0Scene, TraversalT0Flow | PASS, 46/46 |
| `npx.cmd tsc --noEmit` | PASS |
| `npm.cmd run build` | PASS; existing large-chunk warning |
| `git diff --check` | PASS; only Git LF/CRLF conversion notices |
| Browser QA, 1440 × 810, 620 × 780 and 390 × 844 | PASS; no page errors, measured panel overlap or mobile content overflow; merchant Ignore returns to road |
| Full Vitest | 2508 passed / 1 failed, 149 files |

The one full-suite failure is the unchanged historical `tools/cinematics/cin6ea_preproduction.test.mjs` protected-diff check against commit `57ba69c`. It lists the same seven paths already present in the parent `ui-visual-direction-system-1` test result: three approved Journey UI files and four campaign-grammar files inherited from that branch. No new test fails in this refinement. The protected CIN check was not changed.

Final captures: [departure](ui-visual-direction-system-2-browser/01-narrative-departure.png), [normal traversal](ui-visual-direction-system-2-browser/02-traversal-normal.png), [merchant](ui-visual-direction-system-2-browser/03-traversal-merchant.png), [620 px narrow](ui-visual-direction-system-2-browser/04-traversal-merchant-narrow.png), [390 px mobile](ui-visual-direction-system-2-browser/06-traversal-merchant-mobile.png), [route gold line](ui-visual-direction-system-2-browser/05-hud-route-gold.png), and [measurements](ui-visual-direction-system-2-browser/browser-qa.json).

## Later work

The selected typography is scoped to these campaign surfaces; Dialogue, Combat HUD and Refuge/management still need separate UI passes. Traversal camera composition is unchanged. The 390 px viewport is readable, though its merchant plaque necessarily takes most of the screen width; retaining scenery below the plaque remains the right compromise for this slice.
