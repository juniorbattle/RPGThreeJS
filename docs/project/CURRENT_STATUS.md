# Current project status

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`. This is a source audit, not a new full-browser acceptance run. [Authority order](../README.md) applies.

| Area | Status | Current fact and remaining check |
| --- | --- | --- |
| Lion campaign and save | PRODUCTION | `src/game/runSystem.ts`, `src/campaign/LionCampaignStructure.ts`, and `GameApp` own the existing route, effects, and saves. A prior full-route report is historical proof, not a fresh release pass. |
| T0 Traversal | PRODUCTION | Gate includes only `T0`; Route Motion, Risk, Reward, Pursuit, checkpoints, arrival, and Journey handoff are active. See [locked contract](../traversal/T0_PRODUCTION_CONTRACT.md). |
| T1–T4 Traversal | DEFERRED_UNDECIDED | Relations exist, but `GameApp` selects only T0 for Traversal. The campaign continues through Journey for other segments. Future playable conversion and demo scope require decisions. |
| First and second refuge hubs | PRODUCTION | Both are `refuge` nodes and registered in `src/ui/RefugePresentation.ts`. |
| Final refuge | DEFERRED_UNDECIDED | `runSystem` currently types it as `story`; `final_refuge` dialogue is present. An interactive hub conversion is only a proposal. |
| Journey and dialogue | PRODUCTION | Journey is the default campaign presentation in `GameApp`; NarrativeStage and dialogue are called by the current runtime. Per-scene visual acceptance is not certified by this audit. |
| Canonical combat | PRODUCTION | `GameApp` uses `CombatBridge` for campaign combat nodes. There is no local Traversal road combat. |
| Cinematics and VFX | PRODUCTION_NEEDS_POLISH | Registries and presentation systems are present. This audit did not prove every media/VFX beat in a fresh complete demo run; see [content map](../content/DEMO_CONTENT_MAP.md). |
| UI | PRODUCTION_NEEDS_POLISH | Shared status HUD, Journey, refuge, dialogue, combat, and Traversal surfaces exist. A current end-to-end responsive release pass remains a demo gate. |

Current T0 production evidence: [integrated report](../reports/traversal-t0-production-loop-final-1.md) and [QA JSON](../reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json). They were produced before this documentation audit and remain the selected golden evidence.
