# TRAVERSAL-REMAINING-LEGS-AUDIT-1 — browser gallery index

> **Historical visual reference only.** These captures show the campaign at the task's earlier baseline. T0 architecture shown here includes removed road-interaction behavior. Current production authority is the [T0 contract](../../traversal/T0_PRODUCTION_CONTRACT.md) and [leg roadmap](../../traversal/LEGS_ROADMAP.md). The gallery is retained for distinct T1/T3/T4 and branch-state reference during [PROJECT-CONTINUITY-CLEANUP-1](../project-continuity-cleanup-1.md).

Observation-only gallery of **current production** (Traversal gate = T0 only).
Open `index.html` for a thumbnail gallery (97 indexed captures). `gallery-index.json` holds
the source run and live state snapshot for each capture; all four browser runs completed with
zero recorded page errors. `t3-final-event-current.png`, `shadow-signs-current.png`, and
`final-refuge-current.png` are named aliases of their corresponding dialogue captures so the
requested review set has stable filenames.
Method: unmodified app served by an in-process Vite DEV server at `?qa=1&cin6a=golden`;
durable saves are built through the real RunSystem and resumed via the title-screen Continue
button; all interactions are real UI clicks except combat, which uses the existing DEV QA
victory control. Machine-readable state per capture: `gallery-index.json`.

Contact sheets (asset review): `asset-sheet-t0-world-reference.png`,
`asset-sheet-t1-bois-clair.png`, `asset-sheet-t3-t4-final.png`.

## Run `t0-reference` — production T0 baseline (17 captures)

| File | State |
|---|---|
| `t0-reference-departure-journey.png` | Journey departure from resolved `lion-audience` |
| `t0-reference-normal-travel.png` / `-390` | Traversal RUNNING (desktop + mobile) |
| `t0-reference-optional-interrupt.png` | DECISION on optional peddler beat |
| `t0-reference-local-dialogue.png` | LOCAL_INTERACTION borrowed dialogue |
| `t0-reference-dialogue-return.png` | Return to RUNNING, progress preserved |
| `t0-reference-mandatory-interrupt.png` / `-390` | DECISION on mandatory canonical stage |
| `t0-reference-combat.png` | NODE_RESOLUTION road/campaign combat |
| `t0-reference-combat-return.png` | Return to RUNNING after combat |
| `t0-reference-canonical-dialogue.png` | Canonical node dialogue inside traversal |
| `t0-reference-canonical-dialogue-return.png` | Resume after canonical node |
| `t0-reference-optional-canonical-interrupt.png` | DECISION on optional canonical stage |
| `t0-reference-fork.png` / `-390` | FORK_OVERLAY — live-world route choice rail |
| `t0-reference-arrival.png` | ARRIVING at `lion-first-refuge` |
| `t0-reference-arrival-agency.png` | Canonical destination boundary (explicit agency) |

## Run `final-act-main` — current production route, event branches (66 captures, including 3 aliases)

T1 corridor (today: Journey/NarrativeStage, no traversal):
`t1-current-01-first-refuge-departure(-390)`, `t1-current-02-reserve-trail`,
`t1-current-03-reserve-trail-choice`, `t1-current-04-valmir-road-departure`,
`flow-dialogue-valmir-road-pre_valmir_road`, `t1-current-05-valmir-road-combat`,
`flow-dialogue-valmir-road-post_valmir_road`,
`flow-dialogue-valmir-road-ate_serpent_general_warning`,
`flow-cinematic-valmir-road-valmir_route_fork` (held end-frame over the live fork),
`t1-current-06-second-trial-fork(-390)`,
`flow-cinematic-second-trial-event-shrine_reveal_context`,
`t1-current-07-second-trial-event`, `bois-clair-current-01-approach`.

Bois-Clair + Second Refuge (today: direct handoff edge — the future non-playable T2):
`flow-cinematic-village-choice-bois_clair_arrival`, `bois-clair-current-03-dialogue`,
`bois-clair-current-04-choice`, `flow-dialogue-village-choice-pre_village_defense`,
`bois-clair-current-05-combat`, `flow-dialogue-village-choice-village_defense_aftermath`,
`flow-dialogue-village-choice-ate_maelor_seal_analysis`,
`flow-dialogue-village-choice-rep_event_roadside_intimidation`,
`flow-dialogue-village-choice-pre_serpent_reprisals`,
`flow-dialogue-village-choice-post_serpent_reprisals`,
`bois-clair-current-07-handoff-to-second-refuge`, `second-refuge-current-02-hub`,
`flow-dialogue-second-refuge-ate_bois_clair_night_watch`,
`second-refuge-current-04-departure`.

T3 corridor: `t3-garen-current`, `t3-garen-choice-current`,
`t3-witness-road-departure-current`, `t3-witnesses-current`,
`t3-witnesses-decision-current`, `flow-dialogue-witnesses-ate_lion_council_doubt`,
`flow-cinematic-witnesses-witnesses_encounter`, `t3-final-fork-current`,
`flow-cinematic-final-trial-event-young_dragon_encounter`,
`flow-dialogue-final-trial-event-mystery_dragon_roost`,
`flow-dialogue-final-trial-event-pre_young_dragon_roost`,
`t3-final-event-combat-current` (event branch is combat-capable),
`flow-dialogue-final-trial-event-post_young_dragon_roost`, `t3-shadow-approach-current`.

Shadow Signs + T4 + final refuge + judgement:
`shadow-signs-dialogue-current`, `shadow-signs-evidence-choice-current`,
`flow-dialogue-shadow-signs-ate_ruins_awaken`,
`flow-dialogue-shadow-signs-ate_serpent_retreat_order`, `t4-current-handoff`,
`final-refuge-dialogue-current` (calm pre-judgement dialogue — story node today),
`flow-dialogue-final-refuge-rep_event_village_memorial_request`,
`final-refuge-departure-current`, `flow-cinematic-final-judgement-lion_judgement`,
`judgement-current`, `judgement-choice-current`,
`flow-cinematic-final-judgement-serpent_general_reveal`,
`flow-dialogue-final-judgement-serpent_pursuit_pre_combat`, `final-boss-current`.

## Run `t3-combat-branch` — T3 fork, combat branch (7 captures)

`t3c-cinematic-witnesses-witnesses_encounter`, `t3-final-fork-combat-run`,
`t3c-dialogue-final-trial-combat-pre_ruins_guardians`, `t3-final-combat-current`,
`t3c-dialogue-final-trial-combat-post_ruins_guardians`,
`t3-shadow-approach-after-combat-current`, `shadow-signs-after-combat-branch`.

## Run `t1-combat-branch` — T1 fork, combat branch (7 captures)

`t1c-cinematic-valmir-road-valmir_route_fork`,
`t1-current-06b-second-trial-fork-combat-run`,
`t1c-cinematic-second-trial-combat-serpent_road_tension`,
`t1c-dialogue-second-trial-combat-pre_serpent_checkpoint`,
`t1-current-07b-second-trial-combat`,
`t1c-dialogue-second-trial-combat-post_serpent_checkpoint`,
`bois-clair-current-01b-approach-after-combat`.

## Notable presentation findings

- The current fork UX is a **Journey overlay with the route cinematic held on its end frame**
  above the live choice — the exact surface the `IN_TRAVERSAL_FORK` contract
  (`TRAVERSAL_OVERLAY`, mounted world, right choice rail) will replace on T1/T3.
- Second Refuge already opens the interactive refuge hub (`exploration-stop`).
- `lion-final-refuge` currently resolves as a story dialogue only — no hub (by design today).
- Every edge/node in scope has a mapped TRAVEL plate / HOLD_SOURCE tableau; Traversal-world
  (side-on) art does not exist yet for T1/T3/T4.
