# Retours de jeu du 2026-11-07 : carte lisible, compétences par palier et chemins engagés

| Champ | Valeur |
| --- | --- |
| `TASK` | `claude-playtest-map-weapons-paths-20261107` |
| `DOMAIN` | Carte des POI (présentation), armes et compétences (catalogue, gestion, menu de combat), manette, contrats (proposition 1.17.0) |
| `BASELINE` | `62ba5101` sur `dev` |
| `BRANCH` | `dev` |
| `HEAD` | voir `git log` (commits de cette tâche) |
| `STATUS` | review |
| `MERGED_IN` | `NONE` |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | La carte des POI se lit d'un coup d'œil. Chaque palier d'arme ouvre une compétence (T1 3 PA, T2 4 PA), nommée partout, y compris en combat. Le Tir Calibré est relevé. La fiche d'unité se parcourt à la manette. Le refuge dit « Échoppe ». Les chemins engagés attendent l'approbation de l'amendement 1.17.0. |
| `CANONICAL_DOCS_UPDATED` | `docs/autonomy/MAP_WEAPONS_PATHS_OPERATOR_DECISION_2026-11-07.md`, `docs/autonomy/BRANCH_COMMITMENT_AMENDMENT_1.17.0.patch` (proposition), le registre des décisions et l'état vivant. |
| `EVIDENCE` | Tests ciblés : `management.test.ts`, `ManagementView.test.ts`, `GamepadNavigator.test.ts`, `PoiMapView.test.ts`, `DemoVfxActionScope.test.ts`, `VfxMissingSheetStandIn.test.ts`. Suite complète, types, build, validateur. Captures avant et après sous `tmp/design-review/` (ignoré) : carte aux régions I, II et III à 1366 px, en mouvement réduit et à 390 px ; écran Compagnie, forge, menu de compétences d'un combat du labo QA. |

## Les retours

`CURRENT FACT` Le jeu est jugé très bon dans l'ensemble. L'opérateur relève trois points :

- la carte des POI semble encore confuse par son design ;
- on est perdu dans le choix des armes, alors que T1 et T2 sont censés offrir de nouvelles compétences en combat ;
- certains chemins choisis devraient forcer à suivre la continuité jusqu'à la résolution du problème, avant de découvrir d'autres bifurcations.

Trois diagnostics en lecture seule et des captures ont nourri une [fiche d'arbitrages](https://claude.ai/artifact/KiqWJYRhASS4YWwBDngwGS). L'opérateur a retenu les huit recommandations (OD-2026-11-07-A, B et C). Sa note : la manette ne permet pas de consulter tous les détails d'une unité, compétences ouvertes ou fermées comprises.

## Carte (OD-2026-11-07-A)

Les causes de la confusion :

- presque tous les points étaient estompés de la même façon ;
- rien ne marquait la prochaine étape ;
- les liaisons, fines et pâles, se confondaient avec les routes peintes ;
- ♜ désignait à la fois l'élite fixe et la menace mobile ;
- la légende était cachée et fausse ;
- chaque point portait une étiquette ;
- le pion cachait le nom du lieu ;
- le panneau parlait un vocabulaire interne.

Ce qui change, en présentation seule (`src/ui/PoiMapView.ts`, `src/ui/poi-map.css`) :

- **Quatre états.** À faire et à portée (anneau doré), à faire plus loin, fait (plus petit, coche verte), pas encore ouvert (petit point sans nom, nom au survol ou au focus).
- **La prochaine étape.** Une bannière sur le lieu d'histoire suivant. Si c'est un choix, chaque branche au même rang la porte, pour ne pencher vers aucune.
- **Les noms.** Affichés en permanence pour la position, les lieux à portée et la prochaine étape ; les autres au survol, au focus ou à la sélection. Le nom reste toujours dans le libellé accessible.
- **Les routes.** Les routes ouvertes sont plus épaisses et cernées de sombre ; les routes fermées restent un pointillé discret.
- **Les menaces.** L'élite fixe prend ✠ ; la menace mobile garde ♜ en rouge ; un lieu occupé prend un liseré rouge.
- **La légende.** Courte et juste, dans la barre de l'atlas. Elle est ouverte sur un écran large et repliée sur un écran étroit, où elle couvrirait le haut de la carte.
- **Le pion.** Il se tient sur son lieu, seule marque de position.
- **Le panneau du bas.** Type, chemin et état en clair (« Rencontre · Au choix, une seule branche · À faire »), puis le risque et le gain d'un lieu à faire.

## Armes (OD-2026-11-07-B)

La cause : une arme T1 n'ouvrait aucune compétence, et une arme T2 ouvrait celle à 3 PA. Les compétences à 4 PA annonçaient « arme T3 », palier inexistant. Plusieurs textes de la forge étaient faux.

Ce qui change :

- **La règle.** T0 ouvre la compétence à 2 PA, T1 celle à 3 PA, T2 celle à 4 PA (`getMaxUnlockedSkillAp`, `src/game/catalog.ts`). L'ultime reste fermé.
  - L'Espadon du Lion ouvre donc vraiment le Rempart du Serment.
  - Les compétences à 4 PA désormais accessibles ont déjà leur effet visuel et leur son de combat.
- **Les noms.**
  - La compétence ouverte ou remplacée est nommée pour le héros concerné : case d'arme (« Arme · T0 »), détail, inventaire et échoppe (palier et compétence sur chaque ligne), forge (ligne « Compétences »).
  - Une phrase rappelle la règle des paliers.
  - Les textes faux de la forge sont corrigés.
- **Le combat.** Le menu des compétences montre les compétences fermées, grisées, avec « Arme T1 » ou « Arme T2 ». Elles sont envoyées pour l'affichage seulement et ne peuvent pas être lancées.
- **Jamais plus faible.** Le Tir Calibré de l'Arc long passe au-dessus du Tir Précis qu'il remplace : puissance 12, critique 15 %, aveuglement 2 tours.
- **La manette.**
  - Chaque entrée de la fiche d'unité prend le focus, compétences fermées comprises, avec un libellé complet ; la croix la fait défiler jusqu'à elle.
  - Le stick droit fait défiler les panneaux longs.
- **En passant.** Le bouton « SHOP » du refuge devient « Échoppe ».

Point à juger en jouant : la compagnie devient plus forte plus tôt. Prix et combats se retouchent ensuite à la demande.

## Chemins engagés (OD-2026-11-07-C)

`PROPOSED FUTURE DESIGN` Le verrou contredit les contrats verrouillés. L'amendement 1.17.0 est préparé et validé sur un arbre d'essai. La relecture contracts-guardian a donné PASS WITH WARNINGS ; toutes ses réserves sont reprises. Le texte est soumis à l'opérateur ; le jeu ne change pas avant son approbation. Voir [la décision](../autonomy/MAP_WEAPONS_PATHS_OPERATOR_DECISION_2026-11-07.md).

## Limites

- La passe mobile reprendra la carte sur téléphone : barre de l'atlas sur deux lignes, noms serrés.
- Le classement des actions du labo d'effets compte Tourbillon d'Acier parmi les actions de la démo. En jeu, l'Espadon du Lion, seule arme T2 d'Alistair, le remplace par le Rempart du Serment.
