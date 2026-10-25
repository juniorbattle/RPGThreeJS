# Actions de combat et Composer VFX en priorité

Run claude-vfx-priority-20261025T0814Z (agent claude, session interactive), 2026-10-25T08:14:10Z → 2026-10-25T08:16:43Z. [OD-2026-10-25-B](COMBAT_VFX_PRIORITY_OPERATOR_DECISION_2026-10-25.md) : l’opérateur demande de se concentrer sur le Composer VFX et de finir les actions de compétence du combat tactique et du Combat Stage. Le pilote narratif Alistair est en pause ; son lecteur reste livré et inerte.

[Couverture](../reports/combat-vfx-coverage-2026-10-25.md) : sur 34 actions de démo, 3 affichent leur effet. Les 31 autres pointent vers des planches retirées, sautées en silence, et perdent aussi le repli procédural. Le registre publié est vide.

Contrats 1.10.0 et baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` inchangés. Scheduler PAUSED, réglages inchangés. `main` protégé.

UNE prochaine action : Lot 0 d'OD-2026-10-25-B : dans legacyCombatRuntime.js, faire compter à actionHasSpritesheetVfx seulement les planches qui se résolvent (VFX_SPRITE_SHEETS), pour que le repli procédural (castTelegraph) revienne sur les 31 actions de démo dont la planche est retirée ; ajouter un test qui garantit que chaque action de démo affiche une planche résolue ou le repli ; corriger flowSpriteDirection.combatFacts.vfxBasePresent. Puis lot 1 (contact) dans le Composer, selon le mode d'auteur confirmé par l'opérateur.

Compteurs : {"runtimeSourceFilesModified":0,"gameplayFilesModified":0,"testFilesModified":0,"newMedia":0,"imagegenCalls":0,"qaScenarios":0,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":9,"taskReports":1,"productProgress":0}. Handoff : [2026-10-25T0814Z-claude-vfx-priority.md](handoffs/2026-10-25T0814Z-claude-vfx-priority.md). Publication normale sur origin autorisée par OD-2026-10-12-A.

<!-- QA_JOBS_START -->
## Live QA jobs

- video-retirement-opening-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-host-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-host-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-poi-2258: SUCCEEDED; port 5463; receipt `tmp/cinematics/retirement-opening-poi-2258/qa-job.json`; ACCEPTED_SCOPED_PC1366_NATIVE_VIDEO_RETIREMENT
<!-- QA_JOBS_END -->
