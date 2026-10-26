# Lots contact et projectiles publiés — revue de l’opérateur attendue

Run claude-vfx-projectiles-20261026T0123Z (agent claude, session interactive), 2026-10-26T01:23:40Z → 2026-10-26T01:29:57Z. [OD-2026-10-25-B](COMBAT_VFX_PRIORITY_OPERATOR_DECISION_2026-10-25.md) : Claude compose et publie les effets, l’opérateur les revoit.

8 projectiles publiés : basic_longbow_hit, basic_grimoire_hit, a_precise_shot, ar_calibrated_shot, n_dark_bolt, enemy_dark_bolt, enemy_binding_shot, boss_pin. Les dégâts tombent à l’arrivée du projectile. 20 actions de démo sur 34 ont un effet composé (17 publications et 3 pilotes). npm test : 162 fichiers vitest, 2850 tests, puis node:test 26/26 ; build, registre et contrats verts.

Contrats 1.10.0 et baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` inchangés. Scheduler PAUSED, réglages inchangés. `main` protégé.

UNE prochaine action : L'opérateur revoit les lots contact et projectiles et signale les retouches ; puis Claude compose le lot 3 (soins, bénédictions et altérations : basic_crosier_hit, e_vigor_rune, w_salvation en finition, enemy_hex, boss_guard, boss_regen, boss_fortify, boss_freeze) avec tmp/claude-probe/compose-lib.ts, publie par handlePublishRequest et vérifie.

Compteurs : {"runtimeSourceFilesModified":0,"gameplayFilesModified":0,"testFilesModified":0,"publishedVfxActions":8,"newMedia":0,"imagegenCalls":0,"qaScenarios":1,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":5,"productProgress":1}. Handoff : [2026-10-26T0123Z-claude-vfx-projectiles.md](handoffs/2026-10-26T0123Z-claude-vfx-projectiles.md). Publication normale sur origin autorisée par OD-2026-10-12-A.

<!-- QA_JOBS_START -->
## Live QA jobs

- video-retirement-opening-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-host-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-host-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-poi-2258: SUCCEEDED; port 5463; receipt `tmp/cinematics/retirement-opening-poi-2258/qa-job.json`; ACCEPTED_SCOPED_PC1366_NATIVE_VIDEO_RETIREMENT
<!-- QA_JOBS_END -->
