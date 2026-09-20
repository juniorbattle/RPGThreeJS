# T0 — unification / fusion

This pass supersedes the spatial presentation and transition descriptions in the forest-v4 report. Existing campaign authority, optional participation rules, local preview interactions and production restrictions remain unchanged. No new art or canonical content was generated, and no source image was modified.

## Changes

- Major encounter locations now have a distinct upper-verge anchor. Camp/resting-place backdrops sit above their people, while the interaction subject meets the truck at the upper-road access. Stones, plants, ruined edging and masked ground variation reuse existing assets to join the location to the forest floor. Road texture blends into the tree-root edge instead of starting with a hard horizontal boundary.
- Cedric remains a simple lower-lane recruit encounter without a large shelter competing with the road. The mother/child and the selected human branch retain upper-lane resting places. Small enemies, pickups, wreckage and other road content retain their lane rules.
- The mandatory composition groups the threat, fallen-tree barricade, wrecked cart, debris and verge fragments into one road obstruction. The barricade reaches the upper lane and the cart/debris occupy the lower corridor. Its canonical mandatory interaction remains unavoidable.
- The fork is a smaller two-direction sign with a restrained ground connection. The extra large ruin at the fork and the broad trail overlay were removed. RunSystem still records selection; Traversal does not invent or enter a campaign node at selection time.
- A shared frame-driven transition layer handles entry, canonical event handoff, local interaction focus, return and fork resolution. Entry/return reveals take 280 ms; fade-out/reveal cycles take 560 ms. Route distance is held throughout. Canonical handoff occurs at the covered midpoint. The fork realigns the truck to the chosen branch lane and reveals its route variant at that midpoint. Inputs are blocked until the transition finishes. End-of-route acceleration and Travel View return remain intact.

## Verification

- **143 test files, 2,451 tests passed**: [full log](full-tests.log).
- Typecheck passed; production build passed with the existing bundle-size advisory. [Build log](build.log).
- `git diff --check` passed. [Whitespace log](diff-check.log).
- New regression coverage checks frozen route distance during entry/fades, delayed and exactly-once canonical handoff, fork realignment and branch presentation. Existing three participation-path tests now advance the real presentation transition clock.
- Browser: merchant Confirm/focus/return, mandatory canonical combat entry and return, upper resting-place approach/stop, optional bypass, physical fork, combat-branch lane realignment, later branch stop/Skip, exit and visible Travel View were exercised. Existing QA combat victory controls were used for the combat integration check; this is not a manual battle-balance test.
- Browser measurements show progress held at 0.8 during the fork transition, lane changing from 0 to 1 and the selected combat variant replacing `main`, followed by normal route movement. [Measurements](fork-transition.json).
- Final complete route had no captured console errors. [Errors](console-errors.json). The final CSS-only barricade-height adjustment was then separately inspected in the browser.

## Review captures

| Surface | Capture |
|---|---|
| Camp connected to upper roadside | [Merchant](merchant.png) |
| Upper resting place | [Resting place](resting-place.png) |
| Unified mandatory obstruction | [Mandatory](mandatory.png) |
| Restrained signpost fork | [Fork](fork.png) |
| Selected branch | [Branch](branch.png) |
| End-to-end return | [Travel View](return-travel.png) |

Preview: http://127.0.0.1:5174/?qa=1&traversal=t0

T0 preview only. Production remains disabled. No commit, push or production asset promotion. Visual approval remains with the operator.
