# T0 production contract

**APPROVED DECISION / current source**, locked at `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`.

| System | Current contract |
| --- | --- |
| Route Motion | Production; six authored Route segments and two physical lanes. |
| Risk | Production default; authored hazards cause scene-local speed reset/recovery. |
| Reward | Production default; coin pouch crossings add `+5` to `RunSystem.addTemporaryLoot` once per collected ID; no direct secured-gold mutation. |
| Pursuit | Production default; scene-local pressure, ESCAPED or CAUGHT. CAUGHT = `resetRouteSpeed` only (including same-frame Risk protection). No campaign consequence. |
| Checkpoints | Canonical opening ambush, Cédric, refugees, in-scene fork, selected branch consequence; `RunSystem` owns available nodes and branch commit. |
| Arrival | Route 6 physical coast/exit, then Journey destination agency; arrival does not commit the destination node. |
| Journey handoff | Departure and return use the existing `GameApp`/Journey boundary. |

Only **DEV** with the exact `?traversalRisk=0`, `?traversalReward=0`, or `?traversalPursuit=0` disables its corresponding system. Production ignores those disable flags. `TraversalFeaturePolicy` permits only T0.

**ROAD COMBAT = NONE. `TraversalRoadEncounter` = REMOVED. `LOCAL_INTERACTION` = REMOVED.** No Pursuit combat, HP/gold/reputation effect, save mutation, or new route node is implied by CAUGHT. Canonical campaign combat nodes still use the ordinary combat handoff.

Current source: `src/traversal/TraversalT0Scene.ts`, the three presentation policies, `src/traversal/TraversalT0CheckpointRoute.ts`, `src/game/GameApp.ts`, and `src/game/runSystem.ts`. Selected validation: [integrated final report](../reports/traversal-t0-production-loop-final-1.md) and [production QA](../reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json). Any report predating this baseline is historical, never current T0 architecture.
