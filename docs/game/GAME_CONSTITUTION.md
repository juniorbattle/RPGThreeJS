# RPGThreeJS game constitution

Status: **LOCKED** — `PRODUCTION-CONTRACTS-LOCK-1`, 2026-10-01. This file records approved production decisions. A normal implementation task cannot relax it. Contract changes require a dedicated task and an explicit operator decision.

## Identity and authority

RPGThreeJS is an authored narrative tactical RPG. Choices and consequences persist because of canonical game facts. `RunSystem`, campaign structure and travel relations, combat resolution, and versioned saves own those facts. Journey, NarrativeStage, Traversal, Combat Stage, UI, VFX, cinematics, and audio present them; presentation never creates a route, outcome, resource, or durable consequence on its own.

The final visual direction is modern pixel art / HD-2D fantasy JRPG and tactical RPG. Photorealism, generic anime, watercolor, and smooth generic 3D are outside the production language. Character System V2 masters and promoted poses set the current final visual ceiling. New characters follow that line; no silent global remaster.

## Campaign and play

Under OD-2026-10-13-D / `PRODUCTION-CONTRACTS-POI-NAVIGATION-1`, set 1.2.0, the illustrated connected POI map is the sole final production navigation. Playable Traversal T0/T1/T3 is superseded on navigation only. Preserve authored content, T0–T4 durable identities, required causal ordering and V6 compatibility. Temporary internal migration compatibility never becomes a permanent second player mode. Campaign and RunSystem revalidate connected movement, backtracking and activation. Resolved POIs replay no effects; neutralized is distinct from resolved; unlocked refuges reuse existing services.

Tactical Combat resolves gameplay. Combat Stage and VFX present resolved events and never calculate or duplicate damage, AP, statuses, or outcomes. Refuges prepare the party. Gameplay owners credit earned gold and items immediately to usable holdings. On defeat, restore the last valid actual save of the selected game, including its rewards, spending and resolution facts together; only unsaved changes are undone. OD-2026-10-18-C / PRODUCTION-CONTRACTS-LAST-SAVE-RELOAD-1 supersedes the former unsecured-loot/checkpoint-loss rule.

Progression currently has no level or XP. Equipment, weapon tiers, two accessory slots, skill upgrades, recruitment, and materials carry progression. Exactly one weapon is equipped. Ultimates remain outside scope pending an explicit decision.

## Narrative and media

`STATIC_TABLEAU` is the normal interactive narrative language: staged actors with position, facing, look target, depth, focus, and restaging. Prefer readable compositions, currently up to four visible actors. Dedicated `PRODUCTION-CONTRACTS-CINEMATIC-RETIREMENT-1` / [OD-2026-10-24-A](../autonomy/CINEMATIC_RETIREMENT_OPERATOR_DECISION_2026-10-24.md), set1.10.0: production videos are retired. Preserve the eight historical beat identities in [the media contract](../contracts/PRESENTATION_AND_MEDIA.md), with zero active video slots; existing static dialogues/tableaux retain the major moments and agency. `MAIN_EVENT => CINEMATIC_REQUIRED` is superseded. Audio is **DEFERRED** until narrative, presentation, cinematics, and POI navigation structure are demonstrably locked and stable, except the eight operator-accepted UI FX files and audited native events under OD-2026-10-18-F / PRODUCTION-CONTRACTS-UI-FX-1. This bounded exception requires default silence, voluntary enable/mute/volume and real gesture unlock; preferences remain outside gameplay saves, failures never block agency or write game truth. OD-2026-10-19-B / PRODUCTION-CONTRACTS-COMBAT-FX-1 further authorizes the bounded16family nonverbal combat FX pack and audited UI feedback, with shared parent settings, current iframe/session/allowlist validation, directly observed trusted gesture, deduplication and bounded priority playback; new files await operator artistic acceptance. Audio never resolves gameplay or serializes transient state. OD-2026-10-29-B / `PRODUCTION-CONTRACTS-MUSIC-AUDIO-1`, set1.11.0, authorizes code-generated music for five presentation contexts, one synthesized ambience per combat biome and synthesized sources for the existing sixteen combat families, under the same parent owner; effects stay default off, while music and ambience are on by default but silent until the first real gesture. Combat presentation happens in the arena (the Combat Stage scene is retired). Voices, a distinct Ultimate audio identity and cinematic/video audio remain DEFERRED. These exceptions do not infer global acceptance.

## Durable boundaries

Preserve canonical IDs and migrations. Save world truth, never transient visual state. UI uses deep navy, brass, warm gold, and ivory, with responsive layout, accessible navigation, and reduced motion. Ordinary QA writes to ignored locations; tracked historical evidence is promoted explicitly and never overwritten by a rerun.

## Reading order

Read [contract index](../contracts/README.md), [manifest](../contracts/contracts.manifest.json), and [autonomous protocol](../contracts/AUTONOMOUS_WORK_PROTOCOL.md) before implementation. Those documents expand this constitution. Existing historical reports describe their own baselines; when they differ, this locked decision and current production source guide the next correction. The constitution does not claim that every runtime surface is already compliant.
