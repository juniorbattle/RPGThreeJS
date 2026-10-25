# Documents d'entrée à jour — N5 terminé

Run claude-entry-docs-20261025T0503Z (agent claude, session interactive). Tâche N5 d'[OD-2026-10-25-A](../CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md). Documentation seulement : aucun code, test, média ni contrat modifié.

## Résultat

- AGENTS.md : les sections périmées « Active POI migration priority », « Preserved manual-playtest priority », « Historical illustrated direction » et « Current retirement » sont remplacées par « Current priority », l'ordre réel de reprise, et « Standing constraints », les règles encore actives qu'elles contenaient (retrait vidéo, production POI, attente du playtest Lot E, produit d'abord, constats manuels, scheduler, amendements). La ligne rouge qui autorisait encore les montages illustrés reflète désormais OD-2026-10-24-A.
- `MULTI_AGENT_PROTOCOL.md` §9 : la priorité courante suit OD-2026-10-25-A au lieu d'OD-2026-10-16-A. Le nettoyage y est décrit comme un travail ordonné par l'opérateur, pas comme une suite de diagnostics.
- `OPERATOR_DECISIONS.md` : un seul tableau continu de 51 lignes, sections « details » d'OD-2026-10-02-A/B placées après le tableau, les deux puces sans ID devenues des lignes (« — » pour l'ID, la source et le statut). Vérifié par script : aucune des 66 lignes d'origine n'est modifiée ou perdue.

## À savoir pour la suite

- La table des spécialistes d'AGENTS.md et la ligne « Waves » du §9 décrivent encore `traversal-engineer` et l'ancien rôle de `cinematics-journey` : c'est le périmètre de N4.
- Une session Codex a écrit dans `~/.codex/sessions` à 04:54 UTC sans toucher au dépôt ; le verrou était tenu par Claude.

## Prochaine action

N4 : archiver `traversal-engineer`, recentrer `cinematics-journey` sur Journey et NarrativeStage sans vidéo, rafraîchir les digests de `narrative-tableau` et `ui-accessibility`, la table de `contracts-compliance` et la liste d'outils de `qa-evidence`, créer un reviewer `combat-vfx-sprites` en lecture seule, ajouter les renvois `.claude/` vers `.agents/`, garder la parité `.codex/`, puis mettre à jour la table des spécialistes d'AGENTS.md et la ligne « Waves » du §9.

Compteurs : {"runtimeSourceFilesModified":0,"gameplayFilesModified":0,"testFilesModified":0,"newMedia":0,"imagegenCalls":0,"qaScenarios":0,"newQaJobs":0,"inheritedQaJobs":365,"inheritedWipPaths":0,"workflowFiles":6,"productProgress":0}. Publication normale sur origin/dev autorisée par OD-2026-10-12-A.
