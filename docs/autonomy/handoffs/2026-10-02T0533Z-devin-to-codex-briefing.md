# Briefing Devin vers Codex

Date : 2026-10-02, vers 05:35Z. Auteur : Devin, session interactive de l'opérateur. Destinataire : l'agent Codex du run récurrent `rpgthreejs-auto-dev-90m`. À lire avant de reprendre : ce document dit ce qui s'est passé pendant ton interruption, ce qui est nouveau dans le dépôt, qui collabore désormais avec toi et ce que tu fais à ta prochaine exécution.

## Qui collabore avec toi

Devin travaille dans le même dépôt (`C:\Users\miche\Documents\Projects\RPGThreeJS`), sur la même machine, à la demande de l'opérateur. Il n'est pas récurrent : il intervient en sessions interactives. Il respecte le même verrou `.git/codex-autonomy.lock`, signe ses commits `Agent: devin; Run: <id>`, ne génère aucun média, n'invente aucun canon et ne modifie aucun contrat LOCKED. Il ne modifie pas tes fichiers d'état tant que tu peux reprendre : ses notes vont dans `docs/autonomy/handoffs/`.

## Ce qui s'est passé pendant ton interruption

- Ton run démarré à 2026-10-02T03:38:51Z (pid 19168, tâche « CINEMATIC-STRUCTURE-READINESS: OS reduced motion production QA ») s'est arrêté après son heartbeat de 03:47:09Z. L'automation a ensuite été trouvée en `PAUSED` (modifiée à 04:57:15Z).
- Ton travail non commité est intact dans l'arbre de travail : 11 fichiers modifiés (dont `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json`) et `src/ui/ReducedMotion.ts` non suivi. Devin n'y a rien changé : les octets sont identiques à ton instantané.
- Instantané de secours : `a0b75148ca55207a6b59da2f05f912b435ce2e44` sur `origin/wip/rpgthreejs-auto-dev-90m-20261002T0338` (parent `1256f34`). Supprime cette branche quand le commit cohérent sera sur `dev`.
- Vérifié par Devin, en ciblé : les 4 suites touchées 80/80, `tsc --noEmit` OK, `contracts:validate` OK. Non lancé : suite complète, build, QA navigateur.
- Séquence de Devin à 05:33Z : heartbeat de 106 minutes, pid mort, automation en pause, aucune activité Codex ni process QA, donc verrou périmé selon la règle des 105 minutes. Il l'a archivé en `.git/codex-autonomy.abandoned-20261002T0338.json`, a pris son propre verrou (`runId` `devin-20261002T0533-agents-integration`), a fusionné en fast-forward la branche `devin/agents-wave1` dans `dev` (22 fichiers neufs, aucun chevauchement avec ton travail), puis a ajouté ce briefing. `origin/dev` est poussé et le verrou de Devin est libéré juste après ce commit : vérifie qu'il n'existe pas de `.git/codex-autonomy.lock` et lis `git log origin/dev`.

## Ce qui est nouveau dans le dépôt (lis dans cet ordre)

1. `AGENTS.md` : point d'entrée commun (autorité, lignes rouges, carte du dépôt, commandes, spécialistes).
2. `docs/autonomy/OPERATOR_DECISIONS.md` : registre des décisions opérateur en vigueur, la plus récente prime.
3. `docs/autonomy/MULTI_AGENT_PROTOCOL.md` : les règles stables de ton prompt (verrou, budget, checkpoint, crédits, matrice) et les ajouts marqués NEW.
4. `.agents/skills/` (6 fiches) et les spécialistes en lecture seule : `.codex/agents/` pour toi, `.agents/agents/` pour Devin. Tu ne les utilises que si tu les nommes explicitement. Les agents de projet `.codex/agents` ont un bug signalé (openai/codex#26408) ; repli : `~/.codex/agents/`. Les fiches restent utilisables sans sous-agents.
5. `docs/autonomy/handoffs/` : notes des agents qui ne détiennent pas le verrou.

## Ce qui change pour toi

- Aucune règle LOCKED modifiée, aucun de tes fichiers d'état touché. Ton prompt reste valable : le protocole le prolonge sans le relâcher.
- Nouveautés opérationnelles : champs du lock `runId`, `agent`, `threadId`, `wip` ; archivage du lock périmé ; instantané WIP vers `wip/<runId>` après chaque sous-tâche verte et au moins toutes les 10 minutes ; bloc « live » dans l'état à chaque instantané ; trailer de commit `Agent: codex; Run: <runId>` ; notes de handoff pour les non-propriétaires.
- Seuil de péremption du lock inchangé (105 minutes). Un autre agent ne le prend plus tôt que sur ordre explicite de l'opérateur. Si le verrou de Devin est récent, tu t'arrêtes avec `SKIPPED_ACTIVE_RUN`.
- La liste de conformité de ton prompt omet UI / ACCESSIBILITY : garde cette ligne.

## À ta prochaine exécution

1. Vérifie l'absence de verrou et acquiers le tien avec le schéma canonique.
2. Reprends l'arbre de travail tel quel, sans `reset` ni `clean`. L'état MD/JSON qu'il contient est le tien.
3. Termine l'acceptation de l'item 8 : QA en build de production du reduced-motion OS seul (réglages graphiques normaux) à travers les huit slots, choix retenus, sauvegarde et reprise. Puis état à jour, commit cohérent avec trailer, push `origin/dev`.
4. Mets à jour ta mémoire d'automation et note ici ce que tu as adopté ou refusé.
5. Le raccourcissement du prompt (annexe A du protocole) est une décision de l'opérateur, pas la tienne.

## Limites connues

- Les profils de sous-agents n'ont pas pu être testés en conditions réelles (chargement côté Devin et côté Codex).
- Il n'y a pas de CI : toutes les barrières sont locales. Barrière LOCKED : `git diff --exit-code b1e8858 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`.
