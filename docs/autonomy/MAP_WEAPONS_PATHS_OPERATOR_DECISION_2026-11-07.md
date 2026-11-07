# Carte lisible, une compétence par palier et chemins engagés — OD-2026-11-07-A, B et C

- **Date** : 2026-11-07 (America/Toronto).
- **Source** :
  - Retours du playtest PC, message de l'opérateur du 2026-11-07. La carte des POI semble encore confuse par son design. On est perdu dans le choix des armes, alors que les armes T1 et T2 sont censées offrir de nouvelles compétences en combat. Certains chemins choisis sur la carte devraient forcer à suivre la continuité jusqu'à la résolution du problème, avant d'avoir le choix de découvrir d'autres bifurcations.
  - [Fiche d'arbitrages](https://claude.ai/artifact/KiqWJYRhASS4YWwBDngwGS) remplie le 2026-11-07 : huit choix, tous recommandés, et une note sur B1. Les diagnostics et les captures sont sur la fiche ; les captures restent sous `tmp/design-review/shots/` (ignoré).
- **Statut** :
  - OD-2026-11-07-A et OD-2026-11-07-B : ACTIVE, à livrer sur `dev`. L'opérateur les juge en jouant.
  - OD-2026-11-07-C : ACTIVE. Le verrou contredisait des contrats verrouillés : l'amendement 1.17.0 a été préparé, relu, puis soumis. L'opérateur a approuvé le texte tel quel le 2026-11-07 ; l'amendement est appliqué.

## OD-2026-11-07-A — une carte lisible

`APPROVED DECISION` La refonte porte sur la couche de jeu dessinée par-dessus les atlas. Les trois atlas peints restent.

1. **Le parti pris (A1).**
   - Trois états nets remplacent l'estompage commun :
     - à faire et accessible : vif, anneau doré ;
     - déjà fait : sobre, coche verte ;
     - pas encore ouvert : voir le point 2.
   - Une bannière « Prochaine étape » marque le lieu d'histoire suivant.
   - Les liaisons sont plus épaisses et cernées de sombre pour se lire sur la peinture ; les liaisons verrouillées passent en pointillé très discret.
   - La menace mobile a son propre symbole et sa propre couleur ; ♜ ne désigne plus qu'elle ou que les combats d'élite, jamais les deux.
   - Une légende courte, juste et repliable reste visible.
   - Le pion se pose sur son lieu, avec une seule marque de position.
   - Le panneau du bas dit en clair le type, le risque et la récompense du lieu, à la place du vocabulaire interne (« Alternative exclusive »).
2. **Les lieux pas encore ouverts (A2).** Un petit point discret, sans nom, relié en pointillé. Le nom apparaît au survol, au focus clavier ou à la sélection.
3. **Les noms (A3).** Seuls les noms utiles restent affichés en permanence : la position, les lieux accessibles, la prochaine étape et la sélection. Les autres apparaissent au survol, au focus ou à la sélection.

Limites : présentation seule. Les sélecteurs de RunSystem, les règles de déplacement et la sauvegarde ne changent pas. Les contrats `WORLD_AND_CHARACTERS.md` et `UI_AND_ACCESSIBILITY.md` restent tenus : texte en plus de la couleur, cibles d'au moins 44 px, clavier et manette, chemins visibles.

## OD-2026-11-07-B — une compétence par palier

`APPROVED DECISION`

1. **La règle (B1).**
   - Le palier de l'arme portée ouvre une compétence de plus à chaque niveau :
     - T0 : la compétence à 2 PA, offerte dès le départ ;
     - T1 : la compétence à 3 PA ;
     - T2 : la compétence à 4 PA.
   - L'ultime à 5 PA reste fermé (`CAMPAIGN_AND_STATE.md`).
   - Cette règle remplace la phrase d'OD-2026-11-05-C « Une arme T1 ne débloque donc aucune compétence » et celle d'OD-2026-11-05-D « Une arme T2 débloque le deuxième sort du héros, à 3 PA ». Le reste de ces deux décisions est inchangé : recettes, prix, échoppe.
   - L'opérateur juge l'équilibre en jouant ; prix et combats se retouchent ensuite à sa demande.
2. **Tout nommer, partout (B2).**
   - L'échoppe, la forge, le détail d'un objet et la case d'arme nomment la compétence ouverte pour le héros concerné, avec le palier visible.
   - Une ligne courte explique les paliers.
   - Les textes faux de la forge sont corrigés : Lame du Lion, Arc du Vent, Sceau du Sage, Anneau de Force, et les armes T2 qui ne nommaient pas leur compétence.
   - En combat, les compétences encore fermées apparaissent grisées, avec le palier qui les ouvre.
3. **Jamais plus faible (B3).**
   - Un remplacement de compétence par un objet ne rend jamais la compétence plus faible.
   - Le Tir Calibré de l'Arc long est relevé au moins au niveau du Tir Précis qu'il remplace : puissance, critique, aveuglement.
4. **Note de l'opérateur sur B1.** « Nous ne parvenons pas à consulter parfaitement tous les détails de l'unité sélectionnée, par exemple ses compétences lock/unlock, via la manette. » Ce défaut est corrigé avec B2 : tout le détail d'une unité, compétences fermées comprises, se consulte à la manette.
5. **En passant.** Le bouton « SHOP » du refuge, resté en anglais, devient « Échoppe ».

## Livraison de A et B

`CURRENT FACT` Livrées le 2026-11-07 sur `dev` (baseline des contrats inchangée, `2b2b4082`). Voir [le rapport](../reports/playtest-fixes-2026-11-07.md).

- **Carte (A)** :
  - quatre états lisibles d'un coup d'œil (`poiMarkerState`, `src/ui/PoiMapView.ts`) : à faire et à portée, à faire plus loin, fait, pas encore ouvert ;
  - bannière « Prochaine étape » sur chaque branche d'un choix au plus court chemin (`nextStorySteps`) ;
  - noms permanents pour la position, les lieux à portée et la prochaine étape seulement ;
  - routes cernées de sombre ;
  - symbole ✠ pour l'élite fixe, menace mobile ♜ en rouge ;
  - légende dans la barre de l'atlas, repliée sur un écran étroit ;
  - pion debout sur son lieu ;
  - panneau du bas en clair, avec type, chemin, état, risque et gain.
- **Armes (B)** :
  - un palier, une compétence (`getMaxUnlockedSkillAp`, `src/game/catalog.ts`) ;
  - compétences nommées (`describeItemSkillEffects`, `getWeaponOpenedSkill`) sur la fiche, la case d'arme, l'inventaire, l'échoppe, la forge et le détail ;
  - compétences fermées grisées dans le menu du combat avec leur palier (`lockedSkills`, affichage seul) ;
  - Tir Calibré relevé ;
  - entrées de la fiche atteignables à la manette, stick droit pour faire défiler ;
  - « Échoppe » à la place de « SHOP ».

## OD-2026-11-07-C — un chemin choisi s'achève avant le reste

`APPROVED DECISION`, sous réserve de l'amendement.

1. **Où commence et où finit l'engagement (C1).** Il commence dès que la compagnie choisit une branche de bifurcation. Il finit au lieu qui résout le chapitre :

   | Bifurcation | Résolution |
   | --- | --- |
   | « Rencontre sur la route » ou « Piste contestée » | Refuge du Lion |
   | « Vieux sanctuaire » ou « Barrage renforcé » | Bois-Clair assiégé |
   | « Nid du jeune dragon » ou « Ruines infestées » | Signes des Ombres |

   La carte annonce l'engagement (par exemple « Engagé : jusqu'à Bois-Clair assiégé »). Une fois le chapitre résolu, toute la carte se rouvre.
2. **Ce qui reste permis (C2).**
   - Seule la suite du chemin est ouverte.
   - La compagnie, la sauvegarde, l'attente et le choix « Combat ou repli » face à une menace restent disponibles.
   - Le retour en arrière, le voyage vers un lieu résolu et les lieux annexes sont fermés pendant l'engagement.
3. **Contrats.**
   - Ce verrou contredit :
     - `TRAVERSAL.md` : voyage vers un lieu résolu, déplacement dans les deux sens, lieux facultatifs revisitables, critère d'acceptation du retour en arrière ;
     - `CAMPAIGN_AND_STATE.md` : déplacement connecté dans les deux sens, détours et retours en arrière du Lot E, lieux facultatifs revisitables ;
     - `AUTHORING_AND_QA.md` : les tests du retour en arrière et des visites.
   - La Constitution ne change pas. Sa ligne sur le retour en arrière dit que la campagne et RunSystem le valident ; elle ne garantit pas un retour en arrière libre.
   - L'engagement se déduit de faits déjà sauvegardés (branches choisies, lieux résolus) : aucun champ de sauvegarde nouveau.

## Amendement 1.17.0

`APPROVED DECISION` Le texte est dans [`BRANCH_COMMITMENT_AMENDMENT_1.17.0.patch`](BRANCH_COMMITMENT_AMENDMENT_1.17.0.patch), validé par `npm run contracts:validate`. L'opérateur l'a approuvé tel quel le 2026-11-07 (« Texte approuvé »). Il est appliqué mot pour mot aux contrats, puis sa baseline immuable est enregistrée avant tout changement du jeu.

Ce qu'il dit, en clair :

- **Le début.** La branche est choisie quand les faits sauvegardés le disent : la branche enregistrée, un lieu de branche résolu, ou, dans une ancienne sauvegarde, une rencontre en cours sur la bifurcation. Arriver sur une bifurcation non résolue engage donc la compagnie.
- **La cible.** D'abord le lieu de la branche choisie tant qu'il n'est pas résolu, puis le lieu de résolution. RunSystem n'accepte que le pas suivant sur le plus court chemin vers la cible, même si la compagnie se tient hors de ce chemin, et l'activation du lieu où elle se trouve, services d'un refuge compris.
- **Le reste.** Retour en arrière, voyage, contournement et autres lieux facultatifs attendent la résolution. La compagnie, la sauvegarde, l'attente et Combat ou repli restent. Un repli de sécurité du Lot E peut quitter le chemin : l'engagement reprend d'où se trouve la compagnie.
- **La carte.** Elle annonce l'engagement et sa cible en texte, lisible sans la couleur, accessible au clavier et à la manette.
- **La fin.** Une fois le lieu de résolution résolu, selon la règle qui débloque déjà la suite, toutes les autres règles s'appliquent à nouveau.
- **Les tests exigés.** Seul le pas suivant est accepté ; l'engagement reprend après un repli et depuis une ancienne sauvegarde ; il se lève à la résolution.

Relecture contracts-guardian du 2026-11-07, sur une première version : PASS WITH WARNINGS. Toutes les réserves sont reprises dans le texte ci-dessus :

- phrases verrouillées oubliées : `TRAVERSAL.md` (retraite V2, acceptation, branches parallèles), `CAMPAIGN_AND_STATE.md` (Lot E, survie des visites), `AUTHORING_AND_QA.md` ;
- cas de blocage : une bifurcation non résolue n'offrait aucun chemin vers le lieu de résolution, encore verrouillé. La cible passe d'abord par la branche choisie ;
- activation du lieu courant, services du refuge compris ;
- reprise après un repli ;
- lecture de la Constitution, consignée.

## Ce qui ne change pas

- Le dialogue, les choix, les conséquences, les récompenses et l'ordre des lieux d'histoire.
- Les menaces mobiles, leurs zones et le choix « Combat ou repli ».
- La compatibilité des sauvegardes V6.
