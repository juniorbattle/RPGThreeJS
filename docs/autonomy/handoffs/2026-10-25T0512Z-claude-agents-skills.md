# Agents et skills à jour — N4 terminé

Run claude-agents-skills-20261025T0512Z (agent claude, session interactive). Tâche N4 d'[OD-2026-10-25-A](../CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md). Documentation et configuration d'agents seulement : aucun code de jeu, test, média ni contrat modifié.

## Résultat

- `traversal-engineer` est archivé tel quel (`git mv`) dans `.agents/archive/traversal-engineer/` avec un README : le sous-système qu'il relisait a été retiré et ses fichiers source n'existent plus.
- `cinematics-journey` garde son nom (le prompt récurrent de Codex le nomme) mais relit désormais Journey, les huit identités historiques sans vidéo et les tableaux qui portent leurs moments. Les instructions d'emplacements vidéo, de holds et de montages illustrés sont retirées.
- `narrative-tableau` et `ui-accessibility` ont des résumés de contrat au set 1.10.0. `contracts-compliance` route TRAVERSAL vers la doctrine POI, décrit les contrôles réels du validateur et réduit les sections illustrées périmées à une ligne historique. `qa-evidence` décrit `npm test`, le mode retrait du driver cin6d6, l'archive des jobs et la règle des processus orphelins, et ne cite plus d'outil absent.
- Nouveau reviewer en lecture seule `combat-vfx-sprites` (profil Devin, agent Codex, skill), pour l'animation par frames, les poses, le mouvement, la Combat Stage, les VFX et les sons de combat.
- `.claude/agents/` et `.claude/skills/` exposent les 7 profils et 7 skills à Claude Code par des renvois vers les fichiers canoniques. `.claude/launch.json` lance le serveur de dev (`npm run dev`, port 5173 strict), vérifié par un démarrage et un arrêt réels.
- AGENTS.md (table des spécialistes, `docs/traversal/` historique) et le protocole multi-agents (§9 « Waves », matrice §10) sont alignés.
- Revue contracts-guardian : PASS_WITH_NOTES ; les cinq corrections demandées et les quatre optionnelles sont appliquées.

## À savoir pour la suite

- Le prompt récurrent de Codex ne nomme pas encore `combat-vfx-sprites` : l'y ajouter est une action de l'opérateur.
- Le chargement effectif des renvois `.claude/` par Claude Code se vérifiera à la prochaine session.
- Décompte réel des branches WIP pour N3 : 12 locales et 11 sur origin (l'audit avait annoncé 13 et 12).

## Prochaine action

N3 : poser un tag `archive/wip/<nom>` sur la pointe de chacune des 12 branches `wip/*` locales et des 11 distantes (pour la branche divergente `wip/rpgthreejs-auto-dev-90m-20261003T1600`, un tag par version), pousser les tags, vérifier qu'ils résolvent vers les mêmes commits, puis supprimer les branches locales et distantes.

Compteurs : {"runtimeSourceFilesModified":0,"gameplayFilesModified":0,"testFilesModified":0,"newMedia":0,"imagegenCalls":0,"qaScenarios":0,"newQaJobs":0,"inheritedQaJobs":365,"inheritedWipPaths":0,"workflowFiles":36,"productProgress":0}. Publication normale sur origin/dev autorisée par OD-2026-10-12-A.
