# Contract drift audit — 2026-10-01

Baseline: `dev @ 00b96f1` after `git fetch --prune`; `origin/main` is an ancestor of `dev`. This is a source and canonical-document audit, not a complete production browser acceptance run. The [constitution](../game/GAME_CONSTITUTION.md) and [locked contracts](../contracts/README.md) are the approved target.

| Area | Checked source or document | Finding | Action |
| --- | --- | --- | --- |
| Video slots | `public/assets/cinematics/manifest.json`; `src/cinematics/CinematicReductionPolicy.ts` | Manifest has 32 entries, 31 with video sources. Policy still allows `OPTIONAL_VIDEO` and `COMBAT_OWNED` prelude playback. Approved production list has eight. | Active cinematic alignment task; preserve authored beats with correct non-video presentation. |
| Cinematic doctrine | `docs/art-direction/option-c/narrative-presentation-doctrine.md`; older CIN reports | Older `MAIN_EVENT => CINEMATIC_REQUIRED` and enemy reveal allowances conflict with the new lock. | New media contract explicitly supersedes these clauses. Do not rewrite historical reports. Audit machine doctrine during runtime task. |
| Traversal | `src/traversal/TraversalFeaturePolicy.ts`; `src/game/GameApp.ts`; `src/campaign/LionCampaignTravelRelations.ts` | T0 alone is enabled. T1/T3 have campaign stages but no playable scene. T2/T4 IDs exist with no stages. | Generalize from T0 after cinematic alignment; retire playable T2/T4 plans while keeping durable IDs. |
| Campaign and save | `src/game/runSystem.ts`; `src/game/store.ts` | RunSystem owns temporary loot/secure boundary; store migrates older versions into V6. No contract conflict identified in this focused read. | Exercise resume/migration boundaries when runtime changes touch them. |
| Canonical docs | `docs/project/*`, `docs/content/DEMO_CONTENT_MAP.md`, `docs/traversal/*` | Several older status and roadmap labels called T1–T4 undecided. | Added explicit supersession/current target links while preserving the old baseline observations. |
| Evidence | `docs/traversal/QA_GUIDE.md`; `.gitignore` | Ordinary Traversal reruns target ignored evidence paths. | Keep this convention for all new QA; promote selected proof only. |

## Contract compliance of this audit

This task changed documentation and a contract validator only. It did not change campaign, saves, combat, runtime presentation, or assets. The constitution and all eight manifest contracts are locked; the validator checks their paths, markers, IDs, and exact eight approved video IDs. Historical reports remain intact. Runtime drift remains explicitly open for the subsequent queue items.

## First runtime checkpoint

The subsequent cinematic task introduced the eight-ID playback gate in `GameApp`, restricted dialogue preludes to approved major videos, removed global enemy-reveal video triggers, and made the refugees, Valmir road, and witnesses Journey boundaries present their existing still/tableau and agency. It did not remove media from the manifest or alter the historical generated registry. Focused and broader Cinematics/Journey tests passed (38 files, 378 tests); TypeScript and production Vite build passed. Browser acceptance and the remaining media conversions are pending, so the eight-slot contract is not yet marked implemented.
