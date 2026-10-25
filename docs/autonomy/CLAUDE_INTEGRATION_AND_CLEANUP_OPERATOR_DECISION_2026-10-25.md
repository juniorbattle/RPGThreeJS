# Intégration de Claude Code et nettoyage avant reprise

**OD-2026-10-25-A — décision opérateur explicite, 25 octobre 2026 (America/Toronto).** Fiche d'arbitrages remplie par l'opérateur entre 04:01 et 04:05 UTC, puis confirmée dans la conversation : « J'ai rempli la fiche d'arbitrages, relis mes choix et consigne-les. »

Origine : audit en lecture seule de Claude Code sur `dev@879eaf3d80c834942034e24548b4dedd1b5a9ac4` (24 octobre 2026). Contrats set 1.10.0, baseline immuable `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` : inchangés. Aucun contrat LOCKED ne nomme les agents ; cette décision ne demande donc aucun amendement.

## Constats de l'audit qui motivent la décision

- Le protocole ne connaissait que Codex et Devin. L'automation `rpgthreejs-auto-dev-90m` est enregistrée PAUSED.
- `npm test` est rouge : vitest n'exclut pas `tmp/` et ramasse 381 fichiers de test copiés. Sur `src/` seul, 51 tests sur 2 636 échouent dans 13 fichiers : 29 viennent de `combatCue`, ajouté au runtime de combat par `06a59c48` sans mise à jour des harnais de `combatKeyboard.test.ts` et `unitMotion.test.ts` ; une quinzaine vérifient une doctrine retirée ; 6 échecs de `refugeHubContinuity.test.ts` restent à diagnostiquer.
- `AUTONOMOUS_WORK_STATE.json` pèse 2,4 Mo (119 clés, 365 jobs QA dont 15 encore marqués RUNNING depuis début octobre).
- 13 branches `wip/*` locales (12 sur origin), non mergées. Plusieurs profils et skills décrivent des sous-systèmes retirés (Traversal physique, huit vidéos actives).

## Décisions

| ID | Sujet | Choix de l'opérateur |
| --- | --- | --- |
| A1 | Rôle de Claude | Claude est l'écrivain principal des sessions interactives tant que l'automation reste en pause. Codex travaille sur demande, jamais en même temps, sous le même verrou. |
| A2 | Identité technique | Valeur `agent` = `claude` dans le verrou existant `.git/codex-autonomy.lock` (nom et schéma inchangés). runId `claude-<sujet>-<YYYYMMDDTHHMMZ>`. Trailer `Agent: claude; Run: <runId>`, suivi de la ligne `Co-Authored-By` de Claude. |
| A3 | Branches | Règle du projet : `dev` et branches temporaires issues de `dev` seulement. `main` n'est jamais poussé, mergé ni visé par une PR automatique. La règle de merge vers `main` du CLAUDE.md global de l'opérateur ne s'applique pas à RPGThreeJS. |
| A4 | Serveurs | Mode mixte : `preview_start` et `.claude/launch.json` pour le serveur de dev et les vérifications visuelles ; les drivers Playwright du projet gardent leur propre serveur, inscrit dans `live.qaJobs`. Aucun driver réécrit. Un processus orphelin n'est jamais arrêté par Claude : son port et son PID sont signalés à l'opérateur. |
| A5 | Rythme interactif | Protocole allégé pour les sessions interactives (détail ci-dessous). |
| P1 | Ordre de reprise | Base de tests et état d'abord, puis le pilote Alistair. |
| P2 | Frames d'Alistair | Une session Codex dédiée produit les quatre frames ; Claude écrit le lecteur d'animation et ses tests, avec le master fixe comme fallback. |
| N1 | Tests | Réparation complète : exclure `tmp/`, `dist/` et `output/` de vitest ; fournir `combatCue` aux harnais ; mettre à jour chaque test de doctrine retirée qui garde une frontière vivante, retirer avec mention au rapport celui qui ne certifie que l'ancienne doctrine ; diagnostiquer `refugeHubContinuity`. Revue contracts-guardian pour les tests qui certifient des frontières sensibles. |
| N2 | État d'autonomie | Copier l'état actuel à l'identique dans `docs/autonomy/archive/`, puis compacter l'état courant aux champs exigés par le protocole et aux jobs utiles. Les 15 jobs RUNNING passent à `ORPHANED_UNVERIFIED` dans l'archive, reçus intacts. `live.qaJobs` reste compatible avec `tools/qa/qa-job.mjs`. |
| N3 | Branches WIP | Tag `archive/wip/<nom>` sur chaque pointe, locale et origin (les deux versions de la branche divergente comprises), tags poussés, puis suppression des branches. Aucun commit perdu, y compris le travail clavier préservé par OD-2026-10-03-A. |
| N4 | Agents et skills | Mise à jour complète : archiver `traversal-engineer`, recentrer `cinematics-journey` sur Journey et NarrativeStage sans vidéo, rafraîchir les digests et la table de `contracts-compliance`, corriger `qa-evidence`, créer un reviewer `combat-vfx-sprites` en lecture seule, ajouter dans `.claude/` des renvois vers `.agents/`. Mêmes changements dans `.codex/` pour garder la parité. |
| N5 | Documents d'entrée | Mettre à jour `AGENTS.md` et le §9 du protocole multi-agents sur la priorité réelle ; réparer la mise en forme de ce registre sans changer le texte d'aucune entrée. |
| N6 | Espace disque | Ne rien supprimer pour l'instant. Les reçus QA de `tmp/` restent référencés ; l'historique Git n'est pas réécrit. |
| N7 | Contrats | Consolidation rédactionnelle reportée, à reconsidérer avant la passe mobile ou la remise au playtest. |

### Note de l'opérateur sur P2

Texte saisi dans la fiche : « tu peux recuperer generate2dsprite et uiliser api image open ai au pire si tu veux avoir full control ».

Cette note ouvre une solution de repli si la session Codex ne suffit pas. Avant de l'utiliser, Claude confirme dans la conversation l'installation de l'outil et l'usage de la clé API. Claude ne lit jamais `.env*` ni un jeton : la clé est fournie par l'environnement de l'opérateur. La provenance du candidat suit `PLAYABLE_FLOW_SPRITES_VFX_DIRECTION_2026-10-24.md` (requête exacte, sources et SHA, brut, frames traitées, comparaison), sous `tools/characters/candidates/alistair-idle/v1/`.

## Protocole interactif de Claude (A5, A4)

- Préflight `autonomy-handoff` en lecture seule, puis verrou exclusif atomique avec `agent: "claude"`. Claude Code n'a pas de processus de run durable : `pid` vaut `null` et `threadId` nomme la session Claude Code.
- Le battement du verrou est mis à jour à chaque étape, avant et après toute opération longue. La règle des 105 minutes reste valable pour les autres agents.
- Un commit poussé sur `origin/dev` après chaque sous-tâche verte (publication autorisée par OD-2026-10-12-A). Snapshot WIP seulement avant une opération longue ou risquée. Pas de budget de 75 minutes.
- Clôture inchangée : état MD/JSON cohérent, handoff daté sous `docs/autonomy/handoffs/`, push vérifié, puis libération du verrou.
- Serveur de dev par `preview_start` ; drivers QA en arrière-plan avec leur propre serveur et leur job `live.qaJobs`. Aucun `taskkill`, `Stop-Process` ni scan système des processus.

## Ordre d'exécution

1. N1, base de tests, avec revue contracts-guardian.
2. N2, archivage et compactage de l'état.
3. N5, documents d'entrée et forme du registre.
4. N4, agents, skills et renvois `.claude/`.
5. N3, tags d'archive puis suppression des branches WIP.
6. P2, lecteur d'animation par Claude ; frames par une session Codex que l'opérateur lance.

N6 : aucune suppression. N7 : plus tard.

## Ce qui ne change pas

Contrats LOCKED et constitution, canon, V6, propriétaires de vérité, zéro vidéo active, audio différé hors exceptions accordées, protection de `main`. Le statut PAUSED du scheduler, sa cadence de 90 minutes et ses autres réglages restent tels quels : Claude ne l'active jamais. Aucune acceptation artistique ni playtest global n'est inféré.

## Exécution

- N1 : base de tests réparée, `6b6cb95e` ([rapport](../reports/test-baseline-repair-2026-10-25.md)).
- N2 : état archivé et compacté, `c675e5cd` ([archive](archive/README.md)).
- N5 : documents d'entrée à jour, `f19df89c`.
- N4 : agents et skills à jour, renvois `.claude/`, `14ea4e2d`.
- N3 : branches WIP archivées en 13 tags `archive/wip/*` puis supprimées ([inventaire](archive/WIP_BRANCHES_2026-10-25.md)). Correctif du constat d'audit : il y avait 12 branches `wip/*` locales et 11 sur origin, et non 13 et 12.
