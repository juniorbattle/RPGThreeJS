# Ligne d'arrivée de la démo

**OD-2026-10-25-C — décision opérateur explicite, 25 octobre 2026 (America/Toronto).**

Contexte. L'opérateur constate deux choses : Claude manque de précision pour composer les effets, et le projet prend beaucoup de temps pour une démo. Il accepte les deux propositions de Claude :
- noter qu'il compose lui-même les effets ;
- alléger le protocole des sessions interactives.

Il demande une ligne directrice compréhensible pour finir le jeu. Ses mots : « il y a 3 choses qui manquent le dynamisme de nos unites/personnages dans le jeu donc ajouter peut etre animation, les vfxx d'action/competences en combat, et enfin la musique » ; « on doit pas se perdre dans une conception trop longue ».

Ce document est **la direction courante de la démo**. Les directives empilées dans `DEMO_COMPLETION_PLAN.md` et les décisions plus anciennes restent de l'historique, sauf les lignes rouges d'`AGENTS.md`.

Contrats set 1.10.0 et baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` inchangés.

## 1. L'opérateur compose les effets

- **Qui compose.** L'opérateur compose et publie les effets d'action dans le Composer VFX (`?vfxlab=1`). Ce choix remplace le mode « Claude compose » d'OD-2026-10-25-B.
- **Ce que fait Claude.** Il ne compose, ne publie ni ne retouche plus aucun effet sans demande précise de l'opérateur. Deux exemples de demande : un bug du lab, un réglage d'outil.
- **Les 31 publications de Claude restent des brouillons.** L'opérateur peut les reprendre dans le lab, les republier par-dessus, ou les effacer avec RESET ALL.
- **Ce qui reste en place.** Les trois pilotes, le repli procédural et les deux corrections du runtime (`playActionVfxAt`, effet du dash).

## 2. Protocole allégé des sessions interactives

Ces règles remplacent, pour les sessions interactives de Claude, les obligations de `MULTI_AGENT_PROTOCOL.md` §3 et §4. Les runs récurrents de Codex ne changent pas.

**Ce qui reste**, parce que ça protège vraiment :
- **Verrou et préflight court.** L'arbre est propre, `dev` est à parité avec `origin/dev`, et aucun verrou vivant n'appartient à un autre agent.
- **Contrats.** Le gate LOCKED (`git diff --exit-code da69ec63… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`) et `npm run contracts:validate` tournent avant chaque push.
- **Vérité et sauvegardes.** Les règles d'`AGENTS.md` sur la vérité de jeu et la V6 s'appliquent toujours, de même que `main` jamais touché et les secrets jamais lus.
- **Tests.** Les tests ciblés et `npx tsc --noEmit` tournent à chaque commit. `npm test` et `npm run build` tournent en fin de chantier, ou quand un commit touche le runtime de combat ou les sauvegardes.
- **Commits.** Chaque commit garde son trailer `Agent: claude; Run: …` et est poussé sur `origin/dev`.

**Ce qui disparaît :**
- l'état JSON et MD mis à jour à chaque commit ;
- un compte rendu daté à chaque commit ;
- les addenda de documents de décision pour chaque petite avancée ;
- le heartbeat à chaque étape.

**Quand l'état est mis à jour.** L'état (`AUTONOMOUS_WORK_STATE`) est mis à jour quand la prochaine action change :
- en fin de chantier ;
- quand l'opérateur change de cap ;
- quand une session s'arrête en laissant du travail ouvert.

Le contrat LOCKED `AUTONOMOUS_WORK_PROTOCOL.md` exige seulement que cet état dise la vérité courante. Le présent protocole y répond.

**Quand un compte rendu daté (`handoffs/`) est écrit :** seulement pour passer la main à Codex ou Devin, ou à la fin d'un des trois chantiers ci-dessous.

## 3. Les trois chantiers qui finissent la démo

Le jeu existe déjà :
- campagne et choix qui se répercutent ;
- finances et réputation ;
- 33 POI ;
- combat tactique et Combat Stage ;
- sauvegardes.

Il manque trois choses de ressenti, dans cet ordre.

| Chantier | Qui | Contenu | Fini quand |
| --- | --- | --- | --- |
| **A. Effets d'action et de compétence** | l'opérateur, dans le lab ; Claude sur demande | Les 34 actions de démo, puis les retours génériques encore servis par le repli procédural : attaque de base ennemie (`attack`), objets (`item`), K.O., critique, `generic_hit`. | L'opérateur accepte les effets d'un combat de démo complet. |
| **B. Dynamisme des unités** | Claude | **B1.** Une respiration légère des unités au repos, en vue tactique et dans le Stage, décalée d'une unité à l'autre et coupée en mouvement réduit. **B2.** Une vérification, en vue tactique, que les réactions existantes (coup reçu, K.O., pas, bond, recul) se voient bien ; correction là où elles manquent. Présentation seulement, avec l'art actuel (108 poses). | L'opérateur trouve que les unités vivent pendant un combat de démo. |
| **C. Musique** | Claude, avec les pistes choisies par l'opérateur | 4 ou 5 pistes en boucle : titre, carte, dialogue ou refuge, combat, boss. Fondu entre les contextes, volume et coupure séparés, désactivée par défaut avec déverrouillage au premier geste, comme les sons déjà livrés. | La musique suit les contextes et l'opérateur accepte les pistes. |

Les chantiers A et B avancent en parallèle : l'opérateur compose pendant que Claude fait B.

**Animation par frames (option B3).** Elle demande de l'art nouveau. L'opérateur ne la décide qu'après avoir vu B1 et B2. Le lecteur de frames existe déjà : `NarrativeActorFrames`, inerte.

**La musique demande un amendement de contrat.** Cinq contrats LOCKED la gardent DEFERRED : `COMBAT_AND_VFX`, `PRESENTATION_AND_MEDIA`, `UI_AND_ACCESSIBILITY`, `AUTHORING_AND_QA` et `AUTONOMOUS_WORK_PROTOCOL`. Le chantier C commence par une tâche courte et dédiée, approuvée par l'opérateur : l'amendement set 1.11.0, sur le modèle de l'amendement des sons d'interface d'OD-2026-10-18. Deux questions restent ouvertes pour ce moment-là :
- d'où viennent les pistes : achat, bibliothèque libre de droits ou fichiers de l'opérateur ;
- la liste exacte des contextes.

Claude ne génère pas de musique.

**Après les trois chantiers :** playtest PC de l'opérateur, liste de corrections, puis démo figée. Le passage mobile vient ensuite seulement si l'opérateur le veut.

## 4. Gelé jusqu'à la fin des trois chantiers

Rien de ce qui suit ne démarre sans demande de l'opérateur :
- le pilote narratif Alistair (OD-2026-10-24-B) ;
- la finition relationnelle de Bois-Clair ;
- tout nouveau système ou nouveau contenu ;
- tout rééquilibrage (Lot E attend toujours le playtest) ;
- toute refonte d'art ;
- toute nouvelle fiche ou tout nouveau rapport qui n'est pas demandé.

Un défaut trouvé en jouant reste corrigeable à tout moment.

## Mise à jour — OD-2026-10-29-A, 29 octobre 2026

L'opérateur a mené, dans une session cloud, la refonte de la présentation du combat (branche `claude/combat-scenes-pixel-art-1v60j4`, [contrat de présentation](../combat/COMBAT_HD2D.md), [rapport](../reports/combat-hd2d-1.md)) :
- arènes HD-2D procédurales ;
- unités en feuilles pixel animées (repos, déplacement, élan, attaque, sort, coup reçu, K.O.) ;
- caméra d'action et projecteur dans l'arène, à la place du Combat Stage, retiré ;
- effets procéduraux pondérés par le coût en PA.

Il a ensuite choisi, dans la session Claude Code :

1. **Effets en combat : procédural seul.** Le combat joue les recettes procédurales, y compris aux atterrissages, téléportations et arrivées du dash. Les publications du Composer ne jouent plus en combat. Le chantier A n'est plus de composer dans le lab : c'est la revue des recettes procédurales, avec retouches sur demande.
2. **Sons : ceux de `dev`.** Le système autorisé par contrat (16 familles, coupé par défaut, déverrouillé au geste) reste le seul branché. Le module de sons synthétisés et l'ambiance par biome de la branche restent dans le dépôt, non branchés, en attente de l'amendement set 1.11.0, qui couvrira aussi la musique.
3. **Portage sur `dev` tout de suite.** La branche partait de `main`, qui a 435 commits de retard. Aux conflits, `dev` garde :
   - le clavier tactique ;
   - le libellé de sauvegarde de la campagne ;
   - le propriétaire audio et la préférence de mouvement réduit.

**Conséquences pour la ligne d'arrivée :**
- **Chantier B en grande partie livré** par les animations pixel. Reste la revue de l'opérateur en jeu.
- **Chantier C inchangé**, sinon que l'amendement set 1.11.0 traitera ensemble la musique, les sons synthétisés et l'ambiance.

**Lecture du contrat.** `COMBAT_AND_VFX.md` décrit le Combat Stage comme présentation seulement, et demande de préserver les identités de poses du Character System V2 et le cadrage authored.
- Le retrait du Stage n'enlève aucune vérité de jeu.
- Les feuilles pixel dérivent des poses V2, et les masters restent l'autorité narrative.
- La caméra d'action remplace le cadrage du Stage. L'amendement set 1.11.0 devra le dire explicitement.

## Mise à jour — OD-2026-10-30-A, 30 octobre 2026

L'opérateur renonce aux animations image par image des héros (option B3) : « finalement de ce que travailler et faire des animations des héros, 30 images car j,aime le resultat effectue avec les animations/mouvement par code fait sur tous les personnages ».

- Le chantier B est clos côté production : les animations et le mouvement par code, sur tous les personnages, sont retenus pour la démo.
- Les 30 images du lot héros de la mission locale ne seront pas générées.
- Les 6 plans d'arène et les 8 planches d'ultimes ne sont pas tranchés : ils restent optionnels, et aucune génération ne part sans accord de l'opérateur.
