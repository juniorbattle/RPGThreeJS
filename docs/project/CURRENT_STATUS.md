# Current project status

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`. This is a source audit, not a new full-browser acceptance run. [Authority order](../README.md) applies.

2026-10-01 production update: [locked production contracts](../contracts/README.md) approve playable T1/T3, retire playable T2/T4 plans, and limit production video to eight slots. The table below combines the cited older baseline with completed `dev` alignment; full demo acceptance remains later work.

| Area | Status | Current fact and remaining check |
| --- | --- | --- |
| Lion campaign and save | PRODUCTION | `src/game/runSystem.ts`, `src/campaign/LionCampaignStructure.ts`, and `GameApp` own the existing route, effects, and saves. A prior full-route report is historical proof, not a fresh release pass. |
| T0 Traversal | PRODUCTION | Gate includes only `T0`; Route Motion, Risk, Reward, Pursuit, checkpoints, arrival, and Journey handoff are active. See [locked contract](../traversal/T0_PRODUCTION_CONTRACT.md). |
| T1/T3 Traversal | APPROVED_NOT_IMPLEMENTED | Relations exist, but `GameApp` selects only T0 for Traversal. T1/T3 are approved future playable legs; Journey currently carries them. |
| T2/T4 playable Traversal | RETIRED | Historical IDs remain as direct narrative handoffs for campaign/save compatibility; neither is a playable leg and T3 keeps its ID. |
| First and second refuge hubs | PRODUCTION | Both are `refuge` nodes and registered in `src/ui/RefugePresentation.ts`. |
| Final refuge | DEFERRED_UNDECIDED | `runSystem` currently types it as `story`; `final_refuge` dialogue is present. An interactive hub conversion is only a proposal. |
| Journey and dialogue | PRODUCTION | Journey is the default campaign presentation in `GameApp`; NarrativeStage and dialogue are called by the current runtime. Per-scene visual acceptance is not certified by this audit. |
| Canonical combat | PRODUCTION | `GameApp` uses `CombatBridge` for campaign combat nodes. There is no local Traversal road combat. |
| Cinematics and VFX | EIGHT_VIDEO_ALIGNMENT_COMPLETE | The production manifest/build contains exactly eight approved MP4s; retired masters are archived byte-identically. [Final browser proof](../autonomy/CINEMATIC_CONVERSION_MATRIX.md) passed. Artistic remaster of those eight and the partial VFX catalog remain separate work. |
| UI | PRODUCTION_NEEDS_POLISH | Shared status HUD, Journey, refuge, dialogue, combat, and Traversal surfaces exist. A current end-to-end responsive release pass remains a demo gate. |

Current T0 production evidence: [integrated report](../reports/traversal-t0-production-loop-final-1.md) and [QA JSON](../reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json). They were produced before this documentation audit and remain the selected golden evidence.
