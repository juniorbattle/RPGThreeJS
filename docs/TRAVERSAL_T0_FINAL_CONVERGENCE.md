# Traversal T0 — final convergence pass

Engineering validation and Chromium journeys passed. **Awaiting operator visual review.** Production remains disabled; changes are uncommitted and unpushed.

Baseline: `campaign-structure-1`, `96954e7bb6b1416f4899858ee860079b776d48d5`, matching the tracked upstream at intake. Existing untracked QA captures were preserved. This pass extends the accepted implementation; it does not replace the campaign, world or return architecture.

[Open the visual review](../tools/traversal/qa/final-convergence/review.html). Evidence lives in `tools/traversal/qa/final-convergence/`.

1. **Performance baseline.** Profiled before visual/code changes in real Playwright Chromium at 1463×823. Seven three-second RAF windows used the real controller notification/render path without modal stops. Baseline was 59.0–60.0 FPS, with two world updates per sampled frame and 3.42–4.03 ms mean update work. Two frames exceeded 33.4 ms across the seven windows. This machine did not reproduce a sustained progressive FPS collapse; it did expose avoidable frame-budget cost. Raw traces are retained as losslessly compressed `baseline/trace.json.gz` and `final/trace.json.gz`.

   | Window | Baseline update mean | Final update mean | Final FPS |
   |---|---:|---:|---:|
   | Start | 3.42 ms | 0.63 ms | 60.0 |
   | 25% | 3.69 ms | 0.63 ms | 60.0 |
   | 50% | 4.03 ms | 0.63 ms | 60.0 |
   | 75% | 3.76 ms | 0.70 ms | 60.0 |
   | Post-fork A | 3.93 ms | 0.62 ms | 60.0 |
   | Post-fork B | 3.61 ms | 0.66 ms | 60.0 |
   | End | 3.44 ms | 0.58 ms | 60.0 |

2. **Measured causes.** Controller progress notifications rendered the scene, then the RAF tick updated the world again. Bounded physics catch-up steps could each trigger another render. Animated CSS variables on the scene root invalidated styles throughout the world, while a height read after style writes forced layout. Constant HUD text replacement added unnecessary work. These are measured rendering costs, not proof of a cumulative memory leak. No growing DOM/foreground population was observed.

3. **Performance fixes.** Batch physics notifications into one presentation update per frame/advance. Read viewport dimensions before transform writes. Scope wheel, suspension, dust and exit variables to the caravan, foreground motion to the foreground, and progress to its rail. Replace HUD text only when it changes; avoid redundant section visibility writes. Clear stale preload references when branch scenery is remounted. Existing physical-passage culling remains intact. Across traced windows, style-update duration fell **76.1%**, layout **31.7%**, paint **19.3%**, and layerization **3.9%**. CPU layerization is measured; GPU compositor time is not independently established. Six repeated open/dispose cycles verified one RAF and one key listener while open, zero of each after disposal. These Traversal classes use no timer loop.

4. **Final caravan design.** A closed medieval-fantasy expedition wagon derived from the supplied reference: timber walls and front compartment, small dark glazing, iron braces, curved canvas roof, brass fittings, lanterns, roof baggage and provisions. No horse, driver, passengers, heraldry or banner. Two near and two partially receding far wheels remain visibly distinct in the assembled browser view.

5. **Previous versus final reasoning.** The previous open-front construction exposed an empty driving area. The new enclosed front removes that visual question and ties the vehicle to the roadside canvas/timber palette. Visible height and road anchors retain the accepted scale; the taller enclosed silhouette makes its rendered width about 17% shorter at equal height, rather than enlarging the gameplay footprint. It remains an expedition vehicle, not a screen-filling dwelling. Side-by-side captures: `baseline/start.png` and `final/start.png`.

6. **Vehicle assets/runtime.** New `closed-v1/chassis.png` (1260×654 RGBA) and `closed-v1/wheel.png` (300×300 RGBA), under `public/assets/generated/lion-phase/traversal/t0/vehicle/traversal-caravan/`. Source-pixel bounds and four axle anchors were updated in `TraversalCaravan.ts`. The generated component sheet supplies a separate wheel, so wheel instances no longer sample the previous 1749×899 vehicle atlas. This is a natural component extraction; profiling did not establish the old wheel atlas as the principal regression. Rotation remains driven by actual road distance and viewport-scaled radius; suspension, dust settling and contact shadow remain active. The original selected vehicle and candidates are unchanged. Built-in image generation, exact prompts, original raw sheet, deterministic cleanup/crop script and SHA-256 evidence are retained in `caravan/` and `final-audit.json`.

7. **Depth/occlusion.** Desktop 1463×823 and narrow 960×720 Chromium checks cover both lanes, six lane changes and 11 road positions. Upper-lane caravan bounds do not overlap near plants. Lower-lane local overlap envelopes are about 14.7–17.8% of vehicle height on desktop and 12.1–15.1% on narrow; these measure plant bounds, not a claim that every pixel in that envelope is opaque. Openings remain visible between organic plants. Lower-lane enemy feet can pass behind foreground; torso/markers remain readable. Actor/foreground planes stay fixed through lane changes, avoiding depth pops. `runtime/report.json`, screenshots and both depth videos retain the evidence. The synthetic lower-human shot is QA-only and does not move any authored narrative NPC.

8. **Physical clearance.** Reviewed upper/lower route captures and environment-only joins. Existing clearance derivatives keep merchant/refugee/damaged-caravan solid props on the verge. Camera-side ferns/roots supply visual occlusion without becoming collision props. The opening blocked-road composition remains intentional mandatory gameplay and uses its cleared painting after resolution. No new physical obstacles or solid decorative lane props were introduced. No prop pass-through was observed in the complete journeys.

9. **Narrative lanes and scale.** Merchant, Cedric and refugees remain on the upper roadside. Ordinary random combat remains lower-lane content. Mandatory encounters and route choice span both lanes. The newly mandatory selected-branch human is centered under that rule, with a 0.78 vehicle-height ratio verified in narrow Chromium; optional narrative humans retain the same 0.78 ratio. Existing lead-in/core/lead-out world sections persist independently of actors and markers.

10. **Ignore.** `ignore-flee` and `avoid` journeys assert the same lane immediately after every optional narrative refusal, with assisted movement false. Focused tests verify that the subject remains visible, movement resumes, and bypass is recorded only after physical passage. No automatic lane change was added.

11. **Flee.** Ordinary random combat still offers **Combattre / Fuir**. Flee changes to the escape lane, retains assisted movement until the encounter is passed, then releases control. The complete `ignore-flee` journey exercised this, and focused scene tests preserve the distinction from narrative Ignore.

12. **Post-fork semantics.** Changed only T0's canonical `branchEncounterMode` to `MANDATORY_INTERRUPT` in `LionCampaignTravelRelations.ts`. Existing route resolution derives both-lane engagement and a mandatory decision from that relation. Existing RunSystem authority now rejects a new bypass of the selected consequence and cannot offer Refuge before that node is entered. No Traversal-local story authority or duplicate node IDs were created. Random road combat remains optional. Legacy saves that already recorded an optional branch bypass retain their history and destination availability; no save migration or retroactive replay was introduced.

13. **Branch A.** A direct choice commits under full fade, removes old crossroads/sign geography and activates the open-woods/damaged-caravan route. Travel resumes automatically, then the selected narrative consequence stops either lane at progress 0.91. Chromium exercised the real dialogue handoff and returned to the same route position before continuing to Refuge.

14. **Branch B.** The same fade changes to the ruined-outpost approach. The selected combat consequence is mandatory at 0.91 even if the player is in the other lane. Chromium entered the existing combat surface, completed it through the existing QA victory control, resumed the held route and reached the destination. This is separate from optional random combat at 0.30.

15. **World seams.** Reviewed all nine main joins, branch variants and a continuous environment-only scroll, including contrast-amplified diagnostic captures. No new opaque rectangles, source-edge contamination or abrupt alpha/tint boundary was observed at the checked desktop framing. Original environment/clearance paintings retain their native aspect ratios and are byte-identical to baseline. No extra foliage was added to disguise joins. Deliberate location/forest changes remain visible as authored geography. Evidence: `seams/`.

16. **Pickups.** Chest, gold and ward use direct lane contact, immediate collection and compact feedback. The full meet/fight journey captured all three, asserting no decision panel during collection. Focused journey tests cover collection without a pending beat. Rewards/contact authority was not changed.

17. **Transitions.** Preserved the shared braking/hold/cover/reveal/restart family. Fork choice is its own confirmation, with no Continue step. Branch commit and geometry remount occur at full cover. Full journeys verified six same-position returns in the meet/fight run and two each in ignore/flee and avoidance. Route arrival still accelerates out to the right, lets the world continue, fades, and returns to the current TravelView destination presentation.

18. **Browser evidence.** Three complete real Chromium journeys: `live-final/meet-fight`, `live-final/ignore-flee`, `live-final/avoid`. All returned successfully, exercised the mandatory selected payoff and reported no page or console errors. The meet/fight recording is `live-final/meet-fight/journey.webm`; additional evidence includes desktop/narrow depth recordings, seam-scroll video, fork reveal/decision captures, canonical dialogue/combat captures, direct pickup captures and the production-disabled screenshot. Canonical combat completion uses the existing QA control, so this validates handoff/return rather than combat balance.

19. **Beginning/middle/end performance acceptance.** A separate complete Chromium journey ran without screenshot capture, video recording or concurrent test/build workloads. All six progress bins averaged **16.67 ms**, p95 was **16.7–16.8 ms**, and **zero frames exceeded 33.4 ms**. No progressive degradation appeared. This includes start, middle, post-fork and end. Evidence: `isolated/live-final/ignore-flee/report.json`. The recorded journeys ran alongside other validation and carry higher timings; they are retained but are not used for the performance acceptance claim. Findings apply to this tested desktop Chromium environment, not an unmeasured hardware fleet.

20. **Focused tests.** **65/65 passed**, 15 files, including relation authority, both-lane branch contact, no bypass before destination, legacy save history, same-lane Ignore, assisted Flee, wheel-distance math, depth and complete simulated journeys. A regression test verifies one world render after a multi-step advance while still stopping at the earliest decision. `focused-tests.json`.

21. **Full suite.** **2,469/2,469 passed**, 145 test files, with four workers. The initial high-concurrency run had four timeouts, retained as `full-tests-initial.json`; the corrected batching and bounded-concurrency rerun passed. No known-baseline VFX failures occurred in this checkout, so the current result is a full pass rather than `PASS_WITH_KNOWN_BASELINE`. `full-tests.json`.

22. **TypeScript/build/diff.** Final `npm run build` passed (`tsc --noEmit` plus Vite). The existing large-chunk advisory remains. `git diff --check` passed. The final built-app Chromium gate check also passed. No commit, push, reset or history rewrite was performed.

23. **Production status.** `TRAVERSAL_PRODUCTION_GATE.enabled = false`, `designAssetsReady = false`, and `rolloutLegIds = ['T0']` are unchanged. Built production with `?qa=1&traversal=t0` shows the title screen and mounts zero Traversal scenes. No T1–T4 rollout.

24. **Intentional limits.** Operator visual sign-off is pending. Existing roadside interactions, route pacing, canonical choices/effects and authored environment compositions were preserved. No old campaign bypass history is rewritten. Performance acceptance is specific to measured Chromium/viewport conditions. Near plants intentionally obscure low silhouettes, and far-side wheels are partly hidden by the chassis as depth requires. The final runtime sources are the full-resolution extracted components; the sprite processor's small convenience preview sheet/GIF is not used in-game.

25. **NarrativeStage/TRAVEL_STILL migration.** Remains separate. No NarrativeStage, NarrativePresentationResolver or TRAVEL_STILL migration was made, and the existing semantic return/destination handoff stays intact.

26. **Version control and review handoff.** Current HEAD and tracked upstream remain `96954e7`; all changes are **UNCOMMITTED / UNPUSHED**. `final-audit.json` verifies protected code paths, 13 existing asset SHA-256 hashes, two new runtime assets, the preserved reference/raw generation, tests, journeys and gates. Stop for operator visual review; no production promotion is implied by the engineering pass.
