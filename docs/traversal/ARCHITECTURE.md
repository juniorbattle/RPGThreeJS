# Traversal architecture

Current `dev` architecture, 2026-10-01. Earlier main-based audits remain historical.

## Current executable path

`GameApp.enterCampaignPresentation` selects a resolved playable relation only when both `TraversalFeaturePolicy` and `TraversalPresentation` allow it. The current T0 departure agency uses Journey and mounts `TraversalT0Scene`. `TraversalRunController` and `TraversalRunRuntime` manage stages and session phases. `TraversalT0Authoring` bundles T0's route, six checkpoint segments, world, occluders, Risk, Reward and Pursuit inputs. Neutral route/checkpoint/world models and renderers consume that authoring; canonical interruptions return to `GameApp`/`RunSystem`. Physical arrival returns to Journey destination agency; the destination node is not silently consumed.

`LionCampaignTravelRelations` declares playable T0/T1/T3 relations and retains T2/T4 as direct narrative handoffs with their historical IDs. `LionCampaignStructure` defines node roles and content boundaries. `RunSystem` decides branch availability, bypass, temporary loot, and durable state. The physical Traversal session, Risk, Reward crossing, and Pursuit pressure are scene-local.

`TraversalFeaturePolicy` permits only T0 and explicitly rejects retired playable IDs T2/T4. `TraversalPresentation` registers only T0, so a future relation cannot mount without both a production gate and a complete authored scene. `TraversalT0Scene` still rejects non-T0 legs and retains T0-specific event interaction and campaign handoffs. Shared models, renderers and controller do not make T1/T3 production-ready.

## Removed architecture

`TraversalRoadEncounter` and `LOCAL_INTERACTION` were removed by the T0 cleanup. There is **no local road combat**. Campaign combat at canonical interrupt nodes remains owned by `CombatBridge` and the existing campaign flow. Do not use an older report's road-combat matrix as a current design.

## Future seam

The current authoring seam is `TraversalRoadAuthoring`: route/checkpoint/world and scene-local obstacle, pickup and pursuit data are grouped without taking campaign or save authority. A later shared scene must remove the remaining T0-only interactions and integrate authored T1/T3 checkpoint art before either leg is registered. The [historical audit](../reports/traversal-remaining-legs-audit-1.md) remains background, not acceptance authority.
