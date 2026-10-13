# RPGThreeJS game constitution

Status: **LOCKED** — `PRODUCTION-CONTRACTS-LOCK-1`, 2026-10-01. This file records approved production decisions. A normal implementation task cannot relax it. Contract changes require a dedicated task and an explicit operator decision.

## Identity and authority

RPGThreeJS is an authored narrative tactical RPG. Choices and consequences persist because of canonical game facts. `RunSystem`, campaign structure and travel relations, combat resolution, and versioned saves own those facts. Journey, NarrativeStage, Traversal, Combat Stage, UI, VFX, cinematics, and audio present them; presentation never creates a route, outcome, resource, or durable consequence on its own.

The final visual direction is modern pixel art / HD-2D fantasy JRPG and tactical RPG. Photorealism, generic anime, watercolor, and smooth generic 3D are outside the production language. Character System V2 masters and promoted poses set the current final visual ceiling. New characters follow that line; no silent global remaster.

## Campaign and play

Journey is the campaign continuity outside Traversal. `TravelView` is a fallback/development surface. Traversal T0 is the production reference; future playable legs are T1 and T3. T2 and T4 are removed as playable Traversal plans, without automatic renumbering or deletion of durable IDs. Campaign and `RunSystem` retain route and consequence authority.

Tactical Combat resolves gameplay. Combat Stage and VFX present resolved events and never calculate or duplicate damage, AP, statuses, or outcomes. Refuges consolidate and prepare; route loot remains temporary until secured by the existing game rules.

Progression currently has no level or XP. Equipment, weapon tiers, two accessory slots, skill upgrades, recruitment, and materials carry progression. Exactly one weapon is equipped. Ultimates remain outside scope pending an explicit decision.

## Narrative and media

`STATIC_TABLEAU` is the normal interactive narrative language: staged actors with position, facing, look target, depth, focus, and restaging. Prefer readable compositions, currently up to four visible actors. Video is reserved for exactly eight major production slots named in [the media contract](../contracts/PRESENTATION_AND_MEDIA.md). `MAIN_EVENT => CINEMATIC_REQUIRED` is superseded. Audio is **DEFERRED** until narrative, presentation, cinematics, and Traversal structure are demonstrably locked and stable.

## Durable boundaries

Preserve canonical IDs and migrations. Save world truth, never transient visual state. UI uses deep navy, brass, warm gold, and ivory, with responsive layout, accessible navigation, and reduced motion. Ordinary QA writes to ignored locations; tracked historical evidence is promoted explicitly and never overwritten by a rerun.

## Reading order

Read [contract index](../contracts/README.md), [manifest](../contracts/contracts.manifest.json), and [autonomous protocol](../contracts/AUTONOMOUS_WORK_PROTOCOL.md) before implementation. Those documents expand this constitution. Existing historical reports describe their own baselines; when they differ, this locked decision and current production source guide the next correction. The constitution does not claim that every runtime surface is already compliant.
