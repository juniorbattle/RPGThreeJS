# Production contracts

`PRODUCTION-CONTRACTS-LOCK-1` records approved target behavior. Every document in [contracts.manifest.json](contracts.manifest.json) is **LOCKED**. Read [the constitution](../game/GAME_CONSTITUTION.md), the manifest, [the autonomous protocol](AUTONOMOUS_WORK_PROTOCOL.md), and each contract relevant to a task before editing. A normal task must not change a locked contract to make implementation easier; a change needs a dedicated operator-approved contract task.

| Contract | Scope |
| --- | --- |
| [WORLD_AND_CHARACTERS](WORLD_AND_CHARACTERS.md) | Art direction, Character System V2, environments |
| [CAMPAIGN_AND_STATE](CAMPAIGN_AND_STATE.md) | Narrative, campaign, progression, refuges, state, saves |
| [PRESENTATION_AND_MEDIA](PRESENTATION_AND_MEDIA.md) | NarrativeStage, dialogue, cinematic slots, Journey, audio |
| [TRAVERSAL](TRAVERSAL.md) | Campaign POI navigation; historical contract ID retained |
| [COMBAT_AND_VFX](COMBAT_AND_VFX.md) | Tactical gameplay, Combat Stage, VFX |
| [UI_AND_ACCESSIBILITY](UI_AND_ACCESSIBILITY.md) | UI/UX and accessibility |
| [AUTHORING_AND_QA](AUTHORING_AND_QA.md) | Content authoring, evidence, repository governance |
| [AUTONOMOUS_WORK_PROTOCOL](AUTONOMOUS_WORK_PROTOCOL.md) | Branch, state, task and checkpoint procedure |

Authority order for new work: explicit current operator decisions; this constitution and locked contracts; current executable source as the statement of what is implemented; canonical status/architecture docs; historical reports. If source or an older document differs from a locked target, record drift and correct it through an ordinary task without rewriting the contract. Preserve old reports as dated evidence.

Status terms: **LOCKED** means the decision is binding; **implemented** means source and tests currently meet it; **drift** means implementation or canonical docs still need alignment; **deferred** means the contract forbids premature production. Locking the decision is not a claim of implementation or acceptance.

## Approved amendment history

Contract set **1.4.0** / `PRODUCTION-CONTRACTS-POI-LOT-E-1` / [OD-2026-10-15-B](../autonomy/LOT_E_OPERATOR_DECISION_2026-10-15.md) approves the exact Lot E catalogue, twelve optional fixed POIs, six chests, six stable variable encounters and two persistent mobile elite actors with independent Combat/retreat resolution. CAMPAIGN_AND_STATE, TRAVERSAL, COMBAT_AND_VFX, UI_AND_ACCESSIBILITY, WORLD_AND_CHARACTERS and AUTHORING_AND_QA change only for this scope. Constitution, PRESENTATION_AND_MEDIA, AUTONOMOUS_WORK_PROTOCOL, eight video IDs and protected canon remain unchanged. Independent actual-diff review precedes runtime; the committed amendment becomes the immutable baseline in a following operational checkpoint. Full technical/native delivery and operator art/balance acceptance remain separate.

Contract set **1.1.0** retains the original eight contracts and constitution. Dedicated `PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1`, explicitly approved by [OD-2026-10-03-A](../autonomy/MANUAL_PLAYTEST_OPERATOR_DECISION_2026-10-03.md), amends TRAVERSAL, CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, WORLD_AND_CHARACTERS, UI_AND_ACCESSIBILITY and AUTHORING_AND_QA. The original `b1e8858` lock remains historical; normal-task Git protection uses the approved amendment commit recorded in AGENTS.md and the contracts-compliance skill. No normal task may advance that baseline or edit a LOCKED rule. COMBAT_AND_VFX, AUTONOMOUS_WORK_PROTOCOL, constitution and the eight video IDs are unchanged. DIALOGUE_STAGING is a section of PRESENTATION_AND_MEDIA, not an additional contract.

Contract set **1.2.0** / `PRODUCTION-CONTRACTS-POI-NAVIGATION-1` / [OD-2026-10-13-D](../autonomy/POI_NAVIGATION_OPERATOR_DECISION_2026-10-13.md) supersedes playable physical Traversal navigation with connected POI navigation. TRAVERSAL retains its historical ID within the eight contracts. Constitution and seven contracts change only on navigation, compatibility and acceptance; COMBAT_AND_VFX, eight video IDs and non-navigation invariants remain unchanged. The amendment commit becomes the immutable baseline through the following operational checkpoint; 1.1.0/d7ca28a remains historical. Runtime and V6 acceptance remain pending until demonstrated.

Contract set **1.3.0** / `PRODUCTION-CONTRACTS-POI-V2-RETIREMENT-1` / [OD-2026-10-15-A](../autonomy/POI_V2_OPERATOR_DECISION_2026-10-15.md) tightens the mandatory opening corridor, real local branches, explicit POI roles, three-phase Option C art/accessibility and definitive physical-engine retirement. Exactly six contracts change: TRAVERSAL, CAMPAIGN_AND_STATE, WORLD_AND_CHARACTERS, UI_AND_ACCESSIBILITY, AUTHORING_AND_QA and AUTONOMOUS_WORK_PROTOCOL. Constitution, PRESENTATION_AND_MEDIA, COMBAT_AND_VFX, eight slots and unrelated rules remain unchanged. The actual amendment requires independent review before commit; its committed SHA becomes the new immutable baseline in a following operational commit. Technical runtime, V6 and operator artistic acceptance remain separate and pending until demonstrated.
