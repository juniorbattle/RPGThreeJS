# Bilan de fin de conception : présentation et nettoyage (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `OD-2026-11-13-F-PRESENTATION` (run `claude-bilan-presentation-20261113T1644Z`) : arbitrages P1, P2, P3 et Q2 |
| DOMAIN | Présentation (musique de récit, portraits, fonds d'écran), outillage QA de Journey, documentation et état |
| BASELINE | `b2830891` sur `dev`, puis `0d96db98` fusionné (jeu de contrats 1.23.0, baseline immuable `6228a34fd69a01406ecf0fb7168a53f92a267d7b`) |
| BRANCH | worktree `claude/nifty-pike-5623dd`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` ; seconde phase (couleurs de Talon et de Kestrel, inventaire du nettoyage global) soumise à l’opérateur sur une fiche d’arbitrages |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE (applique `docs/autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md`) |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Présentation seule : humeur (donc piste) de 75 dialogues de l'après-démo, fond du registre de compagnie et de l'échoppe, statut d'art de six portraits. Aucune vérité de jeu, aucune sauvegarde, aucun texte, choix ou combat modifié. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/AUTONOMOUS_WORK_STATE.json` et `.md` (champs figés), `.agents/skills/ui-accessibility/SKILL.md`, `docs/content/DEMO_CONTENT_MAP.md` (en-tête de remplacement), `docs/content/README.md`, `docs/README.md` |
| EVIDENCE | Tests ciblés et suite complète, `tsc`, build, `contracts:validate`, garde vide (section « Vérification »). Navigateur : piste jouée lue par `window.__rpgMusic()` (dev) après un vrai clic ; fonds vérifiés par un script Playwright hors dépôt (`tmp/p3-refuge-backdrop-qa.mjs`, captures sous `tmp/`, non suivies). |

## P1, les humeurs de l'après-démo

**Méthode.** La liste est calculée par script, pas à la main. Chaque dialogue de l'après-démo a une fiche de scène (`POST_DEMO_PROVISIONAL_SCENES`) dont l'`environmentContext` nomme le dialogue du Lion dont la scène est tirée. Le script lit l'humeur de ce dialogue dans `SCENE_MOODS`.

**Résultat.** 91 dialogues (24 pour l'Ours, le Dragon et le Scorpion, 19 pour l'acte final) :

| Humeur | Nombre | Dont nouveaux |
| --- | --- | --- |
| tension | 52 | 48 |
| drame | 25 | 13 |
| refuge, écrit en clair | 14 | 14 |

- **Écart avec le bilan.** Le bilan annonçait 63 dialogues en tension ou en drame et 12 en refuge. Les données donnent 61 et 14. Les deux de plus en refuge sont des arrivées, des rassemblements ou des sanctuaires dont le pendant au Lion est une scène de refuge (`post_opening_trail`, `first_refuge_gathering`, `mystery_shrine`, `old_shrine_event`). J'ai suivi les données, comme la consigne le demandait.
- **Catégories demandées.** Toutes sont couvertes :
  - les avant-combats et avant-boss ;
  - les jugements, en drame ;
  - les veillées, en tension ;
  - `finale_breach_confrontation` en tension, `finale_breach_aftermath` et `finale_act_end` en drame.
- **Les 16 clés déjà posées** (question 5 A du 2026-11-13) ne changent pas. Deux s'écartent de la règle du pendant : les épilogues de la Crainte et de l'Équilibre. Leur fiche de scène renvoie à une scène en tension, mais l'opérateur les a voulus en drame, comme `epilogue`. Le test les nomme comme choix de l'opérateur.
- **Le commentaire** de `src/audio/moods.ts` décrit maintenant la règle, la date et l'origine calculée.

**Tests** (`src/audio/moods.test.ts`) :

- Chaque dialogue de l'après-démo a une humeur décidée, refuge compris, et la table n'a aucune clé en trop.
- Chaque humeur est celle du pendant au Lion, sauf les deux choix de l'opérateur.

Une session qui ajoute des dialogues (N1 à N3) doit ajouter leur clé, sinon le test échoue.

**Navigateur.** Vérifié sur `localhost:5182`, avec la musique débloquée par un vrai clic sur « Continuer ». La compagnie a été placée au dernier refuge de l'Ours dans la sauvegarde locale de test.

| Moment | Contexte | Piste jouée |
| --- | --- | --- |
| Carte de l'Ours | `map` | `bear/map` |
| Jugement de Borin (`bear_judgement`) | `drama` | `bear/drama` |
| Après le choix « Assumer nos actes et réclamer le Sceau », avant-combat de Borin (`bear_borin_pre_combat`) | `tension` | `bear/tension` |
| Combat contre Borin | `boss` | `bear/boss@borin` |

Avant ce lot, le jugement et l'avant-combat jouaient la piste de refuge de l'Ours.

## P2, les portraits définitifs des six héros

- Aldric, Morvan, Lyra, Eldwin, Talon et Gunnar ont maintenant `artStatus: 'approved'` dans `visualProfiles` (`src/render/assetManifest.ts`).
- La mention « jusqu'à leurs images finales » est retirée des acteurs de dialogue. Les deux commentaires disent que ces portraits sont leurs images finales.
- **Fichiers non déplacés.** Les chemins `archive/non-demo/` sont nommés par :
  - les poses de combat (`tools/art/combatPosesTable.ts`, `src/render/generated/combatPixelSprites.json`) ;
  - les échelles du HUD (`src/combat/combatHudPresentation.ts`) et le moteur de combat (`src/combat/legacyCombatRuntime.js`) ;
  - le catalogue (`src/game/catalog.ts`) et le manifeste d'archive.

  Un déplacement toucherait le combat et l'outillage d'art de la session de combat, pour aucun gain visible. Le commentaire du registre explique ce choix.
- **Test.** `src/render/heroPortraits.test.ts` exige le statut approuvé et un même chemin de portrait pour le catalogue, le dialogue, le profil et l'acteur, avec un fichier présent.
- La décision historique `IMAGES_RECRUITMENT_ARCHER_OPERATOR_DECISION_2026-11-11.md` garde sa phrase « jusqu'aux images finales » : c'est un document de décision daté, il n'est pas réécrit.

## P3, le fond du refuge de la partie en cours

**Ce qui change.** `src/ui/companyBackdrop.ts` lit la route sans la modifier et rend l'image même que montre l'écran du refuge (`resolveRefugePresentation`). Il prend, dans cet ordre :

1. le refuge où se trouve la compagnie ;
2. sinon le dernier refuge visité de la partie ;
3. sinon le premier refuge de la partie.

`ManagementView` (le registre et l'échoppe) passe cette image à `applyScreenEnvironment`, qui accepte une image de remplacement sans changer voile, fondu ni mouvement. Le Lion suit la même règle, avec ses plaques de refuge approuvées. Le dernier recours du registre, pour une partie sans refuge, devient lui aussi le premier refuge du Lion au lieu de la forêt.

**Le voile.** L'ancien fond était recouvert de trois couches presque opaques : l'image n'en laissait passer que 2 à 4 %, la forêt comme le refuge. Sans retouche, P3 aurait été invisible. Les couches sont allégées : le refuge se lit autour du panneau, flouté et assombri, et le panneau reste opaque et lisible. Sur un écran étroit, le panneau occupe tout l'écran, comme avant.

**Ce qui ne change pas.**

- Le rideau partagé et le fondu d'entrée `ui-screen-in` ne changent pas.
- Le mouvement réduit reste le réglage du jeu (`data-reduced-motion`, `body.motion-reduced`).
- Rien n'est sauvegardé, aucune vérité de jeu n'est lue ou écrite.

**Test.** `src/ui/companyBackdrop.test.ts` :

- le Lion de bout en bout : premier refuge, refuge en cours, dernier visité, refuge final ;
- une partie de l'Ours commencée depuis une vraie fin du Lion, avec ses trois refuges ;
- l'état est inchangé après l'appel.

**Navigateur.** Le script Playwright place la compagnie avant le premier refuge, y entre, ouvre l'échoppe puis le registre. Il fait chaque parcours deux fois : réglages par défaut du navigateur, puis `reducedMotion: 'reduce'` émulé.

| Partie | Refuge | Réglages par défaut | `reduce` émulé |
| --- | --- | --- | --- |
| Lion | `lion-first-refuge`, plaque du premier refuge | PASS | PASS |
| Ours | `bear-first-refuge`, image finale | PASS | PASS |
| Dragon | `dragon-first-refuge`, image finale | PASS | PASS |
| Scorpion | `scorpion-first-refuge`, image finale | PASS | PASS |
| Acte final | `finale-last-refuge`, image finale, registre ouvert depuis le tableau du Tournoi | PASS | PASS |

Chaque PASS vérifie plusieurs points :

- le fond de l'échoppe et du registre est l'image du hub du refuge (à l'acte final, l'image de la dernière veillée) ;
- l'échoppe s'ouvre seule ;
- l'écran entre par le fondu `ui-screen-in` et finit opaque ;
- la page n'a aucune erreur.

Avec `reduce` émulé, le fondu reste joué et `body.motion-reduced` reste absent : le jeu ne déduit pas le mouvement réduit du système. À l'acte final, le hub de la dernière veillée n'a pas été atteint dans le navigateur, faute d'une sauvegarde de test placée avant lui. Le registre y est ouvert depuis le tableau du Tournoi, et le hub passe par le même résolveur que les quatre autres parties. Vérifié aussi à la main : le registre ouvert en fin de Lion montre le refuge final, l'échoppe de l'avant-poste de l'Ours montre l'avant-poste.

## Q2, le nettoyage

- **L'état.** Champs mis à jour dans `AUTONOMOUS_WORK_STATE.json` :
  - `lastKnownGoodCommit` et `lastPushedCommit` (étaient `bb6113ce`) ;
  - `activeTask`, `activePhase` et `activeSubtask` (étaient le lot 1 de l'Ours) ;
  - les champs de run et le bloc `live` (étaient du 2026-11-01), dont `live.nextAction`, qui renvoie maintenant à `nextAction`.

  Dans le `.md`, l'en-tête dit le jeu complet sur ses images finales et le bloc live est réécrit. `nextAction` et sa ligne « UNE prochaine action » de tête ne sont pas touchés. Ils parlent encore d'« images provisoires marquées » : à corriger par la session parente.
- **Commentaires périmés.**
  - `PlateauRegistry.ts` (lots 1 à 4) : les images finales sont intégrées depuis les 12 et 13 novembre.
  - L'en-tête de `postDemoContent.ts` : même correction, dans la même famille de commentaires.
  - `app.css` : la requête système retirée n'est plus citée.
- **Le skill `ui-accessibility`.** Corrigé dans `.agents/skills/` ; le pointeur `.claude/skills/` reste juste (nom et description inchangés).
  - Plus aucun bloc `@media (prefers-reduced-motion)` n'est décrit : il n'en reste aucun sous `src/`.
  - La vérification attendue : réglage du jeu activé et désactivé, plus un réglage système émulé qui ne doit rien changer.
  - `poi-map.css` est rangé à sa place (`src/ui/`).
  - Le résumé de la carte suit le set 1.18.0 : gardiens fixes et défis, plus d'action Attendre ni de menaces mobiles.
- **`docs/content/DEMO_CONTENT_MAP.md`.** En-tête de remplacement selon `docs/reports/README.md` : périmé (`main@6ff5f4c`, huit vidéos, Traversal), gardé tel quel comme historique, avec les autorités actuelles. Les liens de `docs/content/README.md` et `docs/README.md` le disent historique.
- **Scénarios QA de Journey** (`src/cinematics/JourneyQaScenarios.ts`, dev seulement). Aucun descripteur ne nomme plus de fichier vidéo.
  - Les deux candidats du préchargement portent une URI de données vide : aucune requête, aucune image. Ils gardent seulement la comptabilité du préchargeur.
  - L'étape à passer devient une attente de 30 secondes sans vidéo, que seul « Passer » termine à temps.

  Les tests sont relus et ajustés : le scénario 5 attend la raison `placeholder` et une fin avant l'attente, un test refuse tout chemin `.mp4`, `.webm` ou `/assets/`. Aucune vidéo n'est réactivée (OD-2026-10-24-A).
- **La spectatrice.** L'image approuvée `finale_civilian`, la spectatrice de l'Arène des Destins (capuche profonde, foulard sur le visage), est gardée en réserve. Elle reste déclarée dans `characterProfiles`, `visualProfiles`, `dialogueActors`, la liste des acteurs de l'acte final et les poses de combat, mais aucun dialogue ne l'emploie. Elle est disponible pour une scène future validée par l'opérateur, sans être supprimée.
- **Hors périmètre.** Les mentions « PROPOSAL » de `tools/art/` appartiennent à la session de combat (retirées par `2578a659`, C5).

## Vérification

Sur l'arbre fusionné avec `origin/dev` `0d96db98` :

| Contrôle | Résultat |
| --- | --- |
| Garde des contrats (`git diff --exit-code 6228a34f… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`) | vide |
| `npm run contracts:validate` | 8 contrats, 8 identités historiques, zéro vidéo active |
| `npx tsc --noEmit` | aucune erreur |
| Tests ciblés (`moods`, `heroPortraits`, `companyBackdrop`, `JourneyQaScenarios`, `musicSurfaces`) | verts |
| `npm test`, partie vitest | 3 436 réussis sur 3 446 (243 fichiers) |
| `node --test tools/qa/qa-job.test.mjs` | 26 sur 26 |
| `npm run build` | réussi (avertissement habituel sur les morceaux de plus de 500 ko) |

**Les 10 échecs vitest** sont hérités de l'environnement. Ils sont dans 4 fichiers que ce lot ne touche pas :

- `src/combat/vfx/spritesheetPng.test.ts` ;
- trois tests historiques de `tools/cinematics/`.

Ces fichiers lisent des fichiers locaux ignorés par Git : les PNG de `public/assets/vfx/megapack-runtime/` (`.gitignore:18`) et les masters et relevés MiniMax sous `tmp/cinematics/`. Ces fichiers existent dans le dossier principal du poste, pas dans un worktree neuf comme celui-ci.

## Limites et suite

- Le verrou `.git/codex-autonomy.lock` existait à vide au départ, écrit par une autre session du même lot ; il n'a pas été modifié, quatre sessions travaillant en parallèle par décision de la session parente.
- La piste de chaque moment est lue dans l'état de la musique, pas écoutée : l'acceptation à l'oreille reste celle de l'opérateur.
## Seconde phase : soumise à l'opérateur

Les remarques de l'opérateur, enregistrées dans la décision le même jour, confient deux tâches de plus à cette session. Les deux sont soumises sur une fiche d'arbitrages privée (https://claude.ai/artifact/ScehruYEVzu6FGSRk4h8Js). Rien n'est recoloré ni supprimé avant ses choix.

- **Bleus de Talon et de Kestrel.** Les mesures portent sur les images du jeu, lues dans le navigateur :

  | Image | Bleu dans la silhouette | Teinte moyenne du bleu | Saturation |
  | --- | --- | --- | --- |
  | Talon, portrait | 64 % | 228° | 0,48 |
  | Talon, planche de combat | 52 % | 234° | 0,46 |
  | Kestrel, portrait | 32 % | 222° | 0,25 |
  | Kestrel, planche de combat | 29 % | 222° | 0,22 |

  Dans la compagnie, le violet est déjà pris par Elara (240 à 270°) et Eldwin (270 à 300°), et le vert est libre. Talon n'apparaît que par son portrait et sa planche de combat ; Kestrel figure dans la démo et dans des images de scène approuvées. Les aperçus recolorent seulement les teintes bleues : Talon violet, Talon ardoise, Kestrel vert. Recommandation : Talon ardoise.
- **Nettoyage global.** L'inventaire classé est dans `docs/audits/global-cleanup-inventory-2026-11-13.md`, fait en lecture seule sur les 4 371 fichiers suivis :

  | Catégorie | Fichiers | Taille |
  | --- | --- | --- |
  | A, supprimable sans risque | 9 | 0,1 Mo |
  | B, gardé par une règle | 2 974 | 2 014 Mo |
  | C, à trancher | 251 | 113 Mo |

  Le dépôt Git (6 Go) ne maigrit pas sans réécriture de l'historique, que OD-2026-11-11-E exclut. Le levier concret est le build : environ 60 Mo de `public/` que le jeu ne lit jamais partent à chaque version.
- **`docs/README.md`** annonçait encore le jeu de contrats 1.4.0 ; il donne maintenant 1.23.0 et sa baseline.

## Choix de l’opérateur appliqués (même jour)

L’opérateur a rempli la fiche et retenu chaque recommandation, sans note. Ses choix sont consignés dans la décision (section « Fiche de la seconde phase »), puis appliqués, un commit par groupe :

- **T1, Talon ardoise.** Le portrait et la planche de combat de Talon passent en gris ardoise par un traitement de palette exact. 93 923 et 10 890 pixels bleus changent ; l’alpha et les autres pixels restent identiques.
  - Les empreintes de provenance de `combatPixelSprites.json` et `poses.json` sont mises à jour, ainsi que la palette déclarée.
  - Les sources de poses `tools/pixel-sprites/poses/talon/*.webp` gardent le bleu. Une reconstruction de sa planche doit relancer `tools/pixel-sprites/recolor-talon-slate.cjs`, et la description de ses poses dans `tools/art/combatPosesTable.ts` (session de combat) parle encore de bleu.
  - L’archive `archive-manifest.json` garde l’empreinte d’origine, comme trace de l’archivage.
- **N1, C7, C9.** 21 outils jetables supprimés ; le skill qa-evidence nomme les pilotes de combat gardés.
- **C1, C3.** Les poses du Combat Stage (100 fichiers) et les atlas POI V2 sont supprimés de `public/`.
- **C4 à C6, déplacés hors du build.** Les neuf rapports JSON vont dans `docs/project/asset-migration-reports/`, l’écoute des sons de combat dans `docs/media/audio/combat-fx-v1/`, les références Option C dans `docs/art-direction/option-c/validation-ready/`.
- **C15.** Les cinq cas megapack de `spritesheetPng.test.ts` sautent quand les PNG locaux manquent.
- **Reportés ou gardés.** C2, C13, C14 et C18 vont à l’étape « dette technique » ; P1 et P2 ne changent rien.

**Vérification.** Contrôles lancés sur l’arbre fusionné :

| Contrôle | Résultat |
| --- | --- |
| `tsc` | aucune erreur |
| vitest | 3 436 réussis, 5 sautés, 5 échecs hérités des tests historiques de `tools/cinematics/`, dont les masters locaux manquent dans ce worktree |
| node:test | 26 sur 26 |
| build | réussi |
| `contracts:validate` et garde | validé, garde vide |
