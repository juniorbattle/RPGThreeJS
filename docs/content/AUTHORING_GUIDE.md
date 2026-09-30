# Content authoring guide

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`.

Start with `src/game/runSystem.ts` and `src/campaign/LionCampaignStructure.ts` for node/content ownership. Dialogue IDs and context resolution live in `src/game` content modules and are played by `GameApp` through `DialogueView`/`NarrativeStage`. Canonical combat IDs/configurations use `CombatBridge`; VFX presets and sprites live under `src/combat/vfx`. Cinematic triggers and manifests live under `src/cinematics` and `public/assets/cinematics`. Refuge surface registration is `src/ui/RefugePresentation.ts`. Traversal's T0 scene and assets have their own [authoring guide](../traversal/AUTHORING_GUIDE.md).

For an approved addition, establish the node/content ID and reachability first, then the presentation asset and registry entry, then runtime proof on each affected branch and viewport. Preserve campaign facts, save compatibility, and existing IDs unless a separate migration is approved. A visual placeholder or an old report is not evidence that content is production ready. Update the [demo map](DEMO_CONTENT_MAP.md) only after source and current validation agree.
