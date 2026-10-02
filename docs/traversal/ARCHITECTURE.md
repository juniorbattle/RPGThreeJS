# Traversal architecture

Current `dev` architecture, 2026-10-01. Earlier main-based audits remain historical.

## Current executable path

`GameApp.enterCampaignPresentation` selects a resolved playable relation only when both `TraversalFeaturePolicy` and `TraversalPresentation` allow it. The current T0 departure agency uses Journey and mounts the thin `TraversalT0Scene` adapter over `TraversalRoadScene`. `TraversalRunController` and `TraversalRunRuntime` manage stages and session phases. `TraversalT0Authoring` bundles T0's route, six checkpoint segments, world, occluders, Risk, Reward and Pursuit inputs. The shared scene and neutral models/renderers consume that authoring; canonical interruptions return to `GameApp`/`RunSystem`. Physical arrival returns to Journey destination agency; the destination node is not silently consumed.

`LionCampaignTravelRelations` declares playable T0/T1/T3 relations and retains T2/T4 as direct narrative handoffs with their historical IDs. `LionCampaignStructure` defines node roles and content boundaries. `RunSystem` decides branch availability, bypass, temporary loot, and durable state. The physical Traversal session, Risk, Reward crossing, and Pursuit pressure are scene-local.

`TraversalFeaturePolicy` permits the intentionally reviewed T0/T1/T3 rollout and explicitly rejects retired playable IDs T2/T4. `TraversalPresentation` registers all three authored scenes; a leg still requires both the production gate and an authored scene. `TraversalT0Scene` rejects non-T0 legs and supplies the refugee decision copy and RunSystem branch callback. `TraversalT1Scene` supplies the T1 guard and canonical strict fork, with five roads and its Valmir/shrine checkpoint paintings. The shared scene rejects mismatched leg authoring and derives route count, checkpoint geography, and return/arrival indices from its inputs. `RunSystem` can select existing T1/T3 branches using the same availability and save authority; relation membership alone never enables a leg. Reward acceptance requires an enabled, registered scene in RUNNING and still credits only temporary loot.

## Removed architecture

`TraversalRoadEncounter` and `LOCAL_INTERACTION` were removed by the T0 cleanup. There is **no local road combat**. Campaign combat at canonical interrupt nodes remains owned by `CombatBridge` and the existing campaign flow. Do not use an older report's road-combat matrix as a current design.

## Future seam

The authoring seam is `TraversalRoadAuthoring`: route/checkpoint/world and scene-local obstacle, pickup and pursuit data are grouped without taking campaign or save authority. `TraversalRoadSceneAdapter` supplies per-leg branch authorization and optional decision presentation; it cannot bypass GameApp/RunSystem consequences. The established `traversal-t0` CSS class and interruption modifier remain compatibility selectors for the shared road grammar. T1 has completed production acceptance. The [T3 candidate](../autonomy/TRAVERSAL_T3_PRODUCTION.md) has five authored roads, explicit canonical actors and three checkpoint paintings. Its scene-local world closure reads RunSystem's resolved adaptive content after fork selection; it creates no durable world variant. T3 was registered after ten-scenario real GameApp/V6 candidate acceptance; its ten-scenario built-production proof and T0/T1 regressions passed; see its final acceptance report. The [historical audit](../reports/traversal-remaining-legs-audit-1.md) remains background, not acceptance authority.
