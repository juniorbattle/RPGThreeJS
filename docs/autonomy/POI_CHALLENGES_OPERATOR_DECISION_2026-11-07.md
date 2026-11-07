# Défis et gardiens fixes, attente retirée — OD-2026-11-07-F

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

## Ce qui ne change pas

- Les dialogues, les choix, les conséquences et l'ordre des lieux d'histoire.
- Les récompenses actuelles de tous les combats : la prime s'y ajoute.
- Les variantes selon la conduite, qui décident quelle élite fixe apparaît.
- Les 33 lieux, les atlas, l'engagement des chemins (1.17.0) et le voyage rapide (1.16.0).
- La compatibilité des sauvegardes V6.
