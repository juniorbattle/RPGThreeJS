# Frozen road contact after late reset

| Field | Value |
| --- | --- |
| TASK | TRAVERSAL-ROAD-ELEMENTS |
| DOMAIN | Traversal presentation and QA tooling |
| BASELINE | dev @ 27b40a783f056d631ff29c883f9b6c5fd6c58297 |
| BRANCH | dev |
| HEAD | 62045da221f49e035b509c50be355840eecfd81f (source; publication in automation memory) |
| STATUS | Checkpoint; scoped27native+9lab PASS; expanded acceptance BLOCKED |
| MERGED_IN | NONE |
| SUPERSEDES | NONE; continues traversal-road-lifetime-entry-2.md |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Retain a previously validated camera forecast across a late native reset |
| CANONICAL_DOCS_UPDATED | docs/autonomy/TRAVERSAL_ROAD_ELEMENTS.md and paired state |
| EVIDENCE | [Selected checks and6captures](traversal-road-late-reset-3-browser/checks.json); exact registered receipt/result paths and hashes included |

CURRENT FACT — road elements and the demo remain incomplete. LOCKED set1.1.0 / OD-2026-10-03-A remain authority; immutable d7ca28a gate is empty.

`TraversalRoadCamera` caches only an entered target's validated .5..2 forecast, keyed by namespaced mark ID, exact frozen distance/progress, segment instance and scale. A native reset authorizes retaining that earlier reference until this target expires. Ordinary compensation remains in use while its forecast is valid; if the new ratio fails the unchanged guard, the earlier validated reference supplies bounded camera integration. The camera never assigns world distance or moves the anchor. Crossing frames split at contact and use the actual-state baseline afterward. Positive finite speed stays within2*vMax*scale; null/changed target, rewind, route change and disposal clear the plan. Future reset timestamps cannot activate it. RouteRun, Risk/Reward/Pursuit resolution, temporary-loot callbacks and save owners are unchanged.

The original10082.9ms reset immediately exceeded the guard before the .68/10200ms rock. Fresh native diagnostics exposed another case: preceding Risk reset7966.4ms, Pursuit reset10049.6ms, new ratio1.999624 then2.000180 near contact. A valid intermediate frame used to overwrite the prior reference. The corrected cache preserves both that reference and its eligibility across these frames. Sixteen new tests include both timelines, variable/overshoot frames, repeated resets, changed/malformed identities, future timestamps and expiry. All186 Traversal tests/30files,46focused, TypeScript,8contracts/8slots and production build game-C6Qm6kEn.js / game-DrzQVqcv.css pass.

The isolated lab uses the existing T0 .68 rock, starts scene-local state at9966.1ms and scripts a10082.9ms reset. Nine native RAF/Start cases pass across1440/620/390 and normal/OS/game reduction: frozen anchor, bounded monotone distance, unaligned contact<3px/<40ms, pure Risk once, retained mark and full exit. Thirty-three minified bundle inputs contain no GameApp/runSystem/store/combat owner input; source review corroborates that no such owner is instantiated. Empty storage proves no writes here, not V6 compatibility. Initial stationary RAF records are excluded only while elapsed remains exactly9966.1; moving-frame bounds remain intact.

This lab does not prove real Pursuit, natural entry, production impact/disposal, spacing/depth, lane input, reward or earned campaign continuity. Lane is fixture-seeded; the game reduction CSS is a lab setting. Production origins and previous combats in the separate real GameApp driver are fixtures. Six preserved unaccepted keyboard files are included in the build but excluded from these dev source commits.

## Evidence disposition

Three initial diagnostics remain FAILED/NOT_ACCEPTED: native normal frame49.9ms rejected by the unchanged40ms guard; isolated lab zero-delta Start frame; a second native diagnostic was stopped by closing only its identified browser child before changing source. Its worker finalized FAILED and cleaned up. No failed proof is used as an earned seed. Corrected registered native branch-combat jobs and final scoped acceptance are recorded in the closeout proof and paired state.


135 sampled native mark contacts have maximum interpolated error0.23735px and maximum bracket33.4ms. Checkpoint rerun36camera/anchor/scene tests3files and TypeScript/validator pass.

27 fresh fixture-origin native built branch-combat cases pass:9OS,9game and three normal leg batches totaling9 across1440/620/390. Root checked exact terminal result digests,403frozen physical identities, original97ledger/deferred task and six source blobs. The contracts reviewer independently verified source/assertion boundaries and completed OS/game/lab/T3 provenance; the Traversal reviewer accepted OS/game scope and selected native captures. Six selected PNGs and compact measurements are promoted once without changing historical evidence.

| Registered job | Execution | Cases recorded | Selected disposition |
| --- | --- | --- | --- |
| road-0007-branch-normal | FAILED | 1 | NOT_ACCEPTED |
| road-0007-late-lab | FAILED | 4 | NOT_ACCEPTED |
| road-0007-branch-v2-normal | FAILED | 2 | NOT_ACCEPTED |
| road-0007-late-lab-v2 | SUCCEEDED | 9 | ACCEPTED_SCOPED |
| road-0007-branch-v3-normal | FAILED | 7 | NOT_ACCEPTED |
| road-0007-branch-v3-os | SUCCEEDED | 9 | ACCEPTED_SCOPED |
| road-0007-branch-v3-game | SUCCEEDED | 9 | ACCEPTED_SCOPED |
| road-0007-branch-v4-normal-T3 | SUCCEEDED | 3 | ACCEPTED_SCOPED |
| road-0007-branch-v4-normal-T0 | SUCCEEDED | 3 | ACCEPTED_SCOPED |
| road-0007-branch-v4-normal-T1 | SUCCEEDED | 3 | ACCEPTED_SCOPED |

[Checks](traversal-road-late-reset-3-browser/checks.json) includes exact receipt/result paths+SHA256, build/driver/source/assets and contact measurements. Four failed/stopped diagnostics remain NOT_ACCEPTED, including v3normal despite its six completed cases. No failed output is a seed. Native contact checks use endpoint-linear interpolation between sampled frames; crossing frames can contain two speed profiles. This measured proxy within3px and selected brackets below40ms proves neither exact geometric instants nor a global frame budget/perceptual continuity.

Next: fresh current first/early-road and remaining second/branch-event/arrival matrices, then native background/fallback/production disposal and earned temporary-gold defeat/refuge/V6. No full demo acceptance.

## Orchestrator compliance matrix

| Row | Verdict | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Presentation camera only; immutable gate empty |
| ART_DIRECTION | PASS boundary | Existing media unchanged |
| CHARACTERS | N/A | No character change |
| ENVIRONMENTS | PASS boundary | Existing ground/asset families; no environment change |
| NARRATIVE / CAMPAIGN | PASS | Authored clocks/descriptors/callbacks unchanged |
| NARRATIVE_PRESENTATION | N/A | No tableau/Journey/video change |
| TRAVERSAL | PASS implementation/scoped; BLOCKED expanded acceptance | Scoped late-reset regression, complete road matrix remains required |
| COMBAT | PASS boundary | No tactical resolution change; prior outcomes explicitly fixtures |
| SAVE | PASS boundary | No schema/write change; earned V6 proof remains open |
| UI / ACCESSIBILITY | BLOCKED expanded acceptance | Scoped production normal/OS/game branch proof; full-road/fallback/background proof remains required |
| QA_EVIDENCE | BLOCKED full acceptance; PASS honesty | Exact source/build/driver identities, rejected receipts and scoped claims |
| REPOSITORY_GOVERNANCE | PASS checkpoint boundary | Single writer;97prior jobs, deferred task and six blobs retained |

Contracts read: constitution, all eight current contracts, index/manifest and T0 production baseline. Relevant rules: TRAVERSAL road lifetime/depth, CAMPAIGN_AND_STATE temporary loot/V6, UI_AND_ACCESSIBILITY, AUTHORING_AND_QA and AUTONOMOUS_WORK_PROTOCOL. Set1.1.0; no LOCKED rule changed. Ten canonical Pursuit collision mappings remain BLOCKED. No main/media/audio/canon work. Two distinct read-only reviewers handle identified authority/assertion and motion/capture questions; no quota saving is claimed.
