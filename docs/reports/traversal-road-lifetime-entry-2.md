# Road entry correction and late-reset contact checkpoint

| Field | Value |
| --- | --- |
| TASK | TRAVERSAL-ROAD-ELEMENTS |
| DOMAIN | Traversal presentation and QA tooling |
| BASELINE | dev @ 0aedbf2e33c1c702ff041d120e535aef7698576e |
| BRANCH | dev |
| HEAD | 354b83d3a738540c8ddca6fced73f7602675ceda (source); final publication SHA in automation memory |
| STATUS | CHECKPOINT; production acceptance OPEN |
| MERGED_IN | NONE |
| SUPERSEDES | NONE; continues traversal-road-anchor-depth-1.md without rewriting historical receipts |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Unseen road marks reforecast beyond their complete entry bound after a slowdown |
| CANONICAL_DOCS_UPDATED | docs/autonomy/TRAVERSAL_ROAD_ELEMENTS.md and paired state |
| EVIDENCE | traversal-road-lifetime-entry-2-browser/checks.json and six explicitly selected PNGs |

CURRENT FACT — the task and demo remain incomplete. LOCKED set1.1.0 / OD-2026-10-03-A remain authority. No contract or constitution was edited.

The preceding run's hidden post-exit failure was CSS serialization: a rounded left coordinate slightly exceeded the world-coordinate tolerance. The driver now reconstructs logical anchor position from the full-precision predicted bounds. The .02 world tolerance is unchanged, with independent .011px CSS-center and .1px rendered-center assertions. Historical failed receipts remain failed.

Expanded native production QA exposed a runtime defect: Pursuit slowdown discarded an unseen anchor, and its shorter forecast placed a rock in the middle of the road. `TraversalRoadAnchors.reforecastUnseen` now marks the anchor for reforecast; its next update clamps distance beyond the full right edge plus8px. Already-entered anchors stay frozen. Initial construction, authored contact times, lanes, IDs, Risk/Reward resolution, temporary loot, campaign and V6 remain unchanged. Three viewport regressions cover shortened reforecast, natural entry and subsequent freeze.

The bounded companion drivers cover existing remaining branches, a minified isolated native anchor lab, screen-clear entry captures and a deterministic authoring audit. Screen-clear requires both local cover and outer `.scene-transition` opacity to be clear, body unlocked and root settled before/after capture. First-pouch entry occurred under outer cover: the accepted claim is uncovered early-road reveal and subsequent natural edge entries. It is not uncovered first-pouch edge entry. The old black capture is excluded.

## Accepted scopes and retained failures

All26 new registered jobs are terminal; paired state retains their exact receipts, parameters and provenance, plus the original71 ledger objects unchanged. Six jobs receive scoped acceptance:

| Job | Scope |
| --- | --- |
| road-1945-v5-os / game | 27cases each: T0/T1/T3 x1440/620/390, first/early roads, native contact interpolation, retention/full exit, responsive keyboard and ground depth |
| road-1945-entry-v2-normal / os / game | Three representative screen-clear early-road reveals: T0/1440 normal, T1/390 OS-only, T3/620 game reduction |
| road-1945-visible-lab-v5 | Nine minified native-clock cases with existing authored .31/.50 pair at unit distance scale; already-visible future reset, pause/resize, unaligned6000ms crossing, pure reward-once, retention/full exit |

The lab has no GameApp, RunSystem, combat or save. It uses unit distance scale, not the production entry scale; disposal stops its RAF/hides its lab only. It does not prove earned gold, production entry, scene disposal or campaign continuity. Production origin/bootstrap and preceding combats are fixtures. The physical source inventory includes six preserved, unaccepted keyboard WIP files; those files are absent from this dev source checkpoint. No failed output seeds certified continuation.

The v4e81cases and earlier lab successes use the older runtime/build and are historical diagnostics after the runtime correction. Current v5-normal fails a native50ms frame gap against the unchanged40ms guard. It is NOT_ACCEPTED; rerun at lower QA concurrency only if frozen inputs match. All more-v2 jobs fail native physical contact on a later combat-branch rock. Their passed cases/captures are diagnostics, not whole-job acceptance.

## Exact residual and next action

T0 `route-5b` block3, authored progress .68 /10200ms: normal native Pursuit reset10082.9ms leaves117.1ms. Presented speed3.506 becomes base1.77; `anchoredRoadSpeed` ratio>2 guard returns base. Interpolated center is417.512px versus authored360px at1440. At620 game reduction it is158.711px versus155px. The first two contacts match; the third does not. Expanded QA exposed the existing bounded-compensation limitation; this checkpoint does not claim it is fixed.

Next run: read-only preflight/receipt inspection; design bounded presentation compensation for an already-visible anchor after a late reset, with the reused guardian reviewing the exact design/diff. Preserve authored clocks, owners, lanes and safe speed bounds. Do not remove or relax the safety/QA guard to manufacture PASS. Add an unaligned late-reset regression, then fresh isolated/native branch-combat normal/OS/game1440/620/390. Reuse unchanged scoped proof. Complete remaining routes/arrival, native background freeze, fallback, production disposal and earned temporary-gold defeat/refuge/V6 later.

Native visibility probes remained `document.hidden=false` across headless, offscreen-headed, background/minimize and focus-emulation settings. No background freeze acceptance is claimed. The structural audit covers19 existing road/branch configurations,12 hashed inputs, minimum event gap1560ms and baseline edge-to-contact1010.8ms against existing380ms lane interpolation. These are deterministic model margins, not human reaction/readability or balance acceptance.

## Verification and review

170 Traversal tests/29files,35focused tests, TypeScript, production build `game-CrgI3jPX.js` / `game-DrzQVqcv.css`,8contracts/8slots/eight MP4s, immutable/protected and whitespace gates PASS. Frozen386 physical sources, six tool inputs and eight build assets are retained and verified in checks; receipts separately retain `dist/index.html`. No source/driver/build changed after these proofs. Failed results/digests and selected diagnostic captions remain explicit.

Two read-only reviewers were reused for identified questions: guardian authority/assertion boundaries and traversal motion/depth/entry captures. Earlier traversal review found the black entry image; screen-clear companion closes that capture limitation only. Final guardian checkpoint review is recorded in the handoff. Review cost is two distinct reviewers; quota savings were not measured.

Run acquired absent lock19:46Z; production browser QA ended around20:36Z; final verification resumed after23:43Z. Approval/interruption resume23:43Z revalidated owned lock, bytes, terminal jobs and closed QA ports. The wall gap is not continuous coding. With budget expired, remaining work is checkpoint only. Main, contracts, videos/audio/canon and the exact deferred keyboard continuation remain protected. Ten Pursuit canonical collision mapping gaps remain BLOCKED.

## Orchestrator compliance matrix

| Row | Verdict | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Presentation only; immutable gate empty |
| ART_DIRECTION | PASS | Existing rock/pouch assets unchanged |
| CHARACTERS | N/A | No character edits |
| ENVIRONMENTS | PASS boundary | Existing ground/asset families; broader visual acceptance not claimed |
| NARRATIVE / CAMPAIGN | PASS | Authored descriptors, outcomes, rewards and canon unchanged |
| NARRATIVE_PRESENTATION | N/A | No tableau/Journey/video changes |
| TRAVERSAL | BLOCKED acceptance | Unseen entry fixed/scoped proofs; late-reset contact remains open |
| COMBAT | PASS boundary | No tactical resolution changes; prior outcomes explicitly fixtures |
| SAVE | PASS boundary | IDs/schema/owners unchanged; earned V6 proof open |
| UI / ACCESSIBILITY | BLOCKED expanded acceptance | Scoped responsive/reduction proof; complete matrix/background/fallback open |
| QA_EVIDENCE | BLOCKED full acceptance; PASS honesty | Failed jobs retained; exact scopes/digests/physical identity and selected captures |
| REPOSITORY_GOVERNANCE | PASS checkpoint boundary | Owned single-writer lock, explicit staged paths, six WIP blobs/original71ledger retained; guarded dev publication |

Contracts read: all eight, constitution, index/manifest and T0 production authority. Relevant LOCKED rules: TRAVERSAL road lifetime/depth, UI/accessibility, AUTHORING_AND_QA provenance, CAMPAIGN_AND_STATE temporary loot/V6, AUTONOMOUS_WORK_PROTOCOL. Set1.1.0; no LOCKED rule changed. BLOCKED acceptance forbids task completion.
