# Traversal architecture

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`.

## Current executable path

`GameApp.enterCampaignPresentation` selects a resolved T0 origin and checks `TraversalFeaturePolicy`. `GameApp.enterTraversalT0` presents departure agency through Journey and mounts `TraversalT0Scene`. `TraversalRunController` and `TraversalRunRuntime` manage stages and session phases. `TraversalT0CheckpointRoute` authors six Route segments; `TraversalT0Route` maps canonical beats; `TraversalT0World` and renderers present the scene. Canonical interruptions return to `GameApp`/`RunSystem`. Physical arrival returns to Journey destination agency; the destination node is not silently consumed.

`LionCampaignTravelRelations` declares playable T0/T1/T3 relations and retains T2/T4 as direct narrative handoffs with their historical IDs. `LionCampaignStructure` defines node roles and content boundaries. `RunSystem` decides branch availability, bypass, temporary loot, and durable state. The physical Traversal session, Risk, Reward crossing, and Pursuit pressure are scene-local.

`TraversalFeaturePolicy` permits only T0 and explicitly rejects retired playable IDs T2/T4. The `GameApp` candidate scan also requires `candidate.id === 'T0'`. `TraversalT0Scene`, its world/route/asset authoring, and Route 1–6 are T0-specific. Shared runtime/controller and fork primitives do not make T1/T3 production-ready.

## Removed architecture

`TraversalRoadEncounter` and `LOCAL_INTERACTION` were removed by the T0 cleanup. There is **no local road combat**. Campaign combat at canonical interrupt nodes remains owned by `CombatBridge` and the existing campaign flow. Do not use an older report's road-combat matrix as a current design.

## Future seam

A generic scene with per-leg presentation configuration was proposed in the [historical audit](../reports/traversal-remaining-legs-audit-1.md). The current autonomous queue authorizes generalizing T0 for T1/T3, but does not prescribe that older design. Recheck current T0 source and preserve campaign/save authority before choosing the shared seam.
