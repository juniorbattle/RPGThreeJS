# Current project status

**APPROVED DECISION — 2026-10-14 update.** The POI map permanently replaces playable Traversal under [OD-2026-10-13-D](../autonomy/POI_NAVIGATION_OPERATOR_DECISION_2026-10-13.md). LOCKED set **1.2.0**, immutable baseline `692829f32d735ad890182eea6b5e5e195551bbbf`, preserves canonical content, truth owners, V6, eight videos and Character V2. The dedicated amendment was published before integration. Recording scoped implementation acceptance does not amend or move that baseline.

**CURRENT FACT.** The production geographical map is integrated on `dev`. [First-slice proof](../reports/poi-map-first-slice-2026-10-13.md) and [second-refuge integration proof](../reports/poi-map-integration-2026-10-14.md) cover an authentic earned Audience→Second refuge rescue route, native combats and exact save/reload on desktop1366×768 normal motion. Executable checkpoint `733737d2bc93c8556950df895f1f2aad9fba0b46`, source tree `4d7244c191ad9a58d53d9e74c24830cde40c3631`; documentation publication follows Git. The operator requested closure of this POI pass; full demo acceptance remains open.

| Area | Current status | Implemented behavior and remaining scope |
| --- | --- | --- |
| POI navigation | PRODUCTION / SCOPED_ACCEPTED | Connected geographical map, native pointer/keyboard, reversible open paths, optional bypass/revisit, mandatory gates and exclusive neutralization. RunSystem owns intents/facts. [Current navigation](POI_NAVIGATION.md). |
| Lion campaign and V6 | PRODUCTION / SCOPED_ACCEPTED | Existing graph and21 durable IDs retained. Fresh Audience→First refuge, legacy V6 continuation and earned rescue→Second refuge verified. Later routes/endings and broader interruptions remain open. |
| Canonical combat | PRODUCTION / SCOPED_ACCEPTED | Existing tactical owners: fresh opening victory, native Valmir5rounds/42actions and Bois-Clair10rounds/50actions. Rewards, AP, stats and KO0→campaign1HP preserved. General balance, full six-hero skills and native POI defeat recovery remain open. |
| First and second refuge | PRODUCTION / SCOPED_ACCEPTED | Services reopen without repeated arrival/securing rewards. Post-Valmir return/rest costs30gold and preserves90 temporary loot; both hubs reload exact V6. Second checkpoint:280gold/85reputation/zero temporary loot. |
| Final refuge | EXISTING_STORY / NATIVE_PENDING | Authored story and existing company management access. No new interactive hub, free rest or securing reward. Pre-judgement native preparation/agency remains open. |
| Dialogue, tableau and Journey | PRODUCTION / SCOPED_ACCEPTED | Explicit POI activation coordinates existing content owners; resolved passage never replays one-shot content. Tableau cap/eight media slots preserved; broader artistic acceptance remains open. |
| Completed chronicle and title | IMPLEMENTED / MECHANICAL_PASS | Completed ending resumes existing terminal Journey; failure opens focused title. Active/pending finale owners remain resumable. Native ending/menu/reload milestone remains open. |
| Physical Traversal | SUPERSEDED / RETAINED_REFERENCE | Production uses POI. Physical runtime remains behind DEV QA gates plus shared timing/compatibility references; historical V6 fork fields retain POI meaning. Safe orphan removal requires complete reference audit and later replacement verification. |
| UI and accessibility | SCOPED_PASS | Selected maps/hubs readable on1366×768 normal motion; native pointer/keyboard and exact reload. Mobile, OS reduced motion and full campaign/combat focus breadth remain open. |
| Cinematics and VFX | RETAINED / BROADER_REVIEW_OPEN | Eight approved videos and presentation-only VFX. Historical structural readiness remains scoped evidence; artistic remaster is external manual work, audio DEFERRED. |
| Future chest/elite content | GUARDED_SEAMS_ONLY | Production chest catalogue empty; elites identified by existing tactical rank. No reward/placement/formation/lore or parallel tactical engine invented. |
| Demo and operator handoff | IN_PROGRESS | Current POI pass functionally complete in the above scope. Fins/alternatives, defeat, broader accessibility/mobile and final human artistic/balance/demo testing remain open. [Plan](../autonomy/DEMO_COMPLETION_PLAN.md). |

Mechanical verification:67 focused game/POI/Journey adapter tests,18 QA continuity/authority tests, TypeScript/build and eight-contract/eight-slot validator pass. Five broader JourneyCampaignBoundary failures reproduce unchanged at pre-fix `e61b118` and remain open; no full-suite PASS is claimed. Guardian reviewed actual changes, native provenance, exact save lineage and five selected current captures.

## Historical source audit — superseded navigation status

The earlier audit below retains its original source baseline and evidence links. Its T0/T1/T3 production-navigation and default-Journey claims are superseded by the POI update above. Older control/Salvation/refuge proofs retain their original scope and do not establish current POI endings or full-demo acceptance.

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
| Native combat keyboard controls | SCOPED_PASS | [Focused control activation](../reports/combat-keyboard-native-activation-1.md): Enter/Space no longer also ends the turn; six production cases at three widths preserve native controls, shortcuts and exactly-one Wait. Full grid targeting and full combat accessibility remain item 9. |
| Native defeat checkpoint recovery | SCOPED_PASS | [Native recovery proof](../reports/combat-keyboard-native-activation-1.md):1366normal and390OS-only real Bois-Clair defeat return, exact owner V6/reload, temporary loot/T1 cleanup and focused departure pass. T3 was already absent.620lost before the requested boundary; Champion/full demo remain item9. |
| Authored healing and earned Bois-Clair QA | SCOPED_PASS | [Salvation and earned second-refuge proof](../reports/earned-bois-clair-salvation-1.md): authored healing adapter and standalone native 40% cast pass; earned rescue second-refuge and Serpent terminal V6 reload observed. Ending run fails its extra campaign-skill requirement; independent replay loses Bois-Clair. Trial/sacrifice, preparation/defeat/mobile/VFX remain item 9. |
| Cinematics | STRUCTURE_READY | Exactly eight approved MP4s; existing-media triggers, tableau ownership, agency, OS/game reduced motion, unavailable-media fallback and resolved V6 resume pass [current structural QA](../autonomy/CINEMATIC_STRUCTURE_READINESS.md). Artistic remaster remains incomplete EXTERNAL_MANUAL_WORKSTREAM. |
| VFX | CATALOG_PARTIAL | Presentation-only runtime remains implemented; final authored effect coverage and full-demo acceptance remain item 9. |
| UI | PRODUCTION_NEEDS_POLISH | [Refuge focus](../reports/refuge-keyboard-focus-1.md) and [management keyboard/services](../reports/management-keyboard-services-1.md) pass scoped native details, contextual labels, preview return, owner operations and V6 resume at three widths. [Refuge durability and earned first-refuge proof](../reports/refuge-autosave-durability-1.md) now pass immediate entry/rest V6 reload and potion keyboard use; a fresh chronicle wins the actual opening battle and resumes the first refuge. Both endings/full combat/VFX acceptance remain item 9. |

Current T0 production evidence: [integrated report](../reports/traversal-t0-production-loop-final-1.md) and [QA JSON](../reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json). They were produced before this documentation audit and remain the selected golden evidence.
