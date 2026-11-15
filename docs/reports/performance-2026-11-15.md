# Performances de la Voie des Sceaux (2026-11-15)

| Champ | Valeur |
| --- | --- |
| TASK | `PERFORMANCE` (run `claude-performance-20261115T0534Z`), décision [OD-2026-11-15-A](../autonomy/PERFORMANCE_OPERATOR_DECISION_2026-11-15.md) |
| DOMAIN | Livraison et présentation : build de production, images, chargement du combat |
| BASELINE | `5369047f` sur `dev` (jeu de contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | worktree `claude/performance-2026-11-15`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | Pour le seul constat mémoire (environ 40 Mo par combat, M1) : [combat-memory-2026-11-15.md](combat-memory-2026-11-15.md), qui montre qu'il venait des tampons DevTools `Network` du pilote, pas du jeu. Le reste du rapport tient. |
| PRODUCTION_IMPACT | Le build de production ne contient plus 138 images que le jeu ne demande jamais, ni les PNG maîtresses de 29 grandes images peintes, que le jeu charge désormais en WebP qualité 95 à résolution identique. Le combat n'attend plus que les sprites des unités qu'il peut montrer, et son JavaScript ne porte plus les tables du lab VFX. Aucune image nouvelle ni retouche, aucun texte, aucun champ de sauvegarde, aucune vérité de jeu. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/OPERATOR_DECISIONS.md` (OD-2026-11-15-A), `docs/autonomy/PERFORMANCE_OPERATOR_DECISION_2026-11-15.md` |
| EVIDENCE | Pilote Playwright `tools/perf/measure-performance.mjs` sur le build de production, avant et après en A/B (sorties ignorées sous `tmp/perf/`). Test de garde `tools/build/productionExcludedPublicAssets.test.ts`, suite complète (5 échecs hérités de l'environnement du worktree), `tsc`, build, `contracts:validate`, validateur de mise en scène, garde vide. Limites dans « Ce qui n'est pas vérifié ». |

## La demande

`APPROVED DECISION`. L'opérateur, le 2026-11-15 : « ok qu'en est il de l'optimisation/performances du jeu ». La fiche d'arbitrages a été remplie (« Fiche remplie »), toutes les recommandations retenues, sans note. Ses choix, mot à mot, sont dans [la décision](../autonomy/PERFORMANCE_OPERATOR_DECISION_2026-11-15.md).

## La méthode

`CURRENT FACT`.

- **Build mesuré.** `npm run build`, puis `vite preview`. Le build d'avant est une copie de `dist/` au commit `5369047f`, servie sur un second port pour l'A/B.
- **Navigateur.** Chromium sans fenêtre, avec le vrai GPU du PC de l'opérateur (`--use-angle=d3d11`, « AMD Radeon 780M »). Écran simulé : 1463 × 800 px CSS à 175 %, comme l'écran 2560 × 1600 de l'opérateur.
- **Parcours.** Clics sur les vraies commandes du jeu : titre, dialogues avec les réponses du plan Respect, carte, refuge et ses services, déploiement automatique, actions du combat. Les sauvegardes V6 viennent du pilote QA de campagne (`tools/perf/make-perf-saves.ts`) et ne sont jamais modifiées.
- **Mesures.**
  - Intervalles `requestAnimationFrame` de la fenêtre (l'iframe du combat partage sa boucle d'image) et longues tâches.
  - Tas JS (CDP, après un GC forcé) et compteurs DOM.
  - Mémoire GPU estimée à partir des appels WebGL, mémoire des processus.
  - Octets réseau et requêtes en échec.
- **Machine au repos.** Le GPU intégré partage son énergie avec le processeur : sous charge CPU, les combats tombent de 60 à environ 40 images par seconde. Les deux côtés de l'A/B tournent donc l'un après l'autre, sans autre travail en parallèle.

## Avant : ce que la mesure a trouvé

`CURRENT FACT` (build `5369047f`).

- **Fluidité.** Machine au repos, tout tient 59 à 60 images par seconde : titre, ouverture, tableaux vivants, carte, refuge et trois combats (loups, Général Serpent, Brèche).
  - Deux à-coups uniques de 0,7 à 1 s, au premier dialogue et à la première ouverture de la Compagnie. La trace Chrome y montre 706 ms de compilation de shaders GPU pour un effet CSS (`FinishPaintRenderPass`).
  - Le premier clic ouvre le son en 350 ms, une fois par session.
- **Chargement.** Titre en 0,24 s pour 1,43 Mo (0,93 s en 4G, 2,0 s en 4G lente).
  - Le premier combat d'une partie reprise télécharge 19,1 Mo et n'est prêt qu'après 8,3 s, ou 19,8 s en 4G.
  - Ce combat attend 89 sprites (8,2 Mo) de toutes les unités du jeu.
- **Build.** `dist` pèse 317 Mo.
  - 138 images (89,5 Mio) n'y sont jamais demandées, et 33 autres (9,3 Mio) ne s'atteignent que par des replis inactifs.
  - 29 grandes images peintes chargées restent en PNG (86,3 Mio).
  - Le JS du combat pèse 2 424 Ko, dont 1,8 Mo de rapports JSON du lab VFX.
- **Mémoire.** Le tas JS revient à 7–8 Mo après chaque combat.
  - Le processus de rendu garde environ 40 Mo par combat : 279 → 530 Mo sur cinq combats, dans `partition_alloc`.
  - Une alerte mémoire critique n'y change rien. Ni le contexte WebGL (forcer sa perte) ni le son (le couper) n'en sont la cause.
- **Mobile (estimation).** 390 × 844 à densité 3, CPU ralenti 4 fois : titre 60 images par seconde, ouverture 54, combat ordinaire 28 (p95 67 ms), limité par le calcul. Le déploiement du boss n'a pas démarré dans la mise en page mobile avec le pilote.

## Ce qui a changé

`CURRENT FACT`.

1. **Images jamais chargées (P1).** `tools/build/production-excluded-public-assets.json` liste les 138 fichiers, groupés avec leur raison. `vite.config.ts` les retire de `dist/` après le build, comme les assets VFX locaux. Ils restent dans le dépôt : `tools/pixel-sprites/build_combat_sprites.py`, `build_far_plates.py` et des tests les lisent encore.
2. **WebP (P2).** `tools/art/convert_painted_png_to_webp.py` écrit le WebP de chacune des 29 images avec le réglage de l'après-démo (`atlas_layout.save_options` : qualité 95, méthode 6), même taille, sans retouche : 86,3 → 20,9 Mio.
   - Le jeu charge ces WebP : registre du pack de démo (chemin, URL et empreinte de 24 fiches), fiche de la veille de nuit, cartes du Lion, ouverture, tableaux vivants, figurants, refuges.
   - Les PNG restent comme maîtresses, parce que la chaîne d'art de l'après-démo les lit comme références (`tools/art/finalImagesStaging.ts`, registres de provenance). Elles sortent du build par la même liste.
3. **Sprites du combat (P3).** Dans une partie, le combat n'attend plus que les sprites des unités qu'il peut montrer :
   - la compagnie qu'on peut déployer ;
   - la formation et ses vagues ;
   - le boss, ses escortes et ses phases.

   Le reste se charge ensuite en arrière-plan. La sélection relit les fonctions de déploiement du combat lui-même (`encounterFoeDefs`, `bossEncounterDefs`, `campaignPhaseDefs`), qui servent aussi à faire apparaître les unités : aucune unité ne paraît sans son sprite. La taille d'un sprite ne dépend pas de l'ordre de chargement. Hors campagne et en QA de développement, le combat attend tout, comme avant.
4. **Lab VFX (P4).** Dans le build de production seulement, les trois tables JSON du lab VFX Composer sont lues comme des tables vides (`emptyVfxLabReportsInProduction` dans `vite.config.ts`). Le lab de développement garde les vraies tables.
5. **Garde.** `tools/build/productionExcludedPublicAssets.test.ts` vérifie trois choses :
   - chaque fichier exclu existe et chaque PNG maîtresse a son WebP ;
   - aucun décor de dialogue (75), aucun tableau de jalon, tableau vivant, plan de l'ouverture, plaque de refuge, carte du Lion ni pose de combat ne pointe vers un fichier retiré du build ;
   - chacun de ces fichiers existe.

## Après : avant et après en A/B

`CURRENT FACT`. L'ancien build (copie de `dist/` à `5369047f`) et le nouveau (`2780b5cc`) ont tourné l'un après l'autre, avec le même pilote, les mêmes sauvegardes et la même machine au repos.

**Build.**

| Mesure | Avant | Après |
| --- | ---: | ---: |
| `dist` | 317 Mo | 160 Mo |
| Images dans `dist` | 514 | 376 |
| PNG / WebP dans `dist` | 210,5 / 97,9 Mio | 37,9 / 115,6 Mio |
| JS du combat (brut / gzip) | 2 424 / 260 Ko | 722 / 210 Ko |
| JS du jeu (brut / gzip) | 1 098 / 205 Ko | 1 098 / 205 Ko |

**Chargement** (médiane de trois pour le titre ; « premier combat » : du chargement de la page jusqu'au combat prêt, partie reprise devant les loups, déplacements et rideaux compris).

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Titre, sans bridage | 124 ms, 1,26 Mo | 126 ms, 1,26 Mo |
| Titre, 4G (9 Mbit/s) | 914 ms, 1,43 Mo | 910 ms, 1,43 Mo |
| Titre, 4G lente (1,6 Mbit/s) | 2 024 ms, 1,27 Mo | 2 028 ms, 1,27 Mo |
| Premier combat, sans bridage | 9,5 s, 19,1 Mo (images 16,4 Mo) | 9,1 s, 13,8 Mo (images 11,1 Mo) |
| Premier combat, 4G | 19,2 s, 18,6 Mo | 15,4 s, 11,1 Mo |

Sans bridage, le temps du premier combat est surtout celui du parcours (clics, rideaux, construction de l'arène). En 4G, il baisse de 3,8 s :

- la carte du Lion passe de 4,1 Mo à 1,0 Mo, et le tableau de la route de 3,0 Mo à 0,7 Mo ;
- les sprites des autres unités arrivent après l'affichage du champ de bataille.

**Fluidité** (images par seconde ; p95 et pire intervalle en ms).

| Scène | Avant | Après |
| --- | --- | --- |
| Titre | 60 ; 16,8 ; 16,8 | 60 ; 16,8 ; 16,8 |
| Ouverture vivante | 60 ; 16,8 ; 16,8 | 60 ; 16,7 ; 16,8 |
| Premier dialogue (`acte_ouverture`) | 55,0 ; 16,7 ; 683 | 54,8 ; 16,8 ; 717 |
| Carte | 57,8 ; 16,8 ; 50 | 58,3 ; 16,8 ; 50 |
| Audience vivante d'Alaric | 60 ; 16,8 ; 16,8 | 60 ; 16,8 ; 16,8 |
| Refuge | 60 ; 16,7 ; 16,8 | 60 ; 16,7 ; 16,8 |
| Compagnie au refuge | 54,8 ; 16,7 ; 717 | 54,9 ; 16,7 ; 700 |
| Boutique au refuge | 60 ; 16,8 ; 16,8 | 60 ; 16,7 ; 16,8 |
| Combat des loups | 59,9 ; 16,8 ; 100 | 59,9 ; 16,7 ; 83 |
| Combat du Général Serpent | 59,8 ; 16,7 ; 117 | 59,9 ; 16,8 ; 117 |
| Combat de la Brèche | 60 ; 16,7 ; 33 | 60 ; 16,7 ; 17 |

- **Inchangé.** La fluidité ne bouge pas, ce qui était attendu : aucune option retenue ne touche au rendu.
- **Bruit écarté.** Un premier passage « après » du Général Serpent est tombé à 50 images par seconde, sans longue tâche JavaScript ni action différente. Trois passages de plus, après, avant puis après, donnent 59,9, 59,8 et 59,9 : la machine subissait une charge extérieure.
- **À-coups uniques.** Ceux du premier dialogue et de la Compagnie restent tels quels (F2).

**Mémoire.**

- **Tas JS.** Il reste à 6–8 Mo hors combat et à 27–32 Mo en fin de combat, des deux côtés.
- **Processus de rendu.** Sa mémoire est un peu plus basse après, de 25 à 55 Mo selon le point de contrôle : 472 → 416 Mo au refuge du parcours, et 461 → 434 Mo en fin de combat du Général Serpent.
- **Croissance par combat.** Elle n'est pas traitée ici (M1).

## Vérification

`CURRENT FACT`.

- **Aucune requête en échec.** Le pilote compte comme erreur toute réponse HTTP 400 ou plus, toute requête en échec, toute erreur de console et toute erreur de page. Résultat : zéro, dans tous les passages après comme avant.
  - Parcours d'une chronique neuve : titre, ouverture, audience vivante, dix dialogues, carte, deux combats, refuge et ses services.
  - Combats depuis une sauvegarde : Général Serpent, Brèche.
  - Champs de bataille : loups, Général Serpent, Prophète des Ombres, Brèche.
  - Chargement : froid, chaud, en 4G et en 4G lente.
- **Sprites identiques.** Sur les quatre champs de bataille, chaque unité est dessinée depuis la même image avant et après : 25 unités, feuilles et poses, sans aucun repli procédural.
- **Images.** Les captures du parcours, avant et après, ont été comparées pixel à pixel.
  - Les dix dialogues ressortent entre 35 et 45 dB de PSNR. Au plus 0,44 % des pixels s'écartent de plus de 24 niveaux, et ces écarts tombent sur le souffle des personnages et les fonds vivants.
  - La carte ressort à 35,9 dB, sans aucun pixel au-delà de 24 niveaux.
  - À l'œil, les captures sont identiques.
- **Mouvement réduit émulé par le navigateur.** Le parcours et la Brèche ont été rejoués avec `reducedMotion: 'reduce'` : mêmes écrans, champ de bataille complet, 60 images par seconde, zéro erreur. Le réglage de mouvement réduit du jeu reste désactivé par défaut. Les deux serveurs de mesure ont été lancés avec `preview_start`.
- **Tests et validateurs.**
  - Tests ciblés : 152 tests des chemins d'images, 1 695 tests du combat, le test de garde.
  - `npx tsc --noEmit`, `npm run build`, `npm run contracts:validate` et `npm run cinematics:validate-narrative-staging` (`ok: true`) passent. La garde des contrats (`git diff --exit-code 133814ba… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`) est vide, et `git diff --check` aussi.
  - `npm test` : 3 586 réussis, 5 ignorés, 5 échecs. Ce sont les échecs hérités de l'environnement du worktree (`tools/cinematics/` : `minimax_task_checkpoint`, `cin6c_p1_production`, `cin6ea3_pilot_e_regate`, qui demandent `ffprobe` et des médias absents), les mêmes que le 2026-11-14. La suite `node:test` donne 26 sur 26.

## Ce qui n'est pas vérifié

`UNDECIDED`.

- **Toute la chronique.** Les parcours mesurés couvrent le début du Lion, son boss, le boss du Scorpion et la Brèche, pas toute la chronique dans le navigateur. Le reste repose sur deux appuis :
  - l'inventaire du 2026-11-15 (recherche dans le bundle de production, chemins dynamiques résolus) ;
  - le test de garde, qui interroge les vrais résolveurs de tous les décors de dialogue, tableaux vivants, refuges, cartes et poses.

  Une image demandée par un chemin que ni l'un ni l'autre ne voit manquerait en production.
- **Vagues et phases.** Les unités de la seconde vague et de la seconde phase de boss ne sont pas observées une à une à l'écran. Leur sprite est préchargé par les mêmes fonctions qui les font paraître.
- **Mobile, à-coups, mémoire.** Ni le mobile (MB1), ni les à-coups uniques (F2), ni la croissance mémoire par combat (M1) ne sont re-mesurés.
- **Navigateur habituel.** Le jeu n'a pas été vérifié dans le navigateur habituel de l'opérateur : les mesures passent par Chromium sans fenêtre, avec son vrai GPU.
- **Processus orphelins.** Un premier passage du scénario « fuite » a été arrêté en cours de route (`TaskStop`). Je n'ai pas pu vérifier s'il a laissé un processus Chromium orphelin, parce qu'un scan système des processus est hors de mes règles.

## Suites décidées

`APPROVED DECISION` (OD-2026-11-15-A).

- **M1.** La croissance d'environ 40 Mo par combat du processus de rendu devient une tâche dédiée, avant la passe mobile.
- **D1.** Le reste de la dette (C2, C13, CombatSfx, C18) reste à la passe dette technique (OD-2026-11-13-F). Ce code n'est pas embarqué dans le build ; la chaîne vidéo y pèse 5,6 Ko.
- **MB1.** Le profilage de la boucle d'image du combat sur mobile reste à la passe mobile.
- **Sans changement.** Pas de découpage de plus du JavaScript (P5), plafond de résolution du combat à 1,5 (F1), à-coups uniques tels quels (F2).

## Outils

`CURRENT FACT`. `tools/perf/` est l'outil de mesure de cette tâche, gardé pour refaire la même mesure à la passe mobile et pour la tâche M1 :

- `make-perf-saves.ts` écrit les sauvegardes de départ avec le pilote QA ;
- `measure-performance.mjs` est le pilote Playwright ;
- `summarize-performance.mjs` produit les tableaux de ce rapport.

Fichiers de la tâche :

- **Produit.** `vite.config.ts`, `src/combat/legacyCombatRuntime.js`, neuf modules de présentation et deux registres JSON.
- **Données.** 29 images WebP, la liste d'exclusion.
- **Outillage et QA.** Le convertisseur WebP, le test de garde, `tools/perf/` (3 fichiers), un pilote QA du refuge mis à jour, et neuf tests mis à jour pour les nouveaux chemins.
