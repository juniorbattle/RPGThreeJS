# Lab VFX prêt — l’opérateur compose

Run claude-vfx-lot0-20261025T0845Z (agent claude, session interactive), 2026-10-25T08:45:49Z → 2026-10-25T09:17:20Z. Lot 0 d’[OD-2026-10-25-B](COMBAT_VFX_PRIORITY_OPERATOR_DECISION_2026-10-25.md) ; les effets sont composés dans le lab par l’opérateur.

Les 31 actions de démo dont la planche de base est retirée affichent désormais un substitut procédural au bon endroit et au bon moment, en vue tactique comme dans le Combat Stage, et retrouvent leur repli castTelegraph. Un test garantit que chacune des 34 actions dessine quelque chose. Le lab marque l’état de chaque action, saute à la suivante non publiée et ne compte plus un brouillon pré-rempli comme travail. [Mode d’emploi](../project/VFX_COMPOSER_WORKFLOW.md).

npm test : 162 fichiers vitest, 2849 tests, puis node:test 26/26 ; tsc, build, vfx:validate-published et contrats verts. Revue combat-vfx-sprites : OK avec conditions, rien de bloquant ; corrections appliquées.

Contrats 1.10.0 et baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` inchangés. Scheduler PAUSED, réglages inchangés. `main` protégé.

UNE prochaine action : L'opérateur compose les actions dans le Composer (OD-2026-10-25-B, mode d'auteur : opérateur), famille par famille selon docs/project/VFX_COMPOSER_WORKFLOW.md. Après chaque série publiée, Claude vérifie : npm run vfx:validate-published, tests VFX et stage, un combat de contrôle en mouvement normal et réduit, puis commit sur dev du registre publié.

Compteurs : {"runtimeSourceFilesModified":5,"runtimeSourceFilesAdded":1,"gameplayFilesModified":0,"testFilesModified":4,"testFilesAdded":1,"newMedia":0,"imagegenCalls":0,"qaScenarios":1,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":5,"productDocumentationFiles":2,"productProgress":1}. Handoff : [2026-10-25T0845Z-claude-vfx-lot0.md](handoffs/2026-10-25T0845Z-claude-vfx-lot0.md). Publication normale sur origin autorisée par OD-2026-10-12-A.

<!-- QA_JOBS_START -->
## Live QA jobs

- video-retirement-opening-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-host-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-host-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-poi-2258: SUCCEEDED; port 5463; receipt `tmp/cinematics/retirement-opening-poi-2258/qa-job.json`; ACCEPTED_SCOPED_PC1366_NATIVE_VIDEO_RETIREMENT
<!-- QA_JOBS_END -->
