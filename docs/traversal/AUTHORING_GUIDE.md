# Traversal authoring guide

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`.

## Current T0 ownership

- `src/campaign/LionCampaignTravelRelations.ts`: canonical leg boundaries, stages, fork shape. `src/campaign/LionCampaignStructure.ts` and `src/game/runSystem.ts`: node and state authority.
- `src/traversal/TraversalT0CheckpointRoute.ts`: Route 1–6 clocks, speed bounds, and checkpoint IDs. `TraversalT0Route.ts`: beat positions and T0 presentation. `TraversalT0World.ts`: authored world sections and branch variants.
- `TraversalT0Risk.ts`, `TraversalT0Reward.ts`, and `TraversalT0Pursuit.ts`: scene-local authored obstacles, pouches, and pursuit windows. Their pure resolvers live in the corresponding `TraversalRoute*` modules.
- `public/assets/generated/lion-phase/traversal/t0/asset-manifest.json` and `TraversalT0Assets.test.ts`: current asset paths/integrity. The `world-v1` root remains canonical.
- `GameApp` mounts and returns the scene. `RunSystem.addTemporaryLoot` is the reward authority.

For an approved T0 edit, update the narrow owner, its meaningful regression test, the [production contract](T0_PRODUCTION_CONTRACT.md), and the [QA evidence](QA_GUIDE.md). Do not move canonical node effects into scene callbacks. An art replacement needs manifest/hash and runtime-reference review before removing any old asset. Do not infer a dependency is dead solely because its path is assembled dynamically.

## Future legs

The [leg audit](LEGS_ROADMAP.md) is a planning checklist. No T1–T4 Route, world, hazard, reward, pursuit, or timing content is approved here. First decide demo scope, presentation type, world art, stage pacing, fork handling, arrival, and QA acceptance. Preserve campaign IDs and topology unless separately approved. A generic scene extraction is a proposal, not a prerequisite already satisfied.
