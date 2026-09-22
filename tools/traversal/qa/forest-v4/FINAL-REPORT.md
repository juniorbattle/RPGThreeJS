# Traversal T0 — final convergence

Implementation, visual review, motion inspection and end-to-end browser checks passed. Changes are ready for operator review, uncommitted and unpushed. Production remains disabled and the rollout remains T0 only.

## Result and scope

The supplied composition reference guided the substantial roadside merchant camp, layered forest, foreground foliage and physical encounter staging. The written specification takes precedence: two lanes, empty-cab wooden truck, no player heraldry, optional lane encounters and top-center engagement decisions. New native-alpha props include the camp, resting place, woodland barricade, ruined outpost and crossroads ground. Existing canonical character sprites and combat formations remain authoritative.

All grounded encounters and props use the same road coordinate conversion. Camera movement drives road translation, wheel rotation and suspension; distance freezes during decisions. Far scenery moves at 0.08 times road speed, forest at 0.22 and foreground at 1.22. The composition allocates approximately 53% to environment, 32% to visible road and 15% to irregular foreground foliage. These are visual proportions rather than opaque rectangular bands.

Markers announce encounters during approach. The panel opens only at physical engagement. Skip steers to the other lane, temporarily locks steering until clear and leaves the physical scene visible as it passes. Essential lane movement remains animated under reduced-motion preferences. Authored T0 spacing keeps the assisted bypass corridor clear; mandatory encounters and the fork still stop traversal.

Opening Ambush is the required encounter. Cedric, mother/child and later branch encounters are optional. The physical fork records selection in RunSystem without entering its node, continues the mounted scene and reveals the selected event later. At the end, spawning stops, the truck accelerates off the right edge, the road keeps moving and the fade returns to Travel View. Entering the Refuge requires a separate destination confirmation.

## Canonical authority and local interactions

See [content-audit.md](content-audit.md) for the complete before/after participation table. No campaign node was invented. The merchant, generic hostile encounter, chest, broken cart and booster retain undefined campaign bindings. The non-combat local interactions use the approved preview shell and consume/resume without permanent rewards. The generic combat bridge uses the actual combat engine with isolated preview state, authored enemy configurations, no narrative hooks and no persistent rewards or injury/inventory consequences.

RunSystem owns optional bypasses and the selected branch. Two optional save fields preserve compatibility with existing V6 saves. Bypass does not visit or resolve a node, grant a reward or fabricate a narrative choice. Travel View resolves the real remaining canonical edge after bypasses; this fixes the missing-environment return seen during development. Character System V2, canonical art, T1–T4 participation and the production gate are preserved.

## Browser evidence

Final evidence lives exclusively in `final/`; older captures outside that folder document intermediate development and are not acceptance evidence.

| Required surface | Final evidence | Result |
|---|---|---|
| A — forest travel | [A.png](final/A.png), [motion.gif](final/motion.gif) | Live movement, two lanes, forest depth and parallax |
| B — merchant approach | [B.png](final/B.png) | Large roadside establishment; marker, no early decision panel |
| C — merchant engagement | [C.png](final/C.png) | Physical stop and Confirm/Skip panel |
| D — optional human | [D.png](final/D.png), [cedric.png](final/cedric.png) | Canonical mother/baby and Cedric with resting-place staging |
| E — random hostile | [E.png](final/E.png) | Real formation, lane-specific optional encounter; real combat return exercised |
| F — opening ambush | [F.png](final/F.png) | Centered formation, forest barricade, Continue only |
| G — physical fork | [G.png](final/G.png), [forkChoice.png](final/forkChoice.png) | Signage, crossroads and canonical branch selection |
| H — later branch | [branch.png](final/branch.png), [combat-branch-bypass.png](final/combat-branch-bypass.png) | Delayed encounter and selected woodland variant |
| I — exit and destination | [exit.gif](final/exit.gif), [I.png](final/I.png), [destination-confirmed.png](final/destination-confirmed.png) | Acceleration, right exit, fade, Travel View, explicit Refuge entry |

Three complete final browser journeys used the actual UI:

1. Event branch skipped with Passer: assisted lane change, exit, visible Travel View, then explicit Refuge confirmation and working Refuge UI.
2. Event branch engaged: canonical wounded merchant dialogue and authored choice, return to the same Traversal, exit and visible Travel View. [Return capture](final/return-engaged.png).
3. Combat branch bypassed while staying on the other lane: formation passed in motion, no decision panel, exit and visible Travel View. [Return capture](final/return-bypassed.png).

The third journey recorded 204 samples; all traversal phases were RUNNING or ARRIVING, with 42 RUNNING samples between branch contact and the passed threshold and zero unexpected panels. [Opposite-lane samples](final/opposite-lane.json). Final browser error logs were empty: [console-errors.json](final/console-errors.json).

Live road-space measurement recorded camera displacement of 462.4776 reference pixels and merchant displacement of -462.474 pixels; the small difference is rendered coordinate rounding. Decision samples freeze camera and wheels. Skip samples retain the subject from contact through off-screen passage. Read-only browser measurements are retained in [live-motion.json](final/live-motion.json), [bypass.json](final/bypass.json) and [end-transition.json](final/end-transition.json). GIFs are resized recordings of browser screenshots, not simulated movement.

Combat handoff validation used the existing QA deployment/victory controls to exercise the actual engine and return path. This proves integration, not manual tactical balance or a production random-encounter economy.

## Acceptance gate

| Gate | Evidence and outcome |
|---|---|
| World and game feel | PASS — live road-space motion, subtle distant movement, stronger foreground, distance-driven wheels, coherent pause, animated lane bypass and accelerating departure |
| World design | PASS — substantial camp, human rest sites, cart wreckage, hostile formations, roadside ruins and physical crossroads; markers supplement physical subjects |
| Art direction | PASS — cool dense woodland, leaf-covered road, foreground foliage, forest barricades, two-lane scale; reviewed against the supplied reference with written-spec precedence |
| Content | PASS — opening required; secondary people and branch encounters optional; generic basic combat independent of campaign nodes |
| Interactions | PASS — same-lane stop, opposite-lane pass, Confirm, assisted Skip, retained passing scenery, unavoidable required stop |
| Fork | PASS — physical sign/trails, RunSystem selection, no immediate narrative entry, same scene resumes, later selected encounter |
| End transition | PASS — no new end-phase spawns, acceleration, right exit, fade, Travel View and explicit destination entry; all three branch participation cases exercised |
| Architecture | PASS — canonical Campaign Structure/RunSystem/Character V2 authority, optional backward-compatible fields, no local invented campaign bindings, production disabled, T0 only |
| Validation | PASS — focused tests, full suite, typecheck, build, whitespace check and final browser runs |

## Automated checks and asset preservation

- Focused checks: 13 files, 47 tests passed.
- Full suite: **143 files, 2,450 tests passed**. [Log](full-tests.log). The historical VFX compatibility tests passed in this run; there is no baseline-failure exception in this result.
- TypeScript: `tsc --noEmit`, exit 0.
- Vite build: passed in 12.57 seconds; existing large-chunk advisory remains. [Log](build.log).
- `git diff --check`: exit 0 with repository line-ending configuration. [Log](diff-check.log). A forced `core.autocrlf=false` diagnostic interpreted Windows CRLF as whitespace; normal repository checks pass after fixing two trailing blank lines.
- Three historical scope tests were updated narrowly for the explicitly authorized T0 schema and Travel View return. The schema guard compares against the baseline with only the two approved optional fields and their comment removed.
- [Asset audit](asset-audit.json): 16 active assets, all 13 baseline asset hashes preserved. Generated source identities, provenance and deterministic non-mirrored assembly hashes are retained beside the forest-v4 assets. Canonical source media was not regenerated or overwritten.

## Review

Preview: `http://127.0.0.1:5174/?qa=1&traversal=t0` using `node tools/traversal/qa-server.mjs`. The local QA server disables file watching to prevent artifact generation from restarting a live acceptance run. The current browser is left at the completed route's Travel View; reload starts the QA entry flow.

Operator visual review remains the next release decision. No production activation, asset promotion, commit or push has been performed.
