# Défis et gardiens fixes, attente retirée, vagues des gardiens — OD-2026-11-07-F et G

- **Date** : 2026-11-07 (America/Toronto).
- **Source** :
  - Retour du playtest PC, message de l'opérateur du 2026-11-07. Le bouton « Attendre » n'est pas utile : il devait servir aux élites qui se déplacent sur la carte, idée abandonnée parce que le jeu est déjà assez dense. Les POI de défi, avec des conditions de combat particulières et des récompenses intéressantes, apportent un défi concret et méritent d'être davantage intégrés.
  - [Fiche d'arbitrages](https://claude.ai/artifact/Aiivi5N6LcD4FdBziVJGNs) remplie le 2026-11-07 : cinq choix, tous recommandés, sans note.
- **Statut** : ACTIVE. La décision contredisait des contrats verrouillés : l'amendement 1.18.0 a été préparé, relu, puis soumis. L'opérateur a approuvé le texte tel quel le 2026-11-07 (« Texte approuvé ») ; l'amendement est appliqué.

## Constat

`CURRENT FACT` Avant la décision :

- **L'attente.** « Attendre » passe un tour sur la carte sans bouger. Il ne sert qu'aux élites mobiles (`waitPoiTurn`, `src/game/poiExpedition.ts`) ; le compteur « Tour » de la carte ne compte que leurs pas.
- **Les élites mobiles** (annexe du Lot E, `mobileEliteActors`) :
  - la Sentinelle de la vallée, en ronde en région II entre « Cache du pont », « Ronde des Serpents » et « Route de Bois-Clair » : 120 or, 1 gemme rouge, 2 minerais de fer, +1 réputation ;
  - la Garde des ruines, en poursuite en région III entre « Témoins de Bois-Clair », « Chasseurs du passage » et « Veille des ruines » : 170 or, 2 gemmes rouges, 2 minerais de fer, +1 réputation ;
  - leurs combats se jouent à 3 héros au plus ; ce sont les seuls à imposer une condition.
- **Pas de mécanique « défi » à part.** Les trois combats d'élite fixes, « Passage du troll », « Duelliste des représailles » et « Nid du jeune dragon », sont plus durs et mieux payés (160 à 260 or, 3 gemmes rouges, 2 minerais), mais n'annoncent aucune condition. Selon la conduite de la compagnie, une partie en croise une ou deux. La région I n'a aucun combat d'élite.

## OD-2026-11-07-F — les décisions

`APPROVED DECISION`, sous réserve de l'amendement.

1. **Les élites deviennent des gardiens fixes (E1).**
   - La Sentinelle de la vallée garde « Cache du pont » (`lion-poi-valley-bridge-cache`), son point de départ actuel.
   - La Garde des ruines garde « Réserve des ruines » (`lion-poi-seal-ruin-supplies`), la réserve au bout de « Signes des Ombres ».
   - Le coffre ne s'ouvre qu'après la victoire ; « Combat ou repli » reste proposé à l'entrée.
   - Leurs combats, leurs formations, leur limite de 3 héros et leurs récompenses restent.
   - « Attendre » est retiré, avec le compteur de tours, les zones menacées, la marque ♜ de menace mobile et les textes d'aide qui en parlent.
2. **Ce qui fait un défi (D1).**
   - Un défi est un combat facultatif qui annonce une condition et une prime.
   - La condition vaut pour tout le combat et se prend dans une liste courte : « 3 héros au plus », « sans objets » ou « victoire en N tours ».
   - La prime s'ajoute à la récompense habituelle quand la condition est tenue. Pour les tours, le combat continue au-delà de N, mais la prime est perdue.
   - Sur la carte, le lieu porte « ✠ Défi » et son panneau donne la condition et la prime. La condition est rappelée avant le combat et suivie pendant ; l'écran de victoire dit si la prime est gagnée.
3. **Les lieux (D2).** Les trois élites fixes, les deux gardiens et un défi d'initiation en région I sur « Meute du détour » (`lion-poi-opening-wolves`). Aucun nouveau lieu : les 33 lieux et les atlas restent.
4. **Les conditions (D3).**

   | Défi | Condition |
   | --- | --- |
   | Meute du détour (initiation) | 3 héros au plus |
   | Passage du troll | Sans objets |
   | Duelliste des représailles | Victoire en 8 tours ; son objectif dit déjà « avant qu'il ne coupe la retraite » |
   | Nid du jeune dragon | 3 héros au plus |
   | Sentinelle de la vallée | 3 héros au plus, comme aujourd'hui |
   | Garde des ruines | 3 héros au plus, comme aujourd'hui |

   Le nombre de tours est une première estimation : l'opérateur le juge en jouant.
5. **La prime (D4).** 2 gemmes rouges par défi réussi, 1 pour l'initiation.

## Contrats

`CURRENT FACT` La décision contredit le jeu de contrats 1.4.0 (Lot E), toujours en vigueur :

- `TRAVERSAL.md` : deux élites qui se déplacent d'une arête par mouvement ou par attente explicite ; interceptions par l'arrière ; zones de menace ; attente encore citée par l'engagement des chemins (1.17.0).
- `CAMPAIGN_AND_STATE.md` : deux élites mobiles indépendantes, horloge de tours, positions et interceptions tenues par RunSystem.
- `COMBAT_AND_VFX.md` : récompenses exactes et fixes des combats du Lot E.
- `UI_AND_ACCESSIBILITY.md` : deux surcouches de menace mobile, zone menacée au tour suivant, tendance de ronde ou de poursuite, routes disputées, intention « Attendre ».
- `WORLD_AND_CHARACTERS.md` : deux surcouches de menace mobile sur les atlas.
- `AUTHORING_AND_QA.md` : tests de l'attente, des collisions dans les deux sens, de l'accessibilité des zones de menace ; inspection de la ronde de la vallée et de la poursuite des ruines.

La Constitution ne nomme ni les élites ni l'attente : elle ne change pas.

## Amendement 1.18.0

`APPROVED DECISION` Le texte est dans [`POI_CHALLENGES_AMENDMENT_1.18.0.patch`](POI_CHALLENGES_AMENDMENT_1.18.0.patch), validé par `npm run contracts:validate` sur un arbre d'essai. Il change six contrats : `TRAVERSAL`, `CAMPAIGN_AND_STATE`, `COMBAT_AND_VFX`, `UI_AND_ACCESSIBILITY`, `WORLD_AND_CHARACTERS` et `AUTHORING_AND_QA`, ainsi que le README et le manifeste des contrats. L'opérateur l'a approuvé tel quel le 2026-11-07. Il est appliqué mot pour mot aux contrats, puis sa baseline immuable est enregistrée avant tout changement du jeu.

Ce qu'il dit, en clair :

- **Les gardiens** (`TRAVERSAL.md`).
  - Chaque élite prend son poste quand sa condition d'activation actuelle est remplie et que son coffre est ouvert à la compagnie ; elle attend si la compagnie s'y tient. Avant cela, elle reste inactive, y compris dans une ancienne sauvegarde. La Garde des ruines se poste donc à « Signes des Ombres », quand sa réserve s'ouvre, et non plus dès « Témoins de Bois-Clair ».
  - Elle ne bouge plus jamais : ni sur un déplacement, ni sur un voyage, ni au chargement. Elle n'entre jamais sur la position de la compagnie.
  - À l'entrée du poste, « Combat ou repli » ne change pas. Le combat lancé depuis un lieu voisin (« Affronter la menace ») reste.
  - Un poste gardé reste hors des trajets de voyage rapide tant que son gardien est invaincu.
  - Une ancienne sauvegarde reprend avec chaque gardien invaincu à son poste, ou inactif selon la règle ci-dessus, sans ouvrir de rencontre. Un pas en attente qu'elle contient est effacé sans faire bouger personne. Une rencontre déjà sauvegardée se résout avec les règles existantes et ne déplace jamais un gardien. Un coffre déjà pillé garde son gardien à son poste, facultatif et toujours combattable.
  - L'annexe du Lot E n'est pas modifiée. Elle reste la source des identités, formations, limite de 3 héros, récompenses et règle du combat unique ; seuls ses modes de déplacement et ses positions permises sont remplacés.
- **L'attente** (`TRAVERSAL.md`). Retirée : plus d'action qui passe un tour sans bouger, plus de compteur de tours. La valeur sauvegardée reste lisible pour la compatibilité et ne commande plus rien. Plus aucune élite ne bouge après un voyage rapide (1.16.0).
- **Les défis** (`COMBAT_AND_VFX.md`).
  - Les six combats, leur condition et leur prime, comme décidé.
  - La limite de héros passe par la règle de déploiement existante. Le combat tactique refuse tout objet, usage automatique compris, et compte les tours, qu'il renvoie avec l'issue.
  - RunSystem décide de la prime dans chacun de ses trois chemins de victoire (gardien du Lot E, combat facultatif du Lot E, combat de route canonique). Il s'appuie sur les faits que renvoie le combat (tours, objets utilisés, héros déployés) et sur la déclaration fixe du défi, dans la fonction qui applique déjà les récompenses, avant sa marque de combat réglé. La prime tombe une seule fois, avec la même protection contre un rechargement ou un double résultat ; une défaite ou un repli ne donnent rien.
  - Le compte des tours et la règle des objets sont des faits passagers, jamais sauvegardés : aucun champ de sauvegarde nouveau.
  - Récompenses existantes, formations, statistiques des ennemis, dialogues et variantes de conduite ne changent pas.
- **L'affichage** (`UI_AND_ACCESSIBILITY.md`, `WORLD_AND_CHARACTERS.md`). Gardien nommé sur son poste ; « Défi » avec condition et prime en texte, lisible sans la couleur ; condition avant le déploiement, compteur pendant le combat, verdict de la prime au résultat. L'affichage ne calcule rien. Les atlas et les 33 lieux ne changent pas.
- **Le plafond de gemmes rouges** (`AUTHORING_AND_QA.md`). Le plafond facultatif du Lot E passe de 10 à 15 gemmes rouges : les primes de l'initiation (1) et des deux gardiens (2 chacun) s'y ajoutent. Les primes des trois élites canoniques restent hors de ce plafond, qui ne compte que le contenu du Lot E.
- **Les tests exigés** (`AUTHORING_AND_QA.md`).
  - Les gardiens ne bougent jamais, prennent et diffèrent leur poste, reprennent depuis une ancienne sauvegarde, effacent un ancien pas en attente sans bouger.
  - Aucune attente ne reste.
  - Chaque condition est tenue, refus des objets automatiques compris.
  - RunSystem donne la prime une fois sur une victoire qui respecte la condition, jamais sur une défaite, un repli, des tours dépassés, un objet utilisé, un rechargement ou un double résultat ; le plafond est respecté.
  - Tout se lit en texte à 1366 et 390 px, au clavier et à la manette, mouvement réduit ou non.

Relecture contracts-guardian du 2026-11-07, sur une première version : PASS WITH WARNINGS. Les réserves sont reprises dans le texte ci-dessus :

- phrases verrouillées oubliées : le voyage rapide (1.16.0) faisait encore bouger les élites après un trajet, l'engagement (1.17.0) disait les élites inchangées, la livraison du Lot E nommait deux élites mobiles, les résumés du README citaient encore l'attente ;
- plafond de gemmes rouges : la relecture proposait 21 en comptant toutes les primes ; le plafond ne compte que le contenu du Lot E, d'où 15 ;
- coffre pillé avant l'arrivée du gardien, et sort du combat lancé depuis un lieu voisin : tranchés ;
- Garde des ruines active alors que sa réserve est encore fermée : le poste se prend à l'ouverture du coffre ;
- propriétaire de la prime : RunSystem, dans ses trois chemins de victoire ;
- ancien pas en attente et anciennes positions de ronde : effacé et ramenées au poste.

Contraintes notées pour l'implémentation :

- l'annexe JSON du Lot E reste intacte ; les postes vivent dans une table du code (`LionPoiAuthoring.ts`) ;
- disparaissent : le déplacement des élites, `waitPoiTurn` et son bouton, la marque ♜, la légende et la fiche de menace ; les tests qui utilisent l'attente sont réécrits ;
- la configuration de combat gagne une déclaration de défi facultative, qui n'est pas un champ de sauvegarde ; « Meute du détour » et « Nid du jeune dragon » passent à 3 héros ;
- le combat tactique gagne le refus des objets et renvoie le nombre de manches avec l'issue ; le compteur de combat dit « Manche n / 8 », comme le reste de l'interface de combat.

## Livraison

`CURRENT FACT` Livrée le 2026-11-07 sur `dev`, sur la baseline `478cb676`.

- **Gardiens fixes** (`src/game/poiExpedition.ts`, `GUARD_POSTS` dans `src/campaign/LionPoiAuthoring.ts`).
  - `syncPoiElites` poste chaque gardien quand sa condition d'activation et l'ouverture de son coffre sont réunies, et le diffère si la compagnie se tient sur le poste.
  - Les gardiens ne bougent plus. `settlePoiStep` ne fait plus que les poster. Un ancien pas en attente est effacé au chargement, et une rencontre sauvegardée garde son gardien jusqu'à sa résolution.
  - L'annexe JSON du Lot E n'est pas modifiée.
- **Attente retirée.** `waitPoiTurn`, le bouton « Attendre », le compteur de tours de la carte et les textes d'aide disparaissent. Le tour sauvegardé reste lisible et ne commande plus rien.
- **Défis** (`src/game/challenges.ts`).
  - La table fixe déclare les six défis.
  - `withChallenge` joint la déclaration à la configuration de combat et abaisse la limite de déploiement à 3 héros quand c'est la condition.
  - RunSystem décide de la prime :
    - `challengeVerdict` est pur et s'appuie sur les faits renvoyés par le combat ;
    - `creditChallengePrime` est appelé dans `resolvePoiEliteVictory` avant la marque du gardien vaincu, et dans `resolveCombat` avant la marque du lieu résolu.
- **Combat tactique** (`legacyCombatRuntime.js`).
  - En défi « sans objets », tout objet est refusé : menu, bouton grisé « Interdit · défi », usage automatique, exécution.
  - Le combat compte les manches et renvoie avec l'issue le nombre de manches et d'objets utilisés.
  - L'en-tête d'objectif affiche le défi, avec « Manche n / 8 » pour le duelliste. Le panneau de déploiement l'annonce aussi, puisque l'objectif y est masqué.
- **Carte.**
  - Le gardien est nommé sur son poste : « garde « Cache du pont » · Défi : 3 héros au plus · Prime : 2 gemmes rouges », avec « Affronter le gardien ».
  - Les lieux de défi portent un badge « Défi » et leur panneau donne la condition et la prime.
  - La légende et l'aide sont mises à jour. Le verdict (« Défi réussi · … · +2 gemmes rouges » ou « Défi manqué · … · pas de prime ») s'affiche au retour sur la carte.

Vérifications :

- **Tests.**
  - `src/game/challenges.test.ts` : les six déclarations, les configurations à 3 héros, chaque condition tenue ou non, la prime créditée ou refusée, les faits passés par le protocole, le plafond de 15 gemmes rouges, le texte sur la carte.
  - `src/game/poiExpedition.test.ts`, réécrit pour les gardiens :
    - immobilité sur un déplacement, un passage de tour et un rechargement ;
    - reprise d'une ancienne sauvegarde et rencontre de l'arrière sauvegardée ;
    - poste différé, Garde des ruines et coffre déjà pillé ;
    - prime unique, jamais sur un doublon, une défaite ou un repli ;
    - trajets de voyage qui contournent les postes ;
    - exploration exhaustive autour de la Sentinelle.
  - `GameAppPoiExpedition.test.ts` : prime d'un gardien et d'un combat facultatif du Lot E, réussie ou manquée, avec le verdict affiché ; anciennes sauvegardes.
  - Carte, engagement, voyage et en-tête du combat adaptés.
- **Suite et contrôles.** Suite complète (2975 tests vitest dans 182 fichiers, 26 tests node), types, build, validateur, porte sur `478cb676`.
- **Navigateur, serveur 5181.**
  - Carte de la région II à 1366 px : sans « Attendre » ni tour, Sentinelle nommée sur son coffre.
  - Rencontre : texte du défi. Combat contre la Sentinelle : déploiement limité à 3.
  - Labo QA :
    - troll : objets grisés « Interdit · défi », défi annoncé au déploiement ;
    - duelliste : « Manche 1 / 8 ».
  - Carte à 375 px : badge « Défi » sur la Meute du détour, panneau lisible, sans débordement.
  - Aucune erreur de console.
- **Relecture contracts-guardian de l'implémentation : PASS WITH WARNINGS.** Réserves traitées :
  - verdict affiché au retour sur la carte plutôt qu'avant le dialogue d'après-combat ;
  - tests ajoutés pour le doublon, la défaite, le repli, le combat ordinaire et les trajets ;
  - refus des objets et compte des manches vérifiés en jeu.
- **Non fait.** Le pilote QA de bout en bout (`tools/demo-continuous-production-qa.mjs`) est adapté sans être relancé.

## OD-2026-11-07-G — deux vagues chez les gardiens

- **Source.** Pendant la livraison de F, l'opérateur propose d'intégrer aussi des vagues d'ennemis dans les combats de défi. [Fiche d'arbitrages](https://claude.ai/artifact/38xYq9myvAc8AQjdENQWGe) remplie le 2026-11-07 : quatre choix, tous recommandés, sans note.
- **Statut.** ACTIVE. Les vagues changeaient la formation de combats que le jeu 1.18.0 garde inchangée : l'amendement 1.19.0 a été préparé, relu, puis soumis. L'opérateur a approuvé le texte tel quel le 2026-11-07 (« Texte approuvé ») ; l'amendement est appliqué.

`APPROVED DECISION`, sous réserve de l'amendement.

1. **Où (V1).** Seuls les deux gardiens, la Sentinelle de la vallée et la Garde des ruines, se combattent en vagues. Ce sont des troupes. Le troll, le duelliste et le jeune dragon restent des duels, et la Meute du détour une initiation simple.
2. **Quand (V2).** Dès que la première vague tombe, la seconde entre sur le terrain, sans soin ni résurrection entre les deux.
3. **Combien (V3).** Deux vagues. La seconde reprend la même formation avec les mêmes statistiques : aucun ennemi nouveau, aucun rééquilibrage.
4. **Récompense (V4).** Récompense et prime inchangées.

`CURRENT FACT` Le moteur sait déjà enchaîner des vagues, mais seulement dans le mode escarmouche du labo, où la compagnie est soignée entre deux vagues et où les ennemis gagnent 18 % à chaque vague. En campagne, un combat finit à la première vague. Ce mode du labo ne change pas.

### Amendement 1.19.0

`APPROVED DECISION` Le texte est dans [`GUARDIAN_WAVES_AMENDMENT_1.19.0.patch`](GUARDIAN_WAVES_AMENDMENT_1.19.0.patch), validé par `npm run contracts:validate` sur un arbre d'essai. Il change `COMBAT_AND_VFX`, `TRAVERSAL` (un simple renvoi), `UI_AND_ACCESSIBILITY` et `AUTHORING_AND_QA`, ainsi que le README et le manifeste. L'opérateur l'a approuvé tel quel le 2026-11-07. Il est appliqué mot pour mot aux contrats, puis sa baseline immuable est enregistrée avant tout changement du jeu.

Ce qu'il dit, en clair :

- **Les vagues** (`COMBAT_AND_VFX.md`).
  - Les deux combats de gardien (`poi_elite_valley_sentinel`, `poi_elite_seal_warden`) se jouent en deux vagues, et tous les autres combats en une seule.
  - Le nombre de vagues est un champ facultatif et fixe de la configuration de combat, à un par défaut et jamais sauvegardé.
  - Quand tous les ennemis de la première vague sont vaincus, le combat tactique fait entrer la seconde par un chemin dédié, qui n'est ni la transition du labo ni une fin de combat : pas de carte de résultat, pas de son de victoire ni de fanfare, pas de message de résultat à la campagne, et la rencontre reste ouverte.
  - La seconde vague reprend la même formation avec les mêmes statistiques, sans le renforcement de 18 % du labo. Elle se place sur les cases libres les plus proches de ses cases d'origine, et ses ennemis jouent à partir de l'ordre de la manche suivante. Elle n'utilise que les entrées et les sons existants, sans effet ni son nouveau.
- **Entre les vagues.** Rien n'est rendu ni remis à zéro : pas de soin, pas de résurrection, pas de PA, d'états ni d'objets rendus, et le compte des manches continue. Les faits renvoyés avec l'issue (manches, objets utilisés, héros déployés) couvrent tout le combat.
- **L'issue.** La victoire ne vient qu'à la chute de la seconde vague. Une défaite pendant l'une ou l'autre suit les règles existantes. Le combat ne renvoie son issue qu'une fois.
- **Ce qui ne change pas.** Récompenses, condition de 3 héros, prime, combat unique et décision de RunSystem. Une vague ne donne aucune récompense en plus.
- **La sauvegarde.** Le nombre de vagues est une configuration fixe, et la vague en cours un état passager du combat, jamais sauvegardé. Un combat de gardien repris depuis une sauvegarde recommence donc à sa première vague.
- **L'affichage** (`UI_AND_ACCESSIBILITY.md`). La rencontre et le déploiement annoncent les deux vagues en texte. Pendant le combat, l'objectif montre la vague en cours (« Vague 1 / 2 ») et une ligne de texte annonce l'arrivée de la seconde vague. Le tout reste lisible sans la couleur, à 1366 et 390 px, mouvement réduit ou non.
- **Les tests exigés** (`AUTHORING_AND_QA.md`) :
  - seuls les gardiens ont deux vagues ;
  - la seconde n'entre qu'après la chute de la première, identique et sans rien rendre ;
  - victoire seulement après la seconde, défaite dans l'une ou l'autre selon les règles existantes ;
  - issue renvoyée une fois, avec des faits qui couvrent les deux vagues ;
  - un combat de gardien repris depuis une sauvegarde recommence à sa première vague ;
  - récompenses et primes inchangées ;
  - vagues lisibles avant et pendant le combat.

Relecture contracts-guardian du 2026-11-07, sur une première version : PASS WITH WARNINGS. Les réserves sont reprises dans le texte ci-dessus :

- le passage à la seconde vague ne doit pas emprunter le seul chemin de vagues existant, qui joue une victoire, affiche un résultat et clôt le combat en campagne ; le texte impose un chemin dédié sans résultat ;
- l'emplacement de la seconde vague et le moment où ses ennemis jouent sont précisés, et le compte des manches ne repart pas de zéro ;
- le champ de configuration du nombre de vagues est nommé, et le renforcement du labo écarté ;
- `TRAVERSAL` reçoit un renvoi, puisqu'il désigne l'annexe comme source des formations des gardiens ;
- tests ajoutés : reprise d'un combat à sa première vague, faits couvrant les deux vagues ;
- la relecture signalait aussi que la décision G manquait dans le dossier lié ; elle avait lu la copie d'essai, alors que la décision était déjà consignée dans le dépôt.

Remarque de la relecture pour l'opérateur : deux vagues sans soin, à 3 héros au plus, rendent les gardiens nettement plus durs. Toute retouche d'équilibre après ton jeu demandera une nouvelle décision.

## Ce qui ne change pas

- Les dialogues, les choix, les conséquences et l'ordre des lieux d'histoire.
- Les récompenses actuelles de tous les combats : la prime s'y ajoute.
- Les variantes selon la conduite, qui décident quelle élite fixe apparaît.
- Les 33 lieux, les atlas, l'engagement des chemins (1.17.0) et le voyage rapide (1.16.0).
- La compatibilité des sauvegardes V6.
