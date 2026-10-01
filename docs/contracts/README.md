# Production contracts

`PRODUCTION-CONTRACTS-LOCK-1` records approved target behavior. Every document in [contracts.manifest.json](contracts.manifest.json) is **LOCKED**. Read [the constitution](../game/GAME_CONSTITUTION.md), the manifest, [the autonomous protocol](AUTONOMOUS_WORK_PROTOCOL.md), and each contract relevant to a task before editing. A normal task must not change a locked contract to make implementation easier; a change needs a dedicated operator-approved contract task.

| Contract | Scope |
| --- | --- |
| [WORLD_AND_CHARACTERS](WORLD_AND_CHARACTERS.md) | Art direction, Character System V2, environments |
| [CAMPAIGN_AND_STATE](CAMPAIGN_AND_STATE.md) | Narrative, campaign, progression, refuges, state, saves |
| [PRESENTATION_AND_MEDIA](PRESENTATION_AND_MEDIA.md) | NarrativeStage, dialogue, cinematic slots, Journey, audio |
| [TRAVERSAL](TRAVERSAL.md) | T0 reference and T1/T3 target grammar |
| [COMBAT_AND_VFX](COMBAT_AND_VFX.md) | Tactical gameplay, Combat Stage, VFX |
| [UI_AND_ACCESSIBILITY](UI_AND_ACCESSIBILITY.md) | UI/UX and accessibility |
| [AUTHORING_AND_QA](AUTHORING_AND_QA.md) | Content authoring, evidence, repository governance |
| [AUTONOMOUS_WORK_PROTOCOL](AUTONOMOUS_WORK_PROTOCOL.md) | Branch, state, task and checkpoint procedure |

Authority order for new work: explicit current operator decisions; this constitution and locked contracts; current executable source as the statement of what is implemented; canonical status/architecture docs; historical reports. If source or an older document differs from a locked target, record drift and correct it through an ordinary task without rewriting the contract. Preserve old reports as dated evidence.

Status terms: **LOCKED** means the decision is binding; **implemented** means source and tests currently meet it; **drift** means implementation or canonical docs still need alignment; **deferred** means the contract forbids premature production. Locking the decision is not a claim of implementation or acceptance.
