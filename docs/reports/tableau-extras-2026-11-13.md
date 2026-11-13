# Figurants muets dans les tableaux ordinaires (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `PRODUCTION-CONTRACTS-TABLEAU-EXTRAS-1` (run `claude-tableau-extras-20261113T2014Z`), décision [OD-2026-11-13-G](../autonomy/TABLEAU_EXTRAS_OPERATOR_DECISION_2026-11-13.md) |
| DOMAIN | Contrats (amendement dédié), présentation narrative (tableaux de dialogue) |
| BASELINE | `4c5b4292`, puis `f0de4c97` sur `dev` (jeu de contrats 1.23.0, baseline `6228a34fd69a01406ecf0fb7168a53f92a267d7b`) |
| BRANCH | worktree `claude/nice-engelbart-e9185b`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Quinze dialogues ordinaires, du Lion au Scorpion, montrent des figurants muets derrière leurs acteurs : 43 en tout, quatre au plus par tableau, pris parmi les maîtres civils existants de leur partie. Ils ne portent ni réplique, ni focus, ni regard. Ils ne sont pas comptés comme acteurs et ne passent pas par le planificateur. Rien n'est sauvegardé. Le texte des dialogues, la mise en scène, la limite de quatre acteurs, les tableaux vivants et les sauvegardes V6 ne changent pas. |
| CANONICAL_DOCS_UPDATED | Contrats 1.24.0 (`PRESENTATION_AND_MEDIA`, `AUTHORING_AND_QA`, `README`, manifeste) ; nouvelle baseline immuable dans `AGENTS.md`, le protocole, l'invite récurrente, les skills, `docs/README.md`, le statut du projet et l'état ; `OPERATOR_DECISIONS.md` et le fichier de décision ; le brouillon validé. |
| EVIDENCE | Tests ciblés et suite complète, `tsc`, build, `narrative:validate`, `contracts:validate`, garde vide contre la nouvelle baseline (section « Vérification »). Navigateur : vrai jeu sur le serveur de dev du port 5184, avec de vrais clics, sur huit dialogues habillés des quatre parties. Captures sélectionnées dans `docs/reports/tableau-extras-2026-11-13/`. |

## Ce que l'opérateur a décidé

`APPROVED DECISION`. L'opérateur avait demandé d'« habiller nos événements avec les civils et personnages génériques ». À l'entrée E1 de la fiche de la passe narrative, il a choisi « Amendement, sprites existants ». Au brouillon (`docs/content/drafts/TABLEAU_EXTRAS_AMENDMENT_DRAFT_2026-11-13.md`), il a répondu « Oui, sans option B ». Il valide ainsi :
- le texte d'amendement, mot à mot ;
- la liste des 15 dialogues et de leurs figurants ;
- sans les guerriers de l'Ours ni les érudits du Scorpion (option B écartée).

## Contrats

`CURRENT FACT` Les commits, dans l'ordre de la procédure :
- `2b8e9c75` : la décision OD-2026-11-13-G, sa ligne dans le registre et le brouillon marqué validé ;
- `133814ba` : l'amendement, jeu de contrats 1.24.0. Une section « Tableau extras » dans `PRESENTATION_AND_MEDIA`, un paragraphe de preuves dans `AUTHORING_AND_QA`, l'entrée du `README` et celle du manifeste. La Constitution ne change pas ;
- `93d138b2` : `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35` inscrit comme baseline immuable partout où l'ancienne servait. L'ancienne reste dans les lignes historiques.

contracts-guardian a relu le diff réel avant le commit : PASS WITH WARNINGS, aucun changement de fond.
- **W1** est une précision de métadonnée, reprise : le `supersededRule` du manifeste dit maintenant que la règle remplacée était la portée implicite des puces « Cast » et « Animated backdrop ».
- **W2** est une remarque sur le code. Les figurants sont cachés aux lecteurs d'écran et n'ont pas d'identifiant d'acteur ; c'est appliqué, et le test de la surface le vérifie.

## Ce qui est livré dans le jeu

`CURRENT FACT`
- **`src/cinematics/TableauExtras.ts`.** La table des figurants est tenue côté présentation. Elle est indexée par l'identifiant du dialogue et par la peinture sur laquelle ils ont été placés ; sur toute autre image, aucun ne s'affiche. Elle contient aussi la liste fermée des maîtres civils de chaque partie (treize, les miliciens écartés) et le plafond de douze.
- **`src/cinematics/NarrativeSceneSurface.ts`.** Un plan de figurants est posé dans le calque du décor, aux coordonnées de la peinture. La taille du plan suit le cadrage `cover` du décor, en unités de conteneur. Chaque figurant se tient donc sur le sol où il a été placé, quel que soit l'écran. Il partage l'étalonnage, la vignette et la respiration du décor, et reste derrière tout le calque des acteurs.
  - Les figurants n'ont pas d'identifiant d'acteur. Ils n'entrent ni dans le planificateur ni dans le compte des acteurs, et sont cachés aux lecteurs d'écran.
  - Une image manquante laisse sa place vide. Les images des figurants entrent dans l'attente bornée du décor.
- **`src/styles/app.css`.** Les figurants sont un peu plus sombres que les acteurs et ont une ombre au sol. Chacun respire à son propre rythme ; les passants traversent lentement, avec un léger pas.
  - Mouvement réduit du jeu : ceux qui se tiennent debout restent, immobiles, et les passants disparaissent.
  - Le mouvement réduit du système ne change rien, comme le veut le set 1.22.0.
- **`src/cinematics/TableauExtras.test.ts`.** Le test que le contrat demande. Il vérifie :
  - que les dialogues habillés sont exactement ceux que l'opérateur a approuvés, et qu'aucun dialogue qui garde un lieu vide n'est habillé ;
  - douze figurants au plus par dialogue, pris parmi les maîtres de sa partie, dont les fichiers existent, placés dans la peinture que son tableau montre ;
  - l'identifiant de dialogue porté par le tableau ;
  - au Lion, aucun figurant ne reprend le sprite d'un orateur ;
  - pour la surface : aucun acteur, focus, texte ni contenu lisible ajouté ; le mouvement réduit ; une image absente.

  `visibleActorCap.test.ts` reste inchangé et vert.

**Positions ajustées en jeu.** Mêmes dialogues, mêmes figurants, seules quelques places changent. Dans le vrai jeu, une réplique d'Alistair passe à Cédric quand il est dans la compagnie. Cela décale la distribution de `refugee_trial` et de la première composition de `village_choice`. Leurs figurants ont été replacés pour rester visibles dans les deux distributions, et les deux passants de la route traversent maintenant toute la largeur, entre les acteurs. Les maquettes du brouillon montrent les places d'avant.

## Vérification

`CURRENT FACT`
- **Garde** contre la nouvelle baseline `133814ba` : vide. `contracts:validate` : vert. Constitution intacte.
- **Tests ciblés** : `TableauExtras.test.ts` (7), `visibleActorCap.test.ts` (3) et `NarrativeSceneSurface.test.ts` (29), tous verts.
- **Suite complète** (`npm test`) : 3504 réussis, 5 ignorés, 5 échecs. Les 5 échecs sont les tests historiques des cinématiques (`tools/cinematics/cin6ea3_pilot_e_regate`, `cin6c_p1_production`, `minimax_task_checkpoint`). Ils lisent des médias ignorés de `tmp/cinematics/` (`ENOENT`), absents de tout worktree neuf, et n'ont aucun lien avec cette tâche. `qa-job` : 26/26.
- **Le reste** : `tsc --noEmit`, `npm run build`, `narrative:validate` et `git diff --check` sont verts.
- **Navigateur, vrai jeu** (serveur de dev du port 5184, Playwright, vrais clics) :
  - Les sauvegardes viennent du pilote QA, arrêtées juste avant chaque nœud ; elles sont dans `tmp/extras/saves/`, non suivi.
  - Parcours pour chacune : « Continuer » sur l'écran titre, clic sur le POI, « Se rendre », puis le dialogue. Le tableau vivant de l'arrivée à Bois-Clair est passé par son bouton.
  - Lion, `refugee_trial` : 4 figurants, dont 2 passants. `village_choice` : 3 figurants, avec le décor animé de Bois-Clair par-dessus. `witnesses_on_road` : 3 figurants.
  - Ours : `bear_miners_testimony`, 2 figurants. `bear_mines_defense_aftermath`, 3 figurants, atteint par le vrai choix « Chasser le Corbeau et rendre les galeries à l'Ours » et un combat gagné par le bouton QA « Victoire ».
  - Dragon : `dragon_terrorized_village` et `dragon_freed_pilgrims`, 2 figurants chacun.
  - Scorpion : `scorpion_phoenix_faithful`, 3 figurants ; `scorpion_temple_witnesses`, 2 figurants.
  - Partout : quatre acteurs au plus, aucun figurant dans le calque des acteurs, aucune erreur de console.
- **Mouvement réduit**, sur `refugee_trial`, `village_choice`, `bear_miners_testimony` et `scorpion_phoenix_faithful` :
  - avec `reducedMotion: 'reduce'` émulé côté système, rien ne change (set 1.22.0) : les passants passent et les figurants respirent ;
  - avec le réglage du jeu, `refugee_trial` passe de 4 à 2 figurants, les deux qui se tiennent debout, et aucun n'est animé.
- **Captures** :
  - `docs/reports/tableau-extras-2026-11-13/en-jeu-lion-ours.jpg` ;
  - `docs/reports/tableau-extras-2026-11-13/en-jeu-ours-dragon-scorpion.jpg` ;
  - `docs/reports/tableau-extras-2026-11-13/mouvement-reduit-refugee-trial.jpg`.

## Limites

- Les dialogues de réputation à Bois-Clair, la veillée et les deux issues de Bois-Clair sont vérifiés sur la page d'épreuve, rendue par le moteur du jeu, et par les tests. Ils ne l'ont pas été dans le vrai jeu : il faudrait des sauvegardes à ces nœuds précis.
- La distribution d'un dialogue du Lion peut varier avec la compagnie. Un figurant peut alors passer derrière un acteur, comme un passant dans une foule. Aucun n'entre jamais dans le calque des acteurs.
- L'acceptation artistique reste à l'opérateur, en regardant les tableaux.
