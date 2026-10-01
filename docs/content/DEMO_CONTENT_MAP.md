# Demo content map

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`. Status describes current implementation and release work, not a new browser acceptance result. **DEMO_REQUIRED** rows are validation or demonstrated gaps, not authorization for new mechanics.

2026-10-01: [locked contracts](../contracts/README.md) supersede the older undecided scope labels for playable T1/T3, T2/T4 retirement, and the eight-video limit. Rows below retain the observed baseline where implementation still drifts.

| Area | Status | Current source fact | Gap or demo check |
| --- | --- | --- | --- |
| Campaign | PRODUCTION | `runSystem` and `LionCampaignStructure` define the Lion route, branch nodes, final judgement, and save flow. | Re-run both representative full routes and resume boundaries in the release build. |
| Traversal T0 | PRODUCTION | Only T0 is gate-enabled, with Route Motion, Risk, Reward, Pursuit, checkpoints, and arrival. | Re-run integrated production QA; preserve no-road-combat contract. |
| Traversal T1/T3 | APPROVED_NOT_IMPLEMENTED | Relations exist; `GameApp` selects T0 only. Journey carries later campaign segments. | Generalize T0 and produce approved T1/T3 scenes without changing campaign authority. |
| Traversal T2/T4 | RETIRED_PLAYABLE_PLAN | Relation IDs remain; neither has a playable scene. | Preserve durable IDs while removing obsolete playable planning/runtime assumptions. |
| Refuges/hubs | PRODUCTION | First and second refuge are `refuge` nodes registered in `RefugePresentation`. | Validate management return, rest, shop, save, and narrow-screen flow in a fresh demo run. |
| Final refuge hub | DEFERRED_UNDECIDED | Final refuge is a `story` node with `final_refuge` dialogue, not an interactive registered hub. | Decide whether conversion is desired and when. |
| Journey | PRODUCTION | `GameApp` defaults to Journey with TravelView recovery; it owns non-T0 presentation boundaries. | Check route agency and scene return at all major transitions. |
| Dialogues | PRODUCTION | `GameApp` resolves dialogue through game-layer content and `NarrativeStage`/`DialogueView`. | Audit current cast, text, choices, and responsive staging across both routes; older dialogue reports do not establish current sign-off. |
| Combat | PRODUCTION | Canonical nodes use `CombatBridge` and the existing combat runtime. | Verify representative regular/branch/finale encounters and return behavior. ROAD COMBAT = NONE. |
| Cinematics | CONTRACT_DRIFT | `CinematicRegistry` loads a manifest containing extra video slots. | Align runtime, registry, doctrine, and assets to the eight approved videos; check fallbacks and transitions in the current build. |
| VFX | PRODUCTION_NEEDS_POLISH | Combat VFX presets/sprite sheets and render layers are in source. | Check visibility, ordering, asset load, and motion/reduced-graphics behavior in current combat scenarios. |
| UI | PRODUCTION_NEEDS_POLISH | Campaign HUD, Journey, refuge, dialogue, combat, and Traversal surfaces are implemented. | Current end-to-end desktop/intermediate/mobile capture and accessibility review remain DEMO_REQUIRED validation. |
| Content gaps | DEFERRED_UNDECIDED | No new encounter, dialogue branch, or art shortage is proven by this documentation audit. | Record concrete missing content from the fresh demo pass; do not turn historical suggestions into required scope. |

The existing [full-route integration report](../reports/demo-1h-r6-full-route-integration.md) and [final T0 report](../reports/traversal-t0-production-loop-final-1.md) are useful prior evidence at their respective baselines. [Current status](../project/CURRENT_STATUS.md) and production source take precedence.
