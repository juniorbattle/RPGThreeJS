# Base de tests réparée — N1 terminé

Run claude-test-baseline-20261025T0411Z (agent claude, session interactive). Tâche N1 d'[OD-2026-10-25-A](../CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md). Rapport : [test-baseline-repair-2026-10-25.md](../../reports/test-baseline-repair-2026-10-25.md).

## Résultat

`npm test` est vert : vitest 160 fichiers / 2 814 tests, puis `node --test tools/qa/qa-job.test.mjs` 25/25. tsc, build, `contracts:validate`, barrière LOCKED et `git diff --check` passent. Aucun comportement joué n'a changé : seuls des tests, la config vitest, le script `npm test` et l'outil de portée VFX `DemoVfxActionScope.ts` (élites mobiles du Lot E comptées comme atteignables) ont bougé.

## À savoir pour la suite

- `npm test` n'inclut plus `tmp/`, `output/`, ni les 8 tests historiques de la chaîne cinématique listés dans `vite.config.ts` (`HISTORICAL_CINEMATIC_TESTS`). Ces fichiers restent intacts ; le rapport donne la couverture courante des frontières qu'ils touchaient.
- Les harnais de `combatKeyboard.test.ts` et `unitMotion.test.ts` découpent `legacyCombatRuntime.js` : toute nouvelle fonction appelée dans ces tranches doit être fournie au harnais.
- Les `GameApp` partiels des tests doivent fournir `soundSettings` et `uiSounds`.
- Revue contracts-guardian : PASS_WITH_NOTES, notes F1–F5 appliquées.

## Prochaine action

N2 : copier `AUTONOMOUS_WORK_STATE.json` à l'identique dans `docs/autonomy/archive/`, compacter l'état courant aux champs du protocole et aux jobs utiles, passer les 15 jobs RUNNING fantômes en `ORPHANED_UNVERIFIED` dans l'archive, garder `live.qaJobs` compatible avec `tools/qa/qa-job.mjs`.

Compteurs : {"runtimeSourceFilesModified":0,"toolingSourceFilesModified":1,"gameplayFilesModified":0,"testFilesModified":12,"configFilesModified":2,"newMedia":0,"imagegenCalls":0,"qaScenarios":0,"newQaJobs":0,"inheritedQaJobs":365,"inheritedWipPaths":0,"workflowFiles":5,"productProgress":0}. Publication normale sur origin/dev autorisée par OD-2026-10-12-A.
