# Traversal authoring guide

Current `dev` authoring guide, 2026-10-01. Earlier main-based audits remain historical.

## Current T0 ownership

- `src/campaign/LionCampaignTravelRelations.ts`: canonical leg boundaries, stages, fork shape. `src/campaign/LionCampaignStructure.ts` and `src/game/runSystem.ts`: node and state authority.
- `src/traversal/TraversalT0CheckpointRoute.ts`: Route 1–6 clocks, speed bounds, and checkpoint IDs. `TraversalT0Route.ts`: beat positions and T0 presentation. `TraversalT0World.ts`: authored world sections and branch variants.
- `TraversalT0Risk.ts`, `TraversalT0Reward.ts`, and `TraversalT0Pursuit.ts`: scene-local authored obstacles, pouches, and pursuit windows. Their pure resolvers live in the corresponding `TraversalRoute*` modules.
- `public/assets/generated/lion-phase/traversal/t0/asset-manifest.json` and `TraversalT0Assets.test.ts`: current asset paths/integrity. The `world-v1` root remains canonical.
- `GameApp` mounts and returns the scene. `RunSystem.addTemporaryLoot` is the reward authority.
- `TraversalPresentation.ts` is the campaign-facing scene registry. It registers T0/T1. Campaign relation membership and the production rollout gate do not supply a scene or world for another leg.
- `TraversalRoadAuthoring.ts` defines the per-leg presentation input. `TraversalT0Authoring.ts` and `TraversalT1Authoring.ts` package their authored inputs. Neutral `TraversalRouteModel`, `TraversalCheckpointRoute`, and `TraversalWorldModel` contain reusable types and checks; T0 source files retain their authored values and compatibility exports. The route authoring audit rejects stage/checkpoint, branch, and painted-location drift before a scene opens.
- `TraversalRoadScene.ts` consumes the package for Route/Checkpoint lifecycle, transitions, node return, mechanics and arrival. `TraversalT0Scene.ts` supplies only its T0 guard, RunSystem branch selection and refugee decision labels. The public T0 options type remains compatible; the scene registry uses neutral road options.

For an approved T0 edit, update the narrow owner, its meaningful regression test, the [production contract](T0_PRODUCTION_CONTRACT.md), and the [QA evidence](QA_GUIDE.md). Do not move canonical node effects into scene callbacks. An art replacement needs manifest/hash and runtime-reference review before removing any old asset. Do not infer a dependency is dead solely because its path is assembled dynamically.

## Future legs

T1 is accepted in production. T3's source candidate uses `createT3RoadAuthoring(getState)` with explicit event contacts and a world reader following the already resolved adaptive node. The declared shrine presentation entity uses its existing asset and measured sprite bounds. See [T3's active handoff and acceptance checklist](../autonomy/TRAVERSAL_T3_PRODUCTION.md); keep its registration and rollout closed until that checklist passes.

The [leg audit](LEGS_ROADMAP.md) is an older planning checklist. The [locked Traversal contract](../contracts/TRAVERSAL.md) now approves playable T1/T3 with T0 grammar and retires playable T2/T4 plans. Route timing, world art, checkpoint staging, and QA acceptance still require authored implementation. Preserve campaign IDs and topology unless separately approved.

For each future leg, author its route/checkpoint data, world/props with registered sprite bounds, occluders, Risk/Reward/Pursuit presentation, and arrival context. Wrap `TraversalRoadScene` in a narrow adapter calling `RunSystem.selectTraversalBranch`; provide optional decision copy only for a canonically optional interruption. Keep node/ignore/reward callbacks with GameApp. Validate every checkpoint against the existing campaign relation. `RunSystem` now accepts branch choices for all declared playable relations, while retired/unknown IDs and unavailable choices fail without mutation; mandatory T1/T3 encounters still cannot be bypassed. Only after authored art, transitions, focused tests and browser QA should the scene be registered and `TraversalFeaturePolicy.ts` add the leg to rollout. Reward acceptance checks both boundaries and credits temporary loot. T1's code/art and real GameApp/save QA are documented in `docs/autonomy/TRAVERSAL_T1_PRODUCTION.md`; T3 remains outside registry and rollout.
