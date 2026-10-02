# Current project status

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`. This is a source audit, not a new full-browser acceptance run. [Authority order](../README.md) applies.

2026-10-01 production update: [locked production contracts](../contracts/README.md) approve playable T1/T3, retire playable T2/T4 plans, and limit production video to eight slots. The table below combines the cited older baseline with completed `dev` alignment; full demo acceptance remains later work.

2026-10-02 CURRENT FACT on `dev`: T1 and T3 are production-active, with their accepted integration evidence linked below. [Cinematic structural readiness](../autonomy/CINEMATIC_STRUCTURE_READINESS.md) passes existing-media/agency/reduced-motion/resume checks. Artistic video remaster remains an incomplete external manual workstream; independent demo QA is active and audio remains DEFERRED.

| Area | Status | Current fact and remaining check |
| --- | --- | --- |
| Lion campaign and save | PRODUCTION | `src/game/runSystem.ts`, `src/campaign/LionCampaignStructure.ts`, and `GameApp` own the existing route, effects, and saves. A prior full-route report is historical proof, not a fresh release pass. |
| T0 Traversal | PRODUCTION | The shared gate and authored scene registry include T0/T1/T3; T0 retains its accepted route/checkpoint/arrival/Journey grammar. See [locked contract](../traversal/T0_PRODUCTION_CONTRACT.md). |
| T1/T3 Traversal | PRODUCTION | Both authored scenes are registered and intentionally enabled. [T1 production](../autonomy/TRAVERSAL_T1_PRODUCTION.md), [T3 production](../autonomy/TRAVERSAL_T3_PRODUCTION.md) retain real GameApp/V6/loot/branch/handoff evidence. |
| T2/T4 playable Traversal | RETIRED | Historical IDs remain as direct narrative handoffs for campaign/save compatibility; neither is a playable leg and T3 keeps its ID. |
| First and second refuge hubs | PRODUCTION | Both are `refuge` nodes and registered in `src/ui/RefugePresentation.ts`. |
| Final refuge | DEFERRED_UNDECIDED | `runSystem` currently types it as `story`; `final_refuge` dialogue is present. An interactive hub conversion is only a proposal. |
| Journey and dialogue | PRODUCTION | Journey is the default campaign presentation in `GameApp`; NarrativeStage and dialogue are called by the current runtime. Per-scene visual acceptance is not certified by this audit. |
| Canonical combat | PRODUCTION | `GameApp` uses `CombatBridge` for campaign combat nodes. There is no local Traversal road combat. |
| Cinematics | STRUCTURE_READY | Exactly eight approved MP4s; existing-media triggers, tableau ownership, agency, OS/game reduced motion, unavailable-media fallback and resolved V6 resume pass [current structural QA](../autonomy/CINEMATIC_STRUCTURE_READINESS.md). Artistic remaster remains incomplete EXTERNAL_MANUAL_WORKSTREAM. |
| VFX | CATALOG_PARTIAL | Presentation-only runtime remains implemented; final authored effect coverage and full-demo acceptance remain item 9. |
| UI | PRODUCTION_NEEDS_POLISH | [Refuge focus](../reports/refuge-keyboard-focus-1.md) and [management keyboard/services](../reports/management-keyboard-services-1.md) pass scoped native details, contextual labels, preview return, owner operations and V6 resume at three widths. [Refuge durability and earned first-refuge proof](../reports/refuge-autosave-durability-1.md) now pass immediate entry/rest V6 reload and potion keyboard use; a fresh chronicle wins the actual opening battle and resumes the first refuge. Both endings/full combat/VFX acceptance remain item 9. |

Current T0 production evidence: [integrated report](../reports/traversal-t0-production-loop-final-1.md) and [QA JSON](../reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json). They were produced before this documentation audit and remain the selected golden evidence.
