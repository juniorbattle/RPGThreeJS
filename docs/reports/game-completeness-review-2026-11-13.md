# Bilan de complétude du jeu en fin de conception (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `GAME-COMPLETENESS-REVIEW-2026-11-13` (run `claude-completeness-review-20261113T1600Z`) |
| DOMAIN | Campagne et récit, combat tactique, présentation (cartes, images, arènes, tableaux vivants, unités, musique), vérification de bout en bout |
| BASELINE | `43d6afe0` sur `dev` (jeu de contrats 1.23.0, baseline immuable `6228a34fd69a01406ecf0fb7168a53f92a267d7b`) |
| BRANCH | `dev` |
| HEAD | le commit de ce rapport |
| STATUS | review : bilan livré à l'opérateur le 2026-11-13 avec une fiche d'arbitrages ; rien n'est corrigé avant ses choix |
| MERGED_IN | NONE (rapport seul) |
| SUPERSEDES | NONE (fait suite à `final-audit-2026-11-11.md`, dont les arbitrages B sont décidés par OD-2026-11-11-E) |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | NONE. Audit en lecture seule. |
| CANONICAL_DOCS_UPDATED | NONE : les décisions seront consignées après la fiche. |
| EVIDENCE | Quatre audits de lecture en parallèle (combat, récit, présentation, parcours et santé), dont les constats principaux ont été recontrôlés dans le code ou à l'image par la session principale. Vérification complète sur `43d6afe0` : garde des contrats vide, `contracts:validate`, `narrative:validate` (5 cartes, 0 erreur), `cinematics:validate-narrative-staging` (`ok: true`), `tsc`, vitest 3 562/3 562 (241 fichiers), node:test 26/26, `npm run build` réussi (avertissement : morceaux de plus de 500 ko). Scripts de présentation (POI, images, arènes, musique, unités, tableaux vivants, provenances sha256) exécutés hors dépôt. |

## Verdict

`CURRENT FACT` Le jeu est complet dans son implémentation. Les cinq parties (le Lion, l'Ours, le Dragon, le Scorpion, l'acte final) ont leur carte, leurs images finales, leurs arènes et ambiances, leurs tableaux vivants, leurs unités posées et leur musique. Chaque compétence de chaque nouvelle unité est réellement résolue par le moteur et a son effet propre. Les trois fins sont atteintes par des tests. Aucun défaut bloquant.

Ce qui manque n'est pas du contenu absent :
- quelques écarts de données en combat ;
- une portée des choix plus faible que dans la démo ;
- des humeurs musicales manquantes dans les dialogues de l'après-démo ;
- surtout, **aucune partie complète n'a encore été jouée**, ni par un test ni dans le navigateur.

Limites : aucun combat joué jusqu'au bout, aucune écoute, aucun rendu vu à l'écran pendant ce bilan.

## 1. Présentation, partie par partie

| Partie | Carte | Images | Arènes et ambiances | Tableaux vivants | Unités | Musique et humeurs |
| --- | --- | --- | --- | --- | --- | --- |
| Lion | 33 POI, 3 atlas, 2 refuges | complètes (chemins vérifiés) | 32 combats sur 3 arènes du Lion | ouverture et 7 tableaux | 16 unités et 2 boss posés | 9 pistes inchangées à l'octet ; humeur pour 75/75 dialogues |
| Ours | 33 POI, 3 refuges, 3 atlas | 42/42 | 23 combats sur 3 arènes, `bear_mountains` | 3/3 | 10 unités et 4 boss posés | pistes propres ; humeurs 4/24 |
| Dragon | 33 POI, 3 refuges, 3 atlas | 43/43 | 23 combats sur 4 arènes, `dragon_peaks` | 3/3 | 11 et 4 | pistes propres ; humeurs 4/24 |
| Scorpion | 33 POI, 3 refuges, 3 atlas | 40/40 | 23 combats sur 6 arènes, `scorpion_desert` | 3/3 | 7 et 4 | pistes propres ; humeurs 4/24 |
| Acte final | 11 POI et 5 cases du Tournoi, 1 refuge, 1 atlas | 32/32 | 12 combats sur 7 arènes (Tournoi, capitale, brèche) | 4/4 | 10 et 3 | pistes propres ; humeurs 4/19 |

- **Images.** 157 médias de l'après-démo listés dans les provenances. Tous sont présents et suivis par Git, et leur sha256 correspond. Aucun n'est orphelin, aucun n'est provisoire.
- **Arènes.** Aucun des 81 combats de l'après-démo ne joue sur une arène ou une ambiance du Lion.
- **Unités.** Tout combattant a ses quatre poses. Douze planches restent sans poses, comme prévu : les dix civils, plus deux unités d'archive qu'aucun combat n'utilise.
- **Musique.** Aucun POI, dialogue ou combat de l'après-démo ne retombe sur la musique du Lion.
- **Portraits des six héros recrutables (Aldric, Morvan, Lyra, Eldwin, Talon, Gunnar).** Ils viennent du dossier `archive/non-demo/`, que le registre classe « jusqu'aux images finales ». Je les ai regardés : ils sont finis et respectent la règle des visages couverts, et leurs poses de combat sont construites sur eux. → arbitrage P2.
- **Écarts.**
  - **Humeurs.** 75 des 91 dialogues de l'après-démo n'ont pas d'humeur et jouent « refuge » (`src/audio/moods.ts:36-51`, conforme à la décision 5 A). Le dialogue du Lion dont 63 d'entre eux sont tirés est en tension ou en drame : avant-combats, jugements, veillées, brèche. Les pistes « tension » et « drame » propres à chaque partie s'entendent donc peu. → P1.
  - **Fonds.** Le Registre de compagnie et l'échoppe gardent la forêt du Lion à l'aube, sous un voile, dans toutes les parties (`screenBackgroundRegistry.ts:46-49`). → P3.
  - **Entrées de boss.** Chez l'Ours (Maître Espion) et chez le Dragon (Chaman), le boss de la voie d'honneur joue l'entrée de boss générique : la musique se choisit par arène, et l'arène est partagée (décidé en 9 A). → P4.
  - **Ambiances.** Trois écarts de lieu restent signalés, et l'opérateur a dit « on reviendra plus tard » (`postdemo-combat-ambiences-2026-11-13.md`, §3).

## 2. Combat des nouvelles unités

`CURRENT FACT` (lu dans le code, recontrôlé sur les points cités) :
- **Effets résolus.** Tous les effets déclarés par les compétences des six héros, des ennemis, des élites et des boss sont gérés par le moteur (`legacyCombatRuntime.js`). Aucun skill post-démo n'est sans recette d'effet propre (`fxSkills.ts`, testé par `fxSkills.test.ts` et `postDemoCombatRuntime.test.ts`).
- **Mécanique des boss.** Le cycle de 4 tours, la Furie, la rupture de CHARGE à 15 % et l'échelle par plateau (×1,1 / 1,2 / 1,3 / 1,4) s'appliquent à tous les boss et élites.
- **Progression des boss** (PV après échelle) :
  - Champion du Lion : 520 ;
  - Borin : 594 ;
  - Kaelen : 672 ;
  - Grand Inquisiteur : 728 ;
  - Maelor : 700 ;
  - Entité de la brèche : 868.
- **Recrutement.** Les six héros sont recrutables par leurs rencontres, deux par plateau. Leurs ultimes ont une recette et un son propres.

Écarts :
1. **Phénix sans attaque lourde.** Les deux élites du Phénix, le Gardien de flamme et le Champion du Phénix, n'ont aucune attaque lourde à 4 PA. Leur cycle passe de 4 étapes à 3 (`legacyCombatRuntime.js:857,863`), contre OD-2026-11-11-A. → C1.
2. **Fidèle égaré.** Cet élite a un ultime physique (Exécution) avec FOR 12 et MAG 24 (`legacyCombatRuntime.js:858`). → C2.
3. **Stat faible des boss magiques.** Les attaques lourdes de Kaelen, du Grand Inquisiteur et de l'Entité frappent sur leur stat faible, et le Brasier du Démon aussi. Le catalogue n'a qu'une attaque lourde magique (Gel), et B1 interdit à deux boss de partager le même couple attaque lourde + ultime. → C3.
4. **Kits recyclés.**
   - Les élites reprennent des kits entre eux et ceux de la démo : contremaître = chef des mineurs ; bête des profondeurs = brute démoniaque = troll de la démo ; champion du Loup = champion du Corbeau = duellistes du Lion ; wyrm des Ombres = jeune dragon.
   - Le Prophète et Maelor ont le même couple Gel + Brasier, et des statistiques presque identiques.
   → C4.
5. **Noms d'arme.** Kaelen et le Grand Inquisiteur portent un « Sceau » mais tiennent un bâton sur leur image. Le champion du Corbeau a des « Lames de jet », mais son image montre deux dagues. Le test arme/image ne couvre que l'Ours (`combatPoses.test.ts:79-91`). → C5.

## 3. Récit et PNJ

`CURRENT FACT` :
- **Choix des plateaux.** Chaque plateau offre 10 choix sur sa route. Ils pèsent tous dans le jugement de son chef (`*Finale.ts`), et la voie d'honneur exige la décision-clé : les mines, le Cristal ou le codex (`plateauFinale.ts:86-101`).
- **Échos.** Les plateaux se répondent : 41 échos pour l'Ours, 42 pour le Dragon, 39 pour le Scorpion et 18 pour l'acte final (`narrative:validate`).
- **Trahison.** Le discours de trahison de Maelor cite ceux de ses conseils que le joueur a suivis.
- **PNJ.** Tous les PNJ ont leur image, cohérente avec l'identité de leur plateau, et la règle des visages couverts est inscrite dans chaque fiche.

Écarts :
1. **Peu de combats nés d'un choix.** Dans chaque plateau, un seul choix de dialogue mène à un combat : les mines, le repaire ou le temple, et les deux branches combattent. Le Lion en a neuf. Les trois plateaux suivent aussi le même gabarit en 10 temps. → N1.
2. **Trahison et choix du Lion.** Le discours de trahison ne lit aucun choix du Lion : butin, témoins réduits au silence (`finaleDialogues.ts:194-201`). → N2.
3. **Sort de Maelor.** Il n'est jamais dit après la brèche (`finaleEpilogues.ts`). → N3.
4. **Choix de l'acte final.** Ils colorent le texte mais ne changent pas la fin : celle-ci dépend des quatre issues de plateau et de la réputation (`campaignRelations.ts:131-142`). → N4.
5. **Crédits.** L'écran reste caché tant que `CREDITS_LINES` est vide (`src/ui/credits.ts:6`). → N5.
6. **Spectatrice orpheline.** `finale_civilian` (la spectatrice de l'arène) a une image approuvée mais n'apparaît dans aucun dialogue. Elle est à documenter, pas à supprimer.

## 4. Parcours de bout en bout

Couvert par des tests au niveau de l'état du jeu, avec des combats déclarés gagnés :
- le Lion sous ses deux routes ;
- chaque plateau, par l'honneur et par la force ;
- l'acte final ;
- les trois fins, avec les limites de la jauge ;
- les sauvegardes V6 aux jalons du Lion, en début et en fin de chaque plateau et au Tournoi.

Non couvert (`CURRENT FACT`) :
- la fin du Lion actuel de `dev` enchaînée vers l'Ours dans un même test : les pilotes partent des sauvegardes de la démo figée ;
- une sauvegarde prise au milieu d'un plateau ;
- le retour au dernier point de sauvegarde après une défaite, après le Lion ;
- le parcours réel dans `GameApp` après le Lion, testé seulement avec un `GameApp` simulé ;
- une partie complète dans le navigateur. → Q1.

État des arbitrages de l'audit précédent :
- B1 à B9 sont livrés (crédits mis à part).
- B10, la passe mobile, vient après le test sur PC.
- La dette C1 à C5 n'est pas faite ou ne l'est qu'en partie, comme prévu après la validation.

## 5. Hygiène (sans effet sur le jeu)

- **État.** L'état du projet a des champs figés : `lastKnownGoodCommit` et `lastPushedCommit` valent `bb6113ce` (2026-11-08), `activeTask` vaut `POST-DEMO-LOT-1-BEAR`, et le bloc `live` date du 2026-11-01.
- **Commentaires et docs périmés.**
  - `PlateauRegistry.ts:150-175` parle encore d'images provisoires.
  - `finalImagesStaging.ts` et `finalImages.ts` gardent la mention « PROPOSAL, to confirm ».
  - `app.css:3078` cite une requête système qui n'existe plus.
  - Le skill `ui-accessibility` décrit des blocs `@media prefers-reduced-motion` qui ont été retirés.
  - `docs/content/DEMO_CONTENT_MAP.md` est périmé.
- **Vidéos retirées.** Les scénarios QA de Journey, en dev seulement, pointent vers des vidéos retirées (`JourneyQaScenarios.ts:38,43,48`). → Q2.

## 6. Arbitrages

Tous les arbitrages sont rassemblés dans la fiche d'arbitrages privée publiée le 2026-11-13, avec une recommandation pour chacun :
- C1 à C5 : combat ;
- N1 à N5 : récit ;
- P1 à P4 : présentation ;
- Q1 et Q2 : vérification et hygiène.

Les choix de l'opérateur seront consignés dans `docs/autonomy/` avant toute correction.
