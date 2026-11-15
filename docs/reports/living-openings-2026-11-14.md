# Cinématiques dès la première seconde (2026-11-14)

| Champ | Valeur |
| --- | --- |
| TASK | `LIVING-OPENINGS` (run `claude-living-openings-20261115T0029Z`), décision [OD-2026-11-14-A](../autonomy/LIVING_OPENINGS_OPERATOR_DECISION_2026-11-14.md) |
| DOMAIN | Présentation : tableaux vivants (sets 1.13.0, 1.14.0, 1.20.0) et ouverture (OD-2026-11-02-A) |
| BASELINE | `0427b0c1` sur `dev` (jeu de contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | worktree `claude/distracted-mcnulty-85c496`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Les 20 tableaux vivants s'ouvrent sur un événement dès la levée du rideau et ne s'attardent plus sur les plans sans figure. Leurs durées passent de 20 à 32 s à 11 à 20 s. L'ouverture de 55 s ne change pas. Présentation seule : aucun champ de sauvegarde, aucune vérité de jeu, aucune image, aucun texte ni aucun personnage nouveau. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/OPERATOR_DECISIONS.md` (OD-2026-11-14-A), `docs/autonomy/LIVING_OPENINGS_OPERATOR_DECISION_2026-11-14.md`. Les mises en scène d'OD-2026-11-04-B et des tables du 2026-11-13 restent comme historique, et la nouvelle décision les remplace pour les durées et le plan 1 des arrivées. |
| EVIDENCE | Mesure par script avant/après (`tools/living-openings/`, résultat [`result.json`](living-openings-2026-11-14/result.json)). Tests ciblés (114), suite complète (5 échecs hérités de l'environnement du worktree, voir « Vérification »), `tsc`, build, `contracts:validate`, garde vide. Navigateur : labo QA dans trois modes de mouvement, et vrai déclenchement en jeu de l'audience d'Alaric dans les trois modes. |

## La demande

`APPROVED DECISION`. L'opérateur, le 2026-11-14 : « certaines provenant de la demo doient etre optimiser... par exemple des passage vide ou rien ne se passe au debut avant... on doit s'assurer que nos cinematics soient dynamique et nous montrent des choses interessant des le debut... certaines respectent cette structure ». Puis, pendant la préparation : « on ne doit pas etendre trop de temps sur ces parties car on a l'impression que rien ne se passe ». Il a rempli la fiche d'arbitrages et retenu toutes les recommandations, sans note. Ses choix, mot à mot, sont dans [la décision](../autonomy/LIVING_OPENINGS_OPERATOR_DECISION_2026-11-14.md).

## La mesure

`CURRENT FACT`. L'outil `tools/living-openings/probe.ts` charge les vrais scripts et le vrai lecteur dans le serveur de développement, puis les avance sur une horloge fixe à 30 images par seconde, en 1366 × 768. Il enveloppe `FigureCast.draw` et `ExtraCrowd.draw` pour relever chaque figure là où elle est dessinée, et ne compte que celles d'au moins 30 px de haut à l'écran. Il calcule aussi la vitesse de la caméra au coin de vue le plus rapide.

- **Événement** : une figure qui paraît ou marche, le vent qui monte, la lumière qui tourne, ou la caméra à 15 px/s au moins.
- **Creux** : plus de 2 s sans rien de nouveau, la caméra visible comprise.
- **Rideau** : il se lève entre 0,05 et 0,55 s, à chaque plan.
- **Ouverture** : ses figures sont dessinées par ses propres peintres, donc ses événements sont lus dans ses constantes (légendes, pillards, aqueduc, héros), et sa caméra est mesurée de la même façon.

Les modèles, qui accrochent dès la première image :

- **L'ouverture.** La bannière bat dès l'image 1 et la légende vient à 0,9 s. Dans les Sceaux, la légende vient à 0,8 s et la caméra se voit à 1,6 s. Les pillards sortent dès l'image 1, les silhouettes de l'aqueduc aussi, et les héros entrent à 0,4 s. Il n'y a aucun creux, caméra comprise.
- **L'arrivée à Bois-Clair.** Des pillards passent dès 0,3 s, puis la compagnie entre. Aucun creux.

Avant et après, pour chaque tableau vivant. La colonne « 1er événement » donne un temps par plan, et « aucune » signifie aucune figure de tout le plan.

| Tableau vivant | Plans avant | 1er événement | 1re figure | Plus long creux | Plans après | 1er événement | 1re figure | Plus long creux |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arrivée à Bois-Clair | 9 + 14 = 23 s | 0,63 · 0,53 | 0,63 · 0,53 | 0 s | 6 + 14 = 20 s | 0,43 · 0,53 | 0,43 · 0,53 | 0 s |
| Bois-Clair sauvé | 20 s | 0,63 | 0,63 | 11,3 s | 12 s | 0,3 | 0,3 | 3,1 s |
| Bois-Clair sacrifié | 20 s | 0,83 | 0,83 | 9,6 s | 11 s | 0,3 | 0,3 | 2,1 s |
| Jugement d'Alaric | 10 + 18 = 28 s | 0,43 · 0,43 | 0,43 · 0,43 | 12,9 s | 6 + 10 = 16 s | 0,3 · 0,3 | 0,3 · 0,3 | 3,2 s |
| Audience d'Alaric | 10 + 16 = 26 s | 0,87 · 0,43 | aucune · 0,43 | 8,7 s | 6 + 11 = 17 s | 0,3 · 0,3 | 0,3 · 0,3 | 3,4 s |
| Fin de la poursuite Serpent | 12 + 20 = 32 s | 1,53 · 0,63 | aucune · 0,63 | 5,7 s | 5 + 14 = 19 s | 0,3 · 0,3 | aucune · 0,3 | 3,4 s |
| Fin de l'épreuve du Lion | 12 + 18 = 30 s | 1,6 · 0,43 | aucune · 0,43 | 16,0 s | 5 + 13 = 18 s | 0,3 · 0,3 | aucune · 0,3 | 3,4 s |
| Arrivée chez Borin | 10 + 16 = 26 s | 0,93 · 0,43 | aucune · 0,43 | 8,7 s | 6 + 11 = 17 s | 0,3 · 0,3 | 0,3 · 0,3 | 3,3 s |
| L'Ours, par l'honneur | 12 + 16 = 28 s | 1,73 · 0,63 | aucune · 0,63 | 3,2 s | 5 + 12 = 17 s | 0,33 · 0,3 | aucune · 0,3 | 0 s |
| L'Ours, par la force | 12 + 16 = 28 s | 1,23 · 0,43 | aucune · 0,43 | 14,0 s | 5 + 11 = 16 s | 0,23 · 0,3 | aucune · 0,3 | 3,2 s |
| Arrivée chez Kaelen | 10 + 16 = 26 s | 0,47 · 0,43 | aucune · 0,43 | 8,8 s | 6 + 11 = 17 s | 0,2 · 0,3 | 0,57 · 0,3 | 2,4 s |
| Le Dragon, par l'honneur | 12 + 16 = 28 s | 1,73 · 0,63 | aucune · 0,63 | 5,1 s | 5 + 12 = 17 s | 0,33 · 0,3 | aucune · 0,3 | 2,6 s |
| Le Dragon, par la force | 12 + 16 = 28 s | 1,73 · 0,43 | aucune · 0,43 | 14,0 s | 5 + 12 = 17 s | 0,33 · 0,3 | aucune · 0,3 | 3,8 s |
| Arrivée chez le Grand Inquisiteur | 10 + 16 = 26 s | 0,87 · 0,43 | aucune · 0,43 | 9,2 s | 6 + 11 = 17 s | 0,3 · 0,3 | 0,3 · 0,3 | 3,3 s |
| Le Scorpion, par l'honneur | 12 + 16 = 28 s | 1,73 · 0,63 | aucune · 0,63 | 6,3 s | 5 + 12 = 17 s | 0,33 · 0,3 | aucune · 0,3 | 2,7 s |
| Le Scorpion, par la force | 12 + 16 = 28 s | 1,93 · 0,43 | aucune · 0,43 | 14,0 s | 5 + 12 = 17 s | 0,37 · 0,3 | aucune · 0,3 | 3,5 s |
| La trahison | 14 + 16 = 30 s | 2,5 · 0,63 | aucune · 0,63 | 3,8 s | 6 + 12 = 18 s | 0,47 · 0,3 | aucune · 0,3 | 2,2 s |
| Avant les trois épilogues (même séquence) | 10 + 14 = 24 s | 0,77 · 0,63 | aucune · 0,63 | 0 s | 5 + 11 = 16 s | 0,2 · 0,3 | aucune · 0,3 | 0 s |

Écart corrigé le même jour : le plus long creux de « L'Ours, par la force » mesurait 4,1 s, à la fin de la terrasse, pour une règle à 4 s. Sur la réponse de l'opérateur « Oui, raccourcis-le », la terrasse passe de 12 à 11 s : le creux tombe à 3,2 s et le tableau dure 16 s. Mesure refaite sur les 20 tableaux : tous restent sous 4 s, le plus long étant « Le Dragon, par la force » (3,8 s). En jeu au labo QA, sans affichage, le tableau reste 17,3 s à l'écran rideau compris, en réglages par défaut comme en mouvement réduit émulé, sans erreur.

## Ce qui change

`CURRENT FACT`, livré sur `dev` :

- **Plans sans figure.** Ils passent de 10 à 14 s à 5 ou 6 s, sur le même trajet de caméra, qui se voit donc bouger dès la levée du rideau.
- **Arrivées.** Au plan 1 de l'audience d'Alaric et des trois arrivées des plateaux, le chef attend déjà devant son siège, avec ses gardes au loin. Côté code, c'est `cast: 'waiting'` dans `MomentShot` (`castOf`) : seuls ceux qui se tiennent déjà en place s'y montrent. Pour l'audience, le peintre reçoit Alaric et les gardes.
- **Vent d'ouverture.** `openingGust` (`livingAtmosphere.ts`) met le vent dans les étoffes peintes à la première image, quatre fois plus ample, puis il se calme en 2,5 s. Il s'applique au plan 1 des deux fins de route et de quatre issues de plateau (`openingGust: true`, ou l'argument `gust` d'`endingPainter`).
- **Entrées avancées.** Compagnie, chefs et figurants paraissent dès la levée du rideau, au lieu de 0,4 à 2,2 s. Les marcheurs des arrivées entrent à 0,3, 0,8 et 1,3 s. À Bois-Clair, les pillards du village sortent à 0,1, 0,9, 1,8 et 2,7 s.
- **Fins immobiles raccourcies.** Les plans de la compagnie durent 10 à 14 s au lieu de 14 à 20 s. Sur la terrasse de l'épreuve et dans la salle du jugement, la caméra recule jusqu'au zoom 1,0, pour que la fin bouge encore.
- **Trahison.** Le vent se lève à 5 s au lieu de 7 s, avant que Maelor s'avance.
- **Test.** `livingOpenings.test.ts` verrouille la règle : chaque plan montre une figure entrée avant 0,2 s, ou une caméra à 15 px/s au moins dès 0,45 s ; aucun plan sans figure ne dépasse 6 s ; le chef attend dès le plan 1 des arrivées ; le vent d'ouverture se calme.

Ce qui ne change pas :

- l'ouverture ;
- la place de Bois-Clair ;
- les faits des tables de moments approuvées ;
- les plafonds du contrat : toutes les durées baissent ;
- le rideau noir partagé ;
- le mouvement réduit : caméra fixe et figures en fondu, le vent restant animé.

## Vérification

- **Tests.** Les tests de `src/ui/living/`, `src/ui/opening/` et du branchement dans `GameApp` passent : 111 tests, plus le nouveau fichier. `npx tsc --noEmit` est propre. `npm run build` passe. `npm run contracts:validate` passe : 8 contrats, zéro vidéo active. La garde `git diff --exit-code 133814ba… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` est vide.
- **Suite complète.** `npm test` donne 3 575 réussis, 5 ignorés et 5 échecs. Les 5 échecs sont tous dans `tools/cinematics/` (`minimax_task_checkpoint`, `cin6c_p1_production`, `cin6ea3_pilot_e_regate`) : ce sont des tests de la chaîne vidéo retirée. Ils demandent `ffprobe` et des médias historiques ignorés sous `tmp/`, absents de ce worktree. Aucun fichier de `tools/` n'est touché, et ces échecs sont sans lien avec ce changement.
- **Labo QA**, en 1366 × 768, avec Playwright ([planche](living-openings-2026-11-14/qa-lab-three-modes.jpg)) :
  - les trois modes : réglages par défaut, mouvement réduit du jeu, et `reducedMotion: 'reduce'` émulé ;
  - quatre séquences : l'audience, la fin Serpent, l'arrivée chez Borin et la trahison ;
  - en défaut et en réduit émulé, le lecteur reste en mouvement normal, puisque le jeu ignore le système (audit final B8) ; avec le réglage du jeu, il passe en mouvement réduit, caméra fixe et figures en fondu ;
  - Passer ou Échap fait fondre la séquence en 0,7 s, sans coupure sèche ;
  - Bois-Clair sacrifié, joué en entier, dure 11,1 s ;
  - aucune erreur de page. Les seules erreurs de console sont des 403 sur les polices du `node_modules` parent, hors de la racine du worktree : c'est propre au worktree.
- **Vrai déclenchement en jeu**, dans les trois modes ([planche](living-openings-2026-11-14/in-game-audience.jpg)) :
  - le parcours : nouvelle chronique, ouverture inchangée (sa première seconde capturée, puis Passer), `acte_ouverture` et `camp_departure` cliqués, puis « Se rendre » sur l'Audience d'Alaric de la carte ;
  - le tableau vivant s'ouvre en direct avec Alaric visible à 0,6 s, dure 17 s (26 s avant), puis se fond en 0,7 s dans `lion_briefing` ;
  - aucune erreur de page.
- **Bandes avant/après** : [salle de l'audience avant](living-openings-2026-11-14/audience-hall-before.jpg) et [après](living-openings-2026-11-14/audience-hall-after.jpg), [lune de la fin Serpent avant](living-openings-2026-11-14/serpent-moon-before.jpg) et [après](living-openings-2026-11-14/serpent-moon-after.jpg).

Non vu :

- le temps réel avec le son sur le poste de l'opérateur ;
- les issues de plateau et les épilogues déclenchés en jeu (vus au labo et par la mesure) ;
- le rendu sur mobile.

## Fichiers

- **Produit (12)** : `src/ui/living/` (`alaricAudience.ts`, `bearMoments.ts`, `boisClairAftermath.ts`, `boisClairArrival.ts`, `dragonMoments.ts`, `finaleMoments.ts`, `lionJudgement.ts`, `livingAtmosphere.ts`, `plateauArrivals.ts`, `postDemoScenes.ts`, `routeEndings.ts`, `scorpionMoments.ts`).
- **Test (1)** : `src/ui/living/livingOpenings.test.ts`.
- **Outil QA (5)** : `tools/living-openings/` (`probe.ts`, `probe.html`, `measure.mjs`, `strips.mjs`, `table.mjs`).
- **Preuves** : `docs/reports/living-openings-2026-11-14/` (6 images, `result.json`).
- **Gouvernance** : la décision, l'index des décisions et ce rapport.
