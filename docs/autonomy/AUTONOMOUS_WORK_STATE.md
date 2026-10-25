# Agents et skills à jour — branches WIP à archiver

Run claude-agents-skills-20261025T0512Z (agent claude, session interactive), 2026-10-25T05:12:50Z → 2026-10-25T05:31:40Z. Tâche N4 d’[OD-2026-10-25-A](CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md) terminée ; profils, skills et gouvernance seulement.

`traversal-engineer` est archivé, `cinematics-journey` relit Journey sans vidéo, les résumés de contrat sont au set 1.10.0 et un reviewer `combat-vfx-sprites` existe en lecture seule. `.claude/` expose les 7 profils et 7 skills à Claude Code et lance le serveur de dev. Revue contracts-guardian PASS_WITH_NOTES, corrections appliquées. Le prompt récurrent de Codex ne nomme pas encore `combat-vfx-sprites` (action de l’opérateur).

Contrats 1.10.0 et baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` inchangés. Scheduler PAUSED, réglages inchangés. `main` protégé.

UNE prochaine action : N3 (OD-2026-10-25-A) : poser un tag archive/wip/<nom> sur la pointe de chacune des 12 branches wip/* locales et des 11 distantes (pour la branche divergente wip/rpgthreejs-auto-dev-90m-20261003T1600, un tag par version), pousser les tags, vérifier qu’ils résolvent vers les mêmes commits, puis supprimer les branches locales et distantes ; ensuite pilote OD-2026-10-24-B.

Compteurs : {"runtimeSourceFilesModified":0,"gameplayFilesModified":0,"testFilesModified":0,"newMedia":0,"imagegenCalls":0,"qaScenarios":0,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":36,"productProgress":0}. Handoff : [2026-10-25T0512Z-claude-agents-skills.md](handoffs/2026-10-25T0512Z-claude-agents-skills.md). Publication normale sur origin/dev autorisée par OD-2026-10-12-A.

<!-- QA_JOBS_START -->
## Live QA jobs

- video-retirement-opening-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-host-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-host-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-poi-2258: SUCCEEDED; port 5463; receipt `tmp/cinematics/retirement-opening-poi-2258/qa-job.json`; ACCEPTED_SCOPED_PC1366_NATIVE_VIDEO_RETIREMENT
<!-- QA_JOBS_END -->
