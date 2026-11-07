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
| `PRODUCTION_IMPACT` | La carte des POI se lit d'un coup d'œil. Chaque palier d'arme ouvre une compétence (T1 3 PA, T2 4 PA), nommée partout, y compris en combat. Le Tir Calibré est relevé. La fiche d'unité se parcourt à la manette. Le refuge dit « Échoppe ». Une branche de bifurcation choisie engage la compagnie jusqu'à la résolution du chapitre (set 1.17.0). L'échoppe et la forge passent par une fiche : aperçu par héros, confirmation, puis équipement sur place. |
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

`CURRENT FACT` Le verrou contredisait les contrats verrouillés. L'amendement 1.17.0 a été préparé, relu (PASS WITH WARNINGS, réserves reprises), puis approuvé tel quel par l'opérateur et appliqué (baseline `06a3a75f`).

Dans le jeu, dès que la compagnie pose le pied sur une branche de bifurcation, seule la suite du chemin reste ouverte jusqu'au lieu qui résout le chapitre. Un bandeau au bas de la carte l'annonce, et un lieu fermé dit pourquoi. La compagnie, la sauvegarde, l'attente et Combat ou repli restent. La résolution rouvre toute la carte. Aucun champ de sauvegarde n'est ajouté. Voir la section Livraison de C de [la décision](../autonomy/MAP_WEAPONS_PATHS_OPERATOR_DECISION_2026-11-07.md).

## Échoppe et forge (second retour du jour)

`CURRENT FACT` L'opérateur forge une arme pour Alistair, veut l'équiper et n'y parvient pas. Il trouve aussi l'échoppe peu claire : pas de confirmation d'achat, pas d'aperçu des compétences et des statistiques obtenues.

La cause, reproduite dans le navigateur : la forge avait déjà équipé l'Espadon d'acier sur Alistair, sans le dire. La carte de recette restait identique, et la fiche du héros affichait « Aucun objet disponible dans l'inventaire » sous « Remplacer par ». On croyait l'arme perdue. Par ailleurs, l'échoppe du refuge s'ouvre sans l'onglet Compagnie : une arme achetée ne s'équipait qu'après être sorti de l'échoppe.

Ce qui change, en présentation seule (`src/ui/ManagementView.ts`, `src/ui/shopPreview.ts`, `src/styles/app.css`). Les règles d'achat, de vente, de forge et d'équipement restent dans `src/game/management.ts`, inchangé :

- **Une fiche par article et par recette.** Une ligne de l'échoppe ou une recette de la forge n'achète plus rien d'un clic : elle ouvre une fiche en trois temps.
  - **Aperçu.** Pour chaque héros concerné, ce qui change : statistiques avant et après, compétences ouvertes, perdues ou échangées (« Tir Précis devient Tir Calibré »). Puis le prix, l'or avant et après, et le nombre dans le sac.
  - **Confirmation.** Une phrase résume l'opération, avec Annuler et Confirmer.
  - **Résultat.** Ce qui a été fait, et pour une arme ou un accessoire, « Équiper sur … » avec le gain attendu.
- **La forge dit où va l'arme.** « Alistair l'équipera aussitôt · remplace Espadon novice » avant, « Alistair porte maintenant : Espadon d'acier » après. Si l'objet de base vient du sac, le résultat va dans le sac et la fiche propose de l'équiper.
- **Ce qui manque.** Chaque recette liste ses ingrédients, cochés ou manquants, avec leur provenance : dans le sac, sur tel héros, en vente à l'échoppe, gagné en combat. Une recette incomplète s'ouvre quand même, pour que la manette atteigne la raison. Son bouton Forger reste grisé.
- **Les aperçus disent vrai.** Ils exécutent les vraies fonctions (`equipWeapon`, `equipAccessory`, `craftItem`) sur une copie privée de l'état et lisent le résultat. Ils ne peuvent donc pas différer de l'action, et l'état réel n'est jamais touché.
- **Clavier et manette.** La fiche prend le focus sur son action principale. Échap revient de la confirmation à l'aperçu, puis ferme. Fermer rend le focus à la ligne, ou à la première ligne si l'article est épuisé. Le pied de fiche, avec les boutons, reste visible quand la fiche défile.
- **En passant.**
  - L'onglet « Boutique » devient « Échoppe », comme le bouton du refuge.
  - Une fiche de héros sans arme de rechange dit où en trouver.

Vérifications :

- Tests : `src/ui/shopPreview.test.ts` (aperçus, échange de compétence dans les deux sens, accessoire, forge vers le héros ou le sac, recette incomplète, état inchangé) et `src/ui/ManagementView.test.ts` (achat seulement après confirmation, Échap, focus, achat puis équipement depuis la fiche, forge, recette incomplète, vente, achat refusé faute d'or). Suite complète, types, build, validateur, porte sur `06a3a75f`.
- Navigateur, serveur 5181, au refuge : achat de l'Arc long puis équipement sur Kestrel, forge de l'Espadon d'acier, recette incomplète. Vérifié à 1366 px avec le mouvement par défaut puis réduit, et à 390 px. Aucune erreur de page, aucun défilement horizontal. Captures sous `tmp/design-review/shop/` (ignoré).
- Le pilote `tools/demo-continuous-production-qa.mjs` passe désormais par la fiche (ouvrir, confirmer, continuer) et lit le prix sur la ligne ; il n'a pas été relancé de bout en bout. `tools/refuge-production-accessibility-qa.mjs` date d'octobre : il suppose encore des recettes et une échoppe disparues depuis. Il reste tel quel.

## Cohérence de l'interface (troisième demande du jour)

`CURRENT FACT` L'opérateur demande que toute l'interface soit cohérente et bien faite pour le joueur. Une tournée de 25 captures couvre l'écran titre, les réglages, l'ouverture, la carte et ses panneaux, la Compagnie, l'inventaire, le refuge, l'Amélioration, l'échoppe, la forge, une rencontre d'élite et le combat (tutoriel, déploiement, actions, compétences, objets, réglages). Elle s'appuie sur une lecture des textes affichés.

Ce qui était incohérent ou faux, et qui est corrigé :

- **Un seul vocabulaire.**
  - Le combat écrivait « AP » et « MOV » quand la fiche, la forge et le menu des compétences disent « PA » et « DÉPL. ». Parfois les deux se trouvaient dans la même ligne (« Élan — 1 AP · escalade +1 PA »). Tout dit maintenant « PA », et « cases » pour le déplacement : barre d'actions, menus Élan et Objets, bulles d'aide, textes flottants, panneau d'unité, tutoriel, description de l'Éther et du Flux de Mana.
  - « Clan » devient « Compagnie », dans le Registre et au refuge.
  - « Ultimate » devient « Ultime ».
  - « Halte de run », jargon interne, devient « Halte de la compagnie ».
  - « Aide & commandes » devient « Aide et commandes ».
  - « DÉPLAC. » devient « DÉPL. », comme en combat.
- **Le tutoriel de combat disait faux.**
  - Il annonçait encore l'ancienne règle des paliers (« une arme T1 débloque la compétence 2 PA »). Il donne maintenant la règle d'OD-2026-11-07-B : T0 celle à 2 PA, T1 celle à 3 PA, T2 celle à 4 PA, compétences fermées visibles et grisées.
  - Il nommait un bouton inexistant, « Lancer la bataille », au lieu de « Lancer le combat ».
  - « roster », « escorts » et « tier » sont traduits.
- **Barre d'actions du combat.** « Élan · dès 1 AP » et « Sac ×7 · dès 1 PA » étaient tronqués. Ils deviennent « Élan · 1 PA » et « ×7 · 1 PA », lisibles en entier.
- **La sauvegarde se voit.** « Sauvegarder », sur la carte comme au Journey, ne donnait qu'un son, contraire au contrat UI (le son ne porte aucune information nécessaire). Un avis « Partie sauvegardée » s'affiche maintenant quelques secondes, annoncé aux lecteurs d'écran.
- **Retour à l'écran titre.** Le bouton « Menu » de la carte et du Journey renvoyait sans prévenir à l'écran titre. Il s'appelle désormais « Écran titre » et sauvegarde la partie avant de partir (vérifié : un tour d'attente survit au retour).
- **Écran titre honnête.**
  - « Crédits » et « Feuille de route » ressemblaient à des liens mais ne menaient nulle part : ils sont retirés.
  - Quand une sauvegarde existe, « Continuer » est le bouton principal, et il a déjà le focus.
- **Réputation.** La carte affiche le palier par son nom (« 30 · Méfiant »), comme le refuge et l'échoppe.
- **Refuge.** La ligne « +0 or placé dans le coffre » ne s'affiche plus quand rien n'est mis au coffre.
- **Clarté.**
  - L'Amélioration explique en clair ce qu'on renforce, au lieu de « compétences résolues par la classe et l'équipement ».
  - Un inventaire vide d'armes ou d'accessoires rappelle que les objets équipés sont sur la fiche des héros.

Vérifications :

- Tests ajustés à ces libellés : `management.test.ts`, `content.test.ts`, `r0b4KillApRouting.test.ts`, `combatShellPresentation.test.ts`, `ExplorationView.test.ts`. Suite complète, types, build, validateur, porte sur `06a3a75f`.
- Navigateur, serveur 5181 : nouvelle tournée de captures à 1366 px et 390 px. Contrôles de l'avis de sauvegarde, de la sauvegarde avant l'écran titre et du bouton principal, avec le mouvement par défaut puis réduit. Aucune erreur de page. Captures sous `tmp/design-review/tour/` (avant) et `tmp/design-review/tour-after/` (après), ignorés.

Deux points de présentation soumis à l'opérateur, qui a retenu les deux recommandations (OD-2026-11-07-D) :

- **Familles visuelles.**
  - Les réglages, la rencontre d'élite et l'en-tête de la carte suivaient une autre famille visuelle : panneau bleu-vert, titres Alegreya ou Georgia.
  - Le Registre, le refuge, la forge et le combat utilisent le bleu nuit et l'or, avec Cinzel et Inter.
  - Choix : les réglages et la fenêtre de rencontre prennent le style du Registre (`src/ui/ui-sound.css`, `src/ui/poi-map.css`). La carte garde son style d'atlas.
  - Vérifié sur les trois onglets des réglages et la rencontre, à 1366 px et 390 px.
- **Sous-titre.** « HD-2D », une marque déposée de Square Enix, est retiré du sous-titre de l'écran titre et du titre de la page de combat. Le sous-titre devient « Un RPG tactique où chaque serment laisse une trace. »

## Compétences en combat (quatrième retour du jour)

`CURRENT FACT` L'opérateur demande si l'absence de l'ultime dans le menu des compétences du combat est normale. Il juge aussi plus clair de ne pas montrer en combat les compétences que le héros ne possède pas.

- **L'ultime.** Son absence est voulue. Les ultimes à 5 PA restent fermés dans la démo : `isUltimateUnlockedForHero` répond toujours non, et aucune arme ne les ouvre. La fiche du héros les montre avec « Éveil spécial requis ».
- **Ce qui change (OD-2026-11-07-E).** Le menu des compétences du combat ne liste plus que les compétences ouvertes. Le chemin d'affichage des compétences fermées est retiré de bout en bout : le champ `lockedSkills` du protocole et de `toCombatant`, sa copie dans l'unité de combat, les lignes grisées et leur style. La fiche du héros, dans la Compagnie, garde la liste des compétences fermées avec l'arme qui les ouvre, consultable à la manette. Le tutoriel de combat le dit.
- **Vérifications.** Test de `toCombatant` : seules les compétences ouvertes partent au combat, sans fermée ni ultime. Suite complète, types, build, validateur. Navigateur : un combat du labo QA avec le mouvement par défaut puis réduit ; le menu de Kestrel ne montre que Tir Précis.

## Limites

- La passe mobile reprendra la carte sur téléphone : barre de l'atlas sur deux lignes, noms serrés. Elle reprendra aussi les onglets Acheter, Vendre et Forge, empilés à 390 px.
- Le classement des actions du labo d'effets compte Tourbillon d'Acier parmi les actions de la démo. En jeu, l'Espadon du Lion, seule arme T2 d'Alistair, le remplace par le Rempart du Serment.
