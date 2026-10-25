# Lecteur d’animation prêt — candidat Alistair attendu

Run claude-frame-player-20261025T0709Z (agent claude, session interactive), 2026-10-25T07:09:32Z → 2026-10-25T07:31:05Z. Pilote [OD-2026-10-24-B](PLAYABLE_FLOW_SPRITES_VFX_DIRECTION_2026-10-24.md), côté Claude (étape P2 d’[OD-2026-10-25-A](CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md)).

`NarrativeSceneSurface` sait animer un acteur par frames (`src/cinematics/NarrativeActorFrames.ts`). Une seule horloge par surface. Le master V2 reste affiché pendant le chargement, sur échec et en mouvement réduit (OS ou jeu). La boucle s’arrête quand la page est cachée ou au démontage, et tout est libéré au dispose. Aucun état en V6. Le registre est vide : aucun tableau ne change tant que les frames d’Alistair n’existent pas.

npm test : 161 fichiers vitest, 2833 tests, puis node:test 26/26 ; tsc, build, contrats et validateur de mise en scène verts. Revues narrative-tableau et combat-vfx-sprites sans point bloquant.

Contrats 1.10.0 et baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` inchangés. Scheduler PAUSED, réglages inchangés. `main` protégé.

UNE prochaine action : Côté opérateur : lancer la session Codex dédiée qui produit tools/characters/candidates/alistair-idle/v1/ selon docs/autonomy/PLAYABLE_FLOW_SPRITES_VFX_DIRECTION_2026-10-24.md : quatre frames traitées en PNG séparés, 512×512, même ancrage des pieds que le master, avec provenance. Ensuite côté Claude : ajouter la liaison CAMP_DEPARTURE_TABLEAU / CAMP_DEPARTURE / alistair (avec le master attendu) à NARRATIVE_ACTOR_FRAME_BINDINGS, vérifier la boucle à taille de jeu, sans flash et face au miroir, soumettre la comparaison à l'opérateur, puis une action combat complète d'Alistair.

Compteurs : {"runtimeSourceFilesModified":2,"runtimeSourceFilesAdded":1,"gameplayFilesModified":0,"testFilesModified":1,"newMedia":0,"imagegenCalls":0,"qaScenarios":1,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":3,"productProgress":1}. Handoff : [2026-10-25T0709Z-claude-frame-player.md](handoffs/2026-10-25T0709Z-claude-frame-player.md). Publication normale sur origin autorisée par OD-2026-10-12-A.

<!-- QA_JOBS_START -->
## Live QA jobs

- video-retirement-opening-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-host-2258: FAILED; port 5463; receipt `tmp/cinematics/retirement-opening-host-2258/qa-job.json`; NOT_ACCEPTED
- video-retirement-opening-poi-2258: SUCCEEDED; port 5463; receipt `tmp/cinematics/retirement-opening-poi-2258/qa-job.json`; ACCEPTED_SCOPED_PC1366_NATIVE_VIDEO_RETIREMENT
<!-- QA_JOBS_END -->
