# Priorité aux actions de combat et au Composer VFX — OD-2026-10-25-B

Run claude-vfx-priority-20261025T0814Z (agent claude, session interactive). L'opérateur réoriente la production vers le Composer VFX et les actions de compétence du combat tactique et du Combat Stage. Aucun code, test, média ni contrat modifié.

## Résultat

- [Décision](../COMBAT_VFX_PRIORITY_OPERATOR_DECISION_2026-10-25.md) consignée :
  - pilote narratif Alistair en pause, lecteur livré et inerte (`3e036189`) ;
  - aucune session Codex demandée pour `alistair-idle/v1` ;
  - Bois-Clair passe après les actions de combat.
- [Rapport de couverture](../../reports/combat-vfx-coverage-2026-10-25.md), vérifié par une sonde `vite-node` non commitée :
  - 34 actions de démo dans le lab ; 3 affichent leur effet (`w_charge`, `w_salvation`, `ni_shadow_step`) ;
  - les 31 autres pointent vers des planches retirées par R2C-C-1, que `VfxSystem` saute ;
  - `actionHasSpritesheetVfx` supprime en plus le repli procédural pour ces 31 actions ; 13 n'ont plus rien de visible venant de leur preset ;
  - registre publié vide ; poses `dash`, `attack` et `cast` jamais appliquées sans étape de mouvement publiée.
- `AGENTS.md`, protocole §9, registre des décisions et index des rapports alignés.

## Prochaine action

Lot 0 :
- dans `legacyCombatRuntime.js`, `actionHasSpritesheetVfx` ne compte que les planches résolues, pour que `castTelegraph` revienne ;
- un test garantit que chaque action de démo affiche une planche résolue ou le repli ;
- corriger `combatFacts.vfxBasePresent`.

Puis lot 1 (contact) dans le Composer. Mode d'auteur à confirmer par l'opérateur ; recommandation : Claude compose et publie des brouillons, l'opérateur garde l'acceptation artistique.

Compteurs : {"runtimeSourceFilesModified":0,"gameplayFilesModified":0,"testFilesModified":0,"newMedia":0,"imagegenCalls":0,"qaScenarios":0,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":9,"taskReports":1,"productProgress":0}. Publication normale sur origin autorisée par OD-2026-10-12-A.
