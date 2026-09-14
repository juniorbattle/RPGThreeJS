# Option C Phase 4B — Forest Road + Kestrel runtime proof

Status: `RUNTIME_PROOF_CANDIDATE`  
Baseline: `d4baeb79fb16e24c5707c482c80245f431ce498e`  
Phase 4A reference: `APPROVED_DEV_PILOT`  
Operator decision: required

This package proves the approved Forest Road family and Kestrel animation set in the real RPGThreeJS runtime. It remains isolated from normal campaign flow and does not promote or replace production assets.

## Inspect the proof

Run `npm run dev`, then open:

`http://127.0.0.1:5173/?devOptionC=forest-road`

The route exists only when `import.meta.env.DEV` is true. Its controls switch the real Travel View, narrative tableau/dialogue surface, tactical combat runtime, Combat Stage, four Kestrel animation states, and tableau staging variants. The proof builds an in-memory `forest_patrol` session and does not write campaign or save state.

## Runtime architecture

- Travel: real `TravelView`; no avatar or exploration controls are introduced.
- Tableau: real `NarrativeSceneSurface` and `DialogueView`; Kestrel remains an independent runtime actor.
- Strategic: real `CombatBridge`, legacy tactical runtime, camera, HUD, units, turn order, actions, and objective surface.
- Combat Stage: real `CombatStage`, attack header, unit lanes, action execution, damage feedback, and existing VFX composition.
- Animation: shared renderer-agnostic `SpriteFrameAnimationController`; the proof updates real DOM/Three.js unit textures without a second animation loop model.
- Assets: all 36 runtime candidates are byte-identical copies of approved Phase 4A files under `public/assets/dev/option-c/phase4b/`.

## Isolation and classifications

| Change family | Classification | Production behavior |
| --- | --- | --- |
| DEV route, controls, proof session, capture tooling, proof CSS | `DEV_HARNESS_ONLY` | None |
| Optional actor-image and Combat Stage background/texture hooks | `RUNTIME_PRESENTATION_SUPPORT` | Defaults preserve existing behavior |
| Required-image preload and DEV failure channel | `ASSET_LOADING_SUPPORT` | Proof-only |
| Frame-state controller and proof texture updates | `ANIMATION_RUNTIME_SUPPORT` | Proof-only activation |
| Live campaign, saves, game truth, combat logic, VFX | `PRODUCTION_BEHAVIOR_CHANGE` | `0` |

The protocol flag defaults to `false`; normal startup does not request DEV assets. No file in `src/combat/vfx/` is changed.

## Review package

- [Runtime validation report](qa/runtime-validation-report.md)
- [Operator review board](qa/operator-review.md)
- [Phase 4A vs Phase 4B](comparison/phase4a-vs-phase4b.md)
- [Runtime asset map](runtime-asset-map.md)
- [Kestrel runtime contract](kestrel-runtime-contract.md)
- [Animation timing](animation-timing.md)
- [Browser QA data](qa/browser-qa-results.json)
- [Authoritative manifest](manifests/runtime-proof-manifest.json)

