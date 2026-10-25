# Documents d’entrée à jour — agents et skills à mettre à jour

Run claude-entry-docs-20261025T0503Z (agent claude, session interactive), 2026-10-25T05:03:40Z → 2026-10-25T05:06:23Z. Tâche N5 d’[OD-2026-10-25-A](CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md) terminée ; documentation seulement.

AGENTS.md décrit désormais la priorité réelle (« Current priority ») et les règles encore actives (« Standing constraints ») au lieu de quatre sections périmées. Le §9 du protocole suit OD-2026-10-25-A. Le registre des décisions est un seul tableau continu ; aucun texte d’entrée n’a changé. Archive de l’état : [archive/README.md](archive/README.md).

Contrats 1.10.0 et baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` inchangés. Scheduler PAUSED, réglages inchangés. `main` protégé.

UNE prochaine action : N4 (OD-2026-10-25-A) : archiver traversal-engineer, recentrer cinematics-journey sur Journey et NarrativeStage sans vidéo, rafraîchir les digests de narrative-tableau et ui-accessibility, la table de contracts-compliance et la liste d’outils de qa-evidence, créer un reviewer combat-vfx-sprites en lecture seule, ajouter les renvois .claude/ vers .agents/, garder la parité .codex/, puis mettre à jour la table des spécialistes d’AGENTS.md et la ligne Waves du §9 ; contracts:validate et git diff --check.

Compteurs : {"runtimeSourceFilesModified":0,"gameplayFilesModified":0,"testFilesModified":0,"newMedia":0,"imagegenCalls":0,"qaScenarios":0,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":6,"productProgress":0}. Handoff : [2026-10-25T0503Z-claude-entry-docs.md](handoffs/2026-10-25T0503Z-claude-entry-docs.md). Publication normale sur origin/dev autorisée par OD-2026-10-12-A.

<!-- QA_JOBS_START -->
## Live QA jobs

- video-retirement-opening-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-host-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-host-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-poi-2258: SUCCEEDED; port 5463; receipt `tmp/cinematics/retirement-opening-poi-2258/qa-job.json`; ACCEPTED_SCOPED_PC1366_NATIVE_VIDEO_RETIREMENT
<!-- QA_JOBS_END -->
