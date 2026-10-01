# Remaining Traversal legs: current-source audit

Historical planning baseline. The [2026-10-01 locked Traversal contract](../contracts/TRAVERSAL.md) supersedes this document's `UNDECIDED` labels and playable T4 proposal: T1/T3 are approved for production, T2/T4 playable plans are retired, and durable IDs remain. Source-readiness observations below still describe the cited older baseline and need fresh verification before implementation.

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`. **CURRENT FACT** comes from `LionCampaignTravelRelations`, `LionCampaignStructure`, `runSystem`, `GameApp`, `TraversalFeaturePolicy`, and the T0 asset tree. **APPROVED DECISION** here is only the locked T0 production gate. All future presentation designs below are proposals or undecided.

`GameApp.enterCampaignPresentation` selects `candidate.id === 'T0'`; the gate's rollout list is `['T0']`. T1–T4 therefore currently use Journey/canonical campaign presentation, even though their relation IDs and stages exist. The only runtime Traversal art pack is `public/assets/generated/lion-phase/traversal/t0/`. Existing environment plates for locations/dialogue are not side-on Traversal world art.

| Leg | Origin → destination | Canonical stages and branch | Current campaign presentation / production Traversal | Asset readiness and missing world art | Demo requirement |
| --- | --- | --- | --- | --- | --- |
| T1 | `lion-first-refuge` → `lion-village-choice` | `lion-reserve-trail` mandatory; `lion-valmir-road` mandatory; fork `lion-second-trial-event` / `lion-second-trial-combat` with Traversal overlay relation | Journey + canonical nodes; no playable T1 scene | No T1 side-on Route/section/vehicle/foreground pack; existing location/tableau plates do not fill that role | UNDECIDED |
| T2 | `lion-village-choice` → `lion-second-refuge` | No stages or fork | Journey/direct available-node presentation; no playable T2 scene | No T2 side-on world art; zero-stage relation | UNDECIDED |
| T3 | `lion-second-refuge` → `lion-shadow-signs` | `lion-lancer-recruit` mandatory; `lion-witnesses` mandatory; fork `lion-final-trial-event` / `lion-final-trial-combat` with Traversal overlay relation | Journey + canonical nodes; no playable T3 scene | No T3 side-on Route/section/vehicle/foreground pack for witness road and Shadow ruins | UNDECIDED |
| T4 | `lion-shadow-signs` → `lion-final-refuge` | No stages or fork | Journey/direct available-node presentation; no playable T4 scene | No T4 side-on world art; final-refuge travel/tableau art is not a Route pack | UNDECIDED |

## Per-leg work and decisions

### T1

- **CURRENT FACT:** the relation ends at `lion-village-choice`; its two interrupts and strict fork are authored in campaign source. Canonical dialogue/combat IDs are attached to these nodes in `LionCampaignStructure` and `runSystem`.
- **PROPOSED FUTURE DESIGN:** author side-on world sections and a per-leg presentation adapter; preserve the existing fork in the mounted world and the village-choice arrival boundary.
- **Required engineering if approved:** generalize the current T0-only scene/`GameApp` selector and `RunSystem` T0-only branch/bypass checks with explicit rollout gating, then add T1 route/world authoring and tests.
- **Required content if approved:** approved road paintings/foreground and staging for the existing reserve-trail, Valmir-road, and branch content. No new encounter is implied.
- **UNDECIDED:** demo versus post-demo need, route duration, world composition, Risk/Reward/Pursuit applicability, and final asset set.

### T2

- **CURRENT FACT:** retained ID `T2`, village-choice to second-refuge, zero stages. `GameApp` does not mount a T2 Traversal scene.
- **PROPOSED FUTURE DESIGN:** preserve the ID while using a direct NarrativeStage/Journey handoff rather than a side-on leg. This came from an earlier planning report and is not implemented or approved here.
- **Required engineering/content if approved:** define the handoff and save/arrival boundary, preserve the existing village and refuge content, and verify the second-refuge hub. New T2 world art is unnecessary only if that design is chosen.
- **UNDECIDED:** whether any change is needed for the demo, and the exact presentation contract.

### T3

- **CURRENT FACT:** two mandatory interrupts lead to a strict fork, then `lion-shadow-signs`. Campaign content and cinematic/dialogue systems already present these nodes outside Traversal.
- **PROPOSED FUTURE DESIGN:** world and route authoring for witness road/Shadow ruins with the fork over the live scene.
- **Required engineering if approved:** the same generic/runtime gate work as T1, plus per-leg branch/arrival coverage; do not duplicate RunSystem authority.
- **Required content if approved:** side-on road/ruins art and staging of existing Lancer, witnesses, and branch consequences.
- **UNDECIDED:** demo need, route timing, new art acceptance, and whether any T0 local Route systems apply.

### T4

- **CURRENT FACT:** zero-stage relation ends at `lion-final-refuge`. That node is `story` in `runSystem`, with `final_refuge` dialogue; it is absent from `INTERACTIVE_REFUGES`.
- **PROPOSED FUTURE DESIGN:** a short atmospheric connection, possibly followed by an interactive final hub. The earlier 45–75 second estimate is only a prototype hypothesis.
- **Required engineering/content if approved:** define a no-stage arrival and world presentation; if a hub is chosen, update node type and refuge registration together while retaining the pre-dialogue and judgement boundary.
- **UNDECIDED:** demo need, playable T4 versus Journey, duration, world art, and final-hub conversion.

No new leg is enabled by this roadmap. The [older remaining-legs report](../reports/traversal-remaining-legs-audit-1.md) is historical and includes removed `TraversalRoadEncounter`/`LOCAL_INTERACTION` material; use the current source and [architecture](ARCHITECTURE.md) for implementation planning.
